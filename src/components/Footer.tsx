import { Link } from 'react-router-dom';
import { Sparkles, Mail, ExternalLink } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { label: 'Ask Maria', href: '/#chat' },
      { label: 'Forms Library', href: '/forms' },
      { label: 'Pricing', href: '/pricing' },
    ],
    resources: [
      {
        label: 'California Courts',
        href: 'https://www.courts.ca.gov/selfhelp.htm',
        external: true,
      },
      {
        label: 'Find a Lawyer',
        href: 'https://www.google.com/search?q=California+Divorce+Family+Lawyers',
        external: true,
      },
      {
        label: 'CA Child Support',
        href: 'https://childsupport.ca.gov/',
        external: true,
      },
    ],
    legal: [
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Disclaimer', href: '/disclaimer' },
    ],
  };

  return (
    <footer className="bg-slate-950 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="mb-10 rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/60 p-8 shadow-[0_24px_80px_-40px_rgba(245,158,11,0.35)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 shadow-lg">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xl font-semibold text-white">DivorceAgent</p>
                  <p className="text-xs uppercase tracking-[0.24em] text-amber-200/80">Maria at the center</p>
                </div>
              </div>
              <h2 className="text-2xl font-semibold tracking-tight text-white md:text-3xl">
                Strategic AI guidance for California divorce and family law.
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
                Meet Maria, the Divorce Agent. Ask better questions, understand your options, and move from confusion to a clear next step.
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-amber-200">
              <Mail className="h-4 w-4" />
              <a href="mailto:divorceos@agentmail.to" className="transition-colors hover:text-white">
                Contact Us
              </a>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <p className="max-w-sm text-sm leading-6 text-slate-400">
              AI-first California divorce guidance, filing support, and practical tools built around Maria, your Divorce Agent.
            </p>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-white">Product</h3>
            <ul className="space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <Link to={link.href} className="text-sm text-slate-400 transition-colors hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-white">Resources</h3>
            <ul className="space-y-2">
              {footerLinks.resources.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target={link.external ? '_blank' : undefined}
                    rel={link.external ? 'noopener noreferrer' : undefined}
                    className="inline-flex items-center gap-1 text-sm text-slate-400 transition-colors hover:text-white"
                  >
                    {link.label}
                    {link.external && <ExternalLink className="h-3 w-3" />}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-white">Legal</h3>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link to={link.href} className="text-sm text-slate-400 transition-colors hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <p className="text-sm text-slate-500">{currentYear} DivorceAgent. All rights reserved.</p>
            <p className="max-w-xl text-xs leading-5 text-slate-500 md:text-right">
              <strong className="text-slate-400">Important:</strong> DivorceAgent provides strategic AI guidance for California divorce and family law. It is not a law firm and does not replace legal advice from a qualified California family law attorney.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
