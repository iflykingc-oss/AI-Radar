#!/usr/bin/env node
/**
 * AI Radar - Data Quality Check Tool
 *
 * Reference: luban "living body check" pattern
 * - Pull real production data, don't trust CI green lights
 * - Validate data freshness, completeness, and consistency
 * - Report anomalies with actionable details
 *
 * Usage: node tools/quality-check.js [--fix] [--verbose]
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Error: Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const VERBOSE = process.argv.includes('--verbose');
const FIX = process.argv.includes('--fix');

let issues = [];
let warnings = [];
let fixed = 0;

function log(level, msg, details) {
  const entry = { level, msg, details };
  if (level === 'error') issues.push(entry);
  if (level === 'warn') warnings.push(entry);
  if (VERBOSE || level === 'error') {
    console.log(`[${level.toUpperCase()}] ${msg}`);
    if (details) console.log(`  → ${details}`);
  }
}

async function checkTableExists() {
  const { data, error } = await supabase.from('products').select('id', { head: true, count: 'exact' });
  if (error) {
    log('error', 'Products table not accessible', error.message);
    return false;
  }
  log('info', `Products table accessible, ${data?.length || 0} rows`);
  return true;
}

async function checkDuplicateSlugs() {
  const { data } = await supabase.from('products').select('slug');
  if (!data) return;

  const slugCounts = {};
  data.forEach(p => {
    slugCounts[p.slug] = (slugCounts[p.slug] || 0) + 1;
  });

  const dupes = Object.entries(slugCounts).filter(([, count]) => count > 1);
  if (dupes.length > 0) {
    log('error', `Found ${dupes.length} duplicate slugs`, dupes.map(([s, c]) => `${s}(${c}x)`).join(', '));
  } else {
    log('info', 'No duplicate slugs found');
  }
}

async function checkMissingFields() {
  const { data } = await supabase.from('products').select('id, name, slug, description, category, confidence_score, website_url, github_url');
  if (!data) return;

  const required = ['name', 'slug', 'description', 'category'];
  const recommended = ['website_url', 'github_url'];

  for (const field of required) {
    const missing = data.filter(p => !p[field] || p[field] === '');
    if (missing.length > 0) {
      log('error', `${missing.length} products missing required field: ${field}`,
        missing.slice(0, 3).map(p => p.name || p.slug).join(', ') + (missing.length > 3 ? '...' : ''));
    }
  }

  for (const field of recommended) {
    const missing = data.filter(p => !p[field] || p[field] === '');
    if (missing.length > data.length * 0.5) {
      log('warn', `${missing.length}/${data.length} products missing recommended field: ${field}`);
    }
  }
}

async function checkConfidenceDistribution() {
  const { data } = await supabase.from('products').select('name, confidence_score, confidence_level');
  if (!data || data.length === 0) return;

  const distribution = { high: 0, medium: 0, low: 0, unverified: 0 };
  const mismatches = [];

  data.forEach(p => {
    const score = p.confidence_score || 0;
    const level = p.confidence_level || 'unverified';

    // Check level matches score
    let expectedLevel;
    if (score >= 80) expectedLevel = 'high';
    else if (score >= 50) expectedLevel = 'medium';
    else if (score >= 20) expectedLevel = 'low';
    else expectedLevel = 'unverified';

    if (level !== expectedLevel) {
      mismatches.push({ name: p.name, score, actual: level, expected: expectedLevel });
    }

    distribution[level] = (distribution[level] || 0) + 1;
  });

  log('info', `Confidence distribution: high=${distribution.high}, medium=${distribution.medium}, low=${distribution.low}, unverified=${distribution.unverified}`);

  if (mismatches.length > 0) {
    log('warn', `${mismatches.length} products have mismatched confidence_level`,
      mismatches.slice(0, 3).map(m => `${m.name}: ${m.score}→${m.actual}(expected ${m.expected})`).join(', '));

    if (FIX) {
      for (const m of mismatches) {
        const { error } = await supabase
          .from('products')
          .update({ confidence_level: m.expected })
          .eq('name', m.name);
        if (!error) fixed++;
      }
      log('info', `Fixed ${fixed} confidence_level mismatches`);
    }
  }
}

async function checkDataFreshness() {
  const { data } = await supabase.from('products').select('name, created_at, updated_at, crawled_at').order('updated_at', { ascending: false }).limit(10);
  if (!data || data.length === 0) return;

  const now = new Date();
  const staleThreshold = 7 * 24 * 60 * 60 * 1000; // 7 days

  const stale = data.filter(p => {
    const lastUpdate = new Date(p.updated_at || p.created_at);
    return (now - lastUpdate) > staleThreshold;
  });

  if (stale.length > 0) {
    log('warn', `${stale.length} of top 10 products haven't been updated in 7+ days`,
      stale.slice(0, 3).map(p => p.name).join(', '));
  } else {
    log('info', 'Top 10 products are fresh (updated within 7 days)');
  }
}

async function checkCrawlerProvenance() {
  const { data, error } = await supabase.from('products').select('name, source, crawled_at').limit(5);
  if (error) {
    log('warn', 'Crawler provenance columns not available (source, crawled_at)');
    return;
  }

  const withSource = data.filter(p => p.source);
  log('info', `${withSource.length}/${data.length} sample products have crawler source tracking`);
}

async function checkIndexHealth() {
  // This requires direct DB access, skip if not available
  log('info', 'Index health check requires direct DB access (skipped)');
}

async function runAllChecks() {
  console.log('\n🔍 AI Radar - Data Quality Check');
  console.log('='.repeat(50));

  const tableExists = await checkTableExists();
  if (!tableExists) {
    console.log('\n❌ Cannot proceed - products table not accessible');
    process.exit(1);
  }

  await checkDuplicateSlugs();
  await checkMissingFields();
  await checkConfidenceDistribution();
  await checkDataFreshness();
  await checkCrawlerProvenance();
  await checkIndexHealth();

  console.log('\n' + '='.repeat(50));
  console.log(`✅ Checks complete`);
  if (issues.length > 0) console.log(`❌ ${issues.length} errors found`);
  if (warnings.length > 0) console.log(`⚠️  ${warnings.length} warnings`);
  if (fixed > 0) console.log(`🔧 ${fixed} issues auto-fixed`);
  if (issues.length === 0 && warnings.length === 0) console.log('🎉 All checks passed!');

  process.exit(issues.length > 0 ? 1 : 0);
}

runAllChecks().catch(e => {
  console.error('Fatal error:', e.message);
  process.exit(1);
});
