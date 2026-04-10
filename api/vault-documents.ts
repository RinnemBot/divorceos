import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { enforceBrowserOrigin, enforceSensitiveApiEnabled } from './_security.js';

const SIGNED_URL_TTL_SECONDS = 60 * 5; // 5 minutes
const MAX_RESULTS = 100;

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'divorceos-vault';

const supabaseServerClient: SupabaseClient | null =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: {
          persistSession: false,
        },
      })
    : null;

let bucketInitialization: Promise<void> | null = null;

async function ensureVaultBucketExists(): Promise<void> {
  if (!supabaseServerClient) {
    throw new Error('Supabase client is not configured');
  }

  if (!bucketInitialization) {
    bucketInitialization = (async () => {
      const { error: getError } = await supabaseServerClient.storage.getBucket(SUPABASE_STORAGE_BUCKET);

      if (getError) {
        if (getError.message?.toLowerCase().includes('not found')) {
          const { error: createError } = await supabaseServerClient.storage.createBucket(
            SUPABASE_STORAGE_BUCKET,
            { public: false }
          );

          if (createError && !createError.message?.toLowerCase().includes('already exists')) {
            throw createError;
          }
        } else if (!getError.message?.toLowerCase().includes('already exists')) {
          throw getError;
        }
      }
    })().catch((error) => {
      bucketInitialization = null;
      throw error;
    });
  }

  return bucketInitialization;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!enforceSensitiveApiEnabled(res)) return;
  if (!enforceBrowserOrigin(req, res)) return;

  if (!supabaseServerClient) {
    return res.status(500).json({ error: 'Supabase environment variables are not configured' });
  }

  const userId = (req.query.userId as string | undefined)?.trim();
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    await ensureVaultBucketExists();
  } catch (error) {
    console.error('Bucket initialization failed', error);
    return res.status(500).json({ error: 'Unable to access secure storage bucket' });
  }

  const { data, error } = await supabaseServerClient.storage
    .from(SUPABASE_STORAGE_BUCKET)
    .list(userId, {
      limit: MAX_RESULTS,
      sortBy: { column: 'created_at', order: 'desc' },
    });

  if (error) {
    console.error('Supabase list error', error);
    return res.status(500).json({ error: 'Failed to load documents' });
  }

  const documents = await Promise.all(
    (data ?? []).map(async (item) => {
      const storagePath = `${userId}/${item.name}`;
      const { data: signedData, error: signedError } = await supabaseServerClient.storage
        .from(SUPABASE_STORAGE_BUCKET)
        .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);

      if (signedError) {
        console.error('Signed URL error', signedError);
      }

      return {
        id: storagePath,
        name: item.name,
        uploadedAt: item.created_at || item.updated_at || new Date().toISOString(),
        size: item.metadata?.size ?? 0,
        downloadUrl: signedData?.signedUrl ?? null,
      };
    })
  );

  return res.status(200).json({ documents });
}
