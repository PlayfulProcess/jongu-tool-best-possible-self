'use client';

import { HexagramReading } from '@/types/iching.types';
import { getLinePositionName } from '@/lib/iching';

interface ReadingInterpretationProps {
  reading: HexagramReading;
}

export default function ReadingInterpretation({ reading }: ReadingInterpretationProps) {
  const { primaryHexagram, changingLines, transformedHexagram, lines } = reading;

  return (
    <div className="space-y-6 text-gray-700 dark:text-gray-300">
      {/* Primary Hexagram Header */}
      <div className="text-center">
        <div className="text-4xl mb-2">{primaryHexagram.unicode}</div>
        <h3 className="font-serif text-xl text-gray-900 dark:text-white">
          Hexagram {primaryHexagram.number}: {primaryHexagram.english_name}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {primaryHexagram.chinese_name} ({primaryHexagram.pinyin})
        </p>
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
              const lineText = primaryHexagram.lines[lineNum as keyof typeof primaryHexagram.lines];

              return (
                <div key={lineNum}>
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-300 mb-1">
                    Line {lineNum} ({positionName}) — {line.type === 'yang' ? 'Yang → Yin' : 'Yin → Yang'}
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">{lineText}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Transformed Hexagram */}
      {transformedHexagram && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <div className="text-center mb-4">
            <p className="text-xs text-amber-600 dark:text-amber-400 uppercase tracking-wide mb-1">
              → Transforms Into →
            </p>
            <div className="text-3xl mb-1">{transformedHexagram.unicode}</div>
            <h3 className="font-serif text-lg text-gray-900 dark:text-white">
              Hexagram {transformedHexagram.number}: {transformedHexagram.english_name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {transformedHexagram.chinese_name} ({transformedHexagram.pinyin})
            </p>
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
    </div>
  );
}
