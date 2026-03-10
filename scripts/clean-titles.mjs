/**
 * One-time cleanup: strip source prefixes from idea titles.
 * - HN: "Show HN:", "Ask HN:", "Launch HN:", "Tell HN:"
 * - GitHub: "[Feature Request]", "[Enhancement]", "[Bug]", "[Help Wanted]", "[RFC]"
 *
 * Usage: node scripts/clean-titles.mjs
 */
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { resolve, dirname } from 'path';
config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../apps/web/.env') });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const PATTERNS = [
  { regex: /^(?:Show|Ask|Launch|Tell)\s+HN:\s*/i, source: 'hackernews' },
  { regex: /^\[(?:Feature Request|Enhancement|Bug|Help Wanted|RFC)\]\s*/i, source: 'github' },
  { regex: /^(?:Feature Request|Enhancement):\s*/i, source: 'github' },
];

async function main() {
  let totalCleaned = 0;

  for (const pattern of PATTERNS) {
    const { data: ideas, error } = await supabase
      .from('ideas')
      .select('id, idea_title')
      .eq('source', pattern.source);

    if (error) {
      console.error(`Failed to fetch ${pattern.source} ideas:`, error.message);
      continue;
    }

    const toUpdate = ideas.filter((i) => pattern.regex.test(i.idea_title));
    if (toUpdate.length === 0) continue;

    console.log(`Found ${toUpdate.length} ${pattern.source} ideas with prefix: ${pattern.regex}`);

    for (const idea of toUpdate) {
      const cleaned = idea.idea_title.replace(pattern.regex, '');
      const { error: updateErr } = await supabase
        .from('ideas')
        .update({ idea_title: cleaned })
        .eq('id', idea.id);

      if (updateErr) {
        console.error(`  Failed to update "${idea.idea_title}":`, updateErr.message);
      } else {
        totalCleaned++;
      }
    }
  }

  console.log(`\nDone. Cleaned ${totalCleaned} titles.`);
}

main();
