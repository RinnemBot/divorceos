import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { User } from '@/services/auth';
import type {
  FilingQueueItem,
  FilingQueueSummary,
  FilingRequestStatus,
  FilingRequestPriority,
} from '@/types/concierge';
import {
  FILING_REQUEST_PRIORITY_LABELS,
  FILING_REQUEST_STATUS_BADGE_VARIANT,
  FILING_REQUEST_STATUS_LABELS,
  FILING_REQUEST_STATUS_ORDER,
} from '@/types/concierge';
import { Loader2, RefreshCcw, Search, Users, AlertCircle, CheckCircle2, Clock, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface ConciergeQueuePanelProps {
  currentUser: User;
}

type StatusFilter = 'active' | 'all' | FilingRequestStatus;
type PriorityFilter = 'all' | FilingRequestPriority;

const STATUS_FILTER_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'all', label: 'All' },
  ...FILING_REQUEST_STATUS_ORDER.map((status) => ({
    value: status,
    label: FILING_REQUEST_STATUS_LABELS[status],
  })),
];

const PRIORITY_FILTER_OPTIONS: { value: PriorityFilter; label: string }[] = [
  { value: 'all', label: 'All priorities' },
  { value: 'rush', label: 'Rush only' },
  { value: 'standard', label: 'Standard only' },
];

export function ConciergeQueuePanel({ currentUser }: ConciergeQueuePanelProps) {
  const [requests, setRequests] = useState<FilingQueueItem[]>([]);
  const [summary, setSummary] = useState<FilingQueueSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadQueue = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/filing-queue?limit=150');
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Failed to load queue');
      }
      const payload = await response.json();
      setRequests(Array.isArray(payload.requests) ? payload.requests : []);
      setSummary(payload.summary ?? null);
    } catch (err) {
      console.error('Queue load failed', err);
      setError(err instanceof Error ? err.message : 'Unable to load queue');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      const matchesStatus = (() => {
        if (statusFilter === 'all') return true;
        if (statusFilter === 'active') {
          return request.status !== 'complete' && request.status !== 'on-hold';
        }
        return request.status === statusFilter;
      })();

      const matchesPriority =
        priorityFilter === 'all' ? true : request.priority === priorityFilter;

      const matchesSearch = searchTerm
        ? [request.customerName, request.customerEmail, request.countyName]
            .filter(Boolean)
            .some((value) => value!.toLowerCase().includes(searchTerm.toLowerCase()))
        : true;

      return matchesStatus && matchesPriority && matchesSearch;
    });
  }, [requests, statusFilter, priorityFilter, searchTerm]);

  const formatDate = (value?: string | null) => {
    if (!value) return '—';
    const date = new Date(value);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const handleStatusChange = async (requestId: string, nextStatus: FilingRequestStatus) => {
    setUpdatingId(requestId);
    try {
      const response = await fetch('/api/filing-queue', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: requestId,
          updates: {
            status: nextStatus,
            claimedBy: currentUser.name || currentUser.email,
            claimedByEmail: currentUser.email,
          },
        }),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Failed to update status');
      }

      const payload = await response.json();
      const updated: FilingQueueItem = payload.request;
      setRequests((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      toast.success(`Status updated to ${FILING_REQUEST_STATUS_LABELS[nextStatus]}`);
    } catch (err) {
      console.error('Failed to update status', err);
      toast.error(err instanceof Error ? err.message : 'Unable to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleClaimToggle = async (request: FilingQueueItem) => {
    const isClaiming = !request.claimedBy;
    setUpdatingId(request.id);
    try {
      const response = await fetch('/api/filing-queue', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: request.id,
          updates: {
            claimedBy: isClaiming ? currentUser.name || currentUser.email : null,
            claimedByEmail: isClaiming ? currentUser.email : null,
          },
        }),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Failed to update assignment');
      }

      const payload = await response.json();
      const updated: FilingQueueItem = payload.request;
      setRequests((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      toast.success(isClaiming ? 'Request claimed' : 'Request released');
    } catch (err) {
      console.error('Failed to toggle claim', err);
      toast.error(err instanceof Error ? err.message : 'Unable to update assignment');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <Card className="border-emerald-100">
      <CardHeader className="space-y-2">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="text-2xl">Concierge filing queue</CardTitle>
            <CardDescription>
              Supabase-backed pipeline for e-filing + concierge requests. Update statuses and assignments in real time.
            </CardDescription>
          </div>
          <Button variant="outline" onClick={loadQueue} disabled={isLoading} className="w-full lg:w-auto">
            {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCcw className="h-4 w-4 mr-2" />}
            Refresh
          </Button>
        </div>
        {summary && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryStat label="Active" value={summary.active} icon={Users} accent="text-emerald-600" />
            <SummaryStat label="Rush" value={summary.rush} icon={AlertCircle} accent="text-amber-600" />
            <SummaryStat label="Awaiting client" value={summary.awaitingClient} icon={Clock} accent="text-blue-600" />
            <SummaryStat label="Need claim" value={summary.needsClaim} icon={CheckCircle2} accent="text-slate-600" />
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
              <SelectTrigger className="sm:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTER_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={(value) => setPriorityFilter(value as PriorityFilter)}>
              <SelectTrigger className="sm:w-40">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                {PRIORITY_FILTER_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="relative">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              className="pl-10"
              placeholder="Search by name, email, county"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading queue…
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-16 text-slate-500 border border-dashed rounded-2xl">
            No requests match your filters yet.
          </div>
        ) : (
          <ScrollArea className="w-full">
            <div className="min-w-[960px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>County</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead>Assignee</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request.id} className="align-top">
                      <TableCell>
                        <div className="font-semibold text-slate-900">{request.customerName}</div>
                        <div className="text-xs text-slate-500">{request.customerEmail || 'No email on file'}</div>
                        {request.documents?.length ? (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {request.documents.map((doc) => (
                              <a
                                key={`${request.id}-${doc.name}-${doc.storagePath}`}
                                href={doc.downloadUrl ?? undefined}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-xs text-emerald-700 hover:underline"
                              >
                                <FileText className="h-3 w-3 mr-1" />
                                {doc.name}
                              </a>
                            ))}
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium text-slate-800">{request.countyName ?? '—'}</div>
                        <div className="text-xs text-slate-500">{request.plan ?? 'Plan TBD'}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-2">
                          <Badge variant={FILING_REQUEST_STATUS_BADGE_VARIANT[request.status]} className="w-fit">
                            {FILING_REQUEST_STATUS_LABELS[request.status]}
                          </Badge>
                          <Select
                            value={request.status}
                            onValueChange={(value) => handleStatusChange(request.id, value as FilingRequestStatus)}
                            disabled={updatingId === request.id}
                          >
                            <SelectTrigger className="w-40 text-sm">
                              <SelectValue placeholder="Update status" />
                            </SelectTrigger>
                            <SelectContent>
                              {FILING_REQUEST_STATUS_ORDER.map((status) => (
                                <SelectItem key={status} value={status}>
                                  {FILING_REQUEST_STATUS_LABELS[status]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={request.priority === 'rush' ? 'destructive' : 'outline'}>
                          {FILING_REQUEST_PRIORITY_LABELS[request.priority]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">{formatDate(request.submittedAt)}</TableCell>
                      <TableCell className="text-sm text-slate-600">{formatDate(request.nextDeadline)}</TableCell>
                      <TableCell>
                        {request.claimedBy ? (
                          <div className="text-sm font-medium text-slate-800">{request.claimedBy}</div>
                        ) : (
                          <span className="text-xs uppercase tracking-wide text-slate-400">Unassigned</span>
                        )}
                        <div className="text-xs text-slate-500">
                          {request.claimedAt ? `Since ${formatDate(request.claimedAt)}` : ''}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant={request.claimedBy ? 'secondary' : 'default'}
                          onClick={() => handleClaimToggle(request)}
                          disabled={updatingId === request.id}
                        >
                          {request.claimedBy ? 'Release' : 'Claim'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

interface SummaryStatProps {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}

function SummaryStat({ label, value, icon: Icon, accent }: SummaryStatProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className={`flex items-center gap-2 text-sm font-semibold ${accent}`}>
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <div className="text-2xl font-bold text-slate-900 mt-1">{value}</div>
    </div>
  );
}
