import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

/**
 * GET /api/trends/top20?range=7d
 * Returns top 20 trending products with growth metrics.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '7d';

    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('availability_status', 'active')
      .not('weekly_growth_rate', 'is', null)
      .order('weekly_growth_rate', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching top20 trends:', error);
      return NextResponse.json({ error: 'Failed to fetch trends' }, { status: 500 });
    }

    return NextResponse.json({ products: products || [], range });
  } catch (error) {
    console.error('Error fetching top20 trends:', error);
    return NextResponse.json({ error: 'Failed to fetch trends' }, { status: 500 });
  }
}
