import { useEffect, useMemo, useState } from 'react';
import { Activity, BarChart3, Clock3, Download, Eye, RefreshCw, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fetchAnalytics, type AnalyticsResponse } from '@/services/analytics';

function formatDuration(seconds: number) {
  if (!seconds) return '0s';
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  if (minutes < 1) return `${remaining}s`;
  if (minutes < 60) return `${minutes}m ${remaining}s`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

function dateTime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatLocation(session: AnalyticsResponse['recentSessions'][number]) {
  const location = session.location;
  const parts = [location?.city, location?.region, location?.country].filter(Boolean);
  if (parts.length) return parts.join(', ');
  if (location?.latitude && location?.longitude) return `${location.latitude}, ${location.longitude}`;
  return 'Unknown';
}

function StatCard({ label, value, icon: Icon, helper }: { label: string; value: string; icon: typeof Users; helper: string }) {
  return (
    <div className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950 dark:text-white">{value}</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{helper}</p>
        </div>
        <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-200">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function toCsv(data: AnalyticsResponse) {
  const headers = ['Started', 'Visitor', 'IP Address', 'Approx Location', 'Duration', 'Landing Path', 'Last Path', 'Referrer', 'Device', 'Timezone'];
  const rows = data.recentSessions.map((session) => [
    session.startedAt,
    session.visitorId,
    session.ipAddress || '',
    formatLocation(session),
    session.durationSeconds,
    session.landingPath,
    session.lastPath,
    session.referrer || '',
    session.device || '',
    session.timezone || '',
  ]);
  return [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
}

export function AnalyticsPage() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tableMissing, setTableMissing] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    setTableMissing(false);
    try {
      setData(await fetchAnalytics(days));
    } catch (err) {
      const typed = err as Error & { tableMissing?: boolean };
      setError(typed.message);
      setTableMissing(Boolean(typed.tableMissing));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  const maxDaily = useMemo(() => Math.max(1, ...(data?.daily.map((row) => row.pageviews) || [1])), [data]);

  const downloadCsv = () => {
    if (!data) return;
    const blob = new Blob([toCsv(data)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `divorce-agent-analytics-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/60 to-white px-4 py-10 text-slate-900 dark:from-slate-950 dark:via-slate-950 dark:to-emerald-950/30 dark:text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700 dark:border-emerald-400/30 dark:bg-white/5 dark:text-emerald-200">
              <BarChart3 className="h-3.5 w-3.5" /> Internal analytics
            </div>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950 dark:text-white">Website analytics</h1>
            <p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-300">
              First-party visit tracking for Divorce Agent: visitors, pageviews, active sessions, and how long people stay on the site.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select value={days} onChange={(event) => setDays(Number(event.target.value))} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-950">
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
            <Button variant="outline" onClick={load} disabled={loading} className="gap-2">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
            <Button onClick={downloadCsv} disabled={!data?.recentSessions.length} className="gap-2 bg-emerald-700 hover:bg-emerald-800">
              <Download className="h-4 w-4" /> Export CSV
            </Button>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-400/30 dark:bg-amber-950/30 dark:text-amber-100">
            {tableMissing ? (
              <>Analytics is built, but the database tables are not installed yet. Run <code>supabase/analytics.sql</code> in Supabase SQL editor, then refresh this page.</>
            ) : error}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Visitors" value={String(data?.summary.visitors ?? 0)} icon={Users} helper="Unique browsers" />
          <StatCard label="Sessions" value={String(data?.summary.sessions ?? 0)} icon={Activity} helper="Visits started" />
          <StatCard label="Pageviews" value={String(data?.summary.pageviews ?? 0)} icon={Eye} helper="Pages opened" />
          <StatCard label="Avg time" value={formatDuration(data?.summary.avgDurationSeconds ?? 0)} icon={Clock3} helper="Per session" />
          <StatCard label="Active now" value={String(data?.summary.activeNow ?? 0)} icon={BarChart3} helper="Seen in 5 min" />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
          <section className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
            <h2 className="text-lg font-semibold">Daily activity</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Pageviews by day, with visitor and session counts.</p>
            <div className="mt-6 space-y-4">
              {loading ? <p className="py-10 text-center text-slate-500">Loading analytics…</p> : data?.daily.length ? data.daily.map((row) => (
                <div key={row.date} className="grid gap-2 sm:grid-cols-[110px_1fr_190px] sm:items-center">
                  <div className="text-sm font-medium text-slate-600 dark:text-slate-300">{row.date}</div>
                  <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                    <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400" style={{ width: `${Math.max(4, (row.pageviews / maxDaily) * 100)}%` }} />
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">{row.pageviews} views • {row.visitors} visitors • {row.sessions} sessions</div>
                </div>
              )) : <p className="py-10 text-center text-slate-500">No analytics yet. Visit the live site, then refresh.</p>}
            </div>
          </section>

          <section className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
            <h2 className="text-lg font-semibold">Top pages</h2>
            <div className="mt-4 space-y-3">
              {data?.topPages.length ? data.topPages.map((page) => (
                <div key={page.path} className="rounded-2xl bg-slate-50 p-3 text-sm dark:bg-white/5">
                  <div className="flex justify-between gap-3">
                    <span className="truncate font-medium text-slate-900 dark:text-white">{page.path}</span>
                    <span className="tabular-nums text-emerald-700 dark:text-emerald-300">{page.views}</span>
                  </div>
                </div>
              )) : <p className="text-sm text-slate-500 dark:text-slate-400">No pageviews yet.</p>}
            </div>
          </section>
        </div>

        <section className="overflow-hidden rounded-3xl border border-white/70 bg-white/90 shadow-sm dark:border-white/10 dark:bg-white/5">
          <div className="border-b border-slate-200/70 p-5 dark:border-white/10">
            <h2 className="text-lg font-semibold">Recent sessions</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Newest visits first. Visitor IDs are anonymous browser IDs.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-white/10">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:bg-white/5 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-3">Started</th>
                  <th className="px-5 py-3">IP / Location</th>
                  <th className="px-5 py-3">Duration</th>
                  <th className="px-5 py-3">Landing</th>
                  <th className="px-5 py-3">Last page</th>
                  <th className="px-5 py-3">Referrer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                {data?.recentSessions.length ? data.recentSessions.map((session) => (
                  <tr key={session.id}>
                    <td className="whitespace-nowrap px-5 py-4 text-slate-500 dark:text-slate-400">{dateTime(session.startedAt)}</td>
                    <td className="px-5 py-4">
                      <div className="font-medium tabular-nums">{session.ipAddress || 'Unknown IP'}</div>
                      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{formatLocation(session)}</div>
                    </td>
                    <td className="px-5 py-4 font-medium tabular-nums">{formatDuration(session.durationSeconds)}</td>
                    <td className="px-5 py-4">{session.landingPath}</td>
                    <td className="px-5 py-4">{session.lastPath}</td>
                    <td className="max-w-xs truncate px-5 py-4 text-slate-500 dark:text-slate-400">{session.referrer || 'Direct / unknown'}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-500">No sessions yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
