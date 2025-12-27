'use client';

import { useState, useEffect } from 'react';
import { fetchPublishedDecks, getTarotViewerUrl } from '@/lib/custom-tarot';
import { DeckOption } from '@/types/custom-tarot.types';

interface TarotDeckSelectorProps {
  selectedDeckId: string;
  onDeckChange: (deckId: string) => void;
  disabled?: boolean;
}

const RIDER_WAITE_OPTION: DeckOption = {
  id: 'rider-waite',
  name: 'Rider-Waite (Classic)',
  card_count: 78,
  is_custom: false
};

export function TarotDeckSelector({
  selectedDeckId,
  onDeckChange,
  disabled = false
}: TarotDeckSelectorProps) {
  const [decks, setDecks] = useState<DeckOption[]>([RIDER_WAITE_OPTION]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDecks() {
      try {
        setLoading(true);
        setError(null);
        const customDecks = await fetchPublishedDecks();
        setDecks([RIDER_WAITE_OPTION, ...customDecks]);
      } catch (err) {
        console.error('Failed to load decks:', err);
        setError('Could not load custom decks');
      } finally {
        setLoading(false);
      }
    }
    loadDecks();
  }, []);

  // Persist selection to localStorage
  useEffect(() => {
    if (selectedDeckId && typeof window !== 'undefined') {
      localStorage.setItem('selectedTarotDeck', selectedDeckId);
    }
  }, [selectedDeckId]);

  // Load saved selection on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('selectedTarotDeck');
      if (saved && saved !== selectedDeckId) {
        onDeckChange(saved);
      }
    }
  }, []);

  const selectedDeck = decks.find(d => d.id === selectedDeckId);
  const showPreviewButton = selectedDeck?.is_custom;

  return (
    <div className="mb-3">
      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
        Deck
      </label>
      <div className="flex gap-2">
        <select
          value={selectedDeckId}
          onChange={(e) => onDeckChange(e.target.value)}
          disabled={disabled || loading}
          className="flex-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
        >
          {loading ? (
            <option>Loading decks...</option>
          ) : (
            decks.map(deck => (
              <option key={deck.id} value={deck.id}>
                {deck.name}
                {deck.creator_name ? ` by ${deck.creator_name}` : ''}
                {' '}({deck.card_count} cards)
              </option>
            ))
          )}
        </select>

        {showPreviewButton && (
          <a
            href={getTarotViewerUrl(selectedDeckId)}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-colors flex items-center gap-1"
            title="Preview full deck in new tab"
          >
            <span>👁</span>
            <span className="hidden sm:inline">View</span>
          </a>
        )}
      </div>

      {error && (
        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
          {error} - Using Rider-Waite only
        </p>
      )}

      {selectedDeck?.is_custom && (
        <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
          Custom deck by {selectedDeck.creator_name || 'Unknown'}
        </p>
      )}
    </div>
  );
}
