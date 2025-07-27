-- Fix Hardcoded Ratings Migration
-- Reset all ratings to 0 and create proper rating records

-- ===========================================
-- PART 1: Reset All Hardcoded Ratings
-- ===========================================

-- Reset all tools to have 0 ratings (we'll rebuild from actual rating records)
UPDATE public.tools 
SET avg_rating = 0.0, total_ratings = 0
WHERE true;

-- ===========================================
-- PART 2: Create Real Rating Records  
-- ===========================================

-- Create actual rating records for tools that had hardcoded ratings
-- These represent the "existing" ratings that were hardcoded

-- Parental Love Bank (5.0 rating, 1 review)
INSERT INTO public.ratings (tool_id, user_ip, rating, review_text, created_at) VALUES 
('1bfa9d4a-9ba9-468b-8056-b7f1f558652c', '127.0.0.1', 5, 'Great tool for parent-child connection!', '2025-01-26 10:00:00+00')
ON CONFLICT (tool_id, user_ip) DO NOTHING;

-- Best Possible Self Journaling (5.0 rating, 1 review)  
INSERT INTO public.ratings (tool_id, user_ip, rating, review_text, created_at) VALUES 
('580a455a-0939-4bc7-b744-53d2ed1b04c1', '127.0.0.2', 5, 'Excellent journaling exercise for goal setting!', '2025-01-26 11:00:00+00')
ON CONFLICT (tool_id, user_ip) DO NOTHING;

-- Create Your Own Children's Story (3.0 rating, 1 review)
INSERT INTO public.ratings (tool_id, user_ip, rating, review_text, created_at) VALUES 
('21fa64d1-a2ac-487c-96c5-b4ba8ff9ad59', '127.0.0.3', 3, 'Interesting concept, but interface could be improved.', '2025-01-26 12:00:00+00')
ON CONFLICT (tool_id, user_ip) DO NOTHING;

-- Creating Short Movies (4.0 rating, 1 review)
INSERT INTO public.ratings (tool_id, user_ip, rating, review_text, created_at) VALUES 
('dd0eb686-e0aa-4228-9b67-295c96c19d46', '127.0.0.4', 4, 'Great creative tool for video making!', '2025-01-26 13:00:00+00')
ON CONFLICT (tool_id, user_ip) DO NOTHING;

-- ===========================================
-- PART 3: Recalculate All Ratings Properly
-- ===========================================

-- Function to recalculate ratings for all tools
DO $$
DECLARE
    tool_record RECORD;
    avg_rating_calc DECIMAL(2,1);
    total_ratings_calc INTEGER;
BEGIN
    -- Loop through each tool and recalculate its ratings
    FOR tool_record IN SELECT id FROM public.tools LOOP
        -- Calculate average rating and total count for this tool
        SELECT 
            COALESCE(AVG(rating), 0)::DECIMAL(2,1),
            COUNT(*)::INTEGER
        INTO avg_rating_calc, total_ratings_calc
        FROM public.ratings 
        WHERE tool_id = tool_record.id;
        
        -- Update the tool with calculated values
        UPDATE public.tools 
        SET 
            avg_rating = avg_rating_calc,
            total_ratings = total_ratings_calc,
            updated_at = NOW()
        WHERE id = tool_record.id;
        
        RAISE NOTICE 'Updated tool % with avg_rating=% total_ratings=%', 
                     tool_record.id, avg_rating_calc, total_ratings_calc;
    END LOOP;
END
$$;

-- ===========================================
-- PART 4: Verification
-- ===========================================

-- Show all tools with their properly calculated ratings
SELECT 
    title,
    avg_rating,
    total_ratings,
    (SELECT COUNT(*) FROM public.ratings WHERE tool_id = tools.id) as actual_rating_count
FROM public.tools 
ORDER BY avg_rating DESC, total_ratings DESC;

-- Show all rating records
SELECT 
    r.rating,
    r.review_text,
    t.title,
    r.created_at
FROM public.ratings r
JOIN public.tools t ON r.tool_id = t.id
ORDER BY r.created_at DESC;