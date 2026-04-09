import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  FileText, 
  Scale, 
  Shield, 
  Clock, 
  CheckCircle,
  ArrowRight,
  Users,
  Heart,
  Home,
  DollarSign,
  Handshake
} from 'lucide-react';
import { ChatInterface } from '@/components/ChatInterface';
import { AuthModal } from '@/components/AuthModal';
import { authService, type User } from '@/services/auth';
import { CALIFORNIA_DIVORCE_TOPICS, type DivorceTopic } from '@/services/personality';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const features = [
  {
    icon: MessageSquare,
    title: 'AI-Powered Guidance',
    description: 'Chat with Maria, our supportive AI divorce specialist available 24/7.',
  },
  {
    icon: FileText,
    title: 'Court Forms Access',
    description: 'Download all California divorce forms directly from the courts.',
  },
  {
    icon: Scale,
    title: 'California Law Focused',
    description: 'Specialized knowledge of California Family Code and case law.',
  },
  {
    icon: Shield,
    title: 'Private & Secure',
    description: 'Your conversations and data are kept private and confidential.',
  },
];

const topicIcons: Record<string, React.ElementType> = {
  starting: FileText,
  property: Home,
  support: DollarSign,
  custody: Users,
  'domestic-violence': Shield,
  mediation: Handshake,
};

const FEATURED_REGION_LOGOS = [
  {
    id: 'bay-area',
    initials: 'BA',
    title: 'Bay Area counties',
    counties: 'San Francisco • Alameda • Contra Costa • Santa Clara • San Mateo',
    gradient: 'from-rose-500 via-orange-400 to-amber-300',
  },
  {
    id: 'la-oc',
    initials: 'LA',
    title: 'Los Angeles + OC',
    counties: 'Los Angeles • Orange • Riverside • San Bernardino',
    gradient: 'from-indigo-500 via-purple-500 to-pink-500',
  },
  {
    id: 'sac-corridor',
    initials: 'SAC',
    title: 'Sacramento corridor',
    counties: 'Sacramento • Placer • Yolo • El Dorado',
    gradient: 'from-emerald-500 via-lime-400 to-sky-400',
  },
  {
    id: 'valley',
    initials: 'CV',
    title: 'Central Valley spine',
    counties: 'Fresno • Kern • Tulare • Stanislaus • San Joaquin',
    gradient: 'from-amber-500 via-orange-500 to-red-500',
  },
];

export function HomePage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [topicPrompt, setTopicPrompt] = useState<string>('');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);
  }, []);

  useEffect(() => {
    const state = (location.state as { focusChat?: boolean } | null);
    if (state?.focusChat) {
      document.getElementById('chat')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    setShowAuthModal(false);
  };

  const handleTopicSelect = (topic: DivorceTopic) => {
    const prompt = topic.prompt ?? `Tell me about ${topic.title.toLowerCase()}`;
    setTopicPrompt(prompt);
    if (typeof document !== 'undefined') {
      document.getElementById('chat')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    if (!currentUser) {
      setShowAuthModal(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black transition-colors">
      {/* Concierge Announcement */}
      <div className="bg-emerald-900 text-emerald-50 border-b border-emerald-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between text-sm">
          <div className="flex items-center gap-3">
            <Badge className="bg-white/15 text-white border-white/40">New</Badge>
            <p className="font-medium">
              Concierge filing support now covers 40+ California counties, with guided workflows live now and deeper filing automation coming soon.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Link
              to="/concierge"
              className="inline-flex items-center justify-center px-4 py-2 rounded-md text-emerald-900 bg-white font-semibold hover:bg-emerald-50 transition-colors"
            >
              View coverage map
            </Link>
            <Link
              to="/pricing"
              className="inline-flex items-center justify-center px-4 py-2 rounded-md border border-white/60 text-white hover:bg-white/10 transition-colors"
            >
              Compare concierge plans
            </Link>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="bg-emerald-700 text-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="bg-emerald-600 text-white border-0 mb-4">
                AI-Powered California Divorce Help
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                Navigate Your Divorce With{' '}
                <span className="text-emerald-200">Confidence</span>
              </h1>
              <p className="text-lg md:text-xl text-emerald-100 mb-8 max-w-lg">
                Chat with Maria, your AI California divorce specialist. Get instant answers, 
                access court forms, and understand your rights.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                {currentUser ? (
                  <a 
                    href="#chat"
                    className="inline-flex items-center justify-center px-6 py-3 bg-white text-emerald-700 font-semibold rounded-lg hover:bg-emerald-50 transition-colors"
                  >
                    Start Chatting
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </a>
                ) : (
                  <Button
                    onClick={() => setShowAuthModal(true)}
                    size="lg"
                    className="bg-white text-emerald-700 hover:bg-emerald-50"
                  >
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                )}
                <Link 
                  to="/pricing"
                  className="inline-flex items-center justify-center px-6 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition-colors"
                >
                  View Pricing
                </Link>
              </div>
              
              <div className="mt-8 flex items-center gap-6 text-sm text-emerald-200">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>3 Free Chats</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>50+ Court Forms</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>24/7 AI Support</span>
                </div>
              </div>
            </div>
            
            <div className="hidden md:block">
              <div className="relative">
                <div className="absolute -inset-4 bg-white/10 rounded-2xl blur-xl dark:bg-white/5"></div>
                <Card className="relative bg-white/95 backdrop-blur text-gray-800 dark:bg-black/80 dark:text-white">
                  <CardHeader className="border-b bg-gray-50 dark:bg-black/40 dark:border-white/10">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center">
                        <MessageSquare className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-semibold">Maria</CardTitle>
                        <p className="text-xs text-gray-500 dark:text-gray-300">AI Divorce Specialist</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3">
                    <div className="bg-emerald-50 rounded-lg p-3 text-sm border border-emerald-100 dark:bg-emerald-500/20 dark:border-emerald-400/40">
                      <p className="text-gray-700 dark:text-emerald-50">
                        &quot;Hey there! I&apos;m Maria. I know this divorce stuff can feel overwhelming, 
                        but I&apos;m here to help you figure it out. What&apos;s on your mind?&quot;
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <div className="bg-gray-100 rounded-full px-3 py-1 text-xs text-gray-600 dark:bg-white/10 dark:text-white">
                        How do I file for divorce?
                      </div>
                      <div className="bg-gray-100 rounded-full px-3 py-1 text-xs text-gray-600 dark:bg-white/10 dark:text-white">
                        Child custody help
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 dark:text-white">
              Everything You Need for Your California Divorce
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto dark:text-gray-300">
              From initial questions to final paperwork, DivorceOS provides the guidance 
              and resources you need.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="hover:shadow-lg transition-shadow dark:bg-black/70 dark:border dark:border-white/10">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-emerald-700" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2 dark:text-white">{feature.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Concierge + Filing Section */}
      <section className="py-16 bg-white dark:bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1.2fr,0.8fr] items-center">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-emerald-600 font-semibold mb-3">
                County concierge + filings
              </p>
              <h2 className="text-3xl font-bold text-gray-900 mb-4 dark:text-white">
                In-house Court filings for over 40 Counties
              </h2>
              <p className="text-lg text-gray-600 mb-6 dark:text-gray-300">
                Our concierge coverage now spans the Central Valley, Sacramento corridor, and the north-state circuit.
                Paid plans include county-specific filing guidance, human-reviewed packet support, and document workflow help, with expanded filing automation coming soon.
              </p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
                {FEATURED_REGION_LOGOS.map((region) => (
                  <div key={region.id} className="flex items-start gap-3 rounded-xl border border-emerald-100 bg-white/60 p-3 shadow-sm dark:bg-white/5">
                    <div className={`h-12 w-12 rounded-full bg-gradient-to-br ${region.gradient} text-white font-semibold flex items-center justify-center`}>{region.initials}</div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{region.title}</p>
                      <p className="text-xs text-gray-600 leading-snug dark:text-gray-300">{region.counties}</p>
                    </div>
                  </div>
                ))}
              </div>
              <ul className="space-y-3 text-gray-700 mb-8">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-200">40+ counties live on the concierge map with filing method, local cover sheets, and service rules baked in.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-200">Essential+ tiers include concierge filing support today, with direct in-platform filing workflows and status automation coming soon.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-200">Plus and Done-For-You are designed for higher-touch filing support, with process coordination and expanded follow-through features rolling out soon.</span>
                </li>
              </ul>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  to="/concierge"
                  className="inline-flex items-center justify-center px-6 py-3 bg-emerald-700 text-white font-semibold rounded-lg hover:bg-emerald-800 transition-colors"
                >
                  Explore concierge counties
                </Link>
                <Link 
                  to="/pricing"
                  className="inline-flex items-center justify-center px-6 py-3 border-2 border-emerald-700 text-emerald-700 font-semibold rounded-lg hover:bg-emerald-50 transition-colors"
                >
                  Compare plan coverage
                </Link>
              </div>
            </div>

            <div className="grid gap-4">
              {[ 
                {
                  title: 'Statewide coverage',
                  body: 'Fresno to Lake County (and every county in between) lives inside the concierge picker with clerk-ready checklists.',
                },
                {
                  title: 'We click submit',
                  body: 'Essential tier and above include concierge packet review and filing support today, with direct e-filing and paper-routing workflows expanding soon.',
                },
                {
                  title: 'Follow-through included',
                  body: 'We are building deeper status tracking, rejection handling, and packet follow-through into the dashboard now.',
                },
              ].map((card) => (
                <Card key={card.title} className="border border-emerald-100 shadow-sm">
                  <CardContent className="p-5">
                    <p className="text-sm font-semibold text-emerald-600 mb-1">{card.title}</p>
                    <p className="text-sm text-gray-600">{card.body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Topics Section */}
      <section className="py-16 bg-white dark:bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              California Divorce Topics
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Ask Maria about any of these topics and get accurate, caring guidance.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {CALIFORNIA_DIVORCE_TOPICS.map((topic) => {
              const Icon = topicIcons[topic.id] || Scale;
              return (
                <Card
                  key={topic.id}
                  onClick={() => handleTopicSelect(topic)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleTopicSelect(topic);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  className="hover:shadow-lg transition-shadow cursor-pointer group focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-200 transition-colors">
                        <Icon className="h-5 w-5 text-emerald-700" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">{topic.title}</h3>
                        <p className="text-sm text-gray-600">{topic.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Chat Section */}
      <section id="chat" className="py-16 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)]">
            <div className="min-h-full">
              {currentUser ? (
                <ChatInterface
                  currentUser={currentUser}
                  prefillPrompt={topicPrompt}
                  onPrefillConsumed={() => setTopicPrompt('')}
                />
              ) : (
                <div className="bg-white border border-slate-200 rounded-xl p-8 text-center dark:bg-black dark:border-slate-800">
                  <h3 className="text-xl font-semibold text-slate-900 mb-3">Sign in to chat with Maria</h3>
                  <p className="text-sm text-slate-600 mb-5">
                    Create a free account or sign in to start a conversation. Guests can browse the site, but Maria is exclusive to members now.
                  </p>
                  <Button
                    onClick={() => setShowAuthModal(true)}
                    className="bg-emerald-700 hover:bg-emerald-800"
                  >
                    Sign In to Continue
                  </Button>
                </div>
              )}
            </div>
            
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5 text-emerald-600" />
                    24/7 AI Support
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-600">
                  <p className="mb-4">
                    Maria is available anytime to answer your questions about California divorce law.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      Instant responses
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      California law focused
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                      Strategic Guidance
                    </li>
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Heart className="h-5 w-5 text-red-500" />
                    Not a Replacement for an Attorney
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-600">
                  <p>
                    While Maria provides helpful information, this is not legal advice. 
                    For complex situations, please consult with a qualified California 
                    family law attorney.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-emerald-700 text-white">
                <CardHeader>
                  <CardTitle className="text-lg">Upgrade for More</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-emerald-100 mb-4">
                    Get unlimited AI chats, priority responses, and more with our paid plans.
                  </p>
                  <Link to="/pricing">
                    <Button variant="secondary" className="w-full">
                      View Pricing
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Support Tools CTA */}
      <section className="py-16 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1.4fr,1fr]">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-slate-300 mb-3">Support planning</p>
              <h2 className="text-3xl font-bold leading-tight mb-4">Need deeper child & spousal support modeling?</h2>
              <p className="text-slate-200 mb-6">We carved out a full page for the estimator so you can live inside the numbers without scrolling the entire homepage. Advanced overrides, multi-child factors, and sharable summaries are all there.</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild size="lg" className="bg-white text-slate-900 hover:bg-slate-100">
                  <Link to="/support-tools">Open Support Tools</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="border-white bg-white text-slate-900 hover:bg-slate-100 hover:text-slate-900">
                  <Link to="/forms">Prep the FL-342 packet</Link>
                </Button>
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
              <p className="text-sm text-slate-200">What's inside the Support Tools page:</p>
              <ul className="space-y-2 text-slate-100 text-sm">
                <li>• Quick + Advanced modes with instant switching</li>
                <li>• Parent time-share slider tied to k-factor math</li>
                <li>• Spousal-support heuristic synced to child support</li>
                <li>• County-specific notes + reminders</li>
              </ul>
              <p className="text-xs text-slate-300">Done-For-You members can ask Maria to read the latest scenario before drafting messages or disclosures.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-emerald-800 rounded-2xl p-8 md:p-12 text-center text-white">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-emerald-200 mb-8 max-w-2xl mx-auto">
              Create your free account and start chatting with Maria today. 
              No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!currentUser && (
                <Button
                  onClick={() => setShowAuthModal(true)}
                  size="lg"
                  className="bg-white text-emerald-800 hover:bg-emerald-50"
                >
                  Create Free Account
                </Button>
              )}
              <Link to="/forms">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white bg-white text-emerald-800 hover:bg-emerald-50 hover:text-emerald-900"
                >
                  Browse Forms
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}
