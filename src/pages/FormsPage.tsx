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
  CheckCircle,
  BookOpen,
  Scale,
  Users,
  DollarSign,
  Home,
  Shield,
  CheckSquare
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
    <Card className="hover:shadow-md transition-shadow dark:bg-black">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="font-mono text-xs">
                {form.formNumber}
              </Badge>
              {form.instructionsUrl && (
                <Badge variant="outline" className="text-xs">
                  <BookOpen className="h-3 w-3 mr-1" />
                  Instructions
                </Badge>
              )}
            </div>
            <h3 className="font-semibold text-slate-900 mb-1 dark:text-white">{form.title}</h3>
            <p className="text-sm text-slate-600 mb-3 dark:text-slate-300">{form.description}</p>
            <div className="flex gap-2">
              <a
                href={form.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="sm" variant="default" className="bg-blue-600 hover:bg-blue-700">
                  <Download className="h-4 w-4 mr-1" />
                  Download PDF
                </Button>
              </a>
              {form.instructionsUrl && (
                <a
                  href={form.instructionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button size="sm" variant="outline">
                    <BookOpen className="h-4 w-4 mr-1" />
                    Instructions
                  </Button>
                </a>
              )}
            </div>

            {guidance && (
              <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:bg-black dark:border-slate-800">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2 dark:text-slate-300">
                  Form Guidance
                </p>
                {guidanceText ? (
                  <p className="text-sm text-slate-700 whitespace-pre-line dark:text-slate-200">
                    {guidanceText}
                  </p>
                ) : shouldUpsell ? (
                  <div className="space-y-3">
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      Unlock personalized guidance that walks you through this form step-by-step. Upgrade to Basic for checklist support or Essential+ for in-depth coaching.
                    </p>
                    <Link to="/pricing">
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        See Plans
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    Guidance for this plan level is coming soon.
                  </p>
                )}
              </div>
            )}
          </div>
          <FileText className="h-8 w-8 text-slate-300 flex-shrink-0" />
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
    if (activeCategory === 'search') {
      return searchResults;
    }
    if (activeCategory === 'all') {
      return COURT_FORMS;
    }
    return getFormsByCategory(activeCategory);
  };

  const formsToDisplay = getFormsToDisplay();

  return (
    <div className="min-h-screen bg-slate-50 py-12 dark:bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4 dark:text-white">
            California Divorce Forms
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto dark:text-slate-300">
            Access all official California Judicial Council divorce forms. 
            Download directly from the California Courts website.
          </p>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 flex items-start gap-3 dark:bg-blue-950 dark:border-blue-900">
          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5 dark:text-blue-200" />
          <div>
            <p className="text-sm text-blue-800 dark:text-blue-100">
              <strong>Important:</strong> All forms are official California Judicial Council forms 
              from courts.ca.gov. Forms are updated regularly by the courts. Always ensure you're 
              using the most current version.
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                placeholder="Search forms by name, number, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700">
              Search
            </Button>
          </div>
        </div>

        {/* Category Tabs */}
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="mb-8">
          <TabsList className="flex flex-wrap justify-start gap-2 bg-transparent h-auto">
            <TabsTrigger 
              value="all" 
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              All Forms ({COURT_FORMS.length})
            </TabsTrigger>
            {FORM_CATEGORIES.map((category) => {
              const Icon = categoryIcons[category.id] || FileText;
              const count = getFormsByCategory(category.id).length;
              return (
                <TabsTrigger 
                  key={category.id}
                  value={category.id}
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  <Icon className="h-4 w-4 mr-1" />
                  {category.name} ({count})
                </TabsTrigger>
              );
            })}
            <TabsTrigger 
              value="search" 
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              disabled={searchResults.length === 0}
            >
              Search Results ({searchResults.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeCategory} className="mt-6">
            {formsToDisplay.length === 0 ? (
              <div className="text-center py-12">
                <File className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-700 mb-2">No forms found</h3>
                <p className="text-slate-500">
                  Try adjusting your search or browse by category.
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {formsToDisplay.map((form) => (
                  <FormCard key={form.id} form={form} currentPlan={currentPlan} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Quick Links */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <Card className="dark:bg-black">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ExternalLink className="h-5 w-5 text-blue-600" />
                California Courts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-4 dark:text-slate-300">
                Visit the official California Courts Self-Help Center for additional resources.
              </p>
              <a 
                href="https://www.courts.ca.gov/selfhelp.htm"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="sm" className="w-full">
                  Visit Self-Help Center
                  <ExternalLink className="h-4 w-4 ml-1" />
                </Button>
              </a>
            </CardContent>
          </Card>

          <Card className="dark:bg-black">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Fee Waivers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-4 dark:text-slate-300">
                Can't afford court fees? You may qualify for a fee waiver.
              </p>
              <a 
                href="https://www.courts.ca.gov/documents/fw001.pdf"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="sm" className="w-full">
                  Download Fee Waiver Form
                  <Download className="h-4 w-4 ml-1" />
                </Button>
              </a>
            </CardContent>
          </Card>

          <Card className="dark:bg-black">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-purple-600" />
                Form Instructions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 mb-4 dark:text-slate-300">
                Many forms include detailed instructions. Look for the "Instructions" button.
              </p>
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-300">
                <BookOpen className="h-4 w-4" />
                <span>Instructions available for most forms</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Disclaimer */}
        <div className="mt-12 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-amber-800">
                <strong>Disclaimer:</strong> While we strive to keep all form links current, 
                the California Courts website may change. If you encounter a broken link, 
                please visit <a 
                  href="https://www.courts.ca.gov/forms.htm" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="underline"
                >courts.ca.gov/forms.htm</a> directly or contact us at{' '}
                <a href="mailto:divorceos@agentmail.to" className="underline">
                  divorceos@agentmail.to
                </a>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
