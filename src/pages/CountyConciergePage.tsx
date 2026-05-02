import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CountyRoadmap } from '@/components/CountyRoadmap';
import { COUNTY_GUIDES, DEFAULT_PACKET_FORMS, type CountyGuide } from '@/data/countyGuides';
import { COURT_FORMS, type CourtForm } from '@/data/forms';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, ClipboardCheck, Download, ExternalLink, FileText, MapPin, Phone, Printer, Send, Share2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const CONTRA_COSTA_ID = 'contra-costa';

function getCountyFromParams(countyId?: string): CountyGuide {
  const fallback = COUNTY_GUIDES.find((guide) => guide.id === CONTRA_COSTA_ID) ?? COUNTY_GUIDES[0];
  if (!countyId) return fallback;
  return COUNTY_GUIDES.find((guide) => guide.id === countyId) ?? fallback;
}

function buildCountyPacketChecklist(county: CountyGuide, packetForms: CourtForm[]) {
  const formLines = packetForms.map((form) => {
    const instructions = form.instructionsUrl ? `\n   Instructions: ${form.instructionsUrl}` : '';
    const pdfUrl = form.pdfUrl.startsWith('http') ? form.pdfUrl : `${typeof window !== 'undefined' ? window.location.origin : 'https://www.divorce-os.com'}${form.pdfUrl}`;
    return `- ${form.formNumber}: ${form.title}\n   PDF: ${pdfUrl}${instructions}`;
  });

  const resources = county.resources?.length
    ? county.resources.map((resource) => `- ${resource.label}: ${resource.url}${resource.description ? `\n  ${resource.description}` : ''}`).join('\n')
    : '- No local resources listed yet.';

  return [
    `${county.name} DivorceOS Packet Checklist`,
    '',
    `Filing method: ${county.filingMethod}`,
    `Filing fee: ${county.filingFee}`,
    `Response fee: ${county.responseFee}`,
    `Processing time: ${county.processingTime}`,
    `Service notes: ${county.serviceNotes}`,
    '',
    'Clerk of Court',
    `- ${county.clerk.courthouse}`,
    `- ${county.clerk.address}`,
    `- ${county.clerk.hours}`,
    `- ${county.clerk.phone}`,
    '',
    'Recommended packet forms',
    ...formLines,
    '',
    'Local resources',
    resources,
    '',
    'Next steps',
    '1. Generate an editable packet in DivorceOS Draft Forms.',
    '2. Review every field before filing.',
    '3. Follow the county e-file or clerk filing instructions.',
    '4. Serve the other party and file proof of service.',
    '5. Track filed documents and deadlines in your dashboard.',
  ].join('\n');
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildCountyPacketManifestHtml(county: CountyGuide, packetForms: CourtForm[]) {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.divorce-os.com';
  const formRows = packetForms.map((form) => {
    const pdfUrl = form.pdfUrl.startsWith('http') ? form.pdfUrl : `${origin}${form.pdfUrl}`;
    return `
      <tr>
        <td><strong>${escapeHtml(form.formNumber)}</strong></td>
        <td>${escapeHtml(form.title)}<br><span>${escapeHtml(form.description)}</span></td>
        <td><a href="${escapeHtml(pdfUrl)}">PDF</a>${form.instructionsUrl ? ` · <a href="${escapeHtml(form.instructionsUrl)}">Instructions</a>` : ''}</td>
      </tr>
    `;
  }).join('');
  const resources = county.resources?.length
    ? county.resources.map((resource) => `<li><a href="${escapeHtml(resource.url)}">${escapeHtml(resource.label)}</a>${resource.description ? `<br><span>${escapeHtml(resource.description)}</span>` : ''}</li>`).join('')
    : '<li>No local resources listed yet.</li>';

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(county.name)} DivorceOS Packet Manifest</title>
  <style>
    @page { margin: 0.55in; }
    body { font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #0f172a; line-height: 1.45; }
    .header { border-bottom: 3px solid #047857; padding-bottom: 18px; margin-bottom: 22px; }
    .eyebrow { color: #047857; font-size: 11px; font-weight: 800; letter-spacing: 0.18em; text-transform: uppercase; }
    h1 { font-size: 30px; line-height: 1.05; margin: 8px 0 8px; }
    h2 { font-size: 16px; margin-top: 24px; border-bottom: 1px solid #d1fae5; padding-bottom: 6px; }
    .summary { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-top: 18px; }
    .box { border: 1px solid #d1fae5; border-radius: 14px; padding: 12px; background: #f0fdf4; }
    .label { display: block; color: #64748b; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
    .value { display: block; margin-top: 4px; font-weight: 700; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
    th, td { border-bottom: 1px solid #e2e8f0; padding: 10px 8px; text-align: left; vertical-align: top; }
    th { color: #475569; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; }
    td span, li span, .fine-print { color: #64748b; font-size: 12px; }
    a { color: #047857; text-decoration: none; font-weight: 700; }
    ol, ul { padding-left: 20px; }
    li { margin: 7px 0; }
    .footer { margin-top: 28px; padding-top: 14px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 11px; }
    @media print { .no-print { display: none; } body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
  </style>
</head>
<body>
  <button class="no-print" onclick="window.print()" style="position:fixed;right:18px;top:18px;border:0;border-radius:999px;background:#047857;color:white;padding:10px 16px;font-weight:700;box-shadow:0 10px 25px rgba(15,23,42,.18);">Print / Save PDF</button>
  <section class="header">
    <div class="eyebrow">DivorceOS County Packet Manifest</div>
    <h1>${escapeHtml(county.name)}</h1>
    <p class="fine-print">Use this as a working checklist. Always review official court instructions before filing.</p>
    <div class="summary">
      <div class="box"><span class="label">Filing method</span><span class="value">${escapeHtml(county.filingMethod)}</span></div>
      <div class="box"><span class="label">Fees</span><span class="value">${escapeHtml(county.filingFee)} · Response: ${escapeHtml(county.responseFee)}</span></div>
      <div class="box"><span class="label">Processing time</span><span class="value">${escapeHtml(county.processingTime)}</span></div>
      <div class="box"><span class="label">Service notes</span><span class="value">${escapeHtml(county.serviceNotes)}</span></div>
    </div>
  </section>

  <h2>Clerk of Court</h2>
  <p><strong>${escapeHtml(county.clerk.courthouse)}</strong><br>${escapeHtml(county.clerk.address)}<br>${escapeHtml(county.clerk.hours)}<br>${escapeHtml(county.clerk.phone)}</p>

  <h2>Recommended packet forms</h2>
  <table>
    <thead><tr><th>Form</th><th>Purpose</th><th>Links</th></tr></thead>
    <tbody>${formRows}</tbody>
  </table>

  <h2>Local resources</h2>
  <ul>${resources}</ul>

  <h2>Execution checklist</h2>
  <ol>
    <li>Generate an editable packet in DivorceOS Draft Forms.</li>
    <li>Review every form field before filing.</li>
    <li>Follow the county e-file or clerk filing instructions.</li>
    <li>Serve the other party and file proof of service.</li>
    <li>Track filed documents and deadlines in your DivorceOS dashboard.</li>
  </ol>

  <div class="footer">Generated by DivorceOS. Informational only — not legal advice and not a substitute for review by a qualified California family law attorney.</div>
</body>
</html>`;
}

export function CountyConciergePage() {
  const { countyId } = useParams<{ countyId?: string }>();
  const navigate = useNavigate();
  const county = useMemo(() => {
    if (!countyId) return null;
    return getCountyFromParams(countyId);
  }, [countyId]);

  const packetForms = useMemo(() => {
    if (!county) return [] as CourtForm[];
    const formIds = county.packetFormIds?.length ? county.packetFormIds : DEFAULT_PACKET_FORMS;
    return formIds
      .map((formId) => COURT_FORMS.find((form) => form.id === formId))
      .filter((form): form is CourtForm => Boolean(form));
  }, [county]);

  const shareUrl = county
    ? (typeof window !== 'undefined'
      ? `${window.location.origin}/concierge/${county.id}`
      : `/concierge/${county.id}`)
    : null;

  const actionCards = county ? [
    {
      title: 'Generate editable packet',
      description: 'Open Draft Forms and create a packet Maria can save to your dashboard.',
      icon: Sparkles,
      cta: 'Generate packet',
      href: '/draft-forms',
      tone: 'from-emerald-500/18 via-white to-cyan-500/10 dark:from-emerald-400/15 dark:via-white/5 dark:to-cyan-400/10',
    },
    {
      title: 'Download packet',
      description: 'Save a county checklist with links to each recommended official form.',
      icon: Download,
      cta: 'Download checklist',
      onClick: 'download' as const,
      tone: 'from-sky-500/16 via-white to-emerald-500/10 dark:from-sky-400/15 dark:via-white/5 dark:to-emerald-400/10',
    },
    {
      title: 'Print/PDF manifest',
      description: 'Open a polished packet manifest you can print or save as PDF.',
      icon: Printer,
      cta: 'Print manifest',
      onClick: 'print' as const,
      tone: 'from-teal-500/16 via-white to-cyan-500/10 dark:from-teal-400/15 dark:via-white/5 dark:to-cyan-400/10',
    },
    {
      title: 'E-file instructions',
      description: `Open the guided e-file path for ${county.name}.`,
      icon: ExternalLink,
      cta: 'Open e-file guide',
      href: `/efile-assistant?county=${county.id}`,
      tone: 'from-amber-400/18 via-white to-emerald-500/10 dark:from-amber-300/15 dark:via-white/5 dark:to-emerald-400/10',
    },
    {
      title: 'Serve papers',
      description: 'Jump to service tasks: assign a server, prepare proof, and file it.',
      icon: Send,
      cta: 'Open service tasks',
      href: '/dashboard?tab=service',
      tone: 'from-violet-500/16 via-white to-sky-500/10 dark:from-violet-400/15 dark:via-white/5 dark:to-sky-400/10',
    },
    {
      title: 'Track filing',
      description: 'Use the dashboard to track county steps, saved files, and next deadlines.',
      icon: ClipboardCheck,
      cta: 'Track in dashboard',
      href: '/dashboard?tab=county',
      tone: 'from-rose-500/14 via-white to-amber-500/10 dark:from-rose-400/15 dark:via-white/5 dark:to-amber-400/10',
    },
  ] : [];

  const handleCountyChange = (selectedCountyId: string) => {
    navigate(`/concierge/${selectedCountyId}`);
  };

  const handleCopyLink = async () => {
    if (!shareUrl) {
      toast.error('Pick a county first');
      return;
    }
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Share link copied');
      } else {
        throw new Error('Clipboard unavailable');
      }
    } catch (error) {
      console.error('Failed to copy concierge link', error);
      toast.error('Unable to copy link. Copy manually instead.');
    }
  };

  const handleDownloadPacketChecklist = () => {
    if (!county) return;
    const checklist = buildCountyPacketChecklist(county, packetForms);
    const blob = new Blob([checklist], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${county.id}-divorceos-packet-checklist.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    toast.success('County packet checklist downloaded');
  };

  const handlePrintPacketManifest = () => {
    if (!county) return;
    const printWindow = window.open('', '_blank', 'noopener,noreferrer');
    if (!printWindow) {
      toast.error('Popup blocked. Allow popups to print the packet manifest.');
      return;
    }
    printWindow.document.open();
    printWindow.document.write(buildCountyPacketManifestHtml(county, packetForms));
    printWindow.document.close();
    toast.success('Packet manifest opened');
  };

  if (!county) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_14%_0%,rgba(5,150,105,0.3),transparent_24%),radial-gradient(circle_at_86%_8%,rgba(16,185,129,0.18),transparent_20%),linear-gradient(180deg,#e7fbef_0%,#def7e8_44%,#f1faf5_100%)] dark:bg-[radial-gradient(circle_at_16%_0%,rgba(16,185,129,0.24),transparent_24%),radial-gradient(circle_at_84%_10%,rgba(34,211,238,0.16),transparent_20%),linear-gradient(180deg,#020617_0%,#03111f_50%,#020617_100%)]">
        <section className="py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-[2rem] border border-white/80 bg-white/72 p-8 text-center shadow-[0_28px_90px_-42px_rgba(15,23,42,0.4)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 md:p-12">
              <Badge className="mb-5 border border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200">
                County Filing Concierge
              </Badge>
              <h1 className="text-4xl font-semibold tracking-tight text-slate-950 dark:text-white md:text-6xl md:leading-[1.02]">
                Pick your county and let Maria lead the filing path.
              </h1>
              <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">
                We cover 40+ California counties with filing methods, packet checklists, local quirks, and courthouse links, with deeper workflows still expanding.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Button asChild size="lg" className="rounded-full bg-emerald-700 text-white hover:bg-emerald-800 dark:bg-emerald-700 dark:text-white dark:hover:bg-emerald-600">
                  <a href="#county-roadmap">Browse concierge counties</a>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-full border-slate-300 bg-white text-slate-950 hover:bg-slate-50 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10">
                  <Link to="/pricing">See plan coverage</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 space-y-8">
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                title: 'Statewide research',
                body: 'Every county entry is grounded in current clerk pages, fees, and process quirks so Maria can point you to the right next step.',
              },
              {
                title: 'Concierge support',
                body: 'Essential+ plans already include county filing support today, with more direct workflows still rolling out.',
              },
              {
                title: 'Cleaner execution',
                body: 'The goal is to make Maria the front door, and county operations the action layer behind her.',
              },
            ].map((card) => (
              <Card key={card.title} className="rounded-[1.75rem] border border-white/80 bg-white/72 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
                <CardHeader>
                  <CardTitle className="text-lg text-slate-900 dark:text-white">{card.title}</CardTitle>
                  <CardDescription className="text-sm leading-6 text-slate-600 dark:text-slate-300">{card.body}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>

          <div id="county-roadmap">
            <CountyRoadmap onCountyChange={handleCountyChange} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_14%_0%,rgba(5,150,105,0.3),transparent_24%),radial-gradient(circle_at_86%_8%,rgba(16,185,129,0.18),transparent_20%),linear-gradient(180deg,#e7fbef_0%,#def7e8_44%,#f1faf5_100%)] dark:bg-[radial-gradient(circle_at_16%_0%,rgba(16,185,129,0.24),transparent_24%),radial-gradient(circle_at_84%_10%,rgba(34,211,238,0.16),transparent_20%),linear-gradient(180deg,#020617_0%,#03111f_50%,#020617_100%)]">
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-white/80 bg-white/72 p-8 shadow-[0_28px_90px_-42px_rgba(15,23,42,0.4)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/5">
            <div className="flex items-center gap-2">
              <Badge className="border border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200">
                County Filing Concierge
              </Badge>
              {countyId && countyId !== county.id && (
                <Badge variant="outline" className="bg-white/60 dark:bg-white/5">Fallback applied</Badge>
              )}
            </div>

            <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                  <MapPin className="h-4 w-4" />
                  <span>{county.name}</span>
                </div>
                <h1 className="text-4xl font-semibold tracking-tight text-slate-950 dark:text-white md:text-5xl md:leading-[1.04]">
                  Maria’s filing guide for {county.name}
                </h1>
                <p className="max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">
                  Start with the right packet, see the latest filing rules, and move through local courthouse quirks with more confidence.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild variant="outline" className="rounded-full border-slate-300 bg-white text-slate-950 hover:bg-slate-50 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10">
                  <Link to={`/efile-assistant?county=${county.id}`}>
                    <ExternalLink className="mr-2 h-4 w-4" /> Guided e-file assistant
                  </Link>
                </Button>
                <Button onClick={handleCopyLink} className="rounded-full bg-emerald-700 text-white hover:bg-emerald-800 dark:bg-emerald-700 dark:text-white dark:hover:bg-emerald-600">
                  <Share2 className="mr-2 h-4 w-4" /> Copy share link
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 space-y-10">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          {actionCards.map((action) => {
            const Icon = action.icon;
            const content = (
              <Card className={`h-full overflow-hidden rounded-[1.5rem] border-white/80 bg-gradient-to-br shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg dark:border-white/10 ${action.tone}`}>
                <CardContent className="flex h-full flex-col justify-between p-5">
                  <div>
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/80 text-emerald-700 shadow-sm dark:bg-white/10 dark:text-emerald-200">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h2 className="font-semibold text-slate-950 dark:text-white">{action.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{action.description}</p>
                  </div>
                  <div className="mt-5 inline-flex items-center text-sm font-semibold text-emerald-700 dark:text-emerald-200">
                    {action.cta}
                    <ExternalLink className="ml-1 h-3.5 w-3.5" />
                  </div>
                </CardContent>
              </Card>
            );

            if ('onClick' in action) {
              return (
                <button
                  key={action.title}
                  type="button"
                  className="text-left"
                  onClick={action.onClick === 'print' ? handlePrintPacketManifest : handleDownloadPacketChecklist}
                >
                  {content}
                </button>
              );
            }

            return (
              <Link key={action.title} to={action.href}>
                {content}
              </Link>
            );
          })}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            ['Filing method', county.filingMethod],
            ['Fees', county.filingFee, `Response fee: ${county.responseFee}`],
            ['Processing time', county.processingTime],
            ['Service notes', county.serviceNotes],
          ].map(([label, value, subvalue]) => (
            <Card key={label} className="rounded-[1.5rem] border border-white/80 bg-white/72 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</CardTitle>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">{value}</p>
                {subvalue && <p className="text-sm text-slate-500 dark:text-slate-400">{subvalue}</p>}
              </CardHeader>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
          <Card className="self-start rounded-[1.75rem] border border-white/80 bg-white/72 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
            <CardHeader>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
                <MapPin className="h-4 w-4" /> Clerk of Court
              </div>
              <CardTitle className="text-xl text-slate-950 dark:text-white">{county.clerk.courthouse}</CardTitle>
              <CardDescription className="space-y-1 text-slate-600 dark:text-slate-300">
                <p>{county.clerk.address}</p>
                <p>{county.clerk.hours}</p>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>{county.clerk.phone}</span>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {county.resources?.length ? (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Local resources</p>
                  <div className="space-y-2">
                    {county.resources.map((resource) => (
                      <div key={resource.url} className="text-sm text-slate-600 dark:text-slate-300">
                        <Button asChild variant="link" className="px-0 text-emerald-700 dark:text-emerald-200">
                          <a href={resource.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="mr-1 h-4 w-4" /> {resource.label}
                          </a>
                        </Button>
                        {resource.description && <p className="ml-5 text-xs text-slate-500 dark:text-slate-400">{resource.description}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              <Separator />
              <div className="flex flex-col gap-2 text-sm text-slate-600 dark:text-slate-300">
                <p>Need to switch counties?</p>
                <Button asChild variant="outline" size="sm" className="rounded-full">
                  <a href="#county-roadmap">Jump to county selector</a>
                </Button>
                <Button asChild variant="ghost" size="sm" className="justify-start rounded-full text-slate-500 dark:text-slate-300">
                  <Link to="/">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            {packetForms.length > 0 && (
              <Card className="rounded-[1.75rem] border border-white/80 bg-white/72 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
                <CardHeader>
                  <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-200">
                    <Sparkles className="h-4 w-4" /> Recommended packet
                  </div>
                  <CardTitle className="text-xl text-slate-950 dark:text-white">Start with the forms most {county.name} clerks expect.</CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-300">
                    Download the core packet here, then use Maria to work through what each form is doing and what comes after filing.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  {packetForms.map((form) => (
                    <div key={form.id} className="rounded-3xl border border-slate-200 bg-white/80 p-4 dark:border-white/10 dark:bg-white/5">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-200">{form.formNumber}</p>
                      <p className="mt-1 font-semibold text-slate-900 dark:text-white">{form.title}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{form.description}</p>
                      <div className="mt-3 flex gap-2">
                        <Button asChild size="sm" className="rounded-full bg-emerald-700 text-white hover:bg-emerald-800 dark:bg-emerald-700 dark:text-white dark:hover:bg-emerald-600">
                          <a href={form.pdfUrl} target="_blank" rel="noopener noreferrer">
                            <FileText className="mr-1 h-4 w-4" /> PDF
                          </a>
                        </Button>
                        {form.instructionsUrl && (
                          <Button asChild size="sm" variant="outline" className="rounded-full">
                            <a href={form.instructionsUrl} target="_blank" rel="noopener noreferrer">
                              Instructions
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <div id="county-roadmap">
              <CountyRoadmap initialCountyId={county.id} onCountyChange={handleCountyChange} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
