import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { resolve, dirname } from 'path';
config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../apps/web/.env') });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PRODUCTHUNT_API_KEY = process.env.PRODUCTHUNT_API_KEY;
const PRODUCTHUNT_API_SECRET = process.env.PRODUCTHUNT_API_SECRET;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
if (!PRODUCTHUNT_API_KEY || !PRODUCTHUNT_API_SECRET) {
  console.error('Missing env vars: PRODUCTHUNT_API_KEY, PRODUCTHUNT_API_SECRET');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

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

function transformPost(post) {
  const topics = post.topics?.edges?.map((e) => e.node) || [];
  const topicSlugs = topics.map((t) => t.slug);
  const topicNames = topics.map((t) => t.name);

  // Find first matching industry from topic slugs
  let industry = 'Other';
  for (const slug of topicSlugs) {
    if (TOPIC_MAP[slug]) {
      industry = TOPIC_MAP[slug];
      break;
    }
  }

  return {
    idea_title: `${post.name} - ${post.tagline}`.slice(0, 200),
    idea_description: post.description?.slice(0, 2000) || null,
    category: 'Tool',
    industry,
    source: 'producthunt',
    source_url: post.url,
    external_id: `producthunt-${post.id}`,
    tags: topicNames.join(','),
    country: null,
    created_at: post.createdAt,
    approved: true,
    name: 'Product Hunt',
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
    console.log('Fetching Product Hunt access token...');
    const accessToken = await getAccessToken();

    console.log('Fetching top posts from Product Hunt...');
    const posts = await fetchPosts(accessToken);
    console.log(`Fetched ${posts.length} posts`);

    if (posts.length === 0) {
      console.log('No posts found. Done.');
      return;
    }

    const ideas = posts.map(transformPost);
    console.log(`Transformed ${ideas.length} ideas`);

    await syncToSupabase(ideas);
    console.log('Sync complete.');
  } catch (err) {
    console.error('Sync failed:', err.message);
    process.exit(1);
  }
}

main();
