'use client';

import { useState, useEffect, useRef } from 'react';

interface TimerProps {
  onTimeUpdate: (seconds: number) => void;
}

export function Timer({ onTimeUpdate }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes
  const [isRunning, setIsRunning] = useState(false);
  const [totalTime] = useState(15 * 60);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          const newTime = prev - 1;
          return newTime;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  // Update parent state when timeLeft changes
  useEffect(() => {
    onTimeUpdate(totalTime - timeLeft);
  }, [timeLeft, totalTime, onTimeUpdate]);

  const toggleTimer = () => setIsRunning(!isRunning);
  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(totalTime);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  return (
    <div className="flex items-center gap-6 mb-6 flex-wrap">
      {/* Timer Display */}
      <div className="w-24 h-24 border-3 border-blue-500 rounded-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
        <span className="font-mono text-lg text-gray-800 dark:text-gray-200">
          {minutes}:{seconds.toString().padStart(2, '0')}
        </span>
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        <button
          onClick={toggleTimer}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {isRunning ? '⏸️ Pause' : timeLeft === totalTime ? '▶️ Start Timer' : '▶️ Resume'}
        </button>
        
        <button
          onClick={resetTimer}
          className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          🔄 Reset
        </button>
      </div>

      {/* Progress Bar */}
      <div className="flex-1 min-w-[200px] h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div 
          className="h-full bg-blue-600 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
} 