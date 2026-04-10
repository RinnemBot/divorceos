import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { CountyRoadmap } from '@/components/CountyRoadmap';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ReferralProgram, getReferralStats } from '@/components/ReferralProgram';
import { ReviewSystem } from '@/components/ReviewSystem';
import { ConciergeQueuePanel } from '@/components/ConciergeQueuePanel';
import { FilingOpsPanel } from '@/components/FilingOpsPanel';
import { COURT_FORMS } from '@/data/forms';
import { COUNTY_GUIDES } from '@/data/countyGuides';
import { authService, SUBSCRIPTION_LIMITS, type User } from '@/services/auth';
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

const FEATURED_FORM_IDS = ['fl-100', 'fl-110', 'fl-115', 'fl-300', 'fl-150', 'fl-311', 'fl-346'];

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
  const [user, setUser] = useState<User | null>(() => authService.getCurrentUser());
  const [activeTab, setActiveTab] = useState('overview');
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [referralStats, setReferralStats] = useState(() =>
    user ? getReferralStats(user.id) : null
  );
  const [vaultDocs, setVaultDocs] = useState<VaultDocument[]>([]);
  const [isVaultLoading, setIsVaultLoading] = useState(false);
  const [vaultError, setVaultError] = useState<string | null>(null);
  const [isVaultUploading, setIsVaultUploading] = useState(false);
  const vaultFileInputRef = useRef<HTMLInputElement>(null);
  const isStaffUser = useMemo(() => (user ? authService.isConciergeStaff(user) : false), [user]);

  useEffect(() => {
    const session = authService.getCurrentUser();
    if (!session) {
      navigate('/');
      return;
    }
    setUser(session);
    setReferralStats(getReferralStats(session.id));
  }, [navigate]);

  const fetchVaultDocuments = useCallback(async () => {
    if (!user?.id) {
      setVaultDocs([]);
      return;
    }

    setIsVaultLoading(true);
    setVaultError(null);

    try {
      const response = await fetch(`/api/vault-documents?userId=${encodeURIComponent(user.id)}`);
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
    formData.append('userId', user.id);
    formData.append('file', file);

    setIsVaultUploading(true);
    setVaultError(null);

    try {
      const response = await fetch('/api/vault-upload', {
        method: 'POST',
        body: formData,
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
              isStaffUser ? 'lg:grid-cols-7' : 'lg:grid-cols-6'
            )}
          >
            <TabsTrigger value="overview" className="data-[state=active]:bg-emerald-700 data-[state=active]:text-white">Overview</TabsTrigger>
            <TabsTrigger value="documents" className="data-[state=active]:bg-emerald-700 data-[state=active]:text-white">Documents</TabsTrigger>
            <TabsTrigger value="county" className="data-[state=active]:bg-emerald-700 data-[state=active]:text-white">County Filing</TabsTrigger>
            <TabsTrigger value="service" className="data-[state=active]:bg-emerald-700 data-[state=active]:text-white">Service</TabsTrigger>
            <TabsTrigger value="referral" className="data-[state=active]:bg-emerald-700 data-[state=active]:text-white">Referral</TabsTrigger>
            <TabsTrigger value="review" className="data-[state=active]:bg-emerald-700 data-[state=active]:text-white">Review</TabsTrigger>
            {isStaffUser && <TabsTrigger value="staff" className="data-[state=active]:bg-emerald-700 data-[state=active]:text-white">Staff</TabsTrigger>}
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
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
                  <Button variant="ghost" className="justify-start" onClick={() => setActiveTab('documents')}>
                    <FileText className="h-4 w-4 mr-2 text-slate-500" />
                    Open court forms
                  </Button>
                  <Button variant="ghost" className="justify-start" onClick={() => setActiveTab('county')}>
                    <MapPinned className="h-4 w-4 mr-2 text-slate-500" />
                    Check county filing steps
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
            </div>
          </TabsContent>

          <TabsContent value="documents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-emerald-600" />
                  Document vault
                </CardTitle>
                <CardDescription>Upload finished packets so we can route them into concierge filing workflows, with direct in-platform filing coming soon.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="text-sm text-slate-600 lg:w-2/3">
                    <p className="mb-2">
                      Stored documents live in an encrypted Supabase bucket. Essential+ members can authorize Maria to pull these filings into concierge review and filing workflows, with deeper queue automation coming soon.
                    </p>
                    <p>PDF only • 10 MB max • Need edits first? Attach drafts in chat and we&apos;ll clean them before uploading.</p>
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
                <FilingOpsPanel />
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
                                <p className="text-xs text-slate-500">Stored securely in DivorceOS</p>
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

          <TabsContent value="county">
            <CountyRoadmap initialCountyId={preferredCountyId} />
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

          <TabsContent value="referral">
            <ReferralProgram user={user} />
          </TabsContent>

          <TabsContent value="review">
            <ReviewSystem user={user} />
          </TabsContent>

          {isStaffUser && (
            <TabsContent value="staff">
              <ConciergeQueuePanel currentUser={user} />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
