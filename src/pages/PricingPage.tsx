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
    description: 'AI guidance for your divorce journey',
    features: [
      '20 AI chats per day',
      'AI-generated responses 24/7',
      'Private conversation history',
      'Access to all blank court forms',
      'Basic form guidance',
    ],
    buttonText: 'Start Basic Plan',
    buttonVariant: 'default',
    highlighted: true,
    planId: 'basic',
  },
  {
    name: 'Essential',
    monthlyPrice: 49,
    annualPrice: 490,
    description: 'Comprehensive support for your divorce',
    features: [
      'Unlimited AI chats',
      'AI-generated responses 24/7',
      'Private conversation history',
      'Access to all blank court forms',
      'Detailed form guidance',
      'Priority AI responses',
      'Case law references',
    ],
    buttonText: 'Start Essential Plan',
    buttonVariant: 'outline',
    planId: 'essential',
  },
  {
    name: 'Plus',
    monthlyPrice: 99,
    annualPrice: 990,
    description: 'Advanced features for complex cases',
    features: [
      'Unlimited AI chats',
      'AI-generated responses 24/7',
      'Private conversation history',
      'Access to all blank court forms',
      'Detailed form guidance',
      'Priority AI responses',
      'Case law references',
      'Document analysis',
      'Strategy suggestions',
    ],
    buttonText: 'Start Plus Plan',
    buttonVariant: 'outline',
    planId: 'plus',
  },
  {
    name: 'Done-For-You',
    monthlyPrice: 299,
    annualPrice: 2990,
    description: 'Maximum support throughout your divorce',
    features: [
      'Unlimited AI chats',
      'AI-generated responses 24/7',
      'Private conversation history',
      'Access to all blank court forms',
      'Detailed form guidance',
      'Priority AI responses',
      'Case law references',
      'Document analysis',
      'Strategy suggestions',
      'Priority support queue',
      'Custom document templates',
    ],
    buttonText: 'Start Done-For-You',
    buttonVariant: 'outline',
    planId: 'done-for-you',
  },
];

const tierIcons: Record<string, React.ElementType> = {
  'Free': Sparkles,
  'Basic': Zap,
  'Essential': Check,
  'Plus': Crown,
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

  const getCurrentPlan = () => {
    return currentUser?.subscription || 'free';
  };

  return (
    <div className="min-h-screen bg-slate-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Choose the plan that fits your needs. All plans include access to our 
            comprehensive California divorce form library.
          </p>
          
          {currentUser && (
            <div className="mt-6 inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full">
              <Sparkles className="h-4 w-4" />
              <span className="font-medium">
                Current Plan: {SUBSCRIPTION_LIMITS[getCurrentPlan()].name}
              </span>
            </div>
          )}
        </div>

        <div className="flex justify-center mb-10">
          <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 text-sm font-medium">
            <button
              type="button"
              onClick={() => setBillingPeriod('monthly')}
              className={`px-4 py-2 rounded-full transition ${
                billingPeriod === 'monthly'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly billing
            </button>
            <button
              type="button"
              onClick={() => setBillingPeriod('annual')}
              className={`px-4 py-2 rounded-full transition ${
                billingPeriod === 'annual'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Annual billing
              <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                Save 2 months
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-16">
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
                className={`flex flex-col ${
                  tier.highlighted 
                    ? 'border-2 border-blue-500 shadow-lg relative' 
                    : 'border border-slate-200'
                }`}
              >
                {tier.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-blue-600 text-white">
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-4">
                  <div className={`w-12 h-12 rounded-lg mx-auto mb-4 flex items-center justify-center ${
                    tier.highlighted ? 'bg-blue-100' : 'bg-slate-100'
                  }`}>
                    <Icon className={`h-6 w-6 ${tier.highlighted ? 'text-blue-600' : 'text-slate-600'}`} />
                  </div>
                  <CardTitle className="text-xl font-bold">{tier.name}</CardTitle>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">{formatCurrency(displayPrice)}</span>
                    <span className="text-slate-500">{priceSuffix}</span>
                  </div>
                  {showAnnualRibbon && (
                    <p className="text-xs text-blue-600 font-medium mt-1">2 months free when billed annually</p>
                  )}
                  <p className="text-sm text-slate-500 mt-2">{tier.description}</p>
                </CardHeader>
                
                <CardContent className="flex-1 flex flex-col">
                  <div className="flex-1 space-y-4">
                    <div>
                      <p className="text-sm font-medium text-slate-900 mb-2">Included:</p>
                      <ul className="space-y-2">
                        {tier.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-2 text-sm">
                            <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                            <span className="text-slate-600">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    {tier.notIncluded && (
                      <div>
                        <p className="text-sm font-medium text-slate-900 mb-2">Not included:</p>
                        <ul className="space-y-2">
                          {tier.notIncluded.map((feature) => (
                            <li key={feature} className="flex items-start gap-2 text-sm">
                              <X className="h-4 w-4 text-slate-300 flex-shrink-0 mt-0.5" />
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
                    className={`w-full mt-6 ${
                      tier.highlighted 
                        ? 'bg-blue-600 hover:bg-blue-700' 
                        : ''
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

        {/* Feature Comparison */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-16">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-2xl font-bold text-slate-900">Feature Comparison</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left p-4 font-medium text-slate-700">Feature</th>
                  <th className="text-center p-4 font-medium text-slate-700">Free</th>
                  <th className="text-center p-4 font-medium text-blue-600 bg-blue-50">Basic</th>
                  <th className="text-center p-4 font-medium text-slate-700">Essential</th>
                  <th className="text-center p-4 font-medium text-slate-700">Plus</th>
                  <th className="text-center p-4 font-medium text-slate-700">Done-For-You</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="p-4 text-slate-700">AI Chats per Day</td>
                  <td className="text-center p-4 text-slate-600">3</td>
                  <td className="text-center p-4 text-blue-600 font-medium bg-blue-50/50">20</td>
                  <td className="text-center p-4 text-slate-600">Unlimited</td>
                  <td className="text-center p-4 text-slate-600">Unlimited</td>
                  <td className="text-center p-4 text-slate-600">Unlimited</td>
                </tr>
                <tr>
                  <td className="p-4 text-slate-700">AI-Generated Responses</td>
                  <td className="text-center p-4"><X className="h-4 w-4 text-slate-300 mx-auto" /></td>
                  <td className="text-center p-4 bg-blue-50/50"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                  <td className="text-center p-4"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                  <td className="text-center p-4"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                  <td className="text-center p-4"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="p-4 text-slate-700">Chat History</td>
                  <td className="text-center p-4"><X className="h-4 w-4 text-slate-300 mx-auto" /></td>
                  <td className="text-center p-4 bg-blue-50/50"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                  <td className="text-center p-4"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                  <td className="text-center p-4"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                  <td className="text-center p-4"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="p-4 text-slate-700">Court Forms Access</td>
                  <td className="text-center p-4"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                  <td className="text-center p-4 bg-blue-50/50"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                  <td className="text-center p-4"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                  <td className="text-center p-4"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                  <td className="text-center p-4"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="p-4 text-slate-700">Case Law References</td>
                  <td className="text-center p-4"><X className="h-4 w-4 text-slate-300 mx-auto" /></td>
                  <td className="text-center p-4 bg-blue-50/50"><X className="h-4 w-4 text-slate-300 mx-auto" /></td>
                  <td className="text-center p-4"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                  <td className="text-center p-4"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                  <td className="text-center p-4"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="p-4 text-slate-700">Document Analysis</td>
                  <td className="text-center p-4"><X className="h-4 w-4 text-slate-300 mx-auto" /></td>
                  <td className="text-center p-4 bg-blue-50/50"><X className="h-4 w-4 text-slate-300 mx-auto" /></td>
                  <td className="text-center p-4"><X className="h-4 w-4 text-slate-300 mx-auto" /></td>
                  <td className="text-center p-4"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                  <td className="text-center p-4"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Can I cancel my subscription anytime?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Yes, you can cancel your subscription at any time. Your access will continue 
                  until the end of your current billing period.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Is this a substitute for a lawyer?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  No. DivorceOS provides general information and guidance, but we are not a law firm. 
                  For legal advice specific to your situation, please consult with a qualified 
                  California family law attorney.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How does the AI chat work?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Our AI, Maria, is trained on California divorce law and can answer questions, 
                  explain procedures, and provide information about forms and requirements. 
                  Free users get 3 chats per day; paid plans include AI-generated responses.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Are the court forms official?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Yes, all forms are official California Judicial Council forms downloaded 
                  directly from courts.ca.gov. We keep our form links updated to ensure you 
                  always have access to the latest versions.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}
