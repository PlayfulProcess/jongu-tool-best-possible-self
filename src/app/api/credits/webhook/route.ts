import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// IMPORTANT: Disable body parsing for webhooks
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      console.error('No Stripe signature found');
      return NextResponse.json(
        { error: 'No signature found' },
        { status: 400 }
      );
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: `Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}` },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('✅ Payment successful:', session.id);

        // Extract metadata
        const userId = session.metadata?.user_id;
        const credits = parseInt(session.metadata?.credits || '0', 10);
        const bonusCredits = parseInt(session.metadata?.bonus_credits || '0', 10);
        const totalCredits = parseInt(session.metadata?.total_credits || '0', 10);
        const packageId = session.metadata?.package_id;

        if (!userId || !totalCredits) {
          console.error('Missing required metadata in session:', session.id);
          return NextResponse.json(
            { error: 'Missing metadata' },
            { status: 400 }
          );
        }

        // Use service role for database operations
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Check if wallet exists, create if not
        const { data: existingWallet } = await supabase
          .from('user_ai_wallets')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (!existingWallet) {
          // Create new wallet
          await supabase
            .from('user_ai_wallets')
            .insert({
              user_id: userId,
              credits_usd: credits * 0.01, // Convert credits to USD
              bonus_credits: bonusCredits * 0.01,
            });
        } else {
          // Update existing wallet
          await supabase
            .from('user_ai_wallets')
            .update({
              credits_usd: existingWallet.credits_usd + (credits * 0.01),
              bonus_credits: existingWallet.bonus_credits + (bonusCredits * 0.01),
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId);
        }

        // Record transaction
        await supabase
          .from('payment_transactions')
          .insert({
            user_id: userId,
            amount: session.amount_total ? session.amount_total / 100 : 0, // Convert from cents
            currency: session.currency || 'usd',
            status: 'completed',
            stripe_payment_id: session.payment_intent as string,
            stripe_session_id: session.id,
            metadata: {
              package_id: packageId,
              credits,
              bonus_credits: bonusCredits,
              total_credits: totalCredits,
              customer_email: session.customer_email,
            },
          });

        console.log(`✅ Credited ${totalCredits} to user ${userId}`);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.error('❌ Payment failed:', paymentIntent.id);

        // You could record failed payments here if needed
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
