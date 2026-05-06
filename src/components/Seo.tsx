import { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

const SITE_URL = 'https://www.divorce-os.com';
const SITE_NAME = 'Divorce Agent';
const DEFAULT_IMAGE = `${SITE_URL}/divorce-agent-og.png`;

type SeoConfig = {
  title: string;
  description: string;
  path: string;
  robots?: string;
  image?: string;
  type?: 'website' | 'article';
};

const seoRoutes: SeoConfig[] = [
  {
    path: '/',
    title: 'California Divorce Forms & Filing Help | Divorce Agent',
    description: 'Get AI-powered California divorce help from Maria: court forms, custody and support guidance, county filing steps, fee waivers, and draft packets in one place.',
  },
  {
    path: '/forms',
    title: 'California Divorce Forms | FL-100, FL-150, FL-300',
    description: 'Download and understand California Judicial Council divorce forms including FL-100, FL-105, FL-110, FL-150, FL-300, fee waivers, and judgment packets.',
  },
  {
    path: '/california-divorce-chat-agent',
    title: 'OpenAI California Divorce Chat Agent | Maria AI',
    description: 'Ask Maria, the OpenAI-powered California divorce chat agent, about forms, custody, support, filing steps, fee waivers, and draft packets.',
  },
  {
    path: '/pricing',
    title: 'Divorce Agent Pricing | Affordable California Divorce Help',
    description: 'Compare Divorce Agent plans for AI-guided California divorce forms, draft packet generation, county filing support, and concierge assistance.',
  },
  {
    path: '/chats',
    title: 'California Divorce AI Chats | Divorce Agent',
    description: 'Use Maria in a full-page California divorce chat workspace with document uploads, quick prompts, voice tools, saved history, and draft form handoffs.',
  },
  {
    path: '/support-tools',
    title: 'California Child & Spousal Support Tools | Divorce Agent',
    description: 'Estimate support scenarios, organize income and expense facts, and prepare California divorce support forms with guided tools.',
  },
  {
    path: '/concierge',
    title: 'California County & Local Court Divorce Filing Concierge | Divorce Agent',
    description: 'Find county-specific and local court California divorce filing steps, courthouse guidance, local form requirements, fee waiver details, and next actions.',
  },
  {
    path: '/draft-forms',
    title: 'AI Divorce Form Drafting Workspace | Divorce Agent',
    description: 'Turn intake facts into editable California divorce draft packets with Maria, including petition, summons, custody, support, fee waiver, and judgment workflows.',
    robots: 'noindex, nofollow',
  },
  {
    path: '/terms',
    title: 'Terms of Service | Divorce Agent',
    description: 'Read the Divorce Agent terms of service for using AI-powered California divorce information, forms, and filing tools.',
  },
  {
    path: '/privacy',
    title: 'Privacy Policy | Divorce Agent',
    description: 'Learn how Divorce Agent handles account, intake, chat, document, and analytics data for California divorce support tools.',
  },
  {
    path: '/disclaimer',
    title: 'Legal Disclaimer | Divorce Agent',
    description: 'Divorce Agent provides legal information and document automation support, not legal advice or attorney representation.',
  },
  {
    path: '/dashboard',
    title: 'Dashboard | Divorce Agent',
    description: 'Your private Divorce Agent dashboard.',
    robots: 'noindex, nofollow',
  },
  {
    path: '/profile',
    title: 'Profile | Divorce Agent',
    description: 'Your private Divorce Agent profile.',
    robots: 'noindex, nofollow',
  },
  {
    path: '/bookkeeping',
    title: 'Bookkeeping | Divorce Agent',
    description: 'Private Divorce Agent bookkeeping workspace.',
    robots: 'noindex, nofollow',
  },
  {
    path: '/analytics',
    title: 'Analytics | Divorce Agent',
    description: 'Private Divorce Agent analytics workspace.',
    robots: 'noindex, nofollow',
  },
  {
    path: '/confirm-email',
    title: 'Confirm Email | Divorce Agent',
    description: 'Confirm your Divorce Agent account email.',
    robots: 'noindex, nofollow',
  },
];

function getSeoConfig(pathname: string): SeoConfig {
  if (pathname.startsWith('/concierge/')) {
    const county = pathname.split('/').filter(Boolean)[1]
      ?.split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');

    return {
      path: pathname,
      title: `${county ?? 'County'} Divorce Filing Guide | California Divorce Agent`,
      description: `County-specific California divorce filing guidance${county ? ` for ${county}` : ''}: court steps, local requirements, fee waiver notes, and forms to prepare.`,
    };
  }

  if (pathname.startsWith('/draft-forms/')) {
    return { ...seoRoutes.find((route) => route.path === '/draft-forms')!, path: '/draft-forms' };
  }

  return seoRoutes.find((route) => route.path === pathname) ?? seoRoutes[0];
}

function setMeta(selector: string, attribute: 'content' | 'href', value: string) {
  const element = document.head.querySelector(selector);
  if (element) {
    element.setAttribute(attribute, value);
  }
}

function upsertJsonLd(id: string, data: object) {
  let script = document.getElementById(id) as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement('script');
    script.id = id;
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data);
}

export function Seo() {
  const location = useLocation();
  const config = useMemo(() => getSeoConfig(location.pathname), [location.pathname]);

  useEffect(() => {
    const canonicalUrl = `${SITE_URL}${config.path === '/' ? '' : config.path}`;
    const image = config.image ?? DEFAULT_IMAGE;
    const robots = config.robots ?? 'index, follow, max-image-preview:large';

    document.title = config.title;
    setMeta('meta[name="description"]', 'content', config.description);
    setMeta('meta[name="robots"]', 'content', robots);
    setMeta('link[rel="canonical"]', 'href', canonicalUrl);
    setMeta('meta[property="og:title"]', 'content', config.title);
    setMeta('meta[property="og:description"]', 'content', config.description);
    setMeta('meta[property="og:url"]', 'content', canonicalUrl);
    setMeta('meta[property="og:image"]', 'content', image);
    setMeta('meta[property="og:type"]', 'content', config.type ?? 'website');
    setMeta('meta[name="twitter:title"]', 'content', config.title);
    setMeta('meta[name="twitter:description"]', 'content', config.description);
    setMeta('meta[name="twitter:image"]', 'content', image);

    upsertJsonLd('divorce-agent-website-schema', {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      name: SITE_NAME,
      alternateName: ['DivorceOS', 'Divorce Agent by DivorceOS'],
      url: SITE_URL,
      description: seoRoutes[0].description,
      publisher: { '@id': `${SITE_URL}/#organization` },
      potentialAction: {
        '@type': 'SearchAction',
        target: `${SITE_URL}/forms?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    });

    upsertJsonLd('divorce-agent-organization-schema', {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: 'Divorce Agent LLC',
      alternateName: ['Divorce Agent', 'DivorceOS'],
      url: SITE_URL,
      logo: `${SITE_URL}/divorce-agent-icon.png`,
      sameAs: [SITE_URL],
    });

    upsertJsonLd('divorce-agent-legal-service-schema', {
      '@context': 'https://schema.org',
      '@type': 'LegalService',
      '@id': `${SITE_URL}/#legalservice`,
      name: SITE_NAME,
      alternateName: ['DivorceOS', 'Maria by Divorce Agent'],
      url: SITE_URL,
      image: DEFAULT_IMAGE,
      provider: { '@id': `${SITE_URL}/#organization` },
      areaServed: {
        '@type': 'State',
        name: 'California',
      },
      serviceType: [
        'California divorce forms',
        'Divorce filing guidance',
        'Child custody information',
        'Child and spousal support preparation',
        'Court fee waiver preparation',
      ],
      priceRange: '$$',
      slogan: 'OpenAI-powered California divorce forms and filing help',
      description: 'Divorce Agent is the California divorce AI platform from Divorce Agent LLC. Maria is the assistant inside Divorce Agent, not a separate company. The service provides legal information, form drafting support, and filing guidance; it is not a law firm and does not provide legal advice.',
      knowsAbout: [
        'California divorce',
        'Judicial Council forms',
        'FL-100',
        'FL-150',
        'FL-300',
        'fee waivers',
        'county filing procedures',
      ],
    });

    upsertJsonLd('divorce-agent-page-schema', {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: config.title,
      description: config.description,
      url: canonicalUrl,
      isPartOf: { '@id': `${SITE_URL}/#website` },
      publisher: { '@id': `${SITE_URL}/#organization` },
      mainEntity: config.path === '/california-divorce-chat-agent'
        ? {
            '@type': 'SoftwareApplication',
            name: 'Maria',
            alternateName: 'Maria by Divorce Agent',
            applicationCategory: 'Legal technology',
            operatingSystem: 'Web',
            url: `${SITE_URL}/california-divorce-chat-agent`,
            provider: { '@id': `${SITE_URL}/#organization` },
            isPartOf: { '@id': `${SITE_URL}/#legalservice` },
            description: 'Maria is the California divorce chat assistant inside Divorce Agent. It helps users understand divorce forms, custody, support, filing steps, and practical next-step planning.'
          }
        : undefined,
    });

    const existingFaq = document.getElementById('divorce-agent-faq-schema');
    if (config.path === '/california-divorce-chat-agent') {
      upsertJsonLd('divorce-agent-faq-schema', {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: 'What is a California divorce chat agent?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'A California divorce chat agent is an AI assistant focused on California divorce information, court forms, filing steps, and practical next-step planning.',
            },
          },
          {
            '@type': 'Question',
            name: 'Can Maria give legal advice?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'No. Maria provides legal information, document automation support, and filing guidance. She is not a lawyer and does not replace advice from a qualified California family law attorney.',
            },
          },
          {
            '@type': 'Question',
            name: 'Can the chat agent help with California divorce forms?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes. Maria can help users understand common California Judicial Council divorce forms such as FL-100, FL-105, FL-110, FL-150, FL-300, and fee waiver forms.',
            },
          },
          {
            '@type': 'Question',
            name: 'Does Divorce Agent support county-specific filing steps?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Yes. Divorce Agent includes county filing guidance for many California counties and connects chat, forms, and filing concierge steps in one workflow.',
            },
          },
        ],
      });
    } else if (existingFaq) {
      existingFaq.remove();
    }
  }, [config]);

  return null;
}
