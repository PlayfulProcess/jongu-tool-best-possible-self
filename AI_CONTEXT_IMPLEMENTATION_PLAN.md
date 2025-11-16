# AI Context Implementation Plan

**Date:** 2025-01-15
**Purpose:** Improve AI conversation memory and prepare for flexible tool/tarot integration
**Status:** Planning Phase

---

## 📊 Current State Analysis

### How AI Context Currently Works

**Request Flow:**
```
User Message → AIAssistant.tsx → /api/ai/chat → OpenAI
```

**What Gets Sent (src/app/api/ai/chat/route.ts):**
```javascript
// Line 37: Receives from frontend
const { message, content } = await request.json();

// Lines 115-123: Sends to OpenAI
messages: [
  { role: 'system', content: systemPrompt },  // Includes journal content
  { role: 'user', content: message }          // ONLY current question
]
```

### ❌ Current Limitations

1. **NO conversation memory** - Each message is independent
2. **NO chat history** - AI doesn't remember previous exchanges
3. **Fixed prompt** - Same prompt for all tools/exercises
4. **Messages ARE saved** to database but NOT sent to AI
5. **Max tokens = 500** - Limits AI response length, NOT input length (full history will go through)

### 💰 Cost Implications

**Current cost:** ~$0.0001-0.0003 per message (no history)
**With full history (10 messages):** ~$0.0005-0.0008 per message

**Decision:** Prioritize quality over cost - implement full history. Consider summarization later if costs become an issue.

---

## 🎯 Implementation Plan

### **Phase 1: Add Conversation History & Dynamic Prompts**

**Goal:** Give AI full conversation memory + flexible prompt system for different tools

**Timeline:** 1-2 weeks
**Priority:** HIGH

#### Changes Required

##### 1. Update Base AI Prompt (route.ts)

**File:** `src/app/api/ai/chat/route.ts`
**Lines:** 97-113

**Current (Berkeley/BPS specific):**
```javascript
const systemPrompt = `You are a positive psychology coach and mentor specializing in the "Best Possible Self" exercise...`;
```

**New (Compassionate empathy buddy):**
```javascript
function buildSystemPrompt(content: any): string {
  const basePersonality = `You are a compassionate empathy buddy with a thorough understanding of psychology, mythology, religion, and sociology. You provide:

- **Validation** (DBT principle): Acknowledge and validate the user's feelings and experiences
- **Empathy**: Listen deeply and respond with genuine care
- **Insight**: Draw from psychology, mythology, and spiritual wisdom
- **Support**: Help users process emotions and gain clarity

IMPORTANT:
- Always validate feelings first before offering perspectives
- Format responses with clear paragraph breaks for readability
- Be warm, insightful, and non-judgmental
- Ask thoughtful questions that promote self-reflection`;

  // Get dynamic prompt based on tool/exercise type
  const toolPrompt = getToolPrompt(content.tool_type);

  // Add context (journal, tarot, etc.)
  const contextPrompt = buildContextPrompt(content);

  return `${basePersonality}\n\n${toolPrompt}\n\n${contextPrompt}`;
}
```

##### 2. Dynamic Tool-Specific Prompts

**Add new function in route.ts:**

```javascript
function getToolPrompt(toolType: string): string {
  const prompts = {
    'best-possible-self': `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EXERCISE: Best Possible Self
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This is an evidence-based practice focused on envisioning one's most authentic, fulfilled future self.

Your role:
- Guide deep self-reflection about values and aspirations
- Help explore strengths, passions, and potential
- Connect current actions with future vision
- Encourage optimistic yet realistic thinking
- Support authentic self-discovery`,

    'daily-reflection': `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EXERCISE: Daily Reflection
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

A mindfulness practice for processing the day's experiences.

Your role:
- Help identify patterns and insights from daily events
- Validate emotions and reactions
- Encourage self-compassion
- Support learning and growth from experiences
- Foster present-moment awareness`,

    'tarot-reading': `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EXERCISE: Tarot Reading
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Archetypal wisdom through symbolic card interpretation.

Your role:
- Interpret cards through psychological and mythological lenses
- Connect symbolism to the user's personal journey
- Respect the spiritual/reflective nature of the practice
- Provide insight without being prescriptive
- Honor the user's intuition and interpretation`,

    'gratitude-journal': `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EXERCISE: Gratitude Practice
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Cultivating appreciation and positive psychology.

Your role:
- Deepen awareness of blessings and positive aspects
- Help notice small moments of beauty
- Support cultivating contentment
- Validate both gratitude and struggle
- Foster balanced perspective`,

    // Default fallback
    'default': `
Your role is to be a supportive companion for self-reflection and personal growth.`
  };

  return prompts[toolType] || prompts['default'];
}
```

##### 3. Build Context Based on Content Type

```javascript
function buildContextPrompt(content: any): string {
  if (content.type === 'journal') {
    return `
Current Journal Entry:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"${content.data || 'The user is beginning their reflection...'}"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
  }

  if (content.type === 'tarot') {
    return buildTarotContext(content.data);
  }

  return '';
}

function buildTarotContext(tarotData: any): string {
  const { deck_name, spread_name, question, cards } = tarotData;

  return `
Tarot Reading Context:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Deck: ${deck_name}
Spread: ${spread_name}
Question: "${question}"

Cards Drawn:
${cards.map((card: any, i: number) => `
Position ${i + 1}: ${card.position_name}
Card: ${card.name} ${card.reversed ? '(Reversed)' : ''}

${JSON.stringify(card.data, null, 2)}
`).join('\n─────────────────────────────────────────────\n')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Interpret these cards with wisdom, connecting them to the user's question and journey.`;
}
```

##### 4. Frontend: Send Chat History & Tool Type

**File:** `src/components/AIAssistant.tsx`
**Line:** ~380

**Update request:**
```javascript
const response = await fetch('/api/ai/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: input,
    content: {
      type: 'journal',  // or 'tarot'
      tool_type: 'best-possible-self',  // Dynamic from props/context
      data: content
    },
    history: messages  // Full conversation history
  }),
});
```

##### 5. API: Accept History & Tool Type

**File:** `src/app/api/ai/chat/route.ts`
**Line:** 37

```javascript
const { message, content, history = [] } = await request.json();

// Build dynamic system prompt
const systemPrompt = buildSystemPrompt(content);

// Use history in OpenAI call
const response = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [
    { role: 'system', content: systemPrompt },
    ...history,  // Include full conversation history
    { role: 'user', content: message }
  ],
  max_tokens: 500,  // Limits AI response, not input
  temperature: 0.7,
});
```

#### Token Limits: Should We Change Them?

**Current:** `max_tokens: 500` means AI responses are limited to ~375 words

**Options:**
1. **Keep at 500** - Concise, focused responses (cheaper)
2. **Increase to 800** - More detailed responses (moderate cost)
3. **Increase to 1500** - Very detailed responses (higher cost)
4. **Dynamic based on context** - Tarot gets more tokens, daily reflection gets less

**Recommendation:** Start with 500, increase to 800 if users need more detail.

**Summarization:** Only implement if:
- Conversations regularly exceed 15+ messages
- Costs become concerning (>$0.01 per message)
- User reports slow responses

---

### **Phase 2: Tarot Reading System (Simplified)**

**Goal:** Enable tarot readings with flexible card data structure

**Timeline:** 2-3 weeks
**Priority:** MEDIUM

#### Simplified Database Schema

```sql
-- Tarot Decks (minimal structure)
CREATE TABLE public.tarot_decks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Tarot Cards (flexible JSON structure)
CREATE TABLE public.tarot_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id uuid REFERENCES tarot_decks(id) ON DELETE CASCADE,
  name text NOT NULL,
  card_data jsonb NOT NULL,  -- Flexible structure, AI gets all context
  image_url text,
  created_at timestamptz DEFAULT now()
);

-- Tarot Spreads (position definitions)
CREATE TABLE public.tarot_spreads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  positions jsonb NOT NULL,  -- [{"name": "Past", "meaning": "..."}, ...]
  created_at timestamptz DEFAULT now()
);

-- User Readings (saved sessions)
CREATE TABLE public.user_tarot_readings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  deck_id uuid REFERENCES tarot_decks(id),
  spread_id uuid REFERENCES tarot_spreads(id),
  question text,
  cards_drawn jsonb NOT NULL,  -- [{card_id, position, reversed}, ...]
  created_at timestamptz DEFAULT now()
);
```

#### Example Card Data Structure

```json
{
  "card_id": "uuid-here",
  "name": "The Fool",
  "position_name": "Present",
  "reversed": false,
  "data": {
    "keywords": ["new beginnings", "innocence", "spontaneity"],
    "upright_meaning": "New beginnings and taking a leap of faith...",
    "reversed_meaning": "Recklessness and not looking before you leap...",
    "mythology": "The Fool is the eternal wanderer...",
    "psychology": "Represents the archetypal Child and beginner's mind...",
    "numerology": "Number 0, the void of potential...",
    "astrology": "Associated with Uranus and air element...",
    "symbolism": {
      "dog": "Loyalty and protection",
      "cliff": "Unknown future",
      "sun": "Optimism and vitality"
    },
    "questions": [
      "Where in your life are you being called to take a leap?",
      "What would happen if you trusted the process?"
    ],
    "affirmations": [
      "I trust in the journey ahead",
      "I embrace new beginnings with an open heart"
    ]
  }
}
```

**Key insight:** AI receives the ENTIRE `card_data` JSON. It can work with whatever fields are present - simple or complex. This allows flexibility in card definitions.

#### Frontend Flow

```typescript
// 1. User selects deck & spread from database
const deck = await fetchDeck('rider-waite');
const spread = await fetchSpread('three-card');

// 2. Draw random cards
const drawnCards = drawRandomCards(deck.id, spread.positions.length);

// 3. Send to AI with full context
const tarotContext = {
  type: 'tarot',
  tool_type: 'tarot-reading',
  data: {
    deck_name: deck.name,
    spread_name: spread.name,
    question: userQuestion,
    cards: drawnCards.map((card, i) => ({
      position_name: spread.positions[i].name,
      name: card.name,
      reversed: Math.random() > 0.7,  // 30% chance reversed
      data: card.card_data  // Full flexible JSON
    }))
  }
};
```

---

## 📝 Testing Strategy

### Phase 1 Testing

- [ ] AI remembers information from earlier messages
- [ ] Different tool types get appropriate prompts
- [ ] AI validates feelings (DBT principle)
- [ ] Responses are empathetic and insightful
- [ ] 500 token limit feels appropriate (or needs adjustment)
- [ ] Cost per message acceptable (<$0.001)

### Phase 2 Testing

- [ ] Cards load with flexible JSON structure
- [ ] AI interprets cards regardless of data fields
- [ ] Spreads display correctly
- [ ] Readings feel insightful and personal
- [ ] Users find value in tarot interpretations

---

## 🚀 Next Steps

1. **Review this plan** - Confirm approach and priorities
2. **Implement Phase 1** - Add history + dynamic prompts
3. **Test with users** - Gather feedback on AI quality
4. **Adjust token limits** if needed (500 → 800?)
5. **Design tarot UI** - Deck selector, card drawing interface
6. **Implement Phase 2** - Tarot database + readings

---

## 💡 Future Considerations

### When to Add Summarization
- If conversations regularly exceed 20 messages
- If cost per conversation exceeds $0.01
- If response times slow down

### Summarization Approach (if needed)
```javascript
// Keep last 6 messages in full
// Summarize older messages into 200 tokens
const recentMessages = history.slice(-6);
const olderMessages = history.slice(0, -6);

if (olderMessages.length > 0) {
  const summary = await generateSummary(olderMessages);
  messagesArray.push({ role: 'system', content: `Earlier conversation: ${summary}` });
}
```

---

**Location:** `jongu-tool-best-possible-self/AI_CONTEXT_IMPLEMENTATION_PLAN.md`
**Last Updated:** 2025-01-15
