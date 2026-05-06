import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const distDir = join(process.cwd(), 'dist');
const baseHtml = readFileSync(join(distDir, 'index.html'), 'utf8');
const siteUrl = 'https://www.divorce-os.com';
const image = `${siteUrl}/divorce-agent-og.png`;

const routes = [
  {
    path: '/',
    title: 'California Divorce Forms & Filing Help | Divorce Agent',
    description: 'Get AI-powered California divorce help from Maria: court forms, custody and support guidance, county filing steps, fee waivers, and draft packets in one place.',
    h1: 'Strategic AI guidance for California Divorce and Family Law.',
    body: 'Ask Maria, find California Judicial Council forms, create an account for three free chats, and get filing help across California counties and local court workflows.',
  },
  {
    path: '/forms',
    title: 'California Divorce Forms | FL-100, FL-150, FL-300',
    description: 'Download and understand California Judicial Council divorce forms including FL-100, FL-105, FL-110, FL-150, FL-300, fee waivers, and judgment packets.',
    h1: 'California divorce forms, with clearer next steps.',
    body: 'Browse official California divorce forms, search by form number, or choose guided paths for starting a divorce, responding, custody, fee waivers, and final judgment packets.',
  },
  {
    path: '/pricing',
    title: 'Divorce Agent Pricing | Affordable California Divorce Help',
    description: 'Compare Divorce Agent plans for AI-guided California divorce forms, draft packet generation, county filing support, and concierge assistance.',
    h1: 'Pick the amount of Maria, forms, and filing support you want in your corner.',
    body: 'Compare Free, Basic, Essential, Plus, and Done-For-You plans for Maria chats, official forms, draft workspaces, support scenarios, and county filing support.',
  },
  {
    path: '/concierge',
    title: 'California County & Local Court Divorce Filing Concierge | Divorce Agent',
    description: 'Find county-specific and local court California divorce filing steps, courthouse guidance, local form requirements, fee waiver details, and next actions.',
    h1: 'California county and local court filing concierge.',
    body: 'Use Divorce Agent county and local court guides to understand filing method, local cover sheets, fee waiver details, service rules, and packet next steps.',
  },
  {
    path: '/chats',
    title: 'California Divorce AI Chats | Divorce Agent',
    description: 'Create an account to use Maria in a full-page California divorce chat workspace with quick prompts, saved history, document context, and draft form handoffs.',
    h1: 'Chats',
    body: 'Create an account for three free chats with Maria, the California divorce AI assistant for forms, custody, support, filing, and next-step planning.',
  },
  {
    path: '/california-divorce-chat-agent',
    title: 'OpenAI California Divorce Chat Agent | Maria AI',
    description: 'Ask Maria, the OpenAI-powered California divorce chat agent, about forms, custody, support, filing steps, fee waivers, and draft packets.',
    h1: 'California Divorce Chat Agent',
    body: 'Maria helps California divorce users understand forms, support, custody, filing steps, and practical next actions before they move into forms and county filing support.',
  },
  {
    path: '/support-tools',
    title: 'California Child & Spousal Support Tools | Divorce Agent',
    description: 'Estimate support scenarios, organize income and expense facts, and prepare California divorce support forms with guided tools.',
    h1: 'California support planning tools.',
    body: 'Use Divorce Agent support tools to model child and spousal support scenarios, organize facts, and prepare for California family law forms and conversations.',
  },
  {
    path: '/draft-forms',
    title: 'AI Divorce Form Drafting Workspace | Divorce Agent',
    description: 'Use Divorce Agent Draft Forms to save intake facts, Maria handoffs, support scenarios, and generated California divorce starter packets in one workspace.',
    h1: 'AI divorce form drafting workspace.',
    body: 'Draft Forms helps signed-in Divorce Agent users turn case intake, saved files, Maria chats, and support scenarios into cleaner California divorce starter packet drafts.',
  },
];

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function setTag(html, pattern, replacement) {
  return html.replace(pattern, replacement);
}

for (const route of routes) {
  const canonical = `${siteUrl}${route.path === '/' ? '' : route.path}`;
  let html = baseHtml;
  html = setTag(html, /<title>.*?<\/title>/, `<title>${escapeHtml(route.title)}</title>`);
  html = setTag(html, /<meta name="description" content=".*?" \/>/, `<meta name="description" content="${escapeHtml(route.description)}" />`);
  html = setTag(html, /<meta property="og:title" content=".*?" \/>/, `<meta property="og:title" content="${escapeHtml(route.title)}" />`);
  html = setTag(html, /<meta property="og:description" content=".*?" \/>/, `<meta property="og:description" content="${escapeHtml(route.description)}" />`);
  html = setTag(html, /<meta property="og:url" content=".*?" \/>/, `<meta property="og:url" content="${canonical}" />`);
  html = setTag(html, /<meta property="og:image" content=".*?" \/>/, `<meta property="og:image" content="${image}" />`);
  html = setTag(html, /<meta name="twitter:title" content=".*?" \/>/, `<meta name="twitter:title" content="${escapeHtml(route.title)}" />`);
  html = setTag(html, /<meta name="twitter:description" content=".*?" \/>/, `<meta name="twitter:description" content="${escapeHtml(route.description)}" />`);
  html = setTag(html, /<link rel="canonical" href=".*?" \/>/, `<link rel="canonical" href="${canonical}" />`);

  const staticCopy = `<div id="root"><main data-static-route-copy="${route.path}" style="position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden"><h1>${escapeHtml(route.h1)}</h1><p>${escapeHtml(route.body)}</p></main></div>`;
  html = html.replace('<div id="root"></div>', staticCopy);

  const outPath = route.path === '/' ? join(distDir, 'index.html') : join(distDir, route.path.slice(1), 'index.html');
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, html);
  console.log(`prerendered ${route.path}`);
}
