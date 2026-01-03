// Custom I Ching Book API Library

import { IChingBook, BookOption, IChingBookDocumentData } from '@/types/custom-iching.types';
import { HexagramData } from '@/types/iching.types';
import { createClient } from '@/lib/supabase-client';

// Use local API for I Ching books
const getApiBase = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return '';
};

// Cache for loaded books
const bookCache = new Map<string, IChingBook>();

// Cache for book list (keyed by userId for user-specific caching)
const bookListCache = new Map<string, { books: BookOption[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// localStorage key for selected book
const SELECTED_BOOK_KEY = 'iching_selected_book_id';

/**
 * Get the saved book ID from localStorage
 */
export function getSavedBookId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(SELECTED_BOOK_KEY);
}

/**
 * Save the selected book ID to localStorage
 */
export function saveBookId(bookId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SELECTED_BOOK_KEY, bookId);
}

/**
 * Get the base URL based on environment
 * Uses dev subdomain for dev/localhost, production otherwise
 */
function getEnvironmentBase(subdomain: string): string {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host.includes('dev.') || host.includes('localhost')) {
      return `https://dev.${subdomain}.recursive.eco`;
    }
  }
  return `https://${subdomain}.recursive.eco`;
}

/**
 * Get the I Ching viewer URL (environment-aware)
 */
export function getIChingViewerUrl(bookId: string): string {
  const base = typeof window !== 'undefined' &&
    (window.location.hostname.includes('dev.') || window.location.hostname.includes('localhost'))
    ? 'https://dev.recursive.eco'
    : 'https://recursive.eco';
  return `${base}/pages/iching-viewer.html?bookId=${bookId}`;
}

/**
 * Get the Creator URL for editing a book/hexagram
 * Uses clean URL format: /dashboard/iching/{bookId}?hexagram={hexagramNumber}
 */
export function getCreatorEditUrl(bookId: string, hexagramNumber?: number): string {
  const creatorBase = getEnvironmentBase('creator');
  const baseUrl = `${creatorBase}/dashboard/iching/${bookId}`;
  if (hexagramNumber) {
    return `${baseUrl}?hexagram=${hexagramNumber}`;
  }
  return baseUrl;
}

/**
 * Get the Creator URL for creating a new I Ching book
 */
export function getCreatorNewBookUrl(): string {
  return `${getEnvironmentBase('creator')}/dashboard/iching/new`;
}

/**
 * Fetch community books from the I Ching channel API
 */
async function fetchCommunityBooks(): Promise<BookOption[]> {
  const apiBase = getApiBase();

  if (!apiBase) {
    return [];
  }

  try {
    const url = `${apiBase}/api/iching-channel/books`;
    const res = await fetch(url, { cache: 'no-store' });

    if (!res.ok) {
      console.warn('Failed to fetch community books:', res.status);
      return [];
    }

    const data = await res.json();
    const books = data.books || data || [];

    return books.map((b: IChingBook & { created_at?: string; user_id?: string }) => ({
      id: b.id,
      name: b.name,
      description: b.description,
      creator_name: b.creator_name,
      creator_id: b.user_id,
      cover_image_url: b.cover_image_url,
      hexagram_count: b.hexagram_count,
      created_at: b.created_at,
      source: 'community' as const
    }));
  } catch (error) {
    console.error('Failed to fetch community books:', error);
    return [];
  }
}

/**
 * Fetch user's own books from user_documents table
 */
async function fetchUserBooks(userId: string): Promise<BookOption[]> {
  if (!userId) return [];

  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('user_documents')
      .select('id, document_data, created_at')
      .eq('user_id', userId)
      .eq('document_type', 'iching_book');

    if (error) {
      console.error('Failed to fetch user books:', error);
      return [];
    }

    if (!data) return [];

    return data.map((doc: { id: string; document_data: Record<string, unknown>; created_at: string }) => {
      const bookData = doc.document_data as unknown as IChingBookDocumentData;

      return {
        id: doc.id,
        name: bookData.name || 'Untitled Book',
        description: bookData.description,
        creator_name: 'You',
        creator_id: userId,
        cover_image_url: bookData.cover_image_url,
        hexagram_count: Array.isArray(bookData.hexagrams) ? bookData.hexagrams.length : 0,
        created_at: doc.created_at,
        source: 'user' as const,
      };
    });
  } catch (error) {
    console.error('Failed to fetch user books:', error);
    return [];
  }
}

/**
 * Create a fallback book option for the classic I Ching
 */
function getFallbackBookOption(): BookOption {
  return {
    id: 'classic',
    name: 'Classic I Ching',
    description: 'Traditional I Ching interpretations based on the Wilhelm/Baynes translation',
    creator_name: 'Traditional',
    hexagram_count: 64,
    source: 'fallback' as const
  };
}

/**
 * Fetch all books from multiple sources
 * Returns: user's own books first, then community books, with fallback last
 */
export async function fetchAllBooks(userId?: string | null): Promise<BookOption[]> {
  const cacheKey = userId || 'anonymous';
  const cached = bookListCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.books;
  }

  // Fetch from both sources in parallel
  const [communityBooks, userBooks] = await Promise.all([
    fetchCommunityBooks(),
    userId ? fetchUserBooks(userId) : Promise.resolve([])
  ]);

  // Combine books: user's books first, then community books
  const allBooks = [...userBooks, ...communityBooks];

  // Sort: user books first (newest first), then community books (oldest first for "classic" first)
  allBooks.sort((a, b) => {
    // User books always come first
    if (a.source !== b.source) {
      return a.source === 'user' ? -1 : 1;
    }
    // User books: newest first; Community books: oldest first
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return a.source === 'user' ? dateB - dateA : dateA - dateB;
  });

  // Always include fallback as last option if no books available
  // or add as an option users can fall back to
  if (allBooks.length === 0) {
    allBooks.push(getFallbackBookOption());
  }

  bookListCache.set(cacheKey, { books: allBooks, timestamp: Date.now() });
  return allBooks;
}

/**
 * Fetch a specific book with all its hexagrams
 * Supports both API books and user_documents books
 */
export async function fetchBookWithHexagrams(bookId: string): Promise<IChingBook | null> {
  // Handle fallback book
  if (bookId === 'classic') {
    return getFallbackBook();
  }

  // Check cache first
  if (bookCache.has(bookId)) {
    return bookCache.get(bookId)!;
  }

  // Try API first
  const apiBase = getApiBase();
  if (apiBase) {
    try {
      const res = await fetch(`${apiBase}/api/iching-channel/books/${bookId}`);

      if (res.ok) {
        const book = await res.json();
        bookCache.set(bookId, book);
        return book;
      }
    } catch (error) {
      console.warn('API fetch failed, trying user_documents:', error);
    }
  }

  // Try user_documents table for user books
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('user_documents')
      .select('id, user_id, document_data, created_at')
      .eq('id', bookId)
      .eq('document_type', 'iching_book')
      .single();

    if (error || !data) {
      console.warn('Failed to fetch book from user_documents:', bookId, error);
      return null;
    }

    const bookData = data.document_data as IChingBookDocumentData;

    const book: IChingBook = {
      id: data.id,
      name: bookData.name || 'Untitled Book',
      description: bookData.description,
      creator_name: bookData.creator_name || 'You',
      cover_image_url: bookData.cover_image_url,
      hexagram_count: bookData.hexagrams?.length || 0,
      hexagrams: bookData.hexagrams || [],
      created_at: data.created_at
    };

    bookCache.set(bookId, book);
    return book;
  } catch (error) {
    console.error('Failed to fetch book:', error);
    return null;
  }
}

/**
 * Get the fallback book (loads from static JSON)
 */
async function getFallbackBook(): Promise<IChingBook> {
  // Check cache first
  if (bookCache.has('classic')) {
    return bookCache.get('classic')!;
  }

  try {
    // Load from static JSON file
    const response = await fetch('/data/iching-hexagrams.json');
    if (!response.ok) {
      throw new Error(`Failed to load hexagram data: ${response.status}`);
    }

    const data = await response.json();
    const hexagrams = data.hexagrams || data;

    const book: IChingBook = {
      id: 'classic',
      name: 'Classic I Ching',
      description: 'Traditional I Ching interpretations based on the Wilhelm/Baynes translation',
      creator_name: 'Traditional',
      hexagram_count: 64,
      hexagrams
    };

    bookCache.set('classic', book);
    return book;
  } catch (error) {
    console.error('Error loading fallback hexagram data:', error);
    // Return placeholder book
    return {
      id: 'classic',
      name: 'Classic I Ching',
      description: 'Traditional I Ching interpretations',
      creator_name: 'Traditional',
      hexagram_count: 64,
      hexagrams: getPlaceholderHexagrams()
    };
  }
}

/**
 * Get a specific hexagram from a book
 */
export async function getHexagramFromBook(
  bookId: string,
  hexagramNumber: number
): Promise<HexagramData | null> {
  const book = await fetchBookWithHexagrams(bookId);
  if (!book) return null;

  const hexagram = book.hexagrams.find((h) => h.number === hexagramNumber);
  return hexagram || null;
}

/**
 * Get the default book ID for a user
 * - If user has a saved preference and it still exists, use it
 * - Otherwise return the first available book
 */
export function getDefaultBookId(
  books: BookOption[],
  userSavedBookId?: string | null
): string | null {
  if (books.length === 0) return null;

  // If user has a saved preference and it still exists, use it
  if (userSavedBookId && books.some(b => b.id === userSavedBookId)) {
    return userSavedBookId;
  }

  // Prefer community books over fallback
  const communityBook = books.find(b => b.source === 'community');
  if (communityBook) return communityBook.id;

  // Fallback to first available
  return books[0].id;
}

/**
 * Clear the book cache (useful after publishing a new book)
 */
export function clearBookCache(): void {
  bookCache.clear();
  bookListCache.clear();
}

/**
 * Pre-load a book into cache
 */
export async function preloadBook(bookId: string): Promise<void> {
  if (!bookCache.has(bookId)) {
    await fetchBookWithHexagrams(bookId);
  }
}

/**
 * Get placeholder hexagrams for when data isn't loaded
 */
function getPlaceholderHexagrams(): HexagramData[] {
  return Array.from({ length: 64 }, (_, i) => ({
    number: i + 1,
    chinese_name: '?',
    pinyin: 'Unknown',
    english_name: `Hexagram ${i + 1}`,
    binary: '000000',
    unicode: '䷀',
    trigram_above: { name: 'Unknown', chinese: '?' },
    trigram_below: { name: 'Unknown', chinese: '?' },
    judgment: 'Loading hexagram data...',
    image: 'Please ensure the hexagram data file is properly loaded.',
    lines: {
      1: 'Line 1 interpretation pending...',
      2: 'Line 2 interpretation pending...',
      3: 'Line 3 interpretation pending...',
      4: 'Line 4 interpretation pending...',
      5: 'Line 5 interpretation pending...',
      6: 'Line 6 interpretation pending...',
    },
    meaning: 'Hexagram data is being loaded. Please wait.',
  }));
}
