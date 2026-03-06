import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const raw = JSON.parse(readFileSync(join(__dirname, 'problemhunt.json'), 'utf-8'));

const rows = raw.map((item) => ({
  idea_title: item.title,
  idea_description: null,
  category: 'Tool',
  industry: item.category,
  source: 'problemhunt',
  source_url: item.url,
  external_id: `problemhunt-${item.id}`,
  tags: item.tags,
  country: item.country,
  created_at: item.date,
  approved: true,
  name: 'ProblemHunt',
  email: null,
  votes: 0,
}));

// Check which external_ids already exist
const existingIds = new Set();
const { data: existing } = await supabase
  .from('ideas')
  .select('external_id')
  .not('external_id', 'is', null);
if (existing) {
  existing.forEach((r) => existingIds.add(r.external_id));
}

// Filter out duplicates
const newRows = rows.filter((r) => !existingIds.has(r.external_id));
console.log(`${rows.length} total, ${existingIds.size} already exist, ${newRows.length} to insert.`);

// Insert in batches of 50
const BATCH_SIZE = 50;
let inserted = 0;
let failed = 0;

for (let i = 0; i < newRows.length; i += BATCH_SIZE) {
  const batch = newRows.slice(i, i + BATCH_SIZE);
  const { error } = await supabase.from('ideas').insert(batch);

  if (error) {
    console.error(`Batch ${Math.floor(i / BATCH_SIZE) + 1} error:`, error.message);
    failed += batch.length;
  } else {
    inserted += batch.length;
  }
}

console.log(`Done. Inserted ${inserted}, failed ${failed}.`);
