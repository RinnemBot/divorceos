import type { VercelRequest, VercelResponse } from '@vercel/node';
import { enforceBrowserOrigin, enforceSensitiveApiEnabled } from './_security.js';
import { requireAuthenticatedUser } from './_auth.js';
import { generateMariaPdf, type MariaDocumentSection } from './_documents.js';
import { generateOfficialStarterPacketPdf } from './_starter-packet.js';
import { sanitizeVaultFileName, uploadBufferToVault } from './_vault.js';

interface MariaDocumentRequest {
  kind?: string;
  title?: string;
  subtitle?: string;
  fileName?: string;
  sections?: MariaDocumentSection[];
  footerNote?: string;
  workspace?: unknown;
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

  const sections: MariaDocumentSection[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== 'object') continue;
    const heading = typeof (entry as { heading?: unknown }).heading === 'string' ? (entry as { heading?: string }).heading?.trim() : undefined;
    const body = typeof (entry as { body?: unknown }).body === 'string' ? (entry as { body?: string }).body?.trim() : '';
    if (!body) continue;
    sections.push({ heading, body });
  }

  return sections;
}

function readStringField(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function buildStarterPacketFileName(body: MariaDocumentRequest) {
  if (typeof body.fileName === 'string' && body.fileName.trim()) {
    return sanitizeVaultFileName(body.fileName.trim().endsWith('.pdf') ? body.fileName.trim() : `${body.fileName.trim()}.pdf`);
  }

  const petitionerName = readStringField((body.workspace as { petitionerName?: { value?: unknown } } | undefined)?.petitionerName?.value);
  const base = petitionerName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'starter-packet';
  return sanitizeVaultFileName(`${base}-starter-packet-prefilled.pdf`);
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

  try {
    if (body.kind === 'starter_packet' || (body.workspace && typeof body.workspace === 'object')) {
      if (!body.workspace || typeof body.workspace !== 'object') {
        return res.status(400).json({ error: 'workspace is required' });
      }

      const pdfBytes = await generateOfficialStarterPacketPdf(body.workspace as Parameters<typeof generateOfficialStarterPacketPdf>[0]);
      const document = await uploadBufferToVault({
        userId: currentUser.id,
        fileName: buildStarterPacketFileName(body),
        buffer: pdfBytes,
        contentType: 'application/pdf',
      });

      return res.status(200).json({ document });
    }

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
