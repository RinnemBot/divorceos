const AGENTMAIL_API_KEY = process.env.AGENTMAIL_API_KEY;
export const AGENTMAIL_INBOX_ID = process.env.AGENTMAIL_INBOX_ID || 'divorceos@agentmail.to';
const AGENTMAIL_API_URL = 'https://api.agentmail.to/v1/messages';

interface SendAgentMailInput {
  to: string;
  from: string;
  subject: string;
  body: string;
  name?: string;
  metadata?: Record<string, unknown>;
}

export async function sendAgentMail(input: SendAgentMailInput) {
  if (!AGENTMAIL_API_KEY) {
    throw new Error('AGENTMAIL_API_KEY is not configured');
  }

  const response = await fetch(AGENTMAIL_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${AGENTMAIL_API_KEY}`,
    },
    body: JSON.stringify({
      to: input.to,
      from: input.from,
      subject: input.subject,
      body: input.body,
      metadata: {
        name: input.name || 'Anonymous User',
        ...(input.metadata || {}),
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AgentMail API error ${response.status}: ${errorText}`);
  }

  return response.json().catch(() => ({}));
}
