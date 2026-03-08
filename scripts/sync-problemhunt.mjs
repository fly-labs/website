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

// Tilda feed API for ProblemHunt
const FEED_URL = 'https://feeds.tildacdn.com/api/getfeed/';
const FEED_UID = '108885097871';
const FEED_RECID = '1651102281';
const PAGE_SIZE = 200;

// Map Tilda category labels to our industry values
const CATEGORY_MAP = {
  'Marketing &amp; Sales': 'Marketing Sales',
  'Marketing & Sales': 'Marketing Sales',
  'Finance': 'Finance',
  'Medicine &amp; Health': 'Medicine Health',
  'Medicine & Health': 'Medicine Health',
  'Business': 'Business',
  'Realty': 'Realty',
  'Productivity': 'Productivity',
  'Education': 'Education',
  'HR &amp; Career': 'Hr Career',
  'HR & Career': 'Hr Career',
  'AI': 'Ai',
  'Sport &amp; Fitness': 'Sport Fitness',
  'Sport & Fitness': 'Sport Fitness',
  'Retail': 'Retail',
  'Freelance': 'Freelance',
  'Dev': 'Dev',
  'Transportation': 'Transportation',
  'Media': 'Media',
  'Food &amp; Nutrition': 'Food Nutrition',
  'Food & Nutrition': 'Food Nutrition',
  'Legal': 'Legal',
  'VC &amp; Startups': 'Vc Startups',
  'VC & Startups': 'Vc Startups',
  'Travel': 'Travel',
  'Logistics &amp; Delivery': 'Logistics Delivery',
  'Logistics & Delivery': 'Logistics Delivery',
  'Psychology': 'Psychology',
  'Design &amp; Creative': 'Design Creative',
  'Design & Creative': 'Design Creative',
  'Immigration': 'Immigration',
  'Hardware': 'Hardware',
  'Dating &amp; Community': 'Dating Community',
  'Dating & Community': 'Dating Community',
  'SEO &amp; GEO': 'Seo Geo',
  'SEO & GEO': 'Seo Geo',
  'AgTech': 'Agtech',
  'No-Code': 'No Code',
  'Other': 'Other',
};

function decodeHtml(str) {
  return str.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&quot;/g, '"');
}

async function fetchProblems() {
  console.log('Fetching problems from Tilda feed API...');
  const url = `${FEED_URL}?feeduid=${FEED_UID}&recid=${FEED_RECID}&size=${PAGE_SIZE}&slice=1`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'FlyLabs-Sync/1.0 (https://flylabs.fun)' },
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }

  const data = await res.json();

  if (data.error) {
    throw new Error(`API error: ${data.error}`);
  }

  const posts = data.posts || [];
  console.log(`Fetched ${posts.length} of ${data.total} problems`);

  return posts.map((post) => {
    // Extract primary category (first non-Other part, or first part)
    const parts = (post.postparts || []).map((p) => p.parttitle);
    const primaryPart = parts.find((p) => CATEGORY_MAP[p] && CATEGORY_MAP[p] !== 'Other') || parts[0] || '';
    const industry = CATEGORY_MAP[primaryPart] || 'Other';
    const tags = parts.map((p) => decodeHtml(p)).join(',');

    return {
      idea_title: decodeHtml(post.title || ''),
      idea_description: null,
      category: 'Tool',
      industry,
      source: 'problemhunt',
      source_url: post.url || null,
      external_id: `problemhunt-${post.uid}`,
      tags,
      country: decodeHtml(post.descr || ''),
      published_at: post.date ? new Date(post.date.split(' ')[0]).toISOString() : null,
      approved: true,
      name: 'ProblemHunt',
      email: null,
    };
  });
}

async function syncToSupabase(problems) {
  // Upsert in batches of 50 (updates existing, inserts new)
  const BATCH_SIZE = 50;
  let upserted = 0;
  let failed = 0;

  for (let i = 0; i < problems.length; i += BATCH_SIZE) {
    const batch = problems.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from('ideas')
      .upsert(batch, { onConflict: 'external_id' });

    if (error) {
      console.error(`Batch error:`, error.message);
      failed += batch.length;
    } else {
      upserted += batch.length;
    }
  }

  console.log(`Upserted ${upserted}, failed ${failed}`);
  return upserted;
}

async function main() {
  try {
    const problems = await fetchProblems();
    if (problems.length === 0) {
      console.log('No problems returned from API.');
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
