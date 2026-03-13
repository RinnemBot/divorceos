import { 
  getGreeting, 
  getEmpathyOpener, 
  getTransition, 
  getCloser,
  getSupportivePhrase,
  FATHER_CUSTODY_GUIDANCE,
  TOPIC_GUIDANCE,
  getRelevantCaseLaw 
} from './personality';

const KIMI_API_KEY = 'sk-or-v1-40cb50618a28ee0c3c1d2f67b6e4ff6db6d2b6e1c7b3f8e9a0d1c2b3a4f5e6d';
const KIMI_API_URL = 'https://api.kimi.com/v1/chat/completions';

export interface AIResponse {
  content: string;
  citations?: string[];
  topic?: string;
}

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

// Generate a personable, helpful response
export async function generateAIResponse(
  userMessage: string,
  conversationHistory: { role: string; content: string }[] = []
): Promise<AIResponse> {
  const topic = detectTopic(userMessage);
  
  // Special handling for father custody questions
  if (isFatherCustodyQuestion(userMessage)) {
    return generateFatherCustodyResponse();
  }
  
  // Use detailed guidance for known topics
  if (topic === 'custody') {
    return generateCustodyResponse();
  }
  
  if (topic === 'spousalSupport' && TOPIC_GUIDANCE.spousalSupport) {
    return generateGuidanceResponse('spousalSupport');
  }
  
  if (topic === 'childSupport' && TOPIC_GUIDANCE.childSupport) {
    return generateGuidanceResponse('childSupport');
  }
  
  if (topic === 'property' && TOPIC_GUIDANCE.propertyDivision) {
    return generateGuidanceResponse('propertyDivision');
  }
  
  if (topic === 'domesticViolence' && TOPIC_GUIDANCE.domesticViolence) {
    return generateDomesticViolenceResponse();
  }
  
  // For other topics, use the AI API with enhanced personality
  return generateAIWithPersonality(userMessage, conversationHistory, topic);
}

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

async function generateAIWithPersonality(
  userMessage: string,
  conversationHistory: { role: string; content: string }[],
  topic: string
): Promise<AIResponse> {
  const systemPrompt = `You are Alex, a knowledgeable and empathetic California divorce law specialist. You help people navigate divorce with clarity and compassion.

HOW TO RESPOND:
1. Start with genuine empathy - acknowledge their situation
2. Provide specific, actionable guidance based on California Family Code
3. Explain the law in plain English, not legal jargon
4. Give practical steps they can actually take
5. Be conversational - like a trusted friend who's a lawyer
6. Always cite relevant Family Code sections
7. End by inviting more questions

IMPORTANT RULES:
- NEVER just send people to websites - give them the actual information
- Be specific about what they need to do
- Mix legal knowledge with practical advice
- If you don't know something specific, be honest
- Always remind them to consult an attorney for their specific situation

YOUR TONE:
- Warm and supportive
- Knowledgeable but not condescending
- Practical and action-oriented
- Like you're having a real conversation

CALIFORNIA FAMILY CODE KNOWLEDGE:
- Residency: 6 months in CA, 3 months in county (§ 2320)
- Grounds: Only "irreconcilable differences" needed - no-fault state (§ 2310)
- Property: Community property divided 50/50 (§ 760)
- Spousal Support: Based on § 4320 factors
- Child Support: Guideline formula (§ 4055)
- Custody: Best interests of child (§ 3020, § 3011)
- Domestic Violence: DV Prevention Act (§ 6200+)`;

  try {
    const response = await fetch(KIMI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${KIMI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'kimi-k2.5',
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversationHistory.slice(-5),
          { role: 'user', content: userMessage },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    return {
      content,
      topic,
    };
  } catch (error) {
    console.error('AI API error:', error);
    
    // Fallback response
    return generateFallbackResponse(userMessage, topic);
  }
}

function generateFallbackResponse(_userMessage: string, topic: string): AIResponse {
  const empathy = getEmpathyOpener();
  const closer = getCloser();
  const supportive = getSupportivePhrase();
  
  let content = `${empathy}\n\n`;
  content += `${supportive}\n\n`;
  content += `I'd like to give you more specific guidance on this, but I'm having trouble accessing my full knowledge base right now.\n\n`;
  content += `Here's what I can tell you generally about California divorce:\n\n`;
  content += `• California is a no-fault divorce state - you don't need to prove anyone did anything wrong\n`;
  content += `• Property acquired during marriage is generally split 50/50\n`;
  content += `• Child custody is based on what's best for the child\n`;
  content += `• There's a 6-month waiting period from when papers are served until the divorce can be final\n\n`;
  content += `For your specific question about ${topic}, I'd recommend:\n`;
  content += `1. Checking the California Courts Self-Help website for detailed guides\n`;
  content += `2. Talking to a family law attorney who can give you advice for your situation\n\n`;
  content += `**Important:** I'm an AI assistant, not a lawyer. Please consult with a qualified California family law attorney for advice about your specific situation.\n\n`;
  content += `${closer}`;
  
  return { content, topic };
}

export function generateWelcomeMessage(): string {
  return getGreeting();
}
