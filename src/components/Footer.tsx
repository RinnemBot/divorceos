import { Link } from 'react-router-dom';
import { Scale, Mail, ExternalLink } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { label: 'AI Chat', href: '/#chat' },
      { label: 'Forms Library', href: '/forms' },
      { label: 'Pricing', href: '/pricing' },
    ],
    resources: [
      { 
        label: 'California Courts', 
        href: 'https://www.courts.ca.gov/selfhelp.htm',
        external: true 
      },
      { 
        label: 'Find a Lawyer', 
        href: 'https://www.google.com/search?q=California+Divorce+Family+Lawyers',
        external: true 
      },
      { 
        label: 'CA Child Support', 
        href: 'https://childsupport.ca.gov/',
        external: true 
      },
    ],
    legal: [
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Disclaimer', href: '/disclaimer' },
    ],
  };

  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <Scale className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">DivorceOS</span>
            </Link>
            <p className="text-slate-400 text-sm mb-4 max-w-sm">
              AI-powered California divorce guidance. Get instant answers, access court forms, 
              and navigate your divorce with confidence.
            </p>
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-blue-400" />
              <a 
                href="mailto:divorceos@agentmail.to" 
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                Contact an Agent
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Product</h3>
            <ul className="space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <Link 
                    to={link.href}
                    className="text-slate-400 hover:text-white transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              {footerLinks.resources.map((link) => (
                <li key={link.label}>
                  <a 
                    href={link.href}
                    target={link.external ? '_blank' : undefined}
                    rel={link.external ? 'noopener noreferrer' : undefined}
                    className="text-slate-400 hover:text-white transition-colors text-sm inline-flex items-center gap-1"
                  >
                    {link.label}
                    {link.external && <ExternalLink className="h-3 w-3" />}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link 
                    to={link.href}
                    className="text-slate-400 hover:text-white transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-500 text-sm">
              {currentYear} DivorceOS. All rights reserved.
            </p>
            <p className="text-slate-500 text-xs text-center md:text-right max-w-md">
              <strong>Important:</strong> DivorceOS is an AI-powered information service. 
              We are not a law firm and do not provide legal advice. Always consult with 
              a qualified California family law attorney for your specific situation.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
