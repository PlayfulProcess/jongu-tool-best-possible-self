import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import OpenAI from 'openai';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createClient as createServerSupabaseClient } from '@/lib/supabase-server';

const PROMPT_TOKEN_RATE = Number(process.env.AI_PROMPT_TOKEN_RATE ?? 0.00015);
const COMPLETION_TOKEN_RATE = Number(process.env.AI_COMPLETION_TOKEN_RATE ?? 0.0006);
const CACHE_TTL_MS = Number(process.env.AI_CACHE_TTL_MS ?? 30) * 60 * 1000; // default 30 minutes

interface ChatRequestBody {
  message: string;
  content: string;
  tarotQuestion?: string;
  templateId?: string;
}

async function logSecurityEvent(userId: string, eventType: string, metadata: Record<string, unknown> = {}) {
  if (!supabaseAdmin) return;
  try {
    await supabaseAdmin.rpc('insert_security_event', {
      p_user_id: userId,
      p_event_type: eventType,
      p_metadata: metadata,
    });
  } catch {
    // ignore logging failures
  }
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OPENAI_API_KEY is not configured.');
      return NextResponse.json({ error: 'AI assistant is temporarily unavailable.' }, { status: 500 });
    }

    if (!supabaseAdmin) {
      console.error('Supabase admin client not configured (missing SUPABASE_SERVICE_ROLE_KEY).');
      return NextResponse.json({ error: 'Server configuration incomplete.' }, { status: 500 });
    }

    const body = (await request.json()) as ChatRequestBody;
    const { message, content, tarotQuestion = '', templateId } = body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: 'Message is required.' }, { status: 400 });
    }

    if (!content || typeof content !== 'string' || content.trim().length < 50) {
      return NextResponse.json(
        { error: 'Please write at least 50 characters in your journal before asking the tarot assistant.' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Please sign in to use the AI assistant.' }, { status: 401 });
    }

    const hashInput = [
      templateId ?? 'default',
      tarotQuestion.trim().toLowerCase(),
      content.trim().toLowerCase(),
      message.trim().toLowerCase(),
    ].join('::');
    const hashKey = createHash('sha256').update(hashInput).digest('hex');

    const cacheCutoff = new Date(Date.now() - CACHE_TTL_MS).toISOString();
    const { data: cached } = await supabaseAdmin
      .from('cached_ai_responses')
      .select('response, prompt_tokens, completion_tokens, usd_cost')
      .eq('hash_key', hashKey)
      .gte('created_at', cacheCutoff)
      .maybeSingle();

    if (cached?.response) {
      return NextResponse.json({
        response: cached.response,
        usage: {
          promptTokens: cached.prompt_tokens ?? 0,
          completionTokens: cached.completion_tokens ?? 0,
          usdCost: cached.usd_cost ?? 0,
          source: 'cache' as const,
        },
      });
    }

    const openai = new OpenAI({ apiKey });
    const systemPrompt = `You are a positive psychology coach and mentor specializing in the "Best Possible Self" exercise, an evidence-based practice curated by Berkeley's Greater Good Science Center. Your role is to guide users through deep self-reflection and help them envision their most authentic, fulfilled future self.

Core principles:
- Focus on personal growth, values, and authentic self-discovery
- Ask thoughtful questions that promote self-reflection
- Help users explore their strengths, passions, and deeper aspirations  
- Encourage optimism while being realistic about personal development
- Guide them to connect their current actions with their future vision
- Support psychological well-being and flourishing

Tarot prompt: "${tarotQuestion || 'User did not share a specific tarot prompt.'}"
Current journal context: "${content}"

Approach the user as a caring mentor would – with curiosity about their inner world, genuine encouragement for their growth, and wisdom about human potential. Ask meaningful questions, reflect back their strengths, and help them see possibilities they might not have considered.

Keep responses warm, insightful, and focused on their personal development. Use double line breaks between separate ideas.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      max_tokens: 400,
      temperature: 0.7,
    });

    const aiMessage = completion.choices[0]?.message?.content;
    if (!aiMessage) {
      return NextResponse.json({ error: 'The tarot assistant could not respond. Please try again.' }, { status: 500 });
    }

    const promptTokens = completion.usage?.prompt_tokens ?? 0;
    const completionTokens = completion.usage?.completion_tokens ?? 0;
    const usdCost = promptTokens * PROMPT_TOKEN_RATE + completionTokens * COMPLETION_TOKEN_RATE;

    const { error: quotaError } = await supabaseAdmin.rpc('enforce_ai_quota', {
      p_user_id: user.id,
      p_prompt_tokens: promptTokens,
      p_completion_tokens: completionTokens,
      p_cost: usdCost,
    });

    if (quotaError) {
      await logSecurityEvent(user.id, 'quota_violation', {
        promptTokens,
        completionTokens,
        usdCost,
        message: quotaError.message,
      });

      return NextResponse.json(
        { error: 'You reached the daily tarot guidance limit. Save and start a new session tomorrow or add credits.' },
        { status: 429 }
      );
    }

    try {
      await supabaseAdmin
        .from('cached_ai_responses')
        .insert({
          hash_key: hashKey,
          user_id: user.id,
          template_id: templateId ?? null,
          tarot_question: tarotQuestion || null,
          content_excerpt: content.slice(0, 400),
          response: aiMessage,
          prompt_tokens: promptTokens,
          completion_tokens: completionTokens,
          usd_cost: usdCost,
        });
    } catch {
      // cache insert is best-effort
    }

    return NextResponse.json({
      response: aiMessage,
      usage: {
        promptTokens,
        completionTokens,
        usdCost,
        source: 'live' as const,
      },
    });
  } catch (error) {
    console.error('AI Chat Error:', error);

    if (error instanceof Error) {
      if (error.message.includes('401')) {
        return NextResponse.json({ error: 'Invalid OpenAI API key. Please contact support.' }, { status: 401 });
      }
      if (error.message.includes('429')) {
        return NextResponse.json(
          { error: 'OpenAI rate limit exceeded. Please wait a moment and try again.' },
          { status: 429 }
        );
      }
      if (error.message.includes('quota')) {
        return NextResponse.json(
          { error: 'AI quota temporarily unavailable. Please try again soon.' },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to process the AI request. Please try again.' },
      { status: 500 }
    );
  }
}
