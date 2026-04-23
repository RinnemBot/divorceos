import type { VercelRequest, VercelResponse } from '@vercel/node';
import { enforceBrowserOrigin, enforceSensitiveApiEnabled } from './_security.js';
import { requireAuthenticatedUser } from './_auth.js';
import { generateOfficialStarterPacketPdf } from './_starter-packet.js';
import { sanitizeVaultFileName, uploadBufferToVault } from './_vault.js';

interface StarterPacketDocumentRequest {
  workspace?: unknown;
}

function parseBody(req: VercelRequest): StarterPacketDocumentRequest {
  if (!req.body) return {};
  if (typeof req.body === 'object') return req.body as StarterPacketDocumentRequest;
  try {
    return JSON.parse(req.body) as StarterPacketDocumentRequest;
  } catch {
    return {};
  }
}

function readStringField(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function buildFileName(workspace: unknown) {
  const petitionerName = readStringField((workspace as { petitionerName?: { value?: unknown } } | undefined)?.petitionerName?.value);
  const base = petitionerName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'starter-packet';
  return sanitizeVaultFileName(`${base}-fl-100-fl-110-prefilled.pdf`);
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
  if (!body.workspace || typeof body.workspace !== 'object') {
    return res.status(400).json({ error: 'workspace is required' });
  }

  try {
    const pdfBytes = await generateOfficialStarterPacketPdf(body.workspace as Parameters<typeof generateOfficialStarterPacketPdf>[0]);
    const document = await uploadBufferToVault({
      userId: currentUser.id,
      fileName: buildFileName(body.workspace),
      buffer: pdfBytes,
      contentType: 'application/pdf',
    });

    return res.status(200).json({ document });
  } catch (error) {
    console.error('Starter packet generation error', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to generate starter packet' });
  }
}
