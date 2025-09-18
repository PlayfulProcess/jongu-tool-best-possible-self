-- Debug RLS policy for template creation
-- Run this in Supabase SQL Editor to debug the email check

-- Check what the current user's email looks like in different contexts
SELECT
  auth.uid() as user_id,
  auth.jwt() ->> 'email' as jwt_email,
  auth.jwt() -> 'email' as jwt_email_raw,
  auth.jwt() as full_jwt;

-- Temporarily create a more permissive policy for testing
DROP POLICY IF EXISTS "Debug template creation" ON public.journal_templates;

CREATE POLICY "Debug template creation"
  ON public.journal_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    -- Temporarily allow all ai_prompt values for debugging
  );

-- You can test template creation now, then restore the original policy:
--
-- DROP POLICY IF EXISTS "Debug template creation" ON public.journal_templates;
--
-- CREATE POLICY "Authenticated users can create templates"
--   ON public.journal_templates
--   FOR INSERT
--   TO authenticated
--   WITH CHECK (
--     (SELECT auth.uid()) = user_id
--     AND
--     (
--       ai_prompt IS NULL
--       OR
--       (SELECT auth.jwt() ->> 'email' ILIKE '%@playfulprocess.com')
--     )
--   );