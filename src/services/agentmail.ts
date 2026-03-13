const AGENT_EMAIL = 'divorceos@agentmail.to';
const AGENTMAIL_API_KEY = 'am_us_8764650c38e114701f4fb86b24edd93eed7238f401afb16cc94fed12d07a911b';
const AGENTMAIL_API_URL = 'https://api.agentmail.to/v1/messages';

export interface AgentMailMessage {
  from: string;
  subject: string;
  body: string;
  name?: string;
}

export async function sendAgentMessage(message: AgentMailMessage): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(AGENTMAIL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AGENTMAIL_API_KEY}`,
      },
      body: JSON.stringify({
        to: AGENT_EMAIL,
        from: message.from,
        subject: message.subject,
        body: message.body,
        metadata: {
          name: message.name || 'Anonymous User',
          source: 'DivorceOS Website',
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error ${response.status}`);
    }

    return { success: true };
  } catch (error) {
    console.error('AgentMail send error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send message' 
    };
  }
}

export async function sendContactForm(
  name: string,
  email: string,
  subject: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  const body = `
New message from DivorceOS website contact form:

Name: ${name}
Email: ${email}
Subject: ${subject}

Message:
${message}

---
Sent from DivorceOS Contact Form
  `;

  return sendAgentMessage({
    from: email,
    subject: `[DivorceOS Contact] ${subject}`,
    body,
    name,
  });
}

export async function sendChatTranscript(
  userEmail: string,
  userName: string,
  chatHistory: { role: string; content: string; timestamp?: string }[]
): Promise<{ success: boolean; error?: string }> {
  const formattedChat = chatHistory
    .map(msg => `[${msg.role.toUpperCase()}]${msg.timestamp ? ` (${msg.timestamp})` : ''}:\n${msg.content}`)
    .join('\n\n---\n\n');

  const body = `
Chat transcript requested by user:

User: ${userName} (${userEmail})
Date: ${new Date().toLocaleString()}

TRANSCRIPT:

${formattedChat}

---
Sent from DivorceOS Chat System
  `;

  return sendAgentMessage({
    from: userEmail,
    subject: `[DivorceOS] Chat Transcript - ${userName}`,
    body,
    name: userName,
  });
}
