'use client';

import { Line, HexagramData } from '@/types/iching.types';

interface HexagramDisplayProps {
  lines: Line[];
  hexagram: HexagramData;
  showChanging?: boolean;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export default function HexagramDisplay({
  lines,
  hexagram,
  showChanging = true,
  size = 'md',
  label,
}: HexagramDisplayProps) {
  // Size configurations
  const sizeConfig = {
    sm: { lineWidth: 60, lineHeight: 8, gap: 4, fontSize: 'text-sm' },
    md: { lineWidth: 100, lineHeight: 12, gap: 6, fontSize: 'text-base' },
    lg: { lineWidth: 140, lineHeight: 16, gap: 8, fontSize: 'text-lg' },
  };

  const config = sizeConfig[size];

  // Display lines from top (6) to bottom (1)
  const displayLines = [...lines].reverse();

  return (
    <div className="flex flex-col items-center">
      {/* Label */}
      {label && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
          {label}
        </p>
      )}

      {/* Unicode symbol */}
      <div className="text-6xl mb-2" title={hexagram.english_name}>
        {hexagram.unicode}
      </div>

      {/* Line visualization */}
      <div className="flex flex-col items-center" style={{ gap: config.gap }}>
        {displayLines.map((line, idx) => (
          <LineDisplay
            key={idx}
            line={line}
            showChanging={showChanging}
            width={config.lineWidth}
            height={config.lineHeight}
          />
        ))}
      </div>

      {/* Hexagram info */}
      <div className="mt-4 text-center">
        <p className={`font-serif ${config.fontSize} text-gray-900 dark:text-white`}>
          <span className="text-amber-600 dark:text-amber-400">#{hexagram.number}</span>{' '}
          {hexagram.english_name}
        </p>
        <p className="text-gray-600 dark:text-gray-400">
          <span className="text-xl">{hexagram.chinese_name}</span>{' '}
          <span className="text-sm">({hexagram.pinyin})</span>
        </p>
      </div>
    </div>
  );
}

interface LineDisplayProps {
  line: Line;
  showChanging: boolean;
  width: number;
  height: number;
}

function LineDisplay({ line, showChanging, width, height }: LineDisplayProps) {
  const isChanging = showChanging && line.isChanging;

  // Colors
  const baseColor = isChanging
    ? 'bg-amber-500 dark:bg-amber-400'
    : 'bg-gray-800 dark:bg-gray-200';

  if (line.type === 'yang') {
    // Solid line (yang)
    return (
      <div className="relative flex items-center justify-center">
        <div
          className={`${baseColor} rounded-sm`}
          style={{ width, height }}
        />
        {isChanging && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white dark:text-gray-800 font-bold text-xs">
              ○
            </span>
          </div>
        )}
      </div>
    );
  } else {
    // Broken line (yin)
    const segmentWidth = (width - height) / 2;
    return (
      <div className="relative flex items-center justify-center gap-0" style={{ width }}>
        <div
          className={`${baseColor} rounded-sm`}
          style={{ width: segmentWidth, height }}
        />
        <div style={{ width: height }} /> {/* Gap */}
        <div
          className={`${baseColor} rounded-sm`}
          style={{ width: segmentWidth, height }}
        />
        {isChanging && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-amber-500 dark:text-amber-400 font-bold text-xs">
              ×
            </span>
          </div>
        )}
      </div>
    );
  }
}

// Simple component showing just the unicode hexagram
export function HexagramSymbol({
  hexagram,
  size = 'md',
}: {
  hexagram: HexagramData;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizeClasses = {
    sm: 'text-3xl',
    md: 'text-5xl',
    lg: 'text-7xl',
  };

  return (
    <span className={sizeClasses[size]} title={hexagram.english_name}>
      {hexagram.unicode}
    </span>
  );
}
