-- Fix RLS Policies Migration
-- Add missing UPDATE policy for tools table to allow rating updates

-- ===========================================
-- PART 1: Add Missing UPDATE Policy for Tools
-- ===========================================

-- This allows the rating API to update avg_rating and total_ratings
CREATE POLICY "Anyone can update tool ratings" ON public.tools
  FOR UPDATE USING (true) 
  WITH CHECK (true);

-- ===========================================
-- PART 2: Verification
-- ===========================================

-- List all policies on tools table to verify
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'tools'
ORDER BY cmd, policyname;