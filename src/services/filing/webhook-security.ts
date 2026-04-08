import type { VercelRequest } from '@vercel/node';
import crypto from 'node:crypto';

export type WebhookVerificationResult = {
  verified: boolean;
  reason?: string;
};

export function verifyProviderWebhookSignature(req: VercelRequest, provider: string): WebhookVerificationResult {
  const providerKey = provider.toLowerCase();

  if (providerKey === 'manual') {
    return { verified: true };
  }

  if (providerKey === 'onelegal') {
    const secret = process.env.ONELEGAL_WEBHOOK_SECRET;
    if (!secret) {
      return { verified: false, reason: 'ONELEGAL_WEBHOOK_SECRET is not configured' };
    }

    const signature = String(req.headers['x-onelegal-signature'] || '');
    if (!signature) {
      return { verified: false, reason: 'Missing x-onelegal-signature header' };
    }

    const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? {});
    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

    const safeA = Buffer.from(signature);
    const safeB = Buffer.from(expected);
    if (safeA.length !== safeB.length || !crypto.timingSafeEqual(safeA, safeB)) {
      return { verified: false, reason: 'Signature mismatch' };
    }

    return { verified: true };
  }

  return { verified: false, reason: `No webhook verifier configured for provider: ${provider}` };
}
