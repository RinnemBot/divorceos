import type { VercelRequest, VercelResponse } from '@vercel/node';

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function now() {
  return Date.now();
}

function getClientIp(req: VercelRequest) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || 'unknown';
}

function getAllowedOrigins() {
  const raw = [
    process.env.APP_URL,
    process.env.VITE_APP_URL,
    process.env.PUBLIC_APP_URL,
    'https://www.divorce-os.com',
    'https://divorce-os.com',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:4173',
    'http://127.0.0.1:4173',
    'http://localhost:4174',
    'http://127.0.0.1:4174',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ].filter(Boolean) as string[];

  return Array.from(new Set(raw));
}

function matchesAllowedOrigin(candidate: string) {
  return getAllowedOrigins().some((allowed) => {
    try {
      return new URL(candidate).origin === new URL(allowed).origin;
    } catch {
      return false;
    }
  });
}

export function enforceBrowserOrigin(req: VercelRequest, res: VercelResponse): boolean {
  const origin = typeof req.headers.origin === 'string' ? req.headers.origin : '';
  const referer = typeof req.headers.referer === 'string' ? req.headers.referer : '';

  if (!origin && !referer) {
    res.status(403).json({ error: 'Missing origin' });
    return false;
  }

  if (origin && !matchesAllowedOrigin(origin)) {
    res.status(403).json({ error: 'Origin not allowed' });
    return false;
  }

  if (referer && !matchesAllowedOrigin(referer)) {
    res.status(403).json({ error: 'Referer not allowed' });
    return false;
  }

  return true;
}

export function enforceRateLimit(
  req: VercelRequest,
  res: VercelResponse,
  key: string,
  limit: number,
  windowMs: number
): boolean {
  const bucketKey = `${key}:${getClientIp(req)}`;
  const current = rateLimitStore.get(bucketKey);
  const currentTime = now();

  if (!current || current.resetAt <= currentTime) {
    rateLimitStore.set(bucketKey, { count: 1, resetAt: currentTime + windowMs });
    return true;
  }

  if (current.count >= limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((current.resetAt - currentTime) / 1000));
    res.setHeader('Retry-After', String(retryAfterSeconds));
    res.status(429).json({ error: 'Too many requests' });
    return false;
  }

  current.count += 1;
  rateLimitStore.set(bucketKey, current);
  return true;
}

export function enforceSensitiveApiEnabled(res: VercelResponse): boolean {
  if (process.env.ENABLE_SENSITIVE_CASE_APIS === 'true') {
    return true;
  }

  res.status(503).json({
    error: 'Sensitive case-management APIs are temporarily disabled until server-side authentication is implemented.',
  });
  return false;
}

export function sanitizeReturnUrl(raw: string | undefined, fallback: string): string {
  if (!raw) return fallback;

  try {
    const parsed = new URL(raw);
    if (matchesAllowedOrigin(parsed.origin)) {
      return parsed.toString();
    }
  } catch {
    // ignore invalid URL, fall back below
  }

  return fallback;
}
