/**
 * Backfill ALL ideas with the simplified FL-primary scoring.
 *
 * Run: nohup caffeinate -i node scripts/backfill-all.mjs >> backfill.log 2>&1 &
 * Monitor: node scripts/check-backfill.mjs
 *
 * Scores EVERY idea (BUILD, VALIDATE, SKIP, and unscored).
 * FL score = the score. Expert perspectives stored for detail page only.
 * composite_score = flylabs_score (backward compat).
 */
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const log = (msg) => { const ts = new Date().toLocaleTimeString(); process.stdout.write(`[${ts}] ${msg}\n`); };

function run(args) {
  try {
    const output = execSync(`node scripts/score-ideas.mjs ${args}`, {
      cwd: ROOT,
      timeout: 30 * 60 * 1000, // 30 min per batch
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
    return out;
  }
}

async function main() {
  log('=== Backfill started (scoring ALL ideas with FL-primary system) ===');

  // Phase 1: Re-score ALL existing ideas (--all --backfill scores everything)
  let round = 1;
  while (true) {
    log(`Phase 1, Round ${round}: re-scoring all ideas with Haiku`);
    const output = run('--all --backfill');

    if (output.includes('Found 0 ideas')) {
      log('Phase 1 complete: all existing ideas re-scored.');
      break;
    }

    const match = output.match(/Scored: (\d+)/);
    log(`Round ${round} done. Scored: ${match ? match[1] : '?'}`);
    round++;
    await new Promise(r => setTimeout(r, 3000));
  }

  // Phase 2: Score any remaining unscored ideas
  round = 1;
  while (true) {
    log(`Phase 2, Round ${round}: scoring unscored ideas with Haiku`);
    const output = run('--backfill');

    if (output.includes('Found 0 ideas')) {
      log('Phase 2 complete: all ideas scored.');
      break;
    }

    const match = output.match(/Scored: (\d+)/);
    log(`Round ${round} done. Scored: ${match ? match[1] : '?'}`);
    round++;
    await new Promise(r => setTimeout(r, 3000));
  }

  log('=== All done. Every idea scored with FL-primary system. ===');
}

main().catch(err => { log(`Fatal error: ${err.message}`); process.exit(1); });
