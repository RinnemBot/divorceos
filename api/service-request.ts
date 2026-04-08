import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getFilingProvider } from '@/services/filing/providers';
import { parseJsonBody } from '@/services/filing/http';
import { buildServiceRequest, ensureFilingTables, getFilingMatter, upsertServiceRequest } from '@/services/filing/supabase';
import type { FilingProviderKey, OrderServiceInput } from '@/types/filing';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = parseJsonBody<OrderServiceInput & { provider?: FilingProviderKey }>(req);
  if (!body?.internalMatterId || !body.recipientName || !body.address || !Array.isArray(body.documents)) {
    return res.status(400).json({ error: 'internalMatterId, recipientName, address, and documents are required' });
  }

  await ensureFilingTables();

  const matter = await getFilingMatter(body.internalMatterId);
  if (!matter) {
    return res.status(404).json({ error: 'Matter not found' });
  }

  const providerKey = body.provider ?? matter.provider ?? 'manual';
  const provider = getFilingProvider(providerKey);
  const result = await provider.orderService?.(body);

  if (!result) {
    return res.status(400).json({ error: `Provider ${providerKey} does not support service requests` });
  }

  const serviceRequest = await upsertServiceRequest(
    buildServiceRequest({
      id: `${body.internalMatterId}:service:${Date.now()}`,
      matterId: body.internalMatterId,
      provider: providerKey === 'none' ? 'manual' : providerKey,
      providerServiceId: result.providerServiceId,
      recipientName: body.recipientName,
      address: body.address,
      status: result.status,
      dueDate: body.dueDate,
    })
  );

  return res.status(200).json({
    matter,
    provider: providerKey,
    serviceRequest,
    result,
  });
}
