import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const SUPABASE_STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'divorceos-vault';

export const supabaseServerClient: SupabaseClient | null =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: {
          persistSession: false,
        },
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
