/**
 * Backfill unscored ideas with the FL-primary scoring system.
 *
 * Run: node scripts/backfill-all.mjs
 * Monitor: node scripts/check-backfill.mjs
 *
 * Only scores ideas that DON'T have a flylabs_score yet.
 * Uses Haiku for cost efficiency (~$0.005/idea vs $0.05 for Sonnet).
 * Processes in batches of 500, with 3s delay between batches.
 * Stops automatically when all ideas are scored.
 *
 * Cost estimate: 226 unscored ideas = ~$1.13 with Haiku.
 */
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const log = (msg) => { const ts = new Date().toLocaleTimeString(); process.stdout.write(`[${ts}] ${msg}\n`); };

function run() {
  try {
    const output = execSync('node scripts/score-ideas.mjs --backfill', {
      cwd: ROOT,
      timeout: 30 * 60 * 1000,
      stdio: ['ignore', 'pipe', 'pipe'],
      encoding: 'utf-8',
      env: { ...process.env, NODE_OPTIONS: '' },
    });
    output.split('\n').forEach(line => { if (line.trim()) console.log(line); });
    return output;
  } catch (err) {
    const out = err.stdout || '';
    out.split('\n').forEach(line => { if (line.trim()) console.log(line); });
    if (err.stderr) err.stderr.split('\n').forEach(line => { if (line.trim()) console.error(line); });
    // Detect credit exhaustion and stop immediately
    if (out.includes('credit balance is too low') || (err.stderr || '').includes('credit balance is too low')) {
      log('Credits exhausted. Stopping backfill.');
      process.exit(1);
    }
    return out;
  }
}

async function main() {
  log('=== Backfill started (scoring UNSCORED ideas only, Haiku) ===');

  let round = 1;
  const MAX_ROUNDS = 20; // Safety limit: 20 rounds x 500 ideas = 10,000 max

  while (round <= MAX_ROUNDS) {
    log(`Round ${round}: scoring unscored ideas...`);
    const output = run();

    if (output.includes('Found 0 ideas')) {
      log('All ideas scored. Backfill complete.');
      break;
    }

    // Detect credit errors
    if (output.includes('credit balance is too low')) {
      log('Credits exhausted. Stopping.');
      break;
    }

    const match = output.match(/Scored: (\d+)/);
    const failMatch = output.match(/Failed: (\d+)/);
    log(`Round ${round} done. Scored: ${match ? match[1] : '?'}, Failed: ${failMatch ? failMatch[1] : '0'}`);
    round++;
    await new Promise(r => setTimeout(r, 3000));
  }

  if (round > MAX_ROUNDS) {
    log(`Safety limit reached (${MAX_ROUNDS} rounds). Check for issues.`);
  }

  log('=== Backfill finished ===');
}

main().catch(err => { log(`Fatal error: ${err.message}`); process.exit(1); });
