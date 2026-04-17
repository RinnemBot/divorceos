export interface AgentMailMessage {
  from: string;
  subject: string;
  body: string;
  name?: string;
}

export async function sendAgentMessage(message: AgentMailMessage): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/agentmail', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error ${response.status}`);
    }

    return { success: true };
  } catch (error) {
    console.error('AgentMail send error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send message',
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
New message from Divorce Agent website contact form:

Name: ${name}
Email: ${email}
Subject: ${subject}

Message:
${message}

---
Sent from Divorce Agent Contact Form
  `;

  return sendAgentMessage({
    from: email,
    subject: `[Divorce Agent Contact] ${subject}`,
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
Sent from Divorce Agent Chat System
  `;

  return sendAgentMessage({
    from: userEmail,
    subject: `[Divorce Agent] Chat Transcript - ${userName}`,
    body,
    name: userName,
  });
}
