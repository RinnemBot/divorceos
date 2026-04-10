import type { VercelRequest, VercelResponse } from '@vercel/node';
import { enforceBrowserOrigin, enforceRateLimit } from './_security';

const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
const TAVILY_API_URL = 'https://api.tavily.com/search';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!enforceBrowserOrigin(req, res)) return;
  if (!enforceRateLimit(req, res, 'research', 10, 60_000)) return;

  if (!TAVILY_API_KEY) {
    return res.status(500).json({ error: 'Research API is not configured' });
  }

  const { query, search_depth = 'basic', include_answer = false, max_results = 5, include_domains } = req.body ?? {};

  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'query is required' });
  }

  const response = await fetch(TAVILY_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      api_key: TAVILY_API_KEY,
      query,
      search_depth,
      include_answer,
      max_results: Math.min(Math.max(Number(max_results) || 5, 1), 10),
      include_domains,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Tavily API error:', response.status, errorText);
    return res.status(response.status).json({ error: 'Research provider error' });
  }

  const data = await response.json();
  return res.status(200).json({
    query: data.query,
    results: data.results || [],
    answer: data.answer,
  });
}
