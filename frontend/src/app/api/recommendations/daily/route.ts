import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

/**
 * GET /api/recommendations/daily
 * Returns daily personalized product recommendations.
 */
export async function GET(_request: NextRequest) {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data: recommendations, error } = await supabase
        .from('recommendations')
        .select('*, products(*)')
        .eq('user_id', user.id)
        .eq('date', new Date().toISOString().split('T')[0])
        .limit(10);

      if (!error && recommendations && recommendations.length > 0) {
        const products = recommendations.map(r => r.products);
        return NextResponse.json({ products });
      }
    }

    return NextResponse.json({ products: [] });
  } catch (error) {
    console.error('Error fetching daily recommendations:', error);
    return NextResponse.json({ error: 'Failed to fetch recommendations' }, { status: 500 });
  }
}
