'use client';

import { useState, useEffect } from 'react';
import { fetchAllBooks, getDefaultBookId, getSavedBookId, saveBookId } from '@/lib/custom-iching';
import { BookOption } from '@/types/custom-iching.types';

interface IChingBookSelectorProps {
  selectedBookId: string | null;
  onBookChange: (bookId: string) => void;
  userId?: string | null;
  disabled?: boolean;
}

// Default placeholder image for books without covers
const DEFAULT_COVER = 'data:image/svg+xml,' + encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 300" fill="none">
    <rect width="200" height="300" fill="#1a1a2e"/>
    <rect x="10" y="10" width="180" height="280" rx="8" stroke="#f59e0b" stroke-width="2" fill="none"/>
    <text x="100" y="140" text-anchor="middle" fill="#f59e0b" font-size="48">☯</text>
    <text x="100" y="180" text-anchor="middle" fill="#f59e0b" font-size="12" font-family="serif">I CHING</text>
  </svg>
`);

export function IChingBookSelector({
  selectedBookId,
  onBookChange,
  userId,
  disabled = false
}: IChingBookSelectorProps) {
  const [books, setBooks] = useState<BookOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const [previewBook, setPreviewBook] = useState<BookOption | null>(null);

  const selectedBook = books.find(b => b.id === selectedBookId);

  // Separate user books from community books and fallback
  const userBooks = books.filter(b => b.source === 'user');
  const communityBooks = books.filter(b => b.source === 'community');
  const fallbackBooks = books.filter(b => b.source === 'fallback');

  // Load books and set default selection
  useEffect(() => {
    async function loadBooks() {
      try {
        setLoading(true);
        const loadedBooks = await fetchAllBooks(userId);
        setBooks(loadedBooks);

        // Set default selection if none selected
        if (!selectedBookId && loadedBooks.length > 0) {
          const savedId = getSavedBookId();
          const defaultId = getDefaultBookId(loadedBooks, savedId);
          if (defaultId) {
            onBookChange(defaultId);
          }
        } else if (selectedBookId && !loadedBooks.some(b => b.id === selectedBookId)) {
          // Selected book no longer exists, reset to default
          const defaultId = getDefaultBookId(loadedBooks, null);
          if (defaultId) {
            onBookChange(defaultId);
          }
        }
      } catch (err) {
        console.error('Failed to load books:', err);
      } finally {
        setLoading(false);
      }
    }
    loadBooks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleBookClick = (book: BookOption) => {
    // If clicking the same book that's in preview, do nothing
    if (previewBook?.id === book.id) {
      return;
    }
    // Show info panel for this book
    setPreviewBook(book);
  };

  const handleSelectBook = (bookId: string) => {
    onBookChange(bookId);
    saveBookId(bookId);
    setShowPopup(false);
    setPreviewBook(null);
  };

  const getSourceLabel = (source: BookOption['source']): string => {
    switch (source) {
      case 'user': return 'Your Book';
      case 'community': return 'Community';
      case 'fallback': return 'Classic';
      default: return '';
    }
  };

  const renderBookGrid = (bookList: BookOption[], title?: string) => (
    <>
      {title && (
        <h4 className="text-sm font-medium text-gray-400 mb-2 mt-4 first:mt-0">
          {title}
        </h4>
      )}
      <div className="grid grid-cols-3 gap-3">
        {bookList.map(book => (
          <button
            key={book.id}
            onClick={() => handleBookClick(book)}
            className={`relative aspect-[2/3] rounded-lg overflow-hidden transition-all ${
              previewBook?.id === book.id
                ? 'ring-2 ring-amber-500 ring-offset-2 ring-offset-gray-800'
                : 'hover:ring-2 hover:ring-amber-400 hover:ring-offset-1 hover:ring-offset-gray-800'
            }`}
          >
            {/* Cover Image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={book.cover_image_url || DEFAULT_COVER}
              alt={book.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = DEFAULT_COVER;
              }}
            />

            {/* Selected Checkmark */}
            {book.id === selectedBookId && (
              <div className="absolute top-1 right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">✓</span>
              </div>
            )}

            {/* Source badge */}
            {book.source !== 'community' && (
              <div className={`absolute top-1 left-1 px-1.5 py-0.5 text-white text-[10px] font-medium rounded ${
                book.source === 'user' ? 'bg-amber-600' : 'bg-gray-600'
              }`}>
                {getSourceLabel(book.source)}
              </div>
            )}

            {/* Book Name Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
              <p className="text-white text-xs font-medium truncate">{book.name}</p>
            </div>
          </button>
        ))}
      </div>
    </>
  );

  return (
    <div className="mb-4">
      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
        Choose I Ching Book
      </label>

      <div className="flex gap-2">
        {/* Main Book Button */}
        <button
          onClick={() => setShowPopup(true)}
          disabled={disabled || loading}
          className="flex-1 px-3 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium transition-all hover:bg-amber-700 disabled:opacity-50 flex items-center justify-between"
        >
          <span className="truncate">
            {loading ? 'Loading...' : selectedBook ? `☯ ${selectedBook.name}` : '☯ Choose Book'}
          </span>
          <span className="ml-2">▼</span>
        </button>
      </div>

      {/* Selected book info */}
      {selectedBook && (
        <p className="text-xs text-amber-400 mt-2">
          {selectedBook.name} by {selectedBook.creator_name || 'Unknown'} ({selectedBook.hexagram_count} hexagrams)
          {selectedBook.source === 'user' && <span className="ml-1 text-amber-300">(Your book)</span>}
        </p>
      )}

      {/* Book Picker Popup */}
      {showPopup && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-lg w-full max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-700 flex justify-between items-center shrink-0">
              <h3 className="text-lg font-semibold text-white">Choose I Ching Book</h3>
              <button
                onClick={() => { setShowPopup(false); setPreviewBook(null); }}
                className="text-gray-400 hover:text-white text-xl p-1"
              >
                ✕
              </button>
            </div>

            {/* Book Grid */}
            <div className="overflow-y-auto flex-1 p-4">
              {/* User's Books Section */}
              {userBooks.length > 0 && renderBookGrid(userBooks, '📚 Your Books')}

              {/* Community Books Section */}
              {communityBooks.length > 0 && renderBookGrid(communityBooks, userBooks.length > 0 ? '🌍 Community Books' : undefined)}

              {/* Fallback/Classic Books Section */}
              {fallbackBooks.length > 0 && renderBookGrid(fallbackBooks, (userBooks.length > 0 || communityBooks.length > 0) ? '📖 Classic' : undefined)}

              {/* Empty State */}
              {books.length === 0 && !loading && (
                <div className="text-center py-8">
                  <p className="text-gray-400 mb-4">No I Ching books available.</p>
                  <p className="text-gray-500 text-sm">Using classic interpretations.</p>
                </div>
              )}
            </div>

            {/* Preview Panel - shows when a book is clicked */}
            {previewBook && (
              <div className="border-t border-gray-700 p-4 bg-gray-750 shrink-0">
                <div className="flex gap-3">
                  {/* Mini Cover */}
                  <div className="w-16 h-24 rounded-lg overflow-hidden shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewBook.cover_image_url || DEFAULT_COVER}
                      alt={previewBook.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = DEFAULT_COVER;
                      }}
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-semibold truncate">{previewBook.name}</h4>
                    <p className="text-gray-400 text-sm">
                      by {previewBook.creator_name || 'Unknown'} • {previewBook.hexagram_count} hexagrams
                    </p>
                    {previewBook.source !== 'community' && (
                      <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded ${
                        previewBook.source === 'user'
                          ? 'bg-amber-600/50 text-amber-200'
                          : 'bg-gray-600/50 text-gray-200'
                      }`}>
                        {getSourceLabel(previewBook.source)}
                      </span>
                    )}
                    {previewBook.description && (
                      <p className="text-gray-500 text-xs mt-1 line-clamp-2">{previewBook.description}</p>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleSelectBook(previewBook.id)}
                    className="flex-1 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm transition-colors flex items-center justify-center gap-1"
                  >
                    <span>✓</span> Select
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
