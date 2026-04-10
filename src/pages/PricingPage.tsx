import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, X, Sparkles, Zap, Crown, Building2, Loader2 } from 'lucide-react';
import { AuthModal } from '@/components/AuthModal';
import { authService, type User, SUBSCRIPTION_LIMITS } from '@/services/auth';
import { redirectToCheckout } from '@/services/stripe';
import { toast } from 'sonner';

interface PricingTier {
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  description: string;
  features: string[];
  notIncluded?: string[];
  buttonText: string;
  buttonVariant: 'outline' | 'default';
  highlighted?: boolean;
  planId: 'free' | 'basic' | 'essential' | 'plus' | 'done-for-you';
}

const pricingTiers: PricingTier[] = [
  {
    name: 'Free',
    monthlyPrice: 0,
    annualPrice: 0,
    description: 'Get started with basic divorce information',
    features: [
      '3 AI chats per day',
      'Access to all blank court forms',
      'Basic divorce information',
      'California law resources',
    ],
    notIncluded: [
      'AI-generated responses',
      'Chat history',
      'Priority support',
    ],
    buttonText: 'Get Started',
    buttonVariant: 'outline',
    planId: 'free',
  },
  {
    name: 'Basic',
    monthlyPrice: 20,
    annualPrice: 200,
    description: 'AI guidance plus concierge prep for your county',
    features: [
      '20 AI chats per day',
      'AI-generated responses 24/7',
      'Private conversation history',
      'Access to all blank court forms',
      'County concierge roadmaps + filing prep checklists',
    ],
    buttonText: 'Start Basic Plan',
    buttonVariant: 'outline',
    planId: 'basic',
  },
  {
    name: 'Essential',
    monthlyPrice: 49,
    annualPrice: 490,
    description: 'Core Maria access plus filing support for one active case',
    features: [
      'Unlimited AI chats',
      'Private conversation history',
      'Access to all blank court forms',
      'Detailed form guidance',
      'Priority AI responses',
      'Case law references',
      'Concierge filing support for supported counties (1 active case)',
      'Saved support scenarios + planning tools',
    ],
    buttonText: 'Start Essential Plan',
    buttonVariant: 'default',
    highlighted: true,
    planId: 'essential',
  },
  {
    name: 'Plus',
    monthlyPrice: 99,
    annualPrice: 990,
    description: 'Everything in Essential, plus deeper strategy and faster concierge handling',
    features: [
      'Everything in Essential',
      'Document analysis',
      'Strategy suggestions for next steps',
      'Priority concierge queue',
      'More hands-on filing coordination',
      'Higher-touch planning for negotiations and disclosures',
    ],
    buttonText: 'Start Plus Plan',
    buttonVariant: 'outline',
    planId: 'plus',
  },
  {
    name: 'Done-For-You',
    monthlyPrice: 299,
    annualPrice: 2990,
    description: 'Everything in Plus, with the most hands-on concierge workflow support',
    features: [
      'Everything in Plus',
      'Priority support queue',
      'Custom document templates',
      'Service-of-process coordination help',
      'Follow-up workflow support',
      'Highest-touch concierge guidance across the process',
    ],
    buttonText: 'Start Done-For-You',
    buttonVariant: 'outline',
    planId: 'done-for-you',
  },
];

const tierIcons: Record<string, React.ElementType> = {
  Free: Sparkles,
  Basic: Zap,
  Essential: Check,
  Plus: Crown,
  'Done-For-You': Building2,
};

const paidPlanIds: PricingTier['planId'][] = ['basic', 'essential', 'plus', 'done-for-you'];

const formatCurrency = (value: number) => {
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

export function PricingPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(authService.getCurrentUser());
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    setShowAuthModal(false);
  };

  const handleSelectPlan = async (planId: PricingTier['planId']) => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }

    if (planId === 'free') {
      if (currentUser.subscription !== 'free') {
        const updatedUser = { ...currentUser, subscription: 'free' as User['subscription'] };
        authService.updateUser(updatedUser);
        setCurrentUser(updatedUser);
        toast.success('You are back on the Free plan.');
      }
      return;
    }

    if (!paidPlanIds.includes(planId)) {
      toast.error('This plan is not available yet.');
      return;
    }

    try {
      setIsProcessing(planId);
      await redirectToCheckout(planId, billingPeriod, currentUser.email);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Unable to start checkout.');
      setIsProcessing(null);
    }
  };

  const getCurrentPlan = () => currentUser?.subscription || 'free';

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_14%_0%,rgba(5,150,105,0.3),transparent_24%),radial-gradient(circle_at_86%_8%,rgba(16,185,129,0.18),transparent_20%),linear-gradient(180deg,#e7fbef_0%,#def7e8_44%,#f1faf5_100%)] py-16 transition-colors dark:bg-[radial-gradient(circle_at_16%_0%,rgba(16,185,129,0.24),transparent_24%),radial-gradient(circle_at_84%_10%,rgba(34,211,238,0.16),transparent_20%),linear-gradient(180deg,#020617_0%,#03111f_50%,#020617_100%)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-foreground">
        <div className="mb-16 overflow-hidden rounded-[2rem] border border-white/80 bg-white/72 p-8 shadow-[0_28px_90px_-42px_rgba(15,23,42,0.4)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 md:p-12">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <Badge className="mb-5 border border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200">
                Plans for every stage
              </Badge>
              <h1 className="text-4xl font-semibold tracking-tight text-slate-950 dark:text-white md:text-6xl md:leading-[1.02]">
                Pick the amount of Maria you want in your corner.
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
                Start with AI guidance, then add deeper form support and county concierge help as your case gets more real.
              </p>
            </div>

          </div>

          {currentUser && (
            <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-emerald-900 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200">
              <Sparkles className="h-4 w-4" />
              <span className="font-medium">Current Plan: {SUBSCRIPTION_LIMITS[getCurrentPlan()].name}</span>
            </div>
          )}
        </div>

        <div className="mb-10 flex justify-center">
          <div className="inline-flex rounded-full border border-white/80 bg-white/72 p-1 text-sm font-medium shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
            <button
              type="button"
              onClick={() => setBillingPeriod('monthly')}
              className={`rounded-full px-4 py-2 transition ${
                billingPeriod === 'monthly'
                  ? 'bg-emerald-700 text-white shadow hover:bg-emerald-800 dark:bg-emerald-700 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              Monthly billing
            </button>
            <button
              type="button"
              onClick={() => setBillingPeriod('annual')}
              className={`rounded-full px-4 py-2 transition ${
                billingPeriod === 'annual'
                  ? 'bg-emerald-700 text-white shadow hover:bg-emerald-800 dark:bg-emerald-700 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              Annual billing
              <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200">
                Save 2 months
              </span>
            </button>
          </div>
        </div>

        <div className="mb-16 grid gap-6 md:grid-cols-2 xl:grid-cols-5">
          {pricingTiers.map((tier) => {
            const Icon = tierIcons[tier.name];
            const isCurrentPlan = getCurrentPlan() === tier.planId;
            const isProcessingPlan = isProcessing === tier.planId;
            const displayPrice = billingPeriod === 'monthly' ? tier.monthlyPrice : tier.annualPrice;
            const priceSuffix = tier.planId === 'free' ? '' : billingPeriod === 'monthly' ? '/month' : '/year';
            const showAnnualRibbon = billingPeriod === 'annual' && tier.planId !== 'free';

            return (
              <Card
                key={tier.name}
                className={`flex flex-col overflow-hidden rounded-[2rem] border bg-white/72 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.35)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-cyan-200 hover:shadow-[0_28px_90px_-42px_rgba(6,182,212,0.2)] dark:bg-white/5 ${
                  tier.highlighted
                    ? 'border-emerald-300 ring-1 ring-emerald-200 dark:border-emerald-400/30 dark:ring-emerald-400/20'
                    : 'border-white/80 dark:border-white/10'
                }`}
              >
                {tier.highlighted && (
                  <div className="px-6 pt-6">
                    <Badge className="border-0 bg-emerald-700 text-white dark:bg-emerald-700 dark:text-white">
                      Best balance
                    </Badge>
                  </div>
                )}

                <CardHeader className="pb-4 text-center">
                  <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${
                    tier.highlighted
                      ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-slate-950'
                      : 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200'
                  }`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl font-semibold text-slate-950 dark:text-white">{tier.name}</CardTitle>
                  <div className="mt-3">
                    <span className="text-4xl font-semibold tracking-tight text-slate-950 dark:text-white">{formatCurrency(displayPrice)}</span>
                    <span className="ml-1 text-slate-500 dark:text-slate-400">{priceSuffix}</span>
                  </div>
                  {showAnnualRibbon && (
                    <p className="mt-2 text-xs font-medium text-emerald-700 dark:text-emerald-200">2 months free when billed annually</p>
                  )}
                  <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{tier.description}</p>
                </CardHeader>

                <CardContent className="flex flex-1 flex-col">
                  <div className="flex-1 space-y-5">
                    <div>
                      <p className="mb-3 text-sm font-medium text-slate-900 dark:text-white">Included</p>
                      <ul className="space-y-2.5">
                        {tier.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-2 text-sm leading-6">
                            <Check className="mt-1 h-4 w-4 flex-shrink-0 text-emerald-500" />
                            <span className="text-slate-600 dark:text-slate-300">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {tier.notIncluded && (
                      <div>
                        <p className="mb-3 text-sm font-medium text-slate-900 dark:text-white">Not included</p>
                        <ul className="space-y-2.5">
                          {tier.notIncluded.map((feature) => (
                            <li key={feature} className="flex items-start gap-2 text-sm leading-6">
                              <X className="mt-1 h-4 w-4 flex-shrink-0 text-slate-300" />
                              <span className="text-slate-400">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={() => handleSelectPlan(tier.planId)}
                    disabled={isCurrentPlan || isProcessing !== null}
                    variant={tier.buttonVariant}
                    className={`mt-6 w-full rounded-full ${
                      tier.highlighted
                        ? 'bg-emerald-700 text-white hover:bg-emerald-800 dark:bg-emerald-700 dark:text-white dark:hover:bg-emerald-600'
                        : 'border-slate-300 bg-white text-slate-950 hover:bg-slate-50 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10'
                    }`}
                  >
                    {isProcessingPlan ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : isCurrentPlan ? (
                      'Current Plan'
                    ) : (
                      tier.buttonText
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mb-16 overflow-hidden rounded-[2rem] border border-white/80 bg-white/72 shadow-[0_28px_90px_-42px_rgba(15,23,42,0.35)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
          <div className="border-b border-slate-200/80 p-6 dark:border-white/10">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">Feature comparison</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px]">
              <thead>
                <tr className="bg-emerald-50/70 dark:bg-white/5">
                  <th className="p-4 text-left font-medium text-slate-700 dark:text-slate-200">Feature</th>
                  <th className="p-4 text-center font-medium text-slate-700 dark:text-slate-200">Free</th>
                  <th className="bg-white/70 p-4 text-center font-medium text-slate-700 dark:bg-emerald-400/10 dark:text-emerald-200">Basic</th>
                  <th className="p-4 text-center font-medium text-slate-700 dark:text-slate-200">Essential</th>
                  <th className="p-4 text-center font-medium text-slate-700 dark:text-slate-200">Plus</th>
                  <th className="p-4 text-center font-medium text-slate-700 dark:text-slate-200">Done-For-You</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 dark:divide-white/10">
                {[
                  ['AI Chats per Day', '3', '20', 'Unlimited', 'Unlimited', 'Unlimited'],
                  ['AI-Generated Responses', 'x', 'check', 'check', 'check', 'check'],
                  ['Chat History', 'x', 'check', 'check', 'check', 'check'],
                  ['Court Forms Access', 'check', 'check', 'check', 'check', 'check'],
                  ['County Concierge Roadmaps', 'x', 'check', 'check', 'check', 'check'],
                  ['Detailed Form Guidance', 'x', 'Basic', 'check', 'check', 'check'],
                  ['Case Law References', 'x', 'x', 'check', 'check', 'check'],
                  ['Saved Support Scenarios', 'x', 'x', 'check', 'check', 'check'],
                  ['Concierge Filing Support', 'x', 'x', '1 active case', 'Priority queue', 'Highest touch'],
                  ['Document Analysis', 'x', 'x', 'x', 'check', 'check'],
                  ['Strategy Suggestions', 'x', 'x', 'x', 'check', 'check'],
                  ['Service / Follow-Up Coordination', 'x', 'x', 'x', 'x', 'check'],
                  ['Custom Document Templates', 'x', 'x', 'x', 'x', 'check'],
                ].map(([label, free, basic, essential, plus, done]) => {
                  const values = [free, basic, essential, plus, done];
                  return (
                    <tr key={label}>
                      <td className="p-4 text-slate-700 dark:text-slate-200">{label}</td>
                      {values.map((value, index) => (
                        <td key={`${label}-${index}`} className={`p-4 text-center ${index === 1 ? 'bg-white/60 dark:bg-emerald-400/5' : ''}`}>
                          {value === 'check' ? (
                            <Check className="mx-auto h-4 w-4 text-emerald-500" />
                          ) : value === 'x' ? (
                            <X className="mx-auto h-4 w-4 text-slate-300" />
                          ) : (
                            <span className="text-slate-600 dark:text-slate-300">{value}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mx-auto max-w-3xl">
          <h2 className="mb-8 text-center text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">Frequently asked questions</h2>
          <div className="space-y-4">
            {[
              {
                title: 'Can I cancel my subscription anytime?',
                body: 'Yes. You can cancel any time, and your access continues through the current billing period.',
              },
              {
                title: 'Is this a substitute for a lawyer?',
                body: 'No. DivorceAgent gives strategic AI guidance, not legal representation or legal advice. For case-specific legal advice, work with a qualified California family law attorney.',
              },
              {
                title: 'How does Maria work?',
                body: 'Maria helps with California divorce and family law questions, explains procedures, shows next steps, and connects guidance to forms and filing support.',
              },
              {
                title: 'Are the court forms official?',
                body: 'Yes. The forms link to official California Judicial Council forms from courts.ca.gov, and we keep those links updated as closely as possible.',
              },
            ].map((faq) => (
              <Card key={faq.title} className="rounded-3xl border border-white/80 bg-white/72 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
                <CardHeader>
                  <CardTitle className="text-lg text-slate-950 dark:text-white">{faq.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="leading-6 text-slate-600 dark:text-slate-300">{faq.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}
