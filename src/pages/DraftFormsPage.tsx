import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, FileText, Sparkles, Wand2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { authService, type User } from '@/services/auth';
import {
  createBlankChild,
  createStarterPacketWorkspace,
  getDraftWorkspace,
  saveDraftWorkspace,
  setDraftFieldValue,
  type DraftField,
  type DraftFormsWorkspace,
} from '@/services/formDrafts';

function FieldSourceBadge({ field }: { field: DraftField<unknown> }) {
  if (!field.sourceType) {
    return <Badge variant="secondary">Needs source</Badge>;
  }

  const confidenceTone = field.confidence === 'high'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200'
    : field.confidence === 'medium'
      ? 'border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-200'
      : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200';

  return (
    <Badge className={`border ${confidenceTone}`} variant="outline">
      {field.sourceType} · {field.confidence ?? 'review'}
    </Badge>
  );
}

function FieldHeader({ label, field }: { label: string; field: DraftField<unknown> }) {
  return (
    <div className="mb-2 flex flex-wrap items-center gap-2">
      <Label className="text-sm font-medium text-slate-800 dark:text-slate-100">{label}</Label>
      <FieldSourceBadge field={field} />
      {field.needsReview && (
        <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200">
          Needs review
        </Badge>
      )}
    </div>
  );
}

export function DraftFormsPage() {
  const navigate = useNavigate();
  const { workspaceId } = useParams();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [workspace, setWorkspace] = useState<DraftFormsWorkspace | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);

    if (!user) {
      navigate('/', { replace: true });
      return;
    }

    if (workspaceId) {
      const existing = getDraftWorkspace(workspaceId);
      if (existing?.userId === user.id) {
        setWorkspace(existing);
        return;
      }
    }

    if (initializedRef.current) return;
    initializedRef.current = true;

    const created = createStarterPacketWorkspace({ user });
    setWorkspace(created);
    navigate(`/draft-forms/${created.id}`, { replace: true });
  }, [workspaceId, navigate]);

  const commitWorkspace = (updater: (current: DraftFormsWorkspace) => DraftFormsWorkspace) => {
    setWorkspace((current) => {
      if (!current) return current;
      return saveDraftWorkspace(updater(current));
    });
  };

  const missingItems = useMemo(() => {
    if (!workspace) return [] as string[];
    const missing: string[] = [];

    if (!workspace.filingCounty.value.trim()) missing.push('Filing county');
    if (!workspace.petitionerName.value.trim()) missing.push('Petitioner name');
    if (!workspace.respondentName.value.trim()) missing.push('Respondent name');
    if (!workspace.marriageDate.value.trim()) missing.push('Date of marriage');

    if (workspace.hasMinorChildren.value) {
      if (workspace.children.length === 0) {
        missing.push('At least one child entry');
      }
      workspace.children.forEach((child, index) => {
        if (!child.fullName.value.trim()) missing.push(`Child ${index + 1} full name`);
        if (!child.birthDate.value.trim()) missing.push(`Child ${index + 1} birth date`);
      });
    }

    return missing;
  }, [workspace]);

  const progressValue = useMemo(() => {
    if (!workspace) return 0;
    const checklistSize = Math.max(missingItems.length + 5, 5);
    return Math.max(8, Math.round(((checklistSize - missingItems.length) / checklistSize) * 100));
  }, [workspace, missingItems.length]);

  if (!currentUser || !workspace) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_10%_0%,rgba(16,185,129,0.16),transparent_24%),linear-gradient(180deg,#f8fafc_0%,#ecfdf5_100%)] py-16 dark:bg-[radial-gradient(circle_at_10%_0%,rgba(16,185,129,0.18),transparent_22%),linear-gradient(180deg,#020617_0%,#03111f_100%)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Card className="rounded-[2rem] border-white/70 bg-white/80 shadow-xl backdrop-blur dark:border-white/10 dark:bg-white/5">
            <CardContent className="flex min-h-[280px] items-center justify-center">
              <div className="text-center text-slate-500 dark:text-slate-300">Loading Draft Forms…</div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const includedForms = workspace.hasMinorChildren.value
    ? ['FL-100', 'FL-110', 'FL-105/GC-120']
    : ['FL-100', 'FL-110'];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_14%_0%,rgba(16,185,129,0.16),transparent_24%),radial-gradient(circle_at_86%_8%,rgba(59,130,246,0.12),transparent_20%),linear-gradient(180deg,#f8fafc_0%,#ecfdf5_45%,#f8fafc_100%)] py-12 dark:bg-[radial-gradient(circle_at_16%_0%,rgba(16,185,129,0.16),transparent_24%),radial-gradient(circle_at_84%_8%,rgba(59,130,246,0.14),transparent_20%),linear-gradient(180deg,#020617_0%,#03111f_50%,#020617_100%)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Badge className="mb-3 border border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200">
              Draft Forms MVP
            </Badge>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-950 dark:text-white">Starter packet workspace</h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600 dark:text-slate-300">
              Maria can hand facts into an editable workspace before anything becomes a court-ready packet. Structured form data stays the source of truth.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/forms">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to forms
              </Link>
            </Button>
            <Button asChild className="rounded-full bg-emerald-700 text-white hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500">
              <Link to="/">Back to Maria chat</Link>
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.6fr_0.9fr]">
          <div className="space-y-6">
            <Card className="rounded-[1.75rem] border-white/70 bg-white/80 shadow-xl backdrop-blur dark:border-white/10 dark:bg-white/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-950 dark:text-white">
                  <Sparkles className="h-5 w-5 text-emerald-600" />
                  Intake handoff from Maria
                </CardTitle>
                <CardDescription>
                  This is the bridge between chat/uploads and editable form fields.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">User request</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-200">
                    {workspace.intake.userRequest || 'No specific chat request was captured yet.'}
                  </p>
                </div>
                <Separator />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Maria summary</p>
                  <p className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-200">
                    {workspace.intake.mariaSummary || 'No Maria summary captured yet.'}
                  </p>
                </div>
                <Separator />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Uploaded evidence</p>
                  {workspace.intake.attachmentNames.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {workspace.intake.attachmentNames.map((name) => (
                        <Badge key={name} variant="outline" className="rounded-full">{name}</Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">No uploaded files were attached to the captured handoff.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[1.75rem] border-white/70 bg-white/80 shadow-xl backdrop-blur dark:border-white/10 dark:bg-white/5">
              <CardHeader>
                <CardTitle className="text-slate-950 dark:text-white">Case basics</CardTitle>
                <CardDescription>Core starter-packet facts for FL-100 and the summons packet.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-5 md:grid-cols-2">
                <div>
                  <FieldHeader label="Filing county" field={workspace.filingCounty} />
                  <Input
                    value={workspace.filingCounty.value}
                    onChange={(e) => commitWorkspace((current) => ({ ...current, filingCounty: setDraftFieldValue(current.filingCounty, e.target.value) }))}
                    placeholder="Los Angeles"
                  />
                </div>
                <div>
                  <FieldHeader label="Respondent name" field={workspace.respondentName} />
                  <Input
                    value={workspace.respondentName.value}
                    onChange={(e) => commitWorkspace((current) => ({ ...current, respondentName: setDraftFieldValue(current.respondentName, e.target.value) }))}
                    placeholder="Spouse / respondent full name"
                  />
                </div>
                <div>
                  <FieldHeader label="Date of marriage" field={workspace.marriageDate} />
                  <Input
                    type="date"
                    value={workspace.marriageDate.value}
                    onChange={(e) => commitWorkspace((current) => ({ ...current, marriageDate: setDraftFieldValue(current.marriageDate, e.target.value) }))}
                  />
                </div>
                <div>
                  <FieldHeader label="Date of separation" field={workspace.separationDate} />
                  <Input
                    type="date"
                    value={workspace.separationDate.value}
                    onChange={(e) => commitWorkspace((current) => ({ ...current, separationDate: setDraftFieldValue(current.separationDate, e.target.value) }))}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[1.75rem] border-white/70 bg-white/80 shadow-xl backdrop-blur dark:border-white/10 dark:bg-white/5">
              <CardHeader>
                <CardTitle className="text-slate-950 dark:text-white">Petitioner contact</CardTitle>
                <CardDescription>Editable, structured data that will later drive PDF generation.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-5 md:grid-cols-2">
                <div>
                  <FieldHeader label="Petitioner name" field={workspace.petitionerName} />
                  <Input
                    value={workspace.petitionerName.value}
                    onChange={(e) => commitWorkspace((current) => ({ ...current, petitionerName: setDraftFieldValue(current.petitionerName, e.target.value) }))}
                    placeholder="Your full legal name"
                  />
                </div>
                <div>
                  <FieldHeader label="Petitioner email" field={workspace.petitionerEmail} />
                  <Input
                    value={workspace.petitionerEmail.value}
                    onChange={(e) => commitWorkspace((current) => ({ ...current, petitionerEmail: setDraftFieldValue(current.petitionerEmail, e.target.value) }))}
                    placeholder="name@email.com"
                  />
                </div>
                <div>
                  <FieldHeader label="Petitioner phone" field={workspace.petitionerPhone} />
                  <Input
                    value={workspace.petitionerPhone.value}
                    onChange={(e) => commitWorkspace((current) => ({ ...current, petitionerPhone: setDraftFieldValue(current.petitionerPhone, e.target.value) }))}
                    placeholder="(555) 555-5555"
                  />
                </div>
                <div className="md:col-span-2">
                  <FieldHeader label="Petitioner mailing address" field={workspace.petitionerAddress} />
                  <Textarea
                    value={workspace.petitionerAddress.value}
                    onChange={(e) => commitWorkspace((current) => ({ ...current, petitionerAddress: setDraftFieldValue(current.petitionerAddress, e.target.value) }))}
                    placeholder="Street, city, state, ZIP"
                    className="min-h-[96px]"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[1.75rem] border-white/70 bg-white/80 shadow-xl backdrop-blur dark:border-white/10 dark:bg-white/5">
              <CardHeader>
                <CardTitle className="text-slate-950 dark:text-white">Children + requests</CardTitle>
                <CardDescription>Conditional packet logic starts here. FL-105/GC-120 turns on only when it should.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5">
                  <Checkbox
                    checked={workspace.hasMinorChildren.value}
                    onCheckedChange={(checked) => {
                      const nextValue = checked === true;
                      commitWorkspace((current) => ({
                        ...current,
                        hasMinorChildren: setDraftFieldValue(current.hasMinorChildren, nextValue),
                        children: nextValue ? current.children : [],
                      }));
                    }}
                  />
                  <div>
                    <p className="font-medium text-slate-800 dark:text-slate-100">There are minor children of the relationship</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">If checked, this workspace adds FL-105/GC-120 and child details.</p>
                  </div>
                </div>

                {workspace.hasMinorChildren.value && (
                  <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-800 dark:text-slate-100">Children</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Collect exact names and birth dates before packet generation.</p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-full"
                        onClick={() => commitWorkspace((current) => ({ ...current, children: [...current.children, createBlankChild()] }))}
                      >
                        Add child
                      </Button>
                    </div>
                    {workspace.children.length === 0 ? (
                      <p className="text-sm text-amber-700 dark:text-amber-200">No child entries yet.</p>
                    ) : (
                      <div className="space-y-4">
                        {workspace.children.map((child, index) => (
                          <div key={child.id} className="grid gap-4 md:grid-cols-[1.2fr_0.8fr_auto] md:items-end">
                            <div>
                              <FieldHeader label={`Child ${index + 1} full name`} field={child.fullName} />
                              <Input
                                value={child.fullName.value}
                                onChange={(e) => commitWorkspace((current) => ({
                                  ...current,
                                  children: current.children.map((entry) => entry.id === child.id
                                    ? { ...entry, fullName: setDraftFieldValue(entry.fullName, e.target.value) }
                                    : entry),
                                }))}
                                placeholder="Child full legal name"
                              />
                            </div>
                            <div>
                              <FieldHeader label="Birth date" field={child.birthDate} />
                              <Input
                                type="date"
                                value={child.birthDate.value}
                                onChange={(e) => commitWorkspace((current) => ({
                                  ...current,
                                  children: current.children.map((entry) => entry.id === child.id
                                    ? { ...entry, birthDate: setDraftFieldValue(entry.birthDate, e.target.value) }
                                    : entry),
                                }))}
                              />
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => commitWorkspace((current) => ({
                                ...current,
                                children: current.children.filter((entry) => entry.id !== child.id),
                              }))}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  {([
                    ['childCustody', 'Request child custody'],
                    ['visitation', 'Request visitation / parenting time'],
                    ['childSupport', 'Request child support'],
                    ['spousalSupport', 'Request spousal support'],
                    ['propertyRightsDetermination', 'Request property rights determination'],
                    ['restoreFormerName', 'Request restoration of former name'],
                  ] as const).map(([key, label]) => (
                    <label key={key} className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5">
                      <Checkbox
                        checked={workspace.requests[key].value}
                        onCheckedChange={(checked) => commitWorkspace((current) => ({
                          ...current,
                          requests: {
                            ...current.requests,
                            [key]: setDraftFieldValue(current.requests[key], checked === true),
                          },
                        }))}
                      />
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-slate-800 dark:text-slate-100">{label}</span>
                          <FieldSourceBadge field={workspace.requests[key]} />
                        </div>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          {workspace.requests[key].sourceLabel || 'No source captured yet'}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <Card className="rounded-[1.75rem] border-white/70 bg-white/80 shadow-xl backdrop-blur dark:border-white/10 dark:bg-white/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-950 dark:text-white">
                  <FileText className="h-5 w-5 text-emerald-600" />
                  Packet readiness
                </CardTitle>
                <CardDescription>Milestone 1 is about getting users into a structured review loop.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700 dark:text-slate-200">Review progress</span>
                    <span className="text-slate-500 dark:text-slate-400">{progressValue}%</span>
                  </div>
                  <Progress value={progressValue} className="h-2" />
                </div>

                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Included forms</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {includedForms.map((form) => (
                      <Badge key={form} variant="outline" className="rounded-full">{form}</Badge>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Still needed before packet generation</p>
                  {missingItems.length === 0 ? (
                    <div className="mt-3 flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-200">
                      <CheckCircle2 className="h-4 w-4" />
                      Ready for the PDF-generation slice.
                    </div>
                  ) : (
                    <ul className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-200">
                      {missingItems.slice(0, 8).map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 dark:border-emerald-400/20 dark:bg-emerald-400/10">
                  <div className="flex items-start gap-3">
                    <Wand2 className="mt-0.5 h-5 w-5 text-emerald-700 dark:text-emerald-200" />
                    <div>
                      <p className="font-medium text-emerald-900 dark:text-emerald-100">What this slice proves</p>
                      <p className="mt-1 text-sm leading-6 text-emerald-900/80 dark:text-emerald-100/80">
                        Maria can now hand facts into a reusable form workspace instead of trapping them in chat.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3">
                  <Button disabled className="rounded-full bg-emerald-700 text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-emerald-600 dark:hover:bg-emerald-500">
                    Generate official packet (next slice)
                  </Button>
                  <Button disabled variant="outline" className="rounded-full disabled:cursor-not-allowed disabled:opacity-60">
                    Send to concierge (after packet generation)
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
