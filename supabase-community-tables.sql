-- Community Tools Tables for Jongu Tool Garden Integration
-- These tables should be added to the existing BPS Supabase database

-- Tools table for storing community wellness tools
CREATE TABLE tools (
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
CREATE TABLE ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tool_id UUID REFERENCES tools(id) ON DELETE CASCADE,
  user_ip TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tool_id, user_ip)
);

-- Submissions table for new tool submissions awaiting approval
CREATE TABLE submissions (
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

-- Create storage bucket for thumbnails
INSERT INTO storage.buckets (id, name, public)
VALUES ('thumbnails', 'thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for thumbnail uploads
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'thumbnails');
CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'thumbnails' AND auth.role() = 'authenticated');
CREATE POLICY "Owner Delete" ON storage.objects FOR DELETE USING (bucket_id = 'thumbnails' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add some sample data for development/testing
INSERT INTO tools (title, claude_url, category, description, creator_name, creator_background, approved) VALUES
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
);

-- Update average ratings for sample data
UPDATE tools SET avg_rating = 4.5, total_ratings = 12 WHERE title = 'Mindful Breathing Exercise';
UPDATE tools SET avg_rating = 4.8, total_ratings = 8 WHERE title = 'Emotion Regulation Worksheet';
UPDATE tools SET avg_rating = 4.2, total_ratings = 15 WHERE title = 'Distress Tolerance Skills';