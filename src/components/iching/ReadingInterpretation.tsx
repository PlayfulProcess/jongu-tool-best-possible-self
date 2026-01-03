'use client';

import { HexagramReading, HexagramData } from '@/types/iching.types';
import { getLinePositionName } from '@/lib/iching';

// Extended reading type with book attribution
interface HexagramReadingWithAttribution extends HexagramReading {
  bookId?: string;
  bookName?: string;
  creatorName?: string;
}

interface ReadingInterpretationProps {
  reading: HexagramReadingWithAttribution;
  onHexagramClick?: (hexagram: HexagramData) => void;
}

export default function ReadingInterpretation({ reading, onHexagramClick }: ReadingInterpretationProps) {
  const { primaryHexagram, changingLines, transformedHexagram, lines, bookId, bookName, creatorName } = reading;

  // Determine if we should show attribution (not for classic/fallback)
  const showAttribution = bookId && bookId !== 'classic' && bookName;
  const hasTransformation = transformedHexagram && changingLines.length > 0;

  return (
    <div className="space-y-4">
      {/* Compact 3-column layout like Tarot */}
      <div className={`grid ${hasTransformation ? 'grid-cols-3' : 'grid-cols-1 max-w-xs mx-auto'} gap-3`}>

        {/* Primary Hexagram - "Structures" (Present) */}
        <button
          onClick={() => onHexagramClick?.(primaryHexagram)}
          className="text-center group cursor-pointer hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg p-3 transition-colors"
        >
          {/* Position Label */}
          <div className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-2 uppercase tracking-wider">
            {hasTransformation ? 'Present' : 'Your Hexagram'}
          </div>

          {/* Hexagram Symbol Container */}
          <div className="relative mx-auto w-20 h-20 mb-2 group-hover:scale-105 transition-transform flex items-center justify-center">
            <span className="text-5xl">{primaryHexagram.unicode}</span>

            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-amber-600/0 group-hover:bg-amber-600/10 rounded-lg transition-colors flex items-center justify-center">
              <span className="opacity-0 group-hover:opacity-100 text-amber-600 dark:text-amber-300 text-xs font-medium bg-white/90 dark:bg-gray-800/90 px-2 py-1 rounded shadow-sm transition-opacity">
                View Details
              </span>
            </div>
          </div>

          {/* Hexagram Name */}
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {primaryHexagram.english_name}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            #{primaryHexagram.number} • {primaryHexagram.chinese_name}
          </div>
        </button>

        {/* Changing Lines - "Process" (Transition) */}
        {hasTransformation && (
          <div className="text-center flex flex-col justify-center p-2">
            <div className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-2 uppercase tracking-wider">
              Process
            </div>

            <div className="bg-amber-100 dark:bg-amber-900/30 rounded-lg p-2 space-y-1">
              {changingLines.map((lineNum) => {
                const line = lines[lineNum - 1];
                const positionName = getLinePositionName(lineNum, line.type);

                return (
                  <div key={lineNum} className="text-xs">
                    <span className="font-medium text-amber-700 dark:text-amber-300">
                      Line {lineNum}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 ml-1">
                      {positionName}
                    </span>
                    <div className="text-amber-600 dark:text-amber-400 text-[10px]">
                      {line.type === 'yang' ? '⚊ → ⚋' : '⚋ → ⚊'}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Arrow indicator */}
            <div className="text-amber-500 text-xl mt-2">→</div>
          </div>
        )}

        {/* Transformed Hexagram - "Possibilities" (Future) */}
        {hasTransformation && transformedHexagram && (
          <button
            onClick={() => onHexagramClick?.(transformedHexagram)}
            className="text-center group cursor-pointer hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg p-3 transition-colors"
          >
            {/* Position Label */}
            <div className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-2 uppercase tracking-wider">
              Becoming
            </div>

            {/* Hexagram Symbol Container */}
            <div className="relative mx-auto w-20 h-20 mb-2 group-hover:scale-105 transition-transform flex items-center justify-center">
              <span className="text-5xl">{transformedHexagram.unicode}</span>

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-amber-600/0 group-hover:bg-amber-600/10 rounded-lg transition-colors flex items-center justify-center">
                <span className="opacity-0 group-hover:opacity-100 text-amber-600 dark:text-amber-300 text-xs font-medium bg-white/90 dark:bg-gray-800/90 px-2 py-1 rounded shadow-sm transition-opacity">
                  View Details
                </span>
              </div>
            </div>

            {/* Hexagram Name */}
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {transformedHexagram.english_name}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              #{transformedHexagram.number} • {transformedHexagram.chinese_name}
            </div>
          </button>
        )}
      </div>

      {/* Attribution Footer */}
      <div className="text-center pt-2">
        {showAttribution ? (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Interpretation from <span className="font-medium text-amber-600 dark:text-amber-400">{bookName}</span>
            {creatorName && creatorName !== 'Unknown' && <span> by {creatorName}</span>}
          </p>
        ) : (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Classic I Ching interpretation
          </p>
        )}
      </div>
    </div>
  );
}
