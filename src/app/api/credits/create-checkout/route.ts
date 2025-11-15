import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { stripe, CREDIT_PACKAGES, CreditPackageId } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Please sign in to purchase credits.' },
        { status: 401 }
      );
    }

    const { packageId } = await request.json();

    if (!packageId || !(packageId in CREDIT_PACKAGES)) {
      return NextResponse.json(
        { error: 'Invalid package selected' },
        { status: 400 }
      );
    }

    const pkg = CREDIT_PACKAGES[packageId as CreditPackageId];

    // Get or create customer email
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single();

    const customerEmail = profile?.email || user.email;

    if (!customerEmail) {
      return NextResponse.json(
        { error: 'Email address is required for checkout' },
        { status: 400 }
      );
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${pkg.label} AI Credits`,
              description: pkg.description,
              metadata: {
                credits: pkg.totalCredits.toString(),
                bonus: pkg.bonus.toString(),
              },
            },
            unit_amount: pkg.amount * 100, // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${request.headers.get('origin')}/credits?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.headers.get('origin')}/credits?canceled=true`,
      customer_email: customerEmail,
      client_reference_id: user.id,
      metadata: {
        user_id: user.id,
        package_id: packageId,
        credits: pkg.credits.toString(),
        bonus_credits: pkg.bonus.toString(),
        total_credits: pkg.totalCredits.toString(),
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url
    });

  } catch (error) {
    console.error('Checkout session creation error:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Failed to create checkout session: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create checkout session. Please try again.' },
      { status: 500 }
    );
  }
}
