/**
 * Supabase storage module.
 *
 * Handles reading existing products from the database (for deduplication)
 * and writing new scored products to the database.
 *
 * Uses the Supabase JS client with the service role key for full access.
 *
 * Expected table: crawled_products
 *   - id: int8 (auto-increment primary key)
 *   - name: text
 *   - name_en: text
 *   - name_zh: text
 *   - description: text
 *   - website_url: text
 *   - github_url: text
 *   - tags: text[] (array)
 *   - category: text
 *   - source: text
 *   - source_url: text
 *   - crawled_at: timestamptz
 *   - github_stars: int4
 *   - pricing_model: text
 *   - confidence_score: int4
 *   - source_mentions: text[] (array)
 *   - created_at: timestamptz (default now())
 *   - updated_at: timestamptz (default now())
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ScoredProduct, ProductRow } from '../types.js';

/**
 * Supabase table name for crawled products.
 */
const TABLE_NAME = 'crawled_products';

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
 * Fetch existing products from the database for deduplication comparison.
 * Returns products crawled within the last DEDUP_LOOKBACK_DAYS days.
 *
 * @returns Array of CrawledProduct objects from the database
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
      'name, name_en, name_zh, description, website_url, github_url, tags, category, source, source_url, crawled_at, github_stars, pricing_model, confidence_score, source_mentions'
    )
    .gte('crawled_at', lookbackDate.toISOString())
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
 * - If a product with the same name already exists, UPDATE it
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

  // First, fetch all existing product names to determine insert vs update
  const { data: existingRows, error: fetchError } = await supabase
    .from(TABLE_NAME)
    .select('id, name')
    .in(
      'name',
      products.map((p) => p.name)
    );

  if (fetchError) {
    console.error(
      `[store] Error checking existing products: ${fetchError.message}`
    );
    // Fallback: try to insert all and let the database handle conflicts
    return await bulkInsert(supabase, products);
  }

  const existingNameSet = new Set(existingRows?.map((r) => r.name) ?? []);
  const nameToId = new Map(
    existingRows?.map((r) => [r.name, r.id]) ?? []
  );

  const toInsert: ScoredProduct[] = [];
  const toUpdate: Array<{ id: number; product: ScoredProduct }> = [];

  for (const product of products) {
    if (existingNameSet.has(product.name)) {
      const id = nameToId.get(product.name);
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
 */
function toProductRow(product: ScoredProduct): ProductRow {
  return {
    name: product.name,
    name_en: product.name_en,
    name_zh: product.name_zh,
    description: product.description,
    website_url: product.website_url,
    github_url: product.github_url,
    tags: product.tags,
    category: product.category,
    source: product.source,
    source_url: product.source_url,
    crawled_at: product.crawled_at,
    github_stars: product.github_stars,
    pricing_model: product.pricing_model,
    confidence_score: product.confidence_score,
    source_mentions: product.source_mentions,
  };
}
