import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { HexagramData } from '@/types/iching.types';

// Trigram lookup for converting names to Chinese symbols
const TRIGRAM_LOOKUP: Record<string, { name: string; chinese: string }> = {
  'heaven': { name: 'Heaven', chinese: '☰ 乾' },
  'earth': { name: 'Earth', chinese: '☷ 坤' },
  'thunder': { name: 'Thunder', chinese: '☳ 震' },
  'water': { name: 'Water', chinese: '☵ 坎' },
  'mountain': { name: 'Mountain', chinese: '☶ 艮' },
  'wind': { name: 'Wind', chinese: '☴ 巽' },
  'fire': { name: 'Fire', chinese: '☲ 離' },
  'lake': { name: 'Lake', chinese: '☱ 兌' },
  // Alternative names
  'wood': { name: 'Wind/Wood', chinese: '☴ 巽' },
  'marsh': { name: 'Lake/Marsh', chinese: '☱ 兌' },
  'abyss': { name: 'Water', chinese: '☵ 坎' },
  'the creative': { name: 'Heaven', chinese: '☰ 乾' },
  'the receptive': { name: 'Earth', chinese: '☷ 坤' },
  'the arousing': { name: 'Thunder', chinese: '☳ 震' },
  'the abysmal': { name: 'Water', chinese: '☵ 坎' },
  'keeping still': { name: 'Mountain', chinese: '☶ 艮' },
  'the gentle': { name: 'Wind', chinese: '☴ 巽' },
  'the clinging': { name: 'Fire', chinese: '☲ 離' },
  'the joyous': { name: 'Lake', chinese: '☱ 兌' },
};

// CORS headers for cross-origin access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new Response(null, { headers: corsHeaders });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookId } = await params;

    // Create Supabase client with service role for public access
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase credentials');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500, headers: corsHeaders });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch the specific I Ching book
    const { data: bookDoc, error } = await supabase
      .from('user_documents')
      .select('id, document_data, created_at, updated_at, user_id')
      .eq('id', bookId)
      .or('document_type.eq.iching_book,tool_slug.eq.iching')
      .eq('is_public', true)
      .single();

    if (error || !bookDoc) {
      console.error('Error fetching I Ching book:', error);
      return NextResponse.json({ error: 'Book not found' }, { status: 404, headers: corsHeaders });
    }

    const data = bookDoc.document_data as {
      name?: string;
      description?: string;
      creator_name?: string;
      cover_image_url?: string;
      hexagrams?: HexagramData[];
    };

    // Normalize hexagrams to ensure consistent format
    const hexagrams = normalizeHexagrams(data?.hexagrams || []);

    const book = {
      id: bookDoc.id,
      name: data?.name || 'Unnamed Book',
      description: data?.description || '',
      creator_name: data?.creator_name || 'Anonymous',
      cover_image_url: data?.cover_image_url || null,
      hexagram_count: hexagrams.length,
      hexagrams,
      user_id: bookDoc.user_id,
      created_at: bookDoc.created_at
    };

    return NextResponse.json(book, { headers: corsHeaders });

  } catch (error) {
    console.error('Error in iching-channel/books/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders });
  }
}

/**
 * Normalize hexagrams from various formats to the standard HexagramData format
 * Handles BPS format and other variations
 */
function normalizeHexagrams(hexagrams: unknown[]): HexagramData[] {
  if (!Array.isArray(hexagrams)) return [];

  return hexagrams.map((hex: unknown) => {
    if (!hex || typeof hex !== 'object') {
      return createPlaceholderHexagram(0);
    }

    const h = hex as Record<string, unknown>;

    // Handle different field name variations
    const englishName = (h.english_name || h.name || `Hexagram ${h.number}`) as string;
    const meaning = (h.meaning || h.interpretation || '') as string;

    // Handle trigram variations
    const trigramAbove = normalizeTrigram(h.trigram_above);
    const trigramBelow = normalizeTrigram(h.trigram_below);

    // Handle lines in different formats
    const lines = normalizeLines(h.lines);

    return {
      number: (h.number || 0) as number,
      chinese_name: (h.chinese_name || '') as string,
      pinyin: (h.pinyin || '') as string,
      english_name: englishName,
      binary: (h.binary || '000000') as string,
      unicode: (h.unicode || '䷀') as string,
      trigram_above: trigramAbove,
      trigram_below: trigramBelow,
      judgment: (h.judgment || '') as string,
      image: (h.image || '') as string,
      lines,
      meaning,
    };
  });
}

/**
 * Normalize trigram from string or object format
 */
function normalizeTrigram(trigram: unknown): { name: string; chinese: string } {
  if (!trigram) {
    return { name: 'Unknown', chinese: '?' };
  }

  if (typeof trigram === 'string') {
    // Look up trigram by name
    const lookup = TRIGRAM_LOOKUP[trigram.toLowerCase()];
    if (lookup) {
      return lookup;
    }
    return { name: trigram, chinese: '?' };
  }

  if (typeof trigram === 'object') {
    const t = trigram as Record<string, unknown>;
    const name = (t.name || 'Unknown') as string;
    let chinese = (t.chinese || '') as string;

    // If chinese is empty or just "?", try to look up by name
    if (!chinese || chinese === '?') {
      const lookup = TRIGRAM_LOOKUP[name.toLowerCase()];
      if (lookup) {
        chinese = lookup.chinese;
      } else {
        chinese = '?';
      }
    }

    return { name, chinese };
  }

  return { name: 'Unknown', chinese: '?' };
}

/**
 * Extract text from a line value that might be a string or object
 */
function extractLineText(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    // Try common field names for line text
    if (typeof obj.text === 'string') return obj.text;
    if (typeof obj.interpretation === 'string') return obj.interpretation;
    if (typeof obj.meaning === 'string') return obj.meaning;
    if (typeof obj.content === 'string') return obj.content;
    if (typeof obj.description === 'string') return obj.description;
  }
  return '';
}

/**
 * Normalize lines from various formats (object with "1", "2", etc. or array)
 */
function normalizeLines(lines: unknown): Record<1 | 2 | 3 | 4 | 5 | 6, string> {
  const defaultLines: Record<1 | 2 | 3 | 4 | 5 | 6, string> = {
    1: '', 2: '', 3: '', 4: '', 5: '', 6: ''
  };

  if (!lines) return defaultLines;

  if (Array.isArray(lines)) {
    // Convert array to object format
    lines.forEach((line, index) => {
      const key = (index + 1) as 1 | 2 | 3 | 4 | 5 | 6;
      if (key >= 1 && key <= 6) {
        defaultLines[key] = extractLineText(line);
      }
    });
    return defaultLines;
  }

  if (typeof lines === 'object') {
    // Handle object format ({"1": "...", "2": "..."})
    const linesObj = lines as Record<string, unknown>;
    for (let i = 1; i <= 6; i++) {
      const key = i as 1 | 2 | 3 | 4 | 5 | 6;
      const value = linesObj[String(i)] || linesObj[i];
      if (value) {
        defaultLines[key] = extractLineText(value);
      }
    }
    return defaultLines;
  }

  return defaultLines;
}

/**
 * Create a placeholder hexagram
 */
function createPlaceholderHexagram(number: number): HexagramData {
  return {
    number,
    chinese_name: '?',
    pinyin: 'Unknown',
    english_name: `Hexagram ${number}`,
    binary: '000000',
    unicode: '䷀',
    trigram_above: { name: 'Unknown', chinese: '?' },
    trigram_below: { name: 'Unknown', chinese: '?' },
    judgment: 'No interpretation available.',
    image: 'No image text available.',
    lines: { 1: '', 2: '', 3: '', 4: '', 5: '', 6: '' },
    meaning: 'No meaning available.',
  };
}
