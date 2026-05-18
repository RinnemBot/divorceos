import type { VercelRequest, VercelResponse } from '@vercel/node';
import { enforceBrowserOrigin, enforceRateLimit } from './_security.js';
import { requireAuthenticatedUser } from './_auth.js';

function cleanEnvValue(value?: string) {
  return value?.replace(/\\n/g, '').replace(/^['"]|['"]$/g, '').trim() ?? '';
}

function cleanProvider(value: string) {
  const provider = value.trim().toLowerCase();
  return provider === 'grok' ? 'xai' : provider;
}

function cleanVoiceId(value: string) {
  const cleaned = value.trim().toLowerCase();
  return /^[a-z0-9_-]{2,64}$/.test(cleaned) ? cleaned : 'eve';
}

const XAI_API_KEY = cleanEnvValue(process.env.XAI_API_KEY);
const XAI_TTS_URL = 'https://api.x.ai/v1/tts';
const XAI_TTS_VOICE = cleanVoiceId(process.env.XAI_TTS_VOICE || 'eve');
const XAI_TTS_LANGUAGE = process.env.XAI_TTS_LANGUAGE || 'en';
const XAI_TTS_TEXT_NORMALIZATION = process.env.XAI_TTS_TEXT_NORMALIZATION !== 'false';
const TTS_PROVIDER = cleanProvider(process.env.TTS_PROVIDER || (XAI_API_KEY ? 'xai' : 'openai'));

const OPENAI_API_KEY = cleanEnvValue(process.env.OPENAI_API_KEY);
const OPENAI_TTS_MODEL = process.env.OPENAI_TTS_MODEL || 'gpt-4o-mini-tts';
const OPENAI_TTS_VOICE = process.env.OPENAI_TTS_VOICE || 'marin';
const OPENAI_TTS_SPEED = Number(process.env.OPENAI_TTS_SPEED || '1.1');
const OPENAI_TTS_INSTRUCTIONS = process.env.OPENAI_TTS_INSTRUCTIONS || 'Speak like Maria, a real person: natural, warm, confident, friendly, professional, and gently feminine, with softness when appropriate and a sharp edge when clarity matters. Use a natural conversational tone at a slightly brisk pace, but never rushed. Sound human, relaxed, reassuring, and subtly expressive, with clean pacing and light emotional warmth. Avoid robotic cadence, exaggerated cheerfulness, a call-center tone, overly breathy delivery, or long dramatic pauses.';
const OPENAI_TTS_URL = 'https://api.openai.com/v1/audio/speech';

async function requestXaiSpeech(input: string) {
  if (!XAI_API_KEY) {
    throw new Error('xAI TTS is not configured');
  }

  return fetch(XAI_TTS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + XAI_API_KEY,
    },
    body: JSON.stringify({
      text: input,
      voice_id: XAI_TTS_VOICE,
      language: XAI_TTS_LANGUAGE,
      text_normalization: XAI_TTS_TEXT_NORMALIZATION,
      output_format: {
        codec: 'mp3',
        sample_rate: 24000,
        bit_rate: 128000,
      },
    }),
  });
}

async function requestOpenAiSpeech(input: string) {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI TTS is not configured');
  }

  return fetch(OPENAI_TTS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + OPENAI_API_KEY,
    },
    body: JSON.stringify({
      model: OPENAI_TTS_MODEL,
      voice: OPENAI_TTS_VOICE,
      input,
      format: 'mp3',
      speed: Number.isFinite(OPENAI_TTS_SPEED) ? OPENAI_TTS_SPEED : 1.22,
      instructions: OPENAI_TTS_INSTRUCTIONS,
    }),
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!enforceBrowserOrigin(req, res)) return;
  if (!enforceRateLimit(req, res, 'tts', 8, 60_000)) return;

  const user = await requireAuthenticatedUser(req, res);
  if (!user) return;

  const provider = TTS_PROVIDER;

  if (provider === 'xai' && !XAI_API_KEY) {
    return res.status(500).json({ error: 'xAI TTS is not configured' });
  }

  if (provider !== 'xai' && !OPENAI_API_KEY) {
    return res.status(500).json({ error: 'TTS is not configured' });
  }

  const { input } = req.body ?? {};
  const safeInput = typeof input === 'string' ? input.trim() : '';

  if (!safeInput) {
    return res.status(400).json({ error: 'input is required' });
  }

  const clippedInput = safeInput.slice(0, provider === 'xai' ? 15000 : 4000);
  const response = await (provider === 'xai' ? requestXaiSpeech(clippedInput) : requestOpenAiSpeech(clippedInput));

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`${provider} TTS error:`, response.status, errorText);
    return res.status(response.status).json({ error: 'TTS provider error' });
  }

  const audioBuffer = Buffer.from(await response.arrayBuffer());
  res.setHeader('Content-Type', response.headers.get('content-type') || 'audio/mpeg');
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).send(audioBuffer);
}
