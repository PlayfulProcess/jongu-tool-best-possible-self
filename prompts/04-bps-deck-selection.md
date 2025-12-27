# Prompt 4: jongu-tool-best-possible-self - Deck Selection

Use this prompt in **jongu-tool-best-possible-self** (this repository).

---

## Prompt

I want to add custom tarot deck selection to the existing TarotOracle component. Users should be able to:

1. Use the default Rider-Waite deck (current behavior)
2. Select a custom deck from the Tarot Channel (published decks)
3. Preview any deck in a new tab (Tarot Viewer)

### Current Architecture

- `src/components/TarotOracle.tsx` - Main tarot UI
- `src/lib/tarot.ts` - Card loading and drawing logic
- `src/types/tarot.types.ts` - TypeScript interfaces
- `public/data/tarot-cards.json` - Rider-Waite deck data
- `src/app/api/ai/chat/route.ts` - AI endpoint that receives tarot context

### New Files to Create

1. **src/types/custom-tarot.types.ts**
```typescript
export interface CustomTarotDeck {
  id: string;
  name: string;
  description?: string;
  creator_name?: string;
  cover_image_url?: string;
  tags?: string[];
  card_count: number;
  cards: CustomTarotCard[];
  created_at?: string;
}

export interface CustomTarotCard {
  id: string;
  name: string;
  number?: number;
  arcana?: 'major' | 'minor' | 'custom';
  suit?: string;
  image_url?: string;
  keywords?: string[];
  summary?: string;
  interpretation?: string;
  reversed_interpretation?: string;
  symbols?: string[];
  element?: string;
  affirmation?: string;
  questions?: string[];
  sort_order: number;
}

// For the deck selector dropdown
export interface DeckOption {
  id: string | 'rider-waite';
  name: string;
  creator_name?: string;
  card_count: number;
  is_custom: boolean;
}
```

2. **src/lib/custom-tarot.ts**
```typescript
import { CustomTarotDeck, DeckOption } from '@/types/custom-tarot.types';

const TAROT_CHANNEL_API = process.env.NEXT_PUBLIC_TAROT_CHANNEL_API || 'https://jongu-wellness.vercel.app';

// Cache for loaded decks
const deckCache = new Map<string, CustomTarotDeck>();

export async function fetchPublishedDecks(): Promise<DeckOption[]> {
  try {
    const res = await fetch(`${TAROT_CHANNEL_API}/api/tarot-channel/decks`);
    if (!res.ok) return [];

    const { decks } = await res.json();
    return decks.map((d: CustomTarotDeck) => ({
      id: d.id,
      name: d.name,
      creator_name: d.creator_name,
      card_count: d.card_count,
      is_custom: true
    }));
  } catch (error) {
    console.error('Failed to fetch decks:', error);
    return [];
  }
}

export async function fetchDeckWithCards(deckId: string): Promise<CustomTarotDeck | null> {
  // Check cache first
  if (deckCache.has(deckId)) {
    return deckCache.get(deckId)!;
  }

  try {
    const res = await fetch(`${TAROT_CHANNEL_API}/api/tarot-channel/decks/${deckId}`);
    if (!res.ok) return null;

    const deck = await res.json();
    deckCache.set(deckId, deck);
    return deck;
  } catch (error) {
    console.error('Failed to fetch deck:', error);
    return null;
  }
}

export function getTarotViewerUrl(deckId: string): string {
  // URL to the tarot viewer (in recursive-creator or recursive-landing)
  return `https://recursive-creator.vercel.app/tarot-viewer/${deckId}`;
}
```

3. **src/components/TarotDeckSelector.tsx**
```typescript
'use client';

import { useState, useEffect } from 'react';
import { fetchPublishedDecks, getTarotViewerUrl } from '@/lib/custom-tarot';
import { DeckOption } from '@/types/custom-tarot.types';

interface TarotDeckSelectorProps {
  selectedDeckId: string;
  onDeckChange: (deckId: string) => void;
}

export function TarotDeckSelector({ selectedDeckId, onDeckChange }: TarotDeckSelectorProps) {
  const [decks, setDecks] = useState<DeckOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDecks() {
      const customDecks = await fetchPublishedDecks();
      setDecks([
        {
          id: 'rider-waite',
          name: 'Rider-Waite (Classic)',
          card_count: 78,
          is_custom: false
        },
        ...customDecks
      ]);
      setLoading(false);
    }
    loadDecks();
  }, []);

  const selectedDeck = decks.find(d => d.id === selectedDeckId);

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-300 mb-2">
        Choose Deck
      </label>
      <div className="flex gap-2">
        <select
          value={selectedDeckId}
          onChange={(e) => onDeckChange(e.target.value)}
          disabled={loading}
          className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
        >
          {loading ? (
            <option>Loading decks...</option>
          ) : (
            decks.map(deck => (
              <option key={deck.id} value={deck.id}>
                {deck.name} ({deck.card_count} cards)
                {deck.creator_name && ` by ${deck.creator_name}`}
              </option>
            ))
          )}
        </select>

        {selectedDeck?.is_custom && (
          <a
            href={getTarotViewerUrl(selectedDeckId)}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm"
            title="Preview deck in new tab"
          >
            Preview
          </a>
        )}
      </div>
    </div>
  );
}
```

### Modify TarotOracle.tsx

Add deck selection and load custom cards:

```typescript
// Add imports
import { TarotDeckSelector } from './TarotDeckSelector';
import { fetchDeckWithCards } from '@/lib/custom-tarot';
import { CustomTarotDeck, CustomTarotCard } from '@/types/custom-tarot.types';

// Add state for selected deck
const [selectedDeckId, setSelectedDeckId] = useState<string>('rider-waite');
const [customDeck, setCustomDeck] = useState<CustomTarotDeck | null>(null);

// Load custom deck when selection changes
useEffect(() => {
  if (selectedDeckId !== 'rider-waite') {
    fetchDeckWithCards(selectedDeckId).then(setCustomDeck);
  } else {
    setCustomDeck(null);
  }
}, [selectedDeckId]);

// Modify the drawCards function to use custom deck if selected
const handleDrawCards = async () => {
  if (selectedDeckId === 'rider-waite') {
    // Use existing drawThreeCards
    const reading = await drawThreeCards(question);
    // ... rest of existing logic
  } else if (customDeck) {
    // Draw from custom deck
    const reading = drawThreeCardsFromCustomDeck(customDeck.cards, question);
    // ... same handling
  }
};

// Add selector in the JSX, above the question input
<TarotDeckSelector
  selectedDeckId={selectedDeckId}
  onDeckChange={setSelectedDeckId}
/>
```

### Modify tarot.ts

Add function to draw from custom deck:

```typescript
import { CustomTarotCard } from '@/types/custom-tarot.types';
import { DrawnCard, TarotReading } from '@/types/tarot.types';

export function drawThreeCardsFromCustomDeck(
  cards: CustomTarotCard[],
  question: string
): TarotReading {
  const shuffled = shuffleArray([...cards]);
  const positions: ('past' | 'present' | 'future')[] = ['past', 'present', 'future'];

  const drawnCards: DrawnCard[] = positions.map((position, index) => {
    const card = shuffled[index];
    return {
      card: {
        name: card.name,
        arcana: card.arcana === 'major' ? 'major' : 'minor',
        suit: card.suit as 'wands' | 'cups' | 'swords' | 'pentacles' | undefined,
        number: card.number,
        keywords: card.keywords || [],
        imageUrl: card.image_url || '',
        // Extended fields for custom cards
        summary: card.summary,
        interpretation: card.interpretation,
        reversed_interpretation: card.reversed_interpretation,
        symbols: card.symbols,
        element: card.element,
        affirmation: card.affirmation,
        questions: card.questions,
      },
      position,
      isReversed: Math.random() < 0.3,
    };
  });

  return {
    question,
    cards: drawnCards,
    timestamp: new Date().toISOString(),
  };
}
```

### Modify AI Context (route.ts)

Update `buildSingleTarotReadingSection` to include custom card data:

```typescript
function buildSingleTarotReadingSection(reading: TarotReadingContext): string {
  let content = `QUESTION: "${reading.question}"\n\n`;
  content += 'THREE-CARD SPREAD:\n\n';

  reading.cards.forEach((card) => {
    const positionLabel = formatPosition(card.position);
    content += `${positionLabel}:\n`;
    content += `- ${card.name}${card.isReversed ? ' (REVERSED)' : ''}\n`;
    content += `- ${card.arcana} Arcana${card.suit ? ` - ${card.suit}` : ''}\n`;

    if (card.keywords?.length) {
      content += `- Keywords: ${card.keywords.join(', ')}\n`;
    }

    // NEW: Include custom card interpretation data
    if (card.summary) {
      content += `- Summary: ${card.summary}\n`;
    }
    if (card.interpretation) {
      content += `- Interpretation: ${card.interpretation}\n`;
    }
    if (card.isReversed && card.reversed_interpretation) {
      content += `- Reversed meaning: ${card.reversed_interpretation}\n`;
    }
    if (card.symbols?.length) {
      content += `- Symbols: ${card.symbols.join(', ')}\n`;
    }
    if (card.element) {
      content += `- Element: ${card.element}\n`;
    }
    if (card.affirmation) {
      content += `- Affirmation: ${card.affirmation}\n`;
    }
    if (card.questions?.length) {
      content += `- Reflective questions: ${card.questions.join(' ')}\n`;
    }

    content += '\n';
  });

  return content;
}
```

### Environment Variable

Add to `.env.local`:
```
NEXT_PUBLIC_TAROT_CHANNEL_API=https://jongu-wellness.vercel.app
```

### Implementation Steps

1. Create `src/types/custom-tarot.types.ts`
2. Create `src/lib/custom-tarot.ts`
3. Create `src/components/TarotDeckSelector.tsx`
4. Modify `src/lib/tarot.ts` - add `drawThreeCardsFromCustomDeck`
5. Modify `src/components/TarotOracle.tsx` - add deck selection
6. Modify `src/app/api/ai/chat/route.ts` - include custom card data in AI context
7. Add environment variable

Start with steps 1-3 (types, lib, and selector component).
