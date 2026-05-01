import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CountyRoadmap } from '@/components/CountyRoadmap';
import { COUNTY_GUIDES, DEFAULT_PACKET_FORMS, type CountyGuide } from '@/data/countyGuides';
import { COURT_FORMS, type CourtForm } from '@/data/forms';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { MapPin, Phone, ExternalLink, Share2, FileText, ArrowLeft, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const CONTRA_COSTA_ID = 'contra-costa';

function getCountyFromParams(countyId?: string): CountyGuide {
  const fallback = COUNTY_GUIDES.find((guide) => guide.id === CONTRA_COSTA_ID) ?? COUNTY_GUIDES[0];
  if (!countyId) return fallback;
  return COUNTY_GUIDES.find((guide) => guide.id === countyId) ?? fallback;
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
