import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    const adminClient = createAdminClient();
    
    const { data: tools, error } = await adminClient
      .from('tools')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching tools:', error);
      return NextResponse.json({ error: 'Failed to fetch tools' }, { status: 500 });
    }
    
    return NextResponse.json(tools);
  } catch (error) {
    console.error('Error in tools API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}