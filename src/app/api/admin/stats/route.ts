import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    const adminClient = createAdminClient();
    
    // Get total tools
    const { count: totalTools } = await adminClient
      .from('tools')
      .select('*', { count: 'exact', head: true });
    
    // Get total submissions
    const { count: totalSubmissions } = await adminClient
      .from('submissions')
      .select('*', { count: 'exact', head: true });
    
    // Get pending submissions
    const { count: pendingSubmissions } = await adminClient
      .from('submissions')
      .select('*', { count: 'exact', head: true })
      .eq('reviewed', false);
    
    // Get total collaborations (submissions with category 'collaboration')
    const { count: totalCollaborations } = await adminClient
      .from('submissions')
      .select('*', { count: 'exact', head: true })
      .eq('category', 'collaboration');
    
    const stats = {
      totalTools: totalTools || 0,
      totalSubmissions: totalSubmissions || 0,
      pendingSubmissions: pendingSubmissions || 0,
      totalCollaborations: totalCollaborations || 0
    };
    
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}