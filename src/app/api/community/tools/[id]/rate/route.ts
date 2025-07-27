import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';

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
    const { data: ratingData, error: ratingError } = await supabase
      .from('ratings')
      .upsert({
        tool_id: id,
        user_ip: userIP,
        rating,
        review_text: review_text || null
      }, {
        onConflict: 'tool_id,user_ip'
      })
      .select();
    
    if (ratingError) {
      // Check if it's a duplicate rating error
      if (ratingError.code === '23505' || ratingError.message?.includes('duplicate key')) {
        return NextResponse.json({ 
          error: 'You have already rated this tool. You can only rate each tool once.' 
        }, { status: 409 });
      }
      
      console.error('Error saving rating:', ratingError);
      return NextResponse.json({ 
        error: 'Failed to save rating', 
        details: ratingError.message 
      }, { status: 500 });
    }
    
    // Recalculate average rating for the tool
    const { data: ratings, error: ratingsError } = await supabase
      .from('ratings')
      .select('rating')
      .eq('tool_id', id);
    
    console.log('Rating recalculation:', { 
      toolId: id, 
      ratingsCount: ratings?.length || 0, 
      ratings,
      ratingsError 
    });
    
    if (!ratingsError && ratings) {
      const avgRating = ratings.length > 0 
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length 
        : 0;
      const totalRatings = ratings.length;
      
      console.log('Calculated:', { avgRating, totalRatings });
      
      // Use admin client to bypass RLS for updating tool ratings
      const adminClient = createAdminClient();
      const { error: updateError } = await adminClient
        .from('tools')
        .update({
          avg_rating: Number(avgRating.toFixed(1)),
          total_ratings: totalRatings
        })
        .eq('id', id);
        
      console.log('Tool update result:', { updateError });
        
      if (updateError) {
        console.error('Failed to update tool ratings:', updateError);
        return NextResponse.json({ error: 'Failed to update tool ratings' }, { status: 500 });
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in rating API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}