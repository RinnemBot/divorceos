import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  FileText,
  Download,
  ExternalLink,
  File,
  AlertCircle,
  BookOpen,
  Scale,
  Users,
  DollarSign,
  Home,
  Shield,
  CheckSquare,
  Sparkles,
} from 'lucide-react';
import { COURT_FORMS, FORM_CATEGORIES, searchForms, getFormsByCategory } from '@/data/forms';
import type { CourtForm } from '@/data/forms';
import { FORM_GUIDANCE } from '@/data/formGuidance';
import { authService, type User } from '@/services/auth';

const categoryIcons: Record<string, React.ElementType> = {
  petition: FileText,
  response: Scale,
  financial: DollarSign,
  custody: Users,
  support: DollarSign,
  property: Home,
  dv: Shield,
  judgment: CheckSquare,
};

type SubscriptionPlan = User['subscription'];

function FormCard({ form, currentPlan }: { form: CourtForm; currentPlan: SubscriptionPlan }) {
  const guidance = FORM_GUIDANCE[form.id];
  const hasDetailedGuidance = ['essential', 'plus', 'done-for-you'].includes(currentPlan);
  const hasBasicGuidance = currentPlan === 'basic';
  const guidanceText = guidance
    ? hasDetailedGuidance
      ? guidance.detailed
      : hasBasicGuidance
        ? guidance.basic
        : null
    : null;
  const shouldUpsell = guidance && currentPlan === 'free';

  return (
    <Card className="group rounded-[1.75rem] border border-white/80 bg-white/85 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.3)] backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_28px_90px_-42px_rgba(15,23,42,0.4)] dark:border-white/10 dark:bg-white/5">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="font-mono text-xs">
                {form.formNumber}
              </Badge>
              {form.instructionsUrl && (
                <Badge variant="outline" className="text-xs">
                  <BookOpen className="mr-1 h-3 w-3" />
                  Instructions
                </Badge>
              )}
            </div>
            <h3 className="mb-1 text-lg font-semibold text-slate-900 dark:text-white">{form.title}</h3>
            <p className="mb-4 text-sm leading-6 text-slate-600 dark:text-slate-300">{form.description}</p>
            <div className="flex flex-wrap gap-2">
              <a href={form.pdfUrl} target="_blank" rel="noopener noreferrer">
                <Button size="sm" className="rounded-full bg-slate-950 text-white hover:bg-slate-800 dark:bg-emerald-400 dark:text-slate-950 dark:hover:bg-emerald-300">
                  <Download className="mr-1 h-4 w-4" />
                  Download PDF
                </Button>
              </a>
              {form.instructionsUrl && (
                <a href={form.instructionsUrl} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline" className="rounded-full">
                    <BookOpen className="mr-1 h-4 w-4" />
                    Instructions
                  </Button>
                </a>
              )}
            </div>

            {guidance && (
              <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                  Maria guidance
                </p>
                {guidanceText ? (
                  <p className="whitespace-pre-line text-sm leading-6 text-slate-700 dark:text-slate-200">
                    {guidanceText}
                  </p>
                ) : shouldUpsell ? (
                  <div className="space-y-3">
                    <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                      Unlock Maria’s form guidance for this filing. Basic adds checklist help, and Essential+ adds deeper step-by-step support.
                    </p>
                    <Link to="/pricing">
                      <Button size="sm" className="rounded-full bg-slate-950 text-white hover:bg-slate-800 dark:bg-emerald-400 dark:text-slate-950 dark:hover:bg-emerald-300">
                        See plans
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                    Guidance for this plan level is coming soon.
                  </p>
                )}
              </div>
            )}
          </div>
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200">
            <FileText className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function FormsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchResults, setSearchResults] = useState<CourtForm[]>([]);
  const currentPlan: SubscriptionPlan = authService.getCurrentUser()?.subscription ?? 'free';

  const handleSearch = () => {
    if (searchQuery.trim()) {
      const results = searchForms(searchQuery);
      setSearchResults(results);
      setActiveCategory('search');
    } else {
      setSearchResults([]);
      setActiveCategory('all');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getFormsToDisplay = () => {
    if (activeCategory === 'search') return searchResults;
    if (activeCategory === 'all') return COURT_FORMS;
    return getFormsByCategory(activeCategory);
  };

  const formsToDisplay = getFormsToDisplay();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.1),_transparent_24%),linear-gradient(180deg,#f8fafc_0%,#f7fdf9_45%,#f8fafc_100%)] py-12 dark:bg-[radial-gradient(circle_at_top,_rgba(5,150,105,0.12),_transparent_24%),linear-gradient(180deg,#020617_0%,#020617_100%)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 rounded-[2rem] border border-white/80 bg-white/80 p-8 shadow-[0_28px_90px_-42px_rgba(15,23,42,0.35)] backdrop-blur dark:border-white/10 dark:bg-white/5 md:p-12">
          <Badge className="mb-5 border border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200">
            California forms, Maria-backed
          </Badge>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-950 dark:text-white md:text-6xl md:leading-[1.02]">
            California divorce forms, with clearer next steps.
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">
            Download official Judicial Council forms, then use Maria to understand what they are for, what comes next, and where people usually get stuck.
          </p>
        </div>

        <div className="mb-8 flex items-start gap-3 rounded-3xl border border-emerald-200 bg-emerald-50/90 p-4 dark:border-emerald-400/20 dark:bg-emerald-400/10">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-700 dark:text-emerald-200" />
          <div>
            <p className="text-sm leading-6 text-emerald-900 dark:text-emerald-100">
              <strong>Important:</strong> these are official California Judicial Council forms from courts.ca.gov. Always make sure you are using the latest version.
            </p>
          </div>
        </div>

        <div className="mx-auto mb-8 max-w-3xl rounded-[1.75rem] border border-white/80 bg-white/80 p-3 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search by form name, number, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyPress}
                className="h-12 rounded-full border-slate-200 pl-10"
              />
            </div>
            <Button onClick={handleSearch} className="h-12 rounded-full bg-slate-950 px-6 text-white hover:bg-slate-800 dark:bg-emerald-400 dark:text-slate-950 dark:hover:bg-emerald-300">
              Search
            </Button>
          </div>
        </div>

        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="mb-8">
          <TabsList className="flex h-auto flex-wrap justify-start gap-2 bg-transparent p-0">
            <TabsTrigger value="all" className="rounded-full border border-white/80 bg-white/80 px-4 py-2 data-[state=active]:bg-slate-950 data-[state=active]:text-white dark:border-white/10 dark:bg-white/5 dark:data-[state=active]:bg-emerald-400 dark:data-[state=active]:text-slate-950">
              All Forms ({COURT_FORMS.length})
            </TabsTrigger>
            {FORM_CATEGORIES.map((category) => {
              const Icon = categoryIcons[category.id] || FileText;
              const count = getFormsByCategory(category.id).length;
              return (
                <TabsTrigger
                  key={category.id}
                  value={category.id}
                  className="rounded-full border border-white/80 bg-white/80 px-4 py-2 data-[state=active]:bg-slate-950 data-[state=active]:text-white dark:border-white/10 dark:bg-white/5 dark:data-[state=active]:bg-emerald-400 dark:data-[state=active]:text-slate-950"
                >
                  <Icon className="mr-1 h-4 w-4" />
                  {category.name} ({count})
                </TabsTrigger>
              );
            })}
            <TabsTrigger
              value="search"
              className="rounded-full border border-white/80 bg-white/80 px-4 py-2 data-[state=active]:bg-slate-950 data-[state=active]:text-white dark:border-white/10 dark:bg-white/5 dark:data-[state=active]:bg-emerald-400 dark:data-[state=active]:text-slate-950"
              disabled={searchResults.length === 0}
            >
              Search Results ({searchResults.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeCategory} className="mt-6">
            {formsToDisplay.length === 0 ? (
              <div className="py-14 text-center">
                <File className="mx-auto mb-4 h-16 w-16 text-slate-300" />
                <h3 className="mb-2 text-lg font-semibold text-slate-700 dark:text-white">No forms found</h3>
                <p className="text-slate-500">Try a broader search or browse by category.</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {formsToDisplay.map((form) => (
                  <FormCard key={form.id} form={form} currentPlan={currentPlan} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <Card className="rounded-[1.75rem] border border-white/80 bg-white/80 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-slate-950 dark:text-white">
                <ExternalLink className="h-5 w-5 text-emerald-500" />
                California Courts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Go straight to the official California Courts self-help center for broader court resources.
              </p>
              <a href="https://www.courts.ca.gov/selfhelp.htm" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="w-full rounded-full">
                  Visit Self-Help Center
                  <ExternalLink className="ml-1 h-4 w-4" />
                </Button>
              </a>
            </CardContent>
          </Card>

          <Card className="rounded-[1.75rem] border border-white/80 bg-white/80 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-slate-950 dark:text-white">
                <DollarSign className="h-5 w-5 text-emerald-500" />
                Fee waivers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
                If court fees are a problem, start with the fee waiver paperwork.
              </p>
              <a href="https://www.courts.ca.gov/documents/fw001.pdf" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="w-full rounded-full">
                  Download Fee Waiver Form
                  <Download className="ml-1 h-4 w-4" />
                </Button>
              </a>
            </CardContent>
          </Card>

          <Card className="rounded-[1.75rem] border border-white/80 bg-white/80 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-slate-950 dark:text-white">
                <Sparkles className="h-5 w-5 text-violet-500" />
                Maria guidance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Many forms now connect to plan-based guidance, so Maria can help explain what you are looking at before you file.
              </p>
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-300">
                <BookOpen className="h-4 w-4" />
                <span>Instructions available for most forms</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 rounded-3xl border border-emerald-200 bg-emerald-50/90 p-4 dark:border-emerald-400/20 dark:bg-emerald-400/10">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-700 dark:text-emerald-200" />
            <div>
              <p className="text-sm leading-6 text-emerald-900 dark:text-emerald-100">
                <strong>Disclaimer:</strong> if a form link breaks, go directly to{' '}
                <a href="https://www.courts.ca.gov/forms.htm" target="_blank" rel="noopener noreferrer" className="underline">
                  courts.ca.gov/forms.htm
                </a>{' '}
                or contact us at <a href="mailto:divorceos@agentmail.to" className="underline">divorceos@agentmail.to</a>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
