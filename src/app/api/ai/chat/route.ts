import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase-server';

const DAILY_FREE_LIMIT = 10;
const COST_PER_MESSAGE = 0.01; // $0.01 per message (actual OpenAI cost: ~$0.001 with gpt-4o-mini)

// Oracle context types for I Ching and future oracles
interface IChingReading {
  question: string;
  primaryHexagram: {
    number: number;
    english_name: string;
    chinese_name: string;
    pinyin: string;
    judgment: string;
    image: string;
    meaning: string;
    unicode: string;
  };
  changingLines: number[];
  lineTexts?: Record<number, string>;
  transformedHexagram?: {
    number: number;
    english_name: string;
    chinese_name: string;
    judgment: string;
    meaning: string;
  } | null;
}

interface IChingContext {
  type: 'iching';
  readings: IChingReading[];
}

type OracleContext = IChingContext; // Will expand to IChingContext | TarotContext in future

function buildSingleReadingSection(reading: IChingReading, index: number, total: number): string {
  const prefix = total > 1 ? `\n### Reading ${index + 1} of ${total}\n` : '';

  let section = `${prefix}
QUESTION: "${reading.question}"

PRIMARY HEXAGRAM (#${reading.primaryHexagram.number} - ${reading.primaryHexagram.english_name}):
${reading.primaryHexagram.unicode} ${reading.primaryHexagram.chinese_name} (${reading.primaryHexagram.pinyin})

The Judgment: ${reading.primaryHexagram.judgment}

The Image: ${reading.primaryHexagram.image}

Overall Meaning: ${reading.primaryHexagram.meaning}`;

  if (reading.changingLines.length > 0 && reading.lineTexts) {
    section += `

CHANGING LINES (especially significant):`;
    for (const lineNum of reading.changingLines) {
      if (reading.lineTexts[lineNum]) {
        section += `
- Line ${lineNum}: ${reading.lineTexts[lineNum]}`;
      }
    }
  }

  if (reading.transformedHexagram) {
    section += `

TRANSFORMED HEXAGRAM (#${reading.transformedHexagram.number} - ${reading.transformedHexagram.english_name}):
The situation is evolving toward: ${reading.transformedHexagram.meaning}`;
  }

  return section;
}

function buildOraclePromptSection(oracle: OracleContext): string {
  if (oracle.type === 'iching' && oracle.readings.length > 0) {
    const readingsText = oracle.readings
      .map((reading, index) => buildSingleReadingSection(reading, index, oracle.readings.length))
      .join('\n\n---\n');

    return `

---
I CHING READING${oracle.readings.length > 1 ? 'S' : ''} CONTEXT:

The user has cast ${oracle.readings.length} I Ching reading${oracle.readings.length > 1 ? 's' : ''} for this session.

${readingsText}

When discussing the I Ching reading${oracle.readings.length > 1 ? 's' : ''}:
- Connect the hexagram's wisdom to the user's question and journal content
- Explain symbolism in accessible terms
- The changing lines show where transformation is occurring
- Be supportive but honest - I Ching readings can contain warnings
- Encourage the user's own insight rather than prescriptive advice
${oracle.readings.length > 1 ? '- Consider how multiple readings might relate to each other or show evolution of thought' : ''}
---`;
  }

  return '';
}

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

    const { message, content, history = [], oracleContext } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    // Build oracle context section if provided
    const oracleSection = oracleContext ? buildOraclePromptSection(oracleContext as OracleContext) : '';

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

    const systemPrompt = `You are a compassionate empathy buddy with a thorough understanding of psychology, mythology, religion, and sociology.

Core Principles:
- **Validation First** (DBT): Always acknowledge and validate feelings before offering perspectives
- **Empathy**: Listen deeply with genuine care and understanding
- **Insight**: Draw from psychology, mythology, religion, and spiritual wisdom
- **Support**: Help process emotions and gain clarity
- **Non-judgmental**: Accept all feelings and experiences as valid

Current journal context: "${content || 'The user is beginning their self-reflection journey'}"
${oracleSection}

Be warm, conversational, and insightful. Ask thoughtful questions that promote self-reflection. Help users explore their inner world with curiosity and compassion.

IMPORTANT: Format your responses with clear paragraph breaks. Use double line breaks between different thoughts or topics to make your response easy to read and digest. Avoid long blocks of text.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...history,  // Include full conversation history
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