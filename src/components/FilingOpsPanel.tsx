import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

type Entity = Record<string, unknown>;

type OpsSnapshot = {
  matter?: Entity | null;
  latestSubmission?: Entity | null;
  documents?: Entity[];
  serviceRequests?: Entity[];
  webhookEvents?: Entity[];
};

function Field({ label, value }: { label: string; value: unknown }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-sm text-slate-900 break-words">{value == null || value === '' ? '—' : String(value)}</p>
    </div>
  );
}

function JsonDetails({ title, data }: { title: string; data: unknown }) {
  return (
    <details className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <summary className="cursor-pointer text-sm font-medium text-slate-700">{title}</summary>
      <pre className="mt-3 overflow-auto rounded bg-slate-950 p-3 text-xs text-slate-100">{JSON.stringify(data, null, 2)}</pre>
    </details>
  );
}

export function FilingOpsPanel() {
  const [matterId, setMatterId] = useState('matter_test_001');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<OpsSnapshot | null>(null);

  const loadSnapshot = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/ops-filing?matterId=${encodeURIComponent(matterId)}`);
      const raw = await response.text();

      let data: OpsSnapshot | { error?: string } | null = null;
      if (raw) {
        try {
          data = JSON.parse(raw);
        } catch {
          throw new Error(raw.length > 180 ? `${raw.slice(0, 180)}…` : raw);
        }
      }

      if (!response.ok) {
        const message = data && typeof data === 'object' && 'error' in data && typeof data.error === 'string'
          ? data.error
          : `Request failed with status ${response.status}`;
        throw new Error(message);
      }

      setSnapshot((data as OpsSnapshot) ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setSnapshot(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle>Filing ops debug</CardTitle>
        <CardDescription>Inspect matter state, submissions, documents, service requests, and webhook activity in one place.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input value={matterId} onChange={(e) => setMatterId(e.target.value)} placeholder="matter_test_001" />
          <Button onClick={loadSnapshot} disabled={loading || !matterId.trim()}>
            {loading ? 'Loading...' : 'Load snapshot'}
          </Button>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <p className="text-xs text-slate-500">
          Internal staff debug panel. If this shows a server error, the filing ops API or Supabase filing tables are not ready yet.
        </p>

        {snapshot?.matter && (
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  Matter
                  <Badge variant="outline">{String(snapshot.matter.status ?? 'unknown')}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                <Field label="ID" value={snapshot.matter.id} />
                <Field label="Provider" value={snapshot.matter.provider} />
                <Field label="Case Type" value={snapshot.matter.caseType} />
                <Field label="County" value={snapshot.matter.county} />
                <Field label="Court" value={snapshot.matter.court} />
                <Field label="Updated" value={snapshot.matter.updatedAt} />
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  Latest submission
                  <Badge variant="outline">{String(snapshot.latestSubmission?.status ?? 'none')}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                <Field label="Submission ID" value={snapshot.latestSubmission?.id} />
                <Field label="Provider ID" value={snapshot.latestSubmission?.providerSubmissionId} />
                <Field label="Type" value={snapshot.latestSubmission?.submissionType} />
                <Field label="Submitted" value={snapshot.latestSubmission?.submittedAt} />
                <Field label="Accepted" value={snapshot.latestSubmission?.acceptedAt} />
                <Field label="Rejected" value={snapshot.latestSubmission?.rejectedAt} />
              </CardContent>
            </Card>
          </div>
        )}

        {snapshot && (
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Documents</CardTitle>
                <CardDescription>{snapshot.documents?.length ?? 0} linked documents</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {(snapshot.documents ?? []).length === 0 ? (
                  <p className="text-sm text-slate-500">No documents stored yet.</p>
                ) : (
                  (snapshot.documents ?? []).map((doc) => (
                    <div key={String(doc.id)} className="rounded-lg border border-slate-200 p-3 text-sm">
                      <p className="font-medium text-slate-900">{String(doc.title ?? doc.id)}</p>
                      <p className="text-slate-500">{String(doc.courtFormCode ?? doc.kind ?? 'document')}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Service requests</CardTitle>
                <CardDescription>{snapshot.serviceRequests?.length ?? 0} logged requests</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {(snapshot.serviceRequests ?? []).length === 0 ? (
                  <p className="text-sm text-slate-500">No service requests yet.</p>
                ) : (
                  (snapshot.serviceRequests ?? []).map((item) => (
                    <div key={String(item.id)} className="rounded-lg border border-slate-200 p-3 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-slate-900">{String(item.recipientName ?? item.id)}</p>
                        <Badge variant="outline">{String(item.status ?? 'unknown')}</Badge>
                      </div>
                      <p className="mt-1 text-slate-500">{String(item.address ?? '—')}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Webhook events</CardTitle>
                <CardDescription>{snapshot.webhookEvents?.length ?? 0} recent events</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {(snapshot.webhookEvents ?? []).length === 0 ? (
                  <p className="text-sm text-slate-500">No webhook activity yet.</p>
                ) : (
                  (snapshot.webhookEvents ?? []).slice(0, 5).map((event) => (
                    <div key={String(event.id)} className="rounded-lg border border-slate-200 p-3 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-slate-900">{String(event.event_type ?? 'event')}</p>
                        <p className="text-xs text-slate-500">{String(event.received_at ?? '')}</p>
                      </div>
                      <p className="mt-1 text-slate-500">{String(event.external_id ?? 'No external id')}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {snapshot && (
          <JsonDetails title="Raw ops snapshot" data={snapshot} />
        )}
      </CardContent>
    </Card>
  );
}
