'use client';

import { useState } from 'react';

type OracleType = 'iching' | 'tarot';

interface OracleQuestionInputProps {
  oracleType: OracleType;
  onSubmit: (question: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  buttonLabel?: string;
  loadingLabel?: string;
}

const ORACLE_CONFIG = {
  iching: {
    accent: 'amber',
    icon: '☰',
    defaultPlaceholder: 'What guidance do you seek?',
    defaultButton: 'Cast Hexagram',
    defaultLoading: 'Casting...',
    examples: [
      'What should I focus on in my career right now?',
      'How can I improve my relationship with...?',
      'What is the best approach to this decision?',
      'What do I need to understand about this situation?',
    ],
  },
  tarot: {
    accent: 'purple',
    icon: '🃏',
    defaultPlaceholder: 'What guidance do you seek?',
    defaultButton: 'Draw Cards',
    defaultLoading: 'Drawing...',
    examples: [
      'What do I need to know about my current situation?',
      'What energies surround my relationship?',
      'What should I focus on this month?',
      'What is blocking my progress?',
    ],
  },
};

export function OracleQuestionInput({
  oracleType,
  onSubmit,
  isLoading = false,
  disabled = false,
  placeholder,
  buttonLabel,
  loadingLabel,
}: OracleQuestionInputProps) {
  const [question, setQuestion] = useState('');
  const config = ORACLE_CONFIG[oracleType];

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (question.trim() && !isLoading && !disabled) {
      onSubmit(question.trim());
      setQuestion('');
    }
  };

  const accentClasses = {
    iching: {
      input: 'focus:ring-amber-500 focus:border-amber-500',
      button: 'bg-amber-600 hover:bg-amber-700',
      tag: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/50',
    },
    tarot: {
      input: 'focus:ring-purple-500 focus:border-purple-500',
      button: 'bg-purple-600 hover:bg-purple-700',
      tag: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50',
    },
  };

  const classes = accentClasses[oracleType];

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder={placeholder || config.defaultPlaceholder}
          disabled={isLoading || disabled}
          className={`flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                     placeholder-gray-400 dark:placeholder-gray-500
                     focus:outline-none focus:ring-2 ${classes.input}
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors`}
        />
        <button
          type="submit"
          disabled={!question.trim() || isLoading || disabled}
          className={`px-4 py-2 ${classes.button} text-white rounded-lg
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors whitespace-nowrap flex items-center gap-2`}
        >
          {isLoading ? (
            loadingLabel || config.defaultLoading
          ) : (
            <>
              <span>{config.icon}</span>
              {buttonLabel || config.defaultButton}
            </>
          )}
        </button>
      </form>

      {/* Example questions - compact row */}
      <div className="flex flex-wrap gap-1.5">
        <span className="text-xs text-gray-400 dark:text-gray-500 self-center mr-1">Try:</span>
        {config.examples.slice(0, 2).map((eq, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setQuestion(eq)}
            disabled={isLoading || disabled}
            className={`text-xs px-2 py-0.5 ${classes.tag} rounded-full
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-colors truncate max-w-[200px]`}
          >
            {eq}
          </button>
        ))}
      </div>
    </div>
  );
}
