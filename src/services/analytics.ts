export interface AnalyticsSummary {
  days: number;
  visitors: number;
  sessions: number;
  pageviews: number;
  avgDurationSeconds: number;
  activeNow: number;
}

export interface AnalyticsTopPage {
  path: string;
  views: number;
}

export interface AnalyticsDailyRow {
  date: string;
  sessions: number;
  visitors: number;
  pageviews: number;
}

export interface AnalyticsSessionRow {
  id: string;
  visitorId: string;
  startedAt: string;
  lastSeenAt: string;
  durationSeconds: number;
  landingPath: string;
  lastPath: string;
  referrer?: string | null;
  ipAddress?: string | null;
  location?: {
    city?: string | null;
    region?: string | null;
    country?: string | null;
    latitude?: string | null;
    longitude?: string | null;
  } | null;
  device?: string | null;
  language?: string | null;
  timezone?: string | null;
}

export interface AnalyticsResponse {
  summary: AnalyticsSummary;
  topPages: AnalyticsTopPage[];
  daily: AnalyticsDailyRow[];
  recentSessions: AnalyticsSessionRow[];
  tableMissing?: boolean;
  error?: string;
}

export async function fetchAnalytics(days = 30): Promise<AnalyticsResponse> {
  const response = await fetch('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({ action: 'analytics-read', days }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.error || 'Unable to load analytics') as Error & { tableMissing?: boolean };
    error.tableMissing = Boolean(payload.tableMissing);
    throw error;
  }
  return payload as AnalyticsResponse;
}
