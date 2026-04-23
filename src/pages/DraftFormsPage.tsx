import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, FileText, Loader2, Sparkles, Wand2 } from 'lucide-react';
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
import { MariaDocumentError, createOfficialStarterPacketDocument } from '@/services/documents';
import {
  createBlankChild,
  createBlankFl105OtherClaimant,
  createBlankFl105OtherProceeding,
  createBlankFl105ResidenceHistoryEntry,
  createBlankFl105RestrainingOrder,
  FL105_FORM_CAPACITY,
  createStarterPacketWorkspace,
  getDraftWorkspace,
  saveDraftWorkspace,
  setDraftFieldValue,
  type DraftField,
  type DraftFormsWorkspace,
} from '@/services/formDrafts';
import { toast } from 'sonner';

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
  const [isGeneratingPacket, setIsGeneratingPacket] = useState(false);
  const [generatedPacketName, setGeneratedPacketName] = useState<string | null>(null);
  const [packetError, setPacketError] = useState<string | null>(null);
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

  const updateFl105 = (updater: (fl105: DraftFormsWorkspace['fl105']) => DraftFormsWorkspace['fl105']) => {
    commitWorkspace((current) => ({ ...current, fl105: updater(current.fl105) }));
  };

  const missingItems = useMemo(() => {
    if (!workspace) return [] as string[];
    const missing: string[] = [];

    if (!workspace.filingCounty.value.trim()) missing.push('Filing county');
    if (!workspace.petitionerName.value.trim()) missing.push('Petitioner name');
    if (!workspace.respondentName.value.trim()) missing.push('Respondent name');
    if (!workspace.marriageDate.value.trim()) missing.push('Date of marriage');
    if (!workspace.fl100.residency.petitionerCaliforniaMonths.value.trim()) missing.push('Petitioner California residency months');
    if (!workspace.fl100.residency.petitionerCountyMonths.value.trim()) missing.push('Petitioner county residency months');
    if (!workspace.fl100.legalGrounds.irreconcilableDifferences.value && !workspace.fl100.legalGrounds.permanentLegalIncapacity.value) {
      missing.push('At least one legal ground for FL-100');
    }
    if (workspace.requests.restoreFormerName.value && !workspace.fl100.formerName.value.trim()) {
      missing.push('Former name to restore');
    }

    if (workspace.hasMinorChildren.value) {
      if (workspace.children.length === 0) {
        missing.push('At least one child entry');
      }
      workspace.children.forEach((child, index) => {
        if (!child.fullName.value.trim()) missing.push(`Child ${index + 1} full name`);
        if (!child.birthDate.value.trim()) missing.push(`Child ${index + 1} birth date`);
        if (!child.placeOfBirth.value.trim()) missing.push(`Child ${index + 1} place of birth`);
      });
    }

    return missing;
  }, [workspace]);

  const progressValue = useMemo(() => {
    if (!workspace) return 0;
    const checklistSize = Math.max(missingItems.length + 5, 5);
    return Math.max(8, Math.round(((checklistSize - missingItems.length) / checklistSize) * 100));
  }, [workspace, missingItems.length]);

  const handleGeneratePacket = async () => {
    if (!workspace) return;
    if (missingItems.length > 0) {
      toast.message('Finish the required Draft Forms fields before generating the official starter packet PDF.');
      return;
    }

    setIsGeneratingPacket(true);
    setPacketError(null);

    try {
      const document = await createOfficialStarterPacketDocument(workspace);
      setGeneratedPacketName(document.name);
      toast.success('Official starter packet PDF saved to Saved Files.');
    } catch (error) {
      const message = error instanceof MariaDocumentError
        ? error.message
        : error instanceof Error
          ? error.message
          : 'Unable to generate the official starter packet PDF right now.';
      setPacketError(message);
      toast.error(message);
    } finally {
      setIsGeneratingPacket(false);
    }
  };

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
                <CardDescription>Core starter-packet facts plus court caption details used across FL-100 and FL-105/GC-120.</CardDescription>
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
                  <FieldHeader label="Case number" field={workspace.caseNumber} />
                  <Input
                    value={workspace.caseNumber.value}
                    onChange={(e) => commitWorkspace((current) => ({ ...current, caseNumber: setDraftFieldValue(current.caseNumber, e.target.value) }))}
                    placeholder="24FL000123"
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
                <div>
                  <FieldHeader label="Court street" field={workspace.courtStreet} />
                  <Input
                    value={workspace.courtStreet.value}
                    onChange={(e) => commitWorkspace((current) => ({ ...current, courtStreet: setDraftFieldValue(current.courtStreet, e.target.value) }))}
                    placeholder="111 N Hill St"
                  />
                </div>
                <div>
                  <FieldHeader label="Court mailing address" field={workspace.courtMailingAddress} />
                  <Input
                    value={workspace.courtMailingAddress.value}
                    onChange={(e) => commitWorkspace((current) => ({ ...current, courtMailingAddress: setDraftFieldValue(current.courtMailingAddress, e.target.value) }))}
                    placeholder="Same as street or P.O. Box"
                  />
                </div>
                <div>
                  <FieldHeader label="Court city / ZIP" field={workspace.courtCityZip} />
                  <Input
                    value={workspace.courtCityZip.value}
                    onChange={(e) => commitWorkspace((current) => ({ ...current, courtCityZip: setDraftFieldValue(current.courtCityZip, e.target.value) }))}
                    placeholder="Los Angeles, CA 90012"
                  />
                </div>
                <div>
                  <FieldHeader label="Court branch" field={workspace.courtBranch} />
                  <Input
                    value={workspace.courtBranch.value}
                    onChange={(e) => commitWorkspace((current) => ({ ...current, courtBranch: setDraftFieldValue(current.courtBranch, e.target.value) }))}
                    placeholder="Central District / Stanley Mosk"
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
                <CardTitle className="text-slate-950 dark:text-white">FL-100 mapping slice</CardTitle>
                <CardDescription>These are the first petition-specific fields needed to move from general intake into a real FL-100 packet.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <FieldHeader label="Legal relationship" field={workspace.fl100.relationshipType} />
                    <select
                      value={workspace.fl100.relationshipType.value}
                      onChange={(e) => commitWorkspace((current) => ({
                        ...current,
                        fl100: {
                          ...current.fl100,
                          relationshipType: setDraftFieldValue(current.fl100.relationshipType, e.target.value as 'marriage' | 'domestic_partnership' | 'both'),
                        },
                      }))}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    >
                      <option value="marriage">Marriage</option>
                      <option value="domestic_partnership">Domestic partnership</option>
                      <option value="both">Marriage + domestic partnership</option>
                    </select>
                  </div>
                  <div>
                    <FieldHeader label="Former name to restore" field={workspace.fl100.formerName} />
                    <Input
                      value={workspace.fl100.formerName.value}
                      onChange={(e) => commitWorkspace((current) => ({
                        ...current,
                        fl100: {
                          ...current.fl100,
                          formerName: setDraftFieldValue(current.fl100.formerName, e.target.value),
                        },
                      }))}
                      placeholder="Only if a former name restoration is requested"
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100">Residency for filing eligibility</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">FL-100 depends on California/county residency. Fill in the best months estimate now; we can tighten the rule logic next.</p>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div>
                      <FieldHeader label="Petitioner months in California" field={workspace.fl100.residency.petitionerCaliforniaMonths} />
                      <Input
                        value={workspace.fl100.residency.petitionerCaliforniaMonths.value}
                        onChange={(e) => commitWorkspace((current) => ({
                          ...current,
                          fl100: {
                            ...current.fl100,
                            residency: {
                              ...current.fl100.residency,
                              petitionerCaliforniaMonths: setDraftFieldValue(current.fl100.residency.petitionerCaliforniaMonths, e.target.value),
                            },
                          },
                        }))}
                        placeholder="Example: 8"
                      />
                    </div>
                    <div>
                      <FieldHeader label="Petitioner months in filing county" field={workspace.fl100.residency.petitionerCountyMonths} />
                      <Input
                        value={workspace.fl100.residency.petitionerCountyMonths.value}
                        onChange={(e) => commitWorkspace((current) => ({
                          ...current,
                          fl100: {
                            ...current.fl100,
                            residency: {
                              ...current.fl100.residency,
                              petitionerCountyMonths: setDraftFieldValue(current.fl100.residency.petitionerCountyMonths, e.target.value),
                            },
                          },
                        }))}
                        placeholder="Example: 4"
                      />
                    </div>
                    <div>
                      <FieldHeader label="Respondent months in California" field={workspace.fl100.residency.respondentCaliforniaMonths} />
                      <Input
                        value={workspace.fl100.residency.respondentCaliforniaMonths.value}
                        onChange={(e) => commitWorkspace((current) => ({
                          ...current,
                          fl100: {
                            ...current.fl100,
                            residency: {
                              ...current.fl100.residency,
                              respondentCaliforniaMonths: setDraftFieldValue(current.fl100.residency.respondentCaliforniaMonths, e.target.value),
                            },
                          },
                        }))}
                        placeholder="Optional if petitioner qualifies"
                      />
                    </div>
                    <div>
                      <FieldHeader label="Respondent months in filing county" field={workspace.fl100.residency.respondentCountyMonths} />
                      <Input
                        value={workspace.fl100.residency.respondentCountyMonths.value}
                        onChange={(e) => commitWorkspace((current) => ({
                          ...current,
                          fl100: {
                            ...current.fl100,
                            residency: {
                              ...current.fl100.residency,
                              respondentCountyMonths: setDraftFieldValue(current.fl100.residency.respondentCountyMonths, e.target.value),
                            },
                          },
                        }))}
                        placeholder="Optional if petitioner qualifies"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5">
                    <Checkbox
                      checked={workspace.fl100.legalGrounds.irreconcilableDifferences.value}
                      onCheckedChange={(checked) => commitWorkspace((current) => ({
                        ...current,
                        fl100: {
                          ...current.fl100,
                          legalGrounds: {
                            ...current.fl100.legalGrounds,
                            irreconcilableDifferences: setDraftFieldValue(current.fl100.legalGrounds.irreconcilableDifferences, checked === true),
                          },
                        },
                      }))}
                    />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-slate-800 dark:text-slate-100">Legal ground: irreconcilable differences</span>
                        <FieldSourceBadge field={workspace.fl100.legalGrounds.irreconcilableDifferences} />
                      </div>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Default for most divorce filings.</p>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5">
                    <Checkbox
                      checked={workspace.fl100.legalGrounds.permanentLegalIncapacity.value}
                      onCheckedChange={(checked) => commitWorkspace((current) => ({
                        ...current,
                        fl100: {
                          ...current.fl100,
                          legalGrounds: {
                            ...current.fl100.legalGrounds,
                            permanentLegalIncapacity: setDraftFieldValue(current.fl100.legalGrounds.permanentLegalIncapacity, checked === true),
                          },
                        },
                      }))}
                    />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-slate-800 dark:text-slate-100">Legal ground: permanent legal incapacity</span>
                        <FieldSourceBadge field={workspace.fl100.legalGrounds.permanentLegalIncapacity} />
                      </div>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Rare. Keep this off unless the facts really support it.</p>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5">
                    <Checkbox
                      checked={workspace.fl100.propertyDeclarations.communityAndQuasiCommunity.value}
                      onCheckedChange={(checked) => commitWorkspace((current) => ({
                        ...current,
                        fl100: {
                          ...current.fl100,
                          propertyDeclarations: {
                            ...current.fl100.propertyDeclarations,
                            communityAndQuasiCommunity: setDraftFieldValue(current.fl100.propertyDeclarations.communityAndQuasiCommunity, checked === true),
                          },
                        },
                      }))}
                    />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-slate-800 dark:text-slate-100">Community / quasi-community property exists</span>
                        <FieldSourceBadge field={workspace.fl100.propertyDeclarations.communityAndQuasiCommunity} />
                      </div>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Use this when there are assets or debts to divide.</p>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5">
                    <Checkbox
                      checked={workspace.fl100.propertyDeclarations.separateProperty.value}
                      onCheckedChange={(checked) => commitWorkspace((current) => ({
                        ...current,
                        fl100: {
                          ...current.fl100,
                          propertyDeclarations: {
                            ...current.fl100.propertyDeclarations,
                            separateProperty: setDraftFieldValue(current.fl100.propertyDeclarations.separateProperty, checked === true),
                          },
                        },
                      }))}
                    />
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-slate-800 dark:text-slate-100">Separate property exists</span>
                        <FieldSourceBadge field={workspace.fl100.propertyDeclarations.separateProperty} />
                      </div>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Turn this on if either spouse claims separate property.</p>
                    </div>
                  </label>
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
                        disabled={workspace.children.length >= FL105_FORM_CAPACITY.childrenRows}
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
                          <div key={child.id} className="grid gap-4 md:grid-cols-[1.2fr_0.7fr_1fr_auto] md:items-end">
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
                            <div>
                              <FieldHeader label="Place of birth" field={child.placeOfBirth} />
                              <Input
                                value={child.placeOfBirth.value}
                                onChange={(e) => commitWorkspace((current) => ({
                                  ...current,
                                  children: current.children.map((entry) => entry.id === child.id
                                    ? { ...entry, placeOfBirth: setDraftFieldValue(entry.placeOfBirth, e.target.value) }
                                    : entry),
                                }))}
                                placeholder="City, State"
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
                        {workspace.children.length >= FL105_FORM_CAPACITY.childrenRows && (
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            FL-105 supports {FL105_FORM_CAPACITY.childrenRows} visible child rows in this slice.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {workspace.hasMinorChildren.value && (
                  <div className="space-y-5 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5">
                    <div>
                      <p className="font-medium text-slate-800 dark:text-slate-100">FL-105 / GC-120 details</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Capture the highest-value UCCJEA fields that map directly into the official form rows.</p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
                        <Checkbox
                          checked={workspace.fl105.childrenLivedTogetherPastFiveYears.value}
                          onCheckedChange={(checked) => updateFl105((fl105) => ({
                            ...fl105,
                            childrenLivedTogetherPastFiveYears: setDraftFieldValue(fl105.childrenLivedTogetherPastFiveYears, checked === true),
                          }))}
                        />
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium text-slate-800 dark:text-slate-100">Children lived together for the last five years</span>
                            <FieldSourceBadge field={workspace.fl105.childrenLivedTogetherPastFiveYears} />
                          </div>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">If false, FL-105 indicates children did not all reside together.</p>
                        </div>
                      </label>
                      <div>
                        <FieldHeader label="Declarant name (FL-105 signature line)" field={workspace.fl105.declarantName} />
                        <Input
                          value={workspace.fl105.declarantName.value}
                          onChange={(e) => updateFl105((fl105) => ({
                            ...fl105,
                            declarantName: setDraftFieldValue(fl105.declarantName, e.target.value),
                          }))}
                          placeholder="Usually petitioner name"
                        />
                      </div>
                    </div>

                    <div className="space-y-3 rounded-xl border border-slate-200/80 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-100">Five-year residence history</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Visible FL-105 capacity: {FL105_FORM_CAPACITY.residenceHistoryRows} rows.</p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="rounded-full"
                          disabled={workspace.fl105.residenceHistory.length >= FL105_FORM_CAPACITY.residenceHistoryRows}
                          onClick={() => updateFl105((fl105) => ({
                            ...fl105,
                            residenceHistory: [...fl105.residenceHistory, createBlankFl105ResidenceHistoryEntry()],
                          }))}
                        >
                          Add history row
                        </Button>
                      </div>
                      <div className="space-y-3">
                        {workspace.fl105.residenceHistory.map((entry) => (
                          <div key={entry.id} className="grid gap-3 rounded-lg border border-slate-200/80 bg-slate-50/70 p-3 md:grid-cols-6 dark:border-white/10 dark:bg-white/5">
                            <Input
                              type="date"
                              value={entry.fromDate.value}
                              onChange={(e) => updateFl105((fl105) => ({
                                ...fl105,
                                residenceHistory: fl105.residenceHistory.map((candidate) => candidate.id === entry.id
                                  ? { ...candidate, fromDate: setDraftFieldValue(candidate.fromDate, e.target.value) }
                                  : candidate),
                              }))}
                              placeholder="From"
                            />
                            <Input
                              type="date"
                              value={entry.toDate.value}
                              onChange={(e) => updateFl105((fl105) => ({
                                ...fl105,
                                residenceHistory: fl105.residenceHistory.map((candidate) => candidate.id === entry.id
                                  ? { ...candidate, toDate: setDraftFieldValue(candidate.toDate, e.target.value) }
                                  : candidate),
                              }))}
                              placeholder="To"
                            />
                            <Input
                              value={entry.residence.value}
                              onChange={(e) => updateFl105((fl105) => ({
                                ...fl105,
                                residenceHistory: fl105.residenceHistory.map((candidate) => candidate.id === entry.id
                                  ? { ...candidate, residence: setDraftFieldValue(candidate.residence, e.target.value) }
                                  : candidate),
                              }))}
                              className="md:col-span-2"
                              placeholder="Child's residence"
                            />
                            <Input
                              value={entry.personAndAddress.value}
                              onChange={(e) => updateFl105((fl105) => ({
                                ...fl105,
                                residenceHistory: fl105.residenceHistory.map((candidate) => candidate.id === entry.id
                                  ? { ...candidate, personAndAddress: setDraftFieldValue(candidate.personAndAddress, e.target.value) }
                                  : candidate),
                              }))}
                              placeholder="Person + address"
                            />
                            <div className="flex gap-2">
                              <Input
                                value={entry.relationship.value}
                                onChange={(e) => updateFl105((fl105) => ({
                                  ...fl105,
                                  residenceHistory: fl105.residenceHistory.map((candidate) => candidate.id === entry.id
                                    ? { ...candidate, relationship: setDraftFieldValue(candidate.relationship, e.target.value) }
                                    : candidate),
                                }))}
                                placeholder="Relationship"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                onClick={() => updateFl105((fl105) => ({
                                  ...fl105,
                                  residenceHistory: fl105.residenceHistory.filter((candidate) => candidate.id !== entry.id),
                                }))}
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        ))}
                        {workspace.fl105.residenceHistory.length === 0 && (
                          <p className="text-xs text-slate-500 dark:text-slate-400">No residence rows added yet.</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3 rounded-xl border border-slate-200/80 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
                      <label className="flex items-start gap-3">
                        <Checkbox
                          checked={workspace.fl105.otherProceedingsKnown.value}
                          onCheckedChange={(checked) => updateFl105((fl105) => ({
                            ...fl105,
                            otherProceedingsKnown: setDraftFieldValue(fl105.otherProceedingsKnown, checked === true),
                          }))}
                        />
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium text-slate-800 dark:text-slate-100">Other custody/parentage/adoption proceedings are known</span>
                            <FieldSourceBadge field={workspace.fl105.otherProceedingsKnown} />
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Visible FL-105 capacity: {FL105_FORM_CAPACITY.otherProceedingsRows} rows.</p>
                        </div>
                      </label>
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="rounded-full"
                          disabled={workspace.fl105.otherProceedings.length >= FL105_FORM_CAPACITY.otherProceedingsRows}
                          onClick={() => updateFl105((fl105) => ({
                            ...fl105,
                            otherProceedings: [...fl105.otherProceedings, createBlankFl105OtherProceeding()],
                          }))}
                        >
                          Add proceeding
                        </Button>
                      </div>
                      <div className="space-y-3">
                        {workspace.fl105.otherProceedings.map((entry) => (
                          <div key={entry.id} className="grid gap-3 rounded-lg border border-slate-200/80 bg-slate-50/70 p-3 md:grid-cols-6 dark:border-white/10 dark:bg-white/5">
                            <Input
                              value={entry.proceedingType.value}
                              onChange={(e) => updateFl105((fl105) => ({
                                ...fl105,
                                otherProceedings: fl105.otherProceedings.map((candidate) => candidate.id === entry.id
                                  ? { ...candidate, proceedingType: setDraftFieldValue(candidate.proceedingType, e.target.value) }
                                  : candidate),
                              }))}
                              placeholder="Type"
                            />
                            <Input
                              value={entry.caseNumber.value}
                              onChange={(e) => updateFl105((fl105) => ({
                                ...fl105,
                                otherProceedings: fl105.otherProceedings.map((candidate) => candidate.id === entry.id
                                  ? { ...candidate, caseNumber: setDraftFieldValue(candidate.caseNumber, e.target.value) }
                                  : candidate),
                              }))}
                              placeholder="Case no."
                            />
                            <Input
                              value={entry.court.value}
                              onChange={(e) => updateFl105((fl105) => ({
                                ...fl105,
                                otherProceedings: fl105.otherProceedings.map((candidate) => candidate.id === entry.id
                                  ? { ...candidate, court: setDraftFieldValue(candidate.court, e.target.value) }
                                  : candidate),
                              }))}
                              placeholder="Court"
                            />
                            <Input
                              type="date"
                              value={entry.orderDate.value}
                              onChange={(e) => updateFl105((fl105) => ({
                                ...fl105,
                                otherProceedings: fl105.otherProceedings.map((candidate) => candidate.id === entry.id
                                  ? { ...candidate, orderDate: setDraftFieldValue(candidate.orderDate, e.target.value) }
                                  : candidate),
                              }))}
                            />
                            <Input
                              value={entry.childNames.value}
                              onChange={(e) => updateFl105((fl105) => ({
                                ...fl105,
                                otherProceedings: fl105.otherProceedings.map((candidate) => candidate.id === entry.id
                                  ? { ...candidate, childNames: setDraftFieldValue(candidate.childNames, e.target.value) }
                                  : candidate),
                              }))}
                              placeholder="Child(ren)"
                            />
                            <div className="flex gap-2">
                              <Input
                                value={entry.connection.value}
                                onChange={(e) => updateFl105((fl105) => ({
                                  ...fl105,
                                  otherProceedings: fl105.otherProceedings.map((candidate) => candidate.id === entry.id
                                    ? { ...candidate, connection: setDraftFieldValue(candidate.connection, e.target.value) }
                                    : candidate),
                                }))}
                                placeholder="Your role"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                onClick={() => updateFl105((fl105) => ({
                                  ...fl105,
                                  otherProceedings: fl105.otherProceedings.filter((candidate) => candidate.id !== entry.id),
                                }))}
                              >
                                Remove
                              </Button>
                            </div>
                            <Input
                              value={entry.status.value}
                              onChange={(e) => updateFl105((fl105) => ({
                                ...fl105,
                                otherProceedings: fl105.otherProceedings.map((candidate) => candidate.id === entry.id
                                  ? { ...candidate, status: setDraftFieldValue(candidate.status, e.target.value) }
                                  : candidate),
                              }))}
                              className="md:col-span-6"
                              placeholder="Current status/order summary"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3 rounded-xl border border-slate-200/80 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
                      <label className="flex items-start gap-3">
                        <Checkbox
                          checked={workspace.fl105.domesticViolenceOrdersExist.value}
                          onCheckedChange={(checked) => updateFl105((fl105) => ({
                            ...fl105,
                            domesticViolenceOrdersExist: setDraftFieldValue(fl105.domesticViolenceOrdersExist, checked === true),
                          }))}
                        />
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium text-slate-800 dark:text-slate-100">Protective / restraining orders exist</span>
                            <FieldSourceBadge field={workspace.fl105.domesticViolenceOrdersExist} />
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Visible FL-105 capacity: {FL105_FORM_CAPACITY.restrainingOrdersRows} rows.</p>
                        </div>
                      </label>
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="rounded-full"
                          disabled={workspace.fl105.domesticViolenceOrders.length >= FL105_FORM_CAPACITY.restrainingOrdersRows}
                          onClick={() => updateFl105((fl105) => ({
                            ...fl105,
                            domesticViolenceOrders: [...fl105.domesticViolenceOrders, createBlankFl105RestrainingOrder()],
                          }))}
                        >
                          Add order
                        </Button>
                      </div>
                      <div className="space-y-3">
                        {workspace.fl105.domesticViolenceOrders.map((entry) => (
                          <div key={entry.id} className="grid gap-3 rounded-lg border border-slate-200/80 bg-slate-50/70 p-3 md:grid-cols-6 dark:border-white/10 dark:bg-white/5">
                            <Input
                              value={entry.orderType.value}
                              onChange={(e) => updateFl105((fl105) => ({
                                ...fl105,
                                domesticViolenceOrders: fl105.domesticViolenceOrders.map((candidate) => candidate.id === entry.id
                                  ? { ...candidate, orderType: setDraftFieldValue(candidate.orderType, e.target.value) }
                                  : candidate),
                              }))}
                              placeholder="Order type"
                            />
                            <Input
                              value={entry.county.value}
                              onChange={(e) => updateFl105((fl105) => ({
                                ...fl105,
                                domesticViolenceOrders: fl105.domesticViolenceOrders.map((candidate) => candidate.id === entry.id
                                  ? { ...candidate, county: setDraftFieldValue(candidate.county, e.target.value) }
                                  : candidate),
                              }))}
                              placeholder="County"
                            />
                            <Input
                              value={entry.stateOrTribe.value}
                              onChange={(e) => updateFl105((fl105) => ({
                                ...fl105,
                                domesticViolenceOrders: fl105.domesticViolenceOrders.map((candidate) => candidate.id === entry.id
                                  ? { ...candidate, stateOrTribe: setDraftFieldValue(candidate.stateOrTribe, e.target.value) }
                                  : candidate),
                              }))}
                              placeholder="State/tribe"
                            />
                            <Input
                              value={entry.caseNumber.value}
                              onChange={(e) => updateFl105((fl105) => ({
                                ...fl105,
                                domesticViolenceOrders: fl105.domesticViolenceOrders.map((candidate) => candidate.id === entry.id
                                  ? { ...candidate, caseNumber: setDraftFieldValue(candidate.caseNumber, e.target.value) }
                                  : candidate),
                              }))}
                              placeholder="Case no."
                            />
                            <Input
                              type="date"
                              value={entry.expirationDate.value}
                              onChange={(e) => updateFl105((fl105) => ({
                                ...fl105,
                                domesticViolenceOrders: fl105.domesticViolenceOrders.map((candidate) => candidate.id === entry.id
                                  ? { ...candidate, expirationDate: setDraftFieldValue(candidate.expirationDate, e.target.value) }
                                  : candidate),
                              }))}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => updateFl105((fl105) => ({
                                ...fl105,
                                domesticViolenceOrders: fl105.domesticViolenceOrders.filter((candidate) => candidate.id !== entry.id),
                              }))}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3 rounded-xl border border-slate-200/80 bg-white/70 p-3 dark:border-white/10 dark:bg-white/5">
                      <label className="flex items-start gap-3">
                        <Checkbox
                          checked={workspace.fl105.otherClaimantsKnown.value}
                          onCheckedChange={(checked) => updateFl105((fl105) => ({
                            ...fl105,
                            otherClaimantsKnown: setDraftFieldValue(fl105.otherClaimantsKnown, checked === true),
                          }))}
                        />
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-medium text-slate-800 dark:text-slate-100">Other custody/visitation claimants are known</span>
                            <FieldSourceBadge field={workspace.fl105.otherClaimantsKnown} />
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Visible FL-105 capacity: {FL105_FORM_CAPACITY.otherClaimantsRows} rows.</p>
                        </div>
                      </label>
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="rounded-full"
                          disabled={workspace.fl105.otherClaimants.length >= FL105_FORM_CAPACITY.otherClaimantsRows}
                          onClick={() => updateFl105((fl105) => ({
                            ...fl105,
                            otherClaimants: [...fl105.otherClaimants, createBlankFl105OtherClaimant()],
                          }))}
                        >
                          Add claimant
                        </Button>
                      </div>
                      <div className="space-y-3">
                        {workspace.fl105.otherClaimants.map((entry) => (
                          <div key={entry.id} className="space-y-3 rounded-lg border border-slate-200/80 bg-slate-50/70 p-3 dark:border-white/10 dark:bg-white/5">
                            <div className="grid gap-3 md:grid-cols-3">
                              <Input
                                value={entry.nameAndAddress.value}
                                onChange={(e) => updateFl105((fl105) => ({
                                  ...fl105,
                                  otherClaimants: fl105.otherClaimants.map((candidate) => candidate.id === entry.id
                                    ? { ...candidate, nameAndAddress: setDraftFieldValue(candidate.nameAndAddress, e.target.value) }
                                    : candidate),
                                }))}
                                className="md:col-span-2"
                                placeholder="Name and address"
                              />
                              <Input
                                value={entry.childNames.value}
                                onChange={(e) => updateFl105((fl105) => ({
                                  ...fl105,
                                  otherClaimants: fl105.otherClaimants.map((candidate) => candidate.id === entry.id
                                    ? { ...candidate, childNames: setDraftFieldValue(candidate.childNames, e.target.value) }
                                    : candidate),
                                }))}
                                placeholder="Child names"
                              />
                            </div>
                            <div className="flex flex-wrap gap-4">
                              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                                <Checkbox
                                  checked={entry.hasPhysicalCustody.value}
                                  onCheckedChange={(checked) => updateFl105((fl105) => ({
                                    ...fl105,
                                    otherClaimants: fl105.otherClaimants.map((candidate) => candidate.id === entry.id
                                      ? { ...candidate, hasPhysicalCustody: setDraftFieldValue(candidate.hasPhysicalCustody, checked === true) }
                                      : candidate),
                                  }))}
                                />
                                Physical custody
                              </label>
                              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                                <Checkbox
                                  checked={entry.claimsCustodyRights.value}
                                  onCheckedChange={(checked) => updateFl105((fl105) => ({
                                    ...fl105,
                                    otherClaimants: fl105.otherClaimants.map((candidate) => candidate.id === entry.id
                                      ? { ...candidate, claimsCustodyRights: setDraftFieldValue(candidate.claimsCustodyRights, checked === true) }
                                      : candidate),
                                  }))}
                                />
                                Claims custody rights
                              </label>
                              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                                <Checkbox
                                  checked={entry.claimsVisitationRights.value}
                                  onCheckedChange={(checked) => updateFl105((fl105) => ({
                                    ...fl105,
                                    otherClaimants: fl105.otherClaimants.map((candidate) => candidate.id === entry.id
                                      ? { ...candidate, claimsVisitationRights: setDraftFieldValue(candidate.claimsVisitationRights, checked === true) }
                                      : candidate),
                                  }))}
                                />
                                Claims visitation rights
                              </label>
                              <Button
                                type="button"
                                variant="ghost"
                                onClick={() => updateFl105((fl105) => ({
                                  ...fl105,
                                  otherClaimants: fl105.otherClaimants.filter((candidate) => candidate.id !== entry.id),
                                }))}
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
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
                <CardDescription>Draft Forms now produces prefilled FL-100, FL-110, and conditional FL-105/GC-120 in one official packet.</CardDescription>
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
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Forms in scope</p>
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
                        Maria now turns the structured workspace into an official starter packet PDF, including FL-105/GC-120 when minor children are present.
                      </p>
                    </div>
                  </div>
                </div>

                {generatedPacketName && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-sm text-emerald-900 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-100">
                    Saved <strong>{generatedPacketName}</strong> to Saved Files.
                  </div>
                )}
                {packetError && (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-sm text-rose-800 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-100">
                    {packetError}
                  </div>
                )}

                <div className="grid gap-3">
                  <Button
                    onClick={handleGeneratePacket}
                    disabled={isGeneratingPacket || missingItems.length > 0}
                    className="rounded-full bg-emerald-700 text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                  >
                    {isGeneratingPacket ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating official packet…</>
                    ) : generatedPacketName ? (
                      <><CheckCircle2 className="mr-2 h-4 w-4" /> Saved official packet</>
                    ) : (
                      'Generate official starter packet PDF'
                    )}
                  </Button>
                  <Button disabled variant="outline" className="rounded-full disabled:cursor-not-allowed disabled:opacity-60">
                    Send to concierge (after official packet generation)
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
