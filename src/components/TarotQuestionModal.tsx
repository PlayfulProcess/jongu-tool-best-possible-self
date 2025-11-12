'use client';

import { useEffect, useState } from 'react';

interface TarotQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (question: string) => void;
  initialQuestion?: string;
}

export function TarotQuestionModal({
  isOpen,
  onClose,
  onSubmit,
  initialQuestion = ''
}: TarotQuestionModalProps) {
  const [question, setQuestion] = useState(initialQuestion);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setQuestion(initialQuestion || '');
      setError('');
    }
  }, [initialQuestion, isOpen]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedQuestion = question.trim();

    if (!trimmedQuestion) {
      setError('Ask at least one clear question so the tarot can respond.');
      return;
    }

    onSubmit(trimmedQuestion);
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-purple-500">
                Tarot Guidance
              </p>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                Ask a Question to the Tarot
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label="Close tarot question modal"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
            Share the situation or question you would like clarity on. Your question will stay in this session
            and help the AI tailor its tarot-inspired guidance along with your journal entry.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                What would you like to ask?
              </label>
              <textarea
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="Example: What guidance do I need around changing careers right now?"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none dark:bg-gray-800 dark:border-gray-700 h-32 resize-none"
                maxLength={500}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Be as specific as you like - your words are only shared with the tarot assistant, not saved to your journal unless you write them there.
              </p>
            </div>

            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Share with the Tarot
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}