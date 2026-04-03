import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { CountyRoadmap } from '@/components/CountyRoadmap';
import { ReferralProgram, getReferralStats } from '@/components/ReferralProgram';
import { ReviewSystem } from '@/components/ReviewSystem';
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

export function DashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(() => authService.getCurrentUser());
  const [activeTab, setActiveTab] = useState('overview');
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [referralStats, setReferralStats] = useState(() =>
    user ? getReferralStats(user.id) : null
  );

  useEffect(() => {
    const session = authService.getCurrentUser();
    if (!session) {
      navigate('/');
      return;
    }
    setUser(session);
    setReferralStats(getReferralStats(session.id));
  }, [navigate]);

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
    <div className="min-h-screen bg-slate-50 py-10">
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
            <Badge variant="secondary" className="text-emerald-700 self-start lg:self-auto">
              {planInfo.name} Plan
            </Badge>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 bg-white border rounded-xl">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="county">County Filing</TabsTrigger>
            <TabsTrigger value="service">Service</TabsTrigger>
            <TabsTrigger value="referral">Referral</TabsTrigger>
            <TabsTrigger value="review">Review</TabsTrigger>
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
        </Tabs>
      </div>
    </div>
  );
}
