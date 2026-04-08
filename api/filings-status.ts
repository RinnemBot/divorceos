import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getFilingProvider } from '@/services/filing/providers';
import { ensureFilingTables, getFilingMatter, getLatestSubmissionForMatter, listDocumentsForMatter } from '@/services/filing/supabase';
import type { FilingProviderKey } from '@/types/filing';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const matterId = String(req.query.matterId || '').trim();
  const providerKey = String(req.query.provider || 'manual') as FilingProviderKey;
  const submissionId = String(req.query.submissionId || `manual_submission_${matterId}`);

  if (!matterId) {
    return res.status(400).json({ error: 'matterId is required' });
  }

  await ensureFilingTables();

  const matter = await getFilingMatter(matterId);
  if (!matter) {
    return res.status(404).json({ error: 'Matter not found' });
  }

  const latestSubmission = await getLatestSubmissionForMatter(matterId);
  const documents = await listDocumentsForMatter(matterId);
  const provider = getFilingProvider((matter.provider || providerKey) as FilingProviderKey);
  const result = await provider.getFilingStatus({
    internalMatterId: matterId,
    providerSubmissionId: latestSubmission?.providerSubmissionId || submissionId,
  });

  return res.status(200).json({
    matter,
    latestSubmission,
    documents,
    status: result,
  });
}
