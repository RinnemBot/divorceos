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
    title: 'Maria at the center',
    description: 'Ask Maria about custody, support, filings, property, and next-step strategy anytime.',
  },
  {
    icon: FileText,
    title: 'Forms with context',
    description: 'Move from AI guidance into California court forms and filing prep without losing the thread.',
  },
  {
    icon: Scale,
    title: 'California-only logic',
    description: 'Built around California divorce and family law, not generic nationwide legal content.',
  },
  {
    icon: Shield,
    title: 'Private and practical',
    description: 'Designed to help you prepare smarter before you spend money or make avoidable mistakes.',
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.12),_transparent_28%),linear-gradient(180deg,#f8fafc_0%,#fffdf8_45%,#f8fafc_100%)] dark:bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.12),_transparent_26%),linear-gradient(180deg,#020617_0%,#020617_40%,#020617_100%)] transition-colors">
      <div className="border-b border-amber-100/80 bg-white/70 backdrop-blur dark:border-white/10 dark:bg-slate-950/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between text-sm">
          <div className="flex items-center gap-3 text-slate-700 dark:text-slate-200">
            <Badge className="border-0 bg-amber-100 text-amber-900 dark:bg-amber-400/20 dark:text-amber-200">Maria-first</Badge>
            <p className="font-medium">
              Same California divorce infrastructure, sharper DivorceAgent surface. Concierge filing support still covers 40+ counties.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Link
              to="/concierge"
              className="inline-flex items-center justify-center rounded-full bg-slate-950 px-4 py-2 font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-amber-400 dark:text-slate-950 dark:hover:bg-amber-300"
            >
              View coverage map
            </Link>
            <Link
              to="/pricing"
              className="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 font-semibold text-slate-700 transition-colors hover:border-amber-300 hover:bg-amber-50 dark:border-white/20 dark:text-white dark:hover:bg-white/10"
            >
              Compare plans
            </Link>
          </div>
        </div>
      </div>

      <section className="relative overflow-hidden py-16 md:py-24">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent opacity-70" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr,0.95fr]">
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <Badge className="mb-5 border border-amber-200 bg-white/70 px-4 py-1 text-[11px] uppercase tracking-[0.28em] text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-amber-200">
                DivorceAgent
              </Badge>
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 md:text-6xl md:leading-[1.02] dark:text-white">
                Strategic AI guidance for California divorce and family law.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
                Meet Maria, the Divorce Agent. Get clear on your options, prepare your next steps, and move forward with confidence.
              </p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                {currentUser ? (
                  <a
                    href="#chat"
                    className="inline-flex items-center justify-center rounded-full bg-slate-950 px-6 py-3 font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-amber-400 dark:text-slate-950 dark:hover:bg-amber-300"
                  >
                    Ask Maria
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </a>
                ) : (
                  <Button
                    onClick={() => setShowAuthModal(true)}
                    size="lg"
                    className="rounded-full bg-slate-950 px-6 text-white hover:bg-slate-800 dark:bg-amber-400 dark:text-slate-950 dark:hover:bg-amber-300"
                  >
                    Ask Maria
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                )}
                <Link
                  to="/forms"
                  className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white/75 px-6 py-3 font-semibold text-slate-800 transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-300 hover:bg-amber-50 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                >
                  Explore Forms
                </Link>
                <Link
                  to="/concierge"
                  className="inline-flex items-center justify-center rounded-full border border-transparent px-6 py-3 font-semibold text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                >
                  See Filing Help
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                {['3 free chats', '50+ court forms', '24/7 Maria access'].map((item) => (
                  <div key={item} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/75 px-3 py-2 shadow-sm dark:border-white/10 dark:bg-white/5">
                    <CheckCircle className="h-4 w-4 text-amber-500" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative hidden lg:block animate-in fade-in zoom-in-95 duration-700">
              <div className="absolute -inset-8 rounded-[2rem] bg-gradient-to-br from-amber-200/40 via-transparent to-slate-900/10 blur-3xl dark:from-amber-400/10 dark:to-amber-200/5" />
              <div className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white/85 p-6 shadow-[0_40px_120px_-55px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/80">
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 shadow-lg">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-950 dark:text-white">Maria</p>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">The Divorce Agent</p>
                    </div>
                  </div>
                  <Badge className="border-0 bg-emerald-100 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-200">California only</Badge>
                </div>

                <div className="space-y-4">
                  <div className="rounded-3xl border border-amber-100 bg-amber-50/80 p-5 text-sm leading-7 text-slate-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-slate-100">
                    “I can help you think through custody, support, property, filings, and what to do next, without generic nationwide guesswork.”
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      'How do I file in Contra Costa County?',
                      'What should I expect on child support?',
                      'How do I handle disclosures?',
                      'What is my next best step?'
                    ].map((prompt, index) => (
                      <div
                        key={prompt}
                        className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
                        style={{ animationDelay: `${index * 90}ms` }}
                      >
                        {prompt}
                      </div>
                    ))}
                  </div>

                  <div className="rounded-3xl bg-slate-950 p-5 text-white dark:bg-white dark:text-slate-950">
                    <p className="text-xs uppercase tracking-[0.24em] text-amber-300 dark:text-amber-600">Why it feels sharper</p>
                    <p className="mt-2 text-sm leading-6 text-slate-200 dark:text-slate-700">
                      Maria is the focal point. Forms, concierge, and support tools now sit behind the agent instead of competing with her.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white md:text-4xl">
              Maria is the product. Everything else helps you act on the guidance.
            </h2>
            <p className="mx-auto mt-4 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">
              DivorceAgent is built around an AI-first experience, then backed by forms, concierge filing support, and support-planning tools.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {features.map((feature, index) => (
              <Card key={feature.title} className="group overflow-hidden rounded-3xl border border-white/80 bg-white/80 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.35)] backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_28px_90px_-42px_rgba(15,23,42,0.4)] dark:border-white/10 dark:bg-white/5">
                <CardContent className="p-6">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-white text-slate-900 shadow-sm transition-transform duration-300 group-hover:scale-105 dark:from-amber-400/20 dark:to-white/10 dark:text-amber-200">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <div className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">0{index + 1}</div>
                  <h3 className="mb-2 text-lg font-semibold text-slate-950 dark:text-white">{feature.title}</h3>
                  <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{feature.description}</p>
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
      <section className="py-16 bg-white/60 dark:bg-slate-950/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-950 mb-4 dark:text-white md:text-4xl">
              Get guidance on the decisions in front of you
            </h2>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto dark:text-slate-300">
              Start with the question that is keeping you stuck. Maria turns California divorce topics into clearer next steps.
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
                  className="group cursor-pointer rounded-3xl border border-white/80 bg-white/80 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.35)] backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_28px_90px_-42px_rgba(15,23,42,0.4)] focus:outline-none focus:ring-2 focus:ring-amber-400 dark:border-white/10 dark:bg-white/5"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 transition-all duration-300 group-hover:scale-105 group-hover:bg-amber-100 dark:bg-amber-400/10 dark:text-amber-200">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="mb-1 font-semibold text-slate-900 dark:text-white">{topic.title}</h3>
                        <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{topic.description}</p>
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
      <section id="chat" className="py-16 bg-[linear-gradient(180deg,rgba(255,255,255,0.3),rgba(248,250,252,0.9))] dark:bg-[linear-gradient(180deg,rgba(2,6,23,0.5),rgba(2,6,23,0.95))]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-300">Meet Maria</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white md:text-4xl">
                Maria is the Divorce Agent.
              </h2>
              <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">
                Built for California. Designed for real-world divorce decisions. Ask about custody, support, property, filings, and what to do next.
              </p>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)]">
            <div className="min-h-full">
              {currentUser ? (
                <div className="rounded-[2rem] border border-white/80 bg-white/80 p-3 shadow-[0_28px_90px_-42px_rgba(15,23,42,0.4)] backdrop-blur dark:border-white/10 dark:bg-white/5">
                  <ChatInterface
                    currentUser={currentUser}
                    prefillPrompt={topicPrompt}
                    onPrefillConsumed={() => setTopicPrompt('')}
                  />
                </div>
              ) : (
                <div className="rounded-[2rem] border border-white/80 bg-white/85 p-8 text-center shadow-[0_28px_90px_-42px_rgba(15,23,42,0.4)] backdrop-blur dark:border-white/10 dark:bg-white/5">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 shadow-lg">
                    <MessageSquare className="h-6 w-6" />
                  </div>
                  <h3 className="mb-3 text-2xl font-semibold text-slate-900 dark:text-white">Sign in to ask Maria</h3>
                  <p className="mb-6 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    Create a free account to talk with Maria, save context, and move from AI guidance into forms and filing support.
                  </p>
                  <Button
                    onClick={() => setShowAuthModal(true)}
                    className="rounded-full bg-slate-950 px-6 text-white hover:bg-slate-800 dark:bg-amber-400 dark:text-slate-950 dark:hover:bg-amber-300"
                  >
                    Sign In to Continue
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <Card className="rounded-3xl border border-white/80 bg-white/80 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.35)] backdrop-blur dark:border-white/10 dark:bg-white/5">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-slate-950 dark:text-white">
                    <Clock className="h-5 w-5 text-amber-500" />
                    Always-on strategic support
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-slate-600 dark:text-slate-300">
                  <p className="mb-4 leading-6">
                    Maria is available whenever you need to sort through process questions, next steps, or filing confusion.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-amber-500" />Instant responses</li>
                    <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-amber-500" />California-specific guidance</li>
                    <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-amber-500" />Strategy before guesswork</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border border-white/80 bg-white/80 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.35)] backdrop-blur dark:border-white/10 dark:bg-white/5">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-slate-950 dark:text-white">
                    <Heart className="h-5 w-5 text-rose-500" />
                    Built to help, not replace counsel
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Maria gives strategic AI guidance for California divorce and family law. For complex or high-stakes situations, you should still work with a qualified California family law attorney.
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-0 bg-slate-950 text-white shadow-[0_32px_90px_-40px_rgba(15,23,42,0.9)] dark:bg-amber-400 dark:text-slate-950">
                <CardHeader>
                  <CardTitle className="text-lg">Turn guidance into action</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 text-sm leading-6 text-slate-200 dark:text-slate-800">
                    Go beyond free chats with more Maria access, filing support, and deeper planning tools.
                  </p>
                  <Link to="/pricing">
                    <Button variant="secondary" className="w-full rounded-full bg-white text-slate-950 hover:bg-slate-100 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-800">
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
          <div className="rounded-[2rem] border border-white/80 bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 p-8 text-center text-white shadow-[0_40px_120px_-55px_rgba(15,23,42,0.6)] md:p-12">
            <h2 className="text-3xl font-semibold tracking-tight mb-4 md:text-4xl">
              Ready to ask Maria?
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg leading-8 text-slate-200">
              Start with the AI agent first, then move into forms, filing help, and planning tools when you are ready.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              {!currentUser && (
                <Button
                  onClick={() => setShowAuthModal(true)}
                  size="lg"
                  className="rounded-full bg-white px-6 text-slate-950 hover:bg-slate-100"
                >
                  Create Free Account
                </Button>
              )}
              <Link to="/forms">
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full border-white bg-white text-slate-950 hover:bg-slate-100 hover:text-slate-950"
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
