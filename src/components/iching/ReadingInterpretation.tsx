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

  // Helper to safely extract line text (handles string, object with text field, or other formats)
  const getLineText = (lineData: unknown): string => {
    if (typeof lineData === 'string') {
      return lineData;
    }
    if (lineData && typeof lineData === 'object') {
      const obj = lineData as Record<string, unknown>;
      // Try common field names for line text
      if (typeof obj.text === 'string') return obj.text;
      if (typeof obj.interpretation === 'string') return obj.interpretation;
      if (typeof obj.meaning === 'string') return obj.meaning;
      if (typeof obj.content === 'string') return obj.content;
    }
    return '';
  };

  return (
    <div className="space-y-6 text-gray-700 dark:text-gray-300">
      {/* Primary Hexagram Header */}
      <div
        className={`text-center ${onHexagramClick ? 'cursor-pointer hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg p-3 -m-3 transition-colors' : ''}`}
        onClick={() => onHexagramClick?.(primaryHexagram)}
      >
        <div className="text-4xl mb-2">{primaryHexagram.unicode}</div>
        <h3 className="font-serif text-xl text-gray-900 dark:text-white">
          Hexagram {primaryHexagram.number}: {primaryHexagram.english_name}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {primaryHexagram.chinese_name} ({primaryHexagram.pinyin})
        </p>
        {onHexagramClick && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Click for details</p>
        )}
      </div>

      {/* The Judgment */}
      <div>
        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">The Judgment</h4>
        <p>{primaryHexagram.judgment}</p>
      </div>

      {/* The Image */}
      <div>
        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">The Image</h4>
        <p>{primaryHexagram.image}</p>
      </div>

      {/* Overall Meaning */}
      <div>
        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Meaning</h4>
        <p>{primaryHexagram.meaning}</p>
      </div>

      {/* Changing Lines - highlighted if present */}
      {changingLines.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-700">
          <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-3">
            Changing Lines ({changingLines.join(', ')})
          </h4>
          <div className="space-y-3">
            {changingLines.map((lineNum) => {
              const line = lines[lineNum - 1];
              const positionName = getLinePositionName(lineNum, line.type);
              const rawLineText = primaryHexagram.lines[lineNum as keyof typeof primaryHexagram.lines];
              const lineText = getLineText(rawLineText);

              return (
                <div key={lineNum}>
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-300 mb-1">
                    Line {lineNum} ({positionName}) — {line.type === 'yang' ? 'Yang → Yin' : 'Yin → Yang'}
                  </p>
                  {lineText && <p className="text-gray-700 dark:text-gray-300">{lineText}</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Transformed Hexagram */}
      {transformedHexagram && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <div
            className={`text-center mb-4 ${onHexagramClick ? 'cursor-pointer hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg p-3 -m-3 transition-colors' : ''}`}
            onClick={() => onHexagramClick?.(transformedHexagram)}
          >
            <p className="text-xs text-amber-600 dark:text-amber-400 uppercase tracking-wide mb-1">
              → Trending Toward →
            </p>
            <div className="text-3xl mb-1">{transformedHexagram.unicode}</div>
            <h3 className="font-serif text-lg text-gray-900 dark:text-white">
              Hexagram {transformedHexagram.number}: {transformedHexagram.english_name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {transformedHexagram.chinese_name} ({transformedHexagram.pinyin})
            </p>
            {onHexagramClick && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Click for details</p>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">The Judgment</h4>
              <p>{transformedHexagram.judgment}</p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">The Image</h4>
              <p>{transformedHexagram.image}</p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Meaning</h4>
              <p>{transformedHexagram.meaning}</p>
            </div>
          </div>
        </div>
      )}

      {/* Attribution */}
      {showAttribution && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Interpretation from <span className="font-medium text-amber-600 dark:text-amber-400">{bookName}</span>
            {creatorName && creatorName !== 'Unknown' && (
              <span> by {creatorName}</span>
            )}
          </p>
        </div>
      )}

      {/* Classic attribution for default book */}
      {(!bookId || bookId === 'classic') && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Classic I Ching interpretation
          </p>
        </div>
      )}
    </div>
  );
}
