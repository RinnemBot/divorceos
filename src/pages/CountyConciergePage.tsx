import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CountyRoadmap } from '@/components/CountyRoadmap';
import { COUNTY_GUIDES, type CountyGuide } from '@/data/countyGuides';
import { COURT_FORMS, type CourtForm } from '@/data/forms';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { MapPin, Phone, ExternalLink, Share2, FileText, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const CONTRA_COSTA_ID = 'contra-costa';

function getCountyFromParams(countyId?: string): CountyGuide {
  const fallback = COUNTY_GUIDES.find((guide) => guide.id === CONTRA_COSTA_ID) ?? COUNTY_GUIDES[0];
  if (!countyId) return fallback;
  return COUNTY_GUIDES.find((guide) => guide.id === countyId) ?? fallback;
}

export function CountyConciergePage() {
  const { countyId } = useParams<{ countyId?: string }>();
  const county = useMemo(() => getCountyFromParams(countyId), [countyId]);

  const packetForms = useMemo(() => {
    if (!county.packetFormIds?.length) return [] as CourtForm[];
    return county.packetFormIds
      .map((formId) => COURT_FORMS.find((form) => form.id === formId))
      .filter((form): form is CourtForm => Boolean(form));
  }, [county]);

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/concierge/${county.id}`
    : `/concierge/${county.id}`;

  const handleCopyLink = async () => {
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

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-emerald-800 via-emerald-900 to-slate-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-white/20 text-white border-0">
              County Filing Concierge
            </Badge>
            {countyId && countyId !== county.id && (
              <Badge variant="outline" className="bg-white/10 text-white">Fallback applied</Badge>
            )}
          </div>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm text-emerald-100">
                <MapPin className="h-4 w-4" />
                <span>{county.name}</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
                Step-by-step filing guide for {county.name}
              </h1>
              <p className="text-lg text-emerald-100 max-w-3xl">
                We pulled the latest courthouse rules, fees, and service quirks for this county so you can file with confidence. Start with the recommended packet, then follow the concierge steps.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              {county.clerk.efilePortal && (
                <Button
                  asChild
                  variant="outline"
                  className="bg-white/10 text-white border-white/40 hover:bg-white/20"
                >
                  <a href={county.clerk.efilePortal} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" /> Open e-filing portal
                  </a>
                </Button>
              )}
              <Button
                variant="secondary"
                className="bg-white text-emerald-900 hover:bg-emerald-100"
                onClick={handleCopyLink}
              >
                <Share2 className="h-4 w-4 mr-2" /> Copy share link
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-slate-500 font-medium">Filing method</CardTitle>
              <p className="text-lg text-slate-900 font-semibold">{county.filingMethod}</p>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-slate-500 font-medium">Fees</CardTitle>
              <p className="text-lg text-slate-900 font-semibold">{county.filingFee}</p>
              <p className="text-sm text-slate-500">Response fee: {county.responseFee}</p>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-slate-500 font-medium">Processing time</CardTitle>
              <p className="text-lg text-slate-900 font-semibold">{county.processingTime}</p>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-slate-500 font-medium">Service notes</CardTitle>
              <p className="text-lg text-slate-900 font-semibold">{county.serviceNotes}</p>
            </CardHeader>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
          <Card className="self-start">
            <CardHeader>
              <div className="flex items-center gap-2 text-sm text-slate-500 font-semibold">
                <MapPin className="h-4 w-4" /> Clerk of Court
              </div>
              <CardTitle className="text-xl">{county.clerk.courthouse}</CardTitle>
              <CardDescription className="space-y-1 text-slate-600">
                <p>{county.clerk.address}</p>
                <p>{county.clerk.hours}</p>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>{county.clerk.phone}</span>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {county.resources?.length && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-2">Local resources</p>
                  <div className="space-y-2">
                    {county.resources.map((resource) => (
                      <div key={resource.url} className="text-sm text-slate-600">
                        <Button asChild variant="link" className="px-0 text-emerald-700">
                          <a href={resource.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-1" /> {resource.label}
                          </a>
                        </Button>
                        {resource.description && (
                          <p className="text-xs text-slate-500 ml-5">{resource.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <Separator />
              <div className="flex flex-col gap-2 text-sm text-slate-600">
                <p>Need to switch counties?</p>
                <Button asChild variant="outline" size="sm">
                  <a href="#county-roadmap">Jump to county selector</a>
                </Button>
                <Button asChild variant="ghost" size="sm" className="justify-start text-slate-500">
                  <Link to="/">
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back to Home
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            {packetForms.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Recommended packet</CardTitle>
                  <CardDescription>
                    These are the statewide forms most Contra Costa clerks expect in the opening packet. Download blanks or pair with our generator.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  {packetForms.map((form) => (
                    <div key={form.id} className="border border-slate-200 rounded-lg p-4 bg-white">
                      <p className="text-xs font-semibold text-emerald-700">{form.formNumber}</p>
                      <p className="font-medium text-slate-900">{form.title}</p>
                      <p className="text-sm text-slate-600 mt-1">{form.description}</p>
                      <div className="flex gap-2 mt-3">
                        <Button asChild size="sm">
                          <a href={form.pdfUrl} target="_blank" rel="noopener noreferrer">
                            <FileText className="h-4 w-4 mr-1" /> PDF
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
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <div id="county-roadmap">
              <CountyRoadmap initialCountyId={county.id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
