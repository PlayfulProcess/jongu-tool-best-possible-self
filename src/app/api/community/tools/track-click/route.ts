import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const adminClient = createAdminClient();
    const body = await request.json();
    const { toolId } = body;
    
    if (!toolId) {
      return NextResponse.json({ error: 'Tool ID is required' }, { status: 400 });
    }
    
    // First get current click count, then increment
    const { data: tool, error: getError } = await adminClient
      .from('tools')
      .select('click_count')
      .eq('id', toolId)
      .single();
    
    if (!getError && tool) {
      // Increment click count for analytics
      const { error } = await adminClient
        .from('tools')
        .update({
          click_count: (tool.click_count || 0) + 1
        })
        .eq('id', toolId);
        
      if (error) {
        console.error('Error tracking click:', error);
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in track-click API:', error);
    return NextResponse.json({ success: true }); // Don't fail the request
  }
}