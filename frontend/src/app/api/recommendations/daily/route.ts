import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

/**
 * GET /api/recommendations/daily
 * Returns daily product recommendations from the products table.
 */
export async function GET(_request: NextRequest) {
  try {
    // Query top products by confidence score and weekly growth
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('availability_status', 'active')
      .order('confidence_score', { ascending: false })
      .order('weekly_growth_rate', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching daily recommendations:', error);
      return NextResponse.json({ products: [] });
    }

    return NextResponse.json({ products: products || [] });
  } catch (error) {
    console.error('Error fetching daily recommendations:', error);
    return NextResponse.json({ products: [] });
  }
}
