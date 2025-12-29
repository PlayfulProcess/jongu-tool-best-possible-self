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
 * Returns decks sorted by created_at ASC (oldest first - Rider-Waite will be first)
 */
export async function fetchPublishedDecks(): Promise<DeckOption[]> {
  // Return cached list if still valid
  if (deckListCache && Date.now() - deckListCacheTime < CACHE_TTL) {
    return deckListCache;
  }

  const apiBase = getApiBase();
  console.log('API base for tarot channel:', apiBase);

  // If no API available (server-side without config), return empty
  if (!apiBase) {
    console.log('No API base available');
    return [];
  }

  try {
    const url = `${apiBase}/api/tarot-channel/decks`;
    console.log('Fetching decks from:', url);
    const res = await fetch(url, {
      cache: 'no-store' // Don't cache during development
    });
    console.log('Response status:', res.status);

    if (!res.ok) {
      console.warn('Failed to fetch decks:', res.status);
      return [];
    }

    const data = await res.json();
    const decks = data.decks || data || [];

    // Map decks with all fields including cover_image_url
    const mappedDecks: DeckOption[] = decks.map((d: CustomTarotDeck & { created_at?: string }) => ({
      id: d.id,
      name: d.name,
      description: d.description,
      creator_name: d.creator_name,
      cover_image_url: d.cover_image_url,
      card_count: d.card_count,
      created_at: d.created_at
    }));

    // Sort by created_at ascending (oldest first - Rider-Waite will be first)
    mappedDecks.sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateA - dateB;
    });

    deckListCache = mappedDecks;
    deckListCacheTime = Date.now();

    return mappedDecks;
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
 * Get the URL for the tarot viewer (environment-aware)
 * dev.journal.recursive.eco → dev.recursive.eco
 * journal.recursive.eco → recursive.eco
 */
export function getTarotViewerUrl(deckId: string): string {
  if (typeof window === 'undefined') {
    return `https://recursive.eco/pages/tarot-viewer.html?deckId=${deckId}`;
  }

  const host = window.location.hostname;

  if (host.includes('dev.') || host.includes('localhost')) {
    return `https://dev.recursive.eco/pages/tarot-viewer.html?deckId=${deckId}`;
  }

  return `https://recursive.eco/pages/tarot-viewer.html?deckId=${deckId}`;
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

/**
 * Get the default deck ID for a user
 * - If user has a last used deck and it still exists, use it
 * - Otherwise return the oldest deck (first in ASC sorted list = Rider-Waite)
 */
export function getDefaultDeckId(
  decks: DeckOption[],
  userLastDeckId?: string | null
): string | null {
  if (decks.length === 0) return null;

  // If user has a last used deck and it still exists, use it
  if (userLastDeckId && decks.some(d => d.id === userLastDeckId)) {
    return userLastDeckId;
  }

  // Otherwise return the oldest deck (first in ASC sorted list)
  return decks[0].id;
}
