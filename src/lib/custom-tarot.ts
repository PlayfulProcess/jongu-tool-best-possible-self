// Custom Tarot Deck API Library

import { CustomTarotDeck, CustomTarotCard, DeckOption } from '@/types/custom-tarot.types';
import { createClient } from '@/lib/supabase-client';

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

// Cache for deck list (keyed by userId for user-specific caching)
const deckListCache = new Map<string, { decks: DeckOption[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// localStorage key for selected deck
const SELECTED_DECK_KEY = 'tarot_selected_deck_id';

/**
 * Get the saved deck ID from localStorage
 */
export function getSavedDeckId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(SELECTED_DECK_KEY);
}

/**
 * Save the selected deck ID to localStorage
 */
export function saveDeckId(deckId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SELECTED_DECK_KEY, deckId);
}

/**
 * Get the Creator URL for editing a deck/card
 * Uses clean URL format: /dashboard/tarot/{deckId}?card={cardSlug}
 * @param deckId - The deck ID to edit
 * @param cardId - Optional card ID (slug format) to focus on
 */
export function getCreatorEditUrl(deckId: string, cardId?: string): string {
  const baseUrl = `https://creator.recursive.eco/dashboard/tarot/${deckId}`;
  if (cardId) {
    return `${baseUrl}?card=${encodeURIComponent(cardId)}`;
  }
  return baseUrl;
}

/**
 * Get the Creator URL for creating a new deck
 */
export function getCreatorNewDeckUrl(): string {
  return 'https://creator.recursive.eco/dashboard/tarot/new';
}

/**
 * Fetch community decks from the tarot channel API
 */
async function fetchCommunityDecks(): Promise<DeckOption[]> {
  const apiBase = getApiBase();

  if (!apiBase) {
    return [];
  }

  try {
    const url = `${apiBase}/api/tarot-channel/decks`;
    const res = await fetch(url, { cache: 'no-store' });

    if (!res.ok) {
      console.warn('Failed to fetch community decks:', res.status);
      return [];
    }

    const data = await res.json();
    const decks = data.decks || data || [];

    return decks.map((d: CustomTarotDeck & { created_at?: string; user_id?: string }) => ({
      id: d.id,
      name: d.name,
      description: d.description,
      creator_name: d.creator_name,
      creator_id: d.user_id,
      cover_image_url: d.cover_image_url,
      card_count: d.card_count,
      created_at: d.created_at,
      source: 'community' as const
    }));
  } catch (error) {
    console.error('Failed to fetch community decks:', error);
    return [];
  }
}

/**
 * Fetch user's own decks from user_documents table
 */
async function fetchUserDecks(userId: string): Promise<DeckOption[]> {
  if (!userId) return [];

  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('user_documents')
      .select('id, document_data, created_at')
      .eq('user_id', userId)
      .eq('document_type', 'tarot_deck');

    if (error) {
      console.error('Failed to fetch user decks:', error);
      return [];
    }

    if (!data) return [];

    return data.map((doc: { id: string; document_data: Record<string, unknown>; created_at: string }) => {
      const deckData = doc.document_data as {
        name?: string;
        description?: string;
        cover_image_url?: string;
        cards?: unknown[];
        forked_from?: string;
      };

      return {
        id: doc.id,
        name: deckData.name || 'Untitled Deck',
        description: deckData.description,
        creator_name: 'You',
        creator_id: userId,
        cover_image_url: deckData.cover_image_url,
        card_count: Array.isArray(deckData.cards) ? deckData.cards.length : 0,
        created_at: doc.created_at,
        source: 'user' as const,
        forked_from: deckData.forked_from
      };
    });
  } catch (error) {
    console.error('Failed to fetch user decks:', error);
    return [];
  }
}

/**
 * Fetch all decks from multiple sources
 * Returns: user's own decks first, then community decks
 */
export async function fetchAllDecks(userId?: string | null): Promise<DeckOption[]> {
  const cacheKey = userId || 'anonymous';
  const cached = deckListCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.decks;
  }

  // Fetch from both sources in parallel
  const [communityDecks, userDecks] = await Promise.all([
    fetchCommunityDecks(),
    userId ? fetchUserDecks(userId) : Promise.resolve([])
  ]);

  // Combine decks: user's decks first, then community decks
  const allDecks = [...userDecks, ...communityDecks];

  // Sort: user decks first (newest first), then community decks (oldest first)
  allDecks.sort((a, b) => {
    // User decks always come first
    if (a.source !== b.source) {
      return a.source === 'user' ? -1 : 1;
    }
    // User decks: newest first; Community decks: oldest first (Rider-Waite)
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return a.source === 'user' ? dateB - dateA : dateA - dateB;
  });

  deckListCache.set(cacheKey, { decks: allDecks, timestamp: Date.now() });
  return allDecks;
}

/**
 * Fetch list of published decks from the Tarot Channel (legacy - for backwards compatibility)
 * Returns decks sorted by created_at ASC (oldest first - Rider-Waite will be first)
 */
export async function fetchPublishedDecks(): Promise<DeckOption[]> {
  // Return cached list if still valid
  const cached = deckListCache.get('anonymous');
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.decks;
  }

  const apiBase = getApiBase();

  // If no API available (server-side without config), return empty
  if (!apiBase) {
    return [];
  }

  try {
    const url = `${apiBase}/api/tarot-channel/decks`;
    const res = await fetch(url, {
      cache: 'no-store' // Don't cache during development
    });

    if (!res.ok) {
      console.warn('Failed to fetch decks:', res.status);
      return [];
    }

    const data = await res.json();
    const decks = data.decks || data || [];

    // Map decks with all fields including cover_image_url
    const mappedDecks: DeckOption[] = decks.map((d: CustomTarotDeck & { created_at?: string; user_id?: string }) => ({
      id: d.id,
      name: d.name,
      description: d.description,
      creator_name: d.creator_name,
      creator_id: d.user_id,
      cover_image_url: d.cover_image_url,
      card_count: d.card_count,
      created_at: d.created_at,
      source: 'community' as const
    }));

    // Sort by created_at ascending (oldest first - Rider-Waite will be first)
    mappedDecks.sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateA - dateB;
    });

    deckListCache.set('anonymous', { decks: mappedDecks, timestamp: Date.now() });
    return mappedDecks;
  } catch (error) {
    console.error('Failed to fetch decks:', error);
    return [];
  }
}

/**
 * Fork a community deck to user's personal collection
 * Returns the new deck ID
 */
export async function forkDeck(originalDeckId: string, userId: string): Promise<string | null> {
  try {
    const supabase = createClient();

    // First, fetch the original deck with all its cards
    const originalDeck = await fetchDeckWithCards(originalDeckId);
    if (!originalDeck) {
      console.error('Original deck not found:', originalDeckId);
      return null;
    }

    // Create a new deck document in user_documents
    // Preserve original card IDs so URL references still work
    const { data: newDeck, error } = await supabase
      .from('user_documents')
      .insert({
        user_id: userId,
        document_type: 'tarot_deck',
        tool_slug: 'tarot-deck',
        is_public: false,
        document_data: {
          name: `${originalDeck.name} (My Version)`,
          description: originalDeck.description,
          cover_image_url: originalDeck.cover_image_url,
          creator_name: originalDeck.creator_name,
          // Keep original card IDs so card= URL param still works
          cards: originalDeck.cards.map((card: CustomTarotCard) => ({
            ...card
          })),
          forked_from: originalDeckId,
          original_deck_name: originalDeck.name,
          is_published: false
        }
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to fork deck:', error);
      return null;
    }

    // Clear cache to include the new deck
    deckListCache.delete(userId);

    return newDeck?.id || null;
  } catch (error) {
    console.error('Failed to fork deck:', error);
    return null;
  }
}

/**
 * Add a card from another deck to an existing user deck
 * Returns the updated card count, or null on failure
 */
export async function addCardToExistingDeck(
  targetDeckId: string,
  cardToAdd: CustomTarotCard,
  userId: string
): Promise<{ success: boolean; cardIndex: number } | null> {
  console.log('[addCardToExistingDeck] Starting with:', { targetDeckId, cardId: cardToAdd.id, userId });

  try {
    const supabase = createClient();

    // Fetch the existing deck
    console.log('[addCardToExistingDeck] Fetching deck from user_documents...');
    const { data: existingDoc, error: fetchError } = await supabase
      .from('user_documents')
      .select('id, user_id, document_data')
      .eq('id', targetDeckId)
      .eq('document_type', 'tarot_deck')
      .eq('user_id', userId) // Ensure user owns this deck
      .single();

    if (fetchError || !existingDoc) {
      console.error('[addCardToExistingDeck] Failed to fetch target deck:', fetchError);
      console.log('[addCardToExistingDeck] Query params were:', { targetDeckId, userId });
      return null;
    }

    console.log('[addCardToExistingDeck] Found deck:', existingDoc.id);

    const deckData = existingDoc.document_data as {
      name?: string;
      cards?: CustomTarotCard[];
      [key: string]: unknown;
    };

    const existingCards = deckData.cards || [];

    // Create new card with updated sort_order (add to end)
    const newCardIndex = existingCards.length;
    const newCard: CustomTarotCard = {
      ...cardToAdd,
      sort_order: newCardIndex,
      // Keep the original ID so we can track where it came from
      // But add metadata about the source
    };

    // Add the card to the deck
    const updatedCards = [...existingCards, newCard];
    console.log('[addCardToExistingDeck] Adding card. New card count:', updatedCards.length);

    // Update the deck in database
    const { error: updateError } = await supabase
      .from('user_documents')
      .update({
        document_data: {
          ...deckData,
          cards: updatedCards
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', targetDeckId)
      .eq('user_id', userId);

    if (updateError) {
      console.error('[addCardToExistingDeck] Failed to update deck:', updateError);
      return null;
    }

    console.log('[addCardToExistingDeck] Successfully added card to deck:', targetDeckId);

    // Clear cache for this deck
    deckCache.delete(targetDeckId);
    deckListCache.delete(userId);

    return { success: true, cardIndex: newCardIndex };
  } catch (error) {
    console.error('Failed to add card to deck:', error);
    return null;
  }
}

/**
 * Fetch a specific deck with all its cards
 * Supports both API decks and user_documents decks
 */
export async function fetchDeckWithCards(deckId: string): Promise<CustomTarotDeck | null> {
  // Check cache first
  if (deckCache.has(deckId)) {
    return deckCache.get(deckId)!;
  }

  // Try API first
  const apiBase = getApiBase();
  if (apiBase) {
    try {
      const res = await fetch(`${apiBase}/api/tarot-channel/decks/${deckId}`);

      if (res.ok) {
        const deck = await res.json();
        deckCache.set(deckId, deck);
        return deck;
      }
    } catch (error) {
      console.warn('API fetch failed, trying user_documents:', error);
    }
  }

  // Try user_documents table for user decks
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('user_documents')
      .select('id, user_id, document_data, created_at')
      .eq('id', deckId)
      .eq('document_type', 'tarot_deck')
      .single();

    if (error || !data) {
      console.warn('Failed to fetch deck from user_documents:', deckId, error);
      return null;
    }

    const deckData = data.document_data as {
      name?: string;
      description?: string;
      cover_image_url?: string;
      cards?: CustomTarotCard[];
      forked_from?: string;
    };

    const deck: CustomTarotDeck = {
      id: data.id,
      name: deckData.name || 'Untitled Deck',
      description: deckData.description,
      creator_name: 'You',
      cover_image_url: deckData.cover_image_url,
      card_count: deckData.cards?.length || 0,
      cards: deckData.cards || [],
      created_at: data.created_at
    };

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
  deckListCache.clear();
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

  // Otherwise return the first deck (community decks start with Rider-Waite)
  // Skip user decks to default to a full community deck
  const communityDeck = decks.find(d => d.source === 'community');
  return communityDeck?.id || decks[0].id;
}
