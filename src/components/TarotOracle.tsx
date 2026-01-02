'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { drawThreeCardsFromCustomDeck, formatPosition } from '@/lib/tarot'
import { fetchDeckWithCards, fetchAllDecks } from '@/lib/custom-tarot'
import { TarotReading, DrawnCard } from '@/types/tarot.types'
import { CustomTarotDeck, DeckOption } from '@/types/custom-tarot.types'
import { TarotDeckSelector } from './TarotDeckSelector'
import { CardDetailModal } from './CardDetailModal'

interface TarotOracleProps {
  onReadingComplete?: (reading: TarotReading) => void
  onReadingClear?: () => void
  readings?: TarotReading[]
  userLastDeckId?: string | null // From user's most recent tarot reading in database
  userId?: string | null // Current user ID for deck ownership
  initialDeckId?: string | null // Pre-select deck from URL parameter
}

// State for showing card detail modal
interface CardDetailState {
  card: DrawnCard
  deckId: string
  deckName?: string
  isUserDeck: boolean
}

export function TarotOracle({
  onReadingComplete,
  onReadingClear,
  readings: externalReadings = [],
  userLastDeckId,
  userId,
  initialDeckId
}: TarotOracleProps) {
  // Auto-open when initialDeckId is provided from URL
  const [isOpen, setIsOpen] = useState(!!initialDeckId)
  const [readings, setReadings] = useState<TarotReading[]>(externalReadings)
  const [isDrawing, setIsDrawing] = useState(false)
  const [expandedReadings, setExpandedReadings] = useState<Set<number>>(new Set())
  const [question, setQuestion] = useState('')

  // Deck selection state - pre-select from URL param if provided
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(initialDeckId || null)
  const [currentDeck, setCurrentDeck] = useState<CustomTarotDeck | null>(null)
  const [loadingDeck, setLoadingDeck] = useState(false)

  // Deck metadata for ownership tracking
  const [deckOptions, setDeckOptions] = useState<DeckOption[]>([])

  // Card detail modal state
  const [cardDetail, setCardDetail] = useState<CardDetailState | null>(null)

  // Sync with external readings (including when cleared)
  useEffect(() => {
    setReadings(externalReadings)
    if (externalReadings.length > 0) {
      setIsOpen(true)
      setExpandedReadings(new Set([externalReadings.length - 1]))
    }
  }, [externalReadings])

  // Load deck options for ownership tracking
  useEffect(() => {
    async function loadDeckOptions() {
      const options = await fetchAllDecks(userId)
      setDeckOptions(options)
    }
    loadDeckOptions()
  }, [userId])

  // Load deck when selection changes - all decks come from database
  useEffect(() => {
    if (!selectedDeckId) {
      setCurrentDeck(null)
      return
    }

    const deckIdToLoad = selectedDeckId // Capture for async closure

    async function loadDeck() {
      setLoadingDeck(true)
      try {
        const deck = await fetchDeckWithCards(deckIdToLoad)
        setCurrentDeck(deck)
      } catch (error) {
        console.error('Failed to load deck:', error)
        setCurrentDeck(null)
      } finally {
        setLoadingDeck(false)
      }
    }

    loadDeck()
  }, [selectedDeckId])

  const handleDraw = async () => {
    if (!question.trim()) return

    // Don't allow drawing if loading deck or no deck selected
    if (loadingDeck || !currentDeck) {
      console.error('Deck not loaded')
      return
    }

    setIsDrawing(true)

    try {
      // All decks come from database now
      const newReading = drawThreeCardsFromCustomDeck(currentDeck.cards, question, selectedDeckId!)

      setReadings(prev => [...prev, newReading])
      setIsOpen(true)
      setExpandedReadings(new Set([readings.length]))
      setQuestion('')

      if (onReadingComplete) {
        onReadingComplete(newReading)
      }
    } catch (error) {
      console.error('Error drawing cards:', error)
    } finally {
      setIsDrawing(false)
    }
  }

  const handleClearReadings = () => {
    setReadings([])
    setExpandedReadings(new Set())
    setIsOpen(false)
    onReadingClear?.()
  }

  const toggleReading = (index: number) => {
    setExpandedReadings(prev => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  // Handle card click to show detail modal
  const handleCardClick = (drawnCard: DrawnCard, reading: TarotReading) => {
    const deckId = reading.deckId || selectedDeckId

    // Find deck info from options
    const deckOption = deckId ? deckOptions.find(d => d.id === deckId) : null
    const isUserDeck = deckOption?.source === 'user' || deckOption?.creator_id === userId

    // Show modal even without deckId - user can still view card details
    // Edit functionality will be limited if no deckId
    setCardDetail({
      card: drawnCard,
      deckId: deckId || 'unknown',
      deckName: deckOption?.name || currentDeck?.name || 'Unknown Deck',
      isUserDeck: isUserDeck || false
    })
  }

  return (
    <div>
      {/* Toggle Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg hover:from-purple-600 hover:to-indigo-600 transition-all"
        >
          🃏 Tarot {isOpen ? '▼' : '▶'}
        </button>

        {/* Quick status indicator when collapsed */}
        {!isOpen && readings.length > 0 && (
          <span className="text-sm text-purple-600 dark:text-purple-400">
            {readings.length} reading{readings.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Collapsible Panel */}
      {isOpen && (
        <div className="mt-4 border border-purple-200 dark:border-purple-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-purple-200 dark:border-purple-700 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20">
            <h3 className="font-semibold text-purple-800 dark:text-purple-200">
              Tarot - 3 Card Spread {readings.length > 0 && `(${readings.length} reading${readings.length !== 1 ? 's' : ''})`}
            </h3>
            <div className="flex items-center gap-2">
              {readings.length > 0 && (
                <button
                  onClick={handleClearReadings}
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Clear All
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Previous Readings as Collapsible Cards */}
            {readings.map((reading, index) => (
              <div
                key={`${reading.timestamp}-${index}`}
                className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
              >
                {/* Reading Header - Always Visible */}
                <button
                  onClick={() => toggleReading(index)}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      {reading.cards.map((drawnCard, cardIndex) => (
                        <div
                          key={cardIndex}
                          className="w-8 h-12 bg-purple-100 dark:bg-purple-900/50 rounded border border-purple-300 dark:border-purple-600 flex items-center justify-center text-xs"
                        >
                          🃏
                        </div>
                      ))}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {reading.cards.map(c => c.card.name).join(' • ')}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                        &ldquo;{reading.question}&rdquo;
                      </p>
                    </div>
                  </div>
                  <span className="text-gray-400">
                    {expandedReadings.has(index) ? '▼' : '▶'}
                  </span>
                </button>

                {/* Expanded Reading Content */}
                {expandedReadings.has(index) && (
                  <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-center pb-4 border-b border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Your question:</p>
                      <p className="text-gray-800 dark:text-gray-200 italic">&ldquo;{reading.question}&rdquo;</p>
                    </div>

                    {/* Cards Display - Now Clickable */}
                    <div className="mt-4 grid grid-cols-3 gap-4">
                      {reading.cards.map((drawnCard, cardIndex) => (
                        <button
                          key={cardIndex}
                          onClick={() => handleCardClick(drawnCard, reading)}
                          className="text-center group cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg p-2 transition-colors"
                        >
                          <div className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-2">
                            {formatPosition(drawnCard.position)}
                          </div>
                          <div className="relative mx-auto w-24 h-36 mb-2 group-hover:scale-105 transition-transform">
                            <Image
                              src={drawnCard.card.imageUrl}
                              alt={drawnCard.card.name}
                              fill
                              className={`object-contain rounded shadow-md ${drawnCard.isReversed ? 'rotate-180' : ''}`}
                              unoptimized // Wikimedia images
                            />
                            {/* Hover indicator */}
                            <div className="absolute inset-0 bg-purple-600/0 group-hover:bg-purple-600/10 rounded transition-colors flex items-center justify-center">
                              <span className="opacity-0 group-hover:opacity-100 text-purple-600 dark:text-purple-300 text-xs font-medium bg-white/90 dark:bg-gray-800/90 px-2 py-1 rounded shadow-sm transition-opacity">
                                View Details
                              </span>
                            </div>
                          </div>
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {drawnCard.card.name}
                            {drawnCard.isReversed && (
                              <span className="text-xs text-gray-500 ml-1">(R)</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {drawnCard.card.keywords.slice(0, 3).join(', ')}
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* Tip for editing */}
                    <p className="text-center text-gray-400 text-xs mt-4">
                      Click any card to see details and customize its meaning
                    </p>
                  </div>
                )}
              </div>
            ))}

            {/* Draw New Reading Input */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              {/* Deck Selector */}
              <TarotDeckSelector
                selectedDeckId={selectedDeckId}
                onDeckChange={setSelectedDeckId}
                userLastDeckId={userLastDeckId}
                userId={userId}
                disabled={isDrawing}
              />

              {loadingDeck && (
                <p className="text-sm text-purple-600 dark:text-purple-400 text-center mb-2">
                  Loading deck...
                </p>
              )}

              <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4">
                {readings.length === 0
                  ? 'Focus on your question, then draw three cards.'
                  : 'Draw another reading for a new question.'}
              </p>
              <div className="space-y-3">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !isDrawing && question.trim() && handleDraw()}
                  placeholder="What guidance do you seek?"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
                <button
                  onClick={handleDraw}
                  disabled={isDrawing || loadingDeck || !question.trim() || !currentDeck}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isDrawing ? 'Drawing...' : loadingDeck ? 'Loading deck...' : !currentDeck ? 'Select a deck' : '🃏 Draw Cards'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Card Detail Modal */}
      {cardDetail && (
        <CardDetailModal
          card={cardDetail.card.card}
          isReversed={cardDetail.card.isReversed}
          position={cardDetail.card.position}
          deckId={cardDetail.deckId}
          deckName={cardDetail.deckName}
          isUserDeck={cardDetail.isUserDeck}
          userId={userId}
          onClose={() => setCardDetail(null)}
        />
      )}
    </div>
  )
}
