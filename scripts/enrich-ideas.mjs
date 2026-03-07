import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { resolve, dirname } from 'path';
config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../apps/web/.env') });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const MAX_IDEAS_PER_RUN = 10;
const MAX_RETRIES = 2;
const REDDIT_DELAY = 2000;
const USER_AGENT = 'FlyLabs-Sync/1.0 (https://flylabs.fun) Node.js';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !ANTHROPIC_API_KEY) {
  console.error('Missing env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
const enrichAll = process.argv.includes('--all');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateSearchQueries(idea) {
  const userPrompt = [
    `Idea: ${idea.idea_title}`,
    idea.idea_description ? `Description: ${idea.idea_description}` : null,
    idea.industry ? `Industry: ${idea.industry}` : null,
  ].filter(Boolean).join('\n');

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    system: `You are a market researcher. Generate Reddit search queries to find real users experiencing this problem. Focus on frustration and unmet needs.

Return ONLY this JSON (no markdown, no code fences):
{
  "queries": ["query 1", "query 2", "query 3"],
  "subreddits": ["sub1", "sub2", "sub3", "sub4", "sub5"]
}`,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const text = response.content[0].text.trim();
  return JSON.parse(text);
}

async function searchReddit(subreddit, query) {
  const url = `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(query)}&restrict_sr=on&sort=relevance&t=year&limit=10`;

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
    });

    if (!res.ok) {
      if (res.status === 429) {
        console.warn(`  Rate limited on r/${subreddit}, skipping...`);
        return [];
      }
      return [];
    }

    const data = await res.json();
    const children = data?.data?.children || [];

    return children
      .filter((c) => c.data && c.data.is_self && c.data.selftext && c.data.selftext !== '[deleted]')
      .map((c) => ({
        title: c.data.title,
        selftext: c.data.selftext.slice(0, 500),
        score: c.data.score || 0,
        subreddit: c.data.subreddit,
        num_comments: c.data.num_comments || 0,
        permalink: c.data.permalink,
      }));
  } catch {
    return [];
  }
}

async function fetchRedditPosts(searchPlan) {
  const allPosts = new Map();

  for (const sub of searchPlan.subreddits) {
    for (const query of searchPlan.queries) {
      const posts = await searchReddit(sub, query);
      for (const post of posts) {
        const key = post.permalink;
        if (!allPosts.has(key) || post.score > allPosts.get(key).score) {
          allPosts.set(key, post);
        }
      }
      await sleep(REDDIT_DELAY);
    }
  }

  // Return top 10 by score
  return Array.from(allPosts.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}

async function analyzeEvidence(idea, redditPosts) {
  const postsText = redditPosts.map((p) =>
    `r/${p.subreddit} (${p.score} upvotes, ${p.num_comments} comments): ${p.title}\n${p.selftext}`
  ).join('\n\n');

  const userPrompt = [
    `Idea: ${idea.idea_title}`,
    idea.idea_description ? `Description: ${idea.idea_description}` : null,
    idea.industry ? `Industry: ${idea.industry}` : null,
    '',
    'Reddit posts discussing this problem:',
    postsText || '(No relevant posts found)',
  ].filter((l) => l !== null).join('\n');

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1500,
    system: `You are a market researcher validating a business idea against real evidence.

Return ONLY this JSON (no markdown, no code fences):
{
  "validation": {
    "strength": <0-100>,
    "evidence_summary": "2-3 sentence summary of what Reddit shows",
    "frustration_language": ["exact phrase 1", "exact phrase 2"],
    "communities": [
      { "subreddit": "r/...", "relevance": "high|medium|low", "post_count": <n> }
    ],
    "recurring_themes": ["theme 1", "theme 2", "theme 3"],
    "unmet_needs": ["what people want 1", "what people want 2"]
  },
  "competitors": {
    "products": [
      {
        "name": "...",
        "pricing": "Free / $X/mo Pro",
        "positioning": "one-line description",
        "top_complaints": ["complaint 1", "complaint 2", "complaint 3"],
        "gap": "what they miss"
      }
    ],
    "market_gap": "what's underserved",
    "pricing_opportunity": "where to price competitively",
    "differentiation_angle": "how a new entrant wins"
  },
  "summary": "one-paragraph validation verdict for a solo builder"
}`,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const text = response.content[0].text.trim();
  return JSON.parse(text);
}

async function enrichIdea(idea) {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Step 1: Generate search queries
      process.stdout.write('  Generating search queries... ');
      const searchPlan = await generateSearchQueries(idea);
      console.log(`${searchPlan.queries.length} queries, ${searchPlan.subreddits.length} subreddits`);

      // Step 2: Search Reddit
      process.stdout.write('  Searching Reddit... ');
      const redditPosts = await fetchRedditPosts(searchPlan);
      console.log(`${redditPosts.length} relevant posts found`);

      // Step 3: Analyze evidence + competitive research
      process.stdout.write('  Analyzing evidence... ');
      const analysis = await analyzeEvidence(idea, redditPosts);
      console.log(`Validation: ${analysis.validation?.strength || 0}/100`);

      return analysis;
    } catch (err) {
      if (attempt < MAX_RETRIES) {
        console.warn(`  Retry ${attempt + 1}: ${err.message}`);
        await sleep(2000);
      } else {
        console.error(`  Failed after ${MAX_RETRIES + 1} attempts: ${err.message}`);
        return null;
      }
    }
  }
}

async function main() {
  // Fetch promising, unvalidated ideas
  let query = supabase.from('ideas').select('*')
    .eq('approved', true)
    .not('hormozi_score', 'is', null);
  if (!enrichAll) {
    query = query.is('enrichment', null);
  }
  query = query.limit(MAX_IDEAS_PER_RUN);

  const { data: ideas, error } = await query;
  if (error) {
    console.error('Failed to fetch ideas:', error.message);
    process.exit(1);
  }

  // Filter: average of available scores >= 50
  const eligible = ideas.filter((idea) => {
    const scores = [idea.hormozi_score, idea.koe_score, idea.okamoto_score].filter((s) => s != null);
    if (scores.length === 0) return false;
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    return avg >= 50;
  });

  console.log(`Found ${ideas.length} ideas, ${eligible.length} eligible for enrichment${enrichAll ? ' (--all mode)' : ''}`);
  if (eligible.length === 0) return;

  let enriched = 0;
  let failed = 0;

  for (const idea of eligible) {
    console.log(`\nEnriching: "${idea.idea_title}"`);
    const result = await enrichIdea(idea);

    if (result) {
      const validationScore = result.validation?.strength || 0;
      const { error: updateErr } = await supabase
        .from('ideas')
        .update({
          enrichment: result,
          validation_score: validationScore,
        })
        .eq('id', idea.id);

      if (updateErr) {
        console.log('  DB error:', updateErr.message);
        failed++;
      } else {
        console.log(`  Saved. V:${validationScore}`);
        enriched++;
      }
    } else {
      failed++;
    }
  }

  console.log(`\nDone. Enriched: ${enriched}, Failed: ${failed}`);
}

main();
