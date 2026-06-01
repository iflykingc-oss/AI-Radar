/**
 * Deduplication pipeline.
 *
 * Prevents duplicate products from being written to the database.
 * Uses a combination of:
 *   1. Exact name match (lowercase, normalized)
 *   2. URL domain match
 *   3. String similarity (Levenshtein-based) for fuzzy matching
 *
 * Takes a list of already-existing products from the database and
 * filters out any crawled products that are considered duplicates.
 */
import { CrawledProduct } from '../types.js';

/**
 * Minimum similarity ratio (0-1) to consider two names as duplicates.
 * 0.85 means 85% similarity required.
 */
const SIMILARITY_THRESHOLD = 0.85;

/**
 * Deduplicate a list of newly crawled products against existing database products.
 *
 * @param newProducts - Products just crawled from data sources
 * @param existingProducts - Products already in the database
 * @returns Array of new products that are NOT duplicates
 */
export function deduplicate(
  newProducts: CrawledProduct[],
  existingProducts: CrawledProduct[]
): CrawledProduct[] {
  const normalizedExisting = existingProducts.map(normalizeProduct);
  const result: CrawledProduct[] = [];

  for (const product of newProducts) {
    const normalizedNew = normalizeProduct(product);
    const isDuplicate = normalizedExisting.some((existing) =>
      isDuplicateOf(normalizedNew, existing)
    );

    if (!isDuplicate) {
      result.push(product);
    } else {
      console.log(`[dedup] Skipping duplicate: "${product.name}"`);
    }
  }

  return result;
}

/**
 * Create a normalized version of a product for comparison.
 * Lowercases and strips common suffixes/prefixes from the name.
 */
function normalizeProduct(product: CrawledProduct): NormalizedProduct {
  const normalizedName = normalizeName(product.name);
  const domain = extractDomain(product.website_url);

  return {
    name: normalizedName,
    domain,
    githubDomain: product.github_url ? extractDomain(product.github_url) : null,
  };
}

/**
 * Normalize a product name for comparison:
 * - Lowercase
 * - Remove common suffixes (app, ai, .io, .com, etc.)
 * - Trim whitespace
 */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+(ai|app|\.io|\.com|\.co|\.dev|\.ai)\s*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract the domain from a URL.
 */
function extractDomain(url: string): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

/**
 * Check if a new product is a duplicate of an existing product.
 * Uses multiple heuristics:
 * 1. Exact name match after normalization
 * 2. Domain match (website or GitHub)
 * 3. String similarity above threshold
 */
function isDuplicateOf(
  newProduct: NormalizedProduct,
  existing: NormalizedProduct
): boolean {
  // 1. Exact name match
  if (newProduct.name === existing.name) {
    return true;
  }

  // 2. Domain match
  if (
    newProduct.domain &&
    existing.domain &&
    newProduct.domain === existing.domain
  ) {
    return true;
  }

  // 3. GitHub domain cross-match
  if (
    newProduct.githubDomain &&
    existing.domain &&
    newProduct.githubDomain === existing.domain
  ) {
    return true;
  }
  if (
    newProduct.domain &&
    existing.githubDomain &&
    newProduct.domain === existing.githubDomain
  ) {
    return true;
  }

  // 4. String similarity (Levenshtein-based)
  const similarity = computeSimilarity(newProduct.name, existing.name);
  if (similarity >= SIMILARITY_THRESHOLD) {
    return true;
  }

  return false;
}

/**
 * Compute string similarity using a simplified Levenshtein distance ratio.
 * Returns a value between 0 (completely different) and 1 (identical).
 */
function computeSimilarity(a: string, b: string): number {
  if (a === b) return 1.0;
  if (a.length === 0 || b.length === 0) return 0.0;

  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;
  const longerLength = longer.length;

  if (longerLength === 0) return 1.0;

  const distance = levenshteinDistance(longer, shorter);
  return (longerLength - distance) / longerLength;
}

/**
 * Compute the Levenshtein edit distance between two strings.
 */
function levenshteinDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;

  // Use a 2D array for dynamic programming
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,       // deletion
        dp[i][j - 1] + 1,       // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return dp[m][n];
}

/**
 * Normalized product representation for deduplication comparison.
 */
interface NormalizedProduct {
  name: string;
  domain: string | null;
  githubDomain: string | null;
}
