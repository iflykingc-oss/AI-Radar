/**
 * Confidence scoring pipeline.
 *
 * Assigns a confidence score (0-100) to each crawled product based on
 * multiple signals. Higher scores indicate the product is more likely
 * to be a real, active AI product worth surfacing to users.
 *
 * Scoring rules:
 * - Base score: 20 (every product starts here)
 * - Multi-source verification (2+ sources mention it): +30
 * - GitHub stars > 100: +20
 * - Has official website: +10
 * - Recently active (updated in last 30 days): +20
 * - Maximum score: 100
 */
import { ScoredProduct, CrawledProduct } from '../types.js';

/** Base score assigned to every product */
const BASE_SCORE = 20;

/** Score bonus when product is mentioned by 2+ data sources */
const MULTI_SOURCE_BONUS = 30;

/** Score bonus when GitHub stars > 100 */
const GITHUB_STARS_BONUS = 20;

/** Score bonus when product has an official website URL */
const WEBSITE_BONUS = 10;

/** Score bonus when product was recently active (within 30 days) */
const RECENT_ACTIVITY_BONUS = 20;

/** Maximum possible score */
const MAX_SCORE = 100;

/**
 * Threshold for "recently active" in milliseconds (30 days).
 */
const RECENT_ACTIVITY_THRESHOLD_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Score a list of crawled products and return ScoredProduct objects.
 *
 * @param products - Products to score (should already be deduplicated and enriched)
 * @returns Scored products with confidence_score and source_mentions
 */
export function scoreProducts(products: CrawledProduct[]): ScoredProduct[] {
  // Group products by normalized name to find multi-source mentions
  const sourceMap = buildSourceMap(products);

  const scored: ScoredProduct[] = [];

  for (const product of products) {
    const score = computeScore(product, sourceMap);
    const sourceMentions = sourceMap.get(normalizeKey(product.name)) ?? [];

    scored.push({
      ...product,
      confidence_score: score,
      source_mentions: sourceMentions,
    });
  }

  console.log(`[score] Scored ${scored.length} products. Score distribution: ${buildDistributionSummary(scored)}`);
  return scored;
}

/**
 * Compute the confidence score for a single product.
 */
function computeScore(
  product: CrawledProduct,
  sourceMap: Map<string, string[]>
): number {
  let score = BASE_SCORE;

  // Multi-source verification
  const normalizedKey = normalizeKey(product.name);
  const sources = sourceMap.get(normalizedKey) ?? [];
  if (sources.length >= 2) {
    score += MULTI_SOURCE_BONUS;
  }

  // GitHub stars > 100
  if (product.github_stars !== undefined && product.github_stars > 100) {
    score += GITHUB_STARS_BONUS;
  }

  // Has official website
  if (product.website_url && product.website_url.length > 0) {
    score += WEBSITE_BONUS;
  }

  // Recent activity (based on crawled_at — if the product was found by
  // a source that tracks update timestamps, we use that; otherwise
  // crawled_at being recent is itself a signal)
  if (isRecentlyActive(product)) {
    score += RECENT_ACTIVITY_BONUS;
  }

  // Clamp to [0, 100]
  return Math.min(score, MAX_SCORE);
}

/**
 * Build a map from normalized product name to the list of source names
 * that mentioned it. Used for multi-source scoring.
 */
function buildSourceMap(
  products: CrawledProduct[]
): Map<string, string[]> {
  const map = new Map<string, string[]>();

  for (const product of products) {
    const key = normalizeKey(product.name);
    const existing = map.get(key) ?? [];

    // Only add the source if it's not already in the list
    if (!existing.includes(product.source)) {
      existing.push(product.source);
    }

    map.set(key, existing);
  }

  return map;
}

/**
 * Check if a product shows signs of recent activity.
 * Uses crawled_at as a proxy — if the product was crawled recently,
 * it means the source found it recently, which is itself a signal
 * of recency.
 *
 * For GitHub-sourced products, we could additionally check pushed_at,
 * but the GitHub source already filters to recently-pushed repos.
 */
function isRecentlyActive(product: CrawledProduct): boolean {
  const crawledTime = new Date(product.crawled_at).getTime();
  const now = Date.now();
  return now - crawledTime < RECENT_ACTIVITY_THRESHOLD_MS;
}

/**
 * Normalize a product name for cross-referencing.
 * Lowercase, strip common suffixes.
 */
function normalizeKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+(ai|app|\.io|\.com|\.co|\.dev)\s*$/i, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/**
 * Build a human-readable summary of the score distribution.
 */
function buildDistributionSummary(products: ScoredProduct[]): string {
  const buckets: Record<string, number> = {
    '0-30': 0,
    '31-50': 0,
    '51-70': 0,
    '71-100': 0,
  };

  for (const p of products) {
    if (p.confidence_score <= 30) buckets['0-30']++;
    else if (p.confidence_score <= 50) buckets['31-50']++;
    else if (p.confidence_score <= 70) buckets['51-70']++;
    else buckets['71-100']++;
  }

  return JSON.stringify(buckets);
}
