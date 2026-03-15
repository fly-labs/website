// Quick check on backfill progress
// Run: node scripts/check-backfill.mjs
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { resolve, dirname } from 'path';
config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../apps/web/.env') });

const sb = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const { count: total } = await sb.from('ideas').select('id', { count: 'exact', head: true }).eq('approved', true);
  const { count: build } = await sb.from('ideas').select('id', { count: 'exact', head: true }).eq('approved', true).eq('verdict', 'BUILD');
  const { count: validate } = await sb.from('ideas').select('id', { count: 'exact', head: true }).eq('approved', true).eq('verdict', 'VALIDATE_FIRST');
  const { count: skip } = await sb.from('ideas').select('id', { count: 'exact', head: true }).eq('approved', true).eq('verdict', 'SKIP');
  const { count: unscored } = await sb.from('ideas').select('id', { count: 'exact', head: true }).eq('approved', true).is('verdict', null);
  const { count: withPain } = await sb.from('ideas').select('id', { count: 'exact', head: true }).eq('approved', true).not('score_breakdown->synthesis->the_pain', 'is', null);
  const fiveMin = new Date(Date.now() - 5 * 60000).toISOString();
  const { count: recent } = await sb.from('ideas').select('id', { count: 'exact', head: true }).eq('approved', true).gte('updated_at', fiveMin);

  console.log(`\n  Backfill Progress`);
  console.log(`  ${'─'.repeat(40)}`);
  console.log(`  Total ideas:      ${total}`);
  console.log(`  BUILD:            ${build}`);
  console.log(`  VALIDATE_FIRST:   ${validate}`);
  console.log(`  SKIP:             ${skip}`);
  console.log(`  Unscored:         ${unscored}`);
  console.log(`  With synthesis:   ${withPain} (the_pain/the_gap/build_angle)`);
  console.log(`  Updated (5 min):  ${recent}`);
  console.log(`  Progress:         ${Math.round((withPain / total) * 100)}%`);

  const running = (await import('child_process')).execSync('ps aux | grep score-ideas | grep -v grep | wc -l', { encoding: 'utf-8' }).trim();
  console.log(`  Process alive:    ${running > 0 ? 'yes' : 'NO (restart with: nohup caffeinate -i node scripts/backfill-all.mjs >> backfill.log 2>&1 &)'}`);
  console.log();
}

check();
