import type { VercelRequest, VercelResponse } from '@vercel/node';
import formidable, { type Fields, type Files } from 'formidable';
import { promises as fs } from 'fs';
import { enforceBrowserOrigin, enforceSensitiveApiEnabled } from './_security.js';
import { requireAuthenticatedUser } from './_auth.js';
import { ensureVaultBucketExists, sanitizeVaultFileName, uploadBufferToVault, supabaseServerClient } from './_vault.js';

export const config = {
  api: {
    bodyParser: false,
  },
};


const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = ['application/pdf'];

function formatSize(bytes: number | undefined): number {
  if (!bytes || Number.isNaN(bytes)) return 0;
  return Math.max(0, bytes);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!enforceSensitiveApiEnabled(res)) return;
  if (!enforceBrowserOrigin(req, res)) return;

  const currentUser = await requireAuthenticatedUser(req, res);
  if (!currentUser) return;

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

  formParser.parse(req, async (err: Error | null, _fields: Fields, files: Files) => {
    if (err) {
      console.error('Upload parse error', err);
      return res.status(400).json({ error: err.message || 'Invalid upload payload' });
    }

    try {
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

      const sanitizedFileName = sanitizeVaultFileName(file.originalFilename);
      const buffer = await fs.readFile(file.filepath);

      const document = await uploadBufferToVault({
        userId: currentUser.id,
        fileName: sanitizedFileName,
        buffer,
        contentType: file.mimetype || 'application/pdf',
      });

      return res.status(200).json({ document });
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
