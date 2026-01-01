'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { CustomTarotCard, DeckOption } from '@/types/custom-tarot.types';
import { TarotCard } from '@/types/tarot.types';
import { getCreatorEditUrl, forkDeck, fetchAllDecks, addCardToExistingDeck } from '@/lib/custom-tarot';

// Combined card type that supports both formats
type CardData = CustomTarotCard | TarotCard;

interface CardDetailModalProps {
  card: CardData;
  isReversed: boolean;
  position: 'past' | 'present' | 'future';
  deckId: string;
  deckName?: string;
  isUserDeck: boolean; // True if user owns this deck
  userId?: string | null; // Current user ID
  onClose: () => void;
}

// Helper to get card ID from either format
function getCardId(card: CardData): string {
  if ('id' in card && card.id) {
    return card.id;
  }
  // Fallback: generate ID from name
  return card.name.toLowerCase().replace(/\s+/g, '-');
}

// Helper to get image URL from either format
function getImageUrl(card: CardData): string {
  if ('image_url' in card && card.image_url) {
    return card.image_url;
  }
  if ('imageUrl' in card && card.imageUrl) {
    return card.imageUrl;
  }
  return '';
}

// Helper to get keywords array
function getKeywords(card: CardData): string[] {
  if ('keywords' in card && Array.isArray(card.keywords)) {
    return card.keywords;
  }
  return [];
}

export function CardDetailModal({
  card,
  isReversed,
  position,
  deckId,
  deckName,
  isUserDeck,
  userId,
  onClose
}: CardDetailModalProps) {
  const [isForking, setIsForking] = useState(false);
  const [forkError, setForkError] = useState<string | null>(null);

  // Deck selection state
  const [showDeckSelector, setShowDeckSelector] = useState(false);
  const [userDecks, setUserDecks] = useState<DeckOption[]>([]);
  const [loadingDecks, setLoadingDecks] = useState(false);
  const [addingToDeck, setAddingToDeck] = useState<string | null>(null); // ID of deck being added to

  const cardId = getCardId(card);
  const imageUrl = getImageUrl(card);
  const keywords = getKeywords(card);

  // Get extended card fields if available
  const extendedCard = card as CustomTarotCard;
  const hasExtendedData = 'interpretation' in card || 'summary' in card;

  // Load user's decks when deck selector is shown
  useEffect(() => {
    if (showDeckSelector && userId) {
      loadUserDecks();
    }
  }, [showDeckSelector, userId]);

  const loadUserDecks = async () => {
    if (!userId) return;

    setLoadingDecks(true);
    try {
      const allDecks = await fetchAllDecks(userId);
      // Filter to only user's own decks
      const ownDecks = allDecks.filter(d => d.source === 'user');
      setUserDecks(ownDecks);
    } catch (error) {
      console.error('Failed to load user decks:', error);
    } finally {
      setLoadingDecks(false);
    }
  };

  const handleEditInCreator = () => {
    const url = getCreatorEditUrl(deckId, cardId);
    window.open(url, '_blank');
  };

  const handleEditMyCopyClick = async () => {
    if (!userId) {
      setForkError('Please sign in to create your own copy');
      return;
    }

    // Load user's decks to see if they have any
    setLoadingDecks(true);
    try {
      const allDecks = await fetchAllDecks(userId);
      const ownDecks = allDecks.filter(d => d.source === 'user');
      setUserDecks(ownDecks);

      if (ownDecks.length === 0) {
        // No existing decks - fork directly (first time experience)
        await handleForkAndEdit();
      } else {
        // Has existing decks - show selection modal
        setShowDeckSelector(true);
      }
    } catch (error) {
      console.error('Failed to check user decks:', error);
      // Fallback to direct fork
      await handleForkAndEdit();
    } finally {
      setLoadingDecks(false);
    }
  };

  const handleForkAndEdit = async () => {
    if (!userId) {
      setForkError('Please sign in to create your own copy');
      return;
    }

    setIsForking(true);
    setForkError(null);

    try {
      const newDeckId = await forkDeck(deckId, userId);

      if (newDeckId) {
        // Redirect to creator with the forked deck and specific card
        const url = getCreatorEditUrl(newDeckId, cardId);
        window.open(url, '_blank');
        onClose();
      } else {
        setForkError('Failed to create your copy. Please try again.');
      }
    } catch (error) {
      console.error('Fork failed:', error);
      setForkError('Something went wrong. Please try again.');
    } finally {
      setIsForking(false);
    }
  };

  const handleAddToExistingDeck = async (targetDeckId: string) => {
    console.log('[CardDetailModal] handleAddToExistingDeck called with targetDeckId:', targetDeckId);

    if (!userId) {
      setForkError('Please sign in to add cards');
      return;
    }

    setAddingToDeck(targetDeckId);
    setForkError(null);

    try {
      // Convert the card to CustomTarotCard format for adding
      const cardToAdd: CustomTarotCard = {
        id: cardId,
        name: card.name,
        keywords: keywords,
        image_url: imageUrl,
        sort_order: 0, // Will be updated by addCardToExistingDeck
        // Copy extended fields if available
        ...('arcana' in card && { arcana: card.arcana }),
        ...('suit' in card && { suit: card.suit }),
        ...('number' in card && { number: card.number }),
        ...('summary' in card && { summary: (card as CustomTarotCard).summary }),
        ...('interpretation' in card && { interpretation: (card as CustomTarotCard).interpretation }),
        ...('reversed_interpretation' in card && { reversed_interpretation: (card as CustomTarotCard).reversed_interpretation }),
        ...('symbols' in card && { symbols: (card as CustomTarotCard).symbols }),
        ...('element' in card && { element: (card as CustomTarotCard).element }),
        ...('affirmation' in card && { affirmation: (card as CustomTarotCard).affirmation }),
        ...('questions' in card && { questions: (card as CustomTarotCard).questions }),
      };

      console.log('[CardDetailModal] Calling addCardToExistingDeck with:', { targetDeckId, cardId: cardToAdd.id, userId });
      const result = await addCardToExistingDeck(targetDeckId, cardToAdd, userId);
      console.log('[CardDetailModal] addCardToExistingDeck result:', result);

      if (result?.success) {
        // Open creator with the deck - the card is now added
        const url = getCreatorEditUrl(targetDeckId, cardId);
        console.log('[CardDetailModal] Opening Creator URL:', url);
        window.open(url, '_blank');
        onClose();
      } else {
        console.error('[CardDetailModal] addCardToExistingDeck returned failure or null');
        setForkError('Failed to add card to deck. Please try again.');
      }
    } catch (error) {
      console.error('[CardDetailModal] Failed to add card:', error);
      setForkError('Something went wrong. Please try again.');
    } finally {
      setAddingToDeck(null);
    }
  };

  const positionLabels = {
    past: 'Past',
    present: 'Present',
    future: 'Future'
  };

  // Deck Selection Modal
  if (showDeckSelector) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 rounded-xl max-w-md w-full max-h-[80vh] overflow-hidden shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-700 flex justify-between items-center shrink-0">
            <div>
              <h3 className="text-lg font-semibold text-white">Choose Destination</h3>
              <p className="text-sm text-gray-400">Where do you want to edit &ldquo;{card.name}&rdquo;?</p>
            </div>
            <button
              onClick={() => setShowDeckSelector(false)}
              className="text-gray-400 hover:text-white text-xl p-1"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto flex-1 p-4 space-y-3">
            {/* Create New Copy Option */}
            <button
              onClick={handleForkAndEdit}
              disabled={isForking}
              className="w-full p-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-lg text-left transition-all disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">✨</span>
                <div>
                  <p className="text-white font-medium">Create New Deck Copy</p>
                  <p className="text-purple-200 text-sm">
                    {isForking ? 'Creating...' : `Fork "${deckName}" and edit this card`}
                  </p>
                </div>
              </div>
            </button>

            {/* Divider */}
            {userDecks.length > 0 && (
              <div className="flex items-center gap-3 py-2">
                <div className="flex-1 border-t border-gray-700"></div>
                <span className="text-gray-500 text-sm">or add to existing deck</span>
                <div className="flex-1 border-t border-gray-700"></div>
              </div>
            )}

            {/* Existing Decks */}
            {loadingDecks ? (
              <div className="text-center py-4 text-gray-400">Loading your decks...</div>
            ) : (
              userDecks.map(deck => (
                <button
                  key={deck.id}
                  onClick={() => handleAddToExistingDeck(deck.id)}
                  disabled={addingToDeck !== null}
                  className={`w-full p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-left transition-colors border-2 disabled:opacity-50 ${
                    addingToDeck === deck.id ? 'border-purple-500' : 'border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-14 bg-purple-900/50 rounded flex items-center justify-center text-lg">
                      {addingToDeck === deck.id ? (
                        <span className="animate-spin">⏳</span>
                      ) : (
                        '🃏'
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{deck.name}</p>
                      <p className="text-gray-400 text-sm">
                        {addingToDeck === deck.id ? (
                          'Adding card...'
                        ) : (
                          <>
                            {deck.card_count} cards → {deck.card_count + 1}
                            {deck.forked_from && <span className="ml-2 text-purple-400">(forked)</span>}
                          </>
                        )}
                      </p>
                    </div>
                    <span className="text-green-400">+</span>
                  </div>
                </button>
              ))
            )}

            {/* Error message in deck selector */}
            {forkError && (
              <p className="text-red-400 text-sm text-center py-2">{forkError}</p>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-700 shrink-0">
            <button
              onClick={() => setShowDeckSelector(false)}
              className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main Card Detail Modal
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex justify-between items-center shrink-0 bg-gradient-to-r from-purple-900/50 to-indigo-900/50">
          <div>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              {card.name}
              {isReversed && <span className="text-sm text-purple-300">(Reversed)</span>}
            </h3>
            <p className="text-sm text-gray-400">
              {positionLabels[position]} position
              {deckName && <span className="ml-2 text-purple-400">from {deckName}</span>}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl p-1"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-4">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Card Image */}
            <div className="shrink-0 mx-auto md:mx-0">
              <div className={`relative w-40 h-60 rounded-lg overflow-hidden shadow-lg ${isReversed ? 'rotate-180' : ''}`}>
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={card.name}
                    fill
                    className="object-contain"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full bg-purple-900/50 flex items-center justify-center">
                    <span className="text-4xl">🃏</span>
                  </div>
                )}
              </div>
              {isReversed && (
                <p className="text-center text-purple-400 text-xs mt-2">Card is reversed</p>
              )}
            </div>

            {/* Card Details */}
            <div className="flex-1 space-y-4">
              {/* Keywords */}
              {keywords.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Keywords</h4>
                  <div className="flex flex-wrap gap-2">
                    {keywords.map((keyword, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-purple-600/30 text-purple-200 text-sm rounded"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Summary */}
              {extendedCard.summary && (
                <div>
                  <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Summary</h4>
                  <p className="text-gray-200 text-sm">{extendedCard.summary}</p>
                </div>
              )}

              {/* Interpretation (upright or reversed) */}
              {hasExtendedData && (
                <div>
                  <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                    {isReversed ? 'Reversed Meaning' : 'Interpretation'}
                  </h4>
                  <p className="text-gray-200 text-sm">
                    {isReversed && extendedCard.reversed_interpretation
                      ? extendedCard.reversed_interpretation
                      : extendedCard.interpretation || 'No interpretation available'}
                  </p>
                </div>
              )}

              {/* Arcana & Suit Info */}
              {(extendedCard.arcana || extendedCard.suit) && (
                <div className="flex gap-4 text-sm">
                  {extendedCard.arcana && (
                    <div>
                      <span className="text-gray-400">Arcana:</span>{' '}
                      <span className="text-purple-300 capitalize">{extendedCard.arcana}</span>
                    </div>
                  )}
                  {extendedCard.suit && (
                    <div>
                      <span className="text-gray-400">Suit:</span>{' '}
                      <span className="text-purple-300 capitalize">{extendedCard.suit}</span>
                    </div>
                  )}
                  {extendedCard.element && (
                    <div>
                      <span className="text-gray-400">Element:</span>{' '}
                      <span className="text-purple-300 capitalize">{extendedCard.element}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Symbols */}
              {extendedCard.symbols && extendedCard.symbols.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Symbols</h4>
                  <div className="flex flex-wrap gap-2">
                    {extendedCard.symbols.map((symbol, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-indigo-600/30 text-indigo-200 text-sm rounded"
                      >
                        {symbol}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Affirmation */}
              {extendedCard.affirmation && (
                <div className="p-3 bg-purple-900/30 rounded-lg border border-purple-700/50">
                  <h4 className="text-xs font-medium text-purple-400 uppercase tracking-wider mb-1">Affirmation</h4>
                  <p className="text-purple-100 italic">&ldquo;{extendedCard.affirmation}&rdquo;</p>
                </div>
              )}

              {/* Questions for Reflection */}
              {extendedCard.questions && extendedCard.questions.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Questions for Reflection</h4>
                  <ul className="space-y-1">
                    {extendedCard.questions.map((question, i) => (
                      <li key={i} className="text-gray-300 text-sm flex items-start gap-2">
                        <span className="text-purple-400">?</span>
                        {question}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer with Edit Actions */}
        <div className="p-4 border-t border-gray-700 shrink-0 bg-gray-800/80">
          {forkError && (
            <p className="text-red-400 text-sm mb-3 text-center">{forkError}</p>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Close
            </button>

            {deckId === 'unknown' ? (
              // Unknown deck - can't edit, just view
              <button
                disabled
                className="flex-1 px-4 py-2 bg-gray-600 text-gray-400 rounded-lg font-medium cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span>ℹ️</span>
                View Only
              </button>
            ) : isUserDeck ? (
              // User owns this deck - direct edit
              <button
                onClick={handleEditInCreator}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2"
              >
                <span>✏️</span>
                Edit in Creator
              </button>
            ) : (
              // Community deck - show deck selector or fork
              <button
                onClick={handleEditMyCopyClick}
                disabled={isForking || loadingDecks || !userId}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isForking || loadingDecks ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    {isForking ? 'Creating Copy...' : 'Loading...'}
                  </>
                ) : (
                  <>
                    <span>📝</span>
                    {userId ? 'Edit My Copy' : 'Sign in to Edit'}
                  </>
                )}
              </button>
            )}
          </div>

          {deckId === 'unknown' ? (
            <p className="text-center text-gray-500 text-xs mt-2">
              Deck info unavailable for older readings
            </p>
          ) : !isUserDeck && userId && (
            <p className="text-center text-gray-500 text-xs mt-2">
              Customize this card&apos;s meaning in your own deck
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
