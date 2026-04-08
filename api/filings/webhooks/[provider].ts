import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ensureFilingTables, insertWebhookEvent } from '@/services/filing/supabase';

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

  return res.status(202).json({
    ok: true,
    provider,
    storedEventId: stored.id,
    receivedAt: stored.received_at,
    message: 'Webhook received and stored. Signature verification and state transitions still need to be implemented.',
  });
}
