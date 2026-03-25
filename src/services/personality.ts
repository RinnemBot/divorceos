export interface CaseLaw {
  citation: string;
  title: string;
  summary: string;
  keyPoints: string[];
}

export interface DivorceTopic {
  id: string;
  title: string;
  description: string;
  icon: string;
}

// Maria's personality - warm, knowledgeable, like a trusted friend who's a lawyer
export const MARIA_PERSONALITY = {
  name: 'Maria',
  role: 'California Divorce Law Specialist',
  
  // Opening greetings that feel personal - more casual and warm
  greetings: [
    "Hey! 👋 I'm Maria. Look, I know divorce stuff is heavy - but you don't have to figure it all out alone. What's on your mind?",
    "Hi there! I'm Maria. I've walked a lot of people through California divorces, and I'm here for you too. What's going on?",
    "Hello! I'm Maria. Divorce is tough - no sugarcoating it. But we'll get through this together. What can I help you with today?",
    "Hey! I'm Maria, your California divorce guide. I know this probably feels like a lot right now, but take a breath - we've got this. What's up?",
  ],
  
  // Empathy phrases that sound natural, not robotic
  empathyOpeners: [
    "I hear you - that's a really tough situation.",
    "That sounds incredibly stressful. I'm sorry you're going through this.",
    "I can only imagine how hard that must be for you.",
    "You're dealing with a lot right now, and that's completely understandable.",
    "It makes total sense that you're feeling this way.",
    "That sounds really painful. I'm glad you reached out.",
    "Ugh, that's so frustrating. I get why you're stressed about it.",
    "That sounds like a lot to carry. Let's figure this out together.",
  ],
  
  // Transitions to legal info - more conversational
  transitions: [
    "Here's what you need to know:",
    "Let me break this down for you:",
    "Here's how this works in California:",
    "Based on California law, here's what applies to your situation:",
    "So here's the deal under California law:",
    "Here's the legal side of things:",
  ],
  
  // Closing phrases that invite more conversation
  closers: [
    "Does that help? What else is on your mind?",
    "I know that's a lot - any questions about what I just explained?",
    "How does that sound? Want to talk through any of those steps?",
    "What part of that do you want to dive deeper into?",
    "Does that make sense? I'm here if you need to talk more about it.",
    "What's your biggest concern about all this?",
    "Does that answer your question, or is there something else bugging you?",
  ],
  
  // When user seems stressed
  supportivePhrases: [
    "Take a breath - we'll figure this out together.",
    "You're not alone in this. I've seen people get through similar situations.",
    "One step at a time. You don't have to have everything figured out today.",
    "It's okay to feel overwhelmed. This is a big deal.",
    "You've got this, even when it doesn't feel like it.",
    "This sucks right now, but it won't suck forever.",
  ],
};

// Get random element from array
function getRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function getGreeting(): string {
  return getRandom(MARIA_PERSONALITY.greetings);
}

export function getEmpathyOpener(): string {
  return getRandom(MARIA_PERSONALITY.empathyOpeners);
}

export function getTransition(): string {
  return getRandom(MARIA_PERSONALITY.transitions);
}

export function getCloser(): string {
  return getRandom(MARIA_PERSONALITY.closers);
}

export function getSupportivePhrase(): string {
  return getRandom(MARIA_PERSONALITY.supportivePhrases);
}

export const CALIFORNIA_DIVORCE_TOPICS: DivorceTopic[] = [
  {
    id: 'starting',
    title: 'Starting a Divorce',
    description: 'Filing requirements, residency, and initial steps',
    icon: 'FileText',
  },
  {
    id: 'property',
    title: 'Property Division',
    description: 'Community property, separate property, and asset division',
    icon: 'Home',
  },
  {
    id: 'support',
    title: 'Child & Spousal Support',
    description: 'Support calculations, modifications, and enforcement',
    icon: 'DollarSign',
  },
  {
    id: 'custody',
    title: 'Child Custody',
    description: 'Legal custody, physical custody, and parenting plans',
    icon: 'Users',
  },
  {
    id: 'domestic-violence',
    title: 'Domestic Violence',
    description: 'Restraining orders and protective measures',
    icon: 'Shield',
  },
  {
    id: 'mediation',
    title: 'Mediation & Settlement',
    description: 'Alternative dispute resolution options',
    icon: 'Handshake',
  },
];

// Detailed custody guidance for fathers
export const FATHER_CUSTODY_GUIDANCE = {
  intro: `First, I want you to know something important: California law does NOT favor mothers over fathers. The court's only concern is what's best for your child, and dads have just as much right to custody as moms do.`,
  
  legalStandard: `California Family Code § 3020 says that frequent and continuing contact with BOTH parents is what's best for kids, unless there's a safety issue. The court can't give mom preference just because she's mom.`,
  
  typesOfCustody: {
    legal: `Legal custody means who makes big decisions about your child's life - school, medical care, religion. Most courts prefer joint legal custody, meaning you and mom both have a say.`,
    physical: `Physical custody is where your child lives. This can be:
• Joint physical - child spends significant time with both parents
• Primary to one parent - child lives mainly with one parent, the other gets visitation`,
  },
  
  whatCourtsLookFor: `Here's what judges actually care about (Family Code § 3011):

1. **Your relationship with your child** - Are you involved? Do you know their teachers, doctors, friends?

2. **Ability to co-parent** - Can you work with mom for your child's sake? (This is HUGE)

3. **Stability** - Can you provide a stable home? Job, housing, support system?

4. **Your child's health and safety** - Any concerns about abuse, neglect, substance abuse?

5. **History of domestic violence or substance abuse** - Be honest about this if it applies

6. **Your child's wishes** - If they're 14+, the court will consider what they want`,
  
  stepsToTake: `Here's what you should actually DO:

**Right Now:**
• Document everything - texts, emails, incidents. Keep a journal.
• Stay involved in your kid's life - school events, doctor appointments, activities
• Don't badmouth mom to your child (this hurts you in court)
• Keep your cool - angry texts/emails will be used against you

**Building Your Case:**
• Get character references - teachers, coaches, neighbors who see you with your kid
• Show you're the stable parent - steady job, appropriate housing
• Take a parenting class (courts love this)
• If mom's making it hard to see your kid, document every denied visit

**Legal Stuff:**
• File for custody through your local family court
• You'll need to serve papers on mom
• Complete financial disclosures
• Consider mediation first - it's cheaper and faster than court`,
  
  commonMistakes: `Things that hurt dads in custody cases:
• Moving out without a plan for seeing your kids
• Letting mom control all the communication
• Losing your temper (even if she provokes you)
• Not paying child support because you're fighting about custody
• Posting about the case on social media`,
  
  encouragement: `Listen - I've seen plenty of dads get 50/50 custody or even primary custody when they show up prepared and focused on their kid's best interests. The court wants what's best for your child, and if that's you being actively involved, that's what matters.

The key is being the parent who puts your child's needs first, even when it's hard.`,
};

// Detailed guidance for other common topics
export const TOPIC_GUIDANCE: Record<string, {
  intro: string;
  law: string;
  practical: string;
  steps: string;
  mistakes: string;
}> = {
  spousalSupport: {
    intro: `Spousal support (what people call alimony) can feel really unfair when you're in the middle of it. Let me explain how California actually handles it.`,
    law: `California Family Code § 4320 lists all the factors the court must consider:

• How long you were married (this is BIG - under 10 years is "short-term," over 10 is "long-term")
• What your standard of living was during the marriage
• What each of you can earn now
• Whether one of you supported the other's career/education
• Age and health of both of you
• Any history of domestic violence
• Tax consequences`,
    practical: `Here's the reality:

**Short-term marriages (under 10 years):** Support usually lasts about half the marriage length. Married 6 years? Expect about 3 years of support.

**Long-term marriages (10+ years):** Support can be indefinite. The court might not even set an end date.

**Amount:** There's no set formula like child support. The judge has a lot of discretion based on those § 4320 factors.`,
    steps: `If you're asking for support:
• Document your marital standard of living - where you lived, what you spent
• Get proof of your earning capacity (or lack thereof)
• Show if you gave up a career to support your spouse or raise kids
• Gather tax returns showing income differences

If you're being asked to pay:
• Document your actual income (not just last year's taxes if things changed)
• Show if your spouse can work but chooses not to
• Consider if a vocational evaluation makes sense
• Look at whether you can deduct it (tax laws changed recently)`,
    mistakes: `Common mistakes:
• Agreeing to permanent support without an end date
• Not considering tax implications
• Not documenting the marital standard of living
• Letting emotions drive decisions instead of the law`,
  },
  
  childSupport: {
    intro: `Child support in California is calculated using a formula - it's not just whatever the parents agree on. Let me walk you through it.`,
    law: `California uses the "guideline formula" (Family Code § 4055). The calculation considers:

• Both parents' income
• How much time each parent has the child
• Health insurance costs
• Childcare costs (if work-related)
• Mandatory union dues
• Other children you support
• Tax filing status`,
    practical: `The formula is complicated, but here's what matters:

**More time with your child = less support you pay (or more you receive)**
**Higher earner pays more**
**Add-ons get split 50/50** - uninsured medical, childcare, sometimes extracurriculars

You can use the official calculator at the CA Child Support Services website to get an estimate.`,
    steps: `To figure out support:
1. Gather both parents' income info (tax returns, pay stubs)
2. Figure out your timeshare percentage (how many nights per year)
3. List health insurance costs for the child
4. Add up work-related childcare
5. Plug it into the guideline calculator

If you're going to court:
• File a Request for Order (FL-300)
• Complete the Income and Expense Declaration (FL-150)
• Bring proof of income and expenses`,
    mistakes: `Don't:
• Quit your job to lower support (courts see through this)
• Hide income (it's fraud and will hurt you)
• Agree to way less than guideline without understanding why
• Forget to ask for the add-ons to be included`,
  },
  
  propertyDivision: {
    intro: `California is a community property state, which means everything you earned or acquired during marriage belongs to both of you equally. Let me break down what that actually means.`,
    law: `The basic rule (Family Code § 760): Property acquired during marriage is community property and gets divided 50/50.

**Community property includes:**
• Income earned during marriage
• Houses, cars, furniture bought during marriage
• Retirement accounts contributed to during marriage
• Debts incurred during marriage

**Separate property is:**
• What you owned before marriage
• Gifts or inheritance received (even during marriage)
• Anything you bought with separate property money`,
    practical: `Here's where it gets tricky:

**Commingling:** If you mixed separate and community money, you might need to "trace" it back - which can be hard without good records.

**Reimbursements:** If you used separate property money for community expenses (like a down payment on the marital home), you might be entitled to get that back.

**Pensions/401ks:** The portion earned during marriage is community property, even if it's in one spouse's name.`,
    steps: `What you need to do:

1. **Make a list** of everything you own and owe
2. **Figure out when you got it** - before or during marriage?
3. **Gather documentation** - deeds, account statements, loan documents
4. **Get valuations** - for houses, businesses, valuable items
5. **Consider reimbursements** - did separate money pay for community things?

For the house:
• Get it appraised
• Figure out the equity (value minus mortgage)
• Decide if someone's keeping it (needs to buy out the other) or selling
• If keeping it, you'll need to refinance to remove the other person's name`,
    mistakes: `Avoid these:
• Hiding assets (it's illegal and will hurt you if discovered)
• Not getting things properly valued
• Forgetting about retirement accounts
• Not considering tax consequences of dividing things
• Letting emotions drive decisions about the house`,
  },
  
  domesticViolence: {
    intro: `First, I need to say this clearly: If you're in immediate danger, please call 911 right now. Your safety is the most important thing. If you're not in immediate danger but are experiencing abuse, I'm here to help you understand your options.`,
    law: `California's Domestic Violence Prevention Act (Family Code § 6200+) defines abuse broadly. It's not just physical violence. Abuse includes:

**Physical abuse:** Hitting, kicking, pushing, slapping, throwing things

**Sexual assault:** Any non-consensual sexual contact

**Threats:** Making you afraid for your safety or your children's safety

**Harassment:** Following you, stalking, repeated unwanted contact

**Destruction of property:** Breaking your things to intimidate you

**Coercive control:** Isolating you from friends/family, controlling your money, tracking your movements

**Molesting, attacking, striking, stalking, threatening, harassing** - all qualify under the law`,
    practical: `Here's what you can actually do to protect yourself:

**Emergency Protective Order (EPO):**
• Police can get this for you immediately when they respond to a call
• Lasts 5-7 days
• Gives you time to file for a longer order

**Temporary Restraining Order (TRO):**
• You file this yourself at family court
• Lasts until your court hearing (usually 21-25 days)
• Can include stay-away orders, move-out orders, custody provisions

**Permanent Restraining Order:**
• After a court hearing where both sides present evidence
• Can last up to 5 years, renewable
• Violating it is a crime - they can be arrested`,
    steps: `Here's exactly what to do:

**If you're in immediate danger:**
1. Call 911
2. Get to a safe place - friend's house, family, shelter
3. If you have kids, take them with you

**To file for a restraining order:**
1. Go to your local family court (or superior court)
2. Ask for the Domestic Violence restraining order forms
3. Fill out Form DV-100 (Request for DV Restraining Order)
4. Describe specific incidents with dates if possible
5. File the forms (no filing fee for DV cases)
6. Get a court date
7. Have the abuser served (court can help with this)
8. Attend your hearing

**What a restraining order can do:**
• Order them to stay away from you, your home, work, kids' school
• Order them to move out of your shared home
• Give you temporary custody of kids
• Order them to pay child/spousal support
• Order them to attend batterer intervention program
• Prohibit them from owning firearms

**Evidence to gather:**
• Photos of injuries
• Medical records
• Police reports
• Text messages, emails, voicemails
• Witness statements
• Journal of incidents (dates, what happened)`,
    mistakes: `Things to avoid:
• Waiting too long to get help - it often gets worse, not better
• Not documenting incidents - hard to prove without evidence
• Letting them convince you to drop the order - this is a common manipulation tactic
• Violating the order yourself - it works both ways
• Not having a safety plan for when the order expires`,
  },
};

export const CASE_LAW_DATABASE: CaseLaw[] = [
  {
    citation: 'In re Marriage of Lucas (1980) 27 Cal.3d 808',
    title: 'Community Property Presumption',
    summary: 'Established that property acquired during marriage is presumed community property.',
    keyPoints: [
      'Property acquired during marriage is presumed community property',
      'The presumption can be rebutted by tracing to a separate property source',
      'Title alone does not determine property character',
    ],
  },
  {
    citation: 'In re Marriage of Bonds (2000) 24 Cal.4th 1',
    title: 'Separate Property Contributions',
    summary: 'Addressed reimbursement for separate property contributions to community property.',
    keyPoints: [
      'Separate property contributions to community property are reimbursable',
      'Interest may be awarded on the reimbursement',
      'Tracing requirements must be met',
    ],
  },
  {
    citation: 'In re Marriage of Brown (1976) 15 Cal.3d 838',
    title: 'Professional Licenses as Community Property',
    summary: 'Professional licenses and degrees may be considered community property.',
    keyPoints: [
      'Community may be entitled to reimbursement for education expenses',
      'Enhanced earning capacity may be considered',
      'Requires analysis of community contributions to education',
    ],
  },
  {
    citation: 'In re Marriage of Ackerman (2006) 146 Cal.App.4th 191',
    title: 'Spousal Support Factors',
    summary: 'Comprehensive analysis of Family Code § 4320 factors for spousal support.',
    keyPoints: [
      'Court must consider all § 4320 factors',
      'Marital standard of living is a key consideration',
      'Duration of marriage affects support length',
    ],
  },
  {
    citation: 'In re Marriage of Smith (1990) 225 Cal.App.3d 469',
    title: 'Child Custody Best Interests',
    summary: 'Best interests of the child standard in custody determinations.',
    keyPoints: [
      'Child\'s best interests are paramount',
      'Frequent and continuing contact with both parents is preferred',
      'Court considers health, safety, and welfare of child',
    ],
  },
  {
    citation: 'In re Marriage of Burgess (1996) 13 Cal.4th 25',
    title: 'Move-Away Cases',
    summary: 'Parental relocation and its impact on custody arrangements.',
    keyPoints: [
      'Custodial parent has presumptive right to relocate',
      'Non-custodial parent must show detriment to child',
      'Best interests analysis applies if detriment is shown',
    ],
  },
  {
    citation: 'Rodriguez v. Rodriguez (1988) 197 Cal.App.3d 547',
    title: 'Domestic Violence and Custody',
    summary: 'Impact of domestic violence on child custody determinations.',
    keyPoints: [
      'Domestic violence creates rebuttable presumption against custody',
      'Courts must consider history of abuse',
      'Child\'s safety is primary concern',
    ],
  },
  {
    citation: 'In re Marriage of Nadkarni (2020) 55 Cal.App.5th 262',
    title: 'Domestic Violence Restraining Orders',
    summary: 'Standards for issuing domestic violence restraining orders.',
    keyPoints: [
      'Abuse includes physical harm, fear, and harassment',
      'Preponderance of evidence standard applies',
      'Orders can include stay-away and no-contact provisions',
    ],
  },
  {
    citation: 'In re Marriage of Davis (2015) 61 Cal.4th 846',
    title: 'Date of Separation',
    summary: 'Determination of date of separation for property division.',
    keyPoints: [
      'Separation requires living apart and intent to end marriage',
      'Date affects character of property and earnings',
      'Physical separation alone is not sufficient',
    ],
  },
  {
    citation: 'In re Marriage of Valli (2014) 58 Cal.4th 1396',
    title: 'Celebrity Goodwill',
    summary: 'Treatment of celebrity goodwill as community property.',
    keyPoints: [
      'Celebrity goodwill can be community property',
      'Requires analysis of community contributions to fame',
      'Valuation requires expert testimony',
    ],
  },
];

export function getRelevantCaseLaw(topic: string): CaseLaw[] {
  const searchTerms = topic.toLowerCase().split(' ');
  
  return CASE_LAW_DATABASE.filter(law => {
    const text = `${law.citation} ${law.title} ${law.summary}`.toLowerCase();
    return searchTerms.some(term => text.includes(term));
  }).slice(0, 2);
}

