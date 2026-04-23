import type { VercelRequest, VercelResponse } from '@vercel/node';
import { enforceBrowserOrigin, enforceSensitiveApiEnabled } from './_security.js';
import { ensureFilingTables, getOpsSnapshot } from '../src/services/filing/supabase.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!enforceSensitiveApiEnabled(res)) return;
  if (!enforceBrowserOrigin(req, res)) return;

  const matterId = String(req.query.matterId || '').trim();
  if (!matterId) {
    return res.status(400).json({ error: 'matterId is required' });
  }

  await ensureFilingTables();
  const snapshot = await getOpsSnapshot(matterId);

  if (!snapshot.matter) {
    return res.status(404).json({ error: 'Matter not found' });
  }

  return res.status(200).json(snapshot);
}
