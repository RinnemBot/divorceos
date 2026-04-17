import type { VercelRequest, VercelResponse } from '@vercel/node';
import { enforceBrowserOrigin, enforceRateLimit } from './_security.js';
import { getDurableUserMemory, incrementChatCount, isAdminEmail, listRecentChatSessions, requireAuthenticatedUser, type AuthUser } from './_auth.js';

// Prefer OpenAI GPT-5.1 when available; fall back to Kimi (Moonshot) otherwise.
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
const OPENAI_API_URL = process.env.OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions';

const KIMI_API_KEY = process.env.MOONSHOT_API_KEY || process.env.KIMI_API_KEY;
const KIMI_MODEL = process.env.KIMI_MODEL || 'kimi-k2.5';
const KIMI_API_URL = process.env.KIMI_API_URL || 'https://api.moonshot.cn/v1/chat/completions';

const DEFAULT_PROVIDER = process.env.AI_PROVIDER || (OPENAI_API_KEY ? 'openai' : 'kimi');
const MAX_MESSAGE_COUNT = 40;
const MAX_MESSAGE_CHARS = 4_000;
const MAX_TOTAL_CHARS = 40_000;
const CHAT_LIMITS: Record<string, number> = {
  free: 3,
  basic: 20,
  essential: Number.POSITIVE_INFINITY,
  plus: Number.POSITIVE_INFINITY,
  'done-for-you': Number.POSITIVE_INFINITY,
};

function formatProfileContext(user: AuthUser) {
  const profile = user.profile;
  if (!profile) return null;

  const lines = [
    'Known user profile and case context from DivorceOS account settings. Use this to personalize guidance, but do not pretend the user said it in this message.',
  ];

  const displayName = [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim();
  if (displayName) lines.push(`- Name: ${displayName}`);
  if (profile.county) lines.push(`- County: ${profile.county}`);
  if (profile.caseStage) lines.push(`- Case stage: ${profile.caseStage}`);
  if (profile.caseNumber) lines.push(`- Case number: ${profile.caseNumber}`);
  if (profile.marriageDate) lines.push(`- Marriage date: ${profile.marriageDate}`);
  if (profile.separationDate) lines.push(`- Separation date: ${profile.separationDate}`);
  if (profile.filingDate) lines.push(`- Filing date: ${profile.filingDate}`);
  if (profile.serviceDate) lines.push(`- Service date: ${profile.serviceDate}`);
  if (profile.nextHearingDate) lines.push(`- Next hearing date: ${profile.nextHearingDate}`);
  if (profile.representationStatus) lines.push(`- Representation status: ${profile.representationStatus}`);
  if (typeof profile.hasChildren === 'boolean') lines.push(`- Has children: ${profile.hasChildren ? 'yes' : 'no'}`);
  if (typeof profile.childrenCount === 'number' && profile.childrenCount > 0) lines.push(`- Children count: ${profile.childrenCount}`);
  if (Array.isArray(profile.childrenAges) && profile.childrenAges.length) lines.push(`- Children ages: ${profile.childrenAges.join(', ')}`);
  if (Array.isArray(profile.primaryGoals) && profile.primaryGoals.length) lines.push(`- Primary goals: ${profile.primaryGoals.join(', ')}`);

  return lines.length > 1 ? lines.join('\n') : null;
}

function injectProfileContext(messages: { role: string; content: string }[], user: AuthUser) {
  const profileContext = formatProfileContext(user);
  if (!profileContext) return messages;

  const profileMessage = { role: 'system' as const, content: profileContext };
  const firstSystemIndex = messages.findIndex((message) => message.role === 'system');

  if (firstSystemIndex >= 0) {
    const next = [...messages];
    next.splice(firstSystemIndex + 1, 0, profileMessage);
    return next;
  }

  return [profileMessage, ...messages];
}

function formatRecentChatMemory(sessions: Awaited<ReturnType<typeof listRecentChatSessions>>) {
  const relevantSessions = sessions
    .map((session) => {
      const lastUserMessage = [...session.messages].reverse().find((message) => message.role === 'user')?.content?.trim();
      const lastAssistantMessage = [...session.messages].reverse().find((message) => message.role === 'assistant')?.content?.trim();
      if (!lastUserMessage && !lastAssistantMessage) return null;

      return [
        `- Session: ${session.title || 'Untitled chat'}`,
        lastUserMessage ? `  Last user question: ${lastUserMessage.slice(0, 260)}` : null,
        lastAssistantMessage ? `  Maria last answered: ${lastAssistantMessage.slice(0, 260)}` : null,
      ]
        .filter(Boolean)
        .join('\n');
    })
    .filter((entry): entry is string => Boolean(entry));

  if (!relevantSessions.length) return null;

  return [
    'Recent prior Maria chat memory for this user. Use it to stay consistent and remember ongoing context, but prioritize the current message if anything conflicts.',
    ...relevantSessions.slice(0, 3),
  ].join('\n');
}

function formatDurableMemoryContext(memory: Awaited<ReturnType<typeof getDurableUserMemory>>) {
  if (!memory) return null;

  const lines = [
    'Durable remembered user and case facts from prior Maria chats. Use this to stay consistent over time, but never claim the user repeated these facts in the current message.',
  ];

  if (memory.summary.trim()) {
    lines.push(memory.summary.trim());
  }

  if (memory.memoryItems.length) {
    lines.push(...memory.memoryItems.slice(-6).map((item) => `- ${item}`));
  }

  return lines.length > 1 ? lines.join('\n') : null;
}

function sanitizeMessages(input: unknown) {
  if (!Array.isArray(input)) return null;
  if (input.length === 0 || input.length > MAX_MESSAGE_COUNT) return null;

  let totalChars = 0;
  const sanitized = input.map((item) => {
    if (!item || typeof item !== 'object') return null;
    const role = typeof (item as { role?: unknown }).role === 'string' ? (item as { role: string }).role : '';
    const content = typeof (item as { content?: unknown }).content === 'string' ? (item as { content: string }).content.trim() : '';

    if (!['system', 'user', 'assistant'].includes(role) || !content) {
      return null;
    }

    const clippedContent = content.slice(0, MAX_MESSAGE_CHARS);
    totalChars += clippedContent.length;
    return { role, content: clippedContent };
  });

  if (sanitized.some((entry) => !entry) || totalChars > MAX_TOTAL_CHARS) {
    return null;
  }

  return sanitized as { role: string; content: string }[];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!enforceBrowserOrigin(req, res)) return;
  if (!enforceRateLimit(req, res, 'chat', 12, 60_000)) return;

  const currentUser = await requireAuthenticatedUser(req, res);
  if (!currentUser) return;

  const chatLimit = CHAT_LIMITS[currentUser.subscription] ?? 0;
  if (!isAdminEmail(currentUser.email) && Number.isFinite(chatLimit) && currentUser.chatCount >= chatLimit) {
    return res.status(403).json({ error: 'Daily chat limit reached for this account' });
  }

  const provider = (req.query.provider as string) || DEFAULT_PROVIDER;

  if (provider === 'openai') {
    if (!OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY missing');
      return res.status(500).json({
        error: 'OPENAI_API_KEY not configured',
        message: 'Set OPENAI_API_KEY (and optionally OPENAI_MODEL) in your environment.',
      });
    }
  } else if (!KIMI_API_KEY) {
    console.error('KIMI/MOONSHOT API key missing');
    return res.status(500).json({
      error: 'AI provider not configured',
      message: 'Set OPENAI_API_KEY for OpenAI GPT-5.1 or MOONSHOT_API_KEY for Kimi.',
    });
  }

  try {
    const { messages, temperature = 0.8, max_tokens = 2000 } = req.body ?? {};
    const sanitizedMessages = sanitizeMessages(messages);

    if (!sanitizedMessages) {
      return res.status(400).json({ error: 'Invalid messages payload' });
    }

    const requestedMaxTokens = Number(max_tokens);
    const safeMaxTokens = Number.isFinite(requestedMaxTokens) ? Math.min(Math.max(requestedMaxTokens, 1), 1200) : 1200;
    const safeTemperature = Math.min(Math.max(Number(temperature) || 0.8, 0), 1.2);
    const recentSessions = await listRecentChatSessions(currentUser.id, 3).catch((error) => {
      console.error('Failed to load recent Maria chat memory', error);
      return [];
    });
    const durableMemory = await getDurableUserMemory(currentUser.id).catch((error) => {
      console.error('Failed to load durable Maria memory', error);
      return null;
    });
    const recentMemory = formatRecentChatMemory(recentSessions);
    const durableMemoryContext = formatDurableMemoryContext(durableMemory);
    const contextMessages = injectProfileContext(sanitizedMessages, currentUser);
    const memorySystemMessages = [durableMemoryContext, recentMemory]
      .filter((value): value is string => Boolean(value))
      .map((content) => ({ role: 'system' as const, content }));
    const messagesWithMemory = memorySystemMessages.length
      ? [...memorySystemMessages, ...contextMessages]
      : contextMessages;

    if (provider === 'openai') {
      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          messages: messagesWithMemory,
          temperature: safeTemperature,
          max_completion_tokens: safeMaxTokens,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenAI API error:', response.status, errorText);
        if (KIMI_API_KEY) {
          console.warn('Falling back to Kimi provider due to OpenAI failure.');
          return proxyKimi(messagesWithMemory, safeTemperature, safeMaxTokens, res, currentUser.id);
        }
        return res.status(502).json({
          error: 'Upstream AI provider error',
          provider: 'openai',
          upstreamStatus: response.status,
        });
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (typeof content !== 'string' || !content.trim()) {
        console.error('OpenAI returned empty content payload');
        if (KIMI_API_KEY) {
          console.warn('Falling back to Kimi provider due to empty OpenAI content.');
          return proxyKimi(messagesWithMemory, safeTemperature, safeMaxTokens, res, currentUser.id);
        }
        return res.status(502).json({ error: 'OpenAI returned an empty response' });
      }

      await incrementChatCount(currentUser.id);
      return res.status(200).json({ ...data, provider: 'openai' });
    }

    return proxyKimi(messagesWithMemory, safeTemperature, safeMaxTokens, res, currentUser.id);
  } catch (error) {
    console.error('API route error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

async function proxyKimi(
  messages: { role: string; content: string }[],
  temperature: number,
  max_tokens: number,
  res: VercelResponse,
  userId: string
) {
  if (!KIMI_API_KEY) {
    return res.status(500).json({
      error: 'Kimi API key missing',
      message: 'Set MOONSHOT_API_KEY to allow Kimi fallback.',
    });
  }

  const response = await fetch(KIMI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${KIMI_API_KEY}`,
    },
    body: JSON.stringify({
      model: KIMI_MODEL,
      messages,
      temperature,
      max_tokens,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Kimi API error:', response.status, errorText);
    return res.status(502).json({
      error: 'Upstream AI provider error',
      provider: 'kimi',
      upstreamStatus: response.status,
    });
  }

  const data = await response.json();
  await incrementChatCount(userId);
  return res.status(200).json({ ...data, provider: 'kimi' });
}
