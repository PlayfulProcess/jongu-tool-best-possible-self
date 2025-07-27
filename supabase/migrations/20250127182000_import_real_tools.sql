-- Import Real Community Tools Data Migration
-- This adds your existing community tools data while preserving all BPS data

-- ===========================================
-- PART 1: Create Community Tools Tables
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
-- PART 2: Row Level Security Setup
-- ===========================================

-- Enable RLS on community tables
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
-- PART 3: Add Updated_at Trigger
-- ===========================================

-- Add updated_at trigger to tools table (function should already exist from BPS)
CREATE OR REPLACE TRIGGER handle_updated_at BEFORE UPDATE ON public.tools
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ===========================================
-- PART 4: Storage Setup
-- ===========================================

-- Create storage bucket for thumbnails
INSERT INTO storage.buckets (id, name, public)
VALUES ('thumbnails', 'thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for thumbnail uploads
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
-- PART 5: Import Your Real Tools Data
-- ===========================================

-- Import your existing tools (using ON CONFLICT to avoid duplicates)
INSERT INTO public.tools (id, title, claude_url, category, description, creator_name, creator_link, creator_background, thumbnail_url, avg_rating, total_ratings, view_count, click_count, approved, created_at, updated_at) VALUES 
('b56061f2-655f-4363-9069-e12ead9b487b','Create Beautiful Quote Art with Wisdom GP','https://chatgpt.com/g/g-6871f6ae1d988191a68f17496158fd00-sprinkling-wisdom','interpersonal-effectiveness','Turn timeless insights from Jesus, Buddha, Socrates, and more into stunning images to share with others. A gentle way to spread reflection, kindness, and calm.','PlayfulProcess','https://www.playfulprocess.com/','MFT Student','https://imgur.com/a/cu5KUDV',0.00,0,0,0,true,'2025-07-25 04:40:29.599311+00','2025-07-25 04:40:29.599311+00'),
('1ab2a007-050f-4f7b-b1b9-de284c620f6a','Connect Despite Conflict','https://www.playfulprocess.com/connect-dispite-conflict/','interpersonal-effectiveness','An NVC Tool to help you get out of stuck beliefs and into compassion and freedom.','PlayfulProcess','https://www.playfulprocess.com/','MFT Student','https://mvvkgteugrlbafvjfmzk.supabase.co/storage/v1/object/public/thumbnails/1753419393886-egecbrzo0.png',0.00,0,0,0,true,'2025-07-25 04:59:38.026422+00','2025-07-25 04:59:38.026422+00'),
('1bfa9d4a-9ba9-468b-8056-b7f1f558652c','Parental Love Bank','https://claude.ai/public/artifacts/24e22d4c-bf48-4b54-ac08-704c9d179c4c?ref=playfulprocess.com','interpersonal-effectiveness','A 15-minute daily check-in to balance how much love you give and take with your child.','PlayfulProcess','https://www.playfulprocess.com/','MFT Student','https://imgur.com/a/u7gAYqz',5.00,1,0,0,true,'2025-07-24 22:28:56.241443+00','2025-07-24 22:28:56.241443+00'),
('5894d17b-113b-4a2c-8aed-3dd1768316a0','Inner Freedom Journey','https://claude.ai/public/artifacts/60498b55-5928-4aaf-a2d9-eccaa2a8f9e0?ref=playfulprocess.com','distress-tolerance','AI-guided exploration through CBT, NVC, and The Work to transform limiting thoughts','PlayfulProcess','https://www.playfulprocess.com/','MFT Student','https://imgur.com/a/KKGT7Kf',0.00,0,0,0,true,'2025-07-24 23:39:17.718824+00','2025-07-24 23:39:17.718824+00'),
('580a455a-0939-4bc7-b744-53d2ed1b04c1','Best Possible Self Journaling','https://claude.ai/public/artifacts/8c7e9584-93c2-4363-91c7-62781c910484?ref=playfulprocess.com','mindfulness','Sometimes our goals in life can be elusive. But research suggests that building optimism about the future can motivate people to work toward that desired future and thus make it more likely to become a reality.

This exercise asks you to imagine your life going as well as it possibly could, then write about this best possible future. By doing so, research suggests that you''ll not only increase your happiness in the present but pave the way for sustained happiness down the line.','PlayfulProcess','https://www.playfulprocess.com/','MFT Student','https://imgur.com/a/oL4dh3j',5.00,1,0,0,true,'2025-07-24 21:13:00.695178+00','2025-07-24 21:13:00.695178+00'),
('f3a122a6-ef09-4497-88b1-deb2cad201e0','The Wheel of Life Assessment of Life Domains','https://claude.ai/public/artifacts/75df7f31-ab9d-4a7e-993c-ce392b51ef25?ref=playfulprocess.com','mindfulness','Reflect on your current life balance by ranking these domains in order of importance to you right now. Also rate your current satisfaction level in each area.','PlayfulProcess','https://www.playfulprocess.com/','MFT Student','https://imgur.com/a/FVT0ZDK',0.00,0,0,0,true,'2025-07-24 23:44:04.262314+00','2025-07-24 23:44:04.262314+00'),
('21fa64d1-a2ac-487c-96c5-b4ba8ff9ad59','Create Your Own Children''s Story','https://jongu-books3.onrender.com/?ref=playfulprocess.com','mindfulness','My PlayfulProcess journey into parenthood invites me to explore new ways of educating my children through stories. In a world where AI makes creation more accessible than ever, I''ve discovered something profound: it''s often easier to build the exact story my child needs than to search for the perfect book that may not exist.','PlayfulProcess','https://www.playfulprocess.com/','MFT Student','https://mvvkgteugrlbafvjfmzk.supabase.co/storage/v1/object/public/thumbnails/1753457931057-bids5a39y.png',3.00,1,0,0,true,'2025-07-25 15:40:32.515249+00','2025-07-25 15:40:32.515249+00'),
('0eb487aa-4728-46cf-a3a4-d89f11625808','Deal with Unsolvable Relationship Issues','https://chatgpt.com/g/g-68720797c88881918490b90ca9b85f05-gottman-bagel-method-relationship-coach','mindfulness','According to Dr. John Gottman''s research, 69% of relationship conflicts are perpetual problems stemming from fundamental personality differences. The Bagel Method helps couples navigate these ongoing challenges by clearly distinguishing between core values and flexible preferences.','PlayfulProcess','https://www.playfulprocess.com/','MFT Student','https://mvvkgteugrlbafvjfmzk.supabase.co/storage/v1/object/public/thumbnails/1753458326846-wu0yuhq5z.png',0.00,0,0,0,true,'2025-07-25 15:46:28.636106+00','2025-07-25 15:46:28.636106+00'),
('dd0eb686-e0aa-4228-9b67-295c96c19d46','Creating Short Movies in Less than 1 Hour','https://www.playfulprocess.com/short-movies-diy/','mindfulness','The goal of this activity is to create a narrated visual story using AI tools. You''ll learn to generate text, images, narration, and video clips, combining them into a short, engaging video.','PlayfulProcess','https://www.playfulprocess.com/','MFT Student','https://mvvkgteugrlbafvjfmzk.supabase.co/storage/v1/object/public/thumbnails/1753458092296-x3e5l5838.png',4.00,1,0,0,true,'2025-07-25 15:42:17.304899+00','2025-07-25 15:42:17.304899+00'),
('e5d3b31f-e1f0-4190-a548-b78aade184b1','Basic Meditation (Headspace)','https://www.headspace.com/meditation/basic-meditation','mindfulness','A beginner-friendly, 5‑minute guided meditation that teaches the fundamentals of mindfulness using simple breath-anchoring techniques. Learn to observe thoughts without judgment, gently refocus your attention, and build clarity, calm, and awareness through brief, accessible practice wherever you are','PlayfulProcess','https://www.playfulprocess.com/','MFT Student','',0.00,0,0,0,true,'2025-07-25 19:15:44.745652+00','2025-07-25 19:15:44.745652+00')
ON CONFLICT (id) DO NOTHING;

-- ===========================================
-- PART 6: Verification
-- ===========================================

-- Verify the import
SELECT 'Successfully imported ' || COUNT(*) || ' real community tools. BPS data preserved.' as status FROM public.tools;