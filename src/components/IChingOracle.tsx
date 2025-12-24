'use client'

import { useState, useEffect } from 'react'
import { castHexagram } from '@/lib/iching'
import { HexagramReading } from '@/types/iching.types'
import {
  QuestionInput,
  ReadingInterpretation
} from '@/components/iching'

interface IChingOracleProps {
  onReadingComplete?: (reading: HexagramReading) => void
  onReadingClear?: () => void
  currentReading?: HexagramReading | null
}

export function IChingOracle({
  onReadingComplete,
  onReadingClear,
  currentReading: externalReading
}: IChingOracleProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [reading, setReading] = useState<HexagramReading | null>(externalReading || null)
  const [isCasting, setIsCasting] = useState(false)

  // Sync with external reading if provided
  useEffect(() => {
    if (externalReading) {
      setReading(externalReading)
      setIsOpen(true) // Auto-open when there's a reading
    }
  }, [externalReading])

  const handleCast = async (question: string) => {
    if (!question.trim()) return

    setIsCasting(true)

    try {
      const newReading = await castHexagram(question)
      setReading(newReading)
      setIsOpen(true)

      if (onReadingComplete) {
        onReadingComplete(newReading)
      }
    } catch (error) {
      console.error('Error casting hexagram:', error)
    } finally {
      setIsCasting(false)
    }
  }

  const handleClearReading = () => {
    setReading(null)
    setIsOpen(false)
    onReadingClear?.()
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
        {!isOpen && reading && (
          <span className="text-sm text-amber-600 dark:text-amber-400">
            {reading.primaryHexagram.unicode} {reading.primaryHexagram.english_name}
          </span>
        )}
      </div>

      {/* Collapsible Panel */}
      {isOpen && (
        <div className="mt-4 border border-amber-200 dark:border-amber-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-amber-200 dark:border-amber-700 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
            <h3 className="font-semibold text-amber-800 dark:text-amber-200">
              {reading ? `${reading.primaryHexagram.unicode} ${reading.primaryHexagram.english_name}` : 'I Ching Oracle'}
            </h3>
            <div className="flex items-center gap-2">
              {reading && (
                <button
                  onClick={handleClearReading}
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  Clear
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
          <div className="p-4">
            {!reading ? (
              // Question Input when no reading
              <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  Focus on your question, then cast the hexagram.
                </p>
                <QuestionInput
                  onCast={handleCast}
                  isLoading={isCasting}
                />
              </div>
            ) : (
              // Full Reading Display
              <div className="space-y-4">
                {/* Question */}
                <div className="text-center pb-4 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Your question:</p>
                  <p className="text-gray-800 dark:text-gray-200 italic">&ldquo;{reading.question}&rdquo;</p>
                </div>

                {/* Full Interpretation */}
                <ReadingInterpretation reading={reading} />

                {/* Actions */}
                <div className="flex justify-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={handleClearReading}
                    className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cast New Reading
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
