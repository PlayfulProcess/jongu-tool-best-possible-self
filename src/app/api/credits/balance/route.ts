import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET() {
  try {
    // Check authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Please sign in to view your balance.' },
        { status: 401 }
      );
    }

    // Get wallet balance
    const { data: wallet, error: walletError } = await supabase
      .from('user_ai_wallets')
      .select('credits_usd, bonus_credits, created_at, updated_at')
      .eq('user_id', user.id)
      .single();

    if (walletError && walletError.code !== 'PGRST116') {
      // PGRST116 is "no rows returned" - this is ok for new users
      console.error('Error fetching wallet:', walletError);
      return NextResponse.json(
        { error: 'Failed to fetch balance' },
        { status: 500 }
      );
    }

    // If no wallet exists, return zero balance
    if (!wallet) {
      return NextResponse.json({
        credits_usd: 0,
        bonus_credits: 0,
        total_credits: 0,
        total_usd: 0,
      });
    }

    const totalCredits = (wallet.credits_usd || 0) + (wallet.bonus_credits || 0);

    return NextResponse.json({
      credits_usd: wallet.credits_usd || 0,
      bonus_credits: wallet.bonus_credits || 0,
      total_credits: totalCredits,
      total_usd: totalCredits,
      created_at: wallet.created_at,
      updated_at: wallet.updated_at,
    });

  } catch (error) {
    console.error('Balance API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch balance' },
      { status: 500 }
    );
  }
}
