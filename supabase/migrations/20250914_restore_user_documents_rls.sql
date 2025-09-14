-- Restore/ensure RLS and policies for user_documents used by Best Possible Self
-- Safe to run multiple times; guards on policy existence

-- 1) Enable RLS on user_documents
DO $$
BEGIN
  EXECUTE 'ALTER TABLE public.user_documents ENABLE ROW LEVEL SECURITY';
EXCEPTION WHEN OTHERS THEN
  -- ignore if table or command not applicable in this project
  NULL;
END $$;

-- 2) Helper: ensure a consistent policy by name
-- Own-docs read
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_documents' AND policyname='documents_own_private'
  ) THEN
    EXECUTE $$CREATE POLICY "documents_own_private" ON public.user_documents
      FOR SELECT
      USING (
        -- owner can see their documents
        auth.uid() = user_id
        OR
        -- allow public docs read if flagged
        (is_public IS TRUE)
      )$$;
  END IF;
END $$;

-- Own-docs write (insert/update/delete)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_documents' AND policyname='documents_own_write'
  ) THEN
    EXECUTE $$CREATE POLICY "documents_own_write" ON public.user_documents
      FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id)$$;
  END IF;
END $$;

-- Optional narrow insert policy for tool_session rows if you prefer granular policies
-- Commented out by default; documents_own_write already covers
-- CREATE POLICY "documents_insert_tool_sessions" ON public.user_documents
--   FOR INSERT WITH CHECK (
--     auth.uid() = user_id AND document_type IN ('tool_session','interaction')
--   );

-- 3) Schema integrity hints (NO-OP if constraints already present)
-- Enforce/ensure user_id is UUID and references auth.users
DO $$
BEGIN
  -- Ensure column type UUID (will fail if cast is not safe; leave as hint if already correct)
  -- EXECUTE 'ALTER TABLE public.user_documents ALTER COLUMN user_id TYPE uuid USING user_id::uuid';
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$
BEGIN
  -- Add FK to auth.users if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    WHERE tc.table_schema='public' AND tc.table_name='user_documents' AND tc.constraint_type='FOREIGN KEY'
      AND tc.constraint_name='user_documents_user_id_fkey'
  ) THEN
    EXECUTE 'ALTER TABLE public.user_documents
      ADD CONSTRAINT user_documents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE';
  END IF;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 4) Helpful index
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname='public' AND tablename='user_documents' AND indexname='idx_user_documents_user_id_type_slug'
  ) THEN
    EXECUTE 'CREATE INDEX idx_user_documents_user_id_type_slug ON public.user_documents (user_id, document_type, tool_slug)';
  END IF;
END $$;
