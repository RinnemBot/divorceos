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
  Handshake,
  Calculator,
  ClipboardCheck,
  FolderCheck,
  Wand2,
} from 'lucide-react';
import { AuthModal } from '@/components/AuthModal';
import { authService, type User } from '@/services/auth';
import { CALIFORNIA_DIVORCE_TOPICS, type DivorceTopic } from '@/services/personality';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const features = [
  {
    icon: MessageSquare,
    title: 'Start with Maria',
    description: 'Ask Maria about custody, support, filings, property, disclosures, and next-step strategy anytime.',
  },
  {
    icon: Wand2,
    title: 'Draft forms with context',
    description: 'Turn intake details, Maria chats, and support scenarios into cleaner starter packets and draft form workspaces.',
  },
  {
    icon: Calculator,
    title: 'Support planning tools',
    description: 'Model child and spousal support scenarios, save your numbers, and bring them back into Maria when planning.',
  },
  {
    icon: FolderCheck,
    title: 'County filing workflow',
    description: 'Use county roadmaps, packet checklists, filing notes, and concierge support to keep the case moving.',
  },
];

const workflowHighlights = [
  {
    icon: FileText,
    label: 'Official forms library',
    title: '50+ California Judicial Council forms',
    body: 'Browse blank court forms, instructions, and Maria-backed guidance by divorce stage.',
  },
  {
    icon: Wand2,
    label: 'Draft Forms',
    title: 'Starter packet drafting workspace',
    body: 'Capture residency, children, disclosures, and filing details, then generate cleaner draft packets with context intact.',
  },
  {
    icon: Calculator,
    label: 'Support Workbench',
    title: 'Child + spousal support scenarios',
    body: 'Compare parenting time, income, add-ons, and county notes before turning numbers into negotiation or filing prep.',
  },
  {
    icon: ClipboardCheck,
    label: 'Concierge Ops',
    title: 'County-specific filing checklists',
    body: 'Track filing method, fees, local cover sheets, service rules, and packet progress across supported counties.',
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
    gradient: 'from-emerald-500 via-teal-400 to-cyan-300',
  },
  {
    id: 'la-oc',
    initials: 'LA',
    title: 'Los Angeles + OC',
    counties: 'Los Angeles • Orange • Riverside • San Bernardino',
    gradient: 'from-emerald-600 via-teal-500 to-cyan-400',
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
    gradient: 'from-emerald-500 via-green-400 to-teal-400',
  },
];

export function HomePage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);

    const handleAuthRequired = () => {
      setCurrentUser(null);
      setShowAuthModal(true);
    };

    window.addEventListener('divorceos:auth-required', handleAuthRequired);

    void authService.refreshCurrentUser().then((nextUser) => {
      setCurrentUser(nextUser);
    });

    return () => {
      window.removeEventListener('divorceos:auth-required', handleAuthRequired);
    };
  }, []);

  useEffect(() => {
    const state = (location.state as { focusChat?: boolean } | null);
    if (state?.focusChat) {
      navigate('/chats', { replace: true });
    }
  }, [location, navigate]);

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    setShowAuthModal(false);
  };

  const handleTopicSelect = (topic: DivorceTopic) => {
    const prompt = topic.prompt ?? `Tell me about ${topic.title.toLowerCase()}`;
    navigate('/chats', { state: { prefillPrompt: prompt } });
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_14%_0%,rgba(5,150,105,0.3),transparent_26%),radial-gradient(circle_at_86%_8%,rgba(16,185,129,0.18),transparent_24%),linear-gradient(180deg,#e7fbef_0%,#def7e8_42%,#f1faf5_100%)] dark:bg-[radial-gradient(circle_at_18%_0%,rgba(16,185,129,0.24),transparent_24%),radial-gradient(circle_at_82%_10%,rgba(34,211,238,0.18),transparent_20%),linear-gradient(180deg,#020617_0%,#03111f_45%,#020617_100%)] transition-colors">
      <div className="border-b border-emerald-100/70 bg-white/55 backdrop-blur-xl dark:border-emerald-400/15 dark:bg-slate-950/45">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between text-sm">
          <div className="flex items-center gap-3 text-slate-700 dark:text-slate-200">
            <Badge className="border-0 bg-emerald-100 text-emerald-900 dark:bg-emerald-400/20 dark:text-emerald-200">County + local courts</Badge>
            <p className="font-medium">
              Ask Maria, pull official forms, and get filing help across 40+ California counties and local court workflows.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Link
              to="/concierge"
              className="inline-flex items-center justify-center rounded-full bg-emerald-700 px-4 py-2 font-semibold text-white transition-colors hover:bg-emerald-800 dark:bg-emerald-700 dark:text-white dark:hover:bg-emerald-600"
            >
              View coverage map
            </Link>
            <Link
              to="/pricing"
              className="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 font-semibold text-slate-700 transition-colors hover:border-emerald-300 hover:bg-emerald-50 dark:border-white/20 dark:text-white dark:hover:bg-white/10"
            >
              Compare plans
            </Link>
          </div>
        </div>
      </div>

      <section className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-white/80 bg-white/72 p-8 shadow-[0_28px_90px_-42px_rgba(15,23,42,0.35)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 md:p-12">
            <div className="grid items-center gap-12 lg:grid-cols-[1.05fr,0.95fr]">
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <Badge className="mb-5 border border-emerald-200/80 bg-white/65 px-4 py-1 text-[11px] uppercase tracking-[0.28em] text-slate-700 shadow-sm backdrop-blur dark:border-emerald-400/20 dark:bg-white/5 dark:text-emerald-200">
                Divorce Agent
              </Badge>
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 md:text-6xl md:leading-[1.02] dark:text-white">
                Strategic AI guidance for California Divorce and Family Law.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
                Meet Maria, the Divorce Agent. Get clear on your options, prepare your next steps, and move forward with confidence.
              </p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link
                  to="/chats"
                  className="inline-flex items-center justify-center rounded-full bg-emerald-700 px-6 py-3 font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-800 dark:bg-emerald-700 dark:text-white dark:hover:bg-emerald-600"
                >
                  Ask Maria
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link
                  to="/forms"
                  className="inline-flex items-center justify-center rounded-full border border-white/70 bg-white/65 px-6 py-3 font-semibold text-slate-800 shadow-sm backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-200 hover:bg-white/80 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                >
                  Explore Forms
                </Link>
                <Link
                  to="/concierge"
                  className="inline-flex items-center justify-center rounded-full border border-transparent px-6 py-3 font-semibold text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                >
                  County filing help
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                {['Create an account for three free chats', '50+ court forms', 'Draft form workspaces', '40+ county/local court guides'].map((item) => (
                  <div key={item} className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-3 py-2 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative hidden lg:block animate-in fade-in zoom-in-95 duration-700">
              <div className="relative overflow-hidden rounded-[1.75rem] border border-white/80 bg-white/72 p-6 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.3)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.08),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.06),transparent_30%)]" />
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-14 w-14 overflow-hidden rounded-2xl bg-emerald-100 shadow-lg ring-2 ring-white/80 dark:ring-white/20">
                      <img src="/maria-chat-avatar.png" alt="Maria, the Divorce Agent" className="h-full w-full object-cover" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-950 dark:text-white">Maria</p>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">The Divorce Agent</p>
                    </div>
                  </div>
                  <Badge className="border-0 bg-emerald-100 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-200">California law</Badge>
                </div>

                <div className="space-y-4">
                  <div className="rounded-3xl border border-white/80 bg-white/88 p-5 text-sm leading-7 text-slate-700 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:text-slate-100">
                    “I can help with custody, support, property, filings, and next steps, all grounded in California law.”
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
                        className="rounded-2xl border border-white/80 bg-white/72 px-4 py-3 text-sm text-slate-700 shadow-sm backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
                        style={{ animationDelay: `${index * 90}ms` }}
                      >
                        {prompt}
                      </div>
                    ))}
                  </div>

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
              Three clear paths: ask Maria, find your forms, or get county filing help.
            </h2>
            <p className="mx-auto mt-4 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">
              Pick the path that matches where you are today. You can start with a free account, browse official forms, or jump into local filing steps.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {features.map((feature) => (
              <Card key={feature.title} className="group overflow-hidden rounded-3xl border border-white/80 bg-white/72 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.35)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-cyan-200 hover:shadow-[0_28px_90px_-42px_rgba(6,182,212,0.2)] dark:border-white/10 dark:bg-white/5">
                <CardContent className="p-6">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 via-white to-cyan-50 text-slate-900 shadow-sm transition-transform duration-300 group-hover:scale-105 dark:from-emerald-400/20 dark:via-white/10 dark:to-cyan-400/10 dark:text-emerald-200">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-slate-950 dark:text-white">{feature.title}</h3>
                  <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-300">What Divorce Agent can do now</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white md:text-4xl">
              Maria is becoming the front door for the whole divorce workflow.
            </h2>
            <p className="mx-auto mt-4 max-w-3xl text-lg leading-8 text-slate-600 dark:text-slate-300">
              Start with a question, then move into forms, support calculations, county filing steps, and concierge follow-through without starting over.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {workflowHighlights.map((item) => (
              <Card key={item.title} className="group rounded-3xl border border-white/80 bg-white/72 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.35)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-cyan-200 dark:border-white/10 dark:bg-white/5">
                <CardContent className="p-6">
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 via-white to-cyan-50 text-emerald-700 shadow-sm transition-transform duration-300 group-hover:scale-105 dark:from-emerald-400/20 dark:via-white/10 dark:to-cyan-400/10 dark:text-emerald-200">
                      <item.icon className="h-6 w-6" />
                    </div>
                    <Badge className="border border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200">{item.label}</Badge>
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-slate-950 dark:text-white">{item.title}</h3>
                  <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{item.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Concierge + Filing Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-white/80 bg-white/72 p-8 shadow-[0_28px_90px_-42px_rgba(15,23,42,0.35)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 md:p-12">
            <div className="grid gap-10 lg:grid-cols-[1.2fr,0.8fr] items-center">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-emerald-600 font-semibold mb-3">
                County + local court filing help
              </p>
              <h2 className="mb-4 text-3xl font-semibold text-slate-950 dark:text-white">
                Filing help across California counties and local court workflows
              </h2>
              <p className="mb-6 text-lg text-slate-600 dark:text-slate-300">
                Get county-specific and local court filing guidance, packet support, and document workflow help tailored to where you are filing.
              </p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
                {FEATURED_REGION_LOGOS.map((region) => (
                  <div key={region.id} className="flex items-start gap-3 rounded-xl border border-white/80 bg-white/65 p-3 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
                    <div className={`h-12 w-12 rounded-full bg-gradient-to-br ${region.gradient} text-white font-semibold flex items-center justify-center`}>{region.initials}</div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{region.title}</p>
                      <p className="text-xs leading-snug text-slate-600 dark:text-slate-300">{region.counties}</p>
                    </div>
                  </div>
                ))}
              </div>
              <ul className="mb-8 space-y-3 text-slate-700 dark:text-slate-200">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5" />
                  <span>40+ county and local court guides live on the concierge map with filing method, local cover sheets, and service rules baked in.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5" />
                  <span>Essential+ plans include concierge filing support today, with deeper filing workflows continuing to roll out.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5" />
                  <span>Plus and Done-For-You are built for higher-touch filing support, with more process coordination and follow-through.</span>
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
                  className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-white/70 bg-white/70 font-semibold text-slate-800 shadow-sm backdrop-blur transition-colors hover:bg-white/85 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
                >
                  Compare plan coverage
                </Link>
              </div>
            </div>

            <div className="grid gap-4">
              {[ 
                {
                  title: 'County + local court coverage',
                  body: 'Fresno to Lake County, plus selected local court workflows, live inside the concierge picker with clerk-ready checklists.',
                },
                {
                  title: 'Filing support included',
                  body: 'Essential plans and above include concierge packet review and filing support, with deeper e-filing workflows on the way.',
                },
                {
                  title: 'Stay on top of the process',
                  body: 'Track packet progress, catch missing steps, and stay organized as filing support expands.',
                },
              ].map((card) => (
                <Card key={card.title} className="border border-white/80 bg-white/72 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
                  <CardContent className="p-5">
                    <p className="text-sm font-semibold text-emerald-600 mb-1">{card.title}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{card.body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            </div>
          </div>
        </div>
      </section>

      {/* Topics Section */}
      <section className="py-16 bg-[linear-gradient(180deg,rgba(255,255,255,0.2),rgba(239,252,250,0.82))] dark:bg-[linear-gradient(180deg,rgba(2,6,23,0.72),rgba(3,17,31,0.92))]">
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
                  className="group cursor-pointer rounded-3xl border border-white/80 bg-white/72 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.35)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-cyan-200 hover:shadow-[0_28px_90px_-42px_rgba(6,182,212,0.2)] focus:outline-none focus:ring-2 focus:ring-cyan-300 dark:border-white/10 dark:bg-white/5"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-50 to-cyan-50 text-emerald-700 transition-all duration-300 group-hover:scale-105 group-hover:from-emerald-100 group-hover:to-cyan-100 dark:bg-emerald-400/10 dark:text-emerald-200">
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

      {/* Maria CTA Section */}
      <section id="chat" className="py-16 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.28),rgba(240,253,250,0.88))] dark:bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.1),transparent_24%),linear-gradient(180deg,rgba(2,6,23,0.55),rgba(2,6,23,0.95))]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 rounded-[2rem] border border-white/80 bg-white/72 p-8 shadow-[0_28px_90px_-42px_rgba(15,23,42,0.4)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 lg:grid-cols-[1.15fr_1fr] lg:p-10">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-300">Meet Maria</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white md:text-4xl">
                Maria now lives in the full Chats workspace.
              </h2>
              <p className="mt-3 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
                Open the dedicated workspace for saved chat history, case folders, document uploads, voice, and longer California divorce conversations.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild className="rounded-full bg-emerald-700 px-6 text-white hover:bg-emerald-800">
                  <Link to="/chats">
                    Open Chats
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="rounded-full">
                  <Link to="/dashboard">View Saved Files</Link>
                </Button>
              </div>
            </div>

            <div className="space-y-6">
              <Card className="rounded-3xl border border-white/80 bg-white/72 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.35)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-slate-950 dark:text-white">
                    <Clock className="h-5 w-5 text-emerald-500" />
                    Always-on strategic support
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-slate-600 dark:text-slate-300">
                  <p className="mb-4 leading-6">
                    Maria is available whenever you need to sort through process questions, next steps, or filing confusion.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-500" />Instant responses</li>
                    <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-500" />California-specific guidance</li>
                    <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-500" />Strategy before guesswork</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border border-white/80 bg-white/72 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.35)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-slate-950 dark:text-white">
                    <Heart className="h-5 w-5 text-emerald-500" />
                    Built to help, not replace counsel
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Maria gives strategic AI guidance for California divorce and family law. For complex or high-stakes situations, you should still work with a qualified California family law attorney.
                </CardContent>
              </Card>

              <Card className="rounded-3xl border border-white/80 bg-white/72 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.35)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
                <CardHeader>
                  <CardTitle className="text-lg text-slate-950 dark:text-white">Turn guidance into action</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    Go beyond free chats with more Maria access, filing support, and deeper planning tools.
                  </p>
                  <Button asChild className="w-full rounded-full bg-emerald-700 text-white hover:bg-emerald-800">
                    <Link to="/pricing">View Pricing</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Support Tools CTA */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-white/80 bg-white/72 p-8 shadow-[0_28px_90px_-42px_rgba(15,23,42,0.35)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 md:p-12">
            <div className="grid gap-8 lg:grid-cols-[1.4fr,1fr]">
              <div>
                <p className="mb-3 text-sm uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-200">Support planning</p>
                <h2 className="mb-4 text-3xl font-semibold leading-tight text-slate-950 dark:text-white">Need deeper child & spousal support modeling?</h2>
                <p className="mb-6 text-slate-600 dark:text-slate-300">Use the full support estimator when you want to spend more time in the numbers. Advanced overrides, multi-child factors, and shareable summaries are all there.</p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button asChild size="lg" className="bg-emerald-700 text-white hover:bg-emerald-800">
                    <Link to="/support-tools">Open Support Tools</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="border-slate-300 bg-white text-slate-950 hover:bg-slate-50 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10">
                    <Link to="/forms">Prep the FL-342 packet</Link>
                  </Button>
                </div>
              </div>
              <div className="rounded-2xl border border-white/80 bg-white/72 p-6 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.25)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5">
                <p className="text-sm text-emerald-700 dark:text-emerald-200">What's inside the Support Tools page:</p>
                <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  <li>• Quick + Advanced modes with instant switching</li>
                  <li>• Parent time-share slider tied to k-factor math</li>
                  <li>• Spousal-support heuristic synced to child support</li>
                  <li>• County-specific notes + reminders</li>
                </ul>
                <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">Done-For-You members can ask Maria to review the latest scenario before drafting messages or disclosures.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-white/80 bg-white/72 p-8 text-center shadow-[0_28px_90px_-42px_rgba(15,23,42,0.35)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 md:p-12">
            <h2 className="mb-4 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white md:text-4xl">
              Ready to ask Maria?
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
              Start with Maria, then move into forms, filing help, and planning tools when you need them.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              {!currentUser && (
                <Button
                  onClick={() => setShowAuthModal(true)}
                  size="lg"
                  className="rounded-full bg-emerald-700 px-6 text-white hover:bg-emerald-800"
                >
                  Create Free Account
                </Button>
              )}
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full border-slate-300 bg-white text-slate-950 hover:bg-slate-50 hover:text-slate-950 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
              >
                <Link to="/forms">Browse Forms</Link>
              </Button>
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
