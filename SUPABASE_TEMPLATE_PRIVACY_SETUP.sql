-- =====================================================
-- SUPABASE TEMPLATE PRIVACY SETUP
-- Single file with all SQL needed for template privacy
-- =====================================================

-- STEP 1: Verify Current Schema
-- Run this to check what we currently have:
/*
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'journal_templates'
ORDER BY ordinal_position;
*/

-- =====================================================
-- STEP 2: Update Schema (if needed)
-- Safe approach for large tables - avoids potential row rewrites
-- =====================================================

-- Check if is_private exists, add if missing (safer multi-step approach)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'journal_templates'
        AND column_name = 'is_private'
    ) THEN
        -- Step 1: Add column without default (no rewrite)
        ALTER TABLE public.journal_templates
        ADD COLUMN is_private boolean;

        -- Step 2: Set default for future inserts
        ALTER TABLE public.journal_templates
        ALTER COLUMN is_private SET DEFAULT true;

        RAISE NOTICE 'Added is_private column with safe multi-step approach';
    ELSE
        RAISE NOTICE 'is_private column already exists';
    END IF;
END $$;

-- =====================================================
-- STEP 3: Update Existing Data
-- Set privacy defaults for existing templates
-- =====================================================

-- Make all system templates public
UPDATE public.journal_templates
SET is_private = false
WHERE is_system = true;

-- Make all user templates private by default (if null)
UPDATE public.journal_templates
SET is_private = true
WHERE is_system = false
AND is_private IS NULL;

-- Show update summary
DO $$
DECLARE
    system_count INTEGER;
    user_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO system_count FROM public.journal_templates WHERE is_system = true;
    SELECT COUNT(*) INTO user_count FROM public.journal_templates WHERE is_system = false;

    RAISE NOTICE 'Data updated: % system templates (public), % user templates (private)', system_count, user_count;
END $$;

-- =====================================================
-- STEP 4: Drop Old Policies
-- Remove existing policies to avoid conflicts
-- =====================================================

-- Drop all existing RLS policies on journal_templates
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'journal_templates'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.journal_templates', pol.policyname);
        RAISE NOTICE 'Dropped policy: %', pol.policyname;
    END LOOP;
END $$;

-- =====================================================
-- STEP 5: Create New Simple RLS Policies
-- These are SIMPLE and RELIABLE - no JWT parsing!
-- =====================================================

-- Policy 1: Everyone can view public/system templates and their own templates
CREATE POLICY "view_templates_simple"
    ON public.journal_templates
    FOR SELECT
    USING (
        -- Show template if ANY of these conditions are true:
        is_system = true                    -- System templates (always public)
        OR is_private = false                -- Explicitly public templates
        OR user_id = auth.uid()             -- User's own templates
    );

-- Policy 2: Authenticated users can create templates (always as their own)
CREATE POLICY "create_own_templates"
    ON public.journal_templates
    FOR INSERT
    TO authenticated
    WITH CHECK (
        user_id = auth.uid()                -- Can only create as yourself
        AND is_system = false                -- Cannot create system templates
    );

-- Policy 3: Users can update only their own non-system templates
CREATE POLICY "update_own_templates"
    ON public.journal_templates
    FOR UPDATE
    TO authenticated
    USING (
        user_id = auth.uid()                -- Must own the template
        AND is_system = false                -- Cannot modify system templates
    )
    WITH CHECK (
        user_id = auth.uid()                -- Still owns after update
        AND is_system = false                -- Still not a system template
    );

-- Policy 4: Users can delete only their own non-system templates
CREATE POLICY "delete_own_templates"
    ON public.journal_templates
    FOR DELETE
    TO authenticated
    USING (
        user_id = auth.uid()                -- Must own the template
        AND is_system = false                -- Cannot delete system templates
    );

-- =====================================================
-- STEP 6: Create Efficient Indexes for Performance
-- Using partial indexes to minimize size and maximize performance
-- =====================================================

-- Partial index for public templates (faster public queries)
CREATE INDEX IF NOT EXISTS idx_public_templates
    ON public.journal_templates(created_at DESC)
    WHERE is_private = false;

-- Partial index for user-specific templates (faster user queries)
CREATE INDEX IF NOT EXISTS idx_user_templates
    ON public.journal_templates(user_id, created_at DESC)
    WHERE is_system = false;

-- Index for system templates (always visible)
CREATE INDEX IF NOT EXISTS idx_system_templates
    ON public.journal_templates(created_at DESC)
    WHERE is_system = true;

-- General index for privacy queries (fallback)
CREATE INDEX IF NOT EXISTS idx_journal_templates_is_private
    ON public.journal_templates(is_private);

-- =====================================================
-- INDEX PERFORMANCE EDUCATION
-- =====================================================

-- How these indexes work and why they're efficient:

-- 1. PARTIAL INDEXES (WHERE clause):
--    - Only index rows that match the condition
--    - Smaller index size = faster queries + less storage
--    - Example: idx_public_templates only indexes public templates

-- 2. QUERY PATTERNS OPTIMIZED:
--    - "Show all public templates" → uses idx_public_templates
--    - "Show user X's templates" → uses idx_user_templates
--    - "Show system templates" → uses idx_system_templates
--    - Mixed queries → fall back to idx_journal_templates_is_private

-- 3. INDEX SELECTIVITY:
--    - created_at DESC = good for "recent first" queries
--    - user_id = excellent selectivity (each user sees only their templates)
--    - WHERE clauses = eliminate irrelevant rows from index

-- 4. SIZE COMPARISON:
--    - Full table index: 100% of rows
--    - Partial index: Only matching rows (maybe 10-30%)
--    - Result: 3-10x smaller indexes = faster reads

-- 5. QUERY PLANNER USAGE:
--    PostgreSQL automatically chooses the most selective index
--    Use EXPLAIN ANALYZE to see which index is used:
--    EXPLAIN ANALYZE SELECT * FROM journal_templates WHERE is_private = false;

-- =====================================================
-- STEP 7: Test the Policies
-- Run these as different users to verify
-- =====================================================

-- Test 1: Check what the current user can see
/*
SELECT
    id,
    name,
    user_id,
    is_system,
    is_private,
    CASE
        WHEN user_id = auth.uid() THEN 'MINE'
        WHEN is_system = true THEN 'SYSTEM'
        WHEN is_private = false THEN 'PUBLIC'
        ELSE 'HIDDEN'
    END as visibility_reason
FROM public.journal_templates
ORDER BY created_at DESC;
*/

-- Test 2: Try creating a template (should work for authenticated users)
/*
INSERT INTO public.journal_templates (
    user_id,
    name,
    description,
    ui_prompt,
    is_private,
    is_system
) VALUES (
    auth.uid(),
    'Test Template',
    'Testing privacy',
    'Write about your test...',
    true,  -- Private by default
    false  -- Not a system template
) RETURNING id, name;
*/

-- Test 3: Count templates by visibility
/*
SELECT
    COUNT(*) FILTER (WHERE is_system = true) as system_templates,
    COUNT(*) FILTER (WHERE is_private = false AND is_system = false) as public_user_templates,
    COUNT(*) FILTER (WHERE is_private = true AND user_id = auth.uid()) as my_private_templates,
    COUNT(*) as total_visible
FROM public.journal_templates;
*/

-- =====================================================
-- STEP 8: Helper Function for Template Access Check
-- Safer SECURITY INVOKER approach (recommended)
-- =====================================================

CREATE OR REPLACE FUNCTION public.can_access_template(template_id UUID)
RETURNS boolean
LANGUAGE sql
SECURITY INVOKER  -- Safer: runs with caller's privileges
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.journal_templates
        WHERE uuid = template_id
        AND (
            is_system = true
            OR is_private = false
            OR user_id = auth.uid()
        )
    );
$$;

-- =====================================================
-- STEP 9: Function to Get Shareable Templates
-- Returns only templates that can be shared via URL
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_shareable_templates()
RETURNS TABLE(
    id bigint,
    uuid uuid,
    name text,
    description text,
    created_by uuid,
    is_system boolean
)
LANGUAGE sql
SECURITY INVOKER  -- Safer: runs with caller's privileges
STABLE
AS $$
    SELECT
        id,
        uuid,
        name,
        description,
        user_id as created_by,
        is_system
    FROM public.journal_templates
    WHERE is_private = false
    OR (user_id = auth.uid() AND is_system = false)
    ORDER BY
        CASE WHEN user_id = auth.uid() THEN 0 ELSE 1 END,
        created_at DESC;
$$;

-- =====================================================
-- ROLLBACK SCRIPT (if something goes wrong)
-- =====================================================

/*
-- To rollback these changes:

-- 1. Drop the new policies
DROP POLICY IF EXISTS "view_templates_simple" ON public.journal_templates;
DROP POLICY IF EXISTS "create_own_templates" ON public.journal_templates;
DROP POLICY IF EXISTS "update_own_templates" ON public.journal_templates;
DROP POLICY IF EXISTS "delete_own_templates" ON public.journal_templates;

-- 2. Drop helper functions
DROP FUNCTION IF EXISTS public.can_access_template(UUID);
DROP FUNCTION IF EXISTS public.get_shareable_templates();

-- 3. Restore old policies (you'll need to have saved these)
-- CREATE POLICY ... (your old policies here)

*/

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '===================================================';
    RAISE NOTICE 'TEMPLATE PRIVACY SETUP COMPLETE!';
    RAISE NOTICE '===================================================';
    RAISE NOTICE 'Templates visibility rules:';
    RAISE NOTICE '1. System templates: Always visible to everyone';
    RAISE NOTICE '2. Public templates: Visible to everyone';
    RAISE NOTICE '3. Private templates: Only visible to owner';
    RAISE NOTICE '';
    RAISE NOTICE 'Test by running the test queries in STEP 7';
    RAISE NOTICE '===================================================';
END $$;