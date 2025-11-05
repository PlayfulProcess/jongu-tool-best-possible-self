-- =====================================================
-- SIMPLE RLS POLICIES FOR EXISTING journal_templates TABLE
-- No table creation, no complexity, just privacy policies
-- =====================================================

-- Enable RLS on existing table
ALTER TABLE public.journal_templates ENABLE ROW LEVEL SECURITY;

-- Drop old policies (clean slate)
DROP POLICY IF EXISTS "Anyone can view templates" ON public.journal_templates;
DROP POLICY IF EXISTS "Authenticated users can create templates" ON public.journal_templates;
DROP POLICY IF EXISTS "Users can update own templates" ON public.journal_templates;
DROP POLICY IF EXISTS "Users can delete own templates" ON public.journal_templates;

-- =====================================================
-- SIMPLE RLS POLICIES
-- Users can see ALL templates (system + their own)
-- Users can ONLY edit/delete their OWN templates
-- =====================================================

-- Everyone can view all templates (system templates + user templates)
CREATE POLICY "Anyone can view templates"
  ON public.journal_templates
  FOR SELECT
  USING (true);

-- Authenticated users can create their own templates
CREATE POLICY "Authenticated users can create templates"
  ON public.journal_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update ONLY their own templates (not system templates)
CREATE POLICY "Users can update own templates"
  ON public.journal_templates
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete ONLY their own templates
CREATE POLICY "Users can delete own templates"
  ON public.journal_templates
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- DONE! No special roles, no complexity
-- You can manually add system templates later via SQL Editor
-- =====================================================
