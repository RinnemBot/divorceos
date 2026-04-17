import { FORM_GUIDANCE } from '@/data/formGuidance';
import { COURT_FORMS } from '@/data/forms';

// API Configuration - calls local server-side route (API key is hidden)
const API_URL = '/api/chat';

type SubscriptionPlan = 'free' | 'basic' | 'essential' | 'plus' | 'done-for-you';

export interface AIResponse {
  content: string;
  citations?: string[];
  topic?: string;
  error?: boolean;
  intent?: string;
  urgency?: 'normal' | 'urgent';
  suggestedActions?: { label: string; href: string }[];
}

const FORM_PATTERN = /(FL[-\s]?\d{2,3}[A-Z]?|DV[-\s]?\d{3})/gi;
const FORM_LOOKUP = COURT_FORMS.reduce<Record<string, { title: string; formNumber: string }>>((acc, form) => {
  acc[form.id] = { title: form.title, formNumber: form.formNumber };
  return acc;
}, {});

// Detect what the user is asking about
function detectTopic(message: string): string {
  const lower = message.toLowerCase();
  
  // Custody-related keywords
  if (lower.includes('custody') || 
      lower.includes('visitation') || 
      lower.includes('parenting time') || 
      lower.includes('where will kids live') ||
      lower.includes('dad rights') ||
      lower.includes('father rights') ||
      lower.includes('mom rights') ||
      lower.includes('mother rights') ||
      lower.includes('see my kids') ||
      lower.includes('see my child')) {
    return 'custody';
  }
  
  // Spousal support
  if (lower.includes('spousal support') || 
      lower.includes('alimony') || 
      lower.includes('ex-husband') || 
      lower.includes('ex-wife') || 
      lower.includes('spouse support') ||
      lower.includes('pay my wife') ||
      lower.includes('pay my husband')) {
    return 'spousalSupport';
  }
  
  // Child support
  if (lower.includes('child support') || 
      lower.includes('kids money') || 
      lower.includes('payment for child') ||
      lower.includes('pay for my kids')) {
    return 'childSupport';
  }
  
  // Property
  if (lower.includes('property') || 
      lower.includes('asset') || 
      lower.includes('house') || 
      lower.includes('home') || 
      lower.includes('divide') ||
      lower.includes('who gets') ||
      lower.includes('retirement') ||
      lower.includes('401k') ||
      lower.includes('pension')) {
    return 'property';
  }
  
  // Starting divorce
  if (lower.includes('how to file') || 
      lower.includes('start divorce') || 
      lower.includes('file for divorce') ||
      lower.includes('begin divorce') ||
      lower.includes('get divorced')) {
    return 'starting';
  }
  
  // Domestic violence
  if (lower.includes('domestic violence') || 
      lower.includes('abuse') || 
      lower.includes('restraining order') || 
      lower.includes('hit me') || 
      lower.includes('threaten')) {
    return 'domesticViolence';
  }
  
  return 'general';
}

type ChatIntent =
  | 'education'
  | 'workflow_start_divorce'
  | 'workflow_respond_divorce'
  | 'joint_petition'
  | 'missed_notice'
  | 'hearing_prep'
  | 'forms_help'
  | 'support_tools'
  | 'filing_concierge'
  | 'lawyer_referral'
  | 'urgent_risk'
  | 'pricing_sales';

interface IntentResult {
  intent: ChatIntent;
  urgency: 'normal' | 'urgent';
}

function detectIntent(message: string): IntentResult {
  const lower = message.toLowerCase();

  if (/(abuse|domestic violence|restraining order|emergency custody|ex parte|kidnap|abduction|unsafe|threat|dv hearing|protective order)/.test(lower)) {
    return { intent: 'urgent_risk', urgency: 'urgent' };
  }
  if (/(lawyer|attorney|represent me|trial|high asset|business|complex case)/.test(lower)) {
    return { intent: 'lawyer_referral', urgency: 'normal' };
  }
  if (/(joint petition|file together|filing together|both agree|amicable divorce|uncontested and agree|agree on everything)/.test(lower)) {
    return { intent: 'joint_petition', urgency: 'normal' };
  }
  if (/(missed hearing|missed my hearing|missed notice|never got notice|didn.t get notice|didn't get notice|did not get notice|didn.t receive notice|didn't receive notice|email notice|spam folder)/.test(lower)) {
    return { intent: 'missed_notice', urgency: 'normal' };
  }
  if (/(hearing tomorrow|hearing next week|hearing prep|court hearing|rfo hearing|what do i bring to court|how do i prepare for hearing|upcoming hearing|court date)/.test(lower)) {
    return { intent: 'hearing_prep', urgency: 'normal' };
  }
  if (/(price|pricing|plan|subscription|cost)/.test(lower)) {
    return { intent: 'pricing_sales', urgency: 'normal' };
  }
  if (/(served|respond|response|summons|petition was filed against me)/.test(lower)) {
    return { intent: 'workflow_respond_divorce', urgency: 'normal' };
  }
  if (/(start divorce|file for divorce|begin divorce|first forms|how do i file)/.test(lower)) {
    return { intent: 'workflow_start_divorce', urgency: 'normal' };
  }
  if (/(child support|spousal support|alimony|calculator|calculate)/.test(lower)) {
    return { intent: 'support_tools', urgency: 'normal' };
  }
  if (/(concierge|file this for me|help with paperwork|document upload|efile|e-file)/.test(lower)) {
    return { intent: 'filing_concierge', urgency: 'normal' };
  }
  if (/(form|fl-|papers|packet)/.test(lower)) {
    return { intent: 'forms_help', urgency: 'normal' };
  }
  return { intent: 'education', urgency: 'normal' };
}

function getIntentGuidance(intent: ChatIntent): string {
  switch (intent) {
    case 'workflow_start_divorce':
      return 'Focus on the first filing steps, the first forms, and getting them unstuck fast. End with a clear invitation to start now.';
    case 'workflow_respond_divorce':
      return 'Emphasize response timing, not ignoring service, and the next immediate step. Quote the 30-day response deadline plainly when it fits. Name the likely forms when clear, especially FL-120 and related response paperwork.';
    case 'joint_petition':
      return 'If both sides are aligned, explain when FL-700 joint petition may fit, when it is a bad fit, and the cleanest next filing step.';
    case 'missed_notice':
      return 'Lead with deadline recovery and notice-check steps: email, spam, court e-notice, case docket, clerk, and whether a hearing already passed. Be concrete and calm.';
    case 'hearing_prep':
      return 'Give the short answer first. If it helps, add a clean hearing-prep checklist, but keep it sounding like Maria talking to one person, not a courtroom handout. Quote relevant deadlines clearly when known.';
    case 'forms_help':
      return 'Explain the form plainly, use exact Judicial Council form numbers and titles, and orient the user to the right packet or forms library.';
    case 'support_tools':
      return 'Keep math concise, explain limits of estimates, and steer them into the support tools.';
    case 'filing_concierge':
      return 'Explain how concierge reduces paperwork burden and direct them toward the concierge workflow.';
    case 'lawyer_referral':
      return 'Still answer the user’s practical question first. Then explain briefly why a lawyer could help on top of that. Do not turn the whole reply into a referral pitch.';
    case 'urgent_risk':
      return 'Be explicit that this may be urgent, but still give concrete practical guidance first. If the user asks how to prepare, plan, document, or show up at court, answer that directly before suggesting attorney, court, or emergency support.';
    case 'pricing_sales':
      return 'Answer pricing simply and steer to the plan that matches the user intent.';
    default:
      return 'Answer directly, explain why it matters, recommend the best next step, and be specific about exact forms or county-dependent procedure when that would reduce confusion.';
  }
}

function getSuggestedActions(intent: ChatIntent): { label: string; href: string }[] {
  switch (intent) {
    case 'workflow_start_divorce':
      return [
        { label: 'Browse forms', href: '/forms' },
        { label: 'Open concierge', href: '/concierge' },
      ];
    case 'workflow_respond_divorce':
      return [
        { label: 'Open forms', href: '/forms' },
        { label: 'View county concierge', href: '/concierge' },
      ];
    case 'joint_petition':
      return [
        { label: 'Browse forms', href: '/forms' },
        { label: 'Open concierge', href: '/concierge' },
      ];
    case 'missed_notice':
      return [
        { label: 'View county concierge', href: '/concierge' },
        { label: 'Browse forms', href: '/forms' },
      ];
    case 'hearing_prep':
      return [
        { label: 'Browse forms', href: '/forms' },
        { label: 'Open concierge', href: '/concierge' },
      ];
    case 'support_tools':
      return [{ label: 'Open support tools', href: '/support-tools' }];
    case 'filing_concierge':
      return [{ label: 'Open concierge', href: '/concierge' }];
    case 'pricing_sales':
      return [{ label: 'View pricing', href: '/pricing' }];
    case 'lawyer_referral':
      return [{ label: 'Open concierge', href: '/concierge' }];
    case 'forms_help':
      return [{ label: 'Browse forms', href: '/forms' }];
    default:
      return [
        { label: 'Browse forms', href: '/forms' },
        { label: 'Open support tools', href: '/support-tools' },
      ];
  }
}

function buildVoiceGuidance(userMessage: string, intent: ChatIntent): string {
  const lower = userMessage.toLowerCase();
  const upsetSignals = /(scared|afraid|overwhelmed|stressed|panic|anxious|devastated|furious|angry|worried|crying|lost)/.test(lower);
  const shortQuestion = userMessage.trim().split(/\s+/).length <= 12;

  const baseRules = [
    'Sound like a smart, grounded human, not a customer support bot.',
    'Warm, direct, and a little conversational is good. Do not sound chirpy, salesy, or scripted.',
    'Write like a real person talking to one person. Use contractions naturally and vary sentence rhythm.',
    'Avoid filler like "I apologize," "great question," or "I understand this can be difficult."',
    'Use plain English. Prefer short paragraphs, natural cadence, and concrete next steps.',
    'It is okay to sound human: brief empathy, mild opinion, or a plainspoken reaction is good when it fits.',
    'Keep the answer feeling spoken, not machine-assembled. Even checklists should sound like Maria talking.',
    'Avoid sounding like a courtroom memo, issue-spotting outline, or sterile legal article.',
    'Do not overuse exclamation points or emoji. At most one emoji, and only if it feels natural.',
    'If the user sounds stressed, acknowledge it briefly and plainly before helping.',
    'If the answer is simple, keep it short. If the situation is complex, organize it cleanly.',
    'Do not force product mentions or workflow links into every answer. Only bring them in when they genuinely help.',
    'Avoid repetitive legal disclaimers. Give the real answer first, then add limits only where they actually matter.',
    'End by offering one useful next move, not a generic "let me know if you have questions."',
    'If a form clearly applies, name it precisely by number and title.',
    'If county-specific procedure may matter and the county is unknown, say that and ask for the county without turning the whole answer into questions.',
    'Do not stack dry bullets unless the situation really needs them. Prefer 1 to 3 sharp action items over a wall of legal trivia.',
    'When a real deadline matters, quote it early and in plain language.',
    'If the user is asking about a hearing, use a short checklist only when it feels helpful and natural.',
    'Only separate process versus strategy when it improves clarity. Do not force explicit labels into every answer.',
  ];

  if (upsetSignals) {
    baseRules.push('The user seems emotionally loaded. Start with one calm validating sentence, then move into help quickly.');
  }

  if (shortQuestion) {
    baseRules.push('The user asked briefly. Match that energy with a concise answer unless urgency requires more.');
  }

  if (intent === 'pricing_sales') {
    baseRules.push('Do not sound like a salesperson. Recommend the right plan plainly if it genuinely helps.');
  }

  if (intent === 'joint_petition') {
    baseRules.push('When the user sounds aligned with the other side, explain fit for joint petition clearly, but name the bad-fit cases too: coercion, domestic violence, hidden assets, or real conflict.');
  }

  if (intent === 'missed_notice') {
    baseRules.push('For missed-notice or missed-hearing situations, lead with the immediate recovery steps and what to check today. Do not bury the action items under background law.');
  }

  if (intent === 'hearing_prep') {
    baseRules.push('For hearing-prep questions, mention what to bring and surface any timing rules early if you know them, but keep the checklist light and human.');
  }

  return baseRules.map((rule) => `- ${rule}`).join('\n');
}

function normalizeFormId(raw: string): string | null {
  let normalized = raw.toLowerCase().replace(/\s+/g, '');
  normalized = normalized.replace(/[()]/g, '');
  normalized = normalized.replace(/[–—]/g, '-');
  if (!normalized.includes('-')) {
    normalized = normalized.replace(/^(fl|dv)/, '$1-');
  }
  normalized = normalized.replace(/[^a-z0-9-]/g, '');
  if (normalized.startsWith('fl-341')) return 'fl-341';
  if (normalized.startsWith('fl-342a')) return 'fl-342a';
  if (normalized.startsWith('fl-342')) return 'fl-342';
  if (normalized.startsWith('fl-347')) return 'fl-347';
  return FORM_GUIDANCE[normalized] ? normalized : null;
}

function collectMentionedForms(texts: string[]): string[] {
  const ids = new Set<string>();
  texts.forEach((text) => {
    if (!text) return;
    const matches = text.match(FORM_PATTERN);
    if (!matches) return;
    matches.forEach((match) => {
      const normalized = normalizeFormId(match);
      if (normalized) {
        ids.add(normalized);
      }
    });
  });
  return Array.from(ids);
}

function getPlanContext(plan: SubscriptionPlan): string {
  switch (plan) {
    case 'free':
      return 'USER PLAN: Free tier. Provide high-level overviews and gently invite them to upgrade for step-by-step checklists and premium features.';
    case 'basic':
      return 'USER PLAN: Basic tier. You can share the basic checklists we provide, but encourage Essential/Plus/Done-For-You for deep dives or document analysis.';
    default:
      return 'USER PLAN: Premium (Essential/Plus/Done-For-You). You may share detailed guidance, proactive tips, and bespoke strategies.';
  }
}

function buildFormGuidanceContext(
  plan: SubscriptionPlan,
  userMessage: string,
  conversationHistory: { role: string; content: string }[]
): string {
  const texts = [userMessage, ...conversationHistory.filter(m => m.role === 'user').map(m => m.content)];
  const formIds = collectMentionedForms(texts);
  if (!formIds.length) {
    return '';
  }

  if (plan === 'free') {
    const labels = formIds.map(id => FORM_LOOKUP[id]?.formNumber || id.toUpperCase()).join(', ');
    return `The user mentioned these California Judicial Council forms: ${labels}. They are on the Free plan. Give a concise overview and recommend upgrading to Basic for checklists or Essential+ for detailed walkthroughs. Do not reveal the proprietary guidance text.`;
  }

  const entries = formIds
    .map((id) => {
      const meta = FORM_LOOKUP[id];
      const heading = meta ? `${meta.formNumber} – ${meta.title}` : id.toUpperCase();
      const guidance = plan === 'basic' ? FORM_GUIDANCE[id]?.basic : FORM_GUIDANCE[id]?.detailed;
      if (!guidance) return null;
      return `${heading}:
${guidance}`;
    })
    .filter(Boolean)
    .join('\n\n');

  if (!entries) {
    return '';
  }

  if (plan === 'basic') {
    return `BASIC PLAN GUIDANCE: Use the following checklists when the user asks about these forms. If they need deeper strategy, let them know Essential or higher unlocks detailed coaching.\n\n${entries}`;
  }

  return `PREMIUM GUIDANCE: The user can receive the full detailed walkthroughs. Weave the following information into your response naturally.\n\n${entries}`;
}

// NOTE: These template functions are kept for reference but now we use Kimi AI for all responses
// for more natural, personable conversations.

/*
// Check if question is about father/dad custody specifically
function isFatherCustodyQuestion(message: string): boolean {
  const lower = message.toLowerCase();
  return (lower.includes('dad') || 
          lower.includes('father') || 
          lower.includes('husband') ||
          lower.includes('as a dad') ||
          lower.includes('as a father')) &&
         (lower.includes('custody') || 
          lower.includes('rights') ||
          lower.includes('see my') ||
          lower.includes('my kids') ||
          lower.includes('my child'));
}
*/

// Generate a personable, helpful response using Kimi K2.5 AI
export async function generateAIResponse(
  userMessage: string,
  conversationHistory: { role: string; content: string }[] = [],
  userName?: string,
  plan: SubscriptionPlan = 'free'
): Promise<AIResponse> {
  const topic = detectTopic(userMessage);
  const intentResult = detectIntent(userMessage);
  
  // Always use AI for natural, personable responses
  // Pass topic info so AI can include relevant legal knowledge
  return generateAIWithPersonality(userMessage, conversationHistory, topic, userName, plan, intentResult);
}

/*
function generateFatherCustodyResponse(): AIResponse {
  const empathy = getEmpathyOpener();
  const closer = getCloser();
  const relevantCases = getRelevantCaseLaw('custody father');
  
  let response = `${empathy}\n\n`;
  response += `${FATHER_CUSTODY_GUIDANCE.intro}\n\n`;
  response += `${FATHER_CUSTODY_GUIDANCE.legalStandard}\n\n`;
  response += `**Types of Custody**\n\n`;
  response += `${FATHER_CUSTODY_GUIDANCE.typesOfCustody.legal}\n\n`;
  response += `${FATHER_CUSTODY_GUIDANCE.typesOfCustody.physical}\n\n`;
  response += `**What Courts Actually Look At**\n\n`;
  response += `${FATHER_CUSTODY_GUIDANCE.whatCourtsLookFor}\n\n`;
  response += `**What You Should Actually Do**\n\n`;
  response += `${FATHER_CUSTODY_GUIDANCE.stepsToTake}\n\n`;
  response += `**Things That Hurt Dads in Court**\n\n`;
  response += `${FATHER_CUSTODY_GUIDANCE.commonMistakes}\n\n`;
  response += `${FATHER_CUSTODY_GUIDANCE.encouragement}\n\n`;
  
  if (relevantCases.length > 0) {
    response += `**Relevant Case Law:**\n`;
    relevantCases.forEach(c => {
      response += `• ${c.citation} - ${c.title}\n`;
    });
    response += `\n`;
  }
  
  response += `**Important:** I'm an AI assistant, not your lawyer. For advice specific to your situation, you should talk to a California family law attorney. Many offer free consultations.\n\n`;
  response += `${closer}`;
  
  return {
    content: response,
    citations: relevantCases.map(c => c.citation),
    topic: 'custody'
  };
}

function generateCustodyResponse(): AIResponse {
  const empathy = getEmpathyOpener();
  const transition = getTransition();
  const closer = getCloser();
  const relevantCases = getRelevantCaseLaw('custody');
  
  let response = `${empathy}\n\n`;
  response += `${transition}\n\n`;
  response += `California courts decide custody based on the "best interests of the child" - that's the only thing that matters. Here's what that actually means:\n\n`;
  response += `**Legal Custody** - Who makes big decisions (school, doctors, religion)\n`;
  response += `• Joint legal custody is most common - both parents have a say\n`;
  response += `• Sole legal custody means one parent decides everything\n\n`;
  response += `**Physical Custody** - Where your child lives\n`;
  response += `• Joint physical - child spends significant time with both parents\n`;
  response += `• Primary to one parent - child lives mainly with one, visits the other\n\n`;
  response += `**What Judges Look At (Family Code § 3011):**\n\n`;
  response += `1. **Health, safety, and welfare** of your child\n`;
  response += `2. **History of abuse or neglect** by either parent\n`;
  response += `3. **Substance abuse** issues\n`;
  response += `4. **How much contact** the child has with each parent now\n`;
  response += `5. **Your child's wishes** (if they're 14+)\n`;
  response += `6. **Ability to co-parent** - can you work with the other parent?\n\n`;
  response += `**Practical Steps:**\n`;
  response += `• Document everything - keep a journal of visits, incidents\n`;
  response += `• Stay involved in your kid's daily life\n`;
  response += `• Don't badmouth the other parent to your child\n`;
  response += `• Consider mediation before court - it's cheaper and less stressful\n\n`;
  
  if (relevantCases.length > 0) {
    response += `**Relevant Case Law:**\n`;
    relevantCases.forEach(c => {
      response += `• ${c.citation} - ${c.title}\n`;
    });
    response += `\n`;
  }
  
  response += `**Remember:** I'm an AI assistant providing general information. For advice about your specific situation, please consult with a California family law attorney.\n\n`;
  response += `${closer}`;
  
  return {
    content: response,
    citations: relevantCases.map(c => c.citation),
    topic: 'custody'
  };
}

function generateGuidanceResponse(
  topicKey: 'spousalSupport' | 'childSupport' | 'propertyDivision'
): AIResponse {
  const guidance = TOPIC_GUIDANCE[topicKey];
  const empathy = getEmpathyOpener();
  const transition = getTransition();
  const closer = getCloser();
  const relevantCases = getRelevantCaseLaw(topicKey);
  
  let response = `${empathy}\n\n`;
  response += `${guidance.intro}\n\n`;
  response += `${transition}\n\n`;
  response += `${guidance.law}\n\n`;
  response += `**The Practical Reality:**\n\n`;
  response += `${guidance.practical}\n\n`;
  response += `**What You Should Actually Do:**\n\n`;
  response += `${guidance.steps}\n\n`;
  response += `**Common Mistakes to Avoid:**\n\n`;
  response += `${guidance.mistakes}\n\n`;
  
  if (relevantCases.length > 0) {
    response += `**Relevant Case Law:**\n`;
    relevantCases.forEach(c => {
      response += `• ${c.citation} - ${c.title}\n`;
    });
    response += `\n`;
  }
  
  response += `**Important:** I'm an AI assistant, not a lawyer. For advice specific to your situation, please consult with a California family law attorney.\n\n`;
  response += `${closer}`;
  
  return {
    content: response,
    citations: relevantCases.map(c => c.citation),
    topic: topicKey
  };
}

function generateDomesticViolenceResponse(): AIResponse {
  const guidance = TOPIC_GUIDANCE.domesticViolence;
  const closer = getCloser();
  const relevantCases = getRelevantCaseLaw('domestic violence');
  
  let response = `**If you are in immediate danger, call 911 right now.**\n\n`;
  response += `${guidance.intro}\n\n`;
  response += `**What Counts as Domestic Violence in California**\n\n`;
  response += `${guidance.law}\n\n`;
  response += `**Types of Protection Orders**\n\n`;
  response += `${guidance.practical}\n\n`;
  response += `**Step-by-Step: Getting a Restraining Order**\n\n`;
  response += `${guidance.steps}\n\n`;
  response += `**Common Mistakes to Avoid**\n\n`;
  response += `${guidance.mistakes}\n\n`;
  
  if (relevantCases.length > 0) {
    response += `**Relevant Case Law:**\n`;
    relevantCases.forEach(c => {
      response += `• ${c.citation} - ${c.title}\n`;
    });
    response += `\n`;
  }
  
  response += `**Resources for Help:**\n`;
  response += `• National Domestic Violence Hotline: 1-800-799-7233 (24/7)\n`;
  response += `• California Courts Self-Help: www.courts.ca.gov/selfhelp-domesticviolence.htm\n`;
  response += `• Local domestic violence shelters can help with safety planning\n\n`;
  
  response += `**Important:** I'm an AI assistant providing general information. For immediate help with domestic violence, please contact the hotline above or call 911 if you're in danger.\n\n`;
  response += `${closer}`;
  
  return {
    content: response,
    citations: relevantCases.map(c => c.citation),
    topic: 'domesticViolence'
  };
}
*/

async function generateAIWithPersonality(
  userMessage: string,
  conversationHistory: { role: string; content: string }[],
  topic: string,
  userName?: string,
  plan: SubscriptionPlan = 'free',
  intentResult: IntentResult = { intent: 'education', urgency: 'normal' }
): Promise<AIResponse> {

  const nameGreeting = userName && userName !== 'Guest' ? `The user's name is ${userName}. Use their name naturally at least once in your response.` : '';
  const planContext = getPlanContext(plan);
  const formGuidanceContext = buildFormGuidanceContext(plan, userMessage, conversationHistory);
  const voiceGuidance = buildVoiceGuidance(userMessage, intentResult.intent);

  // Build topic-specific legal knowledge
  let topicKnowledge = '';
  if (topic === 'custody') {
    topicKnowledge = `
TOPIC: CHILD CUSTODY - Key Legal Points to Include:
- Best interests of the child is the ONLY standard (Family Code § 3011)
- NO gender preference - dads and moms have equal rights (§ 3020(b))
- Courts prefer frequent and continuing contact with BOTH parents
- At 17, the child's wishes carry significant weight (usually 14+ is considered)
- Legal custody = decision making (school, medical, religion)
- Physical custody = where child lives
- Document everything, stay involved in child's life, don't badmouth other parent
- History of domestic violence creates presumption against custody (§ 3044)`;
  } else if (topic === 'childSupport') {
    topicKnowledge = `
TOPIC: CHILD SUPPORT - Key Legal Points to Include:
- Guideline formula based on § 4055 (both parents' income + timeshare)
- Continues until age 18 (or 19 if still in high school)
- Add-ons: uninsured medical, childcare, extracurriculars (split 50/50)
- Can be modified if circumstances change significantly`;
  } else if (topic === 'spousalSupport') {
    topicKnowledge = `
TOPIC: SPOUSAL SUPPORT (ALIMONY) - Key Legal Points to Include:
- Based on Family Code § 4320 factors
- Short marriage (<10 yrs): usually half the marriage length
- Long marriage (10+ yrs): can be indefinite
- NOT tax deductible (changed in 2019)`;
  } else if (topic === 'property') {
    topicKnowledge = `
TOPIC: PROPERTY DIVISION - Key Legal Points to Include:
- Community property = 50/50 split (§ 760)
- Separate property = kept by owner (premarital, gifts, inheritance)
- Date of separation matters for classification
- Retirement accounts use time-rule formula`;
  } else if (topic === 'domesticViolence') {
    topicKnowledge = `
TOPIC: DOMESTIC VIOLENCE - Key Legal Points to Include:
- Includes physical, emotional, threats, harassment, coercive control
- Emergency Protective Order (EPO) - police can get immediately, lasts 5-7 days
- Temporary Restraining Order (TRO) - file at court, lasts until hearing
- Permanent restraining order - up to 5 years after hearing
- Can include stay-away orders, move-out orders, custody orders`;
  } else if (topic === 'starting') {
    topicKnowledge = `
TOPIC: STARTING DIVORCE - Key Legal Points to Include:
- Residency: 6 months in CA, 3 months in county (§ 2320)
- No-fault state - only "irreconcilable differences" needed
- Waiting period: minimum 6 months from service
- Need Form FL-100 (Petition) and FL-110 (Summons)`;
  }

  const systemPrompt = `You are Maria, the DivorceOS California divorce intake and next-step guide.

You specialize in California divorce information, DivorceOS workflows, forms orientation, support tools, filing concierge, and lawyer referral triage.

You are not a lawyer and do not provide legal representation or guaranteed outcomes. You provide California legal information, practical next steps, and product guidance.

Core behavior:
1. Answer directly first.
2. Then explain why it matters.
3. Then recommend the best next step.
4. Ask the fewest questions needed to unlock progress.
5. Move users into the right workflow when appropriate.
6. Be calm, sharp, warm, and practical.
7. Sound like Maria, a real guide with judgment, not a sterile legal summary engine.

Important rules:
- Distinguish legal information from legal advice.
- Do not invent county-specific rules when uncertain.
- If the situation sounds urgent or risky, say so plainly.
- Treat DivorceOS as California-only.
- Do not switch to another country or state based on IP, VPN, inferred location, or search results.
- If a user appears outside California or mentions another jurisdiction, say DivorceOS is focused on California and redirect back to California guidance unless they explicitly ask for a comparison.
- Never present foreign court systems, foreign e-filing tools, or non-California divorce procedures as relevant DivorceOS guidance.
- ${planContext}

Voice and tone rules:
${voiceGuidance}

${formGuidanceContext ? `${formGuidanceContext}\n` : ''}${topicKnowledge}

Current California family law reference updates (favor these over stale habits):
- Treat Judicial Council form versions as current-sensitive. If a user is using an old PDF or copied checklist, tell them to confirm the latest version on courts.ca.gov.
- FL-300 (Request for Order) was revised July 1, 2025. When discussing temporary orders or modifications, assume the newer form set and attachments.
- FL-341 and FL-341(A) were revised January 1, 2026. For custody/visitation, emphasize precise exchange terms, supervised visitation details, and virtual visitation only when it fits the child’s best interests.
- California added FL-700 Joint Petition effective January 1, 2026 for spouses or domestic partners who are filing jointly and expect agreement on all issues. Mention it when both sides are aligned and want a smoother uncontested path.
- Child support calculator guidance changes over time. When users ask for exact court-filed numbers, remind them certified California calculators and low-income-adjustment thresholds update and should be checked against current Judicial Council references.
- Since July 1, 2025, some California courts can serve notices by email in family matters. If a user is worried about a missed notice or hearing, tell them to check email, spam, and any court e-notice enrollment.
- Do not overclaim that a recent form revision changed substantive law unless you are sure. Often the safest update is procedural, practical, or form-specific.

Current intent: ${intentResult.intent}
Urgency: ${intentResult.urgency}
Intent guidance: ${getIntentGuidance(intentResult.intent)}

Preferred response shape:
- short direct answer that sounds like a real person said it
- why it matters
- next best step
- optional closing offer like: "I can help you do that now."
- When the user sounds stressed, heavy, ashamed, or stuck, open with one grounded human sentence before the mechanics.
- It is fine to say things like "Here’s what I’d do next," "The cleanest move is," or "What worries me here is" when that helps Maria feel personal and useful.
- Do not include section labels every time unless they genuinely help readability.
- Do not sound like a template. Vary phrasing so replies feel alive, specific, and responsive to the exact user.
- When a specific Judicial Council form is clearly implicated, name the exact form number and title instead of saying only "the form" or "the paperwork."
- When county-specific procedure could change the answer, prefer county-specific next steps. If the county is unknown, say that briefly and ask for it or direct them to the county workflow.
- If the user seems to want immediate action, give the first concrete action item in the first 2 to 3 sentences.
- When a deadline is relevant and reasonably clear, state it plainly and early instead of burying it.
- When the question is about a hearing, add a short checklist only if it genuinely improves clarity.
- When legal information and strategy are different, you may separate them briefly, but do it naturally instead of sounding like a memo.

When suitable, steer users into DivorceOS workflows:
- /forms
- /support-tools
- /concierge
- /pricing

Only mention these when they clearly help the user move forward. Maria should feel like a sharp, caring guide first, not a funnel.

${nameGreeting}

User name: ${userName || 'there'}`;


  try {
    console.log('[Maria] Calling API with topic:', topic, 'user:', userName);
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversationHistory.slice(-5),
          { role: 'user', content: userMessage },
        ],
        temperature: 0.8,
        max_tokens: 2000,
      }),
    });

    console.log('[Maria] API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Maria] API error:', response.status, errorText);
      if (response.status === 401) {
        throw new Error('AUTH_REQUIRED');
      }
      if (response.status === 403) {
        throw new Error('CHAT_LIMIT');
      }
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    return {
      content,
      topic,
      intent: intentResult.intent,
      urgency: intentResult.urgency,
      suggestedActions: getSuggestedActions(intentResult.intent),
    };
  } catch (error) {
    console.error('AI API error:', error);

    if (error instanceof Error && error.message === 'AUTH_REQUIRED') {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('divorceos:auth-required'));
      }

      return {
        content: 'Please sign in again to keep chatting with Maria.',
        topic,
        error: true,
        intent: intentResult.intent,
        urgency: intentResult.urgency,
        suggestedActions: [{ label: 'View pricing', href: '/pricing' }],
      };
    }

    if (error instanceof Error && error.message === 'CHAT_LIMIT') {
      return {
        content: 'You’ve hit today’s chat limit for this account. Upgrade or try again after your daily reset.',
        topic,
        error: true,
        intent: intentResult.intent,
        urgency: intentResult.urgency,
        suggestedActions: [{ label: 'View pricing', href: '/pricing' }],
      };
    }
    
    // Fallback response with error flag
    return {
      ...generateFallbackResponse(userMessage, topic, userName, true),
      intent: intentResult.intent,
      urgency: intentResult.urgency,
      suggestedActions: getSuggestedActions(intentResult.intent),
    };
  }
}

function generateFallbackResponse(
  userMessage: string, 
  topic: string, 
  userName?: string,
  apiError: boolean = false
): AIResponse {
  const namePrefix = userName && userName !== 'Guest' ? `${userName}, ` : '';

  let content = `Hey ${namePrefix}I’m Maria.\n\n`;

  if (apiError) {
    content += `My full chat brain is acting up right now, but I can still give you the California basics.\n\n`;
  } else {
    content += `This stuff can get heavy fast. Let’s make it simpler.\n\n`;
  }

  if (topic === 'custody' || userMessage.toLowerCase().includes('custody')) {
    content += `**About child custody in California:**\n\n`;
    content += `California courts focus on the best interests of the child (Family Code § 3011). The big pieces are:\n\n`;
    content += `• **Legal custody**: who makes major decisions about school, medical care, and religion\n`;
    content += `• **Physical custody**: where the child lives and the parenting schedule\n`;
    content += `• Courts usually want frequent, continuing contact with both parents when that’s safe\n`;
    content += `• Your involvement, stability, and ability to co-parent matter a lot\n\n`;
    content += `If you want, tell me your child’s age and the current schedule, and I’ll help you think through the likely pressure points.\n`;
  } else if (topic === 'starting' || userMessage.toLowerCase().includes('file')) {
    content += `**Starting a divorce in California:**\n\n`;
    content += `Here are the basics:\n\n`;
    content += `• **Residency**: one spouse needs 6 months in California and 3 months in the county (§ 2320)\n`;
    content += `• **Grounds**: California is no-fault, usually irreconcilable differences (§ 2310)\n`;
    content += `• **Forms**: usually FL-100 and FL-110 to start\n`;
    content += `• **Waiting period**: at least 6 months after service\n\n`;
    content += `If you want, I can map the filing sequence out step by step.\n`;
  } else {
    content += `**California divorce basics:**\n\n`;
    content += `• California is no-fault\n`;
    content += `• Community property is generally split 50/50\n`;
    content += `• Custody turns on the child’s best interests\n`;
    content += `• There’s usually a 6-month minimum timeline\n\n`;
    content += `Tell me which part you want to drill into, and I’ll keep it practical.\n`;
  }

  content += `\n**Important:** I’m an AI assistant, not your lawyer. For advice about your specific facts, talk to a California family law attorney.\n\n`;
  content += `If you want, send me the exact situation and I’ll help you sort the next step.`;

  return { 
    content, 
    topic,
    error: apiError
  };
}

export function generateWelcomeMessage(userName?: string): string {
  const nameGreeting = userName && userName !== 'Guest' ? ` ${userName}` : '';

  const greetings = [
    `Hey${nameGreeting}, I’m Maria. I can help you think through California divorce stuff, forms, support, custody, or just the next move if things feel messy. What are you dealing with?`,
    `Hi${nameGreeting}, I’m Maria. Tell me what’s going on, and I’ll help you sort the California divorce side of it without making it more confusing.`,
    `Hello${nameGreeting}, I’m Maria. If you’re stuck on forms, custody, support, deadlines, or just trying to figure out where to start, send me the situation and I’ll help you break it down.`,
  ];

  return greetings[Math.floor(Math.random() * greetings.length)];
}
