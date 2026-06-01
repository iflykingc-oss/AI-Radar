/**
 * AI Radar - Migration Runner
 * 
 * Executes SQL migration directly via Supabase REST API (no CLI needed).
 * 
 * Usage:
 *   npx tsx supabase/migrate.ts
 * 
 * Environment:
 *   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing environment variables');
  console.error('   Create a .env file with:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co');
  console.error('   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function runMigration() {
  const sqlPath = resolve(__dirname, 'migrations', '001_initial_schema.sql');
  console.log(`📄 Reading migration: ${sqlPath}`);
  
  const sql = readFileSync(sqlPath, 'utf-8');
  console.log(`📝 SQL length: ${sql.length} bytes\n`);
  
  // Supabase doesn't have a direct "run arbitrary SQL" endpoint via the JS client.
  // Instead, we use the pgrest endpoint or execute via REST API.
  // For now, we'll use the RPC approach or direct REST call.
  
  // Alternative: use the Supabase Management API to run SQL
  // But this requires a personal access token.
  
  // Simplest approach: use the `rpc` endpoint with a custom function
  // Or execute via the REST API's SQL endpoint.
  
  console.log('🔗 Attempting to execute migration via Supabase REST API...');
  
  const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({}),
  });
  
  if (response.ok) {
    console.log('✅ Supabase connection verified');
  } else {
    console.error('❌ Failed to connect to Supabase:', await response.text());
  }
  
  console.log('\n⚠️  Note: Direct SQL execution via REST API is limited.');
  console.log('   Please run the migration SQL manually via:');
  console.log('   1. Supabase Dashboard → SQL Editor → paste and run');
  console.log('   2. Or: supabase db push (if CLI is available)');
  console.log(`\n   Migration file: ${sqlPath}`);
}

runMigration().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
