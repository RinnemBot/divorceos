import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  ensureFilingTables,
  findServiceRequestByProviderServiceId,
  findSubmissionByProviderSubmissionId,
  insertWebhookEvent,
  updateServiceRequestStatus,
  updateSubmissionStatus,
} from '@/services/filing/supabase';
import { verifyProviderWebhookSignature } from '@/services/filing/webhook-security';

function mapSubmissionEventToStatus(eventType?: string) {
  if (!eventType) return null;
  const normalized = eventType.toLowerCase();
  if (normalized.includes('accepted') || normalized.includes('filed')) return 'accepted';
  if (normalized.includes('rejected') || normalized.includes('failed')) return 'rejected';
  if (normalized.includes('review')) return 'under_review';
  return null;
}

function mapServiceEventToStatus(eventType?: string) {
  if (!eventType) return null;
  const normalized = eventType.toLowerCase();
  if (normalized.includes('served')) return 'served';
  if (normalized.includes('attempt')) return 'attempted';
  if (normalized.includes('failed')) return 'failed';
  return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const provider = String(req.query.provider || '').trim();
  if (!provider) {
    return res.status(400).json({ error: 'provider is required' });
  }

  await ensureFilingTables();

  const verification = verifyProviderWebhookSignature(req, provider);
  if (!verification.verified) {
    return res.status(401).json({
      ok: false,
      provider,
      error: 'Webhook signature verification failed',
      reason: verification.reason,
    });
  }

  const payload = req.body ?? null;
  const eventType = payload && typeof payload === 'object' && 'event' in payload ? String((payload as any).event) : undefined;
  const externalId = payload && typeof payload === 'object' && 'providerSubmissionId' in payload
    ? String((payload as any).providerSubmissionId)
    : undefined;

  const stored = await insertWebhookEvent({
    provider,
    eventType,
    externalId,
    payload,
  });

  let submissionUpdate = null;
  let serviceUpdate = null;

  if (externalId) {
    const submission = await findSubmissionByProviderSubmissionId(externalId);
    const submissionStatus = mapSubmissionEventToStatus(eventType);
    if (submission && submissionStatus) {
      submissionUpdate = await updateSubmissionStatus({
        id: submission.id,
        status: submissionStatus,
        rejectionReason:
          payload && typeof payload === 'object' && 'reason' in payload ? String((payload as any).reason) : undefined,
        rawProviderPayload: payload,
      });
    }

    const serviceRequest = await findServiceRequestByProviderServiceId(externalId);
    const serviceStatus = mapServiceEventToStatus(eventType);
    if (serviceRequest && serviceStatus) {
      serviceUpdate = await updateServiceRequestStatus({
        id: serviceRequest.id,
        status: serviceStatus,
        proofOfServiceUrl:
          payload && typeof payload === 'object' && 'proofOfServiceUrl' in payload
            ? String((payload as any).proofOfServiceUrl)
            : undefined,
      });
    }
  }

  return res.status(202).json({
    ok: true,
    provider,
    storedEventId: stored.id,
    receivedAt: stored.received_at,
    submissionUpdate,
    serviceUpdate,
    message: 'Webhook received and stored.',
    verified: true,
  });
}
