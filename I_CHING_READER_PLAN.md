# I Ching Reader Transformation Plan

## Overview

Transform the current "Best Possible Self" journaling app into an **I Ching Reader** that:
1. Allows users to ask a question for the oracle
2. Simulates the traditional 3-coin casting method (6 times for 6 lines)
3. Generates a hexagram with identification of changing/mutable lines
4. Looks up hexagram interpretations from a CSV data file
5. If there are changing lines, shows the "transformed" hexagram as well
6. Allows users to journal about their reading and discuss it with AI
7. Provides AI with full context: question, hexagram, lines, interpretations, and journal

---

## Part 1: I Ching Mechanics & Data

### 1.1 Three-Coin Method Simulation

The traditional three-coin method works as follows:
- Throw 3 coins 6 times (once for each line, bottom to top)
- Each coin has two sides: Heads (value 3) and Tails (value 2)
- Sum of 3 coins gives: 6, 7, 8, or 9

| Sum | Line Type | Symbol | Changing? |
|-----|-----------|--------|-----------|
| 6   | Old Yin   | ---x---| Yes (becomes Yang) |
| 7   | Young Yang| ———   | No |
| 8   | Young Yin | --- ---| No |
| 9   | Old Yang  | ———o———| Yes (becomes Yin) |

**Implementation: Python Script or TypeScript Function**

```typescript
// src/lib/iching.ts

interface CoinToss {
  coins: [boolean, boolean, boolean]; // true = heads (3), false = tails (2)
  value: number; // 6, 7, 8, or 9
}

interface Line {
  value: number;        // 6, 7, 8, or 9
  type: 'yin' | 'yang';
  isChanging: boolean;
  coins: CoinToss;
}

interface HexagramReading {
  question: string;
  lines: Line[];           // 6 lines, index 0 = bottom
  primaryHexagram: number; // 1-64
  changingLines: number[]; // which lines (1-6) are changing
  transformedHexagram: number | null; // null if no changing lines
  timestamp: Date;
}

function tossCoin(): boolean {
  return Math.random() < 0.5; // true = heads, false = tails
}

function tossThreeCoins(): CoinToss {
  const coins: [boolean, boolean, boolean] = [
    tossCoin(),
    tossCoin(),
    tossCoin()
  ];
  const value = coins.reduce((sum, heads) => sum + (heads ? 3 : 2), 0);
  return { coins, value };
}

function getLineFromValue(value: number): { type: 'yin' | 'yang', isChanging: boolean } {
  switch (value) {
    case 6: return { type: 'yin', isChanging: true };   // Old Yin → Yang
    case 7: return { type: 'yang', isChanging: false }; // Young Yang
    case 8: return { type: 'yin', isChanging: false };  // Young Yin
    case 9: return { type: 'yang', isChanging: true };  // Old Yang → Yin
    default: throw new Error(`Invalid line value: ${value}`);
  }
}

function castHexagram(question: string): HexagramReading {
  const lines: Line[] = [];

  // Cast 6 lines (bottom to top)
  for (let i = 0; i < 6; i++) {
    const toss = tossThreeCoins();
    const { type, isChanging } = getLineFromValue(toss.value);
    lines.push({
      value: toss.value,
      type,
      isChanging,
      coins: toss
    });
  }

  const changingLines = lines
    .map((line, idx) => line.isChanging ? idx + 1 : null)
    .filter((n): n is number => n !== null);

  const primaryHexagram = calculateHexagramNumber(lines);
  const transformedHexagram = changingLines.length > 0
    ? calculateTransformedHexagram(lines)
    : null;

  return {
    question,
    lines,
    primaryHexagram,
    changingLines,
    transformedHexagram,
    timestamp: new Date()
  };
}
```

### 1.2 Hexagram Number Calculation

A hexagram is identified by its pattern of 6 lines. We need to map the binary pattern to hexagram numbers (1-64).

```typescript
// Binary representation: yang=1, yin=0, from bottom to top
function linesToBinary(lines: Line[]): string {
  return lines.map(l => l.type === 'yang' ? '1' : '0').join('');
}

// King Wen sequence mapping (traditional ordering)
const KING_WEN_SEQUENCE: Record<string, number> = {
  '111111': 1,  // ䷀ Qian (The Creative)
  '000000': 2,  // ䷁ Kun (The Receptive)
  // ... all 64 hexagrams
};

function calculateHexagramNumber(lines: Line[]): number {
  const binary = linesToBinary(lines);
  return KING_WEN_SEQUENCE[binary];
}

function calculateTransformedHexagram(lines: Line[]): number {
  const transformedLines = lines.map(line => ({
    ...line,
    type: line.isChanging
      ? (line.type === 'yin' ? 'yang' : 'yin')
      : line.type
  }));
  return calculateHexagramNumber(transformedLines);
}
```

### 1.3 CSV Data Structure

Create `/public/data/iching-hexagrams.csv`:

```csv
number,name_english,name_chinese,name_pinyin,trigram_upper,trigram_lower,judgment,image,line_1,line_2,line_3,line_4,line_5,line_6,overall_meaning
1,"The Creative","乾","Qián","Heaven","Heaven","The Creative works sublime success, furthering through perseverance.","Heaven moves in strength. The superior person makes themself strong and untiring.","Hidden dragon. Do not act.","Dragon appearing in the field. It furthers one to see the great person.","All day long the superior person is creatively active. At nightfall their mind is still beset with cares. Danger. No blame.","Wavering flight over the depths. No blame.","Flying dragon in the heavens. It furthers one to see the great person.","Arrogant dragon will have cause to repent.","Pure creative energy. Initiative, power, persistence. The dragon symbolizes transformation."
2,"The Receptive","坤","Kūn","Earth","Earth","The Receptive brings about sublime success, furthering through the perseverance of a mare...","The earth's condition is receptive devotion. The superior person who has breadth of character carries the outer world.","When there is hoarfrost underfoot, solid ice is not far off.","Straight, square, great. Without purpose, yet nothing remains unfurthered.","Hidden lines. One is able to remain persevering. If by chance you are in the service of a king, seek not works, but bring to completion.","A tied-up sack. No blame, no praise.","A yellow lower garment brings supreme good fortune.","Dragons fight in the meadow. Their blood is black and yellow.","Pure receptive energy. Devotion, yielding, nourishing, support."
...
```

**Alternative: JSON format** (easier to work with in TypeScript):

```json
// /public/data/iching-hexagrams.json
{
  "hexagrams": [
    {
      "number": 1,
      "name": {
        "english": "The Creative",
        "chinese": "乾",
        "pinyin": "Qián"
      },
      "trigrams": {
        "upper": "Heaven",
        "lower": "Heaven"
      },
      "unicode": "䷀",
      "judgment": "The Creative works sublime success...",
      "image": "Heaven moves in strength...",
      "lines": {
        "1": "Hidden dragon. Do not act.",
        "2": "Dragon appearing in the field...",
        "3": "All day long the superior person...",
        "4": "Wavering flight over the depths...",
        "5": "Flying dragon in the heavens...",
        "6": "Arrogant dragon will have cause to repent."
      },
      "overall_meaning": "Pure creative energy. Initiative, power, persistence."
    }
  ]
}
```

---

## Part 2: User Interface Changes

### 2.1 Main Page Flow (Replace Current Template System)

**Current Flow:**
1. Select template → Write journal → Talk to AI

**New Flow:**
1. Enter question for the I Ching
2. Cast hexagram (animated coin toss)
3. View reading (hexagram, changing lines, interpretations)
4. Journal about the reading
5. Discuss with AI (who has full context)

### 2.2 New Components to Create

#### Component: QuestionInput
```
src/components/iching/QuestionInput.tsx
```
- Text input for the user's question
- Guidance on how to formulate I Ching questions
- "Cast Hexagram" button
- Question saved to state and eventually database

#### Component: CoinCastingAnimation
```
src/components/iching/CoinCastingAnimation.tsx
```
- Visual animation of 3 coins being tossed
- Shows each coin landing (heads/tails)
- Builds hexagram line by line (bottom to top)
- Dramatic reveal effect

#### Component: HexagramDisplay
```
src/components/iching/HexagramDisplay.tsx
```
- Shows the hexagram visually (6 lines with proper symbols)
- Highlights changing lines (different color/animation)
- Shows hexagram name (Chinese, English, pinyin)
- Unicode symbol display (䷀, ䷁, etc.)

#### Component: ReadingInterpretation
```
src/components/iching/ReadingInterpretation.tsx
```
- Accordion/tabs for different sections:
  - **The Judgment** - Overall message
  - **The Image** - Symbolic meaning
  - **Changing Lines** - Only lines that are changing (if any)
  - **Overall Meaning** - Summary interpretation
- If there's a transformed hexagram, shows:
  - "Your reading transforms from X to Y"
  - Second hexagram interpretation

#### Component: ReadingJournal
```
src/components/iching/ReadingJournal.tsx
```
- Replaces the current journal textarea
- Pre-populated prompt: "Reflect on how this reading relates to your question..."
- Same rich editing features (character count, auto-save)
- Save button

#### Component: IChing AI Assistant (Modified)
```
src/components/iching/IChingAIAssistant.tsx
```
- Same chat interface as current AIAssistant
- Modified system prompt to include I Ching context
- AI has access to:
  - User's question
  - Primary hexagram & interpretation
  - Changing lines & their meanings
  - Transformed hexagram (if any)
  - User's journal reflection

### 2.3 Page Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Header: "I Ching Reader - 易經"                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Your Question:                                      │   │
│  │  ┌─────────────────────────────────────────────┐    │   │
│  │  │ "How should I approach this career change?" │    │   │
│  │  └─────────────────────────────────────────────┘    │   │
│  │                          [Cast Hexagram]            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────────┬──────────────────────────────┐   │
│  │                      │                              │   │
│  │   HEXAGRAM DISPLAY   │   INTERPRETATION PANEL       │   │
│  │                      │                              │   │
│  │      ━━━━━━━         │   ▼ The Judgment             │   │
│  │      ━━ ━━  (x)      │   ▼ The Image                │   │
│  │      ━━━━━━━         │   ▼ Changing Lines (2, 5)    │   │
│  │      ━━ ━━           │   ▼ Overall Meaning          │   │
│  │      ━━━━━━━ (o)     │   ▼ Transformation → Hex 44  │   │
│  │      ━━━━━━━         │                              │   │
│  │                      │                              │   │
│  │   #14 大有           │                              │   │
│  │   Possession in      │                              │   │
│  │   Great Measure      │                              │   │
│  │                      │                              │   │
│  └──────────────────────┴──────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Your Reflection:                                    │   │
│  │  ┌─────────────────────────────────────────────┐    │   │
│  │  │                                             │    │   │
│  │  │ Journal textarea...                         │    │   │
│  │  │                                             │    │   │
│  │  └─────────────────────────────────────────────┘    │   │
│  │                                       [Save Entry]  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  💬 AI Oracle Assistant                    [⛶]      │   │
│  │  ┌─────────────────────────────────────────────┐    │   │
│  │  │ Chat messages...                            │    │   │
│  │  │                                             │    │   │
│  │  │ User: What does line 2 mean for my         │    │   │
│  │  │       situation?                           │    │   │
│  │  │                                             │    │   │
│  │  │ AI: Line 2 in your reading speaks to...    │    │   │
│  │  └─────────────────────────────────────────────┘    │   │
│  │  ┌─────────────────────────────────────────────┐    │   │
│  │  │ Ask about your reading...                   │    │   │
│  │  └─────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Part 3: Data Model Changes

### 3.1 Database Schema Updates

**New table: `iching_readings`** (or use existing `user_documents` with new document_type)

Option A: Use existing `user_documents` table:
```typescript
// document_type: 'iching_reading'
// document_data structure:
{
  "question": "How should I approach this career change?",
  "reading": {
    "lines": [
      { "value": 7, "type": "yang", "isChanging": false },
      { "value": 6, "type": "yin", "isChanging": true },
      { "value": 8, "type": "yin", "isChanging": false },
      { "value": 7, "type": "yang", "isChanging": false },
      { "value": 9, "type": "yang", "isChanging": true },
      { "value": 8, "type": "yin", "isChanging": false }
    ],
    "primary_hexagram": 14,
    "transformed_hexagram": 44,
    "changing_lines": [2, 5],
    "cast_timestamp": "2024-01-15T10:30:00Z"
  },
  "interpretations": {
    "primary": { /* cached hexagram data from CSV */ },
    "transformed": { /* cached transformed hexagram data */ }
  },
  "journal_content": "User's reflection text...",
  "title": "I Ching Reading - Jan 15, 2024"
}
```

Option B: Create dedicated table (more structured):
```sql
CREATE TABLE iching_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  lines JSONB NOT NULL,  -- Array of 6 line objects
  primary_hexagram INTEGER NOT NULL CHECK (primary_hexagram BETWEEN 1 AND 64),
  transformed_hexagram INTEGER CHECK (transformed_hexagram BETWEEN 1 AND 64),
  changing_lines INTEGER[] DEFAULT '{}',
  journal_content TEXT,
  research_consent BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies
ALTER TABLE iching_readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own readings"
  ON iching_readings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own readings"
  ON iching_readings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own readings"
  ON iching_readings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own readings"
  ON iching_readings FOR DELETE
  USING (auth.uid() = user_id);
```

**Recommendation:** Use Option A (existing `user_documents` table) to minimize schema changes and maintain consistency with the existing architecture.

### 3.2 Type Definitions

```typescript
// src/types/iching.types.ts

export interface Coin {
  isHeads: boolean;
  value: 2 | 3;
}

export interface CoinToss {
  coins: [Coin, Coin, Coin];
  sum: 6 | 7 | 8 | 9;
}

export interface Line {
  position: 1 | 2 | 3 | 4 | 5 | 6;
  toss: CoinToss;
  type: 'yin' | 'yang';
  isChanging: boolean;
}

export interface Trigram {
  name: string;
  chinese: string;
  element: string;
  attribute: string;
}

export interface HexagramData {
  number: number;
  name: {
    english: string;
    chinese: string;
    pinyin: string;
  };
  unicode: string;
  trigrams: {
    upper: Trigram;
    lower: Trigram;
  };
  judgment: string;
  image: string;
  lines: {
    1: string;
    2: string;
    3: string;
    4: string;
    5: string;
    6: string;
  };
  overallMeaning: string;
}

export interface IChingReading {
  id: string;
  userId: string;
  question: string;
  lines: Line[];
  primaryHexagram: HexagramData;
  transformedHexagram: HexagramData | null;
  changingLines: number[];
  journalContent: string;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Part 4: AI Integration

### 4.1 System Prompt for I Ching AI

```typescript
// src/lib/iching-ai-prompt.ts

export function buildIChingSystemPrompt(reading: IChingReading): string {
  const changingLinesText = reading.changingLines.length > 0
    ? `\n\nCHANGING LINES (these are especially significant):\n${
        reading.changingLines.map(lineNum =>
          `Line ${lineNum}: ${reading.primaryHexagram.lines[lineNum]}`
        ).join('\n')
      }`
    : '\n\nNo changing lines in this reading.';

  const transformationText = reading.transformedHexagram
    ? `\n\nTRANSFORMED HEXAGRAM (#${reading.transformedHexagram.number} - ${reading.transformedHexagram.name.english}):\nThe changing lines indicate this situation will evolve into:\n- Judgment: ${reading.transformedHexagram.judgment}\n- Image: ${reading.transformedHexagram.image}`
    : '';

  return `You are a wise and compassionate I Ching oracle assistant. You help users understand their I Ching readings and apply the ancient wisdom to their modern lives.

CONTEXT FOR THIS READING:

USER'S QUESTION:
"${reading.question}"

PRIMARY HEXAGRAM (#${reading.primaryHexagram.number} - ${reading.primaryHexagram.name.english} / ${reading.primaryHexagram.name.chinese}):
- The Judgment: ${reading.primaryHexagram.judgment}
- The Image: ${reading.primaryHexagram.image}
- Overall Meaning: ${reading.primaryHexagram.overallMeaning}
${changingLinesText}
${transformationText}

USER'S JOURNAL REFLECTION:
${reading.journalContent || '(No reflection written yet)'}

---

YOUR ROLE:
- Help the user understand how this reading applies to their question
- Explain symbolism and imagery in accessible terms
- Be supportive but honest - I Ching readings can contain warnings
- Connect ancient wisdom to modern situations
- If the user asks about specific lines, provide detailed interpretation
- Encourage self-reflection rather than giving prescriptive advice
- Remember: the I Ching offers guidance, not fortune-telling

TONE:
- Wise and contemplative
- Compassionate but grounded
- Respectful of the tradition
- Non-dogmatic - there are multiple valid interpretations

Format your responses with clear paragraph breaks for readability.`;
}
```

### 4.2 API Route Modification

Modify `/api/ai/chat/route.ts` to detect I Ching readings and use the specialized prompt:

```typescript
// Check if this is an I Ching reading context
if (journalEntry?.document_type === 'iching_reading') {
  const readingData = journalEntry.document_data;
  systemPrompt = buildIChingSystemPrompt(readingData);
} else {
  // Use existing journal prompt
  systemPrompt = buildJournalSystemPrompt(journalEntry);
}
```

---

## Part 5: Implementation Steps

### Phase 1: Core I Ching Engine
- [ ] Create `src/lib/iching.ts` with coin toss simulation
- [ ] Create `src/types/iching.types.ts` with type definitions
- [ ] Create hexagram data file (`/public/data/iching-hexagrams.json`)
- [ ] Create `src/lib/hexagram-lookup.ts` for CSV/JSON parsing
- [ ] Add King Wen sequence mapping for hexagram identification
- [ ] Write unit tests for casting logic

### Phase 2: UI Components
- [ ] Create `src/components/iching/QuestionInput.tsx`
- [ ] Create `src/components/iching/CoinCastingAnimation.tsx`
- [ ] Create `src/components/iching/HexagramDisplay.tsx`
- [ ] Create `src/components/iching/LineDisplay.tsx` (individual line with symbols)
- [ ] Create `src/components/iching/ReadingInterpretation.tsx`
- [ ] Create `src/components/iching/ReadingJournal.tsx`
- [ ] Create `src/components/iching/IChingAIAssistant.tsx`

### Phase 3: Page & Routing
- [ ] Create new main page (`src/app/page.tsx` or `src/app/iching/page.tsx`)
- [ ] Implement reading flow state machine
- [ ] Add sidebar for past readings
- [ ] Implement save/load functionality

### Phase 4: Database & API
- [ ] Create Supabase migration for any new tables (if using Option B)
- [ ] Update `user_documents` types for I Ching readings (if using Option A)
- [ ] Create/modify API routes for reading CRUD operations
- [ ] Update AI chat route with I Ching context support

### Phase 5: AI Integration
- [ ] Create `src/lib/iching-ai-prompt.ts`
- [ ] Modify chat API to use I Ching prompt when appropriate
- [ ] Test AI understanding of hexagram context

### Phase 6: Polish & Testing
- [ ] Add loading states and animations
- [ ] Mobile responsive design
- [ ] Error handling
- [ ] E2E tests
- [ ] Performance optimization

---

## Part 6: Files to Create/Modify

### New Files
```
src/
├── lib/
│   ├── iching.ts                    # Core casting logic
│   ├── hexagram-lookup.ts           # CSV/JSON data loading
│   └── iching-ai-prompt.ts          # AI system prompt builder
├── types/
│   └── iching.types.ts              # TypeScript interfaces
├── components/
│   └── iching/
│       ├── QuestionInput.tsx
│       ├── CoinCastingAnimation.tsx
│       ├── HexagramDisplay.tsx
│       ├── LineDisplay.tsx
│       ├── ReadingInterpretation.tsx
│       ├── ReadingJournal.tsx
│       └── IChingAIAssistant.tsx
└── app/
    └── (either modify page.tsx or create iching/page.tsx)

public/
└── data/
    └── iching-hexagrams.json        # All 64 hexagrams data

supabase/
└── migrations/
    └── 20250108_iching_readings.sql # If using Option B
```

### Files to Modify
```
src/app/page.tsx                     # Replace or significantly modify
src/app/api/ai/chat/route.ts         # Add I Ching context handling
src/types/database.types.ts          # Add I Ching document types
```

### Files to Remove/Deprecate
```
src/components/TemplateSelector.tsx   # Not needed for I Ching
src/components/TemplateCreator.tsx    # Not needed for I Ching
```

---

## Part 7: Hexagram Data Source

### Option 1: Manual Entry
Create JSON file with all 64 hexagrams manually transcribed from a public domain source (e.g., Wilhelm/Baynes translation is often available).

### Option 2: Use Existing Open Source Data
Several GitHub repositories have I Ching data in JSON format:
- https://github.com/krry/iching (MIT License)
- https://github.com/stroiman/hexagrams

### CSV Format (if preferred)
```csv
number,name_english,name_chinese,name_pinyin,unicode,upper_trigram,lower_trigram,judgment,image,line_1,line_2,line_3,line_4,line_5,line_6,overall_meaning
1,The Creative,乾,Qián,䷀,Heaven,Heaven,"The Creative works...",Heaven moves...",...
```

---

## Part 8: Future Enhancements (Out of Scope)

- [ ] Yarrow stalk method simulation (more traditional, different probabilities)
- [ ] Multiple translation options (Wilhelm, Legge, etc.)
- [ ] Historical reading patterns analysis
- [ ] Public reading sharing
- [ ] Reading export (PDF, image)
- [ ] Audio/visual meditation for readings
- [ ] Integration with other divination systems

---

## Summary

This transformation will:
1. **Replace templates with questions** - Users ask questions instead of selecting journaling templates
2. **Add coin casting simulation** - Authentic I Ching divination experience
3. **Display hexagrams visually** - Beautiful rendering of hexagram lines with changing line indicators
4. **Load interpretations from data file** - CSV/JSON with all 64 hexagrams
5. **Support transformations** - When lines change, show the resulting hexagram
6. **Maintain journaling** - Users can reflect on their readings
7. **Enhance AI with context** - AI assistant knows the question, hexagram, lines, and journal

The existing authentication, payment, and AI credit systems remain unchanged, ensuring a smooth transition while fundamentally changing the app's purpose.
