import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
    // Debug: Log environment variable status
    const apiKey = process.env.OPENAI_API_KEY;
    console.log('API Key exists:', !!apiKey);
    console.log('API Key length:', apiKey?.length || 0);
    console.log('API Key starts with:', apiKey?.substring(0, 7) || 'none');
    
    // Check if API key is configured
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

    const systemPrompt = `You are a helpful AI assistant for the "Best Possible Self" exercise from Berkeley's Greater Good Science Center. 

The user is writing about their ideal future self. Help them with:
- Writing prompts and questions
- Expanding their ideas with vivid details
- Overcoming writer's block
- Encouragement and motivation

Current user's writing: "${content || 'No content written yet'}"

Be supportive, encouraging, and helpful. Keep responses concise and actionable.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      max_tokens: 200,
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