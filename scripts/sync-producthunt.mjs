import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { resolve, dirname } from 'path';
config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../apps/web/.env') });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PRODUCTHUNT_API_KEY = process.env.PRODUCTHUNT_API_KEY;
const PRODUCTHUNT_API_SECRET = process.env.PRODUCTHUNT_API_SECRET;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
if (!PRODUCTHUNT_API_KEY || !PRODUCTHUNT_API_SECRET) {
  console.error('Missing env vars: PRODUCTHUNT_API_KEY, PRODUCTHUNT_API_SECRET');
  process.exit(1);
}
if (!ANTHROPIC_API_KEY) {
  console.error('Missing env var: ANTHROPIC_API_KEY (needed for problem extraction)');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

const TOPIC_MAP = {
  'artificial-intelligence': 'Ai',
  'saas': 'Business',
  'marketing': 'Marketing Sales',
  'productivity': 'Productivity',
  'developer-tools': 'Dev',
  'design-tools': 'Design Creative',
  'e-commerce': 'Ecommerce',
  'fintech': 'Finance',
  'health-fitness': 'Medicine Health',
  'education': 'Education',
  'no-code': 'No Code',
  'seo': 'Seo Geo',
  'freelance': 'Freelance',
  'social-media': 'Media',
  'travel': 'Travel',
  'real-estate': 'Realty',
  'legal': 'Legal',
  'hiring': 'Hr Career',
};

const BATCH_DELAY = 500;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getAccessToken() {
  const res = await fetch('https://api.producthunt.com/v2/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: PRODUCTHUNT_API_KEY,
      client_secret: PRODUCTHUNT_API_SECRET,
      grant_type: 'client_credentials',
    }),
  });

  if (!res.ok) {
    throw new Error(`Token exchange failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return data.access_token;
}

async function fetchPosts(accessToken) {
  const query = `
    query {
      posts(order: VOTES, first: 50) {
        totalCount
        edges {
          node {
            id
            name
            tagline
            description
            slug
            url
            website
            votesCount
            commentsCount
            createdAt
            featuredAt
            topics(first: 5) {
              edges {
                node {
                  name
                  slug
                }
              }
            }
          }
        }
      }
    }
  `;

  const res = await fetch('https://api.producthunt.com/v2/api/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ query }),
  });

  if (!res.ok) {
    throw new Error(`GraphQL request failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();

  if (data.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
  }

  return data.data.posts.edges.map((e) => e.node);
}

// Use Claude to extract the underlying problem from a product
async function extractProblem(post) {
  const input = [
    `Product: ${post.name}`,
    `Tagline: ${post.tagline}`,
    post.description ? `Description: ${post.description.slice(0, 500)}` : null,
  ].filter(Boolean).join('\n');

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system: `You extract the underlying user PROBLEM that a product solves. You are helping populate an idea board that collects real problems worth solving.

Given a Product Hunt product, return ONLY this JSON (no markdown, no code fences):
{
  "problem_title": "A clear, specific problem statement from the user's perspective (max 150 chars). Start with the pain, not the solution. Example: 'Teams waste hours manually formatting meeting notes into action items'",
  "problem_description": "2-3 sentences expanding on the problem. Who experiences it? How often? What do they currently do? What's the cost of not solving it?",
  "is_real_problem": true/false
}

A "good problem" (evaluate strictly):
- A specific target group is aware they have this problem
- Current solutions are genuinely unsatisfying
- The pain is strong enough that people would try something new

Set is_real_problem to false if:
- The product is just a new AI model, framework, or platform without a clear user pain
- The product is entertainment, social, or a game
- The problem is too vague or generic to be actionable
- It's a vitamin (nice-to-have) not a painkiller (must-have)`,
      messages: [{ role: 'user', content: input }],
    });

    let text = response.content[0].text.trim();
    if (text.startsWith('```')) {
      text = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }
    try {
      return JSON.parse(text);
    } catch {
      // Retry once: ask Haiku to fix its own JSON
      const retry = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        messages: [{ role: 'user', content: `Fix this invalid JSON and return ONLY valid JSON, nothing else:\n\n${text}` }],
      });
      let retryText = retry.content[0].text.trim();
      if (retryText.startsWith('```')) {
        retryText = retryText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }
      return JSON.parse(retryText);
    }
  } catch (err) {
    console.warn(`  Failed to extract problem from "${post.name}": ${err.message}`);
    return null;
  }
}

function getIndustry(post) {
  const topics = post.topics?.edges?.map((e) => e.node) || [];
  const topicSlugs = topics.map((t) => t.slug);
  for (const slug of topicSlugs) {
    if (TOPIC_MAP[slug]) return TOPIC_MAP[slug];
  }
  return 'Other';
}

function getTopicNames(post) {
  return (post.topics?.edges?.map((e) => e.node.name) || []).join(',');
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
    console.log('Fetching Product Hunt access token...');
    const accessToken = await getAccessToken();

    console.log('Fetching top posts from Product Hunt...');
    const posts = await fetchPosts(accessToken);
    console.log(`Fetched ${posts.length} posts`);

    if (posts.length === 0) {
      console.log('No posts found. Done.');
      return;
    }

    // Extract problems from products using Claude
    console.log('Extracting problems from products...');
    const ideas = [];

    for (const post of posts) {
      process.stdout.write(`  ${post.name}... `);
      const problem = await extractProblem(post);

      if (!problem || !problem.is_real_problem) {
        console.log('skipped (not a real problem)');
        await sleep(BATCH_DELAY);
        continue;
      }

      ideas.push({
        idea_title: problem.problem_title.slice(0, 200),
        idea_description: problem.problem_description?.slice(0, 2000) || null,
        category: 'Tool',
        industry: getIndustry(post),
        source: 'producthunt',
        source_url: post.url,
        external_id: `producthunt-${post.id}`,
        tags: getTopicNames(post),
        country: null,
        published_at: post.createdAt,
        approved: true,
        name: 'Product Hunt',
        email: null,
      });
      console.log('ok');
      await sleep(BATCH_DELAY);
    }

    console.log(`\n${ideas.length} problems extracted from ${posts.length} products`);

    if (ideas.length === 0) {
      console.log('No problems found. Done.');
      return;
    }

    await syncToSupabase(ideas);
    console.log('Sync complete.');
  } catch (err) {
    console.error('Sync failed:', err.message);
    process.exit(1);
  }
}

main();
