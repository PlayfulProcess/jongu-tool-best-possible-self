// Custom I Ching Book Types (for books from I Ching Channel)

import { HexagramData, Trigram } from './iching.types';

export interface IChingBook {
  id: string;
  name: string;
  description?: string;
  creator_name?: string;
  cover_image_url?: string;
  hexagram_count: number;
  hexagrams: HexagramData[];
  created_at?: string;
}

// Book source types
export type BookSource = 'community' | 'user' | 'fallback';

// For the book selector dropdown
export interface BookOption {
  id: string;
  name: string;
  description?: string;
  creator_name?: string;
  creator_id?: string; // User ID of the creator (for ownership check)
  cover_image_url?: string;
  hexagram_count: number;
  created_at?: string;
  source: BookSource; // Where the book came from
}

// Extended hexagram that includes attribution
export interface HexagramWithAttribution extends HexagramData {
  book_id?: string;
  book_name?: string;
  creator_name?: string;
}

// Document data structure for I Ching books stored in user_documents
export interface IChingBookDocumentData {
  name: string;
  description?: string;
  creator_name?: string;
  cover_image_url?: string;
  hexagrams: HexagramData[];
  is_published?: boolean;
  forked_from?: string;
  original_book_name?: string;
}

// For parsing BPS JSON format when importing
export interface BPSHexagramFormat {
  number: number;
  chinese_name?: string;
  english_name?: string;  // BPS format uses english_name
  name?: string;          // Alternative field name
  pinyin?: string;
  binary?: string;
  unicode?: string;
  trigram_above?: Trigram | string;
  trigram_below?: Trigram | string;
  judgment?: string;
  image?: string;
  lines?: Record<string, string> | string[];
  meaning?: string;
  interpretation?: string;  // Alternative to meaning
}
