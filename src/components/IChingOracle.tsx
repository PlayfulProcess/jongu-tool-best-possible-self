'use client'

import { useState, useEffect } from 'react'
import { castHexagram } from '@/lib/iching'
import { HexagramReading } from '@/types/iching.types'
import {
  QuestionInput,
  CoinCastingAnimation,
  HexagramDisplay,
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
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [step, setStep] = useState<'question' | 'casting' | 'reading'>('question')
  const [reading, setReading] = useState<HexagramReading | null>(externalReading || null)
  const [isCasting, setIsCasting] = useState(false)

  // Sync with external reading if provided
  useEffect(() => {
    if (externalReading) {
      setReading(externalReading)
      setStep('reading')
    }
  }, [externalReading])

  const handleCast = async (question: string) => {
    if (!question.trim()) return

    setIsCasting(true)
    setStep('casting')

    try {
      const newReading = await castHexagram(question)
      setReading(newReading)

      // Wait for animation to complete before showing reading
      // The animation component will call onComplete
    } catch (error) {
      console.error('Error casting hexagram:', error)
      setIsCasting(false)
      setStep('question')
    }
  }

  const handleCastingComplete = () => {
    setIsCasting(false)
    setStep('reading')

    if (reading && onReadingComplete) {
      onReadingComplete(reading)
    }
  }

  const handleClearReading = () => {
    setReading(null)
    setStep('question')
    onReadingClear?.()
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    // Keep the reading if we have one
    if (reading) {
      setStep('reading')
    } else {
      setStep('question')
    }
  }

  const handleOpenModal = () => {
    setIsModalOpen(true)
    if (reading) {
      setStep('reading')
    }
  }

  // If we have a reading, show a compact summary that expands
  if (reading && !isModalOpen) {
    return (
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{reading.primaryHexagram.unicode}</span>
            <div>
              <div className="font-medium text-amber-900 dark:text-amber-100">
                Hexagram {reading.primaryHexagram.number}: {reading.primaryHexagram.english_name}
              </div>
              <div className="text-sm text-amber-700 dark:text-amber-300">
                {reading.primaryHexagram.chinese_name} ({reading.primaryHexagram.pinyin})
              </div>
              {reading.changingLines.length > 0 && (
                <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  Changing lines: {reading.changingLines.join(', ')}
                  {reading.transformedHexagram && (
                    <span> → {reading.transformedHexagram.english_name}</span>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleOpenModal}
              className="px-3 py-1 text-sm bg-amber-100 dark:bg-amber-800 text-amber-700 dark:text-amber-200 rounded hover:bg-amber-200 dark:hover:bg-amber-700 transition-colors"
            >
              View Full
            </button>
            <button
              onClick={handleClearReading}
              className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
        <div className="mt-3 text-sm text-amber-800 dark:text-amber-200 italic">
          &ldquo;{reading.question}&rdquo;
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={handleOpenModal}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all shadow-sm"
      >
        <span className="text-lg">☯</span>
        <span>Cast I Ching</span>
      </button>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <span>☯</span> I Ching Oracle
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {step === 'question' && (
                <div className="space-y-6">
                  <div className="text-center">
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      The I Ching responds to sincere questions about your situation.
                      Take a moment to reflect, then ask your question.
                    </p>
                  </div>

                  <QuestionInput
                    onCast={handleCast}
                    isLoading={isCasting}
                  />
                </div>
              )}

              {step === 'casting' && reading && (
                <div className="py-8">
                  <CoinCastingAnimation
                    lines={reading.lines}
                    isAnimating={isCasting}
                    onComplete={handleCastingComplete}
                  />
                </div>
              )}

              {step === 'reading' && reading && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Your question:</div>
                    <div className="text-lg font-medium text-gray-800 dark:text-gray-200 italic">
                      &ldquo;{reading.question}&rdquo;
                    </div>
                  </div>

                  <HexagramDisplay
                    lines={reading.lines}
                    hexagram={reading.primaryHexagram}
                  />

                  <ReadingInterpretation reading={reading} />

                  <div className="flex justify-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={handleClearReading}
                      className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      Cast New Reading
                    </button>
                    <button
                      onClick={handleCloseModal}
                      className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                    >
                      Continue Journaling
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
