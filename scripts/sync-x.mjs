import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { resolve, dirname } from 'path';
config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../apps/web/.env') });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const XAI_API_KEY = process.env.XAI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
if (!XAI_API_KEY) {
  console.error('Missing env var: XAI_API_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const MAX_RETRIES = 2;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 6 search prompts, rotate 2 per daily run
const SEARCH_PROMPTS = [
  '"I wish there was" OR "why is there no" OR "someone needs to build" - find tweets expressing pain about missing tools or solutions',
  '"I would pay for" OR "shut up and take my money" OR "willing to pay" - find tweets showing willingness to pay for solutions',
  '"so frustrating" OR "hate using" OR "terrible UX" OR "why does this suck" - find tweets expressing frustration with existing tools',
  '"someone should make" OR "why hasn\'t anyone built" OR "billion dollar idea" - find tweets with builder/opportunity signals',
  '"need a tool" OR "is there an app" OR "looking for a tool" OR "any recommendations for" - find tweets where people are actively searching for solutions',
  '"manually doing" OR "waste so much time" OR "automate this" OR "repetitive task" - find tweets about automation needs and time waste',
];

const INDUSTRIES = [
  'Marketing Sales', 'Finance', 'Medicine Health', 'Business', 'Realty',
  'Productivity', 'Education', 'Hr Career', 'Ai', 'Sport Fitness',
  'Ecommerce', 'Retail', 'Freelance', 'Dev', 'Transportation',
  'Media', 'Food Nutrition', 'Legal', 'Vc Startups', 'Travel',
  'Logistics Delivery', 'Psychology', 'Design Creative', 'Immigration',
  'Hardware', 'Dating Community', 'Seo Geo', 'Agtech', 'No Code', 'Other',
];

const SYSTEM_PROMPT = `You are a business opportunity researcher. Search X/Twitter for real people expressing problems, frustrations, and unmet needs that represent business opportunities.

Evaluate each problem through these lenses:
- $100 Startup: Can someone start solving this with minimal investment?
- Company of One: Can this be profitable at small scale?
- Dan Koe: Is this a good one-person business opportunity?
- Bruno Okamoto: Is this a MicroSaaS opportunity?
- Hormozi: Is the pain severe enough that people would pay to solve it?

Only include problems that pass at least 3 of these 5 lenses. Skip tweets that are:
- Self-promotion or product launches
- Jokes or memes
- Generic complaints without actionable problems
- Already well-solved problems with dominant solutions

For each real problem found, extract the underlying pain point as a clear problem statement (not a solution description).

Map each problem to one of these industries: ${INDUSTRIES.join(', ')}

Map each to a category: Tool, Template, Prompt, Article, or Other

CRITICAL: For each problem you MUST include the real tweet URL (https://x.com/username/status/ID). Skip any problem where you cannot provide the actual tweet URL.

For each problem, also include the tweet's publication date in ISO format (YYYY-MM-DD).

Return ONLY valid JSON in this exact format:
{"problems": [{"problem_title": "...", "problem_description": "...", "industry": "...", "category": "Tool", "tweet_url": "https://x.com/user/status/123", "author_handle": "user", "engagement_signal": "...", "tweet_date": "2025-03-08"}]}`;

function getRotatedPrompts() {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  const startIndex = (dayOfYear * 2) % SEARCH_PROMPTS.length;
  return [
    SEARCH_PROMPTS[startIndex],
    SEARCH_PROMPTS[(startIndex + 1) % SEARCH_PROMPTS.length],
  ];
}

function extractTweetId(url) {
  if (!url) return null;
  // Match twitter.com or x.com status URLs
  const match = url.match(/(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/);
  return match ? match[1] : null;
}

async function searchX(prompt) {
  const inputPrompt = `${SYSTEM_PROMPT}

Search X/Twitter for: ${prompt}

Find 5-10 real problems from recent tweets.`;

  const response = await fetch('https://api.x.ai/v1/responses', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${XAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'grok-4-1-fast',
      tools: [{ type: 'x_search' }],
      input: inputPrompt,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Grok API error ${response.status}: ${text}`);
  }

  const data = await response.json();

  // Extract the message content from the response output array
  const messageItem = data.output?.find((item) => item.type === 'message');
  if (!messageItem?.content) {
    throw new Error('No message content in Grok response');
  }

  const textContent = messageItem.content.find((c) => c.type === 'output_text' || c.type === 'text');
  if (!textContent?.text) {
    throw new Error('No text content in Grok response');
  }

  let text = textContent.text.trim();
  // Strip markdown code fences if present
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }

  // Extract JSON object if there's extra text around it
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start > 0 || end < text.length - 1) {
    text = text.slice(start, end + 1);
  }

  return JSON.parse(text);
}

function transformProblem(problem) {
  if (!problem?.problem_title || !problem?.tweet_url) return null;
  const tweetId = extractTweetId(problem.tweet_url);
  if (!tweetId) return null;

  // Validate industry is in our list
  const industry = INDUSTRIES.includes(problem.industry) ? problem.industry : 'Other';
  const handle = problem.author_handle?.replace(/^@/, '') || 'unknown';

  return {
    idea_title: problem.problem_title.slice(0, 200),
    idea_description: problem.problem_description?.slice(0, 2000) || null,
    category: ['Tool', 'Template', 'Prompt', 'Article', 'Other'].includes(problem.category) ? problem.category : 'Tool',
    industry,
    source: 'x',
    source_url: problem.tweet_url,
    external_id: `x-${tweetId}`,
    tags: problem.engagement_signal || null,
    country: null,
    approved: true,
    published_at: problem.tweet_date ? new Date(problem.tweet_date).toISOString() : new Date().toISOString(),
    name: `@${handle}`,
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
    const prompts = getRotatedPrompts();
    console.log(`Running X sync with ${prompts.length} search prompts...`);

    const allIdeas = [];

    for (let i = 0; i < prompts.length; i++) {
      console.log(`\nSearch ${i + 1}: ${prompts[i].slice(0, 80)}...`);

      let result = null;
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          result = await searchX(prompts[i]);
          break;
        } catch (err) {
          if (attempt < MAX_RETRIES) {
            console.warn(`  Retry ${attempt + 1}: ${err.message}`);
            await sleep(2000 * (attempt + 1));
          } else {
            console.error(`  Failed after ${MAX_RETRIES + 1} attempts: ${err.message}`);
          }
        }
      }
      if (!result) continue;

      const problems = result.problems || [];
      console.log(`  Found ${problems.length} problems`);

      for (const problem of problems) {
        const idea = transformProblem(problem);
        if (idea) {
          allIdeas.push(idea);
        } else {
          console.warn(`  Skipped: could not extract tweet ID from "${problem.tweet_url}"`);
        }
      }
    }

    // Dedup by external_id
    const unique = new Map();
    for (const idea of allIdeas) {
      unique.set(idea.external_id, idea);
    }
    const dedupedIdeas = Array.from(unique.values());

    console.log(`\nTotal: ${dedupedIdeas.length} unique ideas`);

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
