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

const HN_API = 'https://hacker-news.firebaseio.com/v0';
const REQUEST_DELAY = 100; // HN API has no rate limits, but be polite
const AI_BATCH_SIZE = 15;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchItem(id) {
  const res = await fetch(`${HN_API}/item/${id}.json`);
  if (!res.ok) return null;
  return res.json();
}

async function fetchStoryIds() {
  const [topRes, askRes, showRes, newRes] = await Promise.all([
    fetch(`${HN_API}/topstories.json`),
    fetch(`${HN_API}/askstories.json`),
    fetch(`${HN_API}/showstories.json`),
    fetch(`${HN_API}/newstories.json`),
  ]);

  const topIds = topRes.ok ? await topRes.json() : [];
  const askIds = askRes.ok ? await askRes.json() : [];
  const showIds = showRes.ok ? await showRes.json() : [];
  const newIds = newRes.ok ? await newRes.json() : [];

  // Merge all sources and dedup
  const combined = new Set([
    ...topIds.slice(0, 200),
    ...askIds,       // Ask HN is small (~35), take all
    ...showIds,      // Show HN is small (~35), take all
    ...newIds.slice(0, 200),
  ]);
  return Array.from(combined);
}

async function fetchStories(ids) {
  const stories = [];
  const CONCURRENCY = 10;

  for (let i = 0; i < ids.length; i += CONCURRENCY) {
    const batch = ids.slice(i, i + CONCURRENCY);
    const results = await Promise.all(batch.map(fetchItem));

    for (const item of results) {
      if (!item) continue;
      if (item.dead || item.deleted) continue;

      // Hard filters
      const isAskHN = (item.title || '').startsWith('Ask HN:');
      const isShowHN = (item.title || '').startsWith('Show HN:') || (item.title || '').startsWith('Launch HN:');
      const hasText = item.text && item.text.length >= 50;
      const score = item.score || 0;
      const comments = item.descendants || 0;
      const title = (item.title || '').toLowerCase();

      // Skip meta/off-topic patterns that never produce business ideas
      const skipPatterns = [
        'who is hiring', 'who wants to be hired', 'freelancer',
        'tell hn:', 'poll:',
      ];
      if (skipPatterns.some((p) => title.includes(p))) continue;

      // Only include self-posts where people describe problems or products.
      // Regular link stories are news articles, not opportunities.
      if (isAskHN) {
        // Ask HN: require text body + decent engagement
        if (!hasText || score < 15 || comments < 5) continue;
      } else if (isShowHN) {
        // Show/Launch HN: products that reveal market gaps
        // Don't require text body (many link to their product)
        if (score < 30 || comments < 10) continue;
      } else {
        // Regular stories: skip entirely. They're links to articles/blogs,
        // not descriptions of problems someone could build a solution for.
        continue;
      }

      stories.push(item);
    }

    if (i + CONCURRENCY < ids.length) await sleep(REQUEST_DELAY);
  }

  return stories;
}

// AI batch filter: evaluate stories for real business problems
async function aiBatchFilter(stories) {
  if (!anthropic || stories.length === 0) {
    return stories.map((s) => ({
      ...s,
      _ai: { is_real_problem: false, category: 'Tool', reason: 'AI filter skipped' },
    }));
  }

  const results = [];

  for (let i = 0; i < stories.length; i += AI_BATCH_SIZE) {
    const batch = stories.slice(i, i + AI_BATCH_SIZE);
    const storiesText = batch
      .map((s, idx) => {
        const text = s.text ? s.text.replace(/<[^>]+>/g, '').slice(0, 300) : '';
        return `[${idx}] Title: ${s.title}\n${text ? `Body: ${text}` : `URL: ${s.url || 'none'}`}`;
      })
      .join('\n\n---\n\n');

    try {
      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        system: `You are a STRICT filter for an idea lab that surfaces real business opportunities. Be very selective (reject 70%+).

For each Hacker News story, determine:
- is_real_problem (boolean): TRUE ONLY if this describes a concrete problem that someone could build a product/tool/service to solve AND people would pay for it. The problem must be specific and actionable.
- category (Tool/Template/Prompt/Article/Other): What type of solution would address this?
- reason (string): One sentence explaining your decision

REJECT (is_real_problem = false):
- News articles, blog posts, or commentary about industry trends
- Meta discussions about HN itself, AI hype, moderation, community
- Personal life advice, career advice, emotional support requests
- Opinion pieces ("Will X ruin Y?", "Can we talk about Z?")
- Bug reports or technical deep-dives with no product opportunity
- "I built X" showcases without a clear unsolved problem
- Vague complaints without a specific solvable problem
- Security vulnerabilities or CVE reports (informational, not buildable)
- Performance benchmarks or comparisons
- Philosophical or existential questions

ACCEPT only when: "A founder could read this and start building a solution this week. The problem must be FELT by a specific group, current solutions must be insufficient, and there should be signals people would act to fix it."

Return ONLY valid JSON (no markdown, no code fences):
{"results": [{"index": 0, "is_real_problem": true, "category": "Tool", "reason": "..."}, ...]}`,
        messages: [
          {
            role: 'user',
            content: `Evaluate these ${batch.length} Hacker News stories:\n\n${storiesText}`,
          },
        ],
      });

      let text = response.content[0].text.trim();
      if (text.startsWith('```')) {
        text = text.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
      }
      const parsed = JSON.parse(text);

      for (const r of parsed.results || []) {
        if (r.index >= 0 && r.index < batch.length) {
          batch[r.index]._ai = {
            is_real_problem: r.is_real_problem,
            category: r.category,
            reason: r.reason,
          };
        }
      }
    } catch (err) {
      console.warn(`  AI batch filter failed: ${err.message}. Passing batch through.`);
      for (const s of batch) {
        if (!s._ai) s._ai = { is_real_problem: false, category: 'Tool', reason: 'AI filter error' };
      }
    }

    results.push(...batch);
    if (i + AI_BATCH_SIZE < stories.length) await sleep(1000);
  }

  return results;
}

// Industry mapping based on title/text keywords
const INDUSTRY_KEYWORDS = {
  'Ai': ['ai', 'machine learning', 'llm', 'gpt', 'claude', 'openai', 'neural', 'deep learning'],
  'Dev': ['developer', 'programming', 'code', 'software', 'api', 'framework', 'library', 'devops', 'ci/cd'],
  'Finance': ['finance', 'banking', 'payment', 'invoice', 'accounting', 'fintech', 'crypto', 'trading'],
  'Productivity': ['productivity', 'workflow', 'automation', 'time management', 'task', 'project management'],
  'Marketing Sales': ['marketing', 'seo', 'sales', 'ads', 'conversion', 'landing page', 'email marketing'],
  'Education': ['education', 'learning', 'course', 'teaching', 'student', 'tutorial'],
  'Medicine Health': ['health', 'medical', 'healthcare', 'fitness', 'mental health'],
  'Business': ['business', 'startup', 'entrepreneur', 'saas', 'b2b'],
  'Design Creative': ['design', 'ui', 'ux', 'graphic', 'creative', 'figma'],
  'Ecommerce': ['ecommerce', 'e-commerce', 'shopify', 'store', 'retail'],
  'No Code': ['no-code', 'nocode', 'low-code', 'no code'],
  'Hr Career': ['hiring', 'job', 'career', 'resume', 'interview', 'remote work'],
};

function detectIndustry(story) {
  const text = `${story.title} ${story.text || ''}`.toLowerCase();
  for (const [industry, keywords] of Object.entries(INDUSTRY_KEYWORDS)) {
    for (const kw of keywords) {
      if (text.includes(kw)) return industry;
    }
  }
  return 'Other';
}

function transformStory(story) {
  const category =
    story._ai?.category &&
    ['Tool', 'Template', 'Prompt', 'Article', 'Other'].includes(story._ai.category)
      ? story._ai.category
      : 'Tool';

  // Strip HTML from text
  const description = story.text
    ? story.text.replace(/<[^>]+>/g, '').slice(0, 2000)
    : null;

  return {
    idea_title: story.title.replace(/^(?:Show|Ask|Launch|Tell)\s+HN:\s*/i, '').slice(0, 200),
    idea_description: description,
    category,
    industry: detectIndustry(story),
    source: 'hackernews',
    source_url: `https://news.ycombinator.com/item?id=${story.id}`,
    external_id: `hackernews-${story.id}`,
    tags: story.type === 'story' && story.url ? new URL(story.url).hostname : null,
    country: null,
    published_at: new Date(story.time * 1000).toISOString(),
    approved: true,
    name: story.by || 'Anonymous',
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
    console.log('Fetching Hacker News story IDs...');
    const ids = await fetchStoryIds();
    console.log(`Found ${ids.length} unique story IDs`);

    console.log('Fetching story details...');
    const stories = await fetchStories(ids);
    console.log(`${stories.length} stories passed hard filters`);

    if (stories.length === 0) {
      console.log('No stories found. Done.');
      return;
    }

    // AI batch filter
    if (anthropic) {
      console.log('Running AI quality filter...');
    }
    const aiFiltered = await aiBatchFilter(stories);
    const qualityStories = aiFiltered.filter((s) => s._ai?.is_real_problem !== false);
    const rejected = aiFiltered.length - qualityStories.length;
    if (rejected > 0) console.log(`AI filter: ${rejected} stories rejected, ${qualityStories.length} passed`);

    const ideas = qualityStories.map(transformStory);

    // Dedup by external_id
    const unique = new Map();
    for (const idea of ideas) {
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
