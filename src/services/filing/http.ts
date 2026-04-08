import type { VercelRequest } from '@vercel/node';

export function parseJsonBody<T>(req: VercelRequest): T | null {
  if (!req.body) return null;
  if (typeof req.body === 'object') return req.body as T;

  try {
    return JSON.parse(req.body) as T;
  } catch {
    return null;
  }
}
