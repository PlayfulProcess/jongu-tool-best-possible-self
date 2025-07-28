import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    const adminClient = createAdminClient();
    
    const { data: submissions, error } = await adminClient
      .from('submissions')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching submissions:', error);
      return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
    }
    
    return NextResponse.json(submissions);
  } catch (error) {
    console.error('Error in submissions API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}