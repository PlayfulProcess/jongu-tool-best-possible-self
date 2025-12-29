'use client';

import { useState, useEffect } from 'react';
import { fetchPublishedDecks, getTarotViewerUrl, getDefaultDeckId } from '@/lib/custom-tarot';
import { DeckOption } from '@/types/custom-tarot.types';

interface TarotDeckSelectorProps {
  selectedDeckId: string | null;
  onDeckChange: (deckId: string) => void;
  userLastDeckId?: string | null; // From user's most recent tarot reading
  disabled?: boolean;
}

// Default placeholder image for decks without covers
const DEFAULT_COVER = 'data:image/svg+xml,' + encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 300" fill="none">
    <rect width="200" height="300" fill="#1a1a2e"/>
    <rect x="10" y="10" width="180" height="280" rx="8" stroke="#8b5cf6" stroke-width="2" fill="none"/>
    <text x="100" y="140" text-anchor="middle" fill="#8b5cf6" font-size="48">✧</text>
    <text x="100" y="180" text-anchor="middle" fill="#8b5cf6" font-size="12" font-family="serif">TAROT</text>
  </svg>
`);

export function TarotDeckSelector({
  selectedDeckId,
  onDeckChange,
  userLastDeckId,
  disabled = false
}: TarotDeckSelectorProps) {
  const [decks, setDecks] = useState<DeckOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const [previewDeck, setPreviewDeck] = useState<DeckOption | null>(null);

  const selectedDeck = decks.find(d => d.id === selectedDeckId);

  // Load decks and set default selection
  useEffect(() => {
    async function loadDecks() {
      try {
        setLoading(true);
        const loadedDecks = await fetchPublishedDecks();
        setDecks(loadedDecks);

        // Set default selection if none selected
        if (!selectedDeckId && loadedDecks.length > 0) {
          const defaultId = getDefaultDeckId(loadedDecks, userLastDeckId);
          if (defaultId) {
            onDeckChange(defaultId);
          }
        } else if (selectedDeckId && !loadedDecks.some(d => d.id === selectedDeckId)) {
          // Selected deck no longer exists, reset to default
          const defaultId = getDefaultDeckId(loadedDecks, userLastDeckId);
          if (defaultId) {
            onDeckChange(defaultId);
          }
        }
      } catch (err) {
        console.error('Failed to load decks:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDecks();
  }, [userLastDeckId]);

  const handleDeckClick = (deck: DeckOption) => {
    // If clicking the same deck that's in preview, select it
    if (previewDeck?.id === deck.id) {
      return;
    }
    // Show info panel for this deck
    setPreviewDeck(deck);
  };

  const handleSelectDeck = (deckId: string) => {
    onDeckChange(deckId);
    setShowPopup(false);
    setPreviewDeck(null);
  };

  const handleViewDetails = (deckId: string) => {
    window.open(getTarotViewerUrl(deckId), '_blank');
  };

  return (
    <div className="mb-4">
      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
        Choose Deck
      </label>

      <div className="flex gap-2">
        {/* Main Deck Button */}
        <button
          onClick={() => setShowPopup(true)}
          disabled={disabled || loading}
          className="flex-1 px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium transition-all hover:bg-purple-700 disabled:opacity-50 flex items-center justify-between"
        >
          <span className="truncate">
            {loading ? 'Loading...' : selectedDeck ? `🃏 ${selectedDeck.name}` : '🃏 Choose Deck'}
          </span>
          <span className="ml-2">▼</span>
        </button>

        {/* Eye Button - View current deck */}
        {selectedDeck && (
          <button
            onClick={() => handleViewDetails(selectedDeckId!)}
            disabled={disabled}
            className="px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm transition-colors"
            title="View full deck"
          >
            👁
          </button>
        )}
      </div>

      {/* Selected deck info */}
      {selectedDeck && (
        <p className="text-xs text-purple-400 mt-2">
          {selectedDeck.name} by {selectedDeck.creator_name || 'Unknown'} ({selectedDeck.card_count} cards)
        </p>
      )}

      {/* Deck Picker Popup */}
      {showPopup && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-lg w-full max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-700 flex justify-between items-center shrink-0">
              <h3 className="text-lg font-semibold text-white">Choose Deck</h3>
              <button
                onClick={() => { setShowPopup(false); setPreviewDeck(null); }}
                className="text-gray-400 hover:text-white text-xl p-1"
              >
                ✕
              </button>
            </div>

            {/* Deck Grid */}
            <div className="overflow-y-auto flex-1 p-4">
              <div className="grid grid-cols-3 gap-3">
                {decks.map(deck => (
                  <button
                    key={deck.id}
                    onClick={() => handleDeckClick(deck)}
                    className={`relative aspect-[2/3] rounded-lg overflow-hidden transition-all ${
                      previewDeck?.id === deck.id
                        ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-gray-800'
                        : 'hover:ring-2 hover:ring-purple-400 hover:ring-offset-1 hover:ring-offset-gray-800'
                    }`}
                  >
                    {/* Cover Image */}
                    <img
                      src={deck.cover_image_url || DEFAULT_COVER}
                      alt={deck.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = DEFAULT_COVER;
                      }}
                    />

                    {/* Selected Checkmark */}
                    {deck.id === selectedDeckId && (
                      <div className="absolute top-1 right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm">✓</span>
                      </div>
                    )}

                    {/* Deck Name Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                      <p className="text-white text-xs font-medium truncate">{deck.name}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Preview Panel - shows when a deck is clicked */}
            {previewDeck && (
              <div className="border-t border-gray-700 p-4 bg-gray-750 shrink-0">
                <div className="flex gap-3">
                  {/* Mini Cover */}
                  <div className="w-16 h-24 rounded-lg overflow-hidden shrink-0">
                    <img
                      src={previewDeck.cover_image_url || DEFAULT_COVER}
                      alt={previewDeck.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = DEFAULT_COVER;
                      }}
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-semibold truncate">{previewDeck.name}</h4>
                    <p className="text-gray-400 text-sm">
                      by {previewDeck.creator_name || 'Unknown'} • {previewDeck.card_count} cards
                    </p>
                    {previewDeck.description && (
                      <p className="text-gray-500 text-xs mt-1 line-clamp-2">{previewDeck.description}</p>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleViewDetails(previewDeck.id)}
                    className="flex-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => handleSelectDeck(previewDeck.id)}
                    className="flex-1 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-colors flex items-center justify-center gap-1"
                  >
                    <span>✓</span> Select
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
