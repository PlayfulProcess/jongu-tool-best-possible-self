import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const adminClient = createAdminClient();
    const { email } = await request.json();
    
    if (!email || !email.trim()) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if email already exists
    const { data: existingSubscriber, error: checkError } = await adminClient
      .from('newsletter_subscribers')
      .select('email')
      .eq('email', cleanEmail)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found" which is expected
      console.error('Error checking existing subscriber:', checkError);
      return NextResponse.json({ error: 'Database error occurred' }, { status: 500 });
    }

    if (existingSubscriber) {
      return NextResponse.json({ error: 'This email is already subscribed!' }, { status: 409 });
    }

    // Get subscriber info
    const subscriberIP = request.headers.get('x-forwarded-for') || 
                        request.headers.get('x-real-ip') || 
                        'unknown';

    // Insert new subscriber
    const { data, error } = await adminClient
      .from('newsletter_subscribers')
      .insert({
        email: cleanEmail,
        subscribed_at: new Date().toISOString(),
        ip_address: subscriberIP,
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating newsletter subscriber:', error);
      return NextResponse.json({ error: 'Failed to subscribe. Please try again.' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Successfully subscribed to newsletter!',
      data: { email: data.email }
    }, { status: 201 });

  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}