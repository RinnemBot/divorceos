import type { VercelRequest, VercelResponse } from '@vercel/node';
import { enforceBrowserOrigin, enforceSensitiveApiEnabled } from '../../../_security';
import { getFilingProvider } from '@/services/filing/providers';
import { parseJsonBody } from '@/services/filing/http';
import { buildSubmission, ensureFilingTables, getFilingMatter, upsertFilingSubmission } from '@/services/filing/supabase';
import type { FilingProviderKey, SubmitFilingInput } from '@/types/filing';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!enforceSensitiveApiEnabled(res)) return;
  if (!enforceBrowserOrigin(req, res)) return;

  const matterId = String(req.query.matterId || '').trim();
  const body = parseJsonBody<SubmitFilingInput & { provider?: FilingProviderKey }>(req);

  if (!matterId) {
    return res.status(400).json({ error: 'matterId is required' });
  }

  if (!body?.filingType || !Array.isArray(body.documents)) {
    return res.status(400).json({ error: 'filingType and documents are required' });
  }

  await ensureFilingTables();

  const matter = await getFilingMatter(matterId);
  if (!matter) {
    return res.status(404).json({ error: 'Matter not found' });
  }

  const providerKey = body.provider ?? matter.provider ?? 'manual';
  const provider = getFilingProvider(providerKey);
  const result = await provider.submitFiling({
    ...body,
    internalMatterId: matterId,
  });

  const submission = await upsertFilingSubmission(
    buildSubmission({
      id: `${matterId}:${body.filingType}:${Date.now()}`,
      matterId,
      provider: providerKey === 'none' ? 'manual' : providerKey,
      submissionType: body.filingType,
      providerSubmissionId: result.providerSubmissionId,
      status: result.status,
      submittedAt: result.submittedAt,
      rawProviderPayload: result.raw,
    })
  );

  return res.status(200).json({
    matter,
    provider: providerKey,
    submission,
    result,
  });
}
