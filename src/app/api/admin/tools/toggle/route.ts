import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const adminClient = createAdminClient();
    const { toolId, approved } = await request.json();
    
    if (!toolId || typeof approved !== 'boolean') {
      return NextResponse.json({ error: 'Tool ID and approved status required' }, { status: 400 });
    }
    
    const { data, error } = await adminClient
      .from('tools')
      .update({ approved })
      .eq('id', toolId)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating tool status:', error);
      return NextResponse.json({ error: 'Failed to update tool status' }, { status: 500 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error toggling tool approval:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}