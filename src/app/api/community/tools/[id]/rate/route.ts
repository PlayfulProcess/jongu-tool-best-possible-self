import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const body = await request.json();
    const { rating, review_text } = body;
    
    // Get user IP for rating uniqueness
    const userIP = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown';
    
    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }
    
    // Check if tool exists
    const { data: tool, error: toolError } = await supabase
      .from('tools')
      .select('id')
      .eq('id', id)
      .single();
      
    if (toolError || !tool) {
      return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
    }
    
    // Insert or update rating
    const { error: ratingError } = await supabase
      .from('ratings')
      .upsert({
        tool_id: id,
        user_ip: userIP,
        rating,
        review_text: review_text || null
      }, {
        onConflict: 'tool_id,user_ip'
      });
    
    if (ratingError) {
      console.error('Error saving rating:', ratingError);
      return NextResponse.json({ error: 'Failed to save rating' }, { status: 500 });
    }
    
    // Recalculate average rating for the tool
    const { data: ratings, error: ratingsError } = await supabase
      .from('ratings')
      .select('rating')
      .eq('tool_id', id);
    
    if (!ratingsError && ratings) {
      const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
      const totalRatings = ratings.length;
      
      // Update tool with new average
      await supabase
        .from('tools')
        .update({
          avg_rating: avgRating,
          total_ratings: totalRatings
        })
        .eq('id', id);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in rating API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}