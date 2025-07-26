import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

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

    const systemPrompt = `You are a positive psychology coach and mentor specializing in the "Best Possible Self" exercise from Berkeley's Greater Good Science Center. Your role is to guide users through deep self-reflection and help them envision their most authentic, fulfilled future self.

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
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      max_tokens: 400,
      temperature: 0.7,
    });

    const aiResponse = response.choices[0]?.message?.content;
    
    if (!aiResponse) {
      return NextResponse.json(
        { error: 'No response generated from AI' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      response: aiResponse
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