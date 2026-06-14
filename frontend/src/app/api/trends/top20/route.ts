import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

/**
 * GET /api/trends/top20
 * Returns trending products with GitHub-style trend analysis.
 *
 * Trend Score Components:
 * 1. Star Velocity (30%): stars gained per day
 * 2. Multi-source (25%): cross-platform validation
 * 3. Recency (20%): how recently updated
 * 4. Engagement (15%): forks, issues, contributors
 * 5. Diversity (10%): variety of source types
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '7d';
    const category = searchParams.get('category') || '';
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build query
    let query = supabase
      .from('products')
      .select('*')
      .eq('availability_status', 'active');

    if (category) {
      query = query.eq('category', category);
    }

    // Fetch products with growth data
    const { data: products, error } = await query
      .not('weekly_growth_rate', 'is', null)
      .order('confidence_score', { ascending: false })
      .limit(limit * 3); // Fetch more to calculate trends

    if (error) {
      console.error('Error fetching trends:', error);
      return NextResponse.json({ error: 'Failed to fetch trends' }, { status: 500 });
    }

    if (!products || products.length === 0) {
      return NextResponse.json({
        trending: [],
        rising: [],
        falling: [],
        newThisWeek: [],
        topCategories: [],
      });
    }

    // Calculate trend scores
    const now = Date.now();
    const DAY = 24 * 60 * 60 * 1000;
    const WEEK = 7 * DAY;

    const productsWithTrends = products.map(product => {
      const createdAt = new Date(product.created_at).getTime();
      const updatedAt = new Date(product.updated_at || product.created_at).getTime();
      const ageInDays = Math.max(1, (now - createdAt) / DAY);
      const daysSinceUpdate = (now - updatedAt) / DAY;

      // Star velocity: stars per day
      const stars = product.github_stars || 0;
      const starVelocity = stars / ageInDays;

      // Multi-source score
      const sourceCount = product.source_count || 1;
      const multiSourceScore = Math.min(100, (sourceCount / 5) * 100);

      // Recency score
      let recencyScore: number;
      if (daysSinceUpdate <= 1) recencyScore = 100;
      else if (daysSinceUpdate <= 7) recencyScore = 90 - ((daysSinceUpdate - 1) / 6) * 20;
      else if (daysSinceUpdate <= 30) recencyScore = 70 - ((daysSinceUpdate - 7) / 23) * 30;
      else recencyScore = Math.max(0, 40 - ((daysSinceUpdate - 30) / 60) * 40);

      // Engagement score (based on stars and growth)
      const weeklyGrowth = product.weekly_growth_rate || 0;
      const monthlyGrowth = product.monthly_growth_rate || 0;
      const engagementScore = Math.min(100, (Math.log10(stars + 1) / 5) * 50 + (weeklyGrowth > 0 ? 25 : 0) + (monthlyGrowth > 0 ? 25 : 0));

      // Trend score (weighted average)
      const trendScore = Math.round(
        Math.min(100, starVelocity * 2) * 0.30 +
        multiSourceScore * 0.25 +
        recencyScore * 0.20 +
        engagementScore * 0.15 +
        (product.confidence_score || 0) * 0.10
      );

      // Trend category
      let trendCategory: string;
      if (trendScore >= 80 && weeklyGrowth > 10) trendCategory = 'hot';
      else if (trendScore >= 60 || weeklyGrowth > 5) trendCategory = 'rising';
      else if (weeklyGrowth < -5) trendCategory = 'declining';
      else trendCategory = 'stable';

      return {
        ...product,
        trend_score: trendScore,
        trend_category: trendCategory,
        star_velocity: starVelocity,
      };
    });

    // Sort by trend score
    productsWithTrends.sort((a, b) => b.trend_score - a.trend_score);

    // Group by category
    const trending = productsWithTrends.filter(p => p.trend_category === 'hot' || p.trend_category === 'rising').slice(0, limit);
    const rising = productsWithTrends.filter(p => p.weekly_growth_rate > 0).sort((a, b) => b.weekly_growth_rate - a.weekly_growth_rate).slice(0, limit);
    const falling = productsWithTrends.filter(p => p.weekly_growth_rate < 0).sort((a, b) => a.weekly_growth_rate - b.weekly_growth_rate).slice(0, limit);

    // New this week
    const weekAgo = now - WEEK;
    const newThisWeek = productsWithTrends
      .filter(p => new Date(p.created_at).getTime() > weekAgo)
      .sort((a, b) => b.confidence_score - a.confidence_score)
      .slice(0, limit);

    // Top categories
    const categoryMap = new Map<string, { count: number; totalGrowth: number }>();
    for (const product of productsWithTrends) {
      const cat = product.category || 'Other';
      const existing = categoryMap.get(cat) || { count: 0, totalGrowth: 0 };
      existing.count++;
      existing.totalGrowth += product.weekly_growth_rate || 0;
      categoryMap.set(cat, existing);
    }

    const topCategories = Array.from(categoryMap.entries())
      .map(([name, data]) => ({
        name,
        count: data.count,
        growth: data.totalGrowth / data.count,
      }))
      .sort((a, b) => b.growth - a.growth)
      .slice(0, 10);

    return NextResponse.json({
      trending,
      rising,
      falling,
      newThisWeek,
      topCategories,
    });
  } catch (error) {
    console.error('Error in trends API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
