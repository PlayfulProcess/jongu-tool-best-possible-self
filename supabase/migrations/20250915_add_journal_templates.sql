-- =====================================================
-- JOURNAL TEMPLATES SCHEMA
-- Incorporating Supabase copilot feedback
-- =====================================================

-- Ensure extensions schema exists
CREATE SCHEMA IF NOT EXISTS extensions;

-- Ensure uuid-ossp extension is available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA extensions;

-- Create journal_templates table (following Supabase best practices)
CREATE TABLE IF NOT EXISTS public.journal_templates (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  uuid uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  ui_prompt text NOT NULL, -- What user sees in textarea placeholder
  ai_prompt text, -- Optional AI assistant system prompt (restricted to @playfulprocess.com)
  is_system boolean DEFAULT false, -- Flag for system templates
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(uuid)
);

-- Enable RLS
ALTER TABLE public.journal_templates ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- IDEMPOTENT POLICY CREATION
-- Drops existing policies if they exist, then recreates
-- =====================================================

DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Anyone can view templates" ON public.journal_templates;
  DROP POLICY IF EXISTS "Authenticated users can create templates" ON public.journal_templates;
  DROP POLICY IF EXISTS "Users can update own templates" ON public.journal_templates;
  DROP POLICY IF EXISTS "Users can delete own templates" ON public.journal_templates;
END$$;

-- RLS POLICIES

-- Everyone can view all templates
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
CREATE INDEX IF NOT EXISTS idx_journal_templates_is_system ON public.journal_templates(is_system);
CREATE INDEX IF NOT EXISTS idx_journal_templates_name ON public.journal_templates(name);

-- Note: user_has_domain function removed - was for domain-based AI prompt restrictions
-- Keeping ai_prompt column in database for future development

-- =====================================================
-- INSERT SYSTEM TEMPLATES
-- Note: These should be inserted using service_role or admin
-- since they have user_id = NULL and is_system = true
-- =====================================================

-- Insert default template (Best Possible Self) - idempotent with ON CONFLICT
INSERT INTO public.journal_templates (
  uuid,
  user_id,
  name,
  description,
  ui_prompt,
  ai_prompt,
  is_system
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  NULL, -- System template, no owner
  'Best Possible Self',
  'Envision your ideal future and the person you aspire to become',
  'Imagine yourself in the future, having achieved your most important goals and living your best possible life. Write about what you see, feel, and experience. Be as specific and vivid as possible...',
  'You are a supportive life coach helping users explore and articulate their vision of their best possible future self. Be encouraging, ask thoughtful questions to help them dig deeper into their vision, and help them identify concrete steps they might take toward their goals. Focus on growth, possibility, and positive change while remaining grounded and practical.',
  true
) ON CONFLICT (uuid) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  ui_prompt = EXCLUDED.ui_prompt,
  ai_prompt = EXCLUDED.ai_prompt,
  updated_at = now();

-- Insert other system templates
INSERT INTO public.journal_templates (
  uuid,
  user_id,
  name,
  description,
  ui_prompt,
  ai_prompt,
  is_system
) VALUES
(
  '00000000-0000-0000-0000-000000000002'::uuid,
  NULL,
  'Gratitude Journal',
  'Cultivate appreciation and positive thinking',
  'What are three things you''re grateful for today? Describe each one and why it matters to you...',
  'You are a mindfulness coach helping users deepen their gratitude practice. Help them explore not just what they''re grateful for, but why these things matter and how gratitude can shift their perspective. Encourage specific, detailed reflections.',
  true
),
(
  '00000000-0000-0000-0000-000000000003'::uuid,
  NULL,
  'Problem-Solving Journal',
  'Work through challenges with clarity and creativity',
  'Describe a challenge you''re facing. What are the facts? What are your feelings about it? What solutions can you brainstorm?',
  'You are a strategic thinking coach helping users work through problems systematically. Guide them to separate facts from emotions, consider multiple perspectives, and generate creative solutions. Be analytical yet empathetic.',
  true
),
(
  '00000000-0000-0000-0000-000000000004'::uuid,
  NULL,
  'Daily Reflection',
  'Process your day and extract meaningful insights',
  'How was your day? What went well? What could have been better? What did you learn?',
  'You are a reflective thinking partner helping users process their daily experiences. Help them identify patterns, celebrate wins, learn from challenges, and set intentions for tomorrow. Be curious and non-judgmental.',
  true
),
(
  '00000000-0000-0000-0000-000000000005'::uuid,
  NULL,
  'AI Prompt Test - Pirate Coach',
  'Test template to verify AI prompts are working correctly',
  'Ahoy matey! Write about yer greatest adventure or treasure hunt. What be the most valuable thing ye discovered about yerself?',
  'You are a wise pirate captain who speaks in pirate language and gives life advice. Always respond with "Ahoy matey!" and use pirate terminology like "treasure," "adventure," "sail the seas," etc. Give encouraging advice but maintain the fun pirate persona throughout. End every response with "May fair winds fill yer sails!"',
  true
),
(
  '00000000-0000-0000-0000-000000000006'::uuid,
  NULL,
  'AI Test - Robot Coach',
  'Another test template with robotic AI behavior',
  'BEEP BOOP! Input your thoughts about efficiency and optimization in your daily routines. What processes can be improved?',
  'You are a helpful robot assistant. Always start responses with "BEEP BOOP!" and speak in a robotic manner using terms like "processing," "computing," "optimizing," "system analysis," etc. Give practical advice but maintain the robot personality. End every response with "END OF TRANSMISSION."',
  true
) ON CONFLICT (uuid) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  ui_prompt = EXCLUDED.ui_prompt,
  ai_prompt = EXCLUDED.ai_prompt,
  updated_at = now();

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE public.journal_templates IS 'Stores journal prompt templates for users';
COMMENT ON COLUMN public.journal_templates.ui_prompt IS 'The prompt text shown to users in the UI';
COMMENT ON COLUMN public.journal_templates.ai_prompt IS 'System prompt for AI assistant (restricted to @playfulprocess.com users)';
COMMENT ON COLUMN public.journal_templates.is_system IS 'Flag for system-provided templates (user_id NULL)';

-- =====================================================
-- ROLLBACK SCRIPT (commented out for safety)
-- =====================================================

/*
-- To rollback this migration:
DROP TABLE IF EXISTS public.journal_templates CASCADE;
DROP FUNCTION IF EXISTS public.user_has_domain(text);
*/