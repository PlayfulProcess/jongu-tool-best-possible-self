# Recursive Processing - Implementation Plan

## Vision

**Recursive Processing** is a journaling-centric self-development tool where the user processes their thoughts, questions, and experiences through reflective writing. The app provides optional oracular tools (I Ching, Tarot) and AI assistance to support - but never replace - the user's own meaning-making process.

### Core Design Principle
> "The real value is for the user to spend time digesting questions and answers and processing them through writing."

**Journaling is the center. Oracles and AI are helpers.**

---

## Current State Analysis

### Main Branch (Best Possible Self)
A mature journaling app with:
- Next.js 15 + React 19 + TypeScript + Tailwind
- Supabase for auth & data persistence
- OpenAI integration (GPT-4o-mini) as "empathy buddy"
- Template system for different journaling prompts
- AI chat panel that understands journal context
- Timer, focus mode, sidebar with past entries
- Credits/payment system via Stripe

### I Ching Branch (claude/iching-reader-transform)
Complete I Ching implementation:
- 64 hexagrams in JSON with full texts
- Three-coin casting method with changing lines
- Transformation hexagram calculation
- AI prompts that feed reading context to assistant
- UI components: CoinCastingAnimation, HexagramDisplay, ReadingInterpretation
- Integration with journal content for AI interpretation

---

## Architecture: Unified Journal with Oracle Helpers

### User Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        RECURSIVE PROCESSING                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    JOURNAL TEXTAREA                            │   │
│  │                                                                │   │
│  │  User writes freely about their question, situation,          │   │
│  │  or topic they want to explore...                              │   │
│  │                                                                │   │
│  │  [The journal is ALWAYS visible and primary]                  │   │
│  │                                                                │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐                       │
│  │   AI       │ │  I Ching   │ │  Tarot     │ ← Helper buttons     │
│  │   Help     │ │  Oracle    │ │  (future)  │                       │
│  └────────────┘ └────────────┘ └────────────┘                       │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    HELPER PANEL                                │   │
│  │  (Collapsible - shows AI chat, I Ching reading, or Tarot)     │   │
│  │                                                                │   │
│  │  AI sees: journal content + any active oracle reading         │   │
│  │                                                                │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Model

```typescript
interface RecursiveSession {
  id: string
  user_id: string

  // Core journaling
  title: string | null
  journal_content: string
  template_snapshot?: TemplateSnapshot

  // Optional oracle readings (attached to this journal session)
  iching_reading?: {
    question: string
    reading: HexagramReadingData
    cast_at: Date
  }
  tarot_reading?: {
    question: string
    cards: TarotCard[]
    spread: 'three-card' | 'celtic-cross'
    cast_at: Date
  }

  // AI conversations
  chat_messages: ChatMessage[]

  // Metadata
  research_consent: boolean
  is_public: boolean
  created_at: Date
  updated_at: Date
}
```

### AI Context Awareness

The AI assistant receives a unified system prompt that includes:
1. **Journal content** (always available)
2. **I Ching reading** (if cast for this session)
3. **Tarot reading** (future: if drawn for this session)
4. **Session context** (template type, user's focus area)

```typescript
function buildUnifiedSystemPrompt(session: RecursiveSession): string {
  let prompt = BASE_EMPATHY_BUDDY_PROMPT;

  prompt += `\n\nUSER'S JOURNAL:\n${session.journal_content || '(Empty)'}`;

  if (session.iching_reading) {
    prompt += `\n\n${buildIChingContext(session.iching_reading)}`;
  }

  if (session.tarot_reading) {
    prompt += `\n\n${buildTarotContext(session.tarot_reading)}`;
  }

  return prompt;
}
```

---

## Implementation Phases

### Phase 1: Foundation (This Session)
**Goal: Working journal app with I Ching integration**

1. **Clone main branch to current working branch**
   - Remove Best Possible Self specific branding
   - Generalize to "Recursive Processing"
   - Keep all core infrastructure (auth, templates, AI)

2. **Copy I Ching assets from iching-reader branch**
   - `public/data/iching-hexagrams.json`
   - `src/lib/iching.ts` (casting logic)
   - `src/lib/hexagram-lookup.ts`
   - `src/lib/iching-ai-prompt.ts` (modified for integration)
   - `src/types/iching.types.ts`
   - `src/components/iching/` (all components)

3. **Modify main page to add I Ching button**
   - Add "Cast I Ching" button alongside AI button
   - Modal/sidebar workflow for casting
   - Display reading below/beside journal

4. **Wire AI to receive I Ching context**
   - Modify `/api/ai/chat/route.ts` to accept oracle data
   - Build unified prompt that includes reading + journal
   - AI can reference hexagram meaning in responses

### Phase 2: Polish & UX (Next Session)
1. Persist I Ching readings with journal entries
2. Display reading summary in entry sidebar
3. Allow re-casting or clearing reading
4. Mobile-responsive oracle UI

### Phase 3: Tarot Integration (Future)
1. Rider-Waite deck JSON (78 cards)
2. Three-card spread logic
3. Card display component
4. AI prompt builder for tarot context

### Phase 4: RAG Deep Interpretation (Future)
1. Evaluate Gemini File Search vs OpenAI Assistants
2. Upload original I Ching texts (Chinese + translations)
3. "Deep Interpretation" button triggers RAG query
4. Display scholarly context alongside simplified reading

---

## File Structure (After Phase 1)

```
src/
├── app/
│   ├── page.tsx                    # Main journal + oracle page
│   ├── layout.tsx
│   └── api/
│       ├── ai/
│       │   └── chat/route.ts       # Modified to accept oracle context
│       └── templates/route.ts
├── components/
│   ├── AIAssistant.tsx             # Existing AI panel
│   ├── IChingOracle.tsx            # NEW: I Ching button + modal
│   ├── iching/                     # Copied from iching branch
│   │   ├── CoinCastingAnimation.tsx
│   │   ├── HexagramDisplay.tsx
│   │   ├── QuestionInput.tsx
│   │   ├── ReadingInterpretation.tsx
│   │   └── index.ts
│   ├── TemplateSelector.tsx
│   ├── Timer.tsx
│   └── ...other components
├── lib/
│   ├── iching.ts                   # Copied from iching branch
│   ├── hexagram-lookup.ts          # Copied
│   ├── iching-ai-prompt.ts         # Copied + modified
│   ├── unified-ai-prompt.ts        # NEW: combines journal + oracles
│   ├── supabase-client.ts
│   └── supabase-server.ts
├── types/
│   ├── iching.types.ts             # Copied
│   └── database.types.ts
public/
├── data/
│   └── iching-hexagrams.json       # Copied from iching branch
```

---

## Key Technical Decisions

### 1. Oracle Readings as Optional Attachments
- A journal entry can exist without any oracle reading
- User can cast I Ching at any point during journaling
- Reading is "attached" to the session, not a separate document

### 2. AI Always Has Full Context
- System prompt includes: journal content + active oracle readings
- User doesn't need to manually explain the reading to AI
- AI can proactively reference hexagram meaning

### 3. Single-Page Experience
- Journal stays visible at all times
- Oracles appear as expandable panels or modals
- No navigation away from the writing surface

### 4. API Flexibility for Future RAG
- AI endpoint accepts generic "context" object
- Easy to add Gemini adapter alongside OpenAI
- Oracle data structure is provider-agnostic

---

## Implementation Checklist (Phase 1)

### Step 1: Prepare Branch
- [x] Branch already exists: `claude/create-recursive-processing-app-yXZlK`
- [ ] Fetch latest from main
- [ ] Reset branch to main (start fresh)

### Step 2: Copy I Ching Files
- [ ] Copy `public/data/iching-hexagrams.json`
- [ ] Copy `src/types/iching.types.ts`
- [ ] Copy `src/lib/iching.ts`
- [ ] Copy `src/lib/hexagram-lookup.ts`
- [ ] Copy `src/lib/iching-ai-prompt.ts`
- [ ] Copy `src/components/iching/` directory

### Step 3: Create I Ching Oracle Component
- [ ] Create `src/components/IChingOracle.tsx`
  - Button to trigger I Ching modal
  - Modal with question input
  - Coin casting animation
  - Reading display
  - Pass reading back to parent

### Step 4: Modify Main Page
- [ ] Add I Ching button alongside AI button
- [ ] Add state for current I Ching reading
- [ ] Display reading in collapsible panel
- [ ] Pass reading to AIAssistant component

### Step 5: Wire AI Context
- [ ] Create `src/lib/unified-ai-prompt.ts`
- [ ] Modify AIAssistant to accept oracle reading prop
- [ ] Modify `/api/ai/chat/route.ts` to include oracle context
- [ ] Test that AI can reference hexagram in responses

### Step 6: Clean Up & Rebrand
- [ ] Update app name in layout.tsx
- [ ] Update page titles
- [ ] Remove "Best Possible Self" specific copy
- [ ] Test full flow: journal → cast I Ching → AI discusses reading

---

## Future Considerations

### Gemini RAG Integration
Per the user's Gemini exploration, the future architecture for deep interpretation:

```python
# Future: Gemini File Search for I Ching deep interpretation
from google import genai

client = genai.Client(api_key="YOUR_API_KEY")

# One-time setup: upload source texts
store = client.file_search_stores.create(display_name="I-Ching-Sources")
client.file_search_stores.upload_to_file_search_store(
    file_search_store_name=store.name,
    file='path/to/iching_original_texts.pdf'
)

# Runtime: deep interpretation with RAG
response = client.models.generate_content(
    model="gemini-2.0-flash",
    contents=f"""
    User's question: {question}
    Current simplified interpretation: {json_interpretation}

    Based on the original source texts, provide deeper spiritual meaning for Hexagram {number}.
    """,
    config={'tools': [{'file_search': {'file_search_stores': [store.name]}}]}
)
```

This would add a "Deep Dive" button that triggers RAG-enhanced interpretation while keeping the current simplified reading as the default.

---

## Summary

This plan creates a **journal-first** app where writing is the core activity. I Ching (and later Tarot) serve as optional tools to stimulate reflection, and AI helps interpret both the user's writing and any oracle readings together. The architecture supports future RAG integration for scholarly depth while keeping the initial implementation focused and achievable.

**Next Steps:** Implement Phase 1 by copying I Ching assets and integrating them into the main journal page.
