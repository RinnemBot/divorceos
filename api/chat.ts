import type { VercelRequest, VercelResponse } from '@vercel/node';

// Server-side API route - API key is hidden from client
const KIMI_API_KEY = process.env.MOONSHOT_API_KEY || process.env.KIMI_API_KEY;
const KIMI_API_URL = 'https://api.moonshot.cn/v1/chat/completions';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check API key is configured
  if (!KIMI_API_KEY || KIMI_API_KEY === 'sk-your-api-key-here') {
    console.error('MOONSHOT_API_KEY not configured');
    return res.status(500).json({ 
      error: 'API key not configured',
      message: 'Please set MOONSHOT_API_KEY environment variable' 
    });
  }

  try {
    const { messages, temperature = 0.8, max_tokens = 2000 } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array required' });
    }

    const response = await fetch(KIMI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${KIMI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'kimi-k2.5',
        messages,
        temperature,
        max_tokens,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Moonshot API error:', response.status, errorText);
      return res.status(response.status).json({ 
        error: 'API error',
        details: errorText 
      });
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    console.error('API route error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
