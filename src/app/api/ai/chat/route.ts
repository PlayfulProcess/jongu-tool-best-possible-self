import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase-server';

const DAILY_FREE_LIMIT = 10;
const COST_PER_MESSAGE = 0.01; // $0.01 per message (actual OpenAI cost: ~$0.001 with gpt-4o-mini)

export async function POST(request: NextRequest) {
  try {
    // Check if API key is configured
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      console.error('OpenAI API key is not configured');
      return NextResponse.json(
        { error: 'OpenAI API key is not configured. Please set OPENAI_API_KEY in your environment variables.' },
        { status: 500 }
      );
    }

    // Create Supabase client and check authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Please sign in to use the AI assistant.' },
        { status: 401 }
      );
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: apiKey,
    });

    const { message, content } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    // Get user profile to check usage
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('profile_data')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to check usage limits' },
        { status: 500 }
      );
    }

    // Initialize ai_usage if it doesn't exist
    const profileData = profile.profile_data || {};
    const aiUsage = profileData.ai_usage || { messages_today: 0, last_reset_date: new Date().toISOString().split('T')[0] };

    // Check if we need to reset daily counter
    const today = new Date().toISOString().split('T')[0];
    if (aiUsage.last_reset_date !== today) {
      aiUsage.messages_today = 0;
      aiUsage.last_reset_date = today;
    }

    // Check credits wallet
    const { data: wallet } = await supabase
      .from('user_ai_wallets')
      .select('credits_usd, bonus_credits')
      .eq('user_id', user.id)
      .single();

    const totalCredits = (wallet?.credits_usd || 0) + (wallet?.bonus_credits || 0);
    const hasCredits = totalCredits >= COST_PER_MESSAGE;

    // If no credits, check daily free limit
    if (!hasCredits && aiUsage.messages_today >= DAILY_FREE_LIMIT) {
      return NextResponse.json(
        {
          error: `You've reached your daily limit of ${DAILY_FREE_LIMIT} free messages. Purchase credits to continue using the AI assistant.`,
          usage: {
            messages_today: aiUsage.messages_today,
            daily_limit: DAILY_FREE_LIMIT,
            credits_remaining: totalCredits
          }
        },
        { status: 429 }
      );
    }

    const systemPrompt = `You are a positive psychology coach and mentor specializing in the "Best Possible Self" exercise, an evidence-based practice curated by Berkeley's Greater Good Science Center. Your role is to guide users through deep self-reflection and help them envision their most authentic, fulfilled future self.

Core principles:
- Focus on personal growth, values, and authentic self-discovery
- Ask thoughtful questions that promote self-reflection
- Help users explore their strengths, passions, and deeper aspirations  
- Encourage optimism while being realistic about personal development
- Guide them to connect their current actions with their future vision
- Support psychological well-being and flourishing

Current context: "${content || 'The user is just beginning their Best Possible Self journey'}"

Approach the user as a caring mentor would - with curiosity about their inner world, genuine encouragement for their growth, and wisdom about human potential. Ask meaningful questions, reflect back their strengths, and help them see possibilities they might not have considered.

Keep responses warm, insightful, and focused on their personal development rather than writing quality.

IMPORTANT: Format your responses with clear paragraph breaks. Use double line breaks between different thoughts or topics to make your response easy to read and digest. Avoid long blocks of text.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const aiResponse = response.choices[0]?.message?.content;

    if (!aiResponse) {
      return NextResponse.json(
        { error: 'No response generated from AI' },
        { status: 500 }
      );
    }

    // Update usage: deduct credits or increment message counter
    if (hasCredits) {
      // Deduct from wallet (bonus credits first, then regular credits)
      const bonusToUse = Math.min(wallet?.bonus_credits || 0, COST_PER_MESSAGE);
      const regularToUse = COST_PER_MESSAGE - bonusToUse;

      await supabase
        .from('user_ai_wallets')
        .update({
          credits_usd: (wallet?.credits_usd || 0) - regularToUse,
          bonus_credits: (wallet?.bonus_credits || 0) - bonusToUse,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);
    } else {
      // Increment free message counter
      aiUsage.messages_today += 1;
      profileData.ai_usage = aiUsage;

      await supabase
        .from('profiles')
        .update({
          profile_data: profileData,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
    }

    return NextResponse.json({
      response: aiResponse,
      usage: {
        messages_today: aiUsage.messages_today,
        daily_limit: DAILY_FREE_LIMIT,
        credits_remaining: hasCredits ? totalCredits - COST_PER_MESSAGE : totalCredits,
        used_credits: hasCredits
      }
    });

  } catch (error) {
    console.error('AI Chat Error:', error);
    
    // Handle specific OpenAI errors
    if (error instanceof Error) {
      console.log('Error message:', error.message);
      
      if (error.message.includes('401')) {
        return NextResponse.json(
          { error: 'Invalid OpenAI API key. Please check your API key configuration.' },
          { status: 401 }
        );
      }
      if (error.message.includes('429')) {
        return NextResponse.json(
          { error: 'OpenAI API rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      }
      if (error.message.includes('insufficient_quota') || error.message.includes('quota')) {
        return NextResponse.json(
          { error: 'OpenAI API quota exceeded. Please check your billing and add credits to your account.' },
          { status: 429 }
        );
      }
      if (error.message.includes('billing') || error.message.includes('payment')) {
        return NextResponse.json(
          { error: 'Billing issue with OpenAI account. Please check your payment method and billing settings.' },
          { status: 402 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to process AI request. Please try again.' },
      { status: 500 }
    );
  }
}