import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// CORS headers for cross-origin access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new Response(null, { headers: corsHeaders });
}

export async function GET() {
  try {
    // Create Supabase client with service role for public access
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase credentials');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500, headers: corsHeaders });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all public I Ching books
    // Support both 'iching_book' document_type and tool_slug='iching'
    const { data: bookDocs, error } = await supabase
      .from('user_documents')
      .select('id, document_data, created_at, updated_at, user_id')
      .or('document_type.eq.iching_book,tool_slug.eq.iching')
      .eq('is_public', true)
      .order('created_at', { ascending: true }); // Oldest first (classic book first)

    if (error) {
      console.error('Error fetching I Ching books:', error);
      return NextResponse.json({ error: 'Failed to fetch books' }, { status: 500, headers: corsHeaders });
    }

    // Transform to book format
    const books = (bookDocs || []).map(doc => {
      const data = doc.document_data as {
        name?: string;
        description?: string;
        creator_name?: string;
        cover_image_url?: string;
        hexagrams?: unknown[];
        hexagram_count?: number;
      };

      return {
        id: doc.id,
        name: data?.name || 'Unnamed Book',
        description: data?.description || '',
        creator_name: data?.creator_name || 'Anonymous',
        cover_image_url: data?.cover_image_url || null,
        hexagram_count: data?.hexagram_count || data?.hexagrams?.length || 0,
        user_id: doc.user_id,
        created_at: doc.created_at
      };
    });

    return NextResponse.json({ books }, { headers: corsHeaders });

  } catch (error) {
    console.error('Error in iching-channel/books:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders });
  }
}
