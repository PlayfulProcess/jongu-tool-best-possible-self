import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
  const { id } = await params;

  try {
    // Create Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase credentials');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500, headers: corsHeaders });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch the specific deck by ID
    const { data: doc, error } = await supabase
      .from('user_documents')
      .select('id, document_data, created_at, updated_at')
      .eq('id', id)
      .eq('document_type', 'tarot_deck')
      .eq('is_public', true)
      .single();

    if (error || !doc) {
      console.error('Error fetching deck:', error);
      return NextResponse.json(
        { error: 'Deck not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Transform to full deck format with cards
    const deck = {
      id: doc.id,
      name: doc.document_data?.name || 'Unnamed Deck',
      description: doc.document_data?.description || '',
      creator_name: doc.document_data?.creator_name || 'Anonymous',
      cover_image_url: doc.document_data?.cover_image_url || null,
      card_count: doc.document_data?.card_count || doc.document_data?.cards?.length || 0,
      tags: doc.document_data?.tags || [],
      created_at: doc.created_at,
      cards: doc.document_data?.cards || []
    };

    return NextResponse.json(deck, { headers: corsHeaders });

  } catch (error) {
    console.error('Error in tarot-channel/decks/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders });
  }
}
