#!/usr/bin/env node
/**
 * AI Radar - Source Deduplication Check
 *
 * Reference: luban dedup patterns
 * - Same-source decay: prevent single source from dominating
 * - Near-duplicate suppression: detect similar products
 * - Cluster-based dedup: group related products
 *
 * Usage: node tools/dedup-check.js [--fix] [--max-source-ratio=0.3]
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Error: Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const FIX = process.argv.includes('--fix');

const ratioArg = process.argv.find(a => a.startsWith('--max-source-ratio='));
const MAX_SOURCE_RATIO = ratioArg ? parseFloat(ratioArg.split('=')[1]) : 0.3;

/**
 * Simple Levenshtein distance for near-duplicate detection
 */
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return dp[m][n];
}

/**
 * Normalize name for comparison
 */
function normalize(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function runDedupCheck() {
  console.log('\n🔍 AI Radar - Source Deduplication Check');
  console.log('='.repeat(50));

  const { data: products, error } = await supabase.from('products').select('*');
  if (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }

  if (!products || products.length === 0) {
    console.log('No products found.');
    process.exit(0);
  }

  console.log(`Checking ${products.length} products...\n`);

  // 1. Source dominance check
  console.log('📊 Source Distribution:');
  const sourceCounts = {};
  products.forEach(p => {
    const source = p.source || 'unknown';
    sourceCounts[source] = (sourceCounts[source] || 0) + 1;
  });

  const sortedSources = Object.entries(sourceCounts).sort((a, b) => b[1] - a[1]);
  sortedSources.forEach(([source, count]) => {
    const ratio = count / products.length;
    const bar = '█'.repeat(Math.round(ratio * 30));
    const flag = ratio > MAX_SOURCE_RATIO ? ' ⚠️  DOMINANT' : '';
    console.log(`  ${source.padEnd(15)} ${String(count).padStart(4)} (${(ratio * 100).toFixed(1)}%) ${bar}${flag}`);
  });

  const dominantSources = sortedSources.filter(([, count]) => count / products.length > MAX_SOURCE_RATIO);
  if (dominantSources.length > 0) {
    console.log(`\n⚠️  ${dominantSources.length} source(s) exceed ${(MAX_SOURCE_RATIO * 100)}% ratio threshold`);
  } else {
    console.log('\n✅ Source distribution is healthy');
  }

  // 2. Near-duplicate detection
  console.log('\n🔍 Near-Duplicate Detection:');
  const nearDuplicates = [];
  const normalized = products.map(p => ({ ...p, norm: normalize(p.name) }));

  for (let i = 0; i < normalized.length; i++) {
    for (let j = i + 1; j < normalized.length; j++) {
      const dist = levenshtein(normalized[i].norm, normalized[j].norm);
      const maxLen = Math.max(normalized[i].norm.length, normalized[j].norm.length);
      const similarity = 1 - dist / maxLen;

      if (similarity > 0.8 && maxLen > 3) {
        nearDuplicates.push({
          a: normalized[i].name,
          b: normalized[j].name,
          similarity: (similarity * 100).toFixed(1),
        });
      }
    }
  }

  if (nearDuplicates.length > 0) {
    console.log(`  Found ${nearDuplicates.length} potential duplicates:`);
    nearDuplicates.slice(0, 10).forEach(d => {
      console.log(`    "${d.a}" ↔ "${d.b}" (${d.similarity}% similar)`);
    });
  } else {
    console.log('  No near-duplicates found');
  }

  // 3. Same-name check
  console.log('\n🔍 Same-Name Check:');
  const nameGroups = {};
  products.forEach(p => {
    const key = normalize(p.name);
    if (!nameGroups[key]) nameGroups[key] = [];
    nameGroups[key].push(p);
  });

  const sameNameDupes = Object.entries(nameGroups).filter(([, group]) => group.length > 1);
  if (sameNameDupes.length > 0) {
    console.log(`  Found ${sameNameDupes.length} name groups with duplicates:`);
    sameNameDupes.slice(0, 5).forEach(([, group]) => {
      console.log(`    "${group[0].name}" appears ${group.length} times: ${group.map(p => p.slug).join(', ')}`);
    });
  } else {
    console.log('  No duplicate names found');
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  const totalIssues = dominantSources.length + nearDuplicates.length + sameNameDupes.length;
  if (totalIssues === 0) {
    console.log('✅ All deduplication checks passed');
  } else {
    console.log(`⚠️  Found ${totalIssues} potential issues`);
    if (FIX) {
      console.log('🔧 Auto-fix not yet implemented - review manually');
    }
  }
}

runDedupCheck().catch(e => {
  console.error('Fatal error:', e.message);
  process.exit(1);
});
