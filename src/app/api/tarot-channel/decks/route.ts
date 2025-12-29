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

    // Fetch all public tarot decks
    const { data: deckDocs, error } = await supabase
      .from('user_documents')
      .select('id, document_data, created_at, updated_at')
      .eq('document_type', 'tarot_deck')
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching decks:', error);
      return NextResponse.json({ error: 'Failed to fetch decks' }, { status: 500, headers: corsHeaders });
    }

    // Transform to deck format
    const decks = (deckDocs || []).map(doc => ({
      id: doc.id,
      name: doc.document_data?.name || 'Unnamed Deck',
      description: doc.document_data?.description || '',
      creator_name: doc.document_data?.creator_name || 'Anonymous',
      cover_image_url: doc.document_data?.cover_image_url || null,
      card_count: doc.document_data?.card_count || doc.document_data?.cards?.length || 0,
      tags: doc.document_data?.tags || [],
      created_at: doc.created_at
    }));

    return NextResponse.json({ decks }, { headers: corsHeaders });

  } catch (error) {
    console.error('Error in tarot-channel/decks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders });
  }
}
