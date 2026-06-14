/**
 * Trending Algorithm - GitHub-style trend calculation
 *
 * Inspired by GitHub Trending, Hacker News, and Reddit algorithms.
 * Combines multiple signals to calculate a comprehensive trend score.
 *
 * Signals:
 * 1. Star velocity (stars gained per day)
 * 2. Star acceleration (change in velocity)
 * 3. Multi-source mentions (cross-platform validation)
 * 4. Recency bias (newer products get boost)
 * 5. Community engagement (forks, issues, contributors)
 * 6. Source diversity (more sources = more trustworthy)
 *
 * Formula:
 * trend_score = (star_velocity * 0.3) + (multi_source * 0.25) + (recency * 0.2) + (engagement * 0.15) + (diversity * 0.1)
 */

import { ScoredProduct } from '../types.js';

export interface TrendMetrics {
  /** Star velocity: stars gained per day */
  starVelocity: number;
  /** Star acceleration: change in velocity */
  starAcceleration: number;
  /** Multi-source score: how many sources mention this */
  multiSourceScore: number;
  /** Recency score: how recently was this updated */
  recencyScore: number;
  /** Engagement score: forks, issues, contributors */
  engagementScore: number;
  /** Source diversity: variety of source types */
  diversityScore: number;
  /** Final trend score (0-100) */
  trendScore: number;
  /** Trend category */
  trendCategory: 'hot' | 'rising' | 'stable' | 'declining';
}

// Weights for each signal
const WEIGHTS = {
  starVelocity: 0.30,
  multiSource: 0.25,
  recency: 0.20,
  engagement: 0.15,
  diversity: 0.10,
};

// Time windows for calculations
const TIME_WINDOWS = {
  day: 24 * 60 * 60 * 1000,
  week: 7 * 24 * 60 * 60 * 1000,
  month: 30 * 24 * 60 * 60 * 1000,
};

/**
 * Calculate trend metrics for a product.
 */
export function calculateTrendMetrics(product: ScoredProduct): TrendMetrics {
  const now = Date.now();
  const createdAt = new Date(product.created_at || product.crawled_at).getTime();
  const updatedAt = new Date(product.updated_at || product.created_at || product.crawled_at).getTime();
  const ageInDays = Math.max(1, (now - createdAt) / TIME_WINDOWS.day);
  const daysSinceUpdate = (now - updatedAt) / TIME_WINDOWS.day;

  // 1. Star Velocity: stars gained per day
  const stars = product.github_stars || 0;
  const starVelocity = stars / ageInDays;

  // 2. Star Acceleration: use weekly_growth_rate as proxy
  const weeklyGrowth = product.weekly_growth_rate || 0;
  const monthlyGrowth = product.monthly_growth_rate || 0;
  const starAcceleration = weeklyGrowth - (monthlyGrowth / 4);

  // 3. Multi-source Score: how many sources mention this
  const sourceCount = product.source_mentions?.length || product.source_count || 1;
  const multiSourceScore = Math.min(100, (sourceCount / 5) * 100);

  // 4. Recency Score: newer = higher score
  let recencyScore: number;
  if (daysSinceUpdate <= 1) {
    recencyScore = 100;
  } else if (daysSinceUpdate <= 7) {
    recencyScore = 90 - ((daysSinceUpdate - 1) / 6) * 20;
  } else if (daysSinceUpdate <= 30) {
    recencyScore = 70 - ((daysSinceUpdate - 7) / 23) * 30;
  } else if (daysSinceUpdate <= 90) {
    recencyScore = 40 - ((daysSinceUpdate - 30) / 60) * 20;
  } else {
    recencyScore = Math.max(0, 20 - ((daysSinceUpdate - 90) / 90) * 20);
  }

  // 5. Engagement Score: based on stars, forks, issues
  const validationSignals = product.validation_signals || {};
  const forks = validationSignals.github_forks || 0;
  const issues = validationSignals.github_open_issues || 0;
  const contributors = validationSignals.github_contributors || 0;

  const engagementScore = calculateEngagementScore(stars, forks, issues, contributors);

  // 6. Diversity Score: variety of source types
  const sourceTypes = new Set(product.source_mentions || [product.source]);
  const diversityScore = Math.min(100, (sourceTypes.size / 3) * 100);

  // Calculate final trend score
  const trendScore = Math.round(
    normalize(starVelocity, 0, 100) * WEIGHTS.starVelocity +
    multiSourceScore * WEIGHTS.multiSource +
    recencyScore * WEIGHTS.recency +
    engagementScore * WEIGHTS.engagement +
    diversityScore * WEIGHTS.diversity
  );

  // Determine trend category
  const trendCategory = categorizeTrend(trendScore, weeklyGrowth, starAcceleration);

  return {
    starVelocity,
    starAcceleration,
    multiSourceScore,
    recencyScore,
    engagementScore,
    diversityScore,
    trendScore: Math.min(100, Math.max(0, trendScore)),
    trendCategory,
  };
}

/**
 * Calculate engagement score based on GitHub metrics.
 */
function calculateEngagementScore(
  stars: number,
  forks: number,
  issues: number,
  contributors: number
): number {
  // Weighted sum of different engagement metrics
  const starScore = normalize(stars, 0, 10000) * 0.4;
  const forkScore = normalize(forks, 0, 1000) * 0.3;
  const issueScore = normalize(issues, 0, 100) * 0.15;
  const contributorScore = normalize(contributors, 0, 50) * 0.15;

  return Math.min(100, (starScore + forkScore + issueScore + contributorScore) * 100);
}

/**
 * Normalize a value to 0-1 range.
 */
function normalize(value: number, min: number, max: number): number {
  if (max <= min) return 0;
  return Math.min(1, Math.max(0, (value - min) / (max - min)));
}

/**
 * Categorize trend based on score and growth.
 */
function categorizeTrend(
  score: number,
  weeklyGrowth: number,
  acceleration: number
): 'hot' | 'rising' | 'stable' | 'declining' {
  if (score >= 80 && weeklyGrowth > 10) return 'hot';
  if (score >= 60 || weeklyGrowth > 5) return 'rising';
  if (weeklyGrowth < -5 || acceleration < -10) return 'declining';
  return 'stable';
}

/**
 * Calculate trend scores for a batch of products.
 */
export function calculateTrendScores(products: ScoredProduct[]): Array<ScoredProduct & { trendMetrics: TrendMetrics }> {
  return products.map(product => ({
    ...product,
    trendMetrics: calculateTrendMetrics(product),
  }));
}

/**
 * Sort products by trend score.
 */
export function sortByTrend(
  products: Array<ScoredProduct & { trendMetrics: TrendMetrics }>,
  limit: number = 20
): Array<ScoredProduct & { trendMetrics: TrendMetrics }> {
  return products
    .sort((a, b) => b.trendMetrics.trendScore - a.trendMetrics.trendScore)
    .slice(0, limit);
}

/**
 * Group products by trend category.
 */
export function groupByTrendCategory(
  products: Array<ScoredProduct & { trendMetrics: TrendMetrics }>
): Record<string, Array<ScoredProduct & { trendMetrics: TrendMetrics }>> {
  const groups: Record<string, Array<ScoredProduct & { trendMetrics: TrendMetrics }>> = {
    hot: [],
    rising: [],
    stable: [],
    declining: [],
  };

  for (const product of products) {
    groups[product.trendMetrics.trendCategory].push(product);
  }

  return groups;
}

/**
 * Calculate category trends: which categories are growing fastest.
 */
export function calculateCategoryTrends(
  products: ScoredProduct[]
): Array<{ category: string; count: number; avgGrowth: number; trendScore: number }> {
  const categoryMap = new Map<string, { count: number; totalGrowth: number; totalScore: number }>();

  for (const product of products) {
    const category = product.category || 'Other';
    const existing = categoryMap.get(category) || { count: 0, totalGrowth: 0, totalScore: 0 };
    existing.count++;
    existing.totalGrowth += product.weekly_growth_rate || 0;
    existing.totalScore += product.confidence_score || 0;
    categoryMap.set(category, existing);
  }

  return Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      category,
      count: data.count,
      avgGrowth: data.totalGrowth / data.count,
      trendScore: Math.round(data.totalScore / data.count),
    }))
    .sort((a, b) => b.avgGrowth - a.avgGrowth);
}
