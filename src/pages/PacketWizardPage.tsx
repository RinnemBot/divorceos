import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, ClipboardList, DollarSign, FileText, Gavel, HeartHandshake, MapPin, Shield, Sparkles, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { COUNTY_GUIDES } from '@/data/countyGuides';
import { cn } from '@/lib/utils';

type CaseStage = 'starting' | 'responding' | 'temporary-orders' | 'finish-judgment' | 'modify-orders' | 'domestic-violence';
type YesNo = 'yes' | 'no' | 'unsure';

interface WizardAnswers {
  stage: CaseStage | '';
  countyId: string;
  hasChildren: YesNo | '';
  needsSupport: YesNo | '';
  needsFeeWaiver: YesNo | '';
  safetyConcern: YesNo | '';
}

interface Recommendation {
  title: string;
  badge: string;
  description: string;
  primaryCta: string;
  primaryHref: string;
  secondaryCta?: string;
  secondaryHref?: string;
  forms: string[];
  nextSteps: string[];
  tone: 'emerald' | 'blue' | 'amber' | 'rose' | 'violet';
}

const initialAnswers: WizardAnswers = {
  stage: '',
  countyId: '',
  hasChildren: '',
  needsSupport: '',
  needsFeeWaiver: '',
  safetyConcern: '',
};

const stageOptions: Array<{ value: CaseStage; title: string; description: string; icon: React.ElementType }> = [
  { value: 'starting', title: 'Start a divorce', description: 'Open a new California divorce/legal separation case.', icon: FileText },
  { value: 'responding', title: 'Respond to papers', description: 'You were served and need to file a response.', icon: HeartHandshake },
  { value: 'temporary-orders', title: 'Ask for temporary orders', description: 'Custody, support, fees, property control, or hearing orders.', icon: Gavel },
  { value: 'finish-judgment', title: 'Finish judgment', description: 'Default, uncontested, or stipulated judgment packet.', icon: CheckCircle2 },
  { value: 'modify-orders', title: 'Change existing orders', description: 'Modify custody, visitation, child support, or spousal support.', icon: ClipboardList },
  { value: 'domestic-violence', title: 'Protection / DV', description: 'Restraining order forms and safety-sensitive next steps.', icon: Shield },
];

const yesNoOptions: Array<{ value: YesNo; label: string }> = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'unsure', label: 'Not sure' },
];

const toneClasses: Record<Recommendation['tone'], string> = {
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-100',
  blue: 'border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-100',
  amber: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100',
  rose: 'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-100',
  violet: 'border-violet-200 bg-violet-50 text-violet-900 dark:border-violet-400/20 dark:bg-violet-400/10 dark:text-violet-100',
};

function yesNoLabel(value: YesNo | '') {
  return yesNoOptions.find((option) => option.value === value)?.label ?? 'Not answered';
}

function buildRecommendation(answers: WizardAnswers): Recommendation | null {
  if (!answers.stage) return null;

  const hasChildren = answers.hasChildren === 'yes' || answers.hasChildren === 'unsure';
  const needsSupport = answers.needsSupport === 'yes' || answers.needsSupport === 'unsure';
  const needsFeeWaiver = answers.needsFeeWaiver === 'yes';
  const safetyConcern = answers.safetyConcern === 'yes';

  if (answers.stage === 'domestic-violence' || safetyConcern) {
    return {
      title: 'Protection / domestic violence packet',
      badge: 'Safety-sensitive path',
      description: 'Start with the DV forms and safety-focused filing instructions. If there is immediate danger, call 911 or a local crisis resource before using any website workflow.',
      primaryCta: 'Open DV forms',
      primaryHref: '/forms',
      secondaryCta: 'Ask Maria safely',
      secondaryHref: '/#chat',
      forms: ['DV-100', 'DV-101', 'DV-105 if children are involved', 'DV-109', 'DV-110', 'DV-200 after service'],
      nextSteps: ['Gather incident dates and evidence.', 'Check your county filing method.', 'Prepare service and hearing copies.', 'Avoid using shared devices/accounts if unsafe.'],
      tone: 'rose',
    };
  }

  if (answers.stage === 'temporary-orders' || answers.stage === 'modify-orders') {
    return {
      title: answers.stage === 'modify-orders' ? 'Modification / RFO packet' : 'Request for Order packet',
      badge: 'Hearing request',
      description: 'Use this when you need the court to make or change orders before final judgment, including custody, support, fees, or property control.',
      primaryCta: 'Start Draft Forms',
      primaryHref: '/draft-forms',
      secondaryCta: 'Open support tools',
      secondaryHref: '/support-tools',
      forms: ['FL-300', hasChildren ? 'FL-311 / FL-341 attachments' : 'Custody forms only if children are involved', needsSupport ? 'FL-150' : 'FL-150 if support/fees are requested', needsFeeWaiver ? 'FW-001' : 'FW-001 if fees are a problem'],
      nextSteps: ['Write the facts supporting the requested order.', 'Attach FL-150 for support or attorney fees.', 'Check service deadlines before selecting a hearing date.', 'Use county concierge for local filing rules.'],
      tone: 'blue',
    };
  }

  if (answers.stage === 'responding') {
    return {
      title: 'Response packet',
      badge: '30-day response path',
      description: 'Use this when you were served with divorce papers and need to preserve your right to participate before default is entered.',
      primaryCta: 'Open response forms',
      primaryHref: '/forms',
      secondaryCta: 'Check county filing',
      secondaryHref: answers.countyId ? `/concierge/${answers.countyId}` : '/concierge',
      forms: ['FL-120', hasChildren ? 'FL-105 / GC-120' : 'FL-105 only if minor children are involved', needsSupport ? 'FL-150' : 'FL-150 if support is at issue', needsFeeWaiver ? 'FW-001' : 'FW-001 if fees are a problem'],
      nextSteps: ['Confirm the service date and response deadline.', 'File FL-120 before default risk.', 'Serve filed copies on the petitioner.', 'Start disclosures after filing.'],
      tone: 'amber',
    };
  }

  if (answers.stage === 'finish-judgment') {
    return {
      title: 'Judgment packet',
      badge: 'Finish the case',
      description: 'Use this when the case is ready for default, uncontested, or stipulated judgment paperwork.',
      primaryCta: 'Open judgment forms',
      primaryHref: '/forms',
      secondaryCta: 'Review saved files',
      secondaryHref: '/dashboard',
      forms: ['FL-180', 'FL-190', 'FL-170 or FL-130 depending on path', hasChildren ? 'FL-341 / FL-342 / FL-192 as needed' : 'Support/custody attachments only if needed', 'FL-345 / FL-346 / FL-347 / FL-348 as applicable'],
      nextSteps: ['Confirm preliminary disclosures are complete.', 'Pick default, uncontested, or stipulated path.', 'Attach all judgment terms clearly.', 'Check county judgment review requirements.'],
      tone: 'violet',
    };
  }

  return {
    title: 'Starter divorce packet',
    badge: 'New case path',
    description: 'Start here when you are opening a California divorce or legal separation case.',
    primaryCta: 'Generate starter packet',
    primaryHref: '/draft-forms',
    secondaryCta: 'Check county filing',
    secondaryHref: answers.countyId ? `/concierge/${answers.countyId}` : '/concierge',
    forms: ['FL-100', 'FL-110', hasChildren ? 'FL-105 / GC-120' : 'FL-105 only if minor children are involved', needsSupport ? 'FL-150' : 'FL-150 if support is requested', needsFeeWaiver ? 'FW-001' : 'FW-001 if fees are a problem'],
    nextSteps: ['Fill the starter packet with Maria.', 'Review all court/county fields.', 'Save the generated PDF to Saved Files.', 'Use county concierge for e-filing/service steps.'],
    tone: 'emerald',
  };
}

function ChoiceButton({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-white/90 dark:hover:bg-white/10',
        selected
          ? 'border-emerald-400 bg-emerald-50 shadow-sm dark:border-emerald-400/60 dark:bg-emerald-400/10'
          : 'border-slate-200 bg-white/70 dark:border-white/10 dark:bg-white/5',
      )}
    >
      {children}
    </button>
  );
}

export function PacketWizardPage() {
  const [answers, setAnswers] = useState<WizardAnswers>(initialAnswers);
  const recommendation = useMemo(() => buildRecommendation(answers), [answers]);
  const selectedCounty = COUNTY_GUIDES.find((county) => county.id === answers.countyId) ?? null;
  const answeredCount = [answers.stage, answers.countyId, answers.hasChildren, answers.needsSupport, answers.needsFeeWaiver, answers.safetyConcern].filter(Boolean).length;
  const progress = Math.round((answeredCount / 6) * 100);

  const update = <K extends keyof WizardAnswers>(key: K, value: WizardAnswers[K]) => {
    setAnswers((current) => ({ ...current, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_14%_0%,rgba(5,150,105,0.3),transparent_24%),radial-gradient(circle_at_86%_8%,rgba(16,185,129,0.18),transparent_20%),linear-gradient(180deg,#e7fbef_0%,#def7e8_44%,#f1faf5_100%)] py-12 dark:bg-[radial-gradient(circle_at_16%_0%,rgba(16,185,129,0.24),transparent_24%),radial-gradient(circle_at_84%_10%,rgba(34,211,238,0.16),transparent_20%),linear-gradient(180deg,#020617_0%,#03111f_50%,#020617_100%)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <section className="rounded-[2rem] border border-white/80 bg-white/72 p-8 shadow-[0_28px_90px_-42px_rgba(15,23,42,0.35)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 md:p-12">
          <Badge className="mb-5 border border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200">
            <Sparkles className="mr-1 h-3 w-3" /> What do I need?
          </Badge>
          <div className="grid gap-8 lg:grid-cols-[1.1fr,0.9fr] lg:items-end">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight text-slate-950 dark:text-white md:text-6xl md:leading-[1.02]">
                Answer a few questions. Maria points you to the right packet.
              </h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">
                This is the plain-English front door for DivorceOS: choose your situation, county, kids/support/fee-waiver needs, and get the next best workflow.
              </p>
            </div>
            <Card className="rounded-[1.75rem] border-white/80 bg-white/80 dark:border-white/10 dark:bg-white/5">
              <CardContent className="p-5">
                <div className="mb-3 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-600 dark:text-slate-300">Wizard progress</span>
                  <span className="font-semibold text-emerald-700 dark:text-emerald-200">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
                <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
                  No legal advice. This routes you to forms and filing workflows to review.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr,380px]">
          <div className="space-y-6">
            <Card className="rounded-[1.75rem] border-white/80 bg-white/72 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
              <CardHeader>
                <CardTitle>1. What are you trying to do?</CardTitle>
                <CardDescription>Pick the closest match. You can still adjust later.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                {stageOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <ChoiceButton key={option.value} selected={answers.stage === option.value} onClick={() => update('stage', option.value)}>
                      <div className="flex gap-3">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-950 dark:text-white">{option.title}</p>
                          <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{option.description}</p>
                        </div>
                      </div>
                    </ChoiceButton>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="rounded-[1.75rem] border-white/80 bg-white/72 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
              <CardHeader>
                <CardTitle>2. Where and what issues?</CardTitle>
                <CardDescription>These answers decide county routing and add-on forms.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                    <MapPin className="h-4 w-4 text-emerald-600" /> County
                  </label>
                  <select
                    value={answers.countyId}
                    onChange={(event) => update('countyId', event.target.value)}
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 dark:border-white/10 dark:bg-slate-950 dark:text-white dark:focus:ring-emerald-400/10"
                  >
                    <option value="">Choose county</option>
                    {COUNTY_GUIDES.map((county) => (
                      <option key={county.id} value={county.id}>{county.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {[
                    ['hasChildren', 'Minor children involved?', Users],
                    ['needsSupport', 'Need child/spousal support or fees?', DollarSign],
                    ['needsFeeWaiver', 'Need filing fee waiver?', FileText],
                    ['safetyConcern', 'Domestic violence / urgent safety concern?', Shield],
                  ].map(([key, label, Icon]) => (
                    <div key={key as string} className="rounded-3xl border border-slate-200 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
                      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
                        <Icon className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
                        {label as string}
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {yesNoOptions.map((option) => (
                          <Button
                            key={option.value}
                            type="button"
                            size="sm"
                            variant={answers[key as keyof WizardAnswers] === option.value ? 'default' : 'outline'}
                            className={cn('rounded-full', answers[key as keyof WizardAnswers] === option.value && 'bg-emerald-700 text-white hover:bg-emerald-800')}
                            onClick={() => update(key as keyof WizardAnswers, option.value as never)}
                          >
                            {option.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <Card className="rounded-[1.75rem] border-white/80 bg-white/80 shadow-[0_20px_70px_-45px_rgba(15,23,42,0.4)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-emerald-600" /> Recommendation
                </CardTitle>
                <CardDescription>Updates as you answer.</CardDescription>
              </CardHeader>
              <CardContent>
                {recommendation ? (
                  <div className="space-y-5">
                    <div className={cn('rounded-3xl border p-4', toneClasses[recommendation.tone])}>
                      <Badge variant="outline" className="mb-3 bg-white/50 dark:bg-white/5">{recommendation.badge}</Badge>
                      <h2 className="text-xl font-semibold">{recommendation.title}</h2>
                      <p className="mt-2 text-sm leading-6 opacity-90">{recommendation.description}</p>
                    </div>

                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Likely forms</p>
                      <div className="flex flex-wrap gap-2">
                        {recommendation.forms.map((form) => (
                          <Badge key={form} variant="secondary" className="rounded-full">{form}</Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Next steps</p>
                      <ul className="space-y-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                        {recommendation.nextSteps.map((step) => (
                          <li key={step} className="flex gap-2">
                            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="grid gap-2">
                      <Button asChild className="rounded-full bg-emerald-700 text-white hover:bg-emerald-800">
                        <Link to={recommendation.primaryHref}>{recommendation.primaryCta}<ArrowRight className="ml-2 h-4 w-4" /></Link>
                      </Button>
                      {recommendation.secondaryHref && recommendation.secondaryCta && (
                        <Button asChild variant="outline" className="rounded-full">
                          <Link to={recommendation.secondaryHref}>{recommendation.secondaryCta}</Link>
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-3xl border border-dashed border-slate-300 p-6 text-center dark:border-white/15">
                    <ClipboardList className="mx-auto h-10 w-10 text-slate-400" />
                    <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
                      Choose what you are trying to do and Maria will build the first recommendation.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-[1.75rem] border-white/80 bg-white/72 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
              <CardHeader>
                <CardTitle className="text-base">Current answers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <p><strong>Path:</strong> {stageOptions.find((option) => option.value === answers.stage)?.title ?? 'Not answered'}</p>
                <p><strong>County:</strong> {selectedCounty?.name ?? 'Not answered'}</p>
                <p><strong>Children:</strong> {yesNoLabel(answers.hasChildren)}</p>
                <p><strong>Support/fees:</strong> {yesNoLabel(answers.needsSupport)}</p>
                <p><strong>Fee waiver:</strong> {yesNoLabel(answers.needsFeeWaiver)}</p>
                <p><strong>Safety concern:</strong> {yesNoLabel(answers.safetyConcern)}</p>
                <Button variant="ghost" size="sm" className="mt-2 rounded-full" onClick={() => setAnswers(initialAnswers)}>Reset wizard</Button>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
