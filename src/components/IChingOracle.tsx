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
  readings?: HexagramReading[]
}

export function IChingOracle({
  onReadingComplete,
  onReadingClear,
  readings: externalReadings = []
}: IChingOracleProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [readings, setReadings] = useState<HexagramReading[]>(externalReadings)
  const [isCasting, setIsCasting] = useState(false)
  const [expandedReadings, setExpandedReadings] = useState<Set<number>>(new Set())

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

    setIsCasting(true)

    try {
      const newReading = await castHexagram(question)
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
                      <ReadingInterpretation reading={reading} />
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Cast New Reading Input */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4">
                {readings.length === 0
                  ? 'Focus on your question, then cast the hexagram.'
                  : 'Cast another reading for a new question.'}
              </p>
              <QuestionInput
                onCast={handleCast}
                isLoading={isCasting}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
