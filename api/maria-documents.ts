import type { VercelRequest, VercelResponse } from '@vercel/node';
import { enforceBrowserOrigin, enforceSensitiveApiEnabled } from './_security.js';
import { requireAuthenticatedUser } from './_auth.js';
import { generateMariaPdf, type MariaDocumentSection } from './_documents.js';
import { sanitizeVaultFileName, uploadBufferToVault } from './_vault.js';

interface MariaDocumentRequest {
  title?: string;
  subtitle?: string;
  fileName?: string;
  sections?: MariaDocumentSection[];
  footerNote?: string;
}

function parseBody(req: VercelRequest): MariaDocumentRequest {
  if (!req.body) return {};
  if (typeof req.body === 'object') return req.body as MariaDocumentRequest;
  try {
    return JSON.parse(req.body) as MariaDocumentRequest;
  } catch {
    return {};
  }
}

function normalizeSections(value: unknown): MariaDocumentSection[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null;
      const heading = typeof (entry as { heading?: unknown }).heading === 'string' ? (entry as { heading?: string }).heading?.trim() : undefined;
      const body = typeof (entry as { body?: unknown }).body === 'string' ? (entry as { body?: string }).body?.trim() : '';
      if (!body) return null;
      return { heading, body };
    })
    .filter((entry): entry is MariaDocumentSection => Boolean(entry));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!enforceSensitiveApiEnabled(res)) return;
  if (!enforceBrowserOrigin(req, res)) return;

  const currentUser = await requireAuthenticatedUser(req, res);
  if (!currentUser) return;

  const body = parseBody(req);
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const subtitle = typeof body.subtitle === 'string' ? body.subtitle.trim() : undefined;
  const footerNote = typeof body.footerNote === 'string' ? body.footerNote.trim() : undefined;
  const sections = normalizeSections(body.sections);

  if (!title) {
    return res.status(400).json({ error: 'title is required' });
  }

  if (!sections.length) {
    return res.status(400).json({ error: 'At least one non-empty section is required' });
  }

  try {
    const pdfBytes = await generateMariaPdf({
      title,
      subtitle,
      sections,
      footerNote,
    });

    const rawName = typeof body.fileName === 'string' && body.fileName.trim()
      ? body.fileName.trim()
      : `${title.toLowerCase().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'maria-document'}.pdf`;

    const fileName = sanitizeVaultFileName(rawName.endsWith('.pdf') ? rawName : `${rawName}.pdf`);

    const document = await uploadBufferToVault({
      userId: currentUser.id,
      fileName,
      buffer: pdfBytes,
      contentType: 'application/pdf',
    });

    return res.status(200).json({ document });
  } catch (error) {
    console.error('Maria document generation error', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to generate document' });
  }
}
