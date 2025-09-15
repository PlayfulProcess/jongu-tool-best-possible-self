-- Ensure uuid-ossp extension is available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA extensions;

-- Create journal_templates table (following Supabase best practices)
CREATE TABLE IF NOT EXISTS public.journal_templates (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  uuid uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  ui_prompt text NOT NULL, -- What user sees in textarea placeholder
  ai_prompt text, -- Optional AI assistant system prompt
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Note: template_id is stored in user_documents.document_data JSON field
-- No need to alter user_documents table as it already stores flexible JSON data

-- Enable RLS
ALTER TABLE public.journal_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies for journal_templates (following Supabase best practices)
-- Everyone can view all public templates (Phase 1: all templates are public)
CREATE POLICY "Anyone can view templates"
  ON public.journal_templates
  FOR SELECT
  USING (true);

-- Authenticated users can create templates
CREATE POLICY "Authenticated users can create templates"
  ON public.journal_templates
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Users can update their own templates
CREATE POLICY "Users can update own templates"
  ON public.journal_templates
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Users can delete their own templates
CREATE POLICY "Users can delete own templates"
  ON public.journal_templates
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_journal_templates_user_id ON public.journal_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_templates_created_at ON public.journal_templates(created_at DESC);

-- Insert default template (Best Possible Self)
INSERT INTO public.journal_templates (
  uuid,
  user_id,
  name,
  description,
  ui_prompt,
  ai_prompt
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  NULL, -- System template, no owner
  'Best Possible Self',
  'Envision your ideal future and the person you aspire to become',
  'Imagine yourself in the future, having achieved your most important goals and living your best possible life. Write about what you see, feel, and experience. Be as specific and vivid as possible...',
  'You are a supportive life coach helping users explore and articulate their vision of their best possible future self. Be encouraging, ask thoughtful questions to help them dig deeper into their vision, and help them identify concrete steps they might take toward their goals. Focus on growth, possibility, and positive change while remaining grounded and practical.'
) ON CONFLICT (uuid) DO NOTHING;

-- Insert sample templates for inspiration
INSERT INTO public.journal_templates (
  user_id,
  name,
  description,
  ui_prompt,
  ai_prompt
) VALUES
(
  NULL,
  'Gratitude Journal',
  'Cultivate appreciation and positive thinking',
  'What are three things you''re grateful for today? Describe each one and why it matters to you...',
  'You are a mindfulness coach helping users deepen their gratitude practice. Help them explore not just what they''re grateful for, but why these things matter and how gratitude can shift their perspective. Encourage specific, detailed reflections.'
),
(
  NULL,
  'Problem-Solving Journal',
  'Work through challenges with clarity and creativity',
  'Describe a challenge you''re facing. What are the facts? What are your feelings about it? What solutions can you brainstorm?',
  'You are a strategic thinking coach helping users work through problems systematically. Guide them to separate facts from emotions, consider multiple perspectives, and generate creative solutions. Be analytical yet empathetic.'
),
(
  NULL,
  'Daily Reflection',
  'Process your day and extract meaningful insights',
  'How was your day? What went well? What could have been better? What did you learn?',
  'You are a reflective thinking partner helping users process their daily experiences. Help them identify patterns, celebrate wins, learn from challenges, and set intentions for tomorrow. Be curious and non-judgmental.'
);