import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.OPENAI_API_KEY;
  console.log('API Key length:', apiKey?.length);
  console.log('API Key starts with:', apiKey?.substring(0, 10));
  
  return NextResponse.json({ 
    message: 'API is working',
    env: apiKey ? 'API key found' : 'API key missing',
    keyLength: apiKey?.length || 0,
    keyStart: apiKey?.substring(0, 10) || 'none'
  });
} 