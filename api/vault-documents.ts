import type { VercelRequest, VercelResponse } from '@vercel/node';
import { enforceBrowserOrigin, enforceSensitiveApiEnabled } from './_security.js';
import { requireAuthenticatedUser } from './_auth.js';
import {
  SIGNED_URL_TTL_SECONDS,
  SUPABASE_STORAGE_BUCKET,
  createVaultSignedUrl,
  ensureVaultBucketExists,
  supabaseServerClient,
} from './_vault.js';

const MAX_RESULTS = 100;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!enforceSensitiveApiEnabled(res)) return;
  if (!enforceBrowserOrigin(req, res)) return;

  const currentUser = await requireAuthenticatedUser(req, res);
  if (!currentUser) return;

  if (!supabaseServerClient) {
    return res.status(500).json({ error: 'Supabase environment variables are not configured' });
  }

  const userId = currentUser.id;

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
      const signedUrl = await createVaultSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS).catch((signedError) => {
        console.error('Signed URL error', signedError);
        return null;
      });

      return {
        id: storagePath,
        name: item.name,
        uploadedAt: item.created_at || item.updated_at || new Date().toISOString(),
        size: item.metadata?.size ?? 0,
        downloadUrl: signedUrl,
      };
    })
  );

  return res.status(200).json({ documents });
}
