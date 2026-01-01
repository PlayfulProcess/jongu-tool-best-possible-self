'use client';

import { useState, useEffect } from 'react';
import { fetchAllDecks, getTarotViewerUrl, getDefaultDeckId, getCreatorNewDeckUrl } from '@/lib/custom-tarot';
import { DeckOption } from '@/types/custom-tarot.types';

interface TarotDeckSelectorProps {
  selectedDeckId: string | null;
  onDeckChange: (deckId: string) => void;
  userLastDeckId?: string | null; // From user's most recent tarot reading
  userId?: string | null; // Current user ID for fetching their decks
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
  userId,
  disabled = false
}: TarotDeckSelectorProps) {
  const [decks, setDecks] = useState<DeckOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const [previewDeck, setPreviewDeck] = useState<DeckOption | null>(null);

  const selectedDeck = decks.find(d => d.id === selectedDeckId);

  // Separate user decks from community decks
  const userDecks = decks.filter(d => d.source === 'user');
  const communityDecks = decks.filter(d => d.source === 'community');

  // Load decks and set default selection
  useEffect(() => {
    async function loadDecks() {
      try {
        setLoading(true);
        const loadedDecks = await fetchAllDecks(userId);
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
  }, [userLastDeckId, userId]);

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

  const handleCreateNewDeck = () => {
    window.open(getCreatorNewDeckUrl(), '_blank');
  };

  const renderDeckGrid = (deckList: DeckOption[], title?: string) => (
    <>
      {title && (
        <h4 className="text-sm font-medium text-gray-400 mb-2 mt-4 first:mt-0">
          {title}
        </h4>
      )}
      <div className="grid grid-cols-3 gap-3">
        {deckList.map(deck => (
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

            {/* User deck badge */}
            {deck.source === 'user' && (
              <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-purple-600 text-white text-[10px] font-medium rounded">
                Your Deck
              </div>
            )}

            {/* Forked badge */}
            {deck.forked_from && (
              <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-indigo-600 text-white text-[10px] font-medium rounded">
                Forked
              </div>
            )}

            {/* Deck Name Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
              <p className="text-white text-xs font-medium truncate">{deck.name}</p>
            </div>
          </button>
        ))}
      </div>
    </>
  );

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
          {selectedDeck.source === 'user' && <span className="ml-1 text-purple-300">(Your deck)</span>}
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

            {/* Create Your Own Button - Prominent at top */}
            <div className="p-4 border-b border-gray-700 shrink-0">
              <button
                onClick={handleCreateNewDeck}
                className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                <span className="text-lg">✨</span>
                <span>Create Your Own Deck</span>
              </button>
              <p className="text-center text-gray-400 text-xs mt-2">
                Design your own tarot deck in the Creator Studio
              </p>
            </div>

            {/* Deck Grid */}
            <div className="overflow-y-auto flex-1 p-4">
              {/* User's Decks Section */}
              {userDecks.length > 0 && renderDeckGrid(userDecks, '📚 Your Decks')}

              {/* Community Decks Section */}
              {communityDecks.length > 0 && renderDeckGrid(communityDecks, userDecks.length > 0 ? '🌍 Community Decks' : undefined)}

              {/* Empty State */}
              {decks.length === 0 && !loading && (
                <div className="text-center py-8">
                  <p className="text-gray-400 mb-4">No decks available yet.</p>
                  <button
                    onClick={handleCreateNewDeck}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
                  >
                    Create Your First Deck
                  </button>
                </div>
              )}
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
                    {previewDeck.source === 'user' && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-purple-600/50 text-purple-200 text-xs rounded">
                        Your deck
                      </span>
                    )}
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
