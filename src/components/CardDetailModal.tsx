'use client';

import { useState } from 'react';
import Image from 'next/image';
import { CustomTarotCard } from '@/types/custom-tarot.types';
import { TarotCard } from '@/types/tarot.types';
import { getCreatorEditUrl, forkDeck } from '@/lib/custom-tarot';

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

  const cardId = getCardId(card);
  const imageUrl = getImageUrl(card);
  const keywords = getKeywords(card);

  // Get extended card fields if available
  const extendedCard = card as CustomTarotCard;
  const hasExtendedData = 'interpretation' in card || 'summary' in card;

  const handleEditInCreator = () => {
    const url = getCreatorEditUrl(deckId, cardId);
    window.open(url, '_blank');
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

  const positionLabels = {
    past: 'Past',
    present: 'Present',
    future: 'Future'
  };

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

            {isUserDeck ? (
              // User owns this deck - direct edit
              <button
                onClick={handleEditInCreator}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2"
              >
                <span>✏️</span>
                Edit in Creator
              </button>
            ) : (
              // Community deck - fork and edit
              <button
                onClick={handleForkAndEdit}
                disabled={isForking || !userId}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isForking ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Creating Copy...
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

          {!isUserDeck && userId && (
            <p className="text-center text-gray-500 text-xs mt-2">
              Creates your own copy of this deck so you can customize the meaning
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
