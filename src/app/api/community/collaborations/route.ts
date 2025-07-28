import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const adminClient = createAdminClient();
    const body = await request.json();
    
    const {
      name,
      email,
      organization,
      expertise,
      collaboration_type,
      message
    } = body;
    
    // Validate required fields
    if (!name || !email || !expertise || !collaboration_type || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Create submissions table entry (we'll use submissions table for collaborations too)
    const { data, error } = await adminClient
      .from('submissions')
      .insert({
        title: `Collaboration: ${collaboration_type}`,
        claude_url: 'collaboration-request',
        category: 'collaboration',
        description: message,
        creator_name: name,
        creator_link: organization || null,
        creator_background: `Email: ${email} | Expertise: ${expertise} | Type: ${collaboration_type}`,
        thumbnail_url: null,
        submitter_ip: request.headers.get('x-forwarded-for') || 'unknown',
        reviewed: false,
        approved: false
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating collaboration request:', error);
      return NextResponse.json({ error: 'Failed to submit collaboration request' }, { status: 500 });
    }
    
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error in collaborations API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}