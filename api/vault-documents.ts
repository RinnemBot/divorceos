import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ensureVaultBucketExists, SUPABASE_STORAGE_BUCKET, supabaseServerClient } from './_lib/supabase';

const SIGNED_URL_TTL_SECONDS = 60 * 5; // 5 minutes
const MAX_RESULTS = 100;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
