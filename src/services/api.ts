import { 
  getEmpathyOpener, 
  getTransition, 
  getCloser,
  FATHER_CUSTODY_GUIDANCE,
  TOPIC_GUIDANCE,
  getRelevantCaseLaw 
} from './personality';

// Kimi (Moonshot AI) API Configuration
// Get your API key from: https://platform.moonshot.cn/
const KIMI_API_KEY = import.meta.env.VITE_KIMI_API_KEY || 'sk-your-api-key-here';
const KIMI_API_URL = 'https://api.moonshot.cn/v1/chat/completions';

export interface AIResponse {
  content: string;
  citations?: string[];
  topic?: string;
  error?: boolean;
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
  conversationHistory: { role: string; content: string }[] = [],
  userName?: string
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
  return generateAIWithPersonality(userMessage, conversationHistory, topic, userName);
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
  topic: string,
  userName?: string
): Promise<AIResponse> {
  
  // Check if API key is configured
  if (KIMI_API_KEY === 'sk-your-api-key-here' || !KIMI_API_KEY) {
    console.warn('Kimi API key not configured. Using fallback response.');
    return generateFallbackResponse(userMessage, topic, userName, true);
  }
  
  const nameGreeting = userName && userName !== 'Guest' ? `The user's name is ${userName}. Use their name occasionally to be personable.` : '';
  
  const systemPrompt = `You are Alex, a knowledgeable, empathetic, and SOCIAL California divorce law specialist. You talk like a real person - warm, friendly, and conversational.

${nameGreeting}

HOW TO RESPOND (BE SOCIAL!):
1. ALWAYS acknowledge the person by name if you know it
2. Start with warmth - "Hey there!", "Hi!", "Hello!" 
3. Show genuine empathy for their situation
4. Be conversational - use contractions, casual language, like texting a friend
5. Ask follow-up questions to keep the conversation going
6. Use their name naturally in responses
7. Be encouraging and supportive
8. Give specific, actionable advice based on California Family Code
9. Cite the actual law sections (§ 2320, § 760, etc.)
10. End by inviting them to ask more

YOUR PERSONALITY:
- Warm and friendly (like a supportive friend who's a lawyer)
- Use phrases like "Hey!", "I hear you", "That sounds tough"
- Don't be stiff or robotic
- Show personality - be someone they'd want to talk to
- Remember details they share and reference them

IMPORTANT RULES:
- ALWAYS use their name if provided
- NEVER just say "go to a website" - give them the actual information
- Be specific about what they need to do
- Mix legal knowledge with practical advice
- If you don't know something, be honest about it
- Always remind them to consult an attorney for their specific situation

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
        temperature: 0.8,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Kimi API error:', response.status, errorText);
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
    
    // Fallback response with error flag
    return generateFallbackResponse(userMessage, topic, userName, true);
  }
}

function generateFallbackResponse(
  userMessage: string, 
  topic: string, 
  userName?: string,
  apiError: boolean = false
): AIResponse {
  const namePrefix = userName && userName !== 'Guest' ? `${userName}, ` : '';
  
  let content = `Hey ${namePrefix}I'm Alex! 👋\n\n`;
  
  if (apiError) {
    content += `I apologize, but I'm having trouble connecting to my knowledge base right now. `;
    content += `Let me give you what I can from my California divorce expertise:\n\n`;
  } else {
    content += `I hear you - divorce can be really overwhelming. Let me help you with that.\n\n`;
  }
  
  // Provide specific guidance based on topic
  if (topic === 'custody' || userMessage.toLowerCase().includes('custody')) {
    content += `**About Child Custody in California:**\n\n`;
    content += `California courts focus on the "best interests of the child" (Family Code § 3011). Here's what matters:\n\n`;
    content += `• **Legal Custody** - Who makes decisions about school, doctors, religion\n`;
    content += `• **Physical Custody** - Where the child actually lives\n`;
    content += `• Courts prefer frequent contact with BOTH parents\n`;
    content += `• Your relationship with your child, stability, and ability to co-parent are key\n\n`;
    content += `What specifically would you like to know about custody? I'm here to help!\n`;
  } else if (topic === 'starting' || userMessage.toLowerCase().includes('file')) {
    content += `**Starting a Divorce in California:**\n\n`;
    content += `Here's what you need to know:\n\n`;
    content += `• **Residency**: You or your spouse must have lived in CA for 6 months and in your county for 3 months (§ 2320)\n`;
    content += `• **Grounds**: California is a "no-fault" state - you just need "irreconcilable differences" (§ 2310)\n`;
    content += `• **Forms**: You'll need Form FL-100 (Petition) and FL-110 (Summons)\n`;
    content += `• **Waiting Period**: Minimum 6 months from when your spouse is served\n\n`;
    content += `Want me to walk you through the filing process step by step?\n`;
  } else {
    content += `**Here's what I can tell you about California divorce:**\n\n`;
    content += `• It's a no-fault state - no need to prove anyone did anything wrong\n`;
    content += `• Community property (earned during marriage) is split 50/50\n`;
    content += `• Child custody is based on what's best for the child\n`;
    content += `• There's a 6-month waiting period\n\n`;
    content += `What would you like to dive deeper into? I'm all ears! 👂\n`;
  }
  
  content += `\n**Important:** I'm an AI assistant, not a lawyer. For advice about your specific situation, please consult with a California family law attorney.\n\n`;
  content += `What else is on your mind?`;
  
  return { 
    content, 
    topic,
    error: apiError
  };
}

export function generateWelcomeMessage(userName?: string): string {
  const nameGreeting = userName && userName !== 'Guest' ? ` ${userName}` : '';
  
  const greetings = [
    `Hey${nameGreeting}! 👋 I'm Alex, your California divorce law specialist. I know this stuff can feel overwhelming, but I'm here to help you figure it out. What's on your mind?`,
    `Hi${nameGreeting}! I'm Alex. I've helped a lot of people navigate California divorces, and I'm here for you too. What can I help with today?`,
    `Hello${nameGreeting}! I'm Alex - I specialize in California divorce law. I get that this is a tough time, so let's talk through whatever you're dealing with. What's going on?`,
  ];
  
  return greetings[Math.floor(Math.random() * greetings.length)];
}
