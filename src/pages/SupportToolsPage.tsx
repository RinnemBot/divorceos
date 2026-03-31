import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChildSupportEstimator } from '@/components/ChildSupportEstimator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Calculator, FileText, Shield } from 'lucide-react';
import { authService, type User } from '@/services/auth';
import { getCountyGuideIdFromName } from '@/data/countyGuides';

const supportHighlights = [
  {
    icon: Calculator,
    title: 'Guideline math without DissoMaster',
    description: 'Run the statewide formula with sliders, advanced overrides, and automatic childcare/medical add-ons.'
  },
  {
    icon: FileText,
    title: 'Auto-syncs with your filings',
    description: 'Mirror the numbers you need for FL-342, FL-343, and FL-150 so disclosures stay consistent.'
  },
  {
    icon: Shield,
    title: 'Plan-safe sharing',
    description: 'Email summary PDFs (coming soon), capture talking points, and keep negotiations aligned with California law.'
  },
];

export function SupportToolsPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    setCurrentUser(authService.getCurrentUser());
  }, []);

  const profileCountyId = getCountyGuideIdFromName(currentUser?.profile?.county);

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-700 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 grid gap-10 lg:grid-cols-[3fr,2fr] items-center">
          <div>
            <Badge className="bg-white/20 text-white border-none mb-4">Support Workbench</Badge>
            <h1 className="text-4xl lg:text-5xl font-bold leading-tight mb-6">
              Child & Spousal Support, modeled the California way
            </h1>
            <p className="text-lg text-emerald-100 mb-8">
              Build guideline-caliber estimates, compare parenting-time scenarios, and keep your negotiation story straight. Premium members can sync their numbers directly into Maria's chat for context.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="bg-white text-emerald-800 hover:bg-emerald-50" onClick={() => {
                document.getElementById('estimator')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}>
                Launch estimator
              </Button>
              <Button asChild variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                <Link to="/pricing">Upgrade for saved scenarios</Link>
              </Button>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-2xl p-6 space-y-4 border border-white/20">
            <div>
              <p className="text-sm text-emerald-100 uppercase tracking-wide mb-2">Why people use this page</p>
              <h2 className="text-2xl font-semibold">Dial in the numbers <span className="text-emerald-200">before</span> you file</h2>
            </div>
            <ul className="space-y-3 text-emerald-50 text-sm">
              <li>• Stress-test custody time shares and see the impact instantly.</li>
              <li>• Toggle between quick net-income mode and advanced gross capture.</li>
              <li>• Keep a running spousal-support heuristic tailored to your inputs.</li>
            </ul>
            <p className="text-xs text-emerald-100">
              Maria can read these numbers in chat—attach a screenshot or mention “Use my current estimator values” and she’ll reference them.
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid gap-6 md:grid-cols-3">
        {supportHighlights.map((item) => (
          <Card key={item.title} className="border-emerald-100 bg-white">
            <CardContent className="p-6">
              <div className="h-12 w-12 rounded-lg bg-emerald-50 flex items-center justify-center mb-4">
                <item.icon className="h-5 w-5 text-emerald-700" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">{item.title}</h3>
              <p className="text-sm text-slate-600">{item.description}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section id="estimator" className="py-10 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <ChildSupportEstimator initialCountyId={profileCountyId} />
        </div>
      </section>
    </div>
  );
}
