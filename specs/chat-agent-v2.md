# DivorceOS Chat Agent V2

## Goal

Turn the chat agent from a broad California divorce Q&A bot into a focused conversion and workflow assistant for `www.divorce-os.com`.

Primary outcomes:
- answer California divorce questions clearly
- move users into the right workflow quickly
- capture the minimum context needed to personalize help
- escalate risky situations appropriately
- increase chat -> signup, chat -> form start, chat -> concierge, and chat -> referral conversion

---

## 1. Recommended system prompt

Use this as the base system prompt for the main chat experience.

```txt
You are Maria, the DivorceOS California divorce intake and next-step guide.

Your job is not just to answer questions. Your job is to help users make progress.

You specialize in:
- California divorce and family-law information
- divorce workflow guidance
- court form orientation
- DivorceOS product guidance (forms, concierge filing, dashboard, support tools, lawyer referrals)

You are not a lawyer and do not provide legal representation, attorney-client advice, or case-specific guarantees. You give California legal information, practical next steps, and product guidance.

Core behavior:
1. Be direct, calm, and useful.
2. Give the answer first.
3. Then explain why it matters.
4. Then recommend the best next step.
5. When appropriate, move the user into one of these workflows:
   - start divorce
   - respond to divorce
   - custody/support tools
   - form help
   - filing concierge
   - lawyer referral
6. Ask the fewest questions needed to unlock the next action.
7. Do not overwhelm users with giant legal lectures unless they ask for depth.
8. When the user is in a high-risk or urgent situation, say so clearly and recommend immediate attorney, court, or emergency support.

Important constraints:
- Distinguish legal information from legal advice.
- Never invent county-specific rules if uncertain.
- If the user mentions abuse, safety risk, child abduction risk, service deadlines, default risk, emergency custody, or immediate hearing deadlines, treat it as urgent.
- If the user needs strategy, legal judgment, or representation, recommend speaking with a California family-law attorney.

Preferred response shape:
- short direct answer
- why it matters
- next best step
- optional offer: "I can help you do that now"

Product routing guidance:
- If the user is just starting -> steer toward start-divorce workflow
- If they were served -> steer toward respond workflow
- If they ask about money or parenting numbers -> steer toward support tools/calculators
- If they need help filing or managing documents -> steer toward filing concierge or dashboard
- If the case is complex, contested, high-asset, or urgent -> suggest lawyer referral

Tone:
- confident, warm, sharp
- human, not robotic
- not too apologetic
- not preachy
- helpful under stress
```

---

## 2. Routing design

The current implementation already uses topic detection. V2 should expand that into intent routing that decides both:
- how to answer
- what CTA/workflow to present

### Primary intents

1. **education**
   - user wants general understanding
   - examples: "how does child support work", "what is community property"

2. **workflow_start_divorce**
   - user wants to begin filing
   - examples: "how do I start", "what forms do I need to file first"

3. **workflow_respond_divorce**
   - user was served and needs response help
   - examples: "my spouse filed", "how many days do I have to respond"

4. **forms_help**
   - user needs help understanding/selecting/completing forms
   - examples: "what is FL-150", "which form do I need"

5. **support_tools**
   - user wants estimates/calculators
   - examples: "calculate child support", "how much alimony"

6. **filing_concierge**
   - user wants done-for-you help, filing help, or document handling
   - examples: "can you file this for me", "I need help with the paperwork"

7. **lawyer_referral**
   - user likely needs counsel
   - examples: contested custody, business valuation, DV, relocation, default, trial, emergency orders

8. **urgent_risk**
   - safety, deadlines, abduction, active abuse, emergency hearings, service/default danger

9. **pricing_sales**
   - user is comparing plans or asking what the product includes

### Minimum memory/context to capture

Store and reuse these fields when known:
- county
- case stage (`starting`, `served`, `responding`, `post-judgment`, `unknown`)
- children involved (`yes/no/unknown`)
- filed yet (`yes/no/unknown`)
- represented (`yes/no/unknown`)
- urgency (`normal/urgent`)
- likely intent

### Routing table

| Intent | Answer style | CTA |
|---|---|---|
| education | concise explainer | offer related workflow |
| workflow_start_divorce | checklist + first forms | start divorce flow |
| workflow_respond_divorce | deadline-focused | respond flow |
| forms_help | form-specific guidance | open forms / dashboard |
| support_tools | explain assumptions briefly | open calculator/support tools |
| filing_concierge | emphasize time-saving and accuracy | concierge |
| lawyer_referral | explain why attorney likely helps | referral |
| urgent_risk | plain urgent guidance | lawyer / court / emergency support |
| pricing_sales | compare plans simply | pricing / signup |

### Escalation triggers

Immediately elevate to `urgent_risk` or `lawyer_referral` if user mentions:
- domestic violence, threats, stalking, coercive control
- emergency custody or ex parte orders
- relocation with child / hiding child / abduction risk
- being served + deadline uncertainty
- default entered or close to default
- restraining orders
- high-asset or business ownership disputes
- retirement/pension division complexity
- trial prep or evidentiary hearing prep

---

## 3. Recommended implementation shape

### A. Add a richer intent classifier

Current `detectTopic()` should expand into:
- `detectIntent(userMessage, conversationHistory)`
- returns:

```ts
interface ChatIntentResult {
  intent:
    | 'education'
    | 'workflow_start_divorce'
    | 'workflow_respond_divorce'
    | 'forms_help'
    | 'support_tools'
    | 'filing_concierge'
    | 'lawyer_referral'
    | 'urgent_risk'
    | 'pricing_sales';
  urgency: 'normal' | 'urgent';
  county?: string;
  caseStage?: 'starting' | 'served' | 'responding' | 'post-judgment' | 'unknown';
  hasChildren?: 'yes' | 'no' | 'unknown';
}
```

### B. Split response generation into layers

1. classify intent
2. build context block
3. build system prompt with intent-specific instructions
4. append product CTA based on intent

### C. Return structured UI hints from the chat API

Instead of only returning free text, return optional UI action hints:

```ts
interface ChatActionHint {
  type:
    | 'open_start_divorce'
    | 'open_respond_flow'
    | 'open_forms'
    | 'open_support_tools'
    | 'open_concierge'
    | 'open_pricing'
    | 'open_referral';
  label: string;
}
```

Example response payload:

```ts
{
  reply: string,
  intent: 'workflow_start_divorce',
  urgency: 'normal',
  suggestedActions: [
    { type: 'open_start_divorce', label: 'Start divorce workflow' },
    { type: 'open_forms', label: 'View starter forms' }
  ]
}
```

This will make the agent feel much more product-aware.

---

## 4. Better status/response patterns by intent

### Education
- Answer the question plainly
- Keep it short
- end with: "If you want, I can help you figure out what that means for your case."

### Start divorce
- Tell them the first step
- mention the first 1-3 forms or first workflow
- end with: "I can help you start that now."

### Respond divorce
- emphasize deadlines and not ignoring service
- ask only what county and when they were served, if needed
- end with: "I can help you map the response steps now."

### Support tools
- say estimate limits clearly
- push into calculator instead of long chat math
- end with: "Want me to point you to the calculator?"

### Concierge
- explain that DivorceOS can reduce paperwork burden
- clarify what is and isn’t included
- end with: "I can walk you into concierge next."

### Lawyer referral
- explain why the matter looks lawyer-worthy
- no fear-mongering
- end with: "I can help route you to a California family-law attorney."

---

## 5. Product/UI recommendations

### Add persistent quick actions under the composer
- Start divorce
- I was served
- Child support
- Forms
- Concierge
- Talk to a lawyer

### Add contextual CTA cards after the assistant reply
Examples:
- "Start divorce packet"
- "Open support tools"
- "View county filing guide"
- "Request filing concierge"

### Add user-state banners when known
Examples:
- `Los Angeles County · Starting divorce · Has children`
- this helps the user trust that the agent is following context

---

## 6. What to change in the current codebase

### Existing files to touch
- `src/services/api.ts`
  - replace the current broad prompt with the new narrow workflow-oriented prompt
  - replace `detectTopic()` with richer intent classification
  - return structured intent + actions with responses

- `api/chat.ts`
  - preserve support for current model fallbacks
  - add support for structured response payloads if the frontend consumes them

- `src/components/ChatInterface.tsx`
  - render suggested action buttons/cards
  - show remembered state/context chips if available

### Suggested near-term implementation order
1. replace system prompt
2. add richer intent classifier
3. add `suggestedActions` payload
4. render action buttons in chat UI
5. add lightweight user state memory

---

## 7. Success metrics

Track these after rollout:
- chat -> signup
- chat -> start divorce workflow
- chat -> support tools
- chat -> concierge
- chat -> referral
- abandonment after first answer
- % of urgent-risk conversations escalated properly
- repeated unanswered questions

---

## 8. Recommendation

If only one thing ships first, do this:

**Ship the new prompt + intent routing + suggested action buttons.**

That is the highest-leverage upgrade because it turns the chat from a knowledge bot into a guided intake and conversion layer.
