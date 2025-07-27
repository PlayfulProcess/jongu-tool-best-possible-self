-- Initial setup migration for Best Possible Self + Community Tools
-- This combines the BPS schema with community tools functionality

-- ===========================================
-- PART 1: Best Possible Self Schema
-- ===========================================

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create journal_entries table with new schema
CREATE TABLE IF NOT EXISTS public.journal_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  research_consent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat_messages table with new schema
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  journal_entry_id UUID REFERENCES public.journal_entries(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  role TEXT CHECK (role IN ('user', 'assistant')) NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  research_consent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- PART 2: Community Tools Schema
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
-- PART 3: Row Level Security Setup
-- ===========================================

-- Enable RLS on all public tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create RLS policies for journal_entries
CREATE POLICY "Users can view own journal entries" ON public.journal_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own journal entries" ON public.journal_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journal entries" ON public.journal_entries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own journal entries" ON public.journal_entries
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for chat_messages
CREATE POLICY "Users can view own chat messages" ON public.chat_messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat messages" ON public.chat_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat messages" ON public.chat_messages
  FOR DELETE USING (auth.uid() = user_id);

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
-- PART 4: Functions and Triggers
-- ===========================================

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE OR REPLACE TRIGGER handle_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER handle_updated_at BEFORE UPDATE ON public.journal_entries
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER handle_updated_at BEFORE UPDATE ON public.tools
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ===========================================
-- PART 5: Storage Setup
-- ===========================================

-- Create storage bucket for thumbnails (will be created if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('thumbnails', 'thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for thumbnail uploads
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'thumbnails');
CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'thumbnails' AND auth.role() = 'authenticated');

-- ===========================================
-- PART 6: Sample Data
-- ===========================================

-- Add some sample tools for development/testing
INSERT INTO public.tools (title, claude_url, category, description, creator_name, creator_background, approved) VALUES
(
  'Mindful Breathing Exercise',
  'https://claude.ai/chat/mindful-breathing',
  'mindfulness',
  'A gentle guided breathing exercise to center yourself and find calm in any moment. Perfect for beginners or when you need a quick reset.',
  'Dr. Sarah Johnson',
  'Mindfulness practitioner with 15 years experience teaching meditation and stress reduction.',
  true
),
(
  'Emotion Regulation Worksheet',
  'https://claude.ai/chat/emotion-regulation',
  'emotion-regulation',
  'Interactive worksheet to help identify, understand, and manage difficult emotions using DBT techniques.',
  'Alex Chen',
  'Licensed therapist specializing in dialectical behavior therapy and emotional wellness.',
  true
),
(
  'Distress Tolerance Skills',
  'https://claude.ai/chat/distress-tolerance',
  'distress-tolerance',
  'Learn practical skills to cope with crisis situations and intense emotions without making them worse.',
  'Maria Rodriguez',
  'Clinical social worker with expertise in trauma-informed care and crisis intervention.',
  true
)
ON CONFLICT (id) DO NOTHING;

-- Update average ratings for sample data
UPDATE public.tools SET avg_rating = 4.5, total_ratings = 12 WHERE title = 'Mindful Breathing Exercise';
UPDATE public.tools SET avg_rating = 4.8, total_ratings = 8 WHERE title = 'Emotion Regulation Worksheet';
UPDATE public.tools SET avg_rating = 4.2, total_ratings = 15 WHERE title = 'Distress Tolerance Skills';

-- ===========================================
-- PART 7: Permissions
-- ===========================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Verify the schema is working
SELECT 'Combined schema setup complete! BPS + Community Tools ready.' as status;