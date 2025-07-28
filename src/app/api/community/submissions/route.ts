import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const adminClient = createAdminClient();
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
    
    // Get submitter IP for tracking (unused in MVP but kept for future use)
    // const submitterIP = request.headers.get('x-forwarded-for') || 
    //                    request.headers.get('x-real-ip') || 
    //                    'unknown';
    
    // Insert submission (for MVP, we'll auto-approve and move to tools table)
    // In production, this would go to submissions table for review
    const { data, error } = await adminClient
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
        approved: true // Auto-approve for MVP
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating submission:', error);
      return NextResponse.json({ error: 'Failed to submit tool' }, { status: 500 });
    }
    
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error in submissions API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}