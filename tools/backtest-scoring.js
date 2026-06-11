#!/usr/bin/env node
/**
 * AI Radar - Scoring Backtest Tool
 *
 * Reference: luban backtesting discipline
 * "Any scoring change must be accompanied by a 14+ day replay report"
 *
 * This tool replays crawled products through the scoring pipeline
 * and compares results with stored scores to detect regressions.
 *
 * Usage: node tools/backtest-scoring.js [--days=14] [--threshold=5]
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Error: Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Parse args
const daysArg = process.argv.find(a => a.startsWith('--days='));
const DAYS = daysArg ? parseInt(daysArg.split('=')[1]) : 14;

const thresholdArg = process.argv.find(a => a.startsWith('--threshold='));
const THRESHOLD = thresholdArg ? parseInt(thresholdArg.split('=')[1]) : 5;

/**
 * Recalculate confidence score for a product.
 * Mirrors the scoring logic in crawler/src/pipeline/score.ts
 */
function calculateScore(product) {
  let score = 20; // base

  // Multi-source bonus
  const sourceCount = product.source_mentions?.length || product.source_count || 1;
  if (sourceCount >= 3) score += 30;
  else if (sourceCount >= 2) score += 15;

  // GitHub stars bonus
  const stars = product.github_stars || 0;
  if (stars >= 10000) score += 20;
  else if (stars >= 1000) score += 15;
  else if (stars >= 100) score += 10;

  // Website exists
  if (product.website_url) score += 10;

  // Recent activity (updated within 30 days)
  if (product.updated_at) {
    const daysSinceUpdate = (Date.now() - new Date(product.updated_at).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceUpdate <= 30) score += 20;
    else if (daysSinceUpdate <= 90) score += 10;
  }

  return Math.min(100, Math.max(0, score));
}

async function runBacktest() {
  console.log('\n📊 AI Radar - Scoring Backtest');
  console.log('='.repeat(50));
  console.log(`Period: last ${DAYS} days`);
  console.log(`Threshold: ±${THRESHOLD} points\n`);

  // Fetch products from the last N days
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - DAYS);

  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .gte('created_at', cutoff.toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching products:', error.message);
    process.exit(1);
  }

  if (!products || products.length === 0) {
    console.log('No products found in the last ${DAYS} days. Nothing to backtest.');
    process.exit(0);
  }

  console.log(`Found ${products.length} products to backtest\n`);

  let regressions = 0;
  let improvements = 0;
  let stable = 0;
  const results = [];

  for (const product of products) {
    const stored = product.confidence_score || 0;
    const calculated = calculateScore(product);
    const diff = calculated - stored;

    const status = Math.abs(diff) <= THRESHOLD ? 'stable' : (diff > 0 ? 'improved' : 'regressed');

    if (status === 'regressed') regressions++;
    else if (status === 'improved') improvements++;
    else stable++;

    results.push({
      name: product.name,
      slug: product.slug,
      stored,
      calculated,
      diff,
      status,
    });
  }

  // Report
  console.log('Results:');
  console.log(`  ✅ Stable (±${THRESHOLD}): ${stable}`);
  console.log(`  📈 Improved: ${improvements}`);
  console.log(`  📉 Regressed: ${regressions}`);

  if (regressions > 0) {
    console.log(`\n⚠️  Regressions (score dropped >${THRESHOLD} points):`);
    results
      .filter(r => r.status === 'regressed')
      .sort((a, b) => a.diff - b.diff)
      .slice(0, 10)
      .forEach(r => {
        console.log(`  ${r.name}: ${r.stored} → ${r.calculated} (${r.diff > 0 ? '+' : ''}${r.diff})`);
      });
  }

  if (improvements > 0) {
    console.log(`\n📈 Improvements (score increased >${THRESHOLD} points):`);
    results
      .filter(r => r.status === 'improved')
      .sort((a, b) => b.diff - a.diff)
      .slice(0, 10)
      .forEach(r => {
        console.log(`  ${r.name}: ${r.stored} → ${r.calculated} (+${r.diff})`);
      });
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  if (regressions === 0) {
    console.log('✅ Backtest passed - no regressions detected');
  } else {
    console.log(`❌ Backtest FAILED - ${regressions} regressions detected`);
    console.log('   Review scoring algorithm before deploying changes');
    process.exit(1);
  }
}

runBacktest().catch(e => {
  console.error('Fatal error:', e.message);
  process.exit(1);
});
