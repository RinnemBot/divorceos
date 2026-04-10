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
    <div className="min-h-screen bg-[radial-gradient(circle_at_14%_0%,rgba(5,150,105,0.3),transparent_24%),radial-gradient(circle_at_86%_8%,rgba(16,185,129,0.18),transparent_20%),linear-gradient(180deg,#e7fbef_0%,#def7e8_44%,#f1faf5_100%)] dark:bg-[radial-gradient(circle_at_16%_0%,rgba(16,185,129,0.24),transparent_24%),radial-gradient(circle_at_84%_10%,rgba(34,211,238,0.16),transparent_20%),linear-gradient(180deg,#020617_0%,#03111f_50%,#020617_100%)] transition-colors">
      <section className="py-16 lg:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white/72 p-8 shadow-[0_28px_90px_-42px_rgba(15,23,42,0.4)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 md:p-12">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.12),transparent_30%),radial-gradient(circle_at_top_right,rgba(34,211,238,0.1),transparent_24%)]" />
            <div className="relative grid items-center gap-10 lg:grid-cols-[3fr,2fr]">
              <div>
                <Badge className="mb-5 border border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200">Support Workbench</Badge>
                <h1 className="text-4xl font-semibold tracking-tight text-slate-950 dark:text-white md:text-6xl md:leading-[1.02]">
                  Child & Spousal Support, modeled the California way
                </h1>
                <p className="mt-5 mb-8 text-lg leading-8 text-slate-600 dark:text-slate-300">
                  Build guideline-caliber estimates, compare parenting-time scenarios, and keep your negotiation story straight. Premium members can sync their numbers directly into Maria's chat for context.
                </p>
                <div className="flex flex-col gap-4 sm:flex-row">
                  <Button size="lg" className="bg-emerald-700 text-white hover:bg-emerald-800" onClick={() => {
                    document.getElementById('estimator')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}>
                    Launch estimator
                  </Button>
                  <Button asChild variant="outline" size="lg" className="border-slate-300 bg-white text-slate-950 hover:bg-slate-50 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10">
                    <Link to="/pricing">Upgrade for saved scenarios</Link>
                  </Button>
                </div>
              </div>
              <div className="rounded-2xl border border-white/80 bg-white/72 p-6 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.25)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
                <div>
                  <p className="mb-2 text-sm uppercase tracking-wide text-emerald-700 dark:text-emerald-200">Why people use this page</p>
                  <h2 className="text-2xl font-semibold text-slate-950 dark:text-white">Dial in the numbers <span className="text-emerald-700 dark:text-emerald-200">before</span> you file</h2>
                </div>
                <ul className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
                  <li>• Stress-test custody time shares and see the impact instantly.</li>
                  <li>• Toggle between quick net-income mode and advanced gross capture.</li>
                  <li>• Keep a running spousal-support heuristic tailored to your inputs.</li>
                </ul>
                <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
                  Maria can read these numbers in chat. Attach a screenshot or mention “Use my current estimator values” and she’ll reference them.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid gap-6 md:grid-cols-3">
        {supportHighlights.map((item) => (
          <Card key={item.title} className="border-white/80 bg-white/72 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.35)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
            <CardContent className="p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-100 via-white to-cyan-50 shadow-sm dark:from-emerald-400/20 dark:via-white/10 dark:to-cyan-400/10">
                <item.icon className="h-5 w-5 text-emerald-700" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2 dark:text-white">{item.title}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">{item.description}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section id="estimator" className="bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(236,253,248,0.68))] py-10 pb-16 dark:bg-[linear-gradient(180deg,rgba(2,6,23,0.18),rgba(3,17,31,0.4))]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <ChildSupportEstimator initialCountyId={profileCountyId} currentUserId={currentUser?.id} />
        </div>
      </section>
    </div>
  );
}
