# User-Editable Tarot Deck System Plan

**Date:** 2025-01-16
**Purpose:** Enable users to build personal tarot interpretation libraries with editable AI prompts
**Status:** Planning Phase

---

## 🎯 Core Concept

Users progressively build their own tarot deck by:
1. **Editing AI prompts** before sending (customize interpretation approach)
2. **Adding personal interpretations** as they encounter cards in readings
3. **Building a personal library** that grows with each reading
4. **Uploading media** (images, videos, links) for each card similar to recursive_creator

**Key Insight:** Users learn tarot by USING tarot. Each reading is an opportunity to deepen understanding.

---

## 📊 Database Schema

### 1. User Tarot Decks

```sql
CREATE TABLE public.user_tarot_decks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,                          -- "My Rider-Waite Deck"
  description text,
  base_deck_slug text,                         -- Reference to official deck (optional)
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, name)
);

-- RLS
ALTER TABLE user_tarot_decks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own decks"
  ON user_tarot_decks FOR ALL
  USING (auth.uid() = user_id);
```

### 2. User Card Interpretations

```sql
CREATE TABLE public.user_card_interpretations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  deck_id uuid REFERENCES user_tarot_decks(id) ON DELETE CASCADE,
  card_name text NOT NULL,                     -- "The Fool", "7 of Swords"

  -- Personal interpretation content
  card_content jsonb NOT NULL DEFAULT '{       -- Flexible structure like recursive_creator
    "items": [
      {
        "type": "text",
        "content": "For me, this card means..."
      },
      {
        "type": "image",
        "url": "https://...",
        "caption": "My interpretation image"
      },
      {
        "type": "video",
        "url": "https://youtube.com/...",
        "caption": "Tarot reading tutorial"
      },
      {
        "type": "link",
        "url": "https://...",
        "title": "Resource I found helpful"
      }
    ],
    "keywords": ["trickery", "deception", "strategy"],
    "upright_meaning": "My understanding when upright...",
    "reversed_meaning": "My understanding when reversed...",
    "personal_notes": "I always see this when..."
  }'::jsonb,

  -- Position-specific interpretations (optional)
  position_interpretations jsonb DEFAULT '{}'::jsonb,  -- {"past": "When in past position...", "future": "..."}

  -- Metadata
  times_encountered integer DEFAULT 0,        -- Track learning progress
  first_seen_at timestamptz DEFAULT now(),
  last_updated_at timestamptz DEFAULT now(),

  UNIQUE(user_id, deck_id, card_name)
);

-- RLS
ALTER TABLE user_card_interpretations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own interpretations"
  ON user_card_interpretations FOR ALL
  USING (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX idx_card_interpretations_deck ON user_card_interpretations(deck_id, card_name);
```

### 3. User Tarot Readings (with editable prompts)

```sql
CREATE TABLE public.user_tarot_readings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  deck_id uuid REFERENCES user_tarot_decks(id) ON DELETE SET NULL,

  -- Reading details
  spread_name text NOT NULL,                   -- "Three Card Spread", "Celtic Cross"
  question text,

  -- Cards drawn
  cards_drawn jsonb NOT NULL,                  -- See structure below

  -- User-editable prompt (before sending to AI)
  user_prompt_template text,                   -- The narrative prompt user can edit
  final_prompt_sent text,                      -- What was actually sent to AI (for record)

  -- AI response
  ai_interpretation text,

  -- Metadata
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE user_tarot_readings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own readings"
  ON user_tarot_readings FOR ALL
  USING (auth.uid() = user_id);
```

**cards_drawn structure:**
```json
{
  "spread": {
    "name": "Three Card Spread",
    "positions": [
      {"name": "Past", "meaning": "What led to this situation"},
      {"name": "Present", "meaning": "Current energies at play"},
      {"name": "Future", "meaning": "Potential outcome"}
    ]
  },
  "cards": [
    {
      "position": "Past",
      "card_name": "7 of Swords",
      "reversed": false,
      "user_interpretation_id": "uuid-if-exists",
      "base_card_data": {...}  // From official deck if no user interpretation
    },
    {
      "position": "Present",
      "card_name": "The Fool",
      "reversed": true,
      "user_interpretation_id": "uuid-here",
      "base_card_data": null  // Not needed if user has interpretation
    },
    {
      "position": "Future",
      "card_name": "10 of Cups",
      "reversed": false,
      "user_interpretation_id": null,
      "base_card_data": {...}  // First time seeing this card
    }
  ]
}
```

---

## 🔄 User Flow

### First-Time User Experience

```
1. User creates account → Automatically assigned "My First Deck"
2. User asks question: "What do I need to know about my career?"
3. System draws 3 random cards (uses base Rider-Waite definitions)
4. User sees EDITABLE PROMPT with card narrative
5. User can modify prompt before sending to AI
6. AI responds with interpretation
7. User saves reading → Prompted to add personal interpretation for new cards
```

### Returning User Experience

```
1. User draws cards for reading
2. System checks: Do I have personal interpretations for these cards?
   - Yes → Use user's interpretation
   - No → Use base deck definition
3. Show editable prompt (mix of personal + base interpretations)
4. User refines prompt
5. Send to AI
6. After reading, prompt to add/update interpretations
```

### Building Personal Library

```
Reading 1: Encounter "7 of Swords" → Add interpretation: "Trickery, not living by moral standards"
Reading 2: Encounter "7 of Swords" again → times_encountered = 2, can refine interpretation
Reading 5: Have interpretations for 15 cards → Deck feels "personal"
Reading 20: Have interpretations for 40 cards → "My deck" is rich with meaning
```

---

## 🏗️ Implementation Phases

### **Phase 1: Editable Prompts (Foundation)**

**Goal:** Let users edit AI prompts before sending

**Timeline:** 1-2 weeks

#### Database Setup
```sql
-- Run migrations from schema above
-- Start with user_tarot_decks and user_tarot_readings only
```

#### Component: EditablePrompt.tsx

```typescript
'use client';

import { useState } from 'react';
import { Pencil, Send, RotateCcw } from 'lucide-react';

interface EditablePromptProps {
  initialPrompt: string;
  onSend: (finalPrompt: string) => Promise<void>;
  cardData: any[];
}

export default function EditablePrompt({ initialPrompt, onSend, cardData }: EditablePromptProps) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [isEditing, setIsEditing] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    setIsSending(true);
    await onSend(prompt);
    setIsSending(false);
  };

  const handleReset = () => {
    setPrompt(initialPrompt);
  };

  return (
    <div className="space-y-4">
      {/* Prompt editor */}
      <div className="border border-purple-200 dark:border-purple-700 rounded-lg p-4 bg-purple-50 dark:bg-purple-900/20">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-purple-900 dark:text-purple-100">
            AI Interpretation Prompt
          </h3>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="text-sm text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
          >
            <Pencil className="w-4 h-4" />
            {isEditing ? 'Preview' : 'Edit'}
          </button>
        </div>

        {isEditing ? (
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full h-64 p-3 border border-purple-300 dark:border-purple-600 rounded bg-white dark:bg-gray-800 font-mono text-sm"
            placeholder="Customize the prompt sent to the AI..."
          />
        ) : (
          <div className="prose dark:prose-invert max-w-none text-sm whitespace-pre-wrap">
            {prompt}
          </div>
        )}

        {isEditing && (
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleReset}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          </div>
        )}
      </div>

      {/* Send button */}
      <button
        onClick={handleSend}
        disabled={isSending}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg font-semibold"
      >
        <Send className="w-5 h-5" />
        {isSending ? 'Sending to AI...' : 'Get AI Interpretation'}
      </button>
    </div>
  );
}
```

#### Prompt Building Function (Linear Narrative Format)

```typescript
// utils/tarotPrompts.ts

export interface CardData {
  position: string;
  card_name: string;
  reversed: boolean;
  interpretation: {
    upright_meaning?: string;
    reversed_meaning?: string;
    keywords?: string[];
    personal_notes?: string;
  };
}

/**
 * Builds a linear narrative prompt that AI can understand
 * (NOT matrix/tabular format)
 */
export function buildTarotPrompt(
  question: string,
  spreadName: string,
  cards: CardData[]
): string {
  // Header
  let prompt = `I drew a ${spreadName} tarot reading to explore the question:\n"${question}"\n\n`;

  prompt += `Here are the cards I drew, in order:\n\n`;
  prompt += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  // Card-by-card narrative (LINEAR, not matrix)
  cards.forEach((card, index) => {
    const orientation = card.reversed ? 'REVERSED' : 'UPRIGHT';

    prompt += `CARD ${index + 1}: ${card.position}\n`;
    prompt += `${card.card_name} (${orientation})\n\n`;

    // Meaning based on orientation
    const meaning = card.reversed
      ? card.interpretation.reversed_meaning
      : card.interpretation.upright_meaning;

    if (meaning) {
      prompt += `Meaning: ${meaning}\n\n`;
    }

    if (card.interpretation.keywords && card.interpretation.keywords.length > 0) {
      prompt += `Keywords: ${card.interpretation.keywords.join(', ')}\n\n`;
    }

    if (card.interpretation.personal_notes) {
      prompt += `Personal notes: ${card.interpretation.personal_notes}\n\n`;
    }

    prompt += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  });

  // Instructions for AI
  prompt += `\nPlease provide an interpretation of this reading. Consider:\n`;
  prompt += `- How each card relates to its position\n`;
  prompt += `- The overall narrative arc from ${cards[0]?.position} to ${cards[cards.length - 1]?.position}\n`;
  prompt += `- Connections and patterns between the cards\n`;
  prompt += `- Practical wisdom I can apply to my question\n\n`;
  prompt += `Be insightful, compassionate, and specific to my question.`;

  return prompt;
}
```

**Example output:**
```
I drew a Three Card Spread tarot reading to explore the question:
"What do I need to know about my career transition?"

Here are the cards I drew, in order:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CARD 1: Past
7 of Swords (UPRIGHT)

Meaning: Deception, trickery, or not living by your moral standards. Someone may have been dishonest or you've compromised your values.

Keywords: trickery, deception, strategy, sneakiness

Personal notes: For me, this often shows up when I'm not being authentic at work.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CARD 2: Present
The Fool (REVERSED)

Meaning: Recklessness, not looking before you leap, or fear of taking necessary risks.

Keywords: naivety, recklessness, fear, hesitation

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CARD 3: Future
10 of Cups (UPRIGHT)

Meaning: Emotional fulfillment, harmony, and alignment with your values. A sense of "coming home."

Keywords: fulfillment, harmony, happiness, alignment

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Please provide an interpretation of this reading. Consider:
- How each card relates to its position
- The overall narrative arc from Past to Future
- Connections and patterns between the cards
- Practical wisdom I can apply to my question

Be insightful, compassionate, and specific to my question.
```

---

### **Phase 2: Personal Interpretations (Learning System)**

**Goal:** Users add/edit interpretations as they encounter cards

**Timeline:** 2-3 weeks

#### Component: CardInterpretation.tsx

```typescript
'use client';

import { useState } from 'react';
import { Plus, Edit2, Save, X } from 'lucide-react';

interface CardInterpretationProps {
  cardName: string;
  deckId: string;
  existingInterpretation?: {
    id: string;
    upright_meaning: string;
    reversed_meaning: string;
    keywords: string[];
    personal_notes: string;
  };
  onSave: (interpretation: any) => Promise<void>;
}

export default function CardInterpretation({
  cardName,
  deckId,
  existingInterpretation,
  onSave
}: CardInterpretationProps) {
  const [isEditing, setIsEditing] = useState(!existingInterpretation);
  const [formData, setFormData] = useState({
    upright_meaning: existingInterpretation?.upright_meaning || '',
    reversed_meaning: existingInterpretation?.reversed_meaning || '',
    keywords: existingInterpretation?.keywords?.join(', ') || '',
    personal_notes: existingInterpretation?.personal_notes || ''
  });

  const handleSave = async () => {
    await onSave({
      ...formData,
      keywords: formData.keywords.split(',').map(k => k.trim()).filter(Boolean)
    });
    setIsEditing(false);
  };

  if (!isEditing && existingInterpretation) {
    return (
      <div className="border border-purple-200 dark:border-purple-700 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-lg">{cardName}</h4>
          <button
            onClick={() => setIsEditing(true)}
            className="text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
          >
            <Edit2 className="w-4 h-4" />
            Edit
          </button>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Upright Meaning:</p>
          <p className="text-gray-800 dark:text-gray-200">{existingInterpretation.upright_meaning}</p>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Reversed Meaning:</p>
          <p className="text-gray-800 dark:text-gray-200">{existingInterpretation.reversed_meaning}</p>
        </div>

        {existingInterpretation.keywords.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {existingInterpretation.keywords.map(keyword => (
              <span key={keyword} className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-sm">
                {keyword}
              </span>
            ))}
          </div>
        )}

        {existingInterpretation.personal_notes && (
          <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded">
            <p className="text-sm font-medium text-purple-900 dark:text-purple-100 mb-1">Personal Notes:</p>
            <p className="text-gray-700 dark:text-gray-300">{existingInterpretation.personal_notes}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="border border-purple-200 dark:border-purple-700 rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-lg">{cardName}</h4>
        {existingInterpretation && (
          <button
            onClick={() => setIsEditing(false)}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Upright Meaning
        </label>
        <textarea
          value={formData.upright_meaning}
          onChange={(e) => setFormData({ ...formData, upright_meaning: e.target.value })}
          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
          rows={3}
          placeholder="What does this card mean to you when upright?"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Reversed Meaning
        </label>
        <textarea
          value={formData.reversed_meaning}
          onChange={(e) => setFormData({ ...formData, reversed_meaning: e.target.value })}
          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
          rows={3}
          placeholder="What does this card mean when reversed?"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Keywords (comma-separated)
        </label>
        <input
          type="text"
          value={formData.keywords}
          onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
          placeholder="trickery, deception, strategy"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Personal Notes
        </label>
        <textarea
          value={formData.personal_notes}
          onChange={(e) => setFormData({ ...formData, personal_notes: e.target.value })}
          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
          rows={2}
          placeholder="When I see this card, it usually means..."
        />
      </div>

      <button
        onClick={handleSave}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
      >
        <Save className="w-4 h-4" />
        Save Interpretation
      </button>
    </div>
  );
}
```

#### API Route: Save Interpretation

```typescript
// app/api/tarot/interpretations/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { deck_id, card_name, interpretation } = await request.json();

    // Upsert interpretation
    const { data, error } = await supabase
      .from('user_card_interpretations')
      .upsert({
        user_id: user.id,
        deck_id,
        card_name,
        card_content: {
          items: [],
          keywords: interpretation.keywords || [],
          upright_meaning: interpretation.upright_meaning,
          reversed_meaning: interpretation.reversed_meaning,
          personal_notes: interpretation.personal_notes
        },
        last_updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,deck_id,card_name'
      })
      .select()
      .single();

    if (error) throw error;

    // Increment times_encountered if updating
    await supabase.rpc('increment_card_encounters', {
      p_user_id: user.id,
      p_deck_id: deck_id,
      p_card_name: card_name
    });

    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error('Save interpretation error:', error);
    return NextResponse.json(
      { error: 'Failed to save interpretation' },
      { status: 500 }
    );
  }
}
```

#### Database Function: Increment Encounters

```sql
CREATE OR REPLACE FUNCTION increment_card_encounters(
  p_user_id uuid,
  p_deck_id uuid,
  p_card_name text
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE user_card_interpretations
  SET times_encountered = times_encountered + 1
  WHERE user_id = p_user_id
    AND deck_id = p_deck_id
    AND card_name = p_card_name;
END;
$$;
```

---

### **Phase 3: Deck Builder (Rich Media)**

**Goal:** Upload images, videos, links like recursive_creator

**Timeline:** 2-3 weeks

#### Component: CardEditor.tsx

```typescript
'use client';

import { useState } from 'react';
import { Image, Video, Link as LinkIcon, Type, Trash2 } from 'lucide-react';
import type { CardContentItem } from '@/types/tarot';

interface CardEditorProps {
  cardName: string;
  initialItems?: CardContentItem[];
  onSave: (items: CardContentItem[]) => Promise<void>;
}

export default function CardEditor({ cardName, initialItems = [], onSave }: CardEditorProps) {
  const [items, setItems] = useState<CardContentItem[]>(initialItems);

  const addItem = (type: 'text' | 'image' | 'video' | 'link') => {
    setItems([...items, {
      type,
      content: '',
      url: '',
      caption: '',
      title: ''
    }]);
  };

  const updateItem = (index: number, updates: Partial<CardContentItem>) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], ...updates };
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold">{cardName}</h3>

      {/* Items */}
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="border border-gray-300 dark:border-gray-600 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium capitalize">{item.type}</span>
              <button
                onClick={() => removeItem(index)}
                className="text-red-600 hover:text-red-800"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {item.type === 'text' && (
              <textarea
                value={item.content}
                onChange={(e) => updateItem(index, { content: e.target.value })}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded"
                rows={4}
                placeholder="Your interpretation..."
              />
            )}

            {item.type === 'image' && (
              <div className="space-y-2">
                <input
                  type="url"
                  value={item.url}
                  onChange={(e) => updateItem(index, { url: e.target.value })}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded"
                  placeholder="Image URL"
                />
                <input
                  type="text"
                  value={item.caption}
                  onChange={(e) => updateItem(index, { caption: e.target.value })}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded"
                  placeholder="Caption (optional)"
                />
                {item.url && (
                  <img src={item.url} alt={item.caption} className="mt-2 rounded max-h-48 object-cover" />
                )}
              </div>
            )}

            {item.type === 'video' && (
              <div className="space-y-2">
                <input
                  type="url"
                  value={item.url}
                  onChange={(e) => updateItem(index, { url: e.target.value })}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded"
                  placeholder="YouTube/Vimeo URL"
                />
                <input
                  type="text"
                  value={item.caption}
                  onChange={(e) => updateItem(index, { caption: e.target.value })}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded"
                  placeholder="Caption (optional)"
                />
              </div>
            )}

            {item.type === 'link' && (
              <div className="space-y-2">
                <input
                  type="url"
                  value={item.url}
                  onChange={(e) => updateItem(index, { url: e.target.value })}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded"
                  placeholder="Link URL"
                />
                <input
                  type="text"
                  value={item.title}
                  onChange={(e) => updateItem(index, { title: e.target.value })}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded"
                  placeholder="Link title"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => addItem('text')}
          className="flex items-center gap-1 px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
        >
          <Type className="w-4 h-4" />
          Add Text
        </button>
        <button
          onClick={() => addItem('image')}
          className="flex items-center gap-1 px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
        >
          <Image className="w-4 h-4" />
          Add Image
        </button>
        <button
          onClick={() => addItem('video')}
          className="flex items-center gap-1 px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
        >
          <Video className="w-4 h-4" />
          Add Video
        </button>
        <button
          onClick={() => addItem('link')}
          className="flex items-center gap-1 px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
        >
          <LinkIcon className="w-4 h-4" />
          Add Link
        </button>
      </div>

      {/* Save */}
      <button
        onClick={() => onSave(items)}
        className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold"
      >
        Save Card
      </button>
    </div>
  );
}
```

#### TypeScript Types

```typescript
// types/tarot.ts

export interface CardContentItem {
  type: 'text' | 'image' | 'video' | 'link';
  content?: string;      // For text
  url?: string;          // For image, video, link
  caption?: string;      // For image, video
  title?: string;        // For link
}

export interface UserCardInterpretation {
  id: string;
  user_id: string;
  deck_id: string;
  card_name: string;
  card_content: {
    items: CardContentItem[];
    keywords: string[];
    upright_meaning: string;
    reversed_meaning: string;
    personal_notes: string;
  };
  position_interpretations?: Record<string, string>;
  times_encountered: number;
  first_seen_at: string;
  last_updated_at: string;
}

export interface UserTarotDeck {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  base_deck_slug?: string;
  created_at: string;
  updated_at: string;
}

export interface TarotReading {
  id: string;
  user_id: string;
  deck_id?: string;
  spread_name: string;
  question?: string;
  cards_drawn: any;
  user_prompt_template?: string;
  final_prompt_sent?: string;
  ai_interpretation?: string;
  created_at: string;
  updated_at: string;
}
```

---

## 🎨 UI/UX Flow Examples

### Reading Page Flow

```
┌─────────────────────────────────────────┐
│  🔮 New Tarot Reading                   │
├─────────────────────────────────────────┤
│                                         │
│  What question do you have?             │
│  ┌─────────────────────────────────┐  │
│  │ What should I focus on today?   │  │
│  └─────────────────────────────────┘  │
│                                         │
│  Choose a spread:                       │
│  ○ Three Card (Past/Present/Future)     │
│  ○ Celtic Cross                         │
│  ○ Single Card                          │
│                                         │
│  Using deck: My Rider-Waite Deck        │
│                                         │
│        [Draw Cards]                     │
└─────────────────────────────────────────┘

↓

┌─────────────────────────────────────────┐
│  Your Reading                           │
├─────────────────────────────────────────┤
│                                         │
│  🃏 Past: 7 of Swords                   │
│  🃏 Present: The Fool (Reversed)        │
│  🃏 Future: 10 of Cups                  │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ AI Interpretation Prompt          │ │
│  │ [Edit] [Preview]                  │ │
│  │                                   │ │
│  │ I drew a Three Card Spread...     │ │
│  │ (editable narrative)              │ │
│  └───────────────────────────────────┘ │
│                                         │
│  [Get AI Interpretation]                │
└─────────────────────────────────────────┘

↓

┌─────────────────────────────────────────┐
│  AI Interpretation                      │
├─────────────────────────────────────────┤
│                                         │
│  Based on your reading, it appears...   │
│  (AI response here)                     │
│                                         │
│  [Save Reading]                         │
│                                         │
│  💡 Add interpretations for new cards?  │
│  • 7 of Swords [Add Interpretation]     │
│  • 10 of Cups [Add Interpretation]      │
└─────────────────────────────────────────┘
```

### Card Interpretation Builder

```
┌─────────────────────────────────────────┐
│  7 of Swords                            │
├─────────────────────────────────────────┤
│                                         │
│  Upright Meaning:                       │
│  ┌─────────────────────────────────┐  │
│  │ For me, this card represents... │  │
│  │ trickery, not living by my      │  │
│  │ moral standards, or being       │  │
│  │ inauthentic at work.            │  │
│  └─────────────────────────────────┘  │
│                                         │
│  Reversed Meaning:                      │
│  ┌─────────────────────────────────┐  │
│  │ Coming clean, returning to      │  │
│  │ integrity, or facing truth.     │  │
│  └─────────────────────────────────┘  │
│                                         │
│  Keywords:                              │
│  trickery, deception, strategy          │
│                                         │
│  Personal Notes:                        │
│  I often see this when I'm not being    │
│  fully honest with myself.              │
│                                         │
│  Media:                                 │
│  📷 [My card image]                     │
│  🎥 [Tutorial video]                    │
│  🔗 [Resource link]                     │
│                                         │
│  [+ Add Text] [+ Add Image]             │
│  [+ Add Video] [+ Add Link]             │
│                                         │
│  [Save Interpretation]                  │
└─────────────────────────────────────────┘
```

---

## 🚀 Migration Path

### Initial Setup (Week 1)

```sql
-- 1. Create user_tarot_decks table
-- 2. Create user_card_interpretations table
-- 3. Create user_tarot_readings table
-- 4. Set up RLS policies
-- 5. Create increment_card_encounters function
```

### Default Deck Creation (Week 1)

```typescript
// When user creates account, give them a default deck

async function createDefaultDeck(userId: string) {
  const { data, error } = await supabase
    .from('user_tarot_decks')
    .insert({
      user_id: userId,
      name: 'My First Deck',
      description: 'Your personal tarot interpretation library',
      base_deck_slug: 'rider-waite'
    })
    .select()
    .single();

  return data;
}
```

### Seed Base Card Data (Optional)

```typescript
// Optionally seed with Rider-Waite definitions as starting point
// Users will override these with personal interpretations

const RIDER_WAITE_CARDS = [
  {
    name: 'The Fool',
    upright: 'New beginnings, innocence, spontaneity',
    reversed: 'Recklessness, taken advantage of, inconsideration',
    keywords: ['beginnings', 'innocence', 'spontaneity']
  },
  // ... 77 more cards
];
```

---

## 📊 Success Metrics

### User Engagement
- % of users who add ≥1 personal interpretation
- Average interpretations per user after 30 days
- % of users who edit prompts before sending to AI

### Learning Progress
- Average cards in personal library over time
- Distribution of times_encountered (shows depth of learning)
- Retention: % of users who return after first reading

### AI Quality
- User satisfaction with interpretations
- Prompt edit rate (high = users need to customize a lot)
- Reading completion rate

---

## 🔮 Future Enhancements

### Community Features
- Share interpretations with other users (opt-in)
- Explore popular interpretations for specific cards
- Learn from others' experiences

### Advanced Spreads
- Create custom spreads
- Position-specific interpretations
- Spread templates with pre-filled guidance

### Learning Tools
- "Card of the Day" practice
- Flashcards for memorization
- Progress tracking dashboard
- Interpretation journal (meta-journaling about tarot learning)

### AI Improvements
- Multiple AI personas (Jungian analyst, spiritual guide, practical coach)
- Summarization of long conversation history
- Card relationship analysis (e.g., "You often see 7 of Swords with The Tower")

---

## ✅ Implementation Checklist

### Phase 1: Editable Prompts
- [ ] Create database tables (user_tarot_decks, user_tarot_readings)
- [ ] Build buildTarotPrompt() function (linear narrative)
- [ ] Create EditablePrompt component
- [ ] Update AI API to accept user_prompt_template
- [ ] Save readings with final_prompt_sent
- [ ] Test: User can edit prompt and get AI interpretation

### Phase 2: Personal Interpretations
- [ ] Create user_card_interpretations table
- [ ] Build CardInterpretation component
- [ ] Create API route for saving interpretations
- [ ] Implement increment_card_encounters function
- [ ] Update buildTarotPrompt() to use personal interpretations
- [ ] Add "Add Interpretation" prompts after readings
- [ ] Test: User can build personal library over time

### Phase 3: Deck Builder
- [ ] Build CardEditor component (like recursive_creator)
- [ ] Support image uploads (URL or file upload)
- [ ] Support video embeds (YouTube, Vimeo)
- [ ] Support link attachments
- [ ] Update card_content JSONB schema
- [ ] Create deck management page
- [ ] Test: User can build rich, multimedia card interpretations

---

**Location:** `jongu-tool-best-possible-self/TAROT_PERSONAL_DECK_PLAN.md`
**Last Updated:** 2025-01-16
**Status:** Ready for implementation
