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
-- Only run if is_private column doesn't exist
-- =====================================================

-- Check if is_private exists, add if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'journal_templates'
        AND column_name = 'is_private'
    ) THEN
        ALTER TABLE public.journal_templates
        ADD COLUMN is_private boolean DEFAULT true;

        RAISE NOTICE 'Added is_private column';
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
-- STEP 6: Create Indexes for Performance
-- =====================================================

-- Index for privacy filtering
CREATE INDEX IF NOT EXISTS idx_journal_templates_is_private
    ON public.journal_templates(is_private);

-- Index for system templates
CREATE INDEX IF NOT EXISTS idx_journal_templates_is_system
    ON public.journal_templates(is_system);

-- Composite index for the common SELECT query pattern
CREATE INDEX IF NOT EXISTS idx_journal_templates_visibility
    ON public.journal_templates(is_system, is_private, user_id);

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
-- Useful for the application to check access rights
-- =====================================================

CREATE OR REPLACE FUNCTION public.can_access_template(template_id UUID)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
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
SECURITY DEFINER
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