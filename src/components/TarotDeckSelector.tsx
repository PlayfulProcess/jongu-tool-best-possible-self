'use client';

import { useState, useEffect } from 'react';
import { fetchPublishedDecks, getTarotViewerUrl } from '@/lib/custom-tarot';
import { DeckOption } from '@/types/custom-tarot.types';

interface TarotDeckSelectorProps {
  selectedDeckId: string;
  onDeckChange: (deckId: string) => void;
  disabled?: boolean;
}

const RIDER_WAITE_ID = 'rider-waite';

export function TarotDeckSelector({
  selectedDeckId,
  onDeckChange,
  disabled = false
}: TarotDeckSelectorProps) {
  const [communityDecks, setCommunityDecks] = useState<DeckOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCommunityPopup, setShowCommunityPopup] = useState(false);

  const isClassical = selectedDeckId === RIDER_WAITE_ID;
  const selectedCommunityDeck = communityDecks.find(d => d.id === selectedDeckId);

  useEffect(() => {
    async function loadDecks() {
      try {
        setLoading(true);
        const customDecks = await fetchPublishedDecks();
        setCommunityDecks(customDecks);

        // After loading decks, validate localStorage saved selection
        if (typeof window !== 'undefined') {
          const saved = localStorage.getItem('selectedTarotDeck');
          if (saved && saved !== RIDER_WAITE_ID) {
            // Check if saved community deck still exists
            const deckExists = customDecks.some(d => d.id === saved);
            if (deckExists && saved !== selectedDeckId) {
              onDeckChange(saved);
            } else if (!deckExists) {
              // Saved deck no longer exists, clear it and select classical
              localStorage.removeItem('selectedTarotDeck');
              if (selectedDeckId !== RIDER_WAITE_ID) {
                onDeckChange(RIDER_WAITE_ID);
              }
            }
          } else if (saved === RIDER_WAITE_ID && saved !== selectedDeckId) {
            onDeckChange(saved);
          }
        }
      } catch (err) {
        console.error('Failed to load community decks:', err);
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

  // Note: localStorage loading is now handled in loadDecks to validate against available decks

  const handleClassicalClick = () => {
    onDeckChange(RIDER_WAITE_ID);
  };

  const handleCommunityClick = () => {
    if (communityDecks.length === 0) {
      // No community decks available
      return;
    } else if (communityDecks.length === 1) {
      // Only one community deck, select it directly
      onDeckChange(communityDecks[0].id);
    } else {
      // Multiple decks, show popup (for now just select first one)
      // TODO: Implement scrollable popup
      setShowCommunityPopup(true);
    }
  };

  const selectCommunityDeck = (deckId: string) => {
    onDeckChange(deckId);
    setShowCommunityPopup(false);
  };

  return (
    <div className="mb-4">
      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
        Choose Deck
      </label>

      <div className="flex gap-2">
        {/* Classical Button */}
        <button
          onClick={handleClassicalClick}
          disabled={disabled}
          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            isClassical
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          } disabled:opacity-50`}
        >
          🎴 Classical
        </button>

        {/* Community Button */}
        <button
          onClick={handleCommunityClick}
          disabled={disabled || loading || communityDecks.length === 0}
          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            !isClassical
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          } disabled:opacity-50`}
        >
          {loading ? '...' : `✨ Community (${communityDecks.length})`}
        </button>

        {/* Preview Button - show when community deck selected */}
        {!isClassical && selectedCommunityDeck && (
          <a
            href={getTarotViewerUrl(selectedDeckId)}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm transition-colors flex items-center"
            title="Preview full deck"
          >
            👁
          </a>
        )}
      </div>

      {/* Selected deck info */}
      <p className="text-xs text-purple-400 mt-2">
        {isClassical ? (
          'Rider-Waite (78 cards)'
        ) : selectedCommunityDeck ? (
          `${selectedCommunityDeck.name} by ${selectedCommunityDeck.creator_name || 'Unknown'} (${selectedCommunityDeck.card_count} cards)`
        ) : (
          'Select a deck'
        )}
      </p>

      {/* Community Deck Popup */}
      {showCommunityPopup && communityDecks.length > 1 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-md w-full max-h-[70vh] overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white">Community Decks</h3>
              <button
                onClick={() => setShowCommunityPopup(false)}
                className="text-gray-400 hover:text-white text-xl"
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto max-h-[50vh] p-2">
              {communityDecks.map(deck => (
                <button
                  key={deck.id}
                  onClick={() => selectCommunityDeck(deck.id)}
                  className={`w-full text-left p-3 rounded-lg mb-2 transition-all ${
                    deck.id === selectedDeckId
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                  }`}
                >
                  <div className="font-medium">{deck.name}</div>
                  <div className="text-sm opacity-75">
                    by {deck.creator_name || 'Unknown'} • {deck.card_count} cards
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
