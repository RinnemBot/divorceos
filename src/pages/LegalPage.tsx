import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface LegalPageProps {
  title: string;
  lastUpdated: string;
  intro: string;
  children: ReactNode;
}

function LegalLayout({ title, lastUpdated, intro, children }: LegalPageProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_14%_0%,rgba(16,185,129,0.16),transparent_24%),radial-gradient(circle_at_86%_8%,rgba(34,211,238,0.14),transparent_20%),linear-gradient(180deg,#f3fff8_0%,#eefcf8_44%,#f8fafc_100%)] dark:bg-[radial-gradient(circle_at_16%_0%,rgba(16,185,129,0.24),transparent_24%),radial-gradient(circle_at_84%_10%,rgba(34,211,238,0.16),transparent_20%),linear-gradient(180deg,#020617_0%,#03111f_50%,#020617_100%)]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-8">
          <Link to="/" className="text-sm font-medium text-emerald-700 hover:text-emerald-600 dark:text-emerald-300 dark:hover:text-emerald-200">
            ← Back to Home
          </Link>
        </div>

        <div className="rounded-2xl border border-white/80 bg-white/72 p-8 shadow-[0_28px_90px_-42px_rgba(15,23,42,0.35)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 md:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300 mb-3">
            Legal
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-3">{title}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Last updated: {lastUpdated}</p>
          <p className="text-base text-slate-600 dark:text-slate-300 mb-8">{intro}</p>

          <div className="prose prose-slate max-w-none dark:prose-invert prose-headings:scroll-mt-24 prose-p:text-slate-600 dark:prose-p:text-slate-300 prose-li:text-slate-600 dark:prose-li:text-slate-300">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export function TermsPage() {
  return (
    <LegalLayout
      title="Terms of Service"
      lastUpdated="April 8, 2026"
      intro="These terms govern your use of Divorce Agent. By using the site, you agree to use it for lawful purposes and understand the limits of the service."
    >
      <h2>Use of the service</h2>
      <p>
        Divorce Agent provides legal information, workflow tools, and document guidance focused on California family law matters.
        It is designed to help you get organized and understand your next steps.
      </p>

      <h2>Not legal advice</h2>
      <p>
        Divorce Agent is not a law firm, does not represent you, and does not create an attorney-client relationship.
        Information on this site is general and may not fit your exact situation.
      </p>

      <h2>Your responsibilities</h2>
      <ul>
        <li>Review all generated information and forms before using or filing them.</li>
        <li>Verify court rules, fees, and local requirements for your county.</li>
        <li>Consult a licensed attorney for advice on strategy, deadlines, or contested issues.</li>
      </ul>

      <h2>Accounts and access</h2>
      <p>
        If you create an account, you are responsible for keeping your login information secure and for activity that happens under your account.
      </p>

      <h2>Service availability</h2>
      <p>
        We may update, suspend, or remove features at any time. We do not guarantee uninterrupted access or error-free output.
      </p>
    </LegalLayout>
  );
}

export function PrivacyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      lastUpdated="April 8, 2026"
      intro="This page explains what information Divorce Agent may collect, how it is used, and the practical limits of privacy when using online tools."
    >
      <h2>Information you provide</h2>
      <p>
        We may collect information you enter into forms, account details, and messages you send through the site.
      </p>

      <h2>How information is used</h2>
      <ul>
        <li>To operate the site and provide requested features.</li>
        <li>To improve form workflows, guidance, and product reliability.</li>
        <li>To respond to support requests and account issues.</li>
      </ul>

      <h2>Sensitive information</h2>
      <p>
        Family law matters often involve sensitive personal information. Please avoid submitting anything you would not want stored digitally unless it is necessary for the feature you are using.
      </p>

      <h2>Third-party services</h2>
      <p>
        Divorce Agent may rely on third-party providers for hosting, analytics, payments, authentication, and AI processing. Those providers may process data on our behalf under their own terms.
      </p>

      <h2>Your choices</h2>
      <p>
        If you need help updating or deleting account information, contact us at divorceos@agentmail.to.
      </p>
    </LegalLayout>
  );
}

export function DisclaimerPage() {
  return (
    <LegalLayout
      title="Disclaimer"
      lastUpdated="April 8, 2026"
      intro="Please read this carefully before relying on information from Divorce Agent. This site is meant to inform and organize, not replace legal counsel."
    >
      <h2>Informational use only</h2>
      <p>
        Content on Divorce Agent is provided for general informational and educational purposes only.
        It should not be treated as legal advice, legal opinion, or a guarantee of outcome.
      </p>

      <h2>No attorney-client relationship</h2>
      <p>
        Using this site, sending a message, or creating an account does not create an attorney-client relationship with Divorce Agent or any affiliated professional.
      </p>

      <h2>Always verify before filing</h2>
      <p>
        Court forms, filing fees, procedures, and local rules change. You are responsible for confirming the latest requirements with the correct California court before filing anything.
      </p>

      <h2>When to talk to a lawyer</h2>
      <ul>
        <li>If your case involves custody disputes, domestic violence, hidden assets, or immigration issues.</li>
        <li>If you are facing deadlines, hearings, or emergency requests.</li>
        <li>If you need legal strategy or representation in court.</li>
      </ul>
    </LegalLayout>
  );
}
