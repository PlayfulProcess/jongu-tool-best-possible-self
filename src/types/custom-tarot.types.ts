// Custom Tarot Deck Types (for decks from Tarot Channel)

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
  id: string;
  name: string;
  description?: string;
  creator_name?: string;
  cover_image_url?: string;
  card_count: number;
  created_at?: string;
}

// Extended TarotCard that includes custom fields
export interface ExtendedTarotCard {
  name: string;
  arcana: 'major' | 'minor';
  suit?: string;
  number?: number;
  keywords: string[];
  imageUrl: string;
  // Extended fields from custom cards
  summary?: string;
  interpretation?: string;
  reversed_interpretation?: string;
  symbols?: string[];
  element?: string;
  affirmation?: string;
  questions?: string[];
}
