'use client';

import { useState } from 'react';

interface QuestionInputProps {
  onCast: (question: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export default function QuestionInput({ onCast, isLoading = false, disabled = false }: QuestionInputProps) {
  const [question, setQuestion] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim() && !isLoading && !disabled) {
      onCast(question.trim());
    }
  };

  const exampleQuestions = [
    'What should I focus on in my career right now?',
    'How can I improve my relationship with...?',
    'What is the best approach to this decision?',
    'What do I need to understand about this situation?',
  ];

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-serif mb-2 dark:text-white">
          Ask the Oracle
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Focus on your question, then cast the hexagram. Open-ended questions work best.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="question" className="sr-only">
            Your question
          </label>
          <textarea
            id="question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="What guidance do you seek?"
            className="w-full p-4 border border-gray-300 dark:border-gray-600 rounded-lg
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                       placeholder-gray-400 dark:placeholder-gray-500
                       focus:ring-2 focus:ring-amber-500 focus:border-transparent
                       resize-none transition-colors"
            rows={3}
            disabled={isLoading || disabled}
          />
        </div>

        <button
          type="submit"
          disabled={!question.trim() || isLoading || disabled}
          className="w-full py-3 px-6 bg-amber-600 hover:bg-amber-700
                     disabled:bg-gray-400 disabled:cursor-not-allowed
                     text-white font-medium rounded-lg
                     transition-colors duration-200
                     flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Casting Hexagram...
            </>
          ) : (
            <>
              <span className="text-lg">☰</span>
              Cast Hexagram
            </>
          )}
        </button>
      </form>

      {/* Example questions */}
      <div className="mt-6">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
          Example questions:
        </p>
        <div className="flex flex-wrap gap-2">
          {exampleQuestions.map((eq, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setQuestion(eq)}
              disabled={isLoading || disabled}
              className="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-700
                         text-gray-600 dark:text-gray-300
                         rounded-full hover:bg-gray-200 dark:hover:bg-gray-600
                         disabled:opacity-50 disabled:cursor-not-allowed
                         transition-colors"
            >
              {eq}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
