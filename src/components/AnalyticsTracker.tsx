import { useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const VISITOR_KEY = 'divorceos_analytics_visitor_id';
const SESSION_KEY = 'divorceos_analytics_session_id';
const STARTED_KEY = 'divorceos_analytics_started_at';

function makeId(prefix: string) {
  const randomId = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}_${randomId}`;
}

function safeStorage() {
  if (typeof window === 'undefined') return null;
  try {
    const storage = window.localStorage;
    const probe = '__divorceos_analytics_probe__';
    storage.setItem(probe, '1');
    storage.removeItem(probe);
    return storage;
  } catch {
    return null;
  }
}

function getOrCreate(key: string, prefix: string) {
  const storage = safeStorage();
  const existing = storage?.getItem(key);
  if (existing) return existing;
  const next = makeId(prefix);
  storage?.setItem(key, next);
  return next;
}

function getStartedAt() {
  const storage = safeStorage();
  const existing = storage?.getItem(STARTED_KEY);
  if (existing) return existing;
  const next = new Date().toISOString();
  storage?.setItem(STARTED_KEY, next);
  return next;
}

function durationSeconds(startedAt: string) {
  const started = new Date(startedAt).getTime();
  if (!Number.isFinite(started)) return 0;
  return Math.max(0, Math.round((Date.now() - started) / 1000));
}

function postAnalytics(payload: Record<string, unknown>, useBeacon = false) {
  if (typeof window === 'undefined') return;
  const body = JSON.stringify(payload);

  if (useBeacon && navigator.sendBeacon) {
    navigator.sendBeacon('/api/auth', new Blob([body], { type: 'application/json' }));
    return;
  }

  void fetch('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    credentials: 'same-origin',
    keepalive: useBeacon,
  }).catch(() => {
    // Analytics should never interrupt the customer experience.
  });
}

export function AnalyticsTracker() {
  const location = useLocation();
  const previousPath = useRef<string>('');
  const identity = useMemo(() => {
    return {
      visitorId: getOrCreate(VISITOR_KEY, 'visitor'),
      sessionId: getOrCreate(SESSION_KEY, 'session'),
      startedAt: getStartedAt(),
    };
  }, []);

  useEffect(() => {
    const path = `${location.pathname}${location.search}`;
    if (previousPath.current === path) return;
    previousPath.current = path;

    postAnalytics({
      action: 'analytics-write',
      event: 'pageview',
      ...identity,
      path,
      title: document.title,
      referrer: document.referrer,
      durationSeconds: durationSeconds(identity.startedAt),
      screen: `${window.screen.width}x${window.screen.height}`,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
  }, [identity, location.pathname, location.search]);

  useEffect(() => {
    const heartbeat = () => {
      postAnalytics({
        action: 'analytics-write',
        event: 'heartbeat',
        ...identity,
        path: `${window.location.pathname}${window.location.search}`,
        durationSeconds: durationSeconds(identity.startedAt),
      });
    };

    const interval = window.setInterval(heartbeat, 30_000);
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') heartbeat();
    };
    const onPageHide = () => {
      postAnalytics({
        action: 'analytics-write',
        event: 'end',
        ...identity,
        path: `${window.location.pathname}${window.location.search}`,
        durationSeconds: durationSeconds(identity.startedAt),
      }, true);
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pagehide', onPageHide);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pagehide', onPageHide);
    };
  }, [identity]);

  return null;
}
