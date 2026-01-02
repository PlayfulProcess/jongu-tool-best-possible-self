// Hexagram Lookup Utility
// Loads and provides access to hexagram data from JSON or custom I Ching books

import { HexagramData } from '@/types/iching.types';
import { HexagramWithAttribution } from '@/types/custom-iching.types';
import { fetchBookWithHexagrams } from './custom-iching';

// Cache for loaded hexagram data (classic/fallback)
let hexagramCache: HexagramData[] | null = null;

// Cache for book-specific hexagrams
const bookHexagramCache = new Map<string, HexagramData[]>();

// Current active book ID (null means use classic)
let activeBookId: string | null = null;

// Current active book metadata for attribution
let activeBookMeta: { name: string; creator_name: string } | null = null;

/**
 * Set the active book ID for hexagram lookups
 */
export function setActiveBook(bookId: string | null, meta?: { name: string; creator_name: string }): void {
  activeBookId = bookId;
  activeBookMeta = meta || null;
}

/**
 * Get the current active book ID
 */
export function getActiveBookId(): string | null {
  return activeBookId;
}

/**
 * Get the current active book metadata
 */
export function getActiveBookMeta(): { name: string; creator_name: string } | null {
  return activeBookMeta;
}

/**
 * Load hexagrams from the active book or fallback to classic JSON
 */
export async function loadHexagrams(): Promise<HexagramData[]> {
  // If an active book is set, try to load from it
  if (activeBookId && activeBookId !== 'classic') {
    const bookHexagrams = await loadHexagramsFromBook(activeBookId);
    if (bookHexagrams.length > 0) {
      return bookHexagrams;
    }
    // Fall through to classic if book fails
  }

  return loadClassicHexagrams();
}

/**
 * Load hexagrams from the classic JSON data file
 */
export async function loadClassicHexagrams(): Promise<HexagramData[]> {
  if (hexagramCache) {
    return hexagramCache;
  }

  try {
    // In Next.js, we can fetch from public directory
    const response = await fetch('/data/iching-hexagrams.json');
    if (!response.ok) {
      throw new Error(`Failed to load hexagram data: ${response.status}`);
    }

    const data = await response.json();
    hexagramCache = data.hexagrams || data;
    return hexagramCache!;
  } catch (error) {
    console.error('Error loading hexagram data:', error);
    // Return placeholder data if loading fails
    return getPlaceholderHexagrams();
  }
}

/**
 * Load hexagrams from a specific book
 */
export async function loadHexagramsFromBook(bookId: string): Promise<HexagramData[]> {
  // Check cache first
  if (bookHexagramCache.has(bookId)) {
    return bookHexagramCache.get(bookId)!;
  }

  try {
    const book = await fetchBookWithHexagrams(bookId);
    if (book && book.hexagrams.length > 0) {
      bookHexagramCache.set(bookId, book.hexagrams);
      return book.hexagrams;
    }
  } catch (error) {
    console.error(`Error loading hexagrams from book ${bookId}:`, error);
  }

  return [];
}

/**
 * Get a specific hexagram by its number (1-64)
 */
export async function getHexagramByNumber(number: number): Promise<HexagramData> {
  if (number < 1 || number > 64) {
    throw new Error(`Invalid hexagram number: ${number}. Must be between 1 and 64.`);
  }

  const hexagrams = await loadHexagrams();
  const hexagram = hexagrams.find((h) => h.number === number);

  if (!hexagram) {
    // Return placeholder if not found
    return getPlaceholderHexagram(number);
  }

  return hexagram;
}

/**
 * Get a hexagram by its Chinese name
 */
export async function getHexagramByChineseName(chineseName: string): Promise<HexagramData | null> {
  const hexagrams = await loadHexagrams();
  return hexagrams.find((h) => h.chinese_name === chineseName) || null;
}

/**
 * Get a hexagram by its binary representation
 */
export async function getHexagramByBinary(binary: string): Promise<HexagramData | null> {
  const hexagrams = await loadHexagrams();
  return hexagrams.find((h) => h.binary === binary) || null;
}

/**
 * Search hexagrams by English name (partial match)
 */
export async function searchHexagramsByName(query: string): Promise<HexagramData[]> {
  const hexagrams = await loadHexagrams();
  const lowerQuery = query.toLowerCase();
  return hexagrams.filter(
    (h) =>
      h.english_name.toLowerCase().includes(lowerQuery) ||
      h.pinyin.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get all hexagrams
 */
export async function getAllHexagrams(): Promise<HexagramData[]> {
  return loadHexagrams();
}

/**
 * Clear the cache (useful for development/testing)
 */
export function clearHexagramCache(): void {
  hexagramCache = null;
  bookHexagramCache.clear();
}

/**
 * Get a hexagram with attribution information
 */
export async function getHexagramWithAttribution(number: number): Promise<HexagramWithAttribution> {
  const hexagram = await getHexagramByNumber(number);
  const meta = getActiveBookMeta();

  return {
    ...hexagram,
    book_id: activeBookId || 'classic',
    book_name: meta?.name || 'Classic I Ching',
    creator_name: meta?.creator_name || 'Traditional',
  };
}

/**
 * Get a hexagram from a specific book by number
 */
export async function getHexagramFromBook(
  bookId: string,
  number: number
): Promise<HexagramData> {
  if (number < 1 || number > 64) {
    throw new Error(`Invalid hexagram number: ${number}. Must be between 1 and 64.`);
  }

  const hexagrams = await loadHexagramsFromBook(bookId);
  const hexagram = hexagrams.find((h) => h.number === number);

  if (!hexagram) {
    // Fallback to classic if not found in book
    return getHexagramByNumber(number);
  }

  return hexagram;
}

// Trigram data for reference
export const TRIGRAMS = {
  qian: { name: 'Heaven', chinese: '乾', attribute: 'Creative', element: 'Metal' },
  kun: { name: 'Earth', chinese: '坤', attribute: 'Receptive', element: 'Earth' },
  zhen: { name: 'Thunder', chinese: '震', attribute: 'Arousing', element: 'Wood' },
  kan: { name: 'Water', chinese: '坎', attribute: 'Abysmal', element: 'Water' },
  gen: { name: 'Mountain', chinese: '艮', attribute: 'Still', element: 'Earth' },
  xun: { name: 'Wind', chinese: '巽', attribute: 'Gentle', element: 'Wood' },
  li: { name: 'Fire', chinese: '離', attribute: 'Clinging', element: 'Fire' },
  dui: { name: 'Lake', chinese: '兌', attribute: 'Joyous', element: 'Metal' },
};

/**
 * Placeholder hexagram for when data isn't loaded yet
 */
function getPlaceholderHexagram(number: number): HexagramData {
  return {
    number,
    chinese_name: '?',
    pinyin: 'Unknown',
    english_name: `Hexagram ${number}`,
    binary: '000000',
    unicode: '䷀',
    trigram_above: { name: 'Unknown', chinese: '?' },
    trigram_below: { name: 'Unknown', chinese: '?' },
    judgment: 'Loading hexagram data...',
    image: 'Please ensure the hexagram data file is properly loaded.',
    lines: {
      1: 'Line 1 interpretation pending...',
      2: 'Line 2 interpretation pending...',
      3: 'Line 3 interpretation pending...',
      4: 'Line 4 interpretation pending...',
      5: 'Line 5 interpretation pending...',
      6: 'Line 6 interpretation pending...',
    },
    meaning: 'Hexagram data is being loaded. Please wait.',
  };
}

/**
 * Get placeholder data for all 64 hexagrams
 */
function getPlaceholderHexagrams(): HexagramData[] {
  return Array.from({ length: 64 }, (_, i) => getPlaceholderHexagram(i + 1));
}

/**
 * Validate hexagram data structure
 */
export function validateHexagramData(data: unknown): data is HexagramData {
  if (!data || typeof data !== 'object') return false;

  const hex = data as Record<string, unknown>;

  return (
    typeof hex.number === 'number' &&
    hex.number >= 1 &&
    hex.number <= 64 &&
    typeof hex.chinese_name === 'string' &&
    typeof hex.pinyin === 'string' &&
    typeof hex.english_name === 'string' &&
    typeof hex.binary === 'string' &&
    hex.binary.length === 6 &&
    typeof hex.unicode === 'string' &&
    typeof hex.trigram_above === 'object' &&
    typeof hex.trigram_below === 'object' &&
    typeof hex.judgment === 'string' &&
    typeof hex.image === 'string' &&
    typeof hex.lines === 'object' &&
    typeof hex.meaning === 'string'
  );
}
