import type { VercelRequest, VercelResponse } from '@vercel/node';
import formidable, { type Fields, type Files } from 'formidable';
import { promises as fs } from 'fs';
import { ensureVaultBucketExists, SUPABASE_STORAGE_BUCKET, supabaseServerClient } from './lib/supabase';

export const config = {
  api: {
    bodyParser: false,
  },
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = ['application/pdf'];

function parseFields(fields: Fields): { userId: string } {
  const rawUserId = fields.userId;
  const value = Array.isArray(rawUserId) ? rawUserId[0] : rawUserId;
  const userId = typeof value === 'string' ? value.trim() : '';
  if (!userId) {
    throw new Error('Missing userId');
  }
  return { userId };
}

function sanitizeFileName(name: string | undefined): string {
  const fallback = 'document.pdf';
  if (!name) return fallback;
  const trimmed = name.trim();
  if (!trimmed) return fallback;
  const slug = trimmed.replace(/[^a-zA-Z0-9._-]/g, '_');
  return slug || fallback;
}

function formatSize(bytes: number | undefined): number {
  if (!bytes || Number.isNaN(bytes)) return 0;
  return Math.max(0, bytes);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!supabaseServerClient) {
    return res.status(500).json({ error: 'Supabase environment variables are not configured' });
  }

  try {
    await ensureVaultBucketExists();
  } catch (error) {
    console.error('Bucket initialization failed', error);
    return res.status(500).json({ error: 'Unable to prepare secure storage bucket' });
  }

  const formParser = formidable({
    multiples: false,
    maxFileSize: MAX_FILE_SIZE,
    keepExtensions: false,
  });

  formParser.parse(req, async (err: Error | null, fields: Fields, files: Files) => {
    if (err) {
      console.error('Upload parse error', err);
      return res.status(400).json({ error: err.message || 'Invalid upload payload' });
    }

    try {
      const { userId } = parseFields(fields);
      const incomingFile = files.file;
      const file = Array.isArray(incomingFile) ? incomingFile[0] : incomingFile;

      if (!file) {
        return res.status(400).json({ error: 'No file provided' });
      }

      if (file.mimetype && !ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        return res.status(400).json({ error: 'Only PDF uploads are supported right now' });
      }

      const fileSize = formatSize(file.size);
      if (fileSize === 0) {
        return res.status(400).json({ error: 'Uploaded file is empty' });
      }

      const sanitizedFileName = sanitizeFileName(file.originalFilename);
      const storagePath = `${userId}/${Date.now()}-${sanitizedFileName}`;

      const buffer = await fs.readFile(file.filepath);

      const { error: uploadError } = await supabaseServerClient
        .storage
        .from(SUPABASE_STORAGE_BUCKET)
        .upload(storagePath, buffer, {
          contentType: file.mimetype || 'application/pdf',
          upsert: false,
        });

      if (uploadError) {
        console.error('Supabase upload error', uploadError);
        return res.status(500).json({ error: 'Failed to store file securely' });
      }

      const { data: signedData, error: signedError } = await supabaseServerClient
        .storage
        .from(SUPABASE_STORAGE_BUCKET)
        .createSignedUrl(storagePath, 60 * 10);

      if (signedError) {
        console.error('Signed URL error', signedError);
      }

      return res.status(200).json({
        document: {
          id: storagePath,
          name: sanitizedFileName,
          uploadedAt: new Date().toISOString(),
          size: fileSize,
          downloadUrl: signedData?.signedUrl ?? null,
        },
      });
    } catch (error) {
      console.error('Vault upload error', error);
      return res.status(500).json({ error: error instanceof Error ? error.message : 'Upload failed' });
    } finally {
      const uploadedFile = files.file;
      const file = Array.isArray(uploadedFile) ? uploadedFile?.[0] : uploadedFile;
      if (file?.filepath) {
        await fs.unlink(file.filepath).catch(() => undefined);
      }
    }
  });
}
