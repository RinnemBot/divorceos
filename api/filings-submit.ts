import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getFilingProvider } from '@/services/filing/providers';
import { parseJsonBody } from '@/services/filing/http';
import {
  buildDocument,
  buildSubmission,
  ensureFilingTables,
  getFilingMatter,
  upsertFilingDocument,
  upsertFilingSubmission,
} from '@/services/filing/supabase';
import type { FilingProviderKey, SubmitFilingInput } from '@/types/filing';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = parseJsonBody<SubmitFilingInput & { provider?: FilingProviderKey; matterId?: string }>(req);
  const matterId = String(body?.matterId || '').trim();

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

  const documents = await Promise.all(
    body.documents.map((doc) =>
      upsertFilingDocument(
        buildDocument({
          id: doc.internalDocumentId,
          matterId,
          submissionId: submission.id,
          title: doc.title,
          fileUrl: doc.fileUrl,
          mimeType: 'application/pdf',
          courtFormCode: doc.courtFormCode,
        })
      )
    )
  );

  return res.status(200).json({
    matter,
    provider: providerKey,
    submission,
    documents,
    result,
  });
}
