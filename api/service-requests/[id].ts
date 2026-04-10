import type { VercelRequest, VercelResponse } from '@vercel/node';
import { enforceBrowserOrigin, enforceSensitiveApiEnabled } from '../_security';
import { getFilingProvider } from '@/services/filing/providers';
import { ensureFilingTables, getServiceRequest } from '@/services/filing/supabase';
import type { FilingProviderKey } from '@/types/filing';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!enforceSensitiveApiEnabled(res)) return;
  if (!enforceBrowserOrigin(req, res)) return;

  const id = String(req.query.id || '').trim();
  const matterId = String(req.query.matterId || '').trim();
  const providerKey = String(req.query.provider || 'manual') as FilingProviderKey;

  if (!id || !matterId) {
    return res.status(400).json({ error: 'id and matterId are required' });
  }

  await ensureFilingTables();

  const stored = await getServiceRequest(id);
  if (!stored) {
    return res.status(404).json({ error: 'Service request not found' });
  }

  const provider = getFilingProvider((stored.provider || providerKey) as FilingProviderKey);
  const result = await provider.getServiceStatus?.({
    internalMatterId: matterId,
    providerServiceId: stored.providerServiceId || id,
  });

  if (!result) {
    return res.status(400).json({ error: `Provider ${providerKey} does not support service status` });
  }

  return res.status(200).json({
    serviceRequest: stored,
    status: result,
  });
}
