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

function parseJsonBody<T>(req: VercelRequest): T {
  if (req.body && typeof req.body === 'object') return req.body as T;
  if (typeof req.body === 'string' && req.body.trim()) return JSON.parse(req.body) as T;
  return {} as T;
}

function getQueryString(value: string | string[] | undefined) {
  return String(Array.isArray(value) ? value[0] || '' : value || '').trim();
}

function safeInlineFileName(storagePath: string) {
  const name = storagePath.split('/').pop() || 'document.pdf';
  return name.replace(/["\\\r\n]/g, '_');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'DELETE') {
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

  if (req.method === 'GET' && getQueryString(req.query.preview) === '1') {
    const requestedPath = getQueryString(req.query.documentId || req.query.storagePath);
    const userPrefix = `${userId}/`;

    if (!requestedPath || !requestedPath.startsWith(userPrefix) || requestedPath.includes('..')) {
      return res.status(400).json({ error: 'Invalid document id' });
    }

    try {
      await ensureVaultBucketExists();
      const { data, error } = await supabaseServerClient.storage
        .from(SUPABASE_STORAGE_BUCKET)
        .download(requestedPath);

      if (error || !data) {
        console.error('Supabase preview download error', error);
        return res.status(404).json({ error: 'Document not found' });
      }

      const buffer = Buffer.from(await data.arrayBuffer());
      res.setHeader('Content-Type', data.type || 'application/pdf');
      res.setHeader('Content-Length', String(buffer.byteLength));
      res.setHeader('Content-Disposition', `inline; filename="${safeInlineFileName(requestedPath)}"`);
      res.setHeader('Cache-Control', 'private, no-store');
      res.setHeader('Content-Security-Policy', "default-src 'self'; frame-ancestors 'self'; object-src 'none'; base-uri 'self'");
      res.setHeader('X-Frame-Options', 'SAMEORIGIN');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      return res.status(200).send(buffer);
    } catch (error) {
      console.error('Vault preview error', error);
      return res.status(500).json({ error: 'Unable to preview document' });
    }
  }

  if (req.method === 'DELETE') {
    const body = parseJsonBody<{ documentId?: string; storagePath?: string }>(req);
    const requestedPath = String(body.documentId || body.storagePath || '').trim();
    const userPrefix = `${userId}/`;

    if (!requestedPath || !requestedPath.startsWith(userPrefix) || requestedPath.includes('..')) {
      return res.status(400).json({ error: 'Invalid document id' });
    }

    const { error } = await supabaseServerClient.storage
      .from(SUPABASE_STORAGE_BUCKET)
      .remove([requestedPath]);

    if (error) {
      console.error('Supabase delete error', error);
      return res.status(500).json({ error: `Failed to delete document: ${error.message}` });
    }

    return res.status(200).json({ success: true, deletedId: requestedPath });
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
