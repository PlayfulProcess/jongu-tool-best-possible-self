// Tarot Card Types

export interface TarotCard {
  name: string;
  arcana: 'major' | 'minor';
  suit?: 'wands' | 'cups' | 'swords' | 'pentacles' | string;
  number?: number; // For minor arcana (1-14, where 11-14 are court cards)
  keywords: string[];
  imageUrl: string;
}

export interface DrawnCard {
  card: TarotCard;
  position: 'past' | 'present' | 'future';
  isReversed: boolean;
}

export interface TarotReading {
  question: string;
  cards: DrawnCard[];
  timestamp: string;
  deckId?: string; // ID of the deck used for this reading
}

// Major Arcana names for reference
export const MAJOR_ARCANA = [
  'The Fool',
  'The Magician',
  'The High Priestess',
  'The Empress',
  'The Emperor',
  'The Hierophant',
  'The Lovers',
  'The Chariot',
  'Strength',
  'The Hermit',
  'Wheel of Fortune',
  'Justice',
  'The Hanged Man',
  'Death',
  'Temperance',
  'The Devil',
  'The Tower',
  'The Star',
  'The Moon',
  'The Sun',
  'Judgement',
  'The World',
] as const;

// Court card names
export const COURT_CARDS = ['Page', 'Knight', 'Queen', 'King'] as const;

// Suits
export const SUITS = ['wands', 'cups', 'swords', 'pentacles'] as const;
