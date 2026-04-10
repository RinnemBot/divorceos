import type { VercelRequest, VercelResponse } from '@vercel/node';
import { enforceBrowserOrigin, enforceRateLimit } from './_security.js';

// Prefer OpenAI GPT-5.1 when available; fall back to Kimi (Moonshot) otherwise.
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-5.1';
const OPENAI_API_URL = process.env.OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions';

const KIMI_API_KEY = process.env.MOONSHOT_API_KEY || process.env.KIMI_API_KEY;
const KIMI_MODEL = process.env.KIMI_MODEL || 'kimi-k2.5';
const KIMI_API_URL = process.env.KIMI_API_URL || 'https://api.moonshot.cn/v1/chat/completions';

const DEFAULT_PROVIDER = process.env.AI_PROVIDER || (OPENAI_API_KEY ? 'openai' : 'kimi');

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!enforceBrowserOrigin(req, res)) return;
  if (!enforceRateLimit(req, res, 'chat', 20, 60_000)) return;

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
    const { messages, temperature = 0.8, max_tokens = 2000 } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array required' });
    }

    if (messages.length > 40) {
      return res.status(400).json({ error: 'Too many messages in request' });
    }

    const requestedMaxTokens = Number(max_tokens);
    const safeMaxTokens = Number.isFinite(requestedMaxTokens) ? Math.min(Math.max(requestedMaxTokens, 1), 1200) : 1200;
    const safeTemperature = Math.min(Math.max(Number(temperature) || 0.8, 0), 1.2);

    if (provider === 'openai') {
      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          messages,
          temperature: safeTemperature,
          max_completion_tokens: safeMaxTokens,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenAI API error:', response.status, errorText);
        if (KIMI_API_KEY) {
          console.warn('Falling back to Kimi provider due to OpenAI failure.');
          return proxyKimi(messages, safeTemperature, safeMaxTokens, res);
        }
        return res.status(response.status).json({ error: 'Upstream AI provider error' });
      }

      const data = await response.json();
      return res.status(200).json({ ...data, provider: 'openai' });
    }

    return proxyKimi(messages, safeTemperature, safeMaxTokens, res);
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
  res: VercelResponse
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
    return res.status(response.status).json({ error: 'Upstream AI provider error' });
  }

  const data = await response.json();
  return res.status(200).json({ ...data, provider: 'kimi' });
}
