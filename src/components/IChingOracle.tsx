'use client'

import { useState, useEffect } from 'react'
import { castHexagram } from '@/lib/iching'
import { HexagramReading, HexagramData } from '@/types/iching.types'
import { setActiveBook, getActiveBookMeta } from '@/lib/hexagram-lookup'
import { fetchAllBooks, fetchBookWithHexagrams, getSavedBookId, saveBookId, getDefaultBookId } from '@/lib/custom-iching'
import { ReadingInterpretation } from '@/components/iching'
import { IChingBookSelector } from './IChingBookSelector'
import { HexagramDetailModal } from './HexagramDetailModal'
import { OracleQuestionInput } from './OracleQuestionInput'
import { BookOption } from '@/types/custom-iching.types'

// Extended reading type with book attribution
export interface HexagramReadingWithAttribution extends HexagramReading {
  bookId?: string
  bookName?: string
  creatorName?: string
}

interface IChingOracleProps {
  onReadingComplete?: (reading: HexagramReadingWithAttribution) => void
  onReadingClear?: () => void
  readings?: HexagramReadingWithAttribution[]
  userId?: string | null
}

export function IChingOracle({
  onReadingComplete,
  onReadingClear,
  readings: externalReadings = [],
  userId
}: IChingOracleProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [readings, setReadings] = useState<HexagramReadingWithAttribution[]>(externalReadings)
  const [isCasting, setIsCasting] = useState(false)
  const [expandedReadings, setExpandedReadings] = useState<Set<number>>(new Set())

  // Book selection state
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null)
  const [loadingBook, setLoadingBook] = useState(false)
  const [bookOptions, setBookOptions] = useState<BookOption[]>([])

  // Modal state for hexagram details
  const [selectedHexagram, setSelectedHexagram] = useState<HexagramData | null>(null)

  // Set default book on mount
  useEffect(() => {
    async function setDefaultBook() {
      const books = await fetchAllBooks(userId)
      setBookOptions(books)

      // Set default book if none selected
      if (!selectedBookId && books.length > 0) {
        const savedId = getSavedBookId()
        const defaultId = getDefaultBookId(books, savedId)
        if (defaultId) {
          setSelectedBookId(defaultId)
        }
      }
    }
    setDefaultBook()
  }, [userId, selectedBookId])

  // Load book and set active when selection changes
  useEffect(() => {
    if (!selectedBookId) return

    async function loadAndSetBook() {
      setLoadingBook(true)
      try {
        const book = await fetchBookWithHexagrams(selectedBookId!)
        if (book) {
          setActiveBook(selectedBookId, {
            name: book.name,
            creator_name: book.creator_name || 'Unknown'
          })
        }
      } catch (error) {
        console.error('Failed to load book:', error)
        setActiveBook('classic', { name: 'Classic I Ching', creator_name: 'Traditional' })
      } finally {
        setLoadingBook(false)
      }
    }

    loadAndSetBook()
  }, [selectedBookId])

  // Handle book change
  const handleBookChange = (bookId: string) => {
    setSelectedBookId(bookId)
    saveBookId(bookId)
  }

  // Sync with external readings (including when cleared)
  useEffect(() => {
    setReadings(externalReadings)
    if (externalReadings.length > 0) {
      setIsOpen(true) // Auto-open when there are readings
      // Expand the most recent reading
      setExpandedReadings(new Set([externalReadings.length - 1]))
    }
  }, [externalReadings])

  const handleCast = async (question: string) => {
    if (!question.trim()) return

    // Don't allow casting if book is still loading
    if (loadingBook) return

    setIsCasting(true)

    try {
      const baseReading = await castHexagram(question)
      const bookMeta = getActiveBookMeta()

      // Add book attribution to reading
      const newReading: HexagramReadingWithAttribution = {
        ...baseReading,
        bookId: selectedBookId || 'classic',
        bookName: bookMeta?.name || 'Classic I Ching',
        creatorName: bookMeta?.creator_name || 'Traditional'
      }

      setReadings(prev => [...prev, newReading])
      setIsOpen(true)
      // Expand the new reading
      setExpandedReadings(new Set([readings.length]))

      if (onReadingComplete) {
        onReadingComplete(newReading)
      }
    } catch (error) {
      console.error('Error casting hexagram:', error)
    } finally {
      setIsCasting(false)
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

  // Check if current book is owned by the user
  const isCurrentBookUserOwned = (): boolean => {
    if (!userId || !selectedBookId) return false
    const currentBook = bookOptions.find(b => b.id === selectedBookId)
    return currentBook?.source === 'user' || currentBook?.creator_id === userId
  }

  // Get current book name
  const getCurrentBookName = (): string | undefined => {
    const currentBook = bookOptions.find(b => b.id === selectedBookId)
    return currentBook?.name
  }

  // Handle hexagram click for modal
  const handleHexagramClick = (hexagram: HexagramData) => {
    setSelectedHexagram(hexagram)
  }

  return (
    <div>
      {/* Toggle Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all"
        >
          ☯ I Ching {isOpen ? '▼' : '▶'}
        </button>

        {/* Quick status indicator when collapsed */}
        {!isOpen && readings.length > 0 && (
          <span className="text-sm text-amber-600 dark:text-amber-400">
            {readings.length} reading{readings.length !== 1 ? 's' : ''} •
            {readings[readings.length - 1].primaryHexagram.unicode} {readings[readings.length - 1].primaryHexagram.english_name}
          </span>
        )}
      </div>

      {/* Collapsible Panel */}
      {isOpen && (
        <div className="mt-4 border border-amber-200 dark:border-amber-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-amber-200 dark:border-amber-700 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
            <h3 className="font-semibold text-amber-800 dark:text-amber-200">
              I Ching Oracle {readings.length > 0 && `(${readings.length} reading${readings.length !== 1 ? 's' : ''})`}
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
                key={`${reading.primaryHexagram.number}-${index}`}
                className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
              >
                {/* Reading Header - Always Visible */}
                <button
                  onClick={() => toggleReading(index)}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{reading.primaryHexagram.unicode}</span>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {reading.primaryHexagram.english_name}
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
                    <div className="mt-4">
                      <ReadingInterpretation
                        reading={reading}
                        onHexagramClick={handleHexagramClick}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Cast New Reading Input */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              {/* Book Selector */}
              <IChingBookSelector
                selectedBookId={selectedBookId}
                onBookChange={handleBookChange}
                userId={userId}
                disabled={isCasting}
              />

              {loadingBook && (
                <p className="text-sm text-amber-600 dark:text-amber-400 text-center mb-2">
                  Loading book...
                </p>
              )}

              <OracleQuestionInput
                oracleType="iching"
                onSubmit={handleCast}
                isLoading={isCasting}
                disabled={loadingBook}
              />
            </div>
          </div>
        </div>
      )}

      {/* Hexagram Detail Modal */}
      {selectedHexagram && (
        <HexagramDetailModal
          hexagram={selectedHexagram}
          bookId={selectedBookId || 'classic'}
          bookName={getCurrentBookName() || 'Classic I Ching'}
          isUserBook={isCurrentBookUserOwned()}
          userId={userId}
          onClose={() => setSelectedHexagram(null)}
        />
      )}
    </div>
  )
}
