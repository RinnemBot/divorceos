import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { CaseRemindersPanel } from '@/components/CaseRemindersPanel';
import { CountyRoadmap } from '@/components/CountyRoadmap';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ReferralProgram, fetchReferralSnapshot } from '@/components/ReferralProgram';
import { ReviewSystem } from '@/components/ReviewSystem';
import { SavedScenariosPanel } from '@/components/SavedScenariosPanel';
import { ConciergeQueuePanel } from '@/components/ConciergeQueuePanel';
import { FilingOpsPanel } from '@/components/FilingOpsPanel';
import { COURT_FORMS } from '@/data/forms';
import { COUNTY_GUIDES } from '@/data/countyGuides';
import { authService, SUBSCRIPTION_LIMITS, type User } from '@/services/auth';
import { listDraftWorkspaces } from '@/services/formDrafts';
import {
  LayoutDashboard,
  Files,
  MapPinned,
  BellRing,
  Gift,
  Star,
  ClipboardCheck,
  FileText,
  Users,
  ChevronRight,
  UploadCloud,
  Shield,
  Loader2,
  Download,
} from 'lucide-react';

type FilingTrackerStepId = 'generated' | 'filed' | 'served' | 'proof-filed' | 'clerk-review' | 'accepted';

interface FilingTrackerState {
  completed: Record<FilingTrackerStepId, boolean>;
  updatedAtByStep: Partial<Record<FilingTrackerStepId, string>>;
  notes: string;
  updatedAt?: string;
}

const SERVICE_TASKS = [
  {
    id: 'prep-fl115',
    title: 'Prepare FL-115 (Proof of Service)',
    detail: 'Fill in server information and attach any supporting documents before the hearing date.',
  },
  {
    id: 'choose-server',
    title: 'Assign a Server',
    detail: 'Pick a neutral adult or professional server. Provide them with stamped copies and instructions.',
  },
  {
    id: 'file-proof',
    title: 'File Proof with the Court',
    detail: 'Once service is complete, file FL-115 or e-file it in the county portal within 5 days.',
  },
  {
    id: 'update-spouse',
    title: 'Confirm With Opposing Party',
    detail: 'Note any deadlines for responses and calendar mediation dates that the clerk provides.',
  },
];

const FILING_TRACKER_STEPS: Array<{
  id: FilingTrackerStepId;
  title: string;
  detail: string;
  tab?: string;
}> = [
  {
    id: 'generated',
    title: 'Packet generated',
    detail: 'Draft Forms packet or county packet manifest is ready for review.',
    tab: 'saved',
  },
  {
    id: 'filed',
    title: 'Packet filed with court',
    detail: 'Submitted through e-file, clerk window, drop box, or mail.',
    tab: 'county',
  },
  {
    id: 'served',
    title: 'Other party served',
    detail: 'A neutral adult or process server completed service.',
    tab: 'service',
  },
  {
    id: 'proof-filed',
    title: 'Proof of service filed',
    detail: 'FL-115 / FL-330 / FL-335 or other proof is filed with the court.',
    tab: 'service',
  },
  {
    id: 'clerk-review',
    title: 'Waiting for clerk review',
    detail: 'Court is reviewing filed documents or issuing stamped copies/rejections.',
    tab: 'county',
  },
  {
    id: 'accepted',
    title: 'Accepted / stamped copies received',
    detail: 'Filing accepted; save stamped copies and calendar the next deadline.',
    tab: 'saved',
  },
];

function createDefaultFilingTracker(): FilingTrackerState {
  return {
    completed: {
      generated: false,
      filed: false,
      served: false,
      'proof-filed': false,
      'clerk-review': false,
      accepted: false,
    },
    updatedAtByStep: {},
    notes: '',
  };
}

function getFilingTrackerStorageKey(userId?: string) {
  return `divorceos:filing-tracker:${userId || 'local'}`;
}

function loadFilingTracker(userId?: string): FilingTrackerState {
  if (typeof window === 'undefined') return createDefaultFilingTracker();
  try {
    const raw = window.localStorage.getItem(getFilingTrackerStorageKey(userId));
    if (!raw) return createDefaultFilingTracker();
    const parsed = JSON.parse(raw) as Partial<FilingTrackerState>;
    const defaults = createDefaultFilingTracker();
    return {
      completed: { ...defaults.completed, ...(parsed.completed ?? {}) },
      updatedAtByStep: parsed.updatedAtByStep ?? {},
      notes: typeof parsed.notes === 'string' ? parsed.notes : '',
    };
  } catch (error) {
    console.error('Failed to load filing tracker', error);
    return createDefaultFilingTracker();
  }
}

const FEATURED_FORM_IDS = ['fl-100', 'fl-110', 'fl-115', 'fl-300', 'fl-150', 'fl-311', 'fl-346'];
const DASHBOARD_TABS = ['overview', 'reminders', 'documents', 'county', 'service', 'saved', 'referral', 'review', 'staff'] as const;

const COMMAND_CENTER_CARDS = [
  {
    title: 'What should I file?',
    description: 'Answer a few questions and get the right packet path.',
    icon: ClipboardCheck,
    href: '/what-do-i-need',
    cta: 'Run wizard',
    tone: 'from-emerald-500/18 via-white to-cyan-500/10 dark:from-emerald-400/15 dark:via-white/5 dark:to-cyan-400/10',
  },
  {
    title: 'Generate forms',
    description: 'Open your structured Draft Forms workspace.',
    icon: FileText,
    href: '/draft-forms',
    cta: 'Draft packet',
    tone: 'from-sky-500/16 via-white to-emerald-500/10 dark:from-sky-400/15 dark:via-white/5 dark:to-emerald-400/10',
  },
  {
    title: 'County filing',
    description: 'Check local filing, e-file, and service steps.',
    icon: MapPinned,
    href: '/concierge',
    cta: 'Open concierge',
    tone: 'from-amber-400/18 via-white to-emerald-500/10 dark:from-amber-300/15 dark:via-white/5 dark:to-emerald-400/10',
  },
  {
    title: 'Saved files',
    description: 'Find generated PDFs and uploaded documents.',
    icon: Files,
    tab: 'saved',
    cta: 'View files',
    tone: 'from-violet-500/16 via-white to-sky-500/10 dark:from-violet-400/15 dark:via-white/5 dark:to-sky-400/10',
  },
] as const;

interface VaultDocument {
  id: string;
  name: string;
  size: number;
  uploadedAt: string;
  downloadUrl: string | null;
}

const formatBytes = (bytes: number) => {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );
  const value = bytes / Math.pow(1024, exponent);
  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`;
};

const VAULT_MAX_FILE_SIZE = 10 * 1024 * 1024;

export function DashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(() => authService.getCurrentUser());
  const [activeTab, setActiveTab] = useState(() => {
    const tab = new URLSearchParams(location.search).get('tab');
    return tab && DASHBOARD_TABS.includes(tab as typeof DASHBOARD_TABS[number]) ? tab : 'overview';
  });
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [filingTracker, setFilingTracker] = useState<FilingTrackerState>(() => loadFilingTracker());
  const [referralStats, setReferralStats] = useState<{
    totalReferrals: number;
    completedReferrals: number;
    pendingReferrals: number;
    totalRewardsEarned: number;
    availableCredit: number;
  } | null>(null);
  const [vaultDocs, setVaultDocs] = useState<VaultDocument[]>([]);
  const [isVaultLoading, setIsVaultLoading] = useState(false);
  const [vaultError, setVaultError] = useState<string | null>(null);
  const [isVaultUploading, setIsVaultUploading] = useState(false);
  const [isFilingTrackerLoading, setIsFilingTrackerLoading] = useState(false);
  const [filingTrackerError, setFilingTrackerError] = useState<string | null>(null);
  const [filingTrackerLastSyncedAt, setFilingTrackerLastSyncedAt] = useState<string | null>(null);
  const vaultFileInputRef = useRef<HTMLInputElement>(null);
  const filingTrackerLoadedRef = useRef(false);
  const filingTrackerSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isStaffUser = useMemo(() => (user ? authService.isConciergeStaff(user) : false), [user]);
  const draftWorkspaces = useMemo(() => (user ? listDraftWorkspaces(user.id) : []), [user]);
  const latestDraftWorkspace = draftWorkspaces[0] ?? null;

  useEffect(() => {
    const session = authService.getCurrentUser();
    if (!session) {
      navigate('/');
      return;
    }
    setUser(session);
    void fetchReferralSnapshot()
      .then((snapshot) => setReferralStats(snapshot.stats))
      .catch((error) => {
        console.error('Failed to load referral stats', error);
        setReferralStats(null);
      });
  }, [navigate]);

  useEffect(() => {
    if (!user?.id) return;

    let cancelled = false;
    filingTrackerLoadedRef.current = false;
    setIsFilingTrackerLoading(true);
    setFilingTrackerError(null);
    setFilingTracker(loadFilingTracker(user.id));

    const loadRemoteTracker = async () => {
      try {
        const remoteTracker = await authService.getFilingTracker();
        if (cancelled) return;
        setFilingTracker(remoteTracker);
        setFilingTrackerLastSyncedAt(remoteTracker.updatedAt ?? new Date().toISOString());
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(getFilingTrackerStorageKey(user.id), JSON.stringify(remoteTracker));
        }
      } catch (error) {
        console.error('Failed to load filing tracker from Supabase', error);
        if (!cancelled) {
          setFilingTrackerError(error instanceof Error ? error.message : 'Unable to sync filing tracker. Local backup is still available.');
        }
      } finally {
        if (!cancelled) {
          filingTrackerLoadedRef.current = true;
          setIsFilingTrackerLoading(false);
        }
      }
    };

    void loadRemoteTracker();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || typeof window === 'undefined') return;
    window.localStorage.setItem(getFilingTrackerStorageKey(user.id), JSON.stringify(filingTracker));

    if (!filingTrackerLoadedRef.current) return;
    if (filingTrackerSaveTimerRef.current) {
      clearTimeout(filingTrackerSaveTimerRef.current);
    }

    filingTrackerSaveTimerRef.current = setTimeout(() => {
      void authService.saveFilingTracker(filingTracker)
        .then((savedTracker) => {
          setFilingTrackerError(null);
          setFilingTrackerLastSyncedAt(savedTracker.updatedAt ?? new Date().toISOString());
          window.localStorage.setItem(getFilingTrackerStorageKey(user.id), JSON.stringify(savedTracker));
        })
        .catch((error) => {
          console.error('Failed to save filing tracker to Supabase', error);
          setFilingTrackerError(error instanceof Error ? error.message : 'Unable to sync filing tracker. Local backup is still available.');
        });
    }, 500);

    return () => {
      if (filingTrackerSaveTimerRef.current) {
        clearTimeout(filingTrackerSaveTimerRef.current);
      }
    };
  }, [filingTracker, user?.id]);

  useEffect(() => {
    const tab = new URLSearchParams(location.search).get('tab');
    if (tab && DASHBOARD_TABS.includes(tab as typeof DASHBOARD_TABS[number])) {
      setActiveTab(tab);
    }
  }, [location.search]);

  const fetchVaultDocuments = useCallback(async () => {
    if (!user?.id) {
      setVaultDocs([]);
      return;
    }

    setIsVaultLoading(true);
    setVaultError(null);

    try {
      const response = await fetch('/api/vault-documents', {
        credentials: 'same-origin',
      });
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Unable to load documents');
      }

      const payload = await response.json();
      setVaultDocs(payload.documents ?? []);
    } catch (error) {
      setVaultError(
        error instanceof Error ? error.message : 'Unable to load documents'
      );
    } finally {
      setIsVaultLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchVaultDocuments();
  }, [fetchVaultDocuments]);

  useEffect(() => {
    const handleCreated = () => {
      void fetchVaultDocuments();
    };

    window.addEventListener('divorceos:vault-document-created', handleCreated);
    return () => window.removeEventListener('divorceos:vault-document-created', handleCreated);
  }, [fetchVaultDocuments]);

  const triggerVaultPicker = () => {
    vaultFileInputRef.current?.click();
  };

  const handleVaultFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!user?.id) return;
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setVaultError('Only PDF uploads are supported right now.');
      event.target.value = '';
      return;
    }

    if (file.size > VAULT_MAX_FILE_SIZE) {
      setVaultError('File is larger than 10 MB. Please compress it before uploading.');
      event.target.value = '';
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setIsVaultUploading(true);
    setVaultError(null);

    try {
      const response = await fetch('/api/vault-upload', {
        method: 'POST',
        body: formData,
        credentials: 'same-origin',
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Upload failed');
      }

      const payload = await response.json();
      if (payload.document) {
        setVaultDocs((prev) => [payload.document, ...prev]);
      } else {
        await fetchVaultDocuments();
      }
    } catch (error) {
      setVaultError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsVaultUploading(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  if (!user) {
    return null;
  }

  const planInfo = SUBSCRIPTION_LIMITS[user.subscription];
  const preferredCountyId = useMemo(() => {
    if (!user.profile?.county) return undefined;
    const match = COUNTY_GUIDES.find(
      (guide) => guide.name.toLowerCase() === user.profile!.county!.toLowerCase()
    );
    return match?.id;
  }, [user.profile?.county]);

  const featuredForms = COURT_FORMS.filter((form) =>
    FEATURED_FORM_IDS.includes(form.id)
  );

  const toggleTask = (taskId: string) => {
    setCompletedTasks((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId]
    );
  };

  const completionPercent = Math.round(
    (completedTasks.length / SERVICE_TASKS.length) * 100
  );

  const filingCompletedCount = FILING_TRACKER_STEPS.filter((step) => filingTracker.completed[step.id]).length;
  const filingProgressPercent = Math.round((filingCompletedCount / FILING_TRACKER_STEPS.length) * 100);
  const nextFilingStep = FILING_TRACKER_STEPS.find((step) => !filingTracker.completed[step.id]);

  const toggleFilingTrackerStep = (stepId: FilingTrackerStepId) => {
    setFilingTracker((current) => {
      const nextValue = !current.completed[stepId];
      const nextUpdatedAtByStep = { ...current.updatedAtByStep };
      if (nextValue) {
        nextUpdatedAtByStep[stepId] = new Date().toISOString();
      } else {
        delete nextUpdatedAtByStep[stepId];
      }

      return {
        ...current,
        completed: {
          ...current.completed,
          [stepId]: nextValue,
        },
        updatedAtByStep: nextUpdatedAtByStep,
      };
    });
  };

  const resetFilingTracker = () => {
    setFilingTracker(createDefaultFilingTracker());
  };

  const vaultPanel = (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-emerald-600" />
          Document vault
        </CardTitle>
        <CardDescription>Maria PDFs and uploaded packets live here.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="text-sm text-slate-600 lg:w-2/3">
            <p className="mb-2">
              Stored documents live in an encrypted Supabase bucket. Maria-saved PDFs and your uploaded court packets should both appear here.
            </p>
            <p>PDF only • 10 MB max • Need edits first? Attach drafts in chat and I&apos;ll clean them before saving.</p>
          </div>
          <div className="flex flex-col gap-2 lg:w-1/3">
            <input
              ref={vaultFileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleVaultFileChange}
            />
            <Button onClick={triggerVaultPicker} disabled={isVaultUploading} className="justify-center">
              {isVaultUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading…
                </>
              ) : (
                <>
                  <UploadCloud className="h-4 w-4 mr-2" />
                  Upload PDF
                </>
              )}
            </Button>
            <span className="text-xs text-slate-500">Don&apos;t leave this tab while uploading. We&apos;ll refresh the vault automatically once it finishes.</span>
          </div>
        </div>
        {vaultError && (
          <Alert variant="destructive">
            <AlertDescription>{vaultError}</AlertDescription>
          </Alert>
        )}
        <div className="rounded-2xl border border-slate-200 overflow-hidden">
          {isVaultLoading ? (
            <div className="p-6 text-sm text-slate-500">Loading vault…</div>
          ) : vaultDocs.length === 0 ? (
            <div className="p-6 text-sm text-slate-500">Nothing in your vault yet. Upload your first stamped packet to kick things off.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Document</th>
                    <th className="px-4 py-3">Uploaded</th>
                    <th className="px-4 py-3">Size</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {vaultDocs.map((doc) => (
                    <tr key={doc.id} className="border-t border-slate-100">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800">{doc.name}</p>
                        <p className="text-xs text-slate-500">Stored securely in Divorce Agent</p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {new Date(doc.uploadedAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{formatBytes(doc.size)}</td>
                      <td className="px-4 py-3 text-right">
                        {doc.downloadUrl ? (
                          <Button asChild size="sm" variant="outline">
                            <a href={doc.downloadUrl} target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </a>
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" disabled>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_14%_0%,rgba(16,185,129,0.16),transparent_24%),radial-gradient(circle_at_86%_8%,rgba(34,211,238,0.14),transparent_20%),linear-gradient(180deg,#f3fff8_0%,#eefcf8_44%,#f8fafc_100%)] py-10 dark:bg-[radial-gradient(circle_at_16%_0%,rgba(16,185,129,0.24),transparent_24%),radial-gradient(circle_at_84%_10%,rgba(34,211,238,0.16),transparent_20%),linear-gradient(180deg,#020617_0%,#03111f_50%,#020617_100%)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col gap-2">
          <p className="text-sm uppercase tracking-wide text-emerald-600 font-semibold flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Case Dashboard
          </p>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Welcome back, {user.name || user.email.split('@')[0]}</h1>
              <p className="text-slate-600">Monitor filings, documents, service attempts, referrals, and reviews from one workspace.</p>
            </div>
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 self-start lg:self-auto dark:bg-emerald-400/15 dark:text-emerald-200">
              {planInfo.name} Plan
            </Badge>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList
            className={cn(
              'grid w-full grid-cols-2 sm:grid-cols-3 rounded-xl border border-white/80 bg-white/72 backdrop-blur-xl dark:border-white/10 dark:bg-white/5',
              isStaffUser ? 'lg:grid-cols-9' : 'lg:grid-cols-8'
            )}
          >
            <TabsTrigger value="overview" className="data-[state=active]:bg-emerald-700 data-[state=active]:text-white">Overview</TabsTrigger>
            <TabsTrigger value="reminders" className="data-[state=active]:bg-emerald-700 data-[state=active]:text-white">Reminders</TabsTrigger>
            <TabsTrigger value="documents" className="data-[state=active]:bg-emerald-700 data-[state=active]:text-white">Documents</TabsTrigger>
            <TabsTrigger value="county" className="data-[state=active]:bg-emerald-700 data-[state=active]:text-white">County Filing</TabsTrigger>
            <TabsTrigger value="service" className="data-[state=active]:bg-emerald-700 data-[state=active]:text-white">Service</TabsTrigger>
            <TabsTrigger value="saved" className="data-[state=active]:bg-emerald-700 data-[state=active]:text-white">Saved Files</TabsTrigger>
            <TabsTrigger value="referral" className="data-[state=active]:bg-emerald-700 data-[state=active]:text-white">Referral</TabsTrigger>
            <TabsTrigger value="review" className="data-[state=active]:bg-emerald-700 data-[state=active]:text-white">Review</TabsTrigger>
            {isStaffUser && <TabsTrigger value="staff" className="data-[state=active]:bg-emerald-700 data-[state=active]:text-white">Staff</TabsTrigger>}
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {COMMAND_CENTER_CARDS.map((card) => {
                const Icon = card.icon;
                const content = (
                  <Card className={cn('h-full overflow-hidden rounded-[1.5rem] border-white/80 bg-gradient-to-br shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg dark:border-white/10', card.tone)}>
                    <CardContent className="flex h-full flex-col justify-between p-5">
                      <div>
                        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/80 text-emerald-700 shadow-sm dark:bg-white/10 dark:text-emerald-200">
                          <Icon className="h-5 w-5" />
                        </div>
                        <h3 className="font-semibold text-slate-950 dark:text-white">{card.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{card.description}</p>
                      </div>
                      <div className="mt-5 inline-flex items-center text-sm font-semibold text-emerald-700 dark:text-emerald-200">
                        {card.cta}
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </div>
                    </CardContent>
                  </Card>
                );

                if ('href' in card) {
                  return <Link key={card.title} to={card.href}>{content}</Link>;
                }

                return (
                  <button key={card.title} type="button" className="text-left" onClick={() => setActiveTab(card.tab)}>
                    {content}
                  </button>
                );
              })}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Files className="h-4 w-4 text-blue-600" />
                    Subscription Snapshot
                  </CardTitle>
                  <CardDescription>
                    Track daily chat usage and plan benefits.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-slate-500">Today&apos;s chat allotment</span>
                    <p className="text-2xl font-semibold">
                      {planInfo.maxChats === Infinity
                        ? 'Unlimited'
                        : `${Math.max(0, planInfo.maxChats - user.chatCount)} / ${planInfo.maxChats}`}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-sm text-slate-500">
                    <span>Next reset</span>
                    <span>{new Date(user.chatCountResetDate).toLocaleDateString()}</span>
                  </div>
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/pricing">
                      Manage plan
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardCheck className="h-4 w-4 text-emerald-600" />
                    Quick Actions
                  </CardTitle>
                  <CardDescription>
                    Jump directly to the workstream you need.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3">
                  <Button variant="ghost" className="justify-start" asChild>
                    <Link to="/what-do-i-need">
                      <ClipboardCheck className="h-4 w-4 mr-2 text-emerald-600" />
                      Help me choose what to file
                    </Link>
                  </Button>
                  <Button variant="ghost" className="justify-start" asChild>
                    <Link to="/draft-forms">
                      <FileText className="h-4 w-4 mr-2 text-slate-500" />
                      Open Draft Forms
                    </Link>
                  </Button>
                  <Button variant="ghost" className="justify-start" onClick={() => setActiveTab('documents')}>
                    <FileText className="h-4 w-4 mr-2 text-slate-500" />
                    Open court forms
                  </Button>
                  <Button variant="ghost" className="justify-start" onClick={() => setActiveTab('reminders')}>
                    <BellRing className="h-4 w-4 mr-2 text-slate-500" />
                    Review reminders
                  </Button>
                  <Button variant="ghost" className="justify-start" onClick={() => setActiveTab('county')}>
                    <MapPinned className="h-4 w-4 mr-2 text-slate-500" />
                    Check county filing steps
                  </Button>
                  <Button variant="ghost" className="justify-start" onClick={() => setActiveTab('saved')}>
                    <FileText className="h-4 w-4 mr-2 text-slate-500" />
                    Open saved files
                  </Button>
                  <Button variant="ghost" className="justify-start" onClick={() => setActiveTab('referral')}>
                    <Gift className="h-4 w-4 mr-2 text-slate-500" />
                    Share referral link
                  </Button>
                  <Button variant="ghost" className="justify-start" onClick={() => setActiveTab('review')}>
                    <Star className="h-4 w-4 mr-2 text-slate-500" />
                    Leave a review
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-emerald-600" />
                    Draft Forms
                  </CardTitle>
                  <CardDescription>Starter packet workspaces Maria has handed into structured review.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-sm text-slate-500">Active workspaces</p>
                      <p className="text-2xl font-semibold">{draftWorkspaces.length}</p>
                    </div>
                    <Button asChild variant="outline">
                      <Link to="/draft-forms">
                        Open workspace
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                  {latestDraftWorkspace ? (
                    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Latest saved draft</p>
                          <p className="mt-2 font-medium text-slate-900 dark:text-white">{latestDraftWorkspace.title}</p>
                          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Saved {new Date(latestDraftWorkspace.updatedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            {' · '}
                            {latestDraftWorkspace.intake.attachmentNames.length > 0
                              ? `${latestDraftWorkspace.intake.attachmentNames.length} uploaded file${latestDraftWorkspace.intake.attachmentNames.length === 1 ? '' : 's'} included`
                              : 'No uploaded files captured yet'}
                          </p>
                        </div>
                        <Button asChild size="sm" className="rounded-full bg-emerald-700 text-white hover:bg-emerald-800">
                          <Link to={`/draft-forms/${latestDraftWorkspace.id}`}>Resume</Link>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      No draft workspace yet. Start one from Maria chat or the Forms page.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gift className="h-4 w-4 text-purple-600" />
                    Referral performance
                  </CardTitle>
                  <CardDescription>Credits you&apos;ve earned so far.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-sm text-slate-500">Total</p>
                    <p className="text-2xl font-semibold">{referralStats?.totalReferrals ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Completed</p>
                    <p className="text-2xl font-semibold text-emerald-600">{referralStats?.completedReferrals ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Credit</p>
                    <p className="text-2xl font-semibold text-blue-600">${referralStats?.totalRewardsEarned ?? 0}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-orange-500" />
                    Service readiness
                  </CardTitle>
                  <CardDescription>Keep tabs on your proof-of-service tasks.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Progress value={completionPercent} />
                  <p className="text-sm text-slate-500">
                    {completedTasks.length} of {SERVICE_TASKS.length} tasks marked complete
                  </p>
                  <Button variant="outline" className="w-full" onClick={() => setActiveTab('service')}>
                    Update checklist
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardCheck className="h-4 w-4 text-emerald-600" />
                    Filing tracker
                  </CardTitle>
                  <CardDescription>Persistent filing status from generated packet through clerk review.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Progress value={filingProgressPercent} />
                  <p className="text-sm text-slate-500">
                    {filingCompletedCount} of {FILING_TRACKER_STEPS.length} filing milestones complete
                  </p>
                  {nextFilingStep ? (
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-3 text-sm dark:border-emerald-400/20 dark:bg-emerald-400/10">
                      <p className="font-medium text-emerald-900 dark:text-emerald-100">Next: {nextFilingStep.title}</p>
                      <p className="mt-1 text-emerald-800/80 dark:text-emerald-100/75">{nextFilingStep.detail}</p>
                    </div>
                  ) : (
                    <p className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-3 text-sm font-medium text-emerald-900 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-100">
                      All filing milestones are marked complete.
                    </p>
                  )}
                  <Button variant="outline" className="w-full" onClick={() => setActiveTab('county')}>
                    Update filing tracker
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="reminders">
            <CaseRemindersPanel currentUser={user} onJumpToTab={setActiveTab} />
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Priority court forms</CardTitle>
                <CardDescription>Download the most-requested California Judicial Council forms.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                {featuredForms.map((form) => (
                  <Card key={form.id} className="border border-slate-200 bg-slate-50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <FileText className="h-4 w-4 text-slate-500" />
                        {form.formNumber}
                      </CardTitle>
                      <CardDescription>{form.title}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-sm text-slate-600">{form.description}</p>
                      <div className="flex gap-2">
                        <Button asChild size="sm">
                          <a href={form.pdfUrl} target="_blank" rel="noopener noreferrer">
                            Download
                          </a>
                        </Button>
                        {form.instructionsUrl && (
                          <Button asChild size="sm" variant="outline">
                            <a href={form.instructionsUrl} target="_blank" rel="noopener noreferrer">
                              Instructions
                            </a>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
            <div className="flex justify-end">
              <Button asChild variant="ghost">
                <Link to="/forms">
                  Browse all forms
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="county" className="space-y-6">
            <Card className="rounded-[1.75rem] border-white/80 bg-white/80 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
              <CardHeader>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <ClipboardCheck className="h-5 w-5 text-emerald-600" />
                      Filing tracker
                    </CardTitle>
                    <CardDescription className="mt-2">
                      Mark each filing milestone as it happens. This saves locally to your DivorceOS dashboard.
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="w-fit rounded-full border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-100">
                    {filingCompletedCount}/{FILING_TRACKER_STEPS.length} complete
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <Progress value={filingProgressPercent} className="h-2" />
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-300">
                  <Badge variant="secondary" className="rounded-full">
                    {isFilingTrackerLoading ? 'Syncing…' : filingTrackerError ? 'Local backup active' : 'Synced to account'}
                  </Badge>
                  {filingTrackerError ? (
                    <span>{filingTrackerError}</span>
                  ) : (
                    <span>
                      Tracker follows this login across devices
                      {filingTrackerLastSyncedAt
                        ? ` • Last synced ${new Date(filingTrackerLastSyncedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`
                        : '.'}
                    </span>
                  )}
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {FILING_TRACKER_STEPS.map((step, index) => {
                    const checked = filingTracker.completed[step.id];
                    const updatedAt = filingTracker.updatedAtByStep[step.id];
                    return (
                      <div
                        key={step.id}
                        className={cn(
                          'rounded-2xl border p-4 transition-colors',
                          checked
                            ? 'border-emerald-200 bg-emerald-50/80 dark:border-emerald-400/20 dark:bg-emerald-400/10'
                            : 'border-slate-200 bg-white/75 dark:border-white/10 dark:bg-white/5',
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox checked={checked} onCheckedChange={() => toggleFilingTrackerStep(step.id)} className="mt-1" />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="secondary" className="rounded-full text-[11px]">Step {index + 1}</Badge>
                              {checked && <Badge className="rounded-full bg-emerald-700 text-white">Done</Badge>}
                            </div>
                            <p className="mt-2 font-medium text-slate-900 dark:text-white">{step.title}</p>
                            <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-300">{step.detail}</p>
                            {updatedAt && (
                              <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-200">
                                Marked {new Date(updatedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </p>
                            )}
                            {step.tab && (
                              <Button variant="link" size="sm" className="mt-2 h-auto px-0 text-emerald-700 dark:text-emerald-200" onClick={() => setActiveTab(step.tab!)}>
                                Open related section
                                <ChevronRight className="ml-1 h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white/75 p-4 dark:border-white/10 dark:bg-white/5">
                  <label className="text-sm font-medium text-slate-800 dark:text-slate-100" htmlFor="filing-tracker-notes">
                    Filing notes / clerk status
                  </label>
                  <textarea
                    id="filing-tracker-notes"
                    value={filingTracker.notes}
                    onChange={(event) => setFilingTracker((current) => ({ ...current, notes: event.target.value }))}
                    placeholder="Example: Filed through Tyler on May 1. Waiting for clerk acceptance. Rejection reason, envelope number, hearing date, or next deadline…"
                    className="mt-2 min-h-28 w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 dark:border-white/10 dark:bg-slate-950 dark:text-white dark:focus:ring-emerald-400/10"
                  />
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                  <Button asChild variant="outline" className="rounded-full">
                    <Link to="/concierge">
                      Open county concierge
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="ghost" className="rounded-full text-slate-500" onClick={resetFilingTracker}>
                    Reset tracker
                  </Button>
                </div>
              </CardContent>
            </Card>

            <CountyRoadmap initialCountyId={preferredCountyId} currentUser={user} onProfileUpdated={setUser} />
          </TabsContent>

          <TabsContent value="service" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BellRing className="h-4 w-4 text-amber-600" />
                  Service checklist
                </CardTitle>
                <CardDescription>Personal service must be completed within 60 days in most counties.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {SERVICE_TASKS.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3"
                  >
                    <Checkbox
                      checked={completedTasks.includes(task.id)}
                      onCheckedChange={() => toggleTask(task.id)}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-medium">{task.title}</p>
                      <p className="text-sm text-slate-500">{task.detail}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Need a professional server?</CardTitle>
                <CardDescription>
                  DIY litigants often hire a registered process server for speed and compliance.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 text-sm text-slate-600">
                <p>✔️ Confirm the server covers your county and delivers proofs within 48 hours.</p>
                <p>✔️ Provide two stamped copies of your filing plus any restraining orders.</p>
                <p>✔️ Calendar mediation or response deadlines as soon as FL-115 is filed.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="saved" className="space-y-6">
            {vaultPanel}
            <SavedScenariosPanel user={user} />
          </TabsContent>

          <TabsContent value="referral">
            <ReferralProgram user={user} />
          </TabsContent>

          <TabsContent value="review">
            <ReviewSystem user={user} />
          </TabsContent>

          {isStaffUser && (
            <TabsContent value="staff" className="space-y-6">
              <FilingOpsPanel />
              <ConciergeQueuePanel currentUser={user} />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
