import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Download,
  ExternalLink,
  FileCheck2,
  FileText,
  LockKeyhole,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { COUNTY_GUIDES, DEFAULT_PACKET_FORMS, type CountyGuide } from '@/data/countyGuides';
import { COURT_FORMS, type CourtForm } from '@/data/forms';

interface AssistantStep {
  title: string;
  body: string;
  helper: string;
  icon: typeof FileCheck2;
}

const STARTER_PACKET_FORM_IDS = DEFAULT_PACKET_FORMS.filter((formId) => formId !== 'fl-120');

const ASSISTANT_STEPS: AssistantStep[] = [
  {
    title: 'Prepare packet',
    body: 'Collect the required statewide forms, fee-waiver forms when needed, county notes, and proof-of-service follow-ups.',
    helper: 'Maria prepares the checklist and PDF links. The user still reviews every document before filing.',
    icon: FileCheck2,
  },
  {
    title: 'Verify readiness',
    body: 'Confirm signatures, captions, filing fee/fee waiver, searchable PDFs, and any county-specific cover sheets.',
    helper: 'The assistant blocks the portal handoff until the user acknowledges the review checklist.',
    icon: ClipboardCheck,
  },
  {
    title: 'Open official portal',
    body: 'Launch the court or court-approved e-filing page in a new tab with the packet manifest ready to copy.',
    helper: 'No hidden integration, scraping, credential capture, or automated submission.',
    icon: ExternalLink,
  },
  {
    title: 'User authorizes + submits',
    body: 'The filer logs in, uploads the PDFs, pays or submits a fee waiver, reviews the receipt, and clicks submit themselves.',
    helper: 'DivorceOS records next steps only after the user confirms what happened.',
    icon: ShieldCheck,
  },
];

function getDefaultCountyId() {
  return COUNTY_GUIDES.find((county) => county.id === 'los-angeles')?.id ?? COUNTY_GUIDES[0]?.id ?? '';
}

function getCountyPacketForms(county: CountyGuide): CourtForm[] {
  const formIds = county.packetFormIds?.length ? county.packetFormIds : STARTER_PACKET_FORM_IDS;
  const uniqueIds = Array.from(new Set(formIds));
  return uniqueIds
    .map((formId) => COURT_FORMS.find((form) => form.id === formId))
    .filter((form): form is CourtForm => Boolean(form));
}

function buildPacketManifest(county: CountyGuide, packetForms: CourtForm[]) {
  const portalLine = county.clerk.efilePortal
    ? `Official e-filing portal: ${county.clerk.efilePortal}`
    : 'Official e-filing portal: No portal listed yet. Use the clerk resources and courthouse filing instructions.';

  return [
    `DivorceOS guided e-file packet manifest — ${county.name}`,
    '',
    'Compliance guardrails:',
    '- User reviews every form before filing.',
    '- User opens the official court/court-approved portal directly.',
    '- User logs in, pays or submits fee waiver, authorizes, and submits.',
    '- DivorceOS does not capture portal credentials or bypass court systems.',
    '',
    'County filing details:',
    `- Filing method: ${county.filingMethod}`,
    `- Filing fee: ${county.filingFee}`,
    `- Clerk: ${county.clerk.courthouse}`,
    `- Address: ${county.clerk.address}`,
    `- Phone: ${county.clerk.phone}`,
    `- Processing time: ${county.processingTime}`,
    `- ${portalLine}`,
    '',
    'Packet checklist:',
    ...packetForms.map((form) => `- ${form.formNumber}: ${form.title} (${form.pdfUrl})`),
    '',
    'Before portal upload:',
    '- Confirm names, case type, addresses, child information, and requested orders are accurate.',
    '- Flatten/combine PDFs only if the portal requires it; keep originals for correction requests.',
    '- Include FW-001/FW-003/FW-010 only when the fee-waiver path applies.',
    '- Save the receipt, transaction ID, and conformed copies after submission.',
  ].join('\n');
}

export function EfileAssistantPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCountyId = searchParams.get('county') ?? getDefaultCountyId();
  const [countyId, setCountyId] = useState(initialCountyId);
  const [reviewComplete, setReviewComplete] = useState(false);
  const [authorizationAcknowledged, setAuthorizationAcknowledged] = useState(false);

  const county = useMemo(() => {
    return COUNTY_GUIDES.find((guide) => guide.id === countyId) ?? COUNTY_GUIDES.find((guide) => guide.id === getDefaultCountyId()) ?? COUNTY_GUIDES[0];
  }, [countyId]);

  const packetForms = useMemo(() => (county ? getCountyPacketForms(county) : []), [county]);
  const manifest = useMemo(() => (county ? buildPacketManifest(county, packetForms) : ''), [county, packetForms]);
  const canLaunchPortal = Boolean(county?.clerk.efilePortal && reviewComplete && authorizationAcknowledged);

  const handleCountyChange = (nextCountyId: string) => {
    setCountyId(nextCountyId);
    setSearchParams({ county: nextCountyId });
    setReviewComplete(false);
    setAuthorizationAcknowledged(false);
  };

  const handleCopyManifest = async () => {
    try {
      await navigator.clipboard.writeText(manifest);
      toast.success('Packet manifest copied');
    } catch (error) {
      console.error('Unable to copy e-file manifest', error);
      toast.error('Unable to copy. Download the manifest instead.');
    }
  };

  const handleDownloadManifest = () => {
    const blob = new Blob([manifest], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${county.id}-efile-packet-manifest.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast.success('Packet manifest downloaded');
  };

  const handleOpenPortal = () => {
    if (!county.clerk.efilePortal) {
      toast.error('No official portal is listed for this county yet');
      return;
    }
    if (!canLaunchPortal) {
      toast.error('Complete the review and authorization acknowledgments first');
      return;
    }
    window.open(county.clerk.efilePortal, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_14%_0%,rgba(5,150,105,0.24),transparent_24%),linear-gradient(180deg,#ecfdf5_0%,#f8fafc_48%,#ffffff_100%)] dark:bg-[radial-gradient(circle_at_16%_0%,rgba(16,185,129,0.18),transparent_24%),linear-gradient(180deg,#020617_0%,#03111f_52%,#020617_100%)]">
      <section className="py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-white/80 bg-white/75 p-8 shadow-[0_28px_90px_-42px_rgba(15,23,42,0.45)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 md:p-10">
            <Badge className="border border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200">
              Guided e-file assistant
            </Badge>
            <div className="mt-6 grid gap-8 lg:grid-cols-[1fr,340px] lg:items-end">
              <div>
                <h1 className="text-4xl font-semibold tracking-tight text-slate-950 dark:text-white md:text-6xl md:leading-[1.02]">
                  Prepare the packet. Open the official portal. You submit.
                </h1>
                <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">
                  A compliant handoff for self-represented California filers: DivorceOS organizes the filing packet and county instructions, then sends the user to the official court or approved e-filing portal for authorization and submission.
                </p>
              </div>
              <Card className="rounded-[1.5rem] border-emerald-200/80 bg-emerald-50/80 dark:border-emerald-400/20 dark:bg-emerald-400/10">
                <CardHeader>
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200">
                    <LockKeyhole className="h-5 w-5" />
                    <CardTitle className="text-lg">Compliance line</CardTitle>
                  </div>
                  <CardDescription className="text-emerald-900/80 dark:text-emerald-100/80">
                    No credential capture. No hidden submission. No bypass. The filer reviews, authorizes, pays or submits a waiver, and clicks submit in the official portal.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-8 px-4 pb-12 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[360px,1fr]">
          <Card className="self-start rounded-[1.75rem] border border-white/80 bg-white/75 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
            <CardHeader>
              <CardTitle className="text-slate-950 dark:text-white">County + portal</CardTitle>
              <CardDescription>Choose the filing county. The assistant uses the county guide packet and official e-filing link.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <Select value={county.id} onValueChange={handleCountyChange}>
                <SelectTrigger className="w-full bg-white dark:bg-slate-950/40">
                  <SelectValue placeholder="Select county" />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  {COUNTY_GUIDES.map((guide) => (
                    <SelectItem key={guide.id} value={guide.id}>{guide.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 text-sm text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                <p className="font-semibold text-slate-950 dark:text-white">{county.name}</p>
                <p className="mt-2">{county.filingMethod}</p>
                <p className="mt-2 text-slate-500 dark:text-slate-400">{county.processingTime}</p>
              </div>

              <div className="flex flex-col gap-3">
                <Button asChild variant="outline" className="justify-between rounded-full border-slate-300 bg-white text-slate-950 dark:border-white/15 dark:bg-white/5 dark:text-white">
                  <Link to={`/concierge/${county.id}`}>View county guide <ArrowRight className="h-4 w-4" /></Link>
                </Button>
                <Button asChild variant="outline" className="justify-between rounded-full border-slate-300 bg-white text-slate-950 dark:border-white/15 dark:bg-white/5 dark:text-white">
                  <Link to="/draft-forms">Prepare editable forms <ArrowRight className="h-4 w-4" /></Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              {ASSISTANT_STEPS.map((step, index) => {
                const Icon = step.icon;
                return (
                  <Card key={step.title} className="rounded-[1.5rem] border border-white/80 bg-white/75 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
                    <CardHeader>
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-200">
                          <Icon className="h-5 w-5" />
                        </div>
                        <Badge variant="outline">Step {index + 1}</Badge>
                      </div>
                      <CardTitle className="text-slate-950 dark:text-white">{step.title}</CardTitle>
                      <CardDescription className="leading-6">{step.body}</CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm text-slate-500 dark:text-slate-400">{step.helper}</CardContent>
                  </Card>
                );
              })}
            </div>

            <Card className="rounded-[1.75rem] border border-white/80 bg-white/75 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-950 dark:text-white">
                  <FileText className="h-5 w-5 text-emerald-700 dark:text-emerald-300" /> Packet prepared for {county.name}
                </CardTitle>
                <CardDescription>Use this as the filing checklist and portal upload manifest.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  {packetForms.map((form) => (
                    <div key={form.id} className="rounded-2xl border border-slate-200 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
                      <p className="font-semibold text-slate-950 dark:text-white">{form.formNumber}</p>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{form.title}</p>
                      <Button asChild variant="link" className="mt-2 h-auto px-0 text-emerald-700 dark:text-emerald-200">
                        <a href={form.pdfUrl} target="_blank" rel="noopener noreferrer">Open PDF <ExternalLink className="ml-1 h-3 w-3" /></a>
                      </Button>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="grid gap-3 sm:grid-cols-2">
                  <Button onClick={handleCopyManifest} variant="outline" className="rounded-full border-slate-300 bg-white text-slate-950 dark:border-white/15 dark:bg-white/5 dark:text-white">
                    <ClipboardCheck className="mr-2 h-4 w-4" /> Copy manifest
                  </Button>
                  <Button onClick={handleDownloadManifest} variant="outline" className="rounded-full border-slate-300 bg-white text-slate-950 dark:border-white/15 dark:bg-white/5 dark:text-white">
                    <Download className="mr-2 h-4 w-4" /> Download manifest
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[1.75rem] border border-emerald-200/80 bg-emerald-50/75 shadow-sm backdrop-blur-xl dark:border-emerald-400/20 dark:bg-emerald-400/10">
              <CardHeader>
                <CardTitle className="text-emerald-950 dark:text-emerald-100">Official portal handoff</CardTitle>
                <CardDescription className="text-emerald-900/80 dark:text-emerald-100/80">
                  The launch button activates only after the user confirms review and submission responsibility.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <label className="flex gap-3 rounded-2xl border border-emerald-200 bg-white/65 p-4 text-sm text-emerald-950 dark:border-emerald-400/20 dark:bg-slate-950/20 dark:text-emerald-50">
                  <Checkbox checked={reviewComplete} onCheckedChange={(checked) => setReviewComplete(checked === true)} />
                  <span>I reviewed the packet, confirmed the forms are accurate, and understand court rejection/correction rules may apply.</span>
                </label>
                <label className="flex gap-3 rounded-2xl border border-emerald-200 bg-white/65 p-4 text-sm text-emerald-950 dark:border-emerald-400/20 dark:bg-slate-950/20 dark:text-emerald-50">
                  <Checkbox checked={authorizationAcknowledged} onCheckedChange={(checked) => setAuthorizationAcknowledged(checked === true)} />
                  <span>I understand I must log in to the official portal, authorize payment or fee waiver submission, and personally click submit.</span>
                </label>

                <Button
                  onClick={handleOpenPortal}
                  disabled={!canLaunchPortal}
                  className="w-full rounded-full bg-emerald-700 text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-55 dark:bg-emerald-700 dark:hover:bg-emerald-600"
                >
                  <ExternalLink className="mr-2 h-4 w-4" /> Open official e-filing portal
                </Button>

                {!county.clerk.efilePortal && (
                  <p className="text-sm text-emerald-900/80 dark:text-emerald-100/80">
                    No portal is listed for this county yet. Use the county guide resources or clerk contact, then file through the official method shown there.
                  </p>
                )}
                {canLaunchPortal && (
                  <p className="flex items-center gap-2 text-sm font-medium text-emerald-900 dark:text-emerald-100">
                    <CheckCircle2 className="h-4 w-4" /> Ready for user-controlled portal submission.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
