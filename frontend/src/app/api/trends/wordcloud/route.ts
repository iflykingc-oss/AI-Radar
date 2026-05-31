import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

/**
 * GET /api/trends/wordcloud?range=7d
 * Returns trending keyword/tag data for word cloud visualization.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '7d';

    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('availability_status', 'active');

    if (error) {
      console.error('Error fetching wordcloud:', error);
      return NextResponse.json({ tags: [], range });
    }

    const tagCounts = new Map<string, number>();
    for (const product of products || []) {
      if (product.availability_status !== 'active') continue;
      const weight = (product.weekly_growth_rate ?? 0) * 100 + (product.confidence_score / 10);
      for (const tag of product.tags) {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + weight);
      }
    }

    const tags = Array.from(tagCounts.entries())
      .map(([name, score]) => ({
        name,
        count: Math.round(score * 5),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    return NextResponse.json({ tags, range });
  } catch (error) {
    console.error('Error fetching wordcloud:', error);
    return NextResponse.json({ tags: [], range: request.nextUrl.searchParams.get('range') || '7d' });
  }
}
