import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const category = searchParams.get('category');
    const sort = searchParams.get('sort') || 'rating';
    
    let query = supabase
      .from('tools')
      .select('*')
      .eq('approved', true);
    
    // Apply category filter
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }
    
    // Apply sorting
    switch (sort) {
      case 'rating':
        query = query.order('avg_rating', { ascending: false });
        break;
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      case 'popular':
        query = query.order('click_count', { ascending: false });
        break;
      default:
        query = query.order('avg_rating', { ascending: false });
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching tools:', error);
      return NextResponse.json({ error: 'Failed to fetch tools' }, { status: 500 });
    }
    
    
    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error in tools API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    
    const {
      title,
      claude_url,
      category,
      description,
      creator_name,
      creator_link,
      creator_background,
      thumbnail_url
    } = body;
    
    // Validate required fields
    if (!title || !claude_url || !category || !description || !creator_name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Insert new tool
    const { data, error } = await supabase
      .from('tools')
      .insert({
        title,
        claude_url,
        category,
        description,
        creator_name,
        creator_link: creator_link || null,
        creator_background: creator_background || null,
        thumbnail_url: thumbnail_url || null,
        approved: true // For MVP, auto-approve. In production, set to false for moderation
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating tool:', error);
      return NextResponse.json({ error: 'Failed to create tool' }, { status: 500 });
    }
    
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error in tools POST API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}