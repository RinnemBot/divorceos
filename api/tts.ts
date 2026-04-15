import type { VercelRequest, VercelResponse } from '@vercel/node';
import { enforceBrowserOrigin, enforceRateLimit } from './_security.js';
import { getAuthenticatedUser } from './_auth.js';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_TTS_MODEL = process.env.OPENAI_TTS_MODEL || 'gpt-4o-mini-tts';
const OPENAI_TTS_VOICE = process.env.OPENAI_TTS_VOICE || 'coral';
const OPENAI_TTS_SPEED = Number(process.env.OPENAI_TTS_SPEED || '1.08');
const OPENAI_TTS_INSTRUCTIONS = process.env.OPENAI_TTS_INSTRUCTIONS || 'Speak like Maria, warm, grounded, and confident. Sound calm, human, and reassuring, with clean pacing and a natural conversational tone. Avoid sounding robotic, overly chipper, or salesy.';
const OPENAI_TTS_URL = 'https://api.openai.com/v1/audio/speech';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!enforceBrowserOrigin(req, res)) return;
  if (!enforceRateLimit(req, res, 'tts', 8, 60_000)) return;

  await getAuthenticatedUser(req);

  if (!OPENAI_API_KEY) {
    return res.status(500).json({ error: 'TTS is not configured' });
  }

  const { input } = req.body ?? {};
  const safeInput = typeof input === 'string' ? input.trim() : '';

  if (!safeInput) {
    return res.status(400).json({ error: 'input is required' });
  }

  const clippedInput = safeInput.slice(0, 4000);

  const response = await fetch(OPENAI_TTS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_TTS_MODEL,
      voice: OPENAI_TTS_VOICE,
      input: clippedInput,
      format: 'mp3',
      speed: Number.isFinite(OPENAI_TTS_SPEED) ? OPENAI_TTS_SPEED : 1.22,
      instructions: OPENAI_TTS_INSTRUCTIONS,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('OpenAI TTS error:', response.status, errorText);
    return res.status(response.status).json({ error: 'TTS provider error' });
  }

  const audioBuffer = Buffer.from(await response.arrayBuffer());
  res.setHeader('Content-Type', 'audio/mpeg');
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).send(audioBuffer);
}
