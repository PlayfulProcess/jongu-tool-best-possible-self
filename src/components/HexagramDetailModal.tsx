'use client';

import { HexagramData } from '@/types/iching.types';
import { getIChingViewerUrl, getCreatorEditUrl } from '@/lib/custom-iching';

interface HexagramDetailModalProps {
  hexagram: HexagramData;
  bookId: string;
  bookName?: string;
  isUserBook: boolean;
  userId?: string | null;
  onClose: () => void;
}

export function HexagramDetailModal({
  hexagram,
  bookId,
  bookName,
  isUserBook,
  userId,
  onClose
}: HexagramDetailModalProps) {

  const handleViewFullBook = () => {
    const url = getIChingViewerUrl(bookId);
    window.open(url, '_blank');
  };

  const handleEditInCreator = () => {
    const url = getCreatorEditUrl(bookId, hexagram.number);
    window.open(url, '_blank');
  };

  const isClassicBook = bookId === 'classic';

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex justify-between items-center shrink-0 bg-gradient-to-r from-amber-900/50 to-orange-900/50">
          <div>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <span className="text-2xl">{hexagram.unicode}</span>
              {hexagram.english_name}
            </h3>
            <p className="text-sm text-gray-400">
              Hexagram {hexagram.number} • {hexagram.chinese_name} ({hexagram.pinyin})
              {bookName && <span className="ml-2 text-amber-400">from {bookName}</span>}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl p-1"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-4">
          <div className="space-y-6">
            {/* Trigrams */}
            <div className="flex justify-center gap-8 text-center">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Upper Trigram</p>
                <p className="text-amber-400 font-medium">
                  {hexagram.trigram_above.chinese} {hexagram.trigram_above.name}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Lower Trigram</p>
                <p className="text-amber-400 font-medium">
                  {hexagram.trigram_below.chinese} {hexagram.trigram_below.name}
                </p>
              </div>
            </div>

            {/* The Judgment */}
            {hexagram.judgment && (
              <div>
                <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">The Judgment</h4>
                <p className="text-gray-200">{hexagram.judgment}</p>
              </div>
            )}

            {/* The Image */}
            {hexagram.image && (
              <div>
                <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">The Image</h4>
                <p className="text-gray-200">{hexagram.image}</p>
              </div>
            )}

            {/* Meaning */}
            {hexagram.meaning && (
              <div className="p-3 bg-amber-900/30 rounded-lg border border-amber-700/50">
                <h4 className="text-xs font-medium text-amber-400 uppercase tracking-wider mb-1">Meaning</h4>
                <p className="text-amber-100">{hexagram.meaning}</p>
              </div>
            )}

            {/* Lines */}
            {hexagram.lines && (
              <div>
                <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Line Interpretations</h4>
                <div className="space-y-2">
                  {[6, 5, 4, 3, 2, 1].map((lineNum) => {
                    const lineKey = lineNum as keyof typeof hexagram.lines;
                    const lineText = hexagram.lines[lineKey];
                    if (!lineText) return null;

                    return (
                      <div key={lineNum} className="text-sm">
                        <span className="text-amber-500 font-medium">Line {lineNum}:</span>
                        <span className="text-gray-300 ml-2">
                          {typeof lineText === 'string' ? lineText : ''}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Binary */}
            <div className="text-center text-xs text-gray-500">
              Binary: {hexagram.binary}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 shrink-0 bg-gray-800/80">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Close
            </button>

            {/* View Full Book - available for non-classic books */}
            {!isClassicBook && (
              <button
                onClick={handleViewFullBook}
                className="px-4 py-2 bg-amber-600/50 hover:bg-amber-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <span>👁</span>
                View Book
              </button>
            )}

            {/* Edit in Creator - available for all non-classic books */}
            {!isClassicBook && (
              <button
                onClick={handleEditInCreator}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2"
              >
                <span>✏️</span>
                {isUserBook ? 'Edit in Creator' : 'Edit My Copy'}
              </button>
            )}
          </div>

          {isClassicBook && (
            <p className="text-center text-gray-500 text-xs mt-2">
              Classic I Ching interpretation
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
