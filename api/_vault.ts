import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export const SIGNED_URL_TTL_SECONDS = 60 * 5;
export const SUPABASE_STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'divorceos-vault';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseServerClient: SupabaseClient | null =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false },
      })
    : null;

let bucketInitialization: Promise<void> | null = null;

export async function ensureVaultBucketExists(): Promise<void> {
  if (!supabaseServerClient) {
    throw new Error('Supabase client is not configured');
  }

  if (!bucketInitialization) {
    bucketInitialization = (async () => {
      const { error: getError } = await supabaseServerClient.storage.getBucket(SUPABASE_STORAGE_BUCKET);

      if (getError) {
        if (getError.message?.toLowerCase().includes('not found')) {
          const { error: createError } = await supabaseServerClient.storage.createBucket(SUPABASE_STORAGE_BUCKET, {
            public: false,
          });

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

export function sanitizeVaultFileName(name: string | undefined, fallback = 'document.pdf'): string {
  if (!name) return fallback;
  const trimmed = name.trim();
  if (!trimmed) return fallback;
  const slug = trimmed.replace(/[^a-zA-Z0-9._-]/g, '_');
  return slug || fallback;
}

export function buildVaultStoragePath(userId: string, fileName: string) {
  return `${userId}/${Date.now()}-${sanitizeVaultFileName(fileName)}`;
}

export async function createVaultSignedUrl(storagePath: string, expiresIn = SIGNED_URL_TTL_SECONDS) {
  if (!supabaseServerClient) {
    throw new Error('Supabase client is not configured');
  }

  const { data, error } = await supabaseServerClient.storage
    .from(SUPABASE_STORAGE_BUCKET)
    .createSignedUrl(storagePath, expiresIn);

  if (error) {
    throw error;
  }

  return data?.signedUrl ?? null;
}

export async function uploadBufferToVault(params: {
  userId: string;
  fileName: string;
  buffer: Buffer | Uint8Array;
  contentType?: string;
}) {
  if (!supabaseServerClient) {
    throw new Error('Supabase environment variables are not configured');
  }

  await ensureVaultBucketExists();

  const storagePath = buildVaultStoragePath(params.userId, params.fileName);
  const contentType = params.contentType || 'application/pdf';
  const payload = params.buffer instanceof Uint8Array ? params.buffer : new Uint8Array(params.buffer);

  const { error } = await supabaseServerClient.storage
    .from(SUPABASE_STORAGE_BUCKET)
    .upload(storagePath, payload, {
      contentType,
      upsert: false,
    });

  if (error) {
    throw error;
  }

  const downloadUrl = await createVaultSignedUrl(storagePath, 60 * 10).catch((signedError) => {
    console.error('Signed URL error', signedError);
    return null;
  });

  return {
    id: storagePath,
    name: storagePath.split('/').pop() || params.fileName,
    uploadedAt: new Date().toISOString(),
    size: payload.byteLength,
    downloadUrl,
    storagePath,
  };
}
