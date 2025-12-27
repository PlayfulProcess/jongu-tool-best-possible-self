// Custom Tarot Deck API Library

import { CustomTarotDeck, DeckOption } from '@/types/custom-tarot.types';

// Use local mock API if no external API is configured
// Set NEXT_PUBLIC_TAROT_CHANNEL_API to point to jongu-wellness when ready
const TAROT_CHANNEL_API = process.env.NEXT_PUBLIC_TAROT_CHANNEL_API || '';

// If no external API, use local mock API
const getApiBase = () => {
  if (TAROT_CHANNEL_API) {
    return TAROT_CHANNEL_API;
  }
  // Use local API (mock data)
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return '';
};

// Cache for loaded decks
const deckCache = new Map<string, CustomTarotDeck>();

// Cache for deck list
let deckListCache: DeckOption[] | null = null;
let deckListCacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch list of published decks from the Tarot Channel
 */
export async function fetchPublishedDecks(): Promise<DeckOption[]> {
  // Return cached list if still valid
  if (deckListCache && Date.now() - deckListCacheTime < CACHE_TTL) {
    return deckListCache;
  }

  const apiBase = getApiBase();

  // If no API available (server-side without config), return empty
  if (!apiBase) {
    return [];
  }

  try {
    const res = await fetch(`${apiBase}/api/tarot-channel/decks`, {
      cache: 'no-store' // Don't cache during development
    });

    if (!res.ok) {
      console.warn('Failed to fetch decks:', res.status);
      return [];
    }

    const data = await res.json();
    const decks = data.decks || data || [];

    deckListCache = decks.map((d: CustomTarotDeck) => ({
      id: d.id,
      name: d.name,
      creator_name: d.creator_name,
      card_count: d.card_count,
      is_custom: true
    }));
    deckListCacheTime = Date.now();

    return deckListCache;
  } catch (error) {
    console.error('Failed to fetch decks:', error);
    return [];
  }
}

/**
 * Fetch a specific deck with all its cards
 */
export async function fetchDeckWithCards(deckId: string): Promise<CustomTarotDeck | null> {
  // Check cache first
  if (deckCache.has(deckId)) {
    return deckCache.get(deckId)!;
  }

  const apiBase = getApiBase();

  if (!apiBase) {
    return null;
  }

  try {
    const res = await fetch(`${apiBase}/api/tarot-channel/decks/${deckId}`);

    if (!res.ok) {
      console.warn('Failed to fetch deck:', deckId, res.status);
      return null;
    }

    const deck = await res.json();
    deckCache.set(deckId, deck);
    return deck;
  } catch (error) {
    console.error('Failed to fetch deck:', error);
    return null;
  }
}

/**
 * Get the URL for the tarot viewer (external app)
 */
export function getTarotViewerUrl(deckId: string): string {
  // This will point to the viewer in recursive-creator
  const viewerBase = process.env.NEXT_PUBLIC_TAROT_VIEWER_URL || 'https://recursive-creator.vercel.app';
  return `${viewerBase}/tarot-viewer/${deckId}`;
}

/**
 * Clear the deck cache (useful after publishing a new deck)
 */
export function clearDeckCache(): void {
  deckCache.clear();
  deckListCache = null;
}

/**
 * Pre-load a deck into cache (for offline use or faster switching)
 */
export async function preloadDeck(deckId: string): Promise<void> {
  if (!deckCache.has(deckId)) {
    await fetchDeckWithCards(deckId);
  }
}
