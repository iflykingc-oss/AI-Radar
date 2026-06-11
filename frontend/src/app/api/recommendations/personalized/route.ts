export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/types';

type ProductRow = Database['public']['Tables']['products']['Row'];
type WatchlistRow = Database['public']['Tables']['watchlist']['Row'];

/** Partial product type matching the .select() fields used in queries */
interface ProductSummary {
  id: string;
  name: string;
  name_en: string | null;
  name_zh: string | null;
  description: string | null;
  description_en: string | null;
  description_zh: string | null;
  website_url: string | null;
  github_url: string | null;
  logo_url: string | null;
  category: string | null;
  tags: string[];
  confidence_score: number;
  weekly_growth_rate: number;
  monthly_growth_rate: number;
  github_stars: number | null;
  created_at: string;
  updated_at: string;
  availability_status: string | null;
}

/**
 * Calculate the recommendation score for a product (same as daily route).
 */
function calculateRecommendationScore(product: ProductSummary): number {
  const confidenceScore = Math.min(Math.max(product.confidence_score / 100, 0), 1);
  const githubStarsBoost = Math.min(Math.max((product.github_stars ?? 0) / 1000, 0), 1);
  const weeklyGrowthBoost = Math.min(Math.max(product.weekly_growth_rate ?? 0, 0), 1);

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const createdAt = product.created_at ? new Date(product.created_at) : null;
  const updatedAt = product.updated_at ? new Date(product.updated_at) : null;

  const freshnessBonus = createdAt && createdAt >= sevenDaysAgo ? 0.15 : 0;
  const recencyBonus = updatedAt && updatedAt >= thirtyDaysAgo ? 0.15 : 0;

  return (
    confidenceScore * 0.2 +
    githubStarsBoost * 0.2 +
    weeklyGrowthBoost * 0.3 +
    freshnessBonus +
    recencyBonus
  );
}

/**
 * Generate a human-readable reason string explaining why this product was recommended.
 */
function generateRecommendationReason(product: ProductSummary, relatedCategory: string | null): string {
  const reasons: string[] = [];

  if (relatedCategory) {
    reasons.push(`与您关注的「${relatedCategory}」分类相关`);
  }

  const weeklyGrowth = product.weekly_growth_rate ?? 0;
  if (weeklyGrowth > 0) {
    const pct = (weeklyGrowth * 100).toFixed(0);
    reasons.push(`本周增长 ${pct}%`);
  }

  const stars = product.github_stars;
  if (stars && stars > 0) {
    reasons.push(`GitHub ${stars} stars`);
  }

  if (reasons.length === 0) {
    reasons.push('高质量 AI 产品');
  }

  return reasons.join('，');
}

/**
 * GET /api/recommendations/personalized
 *
 * Returns personalized recommendations based on the user's watchlist.
 *
 * Logic:
 *   1. Fetch user's watchlist products
 *   2. Collect the categories of watched products
 *   3. Find other active products in those categories
 *   4. Exclude already-watched products
 *   5. Score, rank, and return top results
 *
 * Query params:
 *   - userId: required, the user's ID
 *   - limit: number of results (default: 10, max: 50)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limitParam = searchParams.get('limit');
    const limit = Math.min(Math.max(parseInt(limitParam ?? '10', 10), 1), 50);

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required', recommendations: [], generated_at: new Date().toISOString(), total: 0 },
        { status: 400 }
      );
    }

    // Step 1: Fetch user's watchlist
    const { data: watchlistItems, error: watchlistError } = await supabase
      .from('watchlist')
      .select('product_id')
      .eq('user_id', userId);

    if (watchlistError) {
      console.error('[recommendations/personalized] Watchlist query error:', watchlistError);
      return NextResponse.json(
        { recommendations: [], generated_at: new Date().toISOString(), total: 0 },
        { status: 200, headers: { 'Cache-Control': 's-maxage=3600' } }
      );
    }

    if (!watchlistItems || watchlistItems.length === 0) {
      // User has no watchlist — return empty with a hint
      return NextResponse.json(
        {
          recommendations: [],
          generated_at: new Date().toISOString(),
          total: 0,
          hint: '关注一些产品后即可获得个性化推荐',
        },
        { status: 200, headers: { 'Cache-Control': 's-maxage=3600' } }
      );
    }

    const watchedProductIds = watchlistItems.map((item) => item.product_id);

    // Step 2: Fetch watched products to determine their categories
    const { data: watchedProducts, error: watchedProductsError } = await supabase
      .from('products')
      .select('id, category')
      .in('id', watchedProductIds);

    if (watchedProductsError) {
      console.error('[recommendations/personalized] Watched products query error:', watchedProductsError);
      return NextResponse.json(
        { recommendations: [], generated_at: new Date().toISOString(), total: 0 },
        { status: 200, headers: { 'Cache-Control': 's-maxage=3600' } }
      );
    }

    // Collect distinct non-null categories from watched products
    const watchedCategories = Array.from(
      new Set(
        (watchedProducts ?? [])
          .map((p) => p.category)
          .filter((c): c is string => c !== null)
      )
    );

    if (watchedCategories.length === 0) {
      return NextResponse.json(
        {
          recommendations: [],
          generated_at: new Date().toISOString(),
          total: 0,
          hint: '您关注的产品暂无分类信息',
        },
        { status: 200, headers: { 'Cache-Control': 's-maxage=3600' } }
      );
    }

    // Build a category lookup: categoryId -> categoryName for recommendation reasons
    const categoryMap = new Map<string, string>();
    for (const p of watchedProducts ?? []) {
      if (p.category) {
        categoryMap.set(p.id, p.category);
      }
    }

    // Step 3: Find other active products in the same categories, excluding watched ones
    const { data: candidateProducts, error: candidatesError } = await supabase
      .from('products')
      .select(
        'id, name, name_en, name_zh, description, description_en, description_zh, website_url, github_url, logo_url, category, tags, confidence_score, weekly_growth_rate, monthly_growth_rate, github_stars, created_at, updated_at, availability_status'
      )
      .in('category', watchedCategories)
      .eq('availability_status', 'active')
      .not('id', 'in', `(${watchedProductIds.join(',')})`)
      .limit(200);

    if (candidatesError) {
      console.error('[recommendations/personalized] Candidates query error:', candidatesError);
      return NextResponse.json(
        { recommendations: [], generated_at: new Date().toISOString(), total: 0 },
        { status: 200, headers: { 'Cache-Control': 's-maxage=3600' } }
      );
    }

    if (!candidateProducts || candidateProducts.length === 0) {
      return NextResponse.json(
        { recommendations: [], generated_at: new Date().toISOString(), total: 0 },
        { status: 200, headers: { 'Cache-Control': 's-maxage=3600' } }
      );
    }

    // Step 4: Score, rank, and build recommendation items
    const scored = candidateProducts
      .map((product) => ({
        product: product as ProductSummary,
        score: calculateRecommendationScore(product as ProductSummary),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    const recommendations = scored.map(({ product }) => {
      // Determine which watched category this candidate matches (use the candidate's own category)
      const relatedCategory = product.category;

      return {
        id: product.id,
        name: product.name_en || product.name,
        description: product.description_en || product.description,
        confidence_score: product.confidence_score,
        weekly_growth_rate: product.weekly_growth_rate ?? 0,
        github_stars: product.github_stars ?? 0,
        recommendation_reason: generateRecommendationReason(product, relatedCategory),
        website_url: product.website_url,
        tags: product.tags ?? [],
      };
    });

    return NextResponse.json(
      {
        recommendations,
        generated_at: new Date().toISOString(),
        total: recommendations.length,
        based_on_categories: watchedCategories,
      },
      {
        status: 200,
        headers: { 'Cache-Control': 's-maxage=3600' },
      }
    );
  } catch (err) {
    console.error('[recommendations/personalized] Unexpected error:', err);
    return NextResponse.json(
      { recommendations: [], generated_at: new Date().toISOString(), total: 0 },
      {
        status: 200,
        headers: { 'Cache-Control': 's-maxage=3600' },
      }
    );
  }
}
