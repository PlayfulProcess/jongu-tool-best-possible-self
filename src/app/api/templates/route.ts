import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: templates, error } = await supabase
      .from('journal_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching templates:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, ui_prompt, ai_prompt } = body;

    if (!name || !ui_prompt) {
      return NextResponse.json(
        { error: 'Name and UI prompt are required' },
        { status: 400 }
      );
    }

    // Check if user can set AI prompt
    const userEmail = user.email;
    const canSetAIPrompt = userEmail?.endsWith('@playfulprocess.com') || false;

    const { data: template, error } = await supabase
      .from('journal_templates')
      .insert({
        user_id: user.id,
        name,
        description,
        ui_prompt,
        ai_prompt: canSetAIPrompt ? ai_prompt : null
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating template:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}