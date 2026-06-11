/**
 * Confidence scoring pipeline.
 *
 * Assigns a confidence score (0-100) to each crawled product based on
 * multiple signals. Higher scores indicate the product is more likely
 * to be a real, active AI product worth surfacing to users.
 *
 * Reference: luban "宁缺毋滥" (rather lack than滥) quality threshold
 *
 * Scoring rules:
 * - Base score: 20 (every product starts here)
 * - Multi-source verification (2+ sources mention it): +30
 * - GitHub stars > 100: +20
 * - Has official website: +10
 * - Recently active (updated in last 30 days): +20
 * - Same-source decay: penalize products from dominant sources
 * - Quality threshold: minimum 30 to be included
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
 * Quality threshold - products below this score are filtered out.
 * Reference: luban "宁缺毋滥" pattern
 */
const QUALITY_THRESHOLD = 30;

/**
 * Maximum ratio of products from a single source.
 * If a source exceeds this ratio, its products get a decay penalty.
 * Reference: luban same-source decay pattern (15/20 → 4/20)
 */
const MAX_SOURCE_RATIO = 0.3;

/**
 * Decay penalty applied to products from dominant sources.
 */
const DOMINANT_SOURCE_DECAY = 10;

/**
 * Score a list of crawled products and return ScoredProduct objects.
 * Applies quality threshold to filter out low-quality products.
 *
 * @param products - Products to score (should already be deduplicated and enriched)
 * @returns Scored products with confidence_score and source_mentions
 */
export function scoreProducts(products: CrawledProduct[]): ScoredProduct[] {
  // Group products by normalized name to find multi-source mentions
  const sourceMap = buildSourceMap(products);

  // Calculate source distribution for decay detection
  const sourceDistribution = calculateSourceDistribution(products);

  const scored: ScoredProduct[] = [];

  for (const product of products) {
    const score = computeScore(product, sourceMap, sourceDistribution);
    const sourceMentions = sourceMap.get(normalizeKey(product.name)) ?? [];

    scored.push({
      ...product,
      confidence_score: score,
      source_mentions: sourceMentions,
    });
  }

  // Apply quality threshold (宁缺毋滥)
  const beforeFilter = scored.length;
  const filtered = scored.filter(p => p.confidence_score >= QUALITY_THRESHOLD);
  const removed = beforeFilter - filtered.length;

  if (removed > 0) {
    console.log(`[score] Quality threshold: removed ${removed} products below ${QUALITY_THRESHOLD}`);
  }

  console.log(`[score] Scored ${filtered.length} products. Score distribution: ${buildDistributionSummary(filtered)}`);
  return filtered;
}

/**
 * Compute the confidence score for a single product.
 * Includes same-source decay for dominant sources.
 */
function computeScore(
  product: CrawledProduct,
  sourceMap: Map<string, string[]>,
  sourceDistribution: Map<string, number>
): number {
  let score = BASE_SCORE;

  // Multi-source verification
  const normalizedKey = normalizeKey(product.name);
  const sources = sourceMap.get(normalizedKey) ?? [];
  if (sources.length >= 3) {
    score += MULTI_SOURCE_BONUS + 5; // Extra bonus for 3+ sources
  } else if (sources.length >= 2) {
    score += MULTI_SOURCE_BONUS;
  }

  // GitHub stars (tiered)
  const stars = product.github_stars || 0;
  if (stars >= 10000) {
    score += GITHUB_STARS_BONUS + 5; // Extra bonus for 10k+ stars
  } else if (stars >= 1000) {
    score += GITHUB_STARS_BONUS;
  } else if (stars >= 100) {
    score += GITHUB_STARS_BONUS - 5;
  }

  // Has official website
  if (product.website_url && product.website_url.length > 0) {
    score += WEBSITE_BONUS;
  }

  // Recent activity
  if (isRecentlyActive(product)) {
    score += RECENT_ACTIVITY_BONUS;
  }

  // Same-source decay (reference: luban pattern)
  const sourceRatio = sourceDistribution.get(product.source) || 0;
  if (sourceRatio > MAX_SOURCE_RATIO) {
    score -= DOMINANT_SOURCE_DECAY;
  }

  // Clamp to [0, 100]
  return Math.min(Math.max(0, score), MAX_SCORE);
}

/**
 * Calculate the ratio of products from each source.
 */
function calculateSourceDistribution(products: CrawledProduct[]): Map<string, number> {
  const counts = new Map<string, number>();
  const total = products.length;

  for (const product of products) {
    counts.set(product.source, (counts.get(product.source) || 0) + 1);
  }

  // Convert counts to ratios
  const ratios = new Map<string, number>();
  for (const [source, count] of counts) {
    ratios.set(source, count / total);
  }

  return ratios;
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
 */
function isRecentlyActive(product: CrawledProduct): boolean {
  const crawledTime = new Date(product.crawled_at).getTime();
  const now = Date.now();
  return now - crawledTime < RECENT_ACTIVITY_THRESHOLD_MS;
}

/**
 * Normalize a product name for cross-referencing.
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
