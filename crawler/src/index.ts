/**
 * AI Radar Crawler Service - Entry Point
 *
 * Orchestrates the full crawling pipeline:
 * 1. Fetch products from all configured data sources (Product Hunt, GitHub, Hacker News, RSS)
 * 2. Deduplicate against existing database products
 * 3. Enrich with missing information
 * 4. Score for confidence
 * 5. Upsert into Supabase
 *
 * Runs on a configurable cron schedule (default: daily at 2 AM).
 * Can also be triggered manually by running `npm start`.
 */
import 'dotenv/config';
import { CronJob } from 'cron';
import { DataSource, CrawledProduct, ScoredProduct } from './types.js';
import { ProductHuntSource } from './sources/producthunt.js';
import { GitHubSource } from './sources/github.js';
import { HackerNewsSource } from './sources/hackernews.js';
import { RSSSource } from './sources/rss.js';
import { deduplicate } from './pipeline/dedup.js';
import { enrich } from './pipeline/enrich.js';
import { scoreProducts } from './pipeline/score.js';
import { fetchExistingProducts, upsertProducts } from './store/supabase.js';

/**
 * Default cron schedule: every day at 2:00 AM.
 * Can be overridden via CRON_SCHEDULE environment variable.
 */
const DEFAULT_CRON_SCHEDULE = '0 2 * * *';

/**
 * Minimum confidence score threshold for products to be stored.
 * Products below this score are discarded.
 */
const MIN_CONFIDENCE_SCORE = 30;

/**
 * Initialize all data sources.
 */
function initializeSources(): DataSource[] {
  return [
    new ProductHuntSource(),
    new GitHubSource(),
    new HackerNewsSource(),
    new RSSSource(),
  ];
}

/**
 * Run a single crawl cycle:
 * 1. Fetch from all sources
 * 2. Deduplicate
 * 3. Enrich
 * 4. Score
 * 5. Store
 */
async function runCrawlCycle(): Promise<void> {
  const startTime = Date.now();
  console.log('='.repeat(60));
  console.log(`[main] Crawl cycle started at ${new Date().toISOString()}`);
  console.log('='.repeat(60));

  // Step 1: Fetch from all data sources
  const sources = initializeSources();
  const allProducts: CrawledProduct[] = [];

  for (const source of sources) {
    try {
      const products = await source.fetch();
      allProducts.push(...products);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[main] Source "${source.name}" threw an error: ${message}`);
      // Continue to next source — one failure shouldn't block others
    }
  }

  console.log(`[main] Total raw products from all sources: ${allProducts.length}`);

  if (allProducts.length === 0) {
    console.log('[main] No products found. Ending crawl cycle.');
    return;
  }

  // Step 2: Fetch existing products from database for deduplication
  let existingProducts: ScoredProduct[] = [];
  try {
    existingProducts = await fetchExistingProducts();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[main] Could not fetch existing products for dedup: ${message}`);
    // Proceed without dedup if database is unavailable
    existingProducts = [];
  }

  // Step 3: Deduplicate
  const newProducts = deduplicate(allProducts, existingProducts);
  console.log(`[main] After deduplication: ${newProducts.length} new products`);

  if (newProducts.length === 0) {
    console.log('[main] All products were duplicates. Ending crawl cycle.');
    return;
  }

  // Step 4: Enrich
  enrich(newProducts);
  console.log(`[main] Enriched ${newProducts.length} products`);

  // Step 5: Score
  const scoredProducts = scoreProducts(newProducts);

  // Filter out low-confidence products
  const highConfidenceProducts = scoredProducts.filter(
    (p) => p.confidence_score >= MIN_CONFIDENCE_SCORE
  );
  console.log(
    `[main] After confidence filter (>= ${MIN_CONFIDENCE_SCORE}): ${highConfidenceProducts.length} products`
  );

  if (highConfidenceProducts.length === 0) {
    console.log('[main] No products meet the confidence threshold. Ending crawl cycle.');
    return;
  }

  // Step 6: Store in Supabase
  try {
    const result = await upsertProducts(highConfidenceProducts);
    console.log(
      `[main] Storage complete: ${result.inserted} inserted, ${result.updated} updated`
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[main] Failed to store products: ${message}`);
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`[main] Crawl cycle completed in ${duration}s`);
  console.log('='.repeat(60));
}

/**
 * Main entry point.
 * If run directly (not imported), starts the cron scheduler.
 */
async function main(): Promise<void> {
  // If MANUAL_RUN is set, execute once and exit
  if (process.env.MANUAL_RUN === 'true') {
    console.log('[main] Running in manual mode (single execution)');
    await runCrawlCycle();
    process.exit(0);
    return;
  }

  // Otherwise, start the cron scheduler
  const cronSchedule = process.env.CRON_SCHEDULE || DEFAULT_CRON_SCHEDULE;
  console.log(`[main] Starting cron scheduler with schedule: ${cronSchedule}`);

  const job = new CronJob(
    cronSchedule,
    async () => {
      await runCrawlCycle();
    },
    null, // onComplete
    true, // start immediately
    'UTC' // timezone
  );

  const nextDate = job.nextDate();
  console.log(`[main] Cron job started. Next run: ${nextDate ? nextDate.toISO() ?? 'unknown' : 'unknown'}`);

  // Keep the process alive
  process.stdin.resume();
}

// Run if executed directly
main().catch((error) => {
  console.error(`[main] Fatal error: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
