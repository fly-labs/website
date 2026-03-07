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

const USER_AGENT = 'FlyLabs-Sync/1.0 (https://flylabs.fun) Node.js';
const REQUEST_DELAY = 2000; // 2s between requests (16 subreddits × 5 queries)

// Target subreddits with default industry mapping
const SUBREDDITS = {
  microsaas: 'Vc Startups',
  automation: 'Productivity',
  nocode: 'No Code',
  SaaS: 'Business',
  indiehackers: 'Vc Startups',
  SideProject: 'Dev',
  Entrepreneur: 'Business',
  smallbusiness: 'Business',
  startups: 'Vc Startups',
  freelance: 'Hr Career',
  ecommerce: 'Ecommerce',
  marketing: 'Marketing Sales',
  productivity: 'Productivity',
  webdev: 'Dev',
  digital_marketing: 'Marketing Sales',
  Bookkeeping: 'Finance',
};

// Flair text -> industry override
const FLAIR_MAP = {
  'Marketing': 'Marketing Sales',
  'Marketing & Sales': 'Marketing Sales',
  'AI': 'Ai',
  'Finance': 'Finance',
  'Education': 'Education',
  'Health': 'Medicine Health',
  'Productivity': 'Productivity',
  'Design': 'Design Creative',
  'No-Code': 'No Code',
  'Dev': 'Dev',
  'Legal': 'Legal',
  'HR': 'Hr Career',
  'Ecommerce': 'Ecommerce',
  'E-Commerce': 'Ecommerce',
  'Shopify': 'Ecommerce',
  'SEO': 'Marketing Sales',
  'Freelancing': 'Hr Career',
  'Accounting': 'Finance',
  'Bookkeeping': 'Finance',
  'Sales': 'Marketing Sales',
  'Startup': 'Vc Startups',
  'SaaS': 'Business',
};

// Search queries that target problem descriptions (not "I built" showcases)
const SEARCH_QUERIES = [
  '"need a tool" OR "looking for a tool" OR "is there a tool" OR "app for"',
  '"pain point" OR "frustrating" OR "waste time" OR "manually doing"',
  '"wish there was" OR "someone should build" OR "idea for a"',
  '"automate" OR "workflow" OR "repetitive task" OR "save time"',
  '"would pay for" OR "willing to pay" OR "need a solution"',
];

// Positive signals for business opportunity detection
const POSITIVE_SIGNALS = [
  'need', 'tool', 'automate', 'pain', 'problem', 'looking for',
  'wish', 'solution', 'workflow', 'manual', 'tedious', 'would pay',
  'frustrat', 'help me', 'struggle', 'annoying', 'time-consuming',
  'inefficient', 'better way', 'alternative to', 'how do you handle',
  'how do you manage', 'any recommendations', 'does anyone know',
];

// Negative signals (self-promotion, showcases, advice, hiring)
const NEGATIVE_SIGNALS = [
  'i built', 'i created', 'i made', 'i launched', 'i developed',
  'launched', 'check out my', 'check out our', 'feedback on my',
  'roast my', 'hiring', 'for hire', 'ama', 'meme',
  'here\'s what i learned', 'here\'s what i\'d do', 'lessons learned',
  'my journey', 'case study', 'how i got', 'revenue update',
  'mrr update', 'month update', 'i\'ve built', 'i just launched',
  'try my', 'try our', 'we just launched', 'we built',
  'open source', 'free tool', 'beta testers', 'looking for feedback',
];

function isBusinessOpportunity(post) {
  const title = post.title.toLowerCase();
  const text = `${title} ${post.selftext}`.toLowerCase();

  // Title-level rejection: showcases almost always start in the title
  const TITLE_REJECT = ['i built', 'i created', 'i made', 'i launched', 'i developed', 'i\'ve built', 'we built', 'we launched', 'just launched', 'built a'];
  for (const signal of TITLE_REJECT) {
    if (title.includes(signal)) return false;
  }

  let score = 0;

  for (const signal of POSITIVE_SIGNALS) {
    if (text.includes(signal)) score += 1;
  }
  for (const signal of NEGATIVE_SIGNALS) {
    if (text.includes(signal)) score -= 2;
  }

  return score >= 2;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
    });

    if (res.ok) return res;

    if (res.status === 429 && attempt < retries) {
      const backoff = attempt * 5000;
      console.warn(`Rate limited (429). Retrying in ${backoff / 1000}s...`);
      await sleep(backoff);
      continue;
    }

    throw new Error(`HTTP ${res.status}: ${res.statusText} for ${url}`);
  }
}

async function fetchSubreddit(subreddit) {
  const posts = new Map(); // Dedup by post ID across queries

  for (const query of SEARCH_QUERIES) {
    const url = `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(query)}&restrict_sr=on&sort=relevance&t=week&limit=25`;

    try {
      const res = await fetchWithRetry(url);
      const data = await res.json();
      const children = data?.data?.children || [];

      for (const child of children) {
        const post = child.data;
        if (!post || posts.has(post.id)) continue;

        // Layer 1: Hard filters
        if (!post.is_self) continue;
        if (!post.selftext || post.selftext.length < 30) continue;
        if (post.selftext === '[deleted]' || post.selftext === '[removed]') continue;
        if ((post.score || 0) < 5) continue;
        if (post.over_18) continue;

        // Layer 2: Business opportunity scoring
        if (!isBusinessOpportunity(post)) continue;

        posts.set(post.id, post);
      }
    } catch (err) {
      console.warn(`Failed query for r/${subreddit}: ${err.message}`);
    }

    await sleep(REQUEST_DELAY);
  }

  return Array.from(posts.values());
}

function transformPost(post, subreddit) {
  const flair = post.link_flair_text || '';
  const industry = FLAIR_MAP[flair] || SUBREDDITS[subreddit] || 'Other';
  const tags = [subreddit, flair].filter(Boolean).join(',');

  return {
    idea_title: post.title.slice(0, 200),
    idea_description: post.selftext.slice(0, 2000),
    category: 'Tool',
    industry,
    source: 'reddit',
    source_url: `https://reddit.com${post.permalink}`,
    external_id: `reddit-${post.id}`,
    tags,
    country: null,
    created_at: new Date(post.created_utc * 1000).toISOString().split('T')[0],
    approved: true,
    name: `u/${post.author}`,
    email: null,
  };
}

async function syncToSupabase(ideas) {
  const BATCH_SIZE = 50;
  let upserted = 0;
  let failed = 0;

  for (let i = 0; i < ideas.length; i += BATCH_SIZE) {
    const batch = ideas.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from('ideas')
      .upsert(batch, { onConflict: 'external_id' });

    if (error) {
      console.error('Batch error:', error.message);
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
    const allIdeas = [];

    const subredditKeys = Object.keys(SUBREDDITS);
    for (let i = 0; i < subredditKeys.length; i++) {
      const subreddit = subredditKeys[i];
      console.log(`Fetching r/${subreddit}...`);
      const posts = await fetchSubreddit(subreddit);
      const ideas = posts.map((p) => transformPost(p, subreddit));
      console.log(`  r/${subreddit}: ${posts.length} posts passed filters`);
      allIdeas.push(...ideas);
      // Pause between subreddits to avoid rate limits
      if (i < subredditKeys.length - 1) await sleep(3000);
    }

    // Dedup across subreddits (same post could appear in multiple)
    const unique = new Map();
    for (const idea of allIdeas) {
      unique.set(idea.external_id, idea);
    }
    const dedupedIdeas = Array.from(unique.values());

    console.log(`Total: ${dedupedIdeas.length} unique ideas`);

    if (dedupedIdeas.length === 0) {
      console.log('No ideas found. Done.');
      return;
    }

    await syncToSupabase(dedupedIdeas);
    console.log('Sync complete.');
  } catch (err) {
    console.error('Sync failed:', err.message);
    process.exit(1);
  }
}

main();
