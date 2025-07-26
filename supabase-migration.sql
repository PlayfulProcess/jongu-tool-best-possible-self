-- Migration script to update from privacy_setting to separate boolean columns
-- Run this in your Supabase SQL Editor

-- First, add the new columns to journal_entries (if they don't exist)
ALTER TABLE public.journal_entries 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS research_consent BOOLEAN DEFAULT FALSE;

-- Add the new columns to chat_messages (if they don't exist)
ALTER TABLE public.chat_messages 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS research_consent BOOLEAN DEFAULT FALSE;

-- Migrate existing data in journal_entries
UPDATE public.journal_entries 
SET 
  is_public = CASE 
    WHEN privacy_setting = 'public_blog' THEN TRUE 
    ELSE FALSE 
  END,
  research_consent = CASE 
    WHEN privacy_setting = 'research_consent' THEN TRUE 
    ELSE FALSE 
  END
WHERE privacy_setting IS NOT NULL;

-- Migrate existing data in chat_messages
UPDATE public.chat_messages 
SET 
  is_public = CASE 
    WHEN privacy_setting = 'public_blog' THEN TRUE 
    ELSE FALSE 
  END,
  research_consent = CASE 
    WHEN privacy_setting = 'research_consent' THEN TRUE 
    ELSE FALSE 
  END
WHERE privacy_setting IS NOT NULL;

-- Now drop the old privacy_setting columns (after confirming data is migrated correctly)
-- IMPORTANT: Only run these after confirming the migration worked correctly
-- ALTER TABLE public.journal_entries DROP COLUMN IF EXISTS privacy_setting;
-- ALTER TABLE public.chat_messages DROP COLUMN IF EXISTS privacy_setting;

-- Verify the migration worked by checking a few rows
SELECT id, is_public, research_consent FROM public.journal_entries LIMIT 5;
SELECT id, is_public, research_consent FROM public.chat_messages LIMIT 5;