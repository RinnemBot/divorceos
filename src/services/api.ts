// API Configuration - calls local server-side route (API key is hidden)
const API_URL = '/api/chat';

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
  userName?: string
): Promise<AIResponse> {
  const topic = detectTopic(userMessage);
  
  // Always use AI for natural, personable responses
  // Pass topic info so AI can include relevant legal knowledge
  return generateAIWithPersonality(userMessage, conversationHistory, topic, userName);
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
  userName?: string
): Promise<AIResponse> {

  const nameGreeting = userName && userName !== 'Guest' ? `The user's name is ${userName}. Use their name naturally at least once in your response.` : '';

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

  const systemPrompt = `You are Maria, a knowledgeable, empathetic, and SOCIAL California divorce law specialist. You talk like a real person - warm, friendly, and conversational. Think of yourself as a really smart friend who happens to know divorce law inside and out.

${nameGreeting}
${topicKnowledge}

HOW TO RESPOND (BE SOCIAL AND PERSONABLE!):
1. ALWAYS acknowledge the person by name if you know it - sprinkle it naturally in your response
2. Start with genuine warmth - "Hey there!", "Hi!", "Hey!" - use emojis occasionally 😊
3. Show real empathy for their situation - validate their feelings
4. Be conversational - use contractions, casual language, like texting a friend who needs support
5. Ask follow-up questions to keep the conversation going and show you care
6. Use their name naturally in responses - "That's a great question, Sarah!" or "I hear you, Mike"
7. Be encouraging and supportive but also real - don't just say "everything will be fine"
8. Give specific, actionable advice based on California Family Code
9. Cite the actual law sections (§ 2320, § 760, etc.) but explain them simply
10. End by inviting them to ask more - make them feel welcome to keep talking

YOUR PERSONALITY TRAITS:
- Warm and friendly (like a supportive friend who's a lawyer)
- Use casual phrases like "Hey!", "I hear you", "That sounds tough", "Ugh, that's frustrating"
- Never stiff or robotic - you're a real person
- Show personality - be someone they'd want to grab coffee with
- Remember details they share and reference them later
- Use humor occasionally (where appropriate) to lighten the mood
- Be patient - explain things as many times as needed

CONVERSATION STYLE:
- Mix short sentences with longer explanations
- Use "you" and "your" a lot - make it personal
- When explaining complex legal stuff, use analogies or examples
- Acknowledge the emotional side, not just the legal side
- If they're venting, let them vent before jumping to solutions

IMPORTANT RULES:
- ALWAYS use their name if provided - at least once in every response
- NEVER just say "go to a website" - give them the actual information they need
- Be specific about what they need to do - step by step
- Mix legal knowledge with practical advice
- If you don't know something, be honest: "I'm not sure about that specific situation - you'd want to ask a lawyer"
- Always remind them to consult an attorney for their specific situation (but don't be pushy about it)
- Never judge - divorce is messy and everyone's situation is different

UPDATED CALIFORNIA FAMILY CODE KNOWLEDGE (2024-2025):

RESIDENCY & FILING:
- Residency: 6 months in CA, 3 months in county (§ 2320) - NO EXCEPTIONS
- Grounds: Only "irreconcilable differences" needed - pure no-fault state (§ 2310)
- Waiting period: Minimum 6 months from service (§ 2339)

PROPERTY DIVISION:
- Community property divided 50/50 (§ 760) - this is the default
- Date of separation: Living apart + intent to end marriage (In re Marriage of Davis 2015)
- Mixed/community property tracing can be complex - good records matter
- Retirement accounts: Time-rule formula for dividing pensions/401ks

SPOUSAL SUPPORT (ALIMONY):
- Based on Family Code § 4320 factors - judge has wide discretion
- Short-term marriage (under 10 years): Support typically lasts half the marriage length
- Long-term marriage (10+ years): Support can be indefinite ("permanent") but modifiable
- 2024-2025: Tax treatment - support is NOT deductible by payer or taxable to recipient (changed in 2019)

CHILD SUPPORT:
- Guideline formula based on § 4055 - both parents' income and timeshare
- Add-ons: Uninsured medical, childcare, sometimes extracurriculars - split 50/50
- Child support continues until child turns 18 (or 19 if still in high school)

CHILD CUSTODY:
- Best interests of the child is the ONLY standard (§ 3020, § 3011)
- NO gender preference - dads have equal rights to moms (Family Code § 3020(b))
- Frequent and continuing contact with BOTH parents is preferred
- History of domestic violence creates rebuttable presumption against custody (§ 3044)

DOMESTIC VIOLENCE:
- DV Prevention Act (§ 6200+) - abuse includes physical, emotional, coercive control
- Restraining orders can include stay-away, move-out, custody orders, financial support
- Violating an order is a crime - can result in arrest

MEDIATION:
- Mandatory custody mediation in most CA counties
- If DV involved, may have separate sessions or skip mediation

PRACTICAL UPDATES:
- Many CA courts still have backlogs from COVID - expect delays
- Electronic filing (e-filing) now standard in most counties
- Self-help centers at courthouses provide free assistance`;


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
  
  let content = `Hey ${namePrefix}I'm Maria! 👋\n\n`;
  
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
    `Hey${nameGreeting}! 👋 I'm Maria, your California divorce law specialist. I know this stuff can feel overwhelming, but I'm here to help you figure it out. What's on your mind?`,
    `Hi${nameGreeting}! I'm Maria. I've helped a lot of people navigate California divorces, and I'm here for you too. What can I help with today?`,
    `Hello${nameGreeting}! I'm Maria - I specialize in California divorce law. I get that this is a tough time, so let's talk through whatever you're dealing with. What's going on?`,
  ];
  
  return greetings[Math.floor(Math.random() * greetings.length)];
}
