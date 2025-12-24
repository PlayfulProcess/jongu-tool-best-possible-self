'use client';

import { useState, useEffect } from 'react';
import { Line } from '@/types/iching.types';

interface CoinCastingAnimationProps {
  lines: Line[];
  onComplete: () => void;
  isAnimating: boolean;
}

export default function CoinCastingAnimation({
  lines,
  onComplete,
  isAnimating,
}: CoinCastingAnimationProps) {
  const [currentLine, setCurrentLine] = useState(0);
  const [showCoins, setShowCoins] = useState(false);
  const [revealedLines, setRevealedLines] = useState<number[]>([]);

  useEffect(() => {
    if (!isAnimating) {
      setCurrentLine(0);
      setShowCoins(false);
      setRevealedLines([]);
      return;
    }

    // Animate through each line
    const animateLine = (lineIndex: number) => {
      if (lineIndex >= 6) {
        // Animation complete
        setTimeout(onComplete, 500);
        return;
      }

      // Show coin toss
      setCurrentLine(lineIndex);
      setShowCoins(true);

      // After coin animation, reveal the line
      setTimeout(() => {
        setShowCoins(false);
        setRevealedLines((prev) => [...prev, lineIndex]);

        // Move to next line
        setTimeout(() => {
          animateLine(lineIndex + 1);
        }, 300);
      }, 800);
    };

    // Start animation
    const timer = setTimeout(() => animateLine(0), 500);
    return () => clearTimeout(timer);
  }, [isAnimating, onComplete]);

  if (!isAnimating && revealedLines.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col items-center py-8">
      <h3 className="text-lg font-serif text-gray-700 dark:text-gray-300 mb-6">
        Casting Your Hexagram...
      </h3>

      {/* Coin animation */}
      {showCoins && (
        <div className="flex gap-4 mb-6 animate-bounce">
          {lines[currentLine]?.toss.coins.map((coin, idx) => (
            <div
              key={idx}
              className={`w-12 h-12 rounded-full flex items-center justify-center
                         text-2xl font-bold border-4 transition-all duration-300
                         ${
                           coin.isHeads
                             ? 'bg-amber-100 border-amber-500 text-amber-700'
                             : 'bg-gray-100 border-gray-400 text-gray-600'
                         }
                         animate-spin`}
              style={{
                animationDuration: '0.5s',
                animationIterationCount: 2,
              }}
            >
              {coin.isHeads ? '3' : '2'}
            </div>
          ))}
        </div>
      )}

      {/* Sum display */}
      {showCoins && lines[currentLine] && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Sum: {lines[currentLine].toss.sum} = {lines[currentLine].type}{' '}
          {lines[currentLine].isChanging && '(changing)'}
        </p>
      )}

      {/* Building hexagram */}
      <div className="flex flex-col-reverse items-center gap-2">
        {lines.map((line, idx) => {
          const isRevealed = revealedLines.includes(idx);
          const isCurrent = currentLine === idx && showCoins;

          if (!isRevealed && !isCurrent) {
            return (
              <div
                key={idx}
                className="w-24 h-3 bg-gray-200 dark:bg-gray-700 rounded opacity-30"
              />
            );
          }

          return (
            <div
              key={idx}
              className={`flex items-center gap-1 transition-all duration-300 ${
                isRevealed ? 'opacity-100 scale-100' : 'opacity-50 scale-95'
              }`}
            >
              {line.type === 'yang' ? (
                <div
                  className={`w-24 h-3 rounded ${
                    line.isChanging
                      ? 'bg-amber-500 dark:bg-amber-400'
                      : 'bg-gray-800 dark:bg-gray-200'
                  }`}
                />
              ) : (
                <div className="flex gap-2">
                  <div
                    className={`w-10 h-3 rounded ${
                      line.isChanging
                        ? 'bg-amber-500 dark:bg-amber-400'
                        : 'bg-gray-800 dark:bg-gray-200'
                    }`}
                  />
                  <div
                    className={`w-10 h-3 rounded ${
                      line.isChanging
                        ? 'bg-amber-500 dark:bg-amber-400'
                        : 'bg-gray-800 dark:bg-gray-200'
                    }`}
                  />
                </div>
              )}
              {line.isChanging && (
                <span className="text-xs text-amber-500 ml-2">
                  {line.type === 'yang' ? '○' : '×'}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
        Line {Math.min(currentLine + 1, 6)} of 6
      </p>
    </div>
  );
}
