'use client';

import { useState } from 'react';
import { HexagramReading, Line } from '@/types/iching.types';
import { getLinePositionName } from '@/lib/iching';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface ReadingInterpretationProps {
  reading: HexagramReading;
}

export default function ReadingInterpretation({ reading }: ReadingInterpretationProps) {
  const { primaryHexagram, changingLines, transformedHexagram, lines } = reading;

  return (
    <div className="space-y-4">
      {/* Primary Hexagram */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-serif text-lg text-gray-900 dark:text-white">
            {primaryHexagram.unicode} {primaryHexagram.english_name}
            <span className="text-gray-500 dark:text-gray-400 text-sm ml-2">
              ({primaryHexagram.chinese_name} {primaryHexagram.pinyin})
            </span>
          </h3>
        </div>

        <AccordionSection title="The Judgment" defaultOpen>
          <p className="text-gray-700 dark:text-gray-300">{primaryHexagram.judgment}</p>
        </AccordionSection>

        <AccordionSection title="The Image">
          <p className="text-gray-700 dark:text-gray-300">{primaryHexagram.image}</p>
        </AccordionSection>

        {changingLines.length > 0 && (
          <AccordionSection title={`Changing Lines (${changingLines.join(', ')})`} defaultOpen>
            <div className="space-y-3">
              {changingLines.map((lineNum) => {
                const line = lines[lineNum - 1];
                const positionName = getLinePositionName(lineNum, line.type);
                const lineText = primaryHexagram.lines[lineNum as keyof typeof primaryHexagram.lines];

                return (
                  <div
                    key={lineNum}
                    className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded border-l-4 border-amber-500"
                  >
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-1">
                      Line {lineNum} ({positionName}) - {line.type === 'yang' ? 'Yang → Yin' : 'Yin → Yang'}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300">{lineText}</p>
                  </div>
                );
              })}
            </div>
          </AccordionSection>
        )}

        <AccordionSection title="Overall Meaning">
          <p className="text-gray-700 dark:text-gray-300">{primaryHexagram.meaning}</p>
        </AccordionSection>

        <AccordionSection title="All Lines">
          <div className="space-y-2">
            {[1, 2, 3, 4, 5, 6].map((lineNum) => {
              const line = lines[lineNum - 1];
              const positionName = getLinePositionName(lineNum, line.type);
              const lineText = primaryHexagram.lines[lineNum as keyof typeof primaryHexagram.lines];
              const isChangingLine = changingLines.includes(lineNum);

              return (
                <div
                  key={lineNum}
                  className={`p-2 rounded ${
                    isChangingLine
                      ? 'bg-amber-50 dark:bg-amber-900/20 border-l-2 border-amber-500'
                      : 'bg-gray-50 dark:bg-gray-700/50'
                  }`}
                >
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Line {lineNum} ({positionName})
                    {isChangingLine && (
                      <span className="ml-2 text-amber-600 dark:text-amber-400">changing</span>
                    )}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{lineText}</p>
                </div>
              );
            })}
          </div>
        </AccordionSection>
      </div>

      {/* Transformed Hexagram */}
      {transformedHexagram && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-amber-50 to-transparent dark:from-amber-900/20">
            <p className="text-xs text-amber-600 dark:text-amber-400 uppercase tracking-wide mb-1">
              Transforms Into
            </p>
            <h3 className="font-serif text-lg text-gray-900 dark:text-white">
              {transformedHexagram.unicode} {transformedHexagram.english_name}
              <span className="text-gray-500 dark:text-gray-400 text-sm ml-2">
                ({transformedHexagram.chinese_name} {transformedHexagram.pinyin})
              </span>
            </h3>
          </div>

          <AccordionSection title="The Judgment" defaultOpen>
            <p className="text-gray-700 dark:text-gray-300">{transformedHexagram.judgment}</p>
          </AccordionSection>

          <AccordionSection title="The Image">
            <p className="text-gray-700 dark:text-gray-300">{transformedHexagram.image}</p>
          </AccordionSection>

          <AccordionSection title="Overall Meaning">
            <p className="text-gray-700 dark:text-gray-300">{transformedHexagram.meaning}</p>
          </AccordionSection>
        </div>
      )}
    </div>
  );
}

interface AccordionSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function AccordionSection({ title, children, defaultOpen = false }: AccordionSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between
                   text-left text-gray-700 dark:text-gray-300
                   hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        <span className="font-medium">{title}</span>
        {isOpen ? (
          <ChevronDownIcon className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronRightIcon className="w-5 h-5 text-gray-400" />
        )}
      </button>
      {isOpen && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}
