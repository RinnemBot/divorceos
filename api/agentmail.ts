import type { VercelRequest, VercelResponse } from '@vercel/node';
import { enforceBrowserOrigin, enforceRateLimit } from './_security.js';
import { AGENTMAIL_INBOX_ID, sendAgentMail } from './_agentmail.js';

interface AgentMailPayload {
  from?: string;
  subject?: string;
  body?: string;
  name?: string;
}

function normalizeString(value: unknown, maxLength: number): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!enforceBrowserOrigin(req, res)) return;
  if (!enforceRateLimit(req, res, 'agentmail', 8, 60_000)) return;

  const body = (typeof req.body === 'object' && req.body ? req.body : {}) as AgentMailPayload;
  const from = normalizeString(body.from, 320);
  const subject = normalizeString(body.subject, 200);
  const messageBody = normalizeString(body.body, 50_000);
  const name = normalizeString(body.name, 120) || 'Anonymous User';

  if (!from || !subject || !messageBody) {
    return res.status(400).json({ error: 'from, subject, and body are required' });
  }

  try {
    await sendAgentMail({
      to: AGENTMAIL_INBOX_ID,
      from,
      subject,
      body: messageBody,
      name,
      metadata: { source: 'Divorce Agent Website' },
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('AgentMail proxy error:', error);
    return res.status(500).json({ error: 'Mail delivery failed' });
  }
}
