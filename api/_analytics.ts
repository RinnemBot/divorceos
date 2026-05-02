import type { VercelRequest, VercelResponse } from '@vercel/node';
import { enforceBrowserOrigin, enforceRateLimit } from './_security.js';
import { requireStaffUser, requireSupabase } from './_auth.js';

const SESSIONS_TABLE = 'site_analytics_sessions';
const PAGEVIEWS_TABLE = 'site_analytics_pageviews';

type AnalyticsEvent = 'pageview' | 'heartbeat' | 'end';

interface AnalyticsBody {
  action?: string;
  event?: AnalyticsEvent;
  days?: number;
  sessionId?: string;
  visitorId?: string;
  path?: string;
  title?: string;
  referrer?: string;
  startedAt?: string;
  durationSeconds?: number;
  screen?: string;
  language?: string;
  timezone?: string;
}

function getHeader(req: VercelRequest, name: string) {
  const value = req.headers[name.toLowerCase()];
  if (Array.isArray(value)) return value[0] || '';
  return typeof value === 'string' ? value : '';
}

function parseJsonBody<T>(req: VercelRequest): T {
  if (!req.body) return {} as T;
  if (typeof req.body === 'object') return req.body as T;
  try {
    return JSON.parse(req.body) as T;
  } catch {
    return {} as T;
  }
}

function getClientIp(req: VercelRequest) {
  const realIp = getHeader(req, 'x-real-ip') || getHeader(req, 'x-vercel-forwarded-for');
  if (realIp.trim()) return realIp.split(',')[0].trim();

  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || 'unknown';
}

function decodeHeaderValue(value: string) {
  if (!value) return '';
  try {
    return decodeURIComponent(value.replace(/\+/g, '%20'));
  } catch {
    return value;
  }
}

function getApproxLocation(req: VercelRequest) {
  const city = decodeHeaderValue(getHeader(req, 'x-vercel-ip-city'));
  const region = decodeHeaderValue(getHeader(req, 'x-vercel-ip-country-region'));
  const country = decodeHeaderValue(getHeader(req, 'x-vercel-ip-country'));
  const latitude = getHeader(req, 'x-vercel-ip-latitude');
  const longitude = getHeader(req, 'x-vercel-ip-longitude');

  return {
    city: cleanString(city, 120) || null,
    region: cleanString(region, 120) || null,
    country: cleanString(country, 2) || null,
    latitude: cleanString(latitude, 40) || null,
    longitude: cleanString(longitude, 40) || null,
  };
}

function hashIp(ip: string) {
  // Lightweight one-way bucketing; enough to count abuse/uniques without storing raw IP.
  let hash = 0;
  for (let i = 0; i < ip.length; i += 1) {
    hash = ((hash << 5) - hash) + ip.charCodeAt(i);
    hash |= 0;
  }
  return `ip_${Math.abs(hash).toString(36)}`;
}

function cleanString(value: unknown, max = 300) {
  return typeof value === 'string' ? value.slice(0, max) : '';
}

function isMissingTableError(message: string | undefined) {
  const lower = message?.toLowerCase() || '';
  return lower.includes(`relation "${SESSIONS_TABLE}" does not exist`) || lower.includes(`relation "${PAGEVIEWS_TABLE}" does not exist`);
}

function seconds(value: unknown) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.min(Math.round(parsed), 24 * 60 * 60));
}

export async function handleAnalyticsWrite(req: VercelRequest, res: VercelResponse) {
  if (!enforceBrowserOrigin(req, res)) return;
  if (!enforceRateLimit(req, res, 'analytics-write', 180, 60_000)) return;

  const body = parseJsonBody<AnalyticsBody>(req);
  const event = body.event || 'pageview';
  const sessionId = cleanString(body.sessionId, 80);
  const visitorId = cleanString(body.visitorId, 80);
  const path = cleanString(body.path || '/', 500) || '/';

  if (!sessionId || !visitorId || !['pageview', 'heartbeat', 'end'].includes(event)) {
    return res.status(400).json({ error: 'Invalid analytics event' });
  }

  try {
    const supabase = requireSupabase();
    const now = new Date().toISOString();
    const duration = seconds(body.durationSeconds);
    const userAgent = cleanString(req.headers['user-agent'], 500);
    const referrer = cleanString(body.referrer || req.headers.referer, 500);
    const ipAddress = cleanString(getClientIp(req), 64);
    const approxLocation = getApproxLocation(req);

    const sessionPayload = {
      id: sessionId,
      visitor_id: visitorId,
      started_at: body.startedAt || now,
      last_seen_at: now,
      duration_seconds: duration,
      landing_path: path,
      last_path: path,
      referrer,
      user_agent: userAgent,
      ip_address: ipAddress,
      ip_hash: hashIp(ipAddress),
      location_city: approxLocation.city,
      location_region: approxLocation.region,
      location_country: approxLocation.country,
      latitude: approxLocation.latitude,
      longitude: approxLocation.longitude,
      screen: cleanString(body.screen, 80),
      language: cleanString(body.language, 40),
      timezone: cleanString(body.timezone, 80),
      ended_at: event === 'end' ? now : null,
    };

    const { data: updatedRows, error: updateError } = await supabase
      .from(SESSIONS_TABLE)
      .update({
        last_seen_at: now,
        duration_seconds: duration,
        last_path: path,
        referrer,
        user_agent: userAgent,
        ip_address: ipAddress,
        ip_hash: hashIp(ipAddress),
        location_city: approxLocation.city,
        location_region: approxLocation.region,
        location_country: approxLocation.country,
        latitude: approxLocation.latitude,
        longitude: approxLocation.longitude,
        screen: cleanString(body.screen, 80),
        language: cleanString(body.language, 40),
        timezone: cleanString(body.timezone, 80),
        ended_at: event === 'end' ? now : null,
      })
      .eq('id', sessionId)
      .select('id');

    if (updateError) throw updateError;

    if (!updatedRows?.length) {
      const { error: insertError } = await supabase.from(SESSIONS_TABLE).insert(sessionPayload);
      if (insertError) throw insertError;
    }

    if (event === 'pageview') {
      const { error: pageviewError } = await supabase.from(PAGEVIEWS_TABLE).insert({
        session_id: sessionId,
        visitor_id: visitorId,
        path,
        title: cleanString(body.title, 200),
        referrer,
        occurred_at: now,
      });
      if (pageviewError) throw pageviewError;
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : typeof (error as { message?: unknown })?.message === 'string' ? String((error as { message: string }).message) : 'Unable to record analytics';
    const code = typeof (error as { code?: unknown })?.code === 'string' ? String((error as { code: string }).code) : '';
    if (code === '42P01' || code === 'PGRST205' || isMissingTableError(message)) {
      return res.status(503).json({ error: 'Analytics tables are not installed yet.', tableMissing: true });
    }
    console.error('[analytics] write failed', error);
    return res.status(500).json({ error: 'Unable to record analytics' });
  }
}

function toDateKey(iso: string) {
  return iso.slice(0, 10);
}

export async function handleAnalyticsRead(req: VercelRequest, res: VercelResponse) {
  const staff = await requireStaffUser(req, res);
  if (!staff) return;

  try {
    const supabase = requireSupabase();
    const body = parseJsonBody<AnalyticsBody>(req);
    const daysRaw = body.days || (Array.isArray(req.query.days) ? req.query.days[0] : req.query.days);
    const days = Math.max(1, Math.min(Number(daysRaw || 30) || 30, 90));
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const activeSince = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    const [{ data: sessions, error: sessionsError }, { data: pageviews, error: pageviewsError }] = await Promise.all([
      supabase
        .from(SESSIONS_TABLE)
        .select('id, visitor_id, started_at, last_seen_at, duration_seconds, landing_path, last_path, referrer, user_agent, ip_address, location_city, location_region, location_country, latitude, longitude, screen, language, timezone')
        .gte('started_at', since)
        .order('started_at', { ascending: false })
        .limit(1000),
      supabase
        .from(PAGEVIEWS_TABLE)
        .select('path, title, occurred_at, session_id, visitor_id')
        .gte('occurred_at', since)
        .order('occurred_at', { ascending: false })
        .limit(5000),
    ]);

    if (sessionsError) throw sessionsError;
    if (pageviewsError) throw pageviewsError;

    const sessionRows = sessions || [];
    const pageviewRows = pageviews || [];
    const uniqueVisitors = new Set(sessionRows.map((row) => row.visitor_id)).size;
    const avgDurationSeconds = sessionRows.length
      ? Math.round(sessionRows.reduce((sum, row) => sum + Number(row.duration_seconds || 0), 0) / sessionRows.length)
      : 0;
    const activeNow = sessionRows.filter((row) => String(row.last_seen_at) >= activeSince).length;

    const topPageMap = new Map<string, number>();
    pageviewRows.forEach((row) => topPageMap.set(row.path, (topPageMap.get(row.path) || 0) + 1));
    const topPages = Array.from(topPageMap.entries())
      .map(([path, views]) => ({ path, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    const dailyMap = new Map<string, { date: string; sessions: Set<string>; visitors: Set<string>; pageviews: number }>();
    sessionRows.forEach((row) => {
      const key = toDateKey(String(row.started_at));
      const entry = dailyMap.get(key) || { date: key, sessions: new Set<string>(), visitors: new Set<string>(), pageviews: 0 };
      entry.sessions.add(row.id);
      entry.visitors.add(row.visitor_id);
      dailyMap.set(key, entry);
    });
    pageviewRows.forEach((row) => {
      const key = toDateKey(String(row.occurred_at));
      const entry = dailyMap.get(key) || { date: key, sessions: new Set<string>(), visitors: new Set<string>(), pageviews: 0 };
      entry.pageviews += 1;
      dailyMap.set(key, entry);
    });

    const daily = Array.from(dailyMap.values())
      .map((entry) => ({ date: entry.date, sessions: entry.sessions.size, visitors: entry.visitors.size, pageviews: entry.pageviews }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return res.status(200).json({
      summary: {
        days,
        visitors: uniqueVisitors,
        sessions: sessionRows.length,
        pageviews: pageviewRows.length,
        avgDurationSeconds,
        activeNow,
      },
      topPages,
      daily,
      recentSessions: sessionRows.slice(0, 25).map((row) => ({
        id: row.id,
        visitorId: row.visitor_id,
        startedAt: row.started_at,
        lastSeenAt: row.last_seen_at,
        durationSeconds: Number(row.duration_seconds || 0),
        landingPath: row.landing_path,
        lastPath: row.last_path,
        referrer: row.referrer,
        ipAddress: row.ip_address,
        location: {
          city: row.location_city,
          region: row.location_region,
          country: row.location_country,
          latitude: row.latitude,
          longitude: row.longitude,
        },
        device: row.screen,
        language: row.language,
        timezone: row.timezone,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : typeof (error as { message?: unknown })?.message === 'string' ? String((error as { message: string }).message) : 'Unable to load analytics';
    const code = typeof (error as { code?: unknown })?.code === 'string' ? String((error as { code: string }).code) : '';
    if (code === '42P01' || code === 'PGRST205' || isMissingTableError(message)) {
      return res.status(503).json({ error: 'Analytics tables are not installed yet.', tableMissing: true });
    }
    console.error('[analytics] read failed', error);
    return res.status(500).json({ error: 'Unable to load analytics' });
  }
}
