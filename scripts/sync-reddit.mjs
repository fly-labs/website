import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { resolve, dirname } from 'path';
config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../apps/web/.env') });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const anthropic = ANTHROPIC_API_KEY ? new Anthropic({ apiKey: ANTHROPIC_API_KEY }) : null;

const USER_AGENT = 'FlyLabs-Sync/1.0 (https://flylabs.fun) Node.js';
const REDDIT_CLIENT_ID = process.env.REDDIT_CLIENT_ID;
const REDDIT_CLIENT_SECRET = process.env.REDDIT_CLIENT_SECRET;
let redditToken = null;

// OAuth: auto-upgrade to 100 QPM when credentials are available
async function getRedditToken() {
  if (!REDDIT_CLIENT_ID || !REDDIT_CLIENT_SECRET) return null;
  try {
    const res = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${REDDIT_CLIENT_ID}:${REDDIT_CLIENT_SECRET}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': USER_AGENT,
      },
      body: 'grant_type=client_credentials',
    });
    const data = await res.json();
    if (data.access_token) {
      console.log('Reddit OAuth: authenticated (100 QPM)');
      return data.access_token;
    }
    console.warn('Reddit OAuth: token exchange failed, falling back to unauthenticated');
    return null;
  } catch (err) {
    console.warn(`Reddit OAuth: ${err.message}, falling back to unauthenticated`);
    return null;
  }
}

const REQUEST_DELAY = 2000; // 2s between requests (16 subreddits x 5 queries)

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
  // Portuguese-language subreddits
  brdev: 'Dev',
  empreendedorismo: 'Business',
  O_Empreendedor: 'Business',
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
  // Portuguese queries
  '"preciso de uma ferramenta" OR "alguém conhece" OR "existe alguma"',
  '"frustração" OR "perda de tempo" OR "deveria ter" OR "problema que"',
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

  return score >= 3;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, retries = 3) {
  // Use OAuth endpoint when authenticated
  const baseUrl = redditToken
    ? url.replace('https://www.reddit.com', 'https://oauth.reddit.com')
    : url;
  const headers = redditToken
    ? { 'Authorization': `Bearer ${redditToken}`, 'User-Agent': USER_AGENT }
    : { 'User-Agent': USER_AGENT };

  for (let attempt = 1; attempt <= retries; attempt++) {
    const res = await fetch(baseUrl, { headers });

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
        if (!post.selftext || post.selftext.length < 80) continue;
        if (post.selftext === '[deleted]' || post.selftext === '[removed]') continue;
        if ((post.score || 0) < 10) continue;
        if ((post.num_comments || 0) < 3) continue;
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

// AI batch filter: evaluate posts for real business problems
async function aiBatchFilter(posts) {
  if (!anthropic || posts.length === 0) return posts.map((p) => ({ ...p, _ai: { is_real_problem: true, category: 'Tool', reason: 'AI filter skipped' } }));

  const AI_BATCH_SIZE = 15;
  const results = [];

  for (let i = 0; i < posts.length; i += AI_BATCH_SIZE) {
    const batch = posts.slice(i, i + AI_BATCH_SIZE);
    const postsText = batch.map((p, idx) => `[${idx}] Title: ${p.title}\nBody: ${p.selftext.slice(0, 300)}`).join('\n\n---\n\n');

    try {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        system: `You evaluate Reddit posts for genuine business-relevant pain points. For each post, determine:
- is_real_problem (boolean): Is this a genuine, solvable pain point? NOT: shopping threads, self-promotion, general discussion, homework, venting without a solvable problem, "I built X" posts, generic questions, advice requests
- category (Tool/Template/Prompt/Article/Other): What type of solution would address this?
- reason (string): One sentence explaining your decision

Posts may be in Portuguese. Evaluate the business problem regardless of language. Extract idea_title and idea_description in English.

Evaluate problem quality through the Fly Labs lens:
- Is the problem FELT by a specific, identifiable group? (not hidden or suppressed)
- Are current solutions genuinely insufficient? (people still struggling despite alternatives)
- Are there signals of willingness to act or pay? (explicit statements, workaround effort, switching behavior)
Reject if the problem is vague, already well-solved, or just venting without action intent.

Return ONLY valid JSON (no markdown, no code fences):
{"results": [{"index": 0, "is_real_problem": true, "category": "Tool", "reason": "..."}, ...]}`,
        messages: [{ role: 'user', content: `Evaluate these ${batch.length} Reddit posts:\n\n${postsText}` }],
      });

      let text = response.content[0].text.trim();
      if (text.startsWith('```')) {
        text = text.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
      }
      const parsed = JSON.parse(text);

      for (const r of parsed.results || []) {
        if (r.index >= 0 && r.index < batch.length) {
          batch[r.index]._ai = { is_real_problem: r.is_real_problem, category: r.category, reason: r.reason };
        }
      }
    } catch (err) {
      console.warn(`  AI batch filter failed: ${err.message}. Passing batch through.`);
      for (const p of batch) {
        if (!p._ai) p._ai = { is_real_problem: true, category: 'Tool', reason: 'AI filter error' };
      }
    }

    results.push(...batch);
    if (i + AI_BATCH_SIZE < posts.length) await sleep(1000);
  }

  return results;
}

function transformPost(post, subreddit) {
  const flair = post.link_flair_text || '';
  const industry = FLAIR_MAP[flair] || SUBREDDITS[subreddit] || 'Other';
  const tags = [subreddit, flair].filter(Boolean).join(',');

  const category = post._ai?.category && ['Tool', 'Template', 'Prompt', 'Article', 'Other'].includes(post._ai.category)
    ? post._ai.category
    : 'Tool';

  return {
    idea_title: post.title.slice(0, 200),
    idea_description: post.selftext.slice(0, 2000),
    category,
    industry,
    source: 'reddit',
    source_url: `https://reddit.com${post.permalink}`,
    external_id: `reddit-${post.id}`,
    tags,
    country: null,
    published_at: new Date(post.created_utc * 1000).toISOString(),
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
    // Attempt OAuth authentication (auto-upgrade when credentials available)
    redditToken = await getRedditToken();

    const allPosts = [];

    const subredditKeys = Object.keys(SUBREDDITS);
    for (let i = 0; i < subredditKeys.length; i++) {
      const subreddit = subredditKeys[i];
      console.log(`Fetching r/${subreddit}...`);
      const posts = await fetchSubreddit(subreddit);
      console.log(`  r/${subreddit}: ${posts.length} posts passed keyword filters`);
      for (const p of posts) p._subreddit = subreddit;
      allPosts.push(...posts);
      // Pause between subreddits to avoid rate limits
      if (i < subredditKeys.length - 1) await sleep(3000);
    }

    // Dedup posts across subreddits
    const uniquePosts = new Map();
    for (const post of allPosts) {
      if (!uniquePosts.has(post.id)) uniquePosts.set(post.id, post);
    }
    const dedupedPosts = Array.from(uniquePosts.values());
    console.log(`\n${dedupedPosts.length} unique posts passed keyword filters`);

    // AI batch filter
    if (anthropic) {
      console.log('Running AI quality filter...');
    }
    const aiFiltered = await aiBatchFilter(dedupedPosts);
    const qualityPosts = aiFiltered.filter((p) => p._ai?.is_real_problem !== false);
    const rejected = aiFiltered.length - qualityPosts.length;
    if (rejected > 0) console.log(`AI filter: ${rejected} posts rejected, ${qualityPosts.length} passed`);

    const allIdeas = qualityPosts.map((p) => transformPost(p, p._subreddit));

    // Dedup ideas by external_id
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
