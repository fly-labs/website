import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const PROBLEMHUNT_URL = 'https://problemhunt.pro/en';

async function fetchProblems() {
  console.log('Fetching problems from ProblemHunt...');
  const res = await fetch(PROBLEMHUNT_URL, {
    headers: { 'User-Agent': 'FlyLabs-Sync/1.0 (https://flylabs.fun)' },
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }

  const html = await res.text();

  // Parse problem cards from HTML
  // ProblemHunt uses structured cards with title, category, country, tags, URL
  const problems = [];
  const cardRegex = /<a[^>]*href="(\/en\/problems\/[^"]+)"[^>]*>[\s\S]*?<h\d[^>]*>([\s\S]*?)<\/h\d>/g;
  let match;

  while ((match = cardRegex.exec(html)) !== null) {
    const url = `https://problemhunt.pro${match[1]}`;
    const title = match[2].replace(/<[^>]*>/g, '').trim();
    const slug = match[1].split('/').pop();

    if (title && slug) {
      problems.push({
        idea_title: title,
        idea_description: null,
        category: 'Tool',
        source: 'problemhunt',
        source_url: url,
        external_id: `problemhunt-url-${slug}`,
        approved: true,
        name: 'ProblemHunt',
        email: null,
        votes: 0,
      });
    }
  }

  console.log(`Parsed ${problems.length} problems from page`);
  return problems;
}

async function syncToSupabase(problems) {
  // Get existing external_ids
  const { data: existing } = await supabase
    .from('ideas')
    .select('external_id')
    .not('external_id', 'is', null);

  const existingIds = new Set((existing || []).map((r) => r.external_id));

  // Filter out duplicates (also check old-format IDs)
  const newProblems = problems.filter((p) => {
    if (existingIds.has(p.external_id)) return false;
    // Also check legacy format without "url-" prefix
    const legacyId = p.external_id.replace('problemhunt-url-', 'problemhunt-');
    if (existingIds.has(legacyId)) return false;
    return true;
  });

  console.log(`${problems.length} total, ${existingIds.size} already exist, ${newProblems.length} new`);

  if (newProblems.length === 0) {
    console.log('Nothing to insert.');
    return 0;
  }

  // Insert in batches of 50
  const BATCH_SIZE = 50;
  let inserted = 0;

  for (let i = 0; i < newProblems.length; i += BATCH_SIZE) {
    const batch = newProblems.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from('ideas').insert(batch);

    if (error) {
      console.error(`Batch error:`, error.message);
    } else {
      inserted += batch.length;
    }
  }

  console.log(`Inserted ${inserted} new problems`);
  return inserted;
}

async function main() {
  try {
    const problems = await fetchProblems();
    if (problems.length === 0) {
      console.log('No problems found on page. HTML structure may have changed.');
      return;
    }
    await syncToSupabase(problems);
    console.log('Sync complete.');
  } catch (err) {
    console.error('Sync failed:', err.message);
    process.exit(1);
  }
}

main();
