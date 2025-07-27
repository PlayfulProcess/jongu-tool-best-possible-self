-- Community Tools Addition Migration
-- This ONLY adds new tables and does NOT modify existing BPS data
-- Safe to run on existing database with data

-- ===========================================
-- PART 1: Community Tools Tables (NEW ONLY)
-- ===========================================

-- Tools table for storing community wellness tools
CREATE TABLE IF NOT EXISTS public.tools (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  claude_url TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('mindfulness', 'distress-tolerance', 'emotion-regulation', 'interpersonal-effectiveness')),
  description TEXT NOT NULL,
  creator_name TEXT NOT NULL,
  creator_link TEXT,
  creator_background TEXT,
  thumbnail_url TEXT,
  avg_rating DECIMAL(2,1) DEFAULT 0,
  total_ratings INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ratings table for user ratings and reviews
CREATE TABLE IF NOT EXISTS public.ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tool_id UUID REFERENCES public.tools(id) ON DELETE CASCADE,
  user_ip TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tool_id, user_ip)
);

-- Submissions table for new tool submissions awaiting approval
CREATE TABLE IF NOT EXISTS public.submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  claude_url TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  creator_name TEXT NOT NULL,
  creator_link TEXT,
  creator_background TEXT,
  thumbnail_url TEXT,
  submitter_ip TEXT,
  reviewed BOOLEAN DEFAULT false,
  approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- PART 2: RLS for New Tables Only
-- ===========================================

-- Enable RLS on new community tables only
ALTER TABLE public.tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for community tools (public read access)
CREATE POLICY "Anyone can view approved tools" ON public.tools
  FOR SELECT USING (approved = true);

CREATE POLICY "Anyone can view ratings" ON public.ratings
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert ratings" ON public.ratings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view submissions" ON public.submissions
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert submissions" ON public.submissions
  FOR INSERT WITH CHECK (true);

-- ===========================================
-- PART 3: Add Updated_at Trigger to New Tables
-- ===========================================

-- Add updated_at trigger to tools table (function should already exist)
CREATE OR REPLACE TRIGGER handle_updated_at BEFORE UPDATE ON public.tools
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ===========================================
-- PART 4: Storage Setup (Safe)
-- ===========================================

-- Create storage bucket for thumbnails (will be created if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('thumbnails', 'thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for thumbnail uploads (only if not exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Public Access Thumbnails') THEN
    CREATE POLICY "Public Access Thumbnails" ON storage.objects FOR SELECT USING (bucket_id = 'thumbnails');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Authenticated Upload Thumbnails') THEN
    CREATE POLICY "Authenticated Upload Thumbnails" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'thumbnails');
  END IF;
END
$$;

-- ===========================================
-- PART 5: NO MOCK DATA - Empty Tables Ready
-- ===========================================

-- Verification message
SELECT 'Community Tools tables added successfully. No existing data affected.' as status;