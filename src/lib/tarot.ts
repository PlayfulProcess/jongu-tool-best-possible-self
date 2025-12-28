// Tarot 3-Card Reading Logic

import { TarotCard, TarotReading, DrawnCard } from '@/types/tarot.types';
import { CustomTarotCard, ExtendedTarotCard } from '@/types/custom-tarot.types';

// Cache for loaded tarot cards
let cardCache: TarotCard[] | null = null;

/**
 * Load all tarot cards from the JSON data file
 */
export async function loadTarotCards(): Promise<TarotCard[]> {
  if (cardCache) {
    return cardCache;
  }

  try {
    const response = await fetch('/data/tarot-cards.json');
    if (!response.ok) {
      throw new Error(`Failed to load tarot data: ${response.status}`);
    }

    const data = await response.json();
    cardCache = data.cards || data;
    return cardCache!;
  } catch (error) {
    console.error('Error loading tarot data:', error);
    return getPlaceholderCards();
  }
}

/**
 * Shuffle array using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Draw a 3-card spread (Past, Present, Future)
 */
export async function drawThreeCards(question: string): Promise<TarotReading> {
  const allCards = await loadTarotCards();
  const shuffled = shuffleArray(allCards);

  const positions: ('past' | 'present' | 'future')[] = ['past', 'present', 'future'];

  const drawnCards: DrawnCard[] = positions.map((position, index) => ({
    card: shuffled[index],
    position,
    isReversed: Math.random() < 0.3, // 30% chance of reversed
  }));

  return {
    question,
    cards: drawnCards,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Get placeholder cards if loading fails
 */
function getPlaceholderCards(): TarotCard[] {
  return [
    {
      name: 'The Fool',
      arcana: 'major',
      keywords: ['beginnings', 'innocence', 'spontaneity'],
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/90/RWS_Tarot_00_Fool.jpg',
    },
    {
      name: 'The Magician',
      arcana: 'major',
      keywords: ['manifestation', 'resourcefulness', 'power'],
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/de/RWS_Tarot_01_Magician.jpg',
    },
    {
      name: 'The High Priestess',
      arcana: 'major',
      keywords: ['intuition', 'sacred knowledge', 'mystery'],
      imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/88/RWS_Tarot_02_High_Priestess.jpg',
    },
  ];
}

/**
 * Get a specific card by name
 */
export async function getCardByName(name: string): Promise<TarotCard | null> {
  const cards = await loadTarotCards();
  return cards.find(c => c.name.toLowerCase() === name.toLowerCase()) || null;
}

/**
 * Format card position for display (CBT-focused labels)
 */
export function formatPosition(position: 'past' | 'present' | 'future'): string {
  const labels = {
    past: 'Structures',
    present: 'Process',
    future: 'Possibilities',
  };
  return labels[position];
}

/**
 * Get position description for AI context (CBT-focused)
 */
export function getPositionDescription(position: 'past' | 'present' | 'future'): string {
  const descriptions = {
    past: 'underlying structures, patterns, or beliefs shaping the situation',
    present: 'current process, how things are unfolding or being experienced',
    future: 'possibilities, resources, or perspectives to consider',
  };
  return descriptions[position];
}

/**
 * Draw a 3-card spread from a deck (all decks come from database)
 */
export function drawThreeCardsFromCustomDeck(
  cards: CustomTarotCard[],
  question: string,
  deckId: string
): TarotReading {
  const shuffled = shuffleArray([...cards]);
  const positions: ('past' | 'present' | 'future')[] = ['past', 'present', 'future'];

  const drawnCards: DrawnCard[] = positions.map((position, index) => {
    const customCard = shuffled[index];

    // Convert custom card to extended tarot card format
    const card: ExtendedTarotCard = {
      name: customCard.name,
      arcana: customCard.arcana === 'major' ? 'major' : 'minor',
      suit: customCard.suit,
      number: customCard.number,
      keywords: customCard.keywords || [],
      imageUrl: customCard.image_url || '',
      // Extended fields
      summary: customCard.summary,
      interpretation: customCard.interpretation,
      reversed_interpretation: customCard.reversed_interpretation,
      symbols: customCard.symbols,
      element: customCard.element,
      affirmation: customCard.affirmation,
      questions: customCard.questions,
    };

    return {
      card: card as TarotCard, // Cast to base type for compatibility
      position,
      isReversed: Math.random() < 0.3, // 30% chance of reversed
    };
  });

  return {
    question,
    cards: drawnCards,
    timestamp: new Date().toISOString(),
    deckId,
  };
}
