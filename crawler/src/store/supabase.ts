/**
 * Supabase storage module.
 *
 * Handles reading existing products from the database (for deduplication)
 * and writing new scored products to the database.
 *
 * Uses the Supabase JS client with the service role key for full access.
 *
 * Writes to the `products` table (same table used by the frontend).
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ScoredProduct, ProductRow } from '../types.js';

/**
 * Supabase table name for products.
 */
const TABLE_NAME = 'products';

/**
 * Number of recent products to fetch from DB for deduplication.
 * Fetching last 90 days of products to have enough context for dedup.
 */
const DEDUP_LOOKBACK_DAYS = 90;

/**
 * Initialize a Supabase client from environment variables.
 *
 * @returns Supabase client instance
 * @throws Error if required environment variables are not set
 */
function createSupabaseClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      'SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment.'
    );
  }

  return createClient(url, key);
}

/**
 * Generate a URL-safe slug from a product name.
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Fetch existing products from the database for deduplication comparison.
 * Returns products crawled within the last DEDUP_LOOKBACK_DAYS days.
 *
 * @returns Array of ScoredProduct objects from the database
 */
export async function fetchExistingProducts(): Promise<ScoredProduct[]> {
  const supabase = createSupabaseClient();

  // Calculate the lookback date
  const lookbackDate = new Date();
  lookbackDate.setDate(lookbackDate.getDate() - DEDUP_LOOKBACK_DAYS);

  console.log(
    `[store] Fetching existing products since ${lookbackDate.toISOString()}`
  );

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select(
      'slug, name, name_en, name_zh, description, website_url, github_url, tags, category, source, source_url, crawled_at, github_stars, pricing_model, confidence_score, source_mentions'
    )
    .gte('created_at', lookbackDate.toISOString())
    .limit(10000);

  if (error) {
    console.error(`[store] Error fetching existing products: ${error.message}`);
    return [];
  }

  console.log(`[store] Fetched ${data?.length ?? 0} existing products from database.`);

  return (data ?? []) as unknown as ScoredProduct[];
}

/**
 * Insert or update scored products in the database.
 *
 * For each product:
 * - If a product with the same slug already exists, UPDATE it
 * - Otherwise, INSERT as a new record
 *
 * @param products - Scored products to write
 * @returns Summary of insertions and updates
 */
export async function upsertProducts(
  products: ScoredProduct[]
): Promise<{ inserted: number; updated: number }> {
  const supabase = createSupabaseClient();

  let inserted = 0;
  let updated = 0;

  // Fetch existing products by slug for dedup
  const slugs = products.map((p) => p.slug);
  const { data: existingRows, error: fetchError } = await supabase
    .from(TABLE_NAME)
    .select('id, slug')
    .in('slug', slugs);

  if (fetchError) {
    console.error(
      `[store] Error checking existing products: ${fetchError.message}`
    );
    // Fallback: try to insert all and let the database handle conflicts
    return await bulkInsert(supabase, products);
  }

  const existingSlugSet = new Set(existingRows?.map((r) => r.slug) ?? []);
  const slugToId = new Map(
    existingRows?.map((r) => [r.slug, r.id]) ?? []
  );

  const toInsert: ScoredProduct[] = [];
  const toUpdate: Array<{ id: string; product: ScoredProduct }> = [];

  for (const product of products) {
    if (existingSlugSet.has(product.slug)) {
      const id = slugToId.get(product.slug);
      if (id !== undefined) {
        toUpdate.push({ id, product });
      }
    } else {
      toInsert.push(product);
    }
  }

  // Batch insert new products
  if (toInsert.length > 0) {
    const insertResult = await bulkInsert(supabase, toInsert);
    inserted = insertResult.inserted;
  }

  // Batch update existing products
  for (const { id, product } of toUpdate) {
    const row = toProductRow(product);
    const { error } = await supabase
      .from(TABLE_NAME)
      .update({
        ...row,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error(
        `[store] Error updating product "${product.name}": ${error.message}`
      );
    } else {
      updated++;
    }
  }

  console.log(`[store] Upsert complete: ${inserted} inserted, ${updated} updated.`);
  return { inserted, updated };
}

/**
 * Bulk insert products into the database.
 */
async function bulkInsert(
  supabase: SupabaseClient,
  products: ScoredProduct[]
): Promise<{ inserted: number; updated: number }> {
  const rows = products.map((p) => ({
    ...toProductRow(p),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert(rows)
    .select();

  if (error) {
    console.error(
      `[store] Error inserting ${products.length} products: ${error.message}`
    );
    return { inserted: 0, updated: 0 };
  }

  console.log(`[store] Inserted ${data?.length ?? 0} new products.`);
  return { inserted: data?.length ?? 0, updated: 0 };
}

/**
 * Convert a ScoredProduct to a ProductRow for database storage.
 * Maps crawler fields to the products table schema.
 */
function toProductRow(product: ScoredProduct): ProductRow {
  return {
    slug: product.slug || generateSlug(product.name),
    name: product.name,
    name_en: product.name_en,
    name_zh: product.name_zh,
    description: product.description,
    website_url: product.website_url,
    github_url: product.github_url,
    tags: product.tags,
    category: product.category,
    pricing_model: product.pricing_model,
    github_stars: product.github_stars,
    confidence_score: product.confidence_score,
    confidence_level: product.confidence_score >= 80 ? 'high'
      : product.confidence_score >= 50 ? 'medium'
      : product.confidence_score >= 20 ? 'low'
      : 'unverified',
    availability_status: 'active',
    source_count: product.source_mentions?.length || 1,
    // Crawler provenance columns
    source: product.source,
    source_url: product.source_url,
    source_mentions: product.source_mentions,
    crawled_at: product.crawled_at,
  };
}
