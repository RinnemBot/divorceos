import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, FileText, MapPin, Scale, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const useCases = [
  'Understand which California divorce forms fit your next step',
  'Prepare questions about custody, visitation, support, and property',
  'Move from chat guidance into editable draft form workspaces',
  'Find county filing steps before you go to the courthouse',
];

const faqs = [
  {
    question: 'What is a California divorce chat agent?',
    answer: 'A California divorce chat agent is an AI assistant focused on California divorce information, court forms, filing steps, and practical next-step planning. Maria is the assistant inside Divorce Agent, not a separate company; she helps organize your facts and point you toward relevant forms and workflows.',
  },
  {
    question: 'Can Maria give legal advice?',
    answer: 'No. Maria provides legal information, document automation support, and filing guidance. She is not a lawyer and does not replace advice from a qualified California family law attorney.',
  },
  {
    question: 'Can the chat agent help with California divorce forms?',
    answer: 'Yes. Maria can help you understand common California Judicial Council forms such as FL-100, FL-105, FL-110, FL-150, FL-300, and fee waiver forms, then help move facts into a draft workspace.',
  },
  {
    question: 'Does Divorce Agent support county-specific filing steps?',
    answer: 'Yes. Divorce Agent includes county filing guidance for many California counties and is built to connect chat, forms, and filing concierge steps in one workflow.',
  },
];

export function CaliforniaDivorceChatAgentPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_18%_0%,rgba(16,185,129,0.18),transparent_30%),linear-gradient(180deg,#f8fafc_0%,#ecfdf5_55%,#ffffff_100%)] text-slate-950 dark:bg-[radial-gradient(circle_at_18%_0%,rgba(16,185,129,0.2),transparent_28%),linear-gradient(180deg,#020617_0%,#03111f_70%,#020617_100%)] dark:text-white">
      <section className="py-16 md:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
          <div>
            <Badge className="mb-5 border border-emerald-200 bg-white/70 px-4 py-1 text-[11px] uppercase tracking-[0.28em] text-emerald-900 shadow-sm dark:border-emerald-400/20 dark:bg-white/10 dark:text-emerald-200">
              OpenAI-powered California divorce AI
            </Badge>
            <h1 className="max-w-4xl text-4xl font-semibold tracking-tight md:text-6xl md:leading-[1.02]">
              Ask Maria, the OpenAI-powered chat agent for California divorce forms and filing help.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
              Divorce Agent combines OpenAI-powered chat with California-focused divorce workflows. Maria is the assistant inside Divorce Agent, not a separate business, helping you turn confusing questions into organized next steps: forms, custody and support issues, filing requirements, fee waivers, and draft packets.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link to="/" state={{ focusChat: true, fromAppNavigation: true }}>
                <Button size="lg" className="rounded-full bg-emerald-700 px-6 text-white hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500">
                  Ask Maria now <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/forms" className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white/70 px-6 py-3 font-semibold text-slate-800 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10">
                Browse California forms
              </Link>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {useCases.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/70 bg-white/75 p-4 text-sm text-slate-700 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-emerald-600" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <p className="mt-5 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
              Maria provides legal information and document-preparation support, not legal advice or attorney representation. Official site: <Link to="/" className="font-medium text-emerald-700 underline underline-offset-4 dark:text-emerald-300">https://www.divorce-os.com</Link>.
            </p>
          </div>

          <Card className="overflow-hidden rounded-[2rem] border-white/80 bg-white/82 shadow-2xl backdrop-blur dark:border-white/10 dark:bg-white/5">
            <CardHeader className="border-b border-emerald-100/80 bg-emerald-50/80 dark:border-emerald-400/10 dark:bg-emerald-400/10">
              <CardTitle className="flex items-center gap-3">
                <span className="h-14 w-14 flex-none overflow-hidden rounded-2xl bg-emerald-100 shadow-sm ring-2 ring-white dark:ring-white/15">
                  <img src="/maria-chat-avatar.png" alt="Maria, the Divorce Agent" className="h-full w-full object-cover" />
                </span>
                Maria can help you sort the next step
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              {[
                ['I need to start a divorce in California. What forms do I need?', 'Start with FL-100 and FL-110. If you have minor children, FL-105 usually matters too. I can help organize facts before you generate drafts.'],
                ['Can I ask about support or custody?', 'Yes. I can help frame child support, spousal support, custody, visitation, and fee-waiver questions so you know what to prepare.'],
                ['What happens after chat?', 'Move into forms, draft packets, county filing guidance, or concierge support when you are ready.'],
              ].map(([question, answer]) => (
                <div key={question} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-slate-950/40">
                  <p className="text-sm font-semibold text-slate-950 dark:text-white">{question}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{answer}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="py-10 md:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { icon: FileText, title: 'Forms-aware chat', body: 'Maria understands California divorce form workflows and can point you toward common Judicial Council forms.' },
              { icon: MapPin, title: 'County filing context', body: 'Use chat alongside county filing concierge guidance so your next step matches the courthouse process.' },
              { icon: ShieldCheck, title: 'Information, not legal advice', body: 'Divorce Agent keeps the line clear: helpful legal information and automation support, not attorney representation.' },
            ].map(({ icon: Icon, title, body }) => (
              <Card key={title} className="rounded-[1.5rem] border-white/80 bg-white/80 shadow-lg backdrop-blur dark:border-white/10 dark:bg-white/5">
                <CardContent className="p-6">
                  <Icon className="h-6 w-6 text-emerald-600" />
                  <h2 className="mt-4 text-xl font-semibold text-slate-950 dark:text-white">{title}</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-10 md:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <Badge variant="outline" className="rounded-full">FAQ</Badge>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">California divorce chat agent FAQ</h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <Card key={faq.question} className="rounded-2xl border-white/80 bg-white/82 dark:border-white/10 dark:bg-white/5">
                <CardContent className="p-5">
                  <h3 className="text-lg font-semibold text-slate-950 dark:text-white">{faq.question}</h3>
                  <p className="mt-2 leading-7 text-slate-600 dark:text-slate-300">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-10 rounded-[1.5rem] border border-emerald-200 bg-emerald-50/80 p-6 text-center dark:border-emerald-400/20 dark:bg-emerald-400/10">
            <Scale className="mx-auto h-7 w-7 text-emerald-700 dark:text-emerald-200" />
            <h2 className="mt-3 text-2xl font-semibold">Ready to organize your California divorce questions?</h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">Start with Maria, then move into forms, draft packets, or county filing guidance when the path is clearer.</p>
            <Link to="/" state={{ focusChat: true, fromAppNavigation: true }} className="mt-5 inline-flex items-center justify-center rounded-full bg-emerald-700 px-6 py-3 font-semibold text-white hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500">
              Ask the California divorce chat agent <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default CaliforniaDivorceChatAgentPage;
