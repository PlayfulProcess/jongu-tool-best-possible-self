-- Create journal_templates table
CREATE TABLE IF NOT EXISTS public.journal_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  ui_prompt text NOT NULL, -- What user sees in textarea placeholder
  ai_prompt text, -- Optional AI assistant system prompt
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Add template_id to journal_entries
ALTER TABLE public.journal_entries
ADD COLUMN IF NOT EXISTS template_id uuid REFERENCES public.journal_templates(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.journal_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies for journal_templates
-- Everyone can view all public templates (Phase 1: all templates are public)
CREATE POLICY "Anyone can view templates"
  ON public.journal_templates
  FOR SELECT
  USING (true);

-- Authenticated users can create templates
CREATE POLICY "Authenticated users can create templates"
  ON public.journal_templates
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own templates
CREATE POLICY "Users can update own templates"
  ON public.journal_templates
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own templates
CREATE POLICY "Users can delete own templates"
  ON public.journal_templates
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_journal_templates_user_id ON public.journal_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_templates_created_at ON public.journal_templates(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_journal_entries_template_id ON public.journal_entries(template_id);

-- Insert default template (Best Possible Self)
INSERT INTO public.journal_templates (
  id,
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
) ON CONFLICT (id) DO NOTHING;

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