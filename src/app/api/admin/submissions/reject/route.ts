import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const adminClient = createAdminClient();
    const { submissionId } = await request.json();
    
    if (!submissionId) {
      return NextResponse.json({ error: 'Submission ID required' }, { status: 400 });
    }
    
    // Mark submission as reviewed and rejected
    const { data, error } = await adminClient
      .from('submissions')
      .update({
        reviewed: true,
        approved: false
      })
      .eq('id', submissionId)
      .select()
      .single();
    
    if (error) {
      console.error('Error rejecting submission:', error);
      return NextResponse.json({ error: 'Failed to reject submission' }, { status: 500 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error rejecting submission:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}