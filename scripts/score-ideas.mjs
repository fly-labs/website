import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { resolve, dirname } from 'path';
config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../apps/web/.env') });

// ── Environment ──

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const XAI_API_KEY = process.env.XAI_API_KEY;
const REDDIT_CLIENT_ID = process.env.REDDIT_CLIENT_ID;
const REDDIT_CLIENT_SECRET = process.env.REDDIT_CLIENT_SECRET;

const BATCH_SIZE = 5;
const BATCH_DELAY_MS = 1500;
const MAX_RETRIES = 2;
const USER_AGENT = 'FlyLabs-Sync/1.0 (https://flylabs.fun) Node.js';

// ── CLI flags ──

const scoreAll = process.argv.includes('--all');
const skipReddit = process.argv.includes('--skip-reddit');
const skipResearch = process.argv.includes('--skip-research');
const skipWeb = process.argv.includes('--skip-web');
const useGrok = process.argv.includes('--grok');
const fillResearch = process.argv.includes('--fill-research');
const backfill = process.argv.includes('--backfill');
const useAnthropic = process.argv.includes('--anthropic');

const MAX_IDEAS_PER_RUN = backfill ? 500 : scoreAll ? 200 : 25;
const THINKING_BUDGET = backfill ? 1024 : 2048;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

if (!useAnthropic && !GEMINI_API_KEY) {
  console.error('Missing GEMINI_API_KEY (or use --anthropic flag for Claude fallback)');
  process.exit(1);
}

// Note: Grok x_search is reserved for sourcing (sync-x.mjs), not research.
// Research uses Google Search + Reddit. Use --grok flag to add Grok research (costs ~$0.10/idea).

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const ai = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ════════════════════════════════════════════
// PHASE 1: RESEARCH (Grok x_search + Reddit)
// ════════════════════════════════════════════

let redditToken = null;
let redditTokenExpiry = 0;

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
      redditTokenExpiry = Date.now() + (data.expires_in || 3600) * 1000 - 60000;
      return data.access_token;
    }
    return null;
  } catch {
    return null;
  }
}

async function ensureRedditToken() {
  if (redditToken && Date.now() < redditTokenExpiry) return;
  if (REDDIT_CLIENT_ID && REDDIT_CLIENT_SECRET) {
    redditToken = await getRedditToken();
  }
}

async function searchReddit(query, subreddit) {
  await ensureRedditToken();
  const baseUrl = redditToken ? 'https://oauth.reddit.com' : 'https://www.reddit.com';
  const headers = redditToken
    ? { 'Authorization': `Bearer ${redditToken}`, 'User-Agent': USER_AGENT }
    : { 'User-Agent': USER_AGENT };

  const url = `${baseUrl}/r/${subreddit}/search.json?q=${encodeURIComponent(query)}&restrict_sr=on&sort=relevance&t=year&limit=5`;

  try {
    const res = await fetch(url, { headers });
    if (!res.ok) return [];
    const data = await res.json();
    return (data?.data?.children || [])
      .filter((c) => c.data?.is_self && c.data.selftext && c.data.selftext !== '[deleted]')
      .map((c) => ({
        title: c.data.title,
        subreddit: c.data.subreddit,
        upvotes: c.data.score || 0,
        comments: c.data.num_comments || 0,
      }));
  } catch {
    return [];
  }
}

function generateSearchQueries(idea) {
  // Simple keyword heuristic (no API call needed)
  const title = idea.idea_title.toLowerCase();
  const words = title.replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 3);
  const queries = [
    words.slice(0, 4).join(' '),
    words.length > 2 ? `${words[0]} ${words[words.length - 1]} tool` : `${title} problem`,
  ].filter(Boolean);

  // Pick subreddits based on industry or general
  const industrySubreddits = {
    'Developer Tools': ['webdev', 'SaaS', 'selfhosted'],
    'AI ML': ['artificial', 'MachineLearning', 'LocalLLaMA'],
    'Marketing Sales': ['marketing', 'Entrepreneur', 'SaaS'],
    'Finance': ['fintech', 'personalfinance', 'Entrepreneur'],
    'E-Commerce': ['ecommerce', 'Entrepreneur', 'smallbusiness'],
    'Education': ['edtech', 'learnprogramming', 'Entrepreneur'],
    'Productivity': ['productivity', 'SaaS', 'Entrepreneur'],
    'Health Fitness': ['HealthIT', 'Entrepreneur', 'SaaS'],
  };
  const subreddits = industrySubreddits[idea.industry] || ['SaaS', 'Entrepreneur', 'smallbusiness'];

  return { queries, subreddits };
}

async function grokEvidenceSearch(idea) {
  if (!XAI_API_KEY) return null;

  try {
    const response = await fetch('https://api.x.ai/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${XAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'grok-4-1-fast',
        tools: [{ type: 'x_search' }],
        input: `Search X/Twitter for real people experiencing this problem: "${idea.idea_title}"${idea.idea_description ? `. Context: ${idea.idea_description.slice(0, 200)}` : ''}

Find tweets showing frustration with current solutions, willingness to pay, workarounds, complaints about existing tools. Also search in Portuguese.

Return a JSON object:
{
  "highlights": [{ "text": "tweet quote", "author": "@handle", "engagement": 14, "sentiment": "frustration" }],
  "total_found": integer,
  "search_queries": ["query1", "query2"]
}`,
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'evidence_search',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                highlights: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      text: { type: 'string' },
                      author: { type: 'string' },
                      engagement: { type: 'integer' },
                      sentiment: { type: 'string', enum: ['frustration', 'need', 'complaint', 'workaround', 'wishlist'] },
                    },
                    required: ['text', 'author', 'engagement', 'sentiment'],
                    additionalProperties: false,
                  },
                },
                total_found: { type: 'integer' },
                search_queries: { type: 'array', items: { type: 'string' } },
              },
              required: ['highlights', 'total_found', 'search_queries'],
              additionalProperties: false,
            },
          },
        },
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const messageItem = data.output?.find((item) => item.type === 'message');
    const textContent = messageItem?.content?.find((c) => c.type === 'output_text' || c.type === 'text');
    if (!textContent?.text) return null;

    let text = textContent.text.trim();
    if (text.startsWith('```')) {
      text = text.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
    }
    try {
      return JSON.parse(text);
    } catch {
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}');
      if (jsonStart >= 0 && jsonEnd > jsonStart) {
        try { return JSON.parse(text.slice(jsonStart, jsonEnd + 1)); } catch { /* fall through */ }
      }
      return null;
    }
  } catch (err) {
    console.warn(`  X evidence error: ${err.message}`);
    return null;
  }
}

async function grokCompetitorSearch(idea) {
  if (!XAI_API_KEY) return null;

  try {
    const response = await fetch('https://api.x.ai/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${XAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'grok-4-1-fast',
        tools: [{ type: 'x_search' }],
        input: `Find all existing tools, products, and startups that solve this problem: "${idea.idea_title}"${idea.idea_description ? `. Context: ${idea.idea_description.slice(0, 200)}` : ''}

Search for named products, funding status, Big Tech presence, pricing, complaints about them.

Return a JSON object:
{
  "competitors": [{ "name": "string", "description": "what they do", "pricing": "$X/mo or free or unknown", "funded": true/false, "funding_detail": "e.g. Series A, $20M", "complaints": ["complaint 1"] }],
  "competitor_count": integer,
  "has_funded_players": true/false,
  "has_big_tech": true/false,
  "market_maturity": "nascent|emerging|growing|mature|saturated",
  "pricing_signals": ["$9-15/mo range"],
  "feature_gaps": ["what users want but don't have"]
}`,
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'competitor_search',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                competitors: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      description: { type: 'string' },
                      pricing: { type: 'string' },
                      funded: { type: 'boolean' },
                      funding_detail: { type: 'string' },
                      complaints: { type: 'array', items: { type: 'string' } },
                    },
                    required: ['name', 'description', 'pricing', 'funded', 'funding_detail', 'complaints'],
                    additionalProperties: false,
                  },
                },
                competitor_count: { type: 'integer' },
                has_funded_players: { type: 'boolean' },
                has_big_tech: { type: 'boolean' },
                market_maturity: { type: 'string', enum: ['nascent', 'emerging', 'growing', 'mature', 'saturated'] },
                pricing_signals: { type: 'array', items: { type: 'string' } },
                feature_gaps: { type: 'array', items: { type: 'string' } },
              },
              required: ['competitors', 'competitor_count', 'has_funded_players', 'has_big_tech', 'market_maturity', 'pricing_signals', 'feature_gaps'],
              additionalProperties: false,
            },
          },
        },
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const messageItem = data.output?.find((item) => item.type === 'message');
    const textContent = messageItem?.content?.find((c) => c.type === 'output_text' || c.type === 'text');
    if (!textContent?.text) return null;

    let text = textContent.text.trim();
    if (text.startsWith('```')) {
      text = text.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
    }
    try {
      return JSON.parse(text);
    } catch {
      // Grok sometimes returns slightly malformed JSON - try to salvage
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}');
      if (jsonStart >= 0 && jsonEnd > jsonStart) {
        try {
          return JSON.parse(text.slice(jsonStart, jsonEnd + 1));
        } catch { /* fall through */ }
      }
      return null;
    }
  } catch (err) {
    console.warn(`  X competitor error: ${err.message}`);
    return null;
  }
}

async function geminiWebSearch(idea) {
  if (!ai || skipWeb) return null;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Research this business problem thoroughly: "${idea.idea_title}"${idea.idea_description ? `. Context: ${idea.idea_description.slice(0, 200)}` : ''}${idea.industry ? `. Industry: ${idea.industry}` : ''}.

Search for:
1. COMPETITORS: Every tool, startup, and product solving this problem. Include name, URL, what they do, pricing (actual numbers from pricing pages), funding status (check Crunchbase, TechCrunch), and key weakness
2. MARKET SIZE: Is this a niche, growing, or large market? Any recent funding rounds in this space?
3. PRODUCT HUNT: How many similar products launched on Product Hunt?
4. NEWS: Recent articles, blog posts, or announcements about this problem space
5. PRICING LANDSCAPE: What do existing solutions charge? Free tier? Enterprise pricing?
6. COMPLAINTS: Search for "[competitor name] alternative" and "[competitor name] vs" to find real user frustrations

Return ONLY a JSON object (no markdown, no explanation):
{
  "competitors": [{ "name": "string", "url": "string", "description": "what they do in 1 sentence", "pricing": "actual pricing from their site", "funded": true/false, "funding_detail": "Series X, $Nm or bootstrapped", "weakness": "main user complaint or gap" }],
  "product_hunt_launches": integer,
  "recent_news": [{ "title": "string", "source": "string", "date": "string" }],
  "market_signals": "2-3 sentence market overview: size, growth direction, key trends",
  "pricing_landscape": "what the market charges, free vs paid, price ranges",
  "user_frustrations": ["real complaints found via 'alternative' and 'vs' searches"]
}`,
      config: {
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    let text = response.text.trim();
    // Strip markdown code fences if present
    if (text.startsWith('```')) {
      text = text.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
    }
    const jsonStart = text.indexOf('{');
    if (jsonStart > 0) text = text.slice(jsonStart);
    const lastBrace = text.lastIndexOf('}');
    if (lastBrace > 0 && lastBrace < text.length - 1) text = text.slice(0, lastBrace + 1);
    return JSON.parse(text);
  } catch (err) {
    console.warn(`  Web search error: ${err.message}`);
    return null;
  }
}

async function researchIdea(idea) {
  // Default: Google Search + Reddit (cheap, effective)
  // --grok flag adds Grok x_search (expensive, adds tweet sentiment)
  const searchPlan = generateSearchQueries(idea);
  const redditDelay = redditToken ? 500 : 3000;

  const researchPromises = [
    geminiWebSearch(idea),
    ...(useGrok && XAI_API_KEY ? [grokEvidenceSearch(idea), grokCompetitorSearch(idea)] : []),
    ...(!skipReddit ? searchPlan.subreddits.slice(0, 2).map(async (sub, i) => {
      if (i > 0) await sleep(redditDelay);
      return searchReddit(searchPlan.queries[0], sub);
    }) : []),
  ];

  let webSearch, xEvidence, xCompetitors;
  if (useGrok && XAI_API_KEY) {
    const [web, xEv, xComp, ...redditRaw] = await Promise.all(researchPromises);
    webSearch = web; xEvidence = xEv; xCompetitors = xComp;
    var redditResults = redditRaw;
  } else {
    const [web, ...redditRaw] = await Promise.all(researchPromises);
    webSearch = web; xEvidence = null; xCompetitors = null;
    var redditResults = redditRaw;
  }

  // Flatten and deduplicate Reddit results
  const allRedditPosts = new Map();
  for (const posts of redditResults) {
    for (const post of (posts || [])) {
      const key = `${post.subreddit}:${post.title}`;
      if (!allRedditPosts.has(key) || post.upvotes > allRedditPosts.get(key).upvotes) {
        allRedditPosts.set(key, post);
      }
    }
  }
  const redditHighlights = Array.from(allRedditPosts.values())
    .sort((a, b) => b.upvotes - a.upvotes)
    .slice(0, 8);
  const redditSubreddits = [...new Set(redditHighlights.map(p => `r/${p.subreddit}`))];

  // Build competitor list: web search is primary, Grok adds if available
  const webCompetitors = (webSearch?.competitors || []).map(wc => ({
    name: wc.name,
    description: wc.description,
    pricing: wc.pricing || 'unknown',
    funded: wc.funded || false,
    funding_detail: wc.funding_detail || 'unknown',
    complaints: [],
    url: wc.url,
  }));

  let mergedCompetitors = [...webCompetitors];
  const seenNames = new Set(mergedCompetitors.map(c => c.name.toLowerCase()));

  // Merge Grok competitors if available (dedup by name)
  if (xCompetitors?.competitors?.length > 0) {
    for (const gc of xCompetitors.competitors) {
      if (!seenNames.has(gc.name.toLowerCase())) {
        mergedCompetitors.push(gc);
        seenNames.add(gc.name.toLowerCase());
      }
    }
  }

  const hasFunded = mergedCompetitors.some(c => c.funded) || xCompetitors?.has_funded_players || false;

  // Preserve existing x_evidence if we didn't run Grok this time
  const existingXEvidence = idea.meta?.research?.x_evidence;

  return {
    x_evidence: xEvidence ? {
      total_found: xEvidence.total_found || 0,
      search_queries: xEvidence.search_queries || [],
      highlights: (xEvidence.highlights || []).slice(0, 10),
    } : (existingXEvidence?.total_found > 0 ? existingXEvidence : { total_found: 0, search_queries: [], highlights: [] }),
    x_competitors: {
      competitors: mergedCompetitors.slice(0, 12),
      competitor_count: mergedCompetitors.length,
      has_funded_players: hasFunded,
      has_big_tech: xCompetitors?.has_big_tech || false,
      market_maturity: xCompetitors?.market_maturity || (webSearch?.market_signals?.includes('mature') ? 'mature' : 'emerging'),
      pricing_signals: xCompetitors?.pricing_signals || [],
      feature_gaps: xCompetitors?.feature_gaps || [],
    },
    reddit: {
      total_found: redditHighlights.length,
      subreddits: redditSubreddits,
      highlights: redditHighlights,
    },
    web: webSearch ? {
      competitors_found: webSearch.competitors?.length || 0,
      product_hunt_launches: webSearch.product_hunt_launches || 0,
      recent_news: (webSearch.recent_news || []).slice(0, 5),
      market_signals: webSearch.market_signals || '',
      pricing_landscape: webSearch.pricing_landscape || '',
      user_frustrations: (webSearch.user_frustrations || []).slice(0, 5),
      searched_at: new Date().toISOString(),
    } : null,
    searched_at: new Date().toISOString(),
  };
}

// ════════════════════════════════════════════
// PHASE 2: SCORING (Gemini 2.5 Flash)
// ════════════════════════════════════════════

const SYSTEM_PROMPT = `You score business ideas for solo builders. You have real research data about this idea (Google Search competitor intelligence, Reddit community evidence, and sometimes X/Twitter sentiment). Use it. Competitor pricing, user frustrations, and market signals are especially valuable for scoring Pillar 2 (Solution Gap) and Pillar 3 (Willingness to Pay).

**FLY LABS METHOD (0-100)** - The primary score. Would a solo builder's weekend be well spent?

1. IS THE PAIN REAL? (30 points)
   - Do people talk about this problem online? (0-10) Hidden or suppressed problems score low.
   - Is it specific enough to build for? (0-10) "Communication is hard" = 2. "Remote teams waste 30 min/day switching between chat and PM tools" = 9.
   - How bad is it? (0-10) Daily frustration = 8-10. Mild annual annoyance = 1-3.

2. IS THERE A GAP? (25 points)
   Competition proves demand but heavily competed spaces are harder to win. Score based on whether a specific UNSERVED user exists with evidence, not whether an angle could theoretically exist.
   - How well do current tools solve this? (0-7) Well-funded tools solving it well = 0-2. Mediocre or overpriced for a SPECIFIC nameable audience = 5-7.
   - Are there specific complaints you could fix? (0-7) "It's expensive" = 2. "Zapier breaks on webhook timeouts with no retry" = 6.
   - Is there a narrow angle nobody took? (0-7) "Better UI" = 1. "Built for Notion freelancers who bill hourly" = 6. Hypothetical angles without evidence of demand score 1-3.
   - How strong are the incumbents? (0-4) No funded competitors = 4. A few small tools = 3. Multiple startups with funding = 1-2. Unicorns or Big Tech = 0.

3. WOULD SOMEONE PAY? (25 points)
   - Is the pain bad enough to switch tools? (0-10) People hate switching. The pain must overcome that.
   - Any signals people would pay? (0-8) Pricing discussions, complaints about free tools, time spent on workarounds.
   - Is this urgent or "maybe someday"? (0-7) Growing problems and things getting worse score higher.

4. CAN YOU BUILD IT? (20 points)
   - Can one person with AI tools ship an MVP? (0-8)
   - Can you ship something useful in weeks, not months? (0-7)
   - Does building this help your next project too? (0-5)

**EXPERT SECOND OPINIONS (0-100 each)** - Four lenses that catch what the main score might miss.

Hormozi lens: Would this make money? Score on market pain + purchasing power + targeting (20pts), dream outcome + believability + speed to result + low effort (25pts), market growth + timing (15pts), moat + offer stacking + pricing power (20pts), build complexity + go-to-market + resources (20pts).

Koe lens: Can one person run this? Score on problem clarity (25pts), creator fit (20pts), audience reach (15pts), simplicity (15pts), monetization (15pts), unique angle (5pts), leverage (5pts).

Okamoto lens: Is this a viable micro-SaaS? Score on target audience specificity + reachability (20pts), value prop clarity + measurability (25pts), distribution channels (20pts), business model (15pts), assumption risk (10pts), validation readiness (10pts).

YC lens (how Y Combinator evaluates products): 6 questions, each 0-15 (total 0-90, normalize to 0-100).
1. Demand Reality (0-15): Would someone be upset if this disappeared?
2. Status Quo (0-15): What are users doing today to solve this badly? What does it cost them?
3. Desperate Specificity (0-15): Can you name the actual human who needs this most?
4. Narrowest Wedge (0-15): Smallest version someone pays for THIS WEEK?
5. Observation & Surprise (0-15): Evidence of real usage? What surprised people?
6. Future-Fit (0-15): In 3 years, more essential or less?

For each expert lens, provide total (0-100), summary (one line), and reasoning (1-2 sentences).

**SYNTHESIS** - Cross-reference all scores with the research data.

For competition_level: "none" (0-1 known tools), "low" (2-3 small/niche tools), "moderate" (4-5 tools, some funded), "crowded" (5+ tools with funding), "dominated" (unicorns or Big Tech present).
If competition_level is "crowded" or "dominated", the FL total should rarely exceed 65 unless the whitespace angle names a SPECIFIC unserved audience with real evidence of demand.

For market_potential: "niche" (small addressable market), "growing" (expanding market with momentum), "large" (established large market).`;

const SCORE_SCHEMA = {
  type: 'object',
  properties: {
    flylabs: {
      type: 'object',
      properties: {
        total: { type: 'integer' },
        problem_clarity: { type: 'object', properties: { score: { type: 'integer' }, max: { type: 'integer' }, existence: { type: 'integer' }, specificity: { type: 'integer' }, severity: { type: 'integer' }, reasoning: { type: 'string' } }, required: ['score', 'max', 'existence', 'specificity', 'severity', 'reasoning'] },
        solution_gap: { type: 'object', properties: { score: { type: 'integer' }, max: { type: 'integer' }, alternative_quality: { type: 'integer' }, addressable_complaints: { type: 'integer' }, whitespace: { type: 'integer' }, incumbent_strength: { type: 'integer' }, reasoning: { type: 'string' } }, required: ['score', 'max', 'alternative_quality', 'addressable_complaints', 'whitespace', 'incumbent_strength', 'reasoning'] },
        willingness: { type: 'object', properties: { score: { type: 'integer' }, max: { type: 'integer' }, switching_motivation: { type: 'integer' }, payment_signals: { type: 'integer' }, urgency: { type: 'integer' }, reasoning: { type: 'string' } }, required: ['score', 'max', 'switching_motivation', 'payment_signals', 'urgency', 'reasoning'] },
        buildability: { type: 'object', properties: { score: { type: 'integer' }, max: { type: 'integer' }, solo_feasibility: { type: 'integer' }, speed_to_market: { type: 'integer' }, compound_value: { type: 'integer' }, reasoning: { type: 'string' } }, required: ['score', 'max', 'solo_feasibility', 'speed_to_market', 'compound_value', 'reasoning'] },
        summary: { type: 'string' },
        reasoning: { type: 'string' },
      },
      required: ['total', 'problem_clarity', 'solution_gap', 'willingness', 'buildability', 'summary', 'reasoning'],
    },
    hormozi: {
      type: 'object',
      properties: {
        total: { type: 'integer' },
        market_viability: { type: 'object', properties: { score: { type: 'integer' }, max: { type: 'integer' }, reasoning: { type: 'string' } }, required: ['score', 'max', 'reasoning'] },
        value_equation: { type: 'object', properties: { score: { type: 'integer' }, max: { type: 'integer' }, reasoning: { type: 'string' } }, required: ['score', 'max', 'reasoning'] },
        market_growth: { type: 'object', properties: { score: { type: 'integer' }, max: { type: 'integer' }, reasoning: { type: 'string' } }, required: ['score', 'max', 'reasoning'] },
        differentiation: { type: 'object', properties: { score: { type: 'integer' }, max: { type: 'integer' }, reasoning: { type: 'string' } }, required: ['score', 'max', 'reasoning'] },
        feasibility: { type: 'object', properties: { score: { type: 'integer' }, max: { type: 'integer' }, reasoning: { type: 'string' } }, required: ['score', 'max', 'reasoning'] },
        summary: { type: 'string' },
        reasoning: { type: 'string' },
      },
      required: ['total', 'market_viability', 'value_equation', 'market_growth', 'differentiation', 'feasibility', 'summary', 'reasoning'],
    },
    koe: {
      type: 'object',
      properties: {
        total: { type: 'integer' },
        problem_clarity: { type: 'object', properties: { score: { type: 'integer' }, max: { type: 'integer' }, reasoning: { type: 'string' } }, required: ['score', 'max', 'reasoning'] },
        creator_fit: { type: 'object', properties: { score: { type: 'integer' }, max: { type: 'integer' }, reasoning: { type: 'string' } }, required: ['score', 'max', 'reasoning'] },
        audience_reach: { type: 'object', properties: { score: { type: 'integer' }, max: { type: 'integer' }, reasoning: { type: 'string' } }, required: ['score', 'max', 'reasoning'] },
        simplicity: { type: 'object', properties: { score: { type: 'integer' }, max: { type: 'integer' }, reasoning: { type: 'string' } }, required: ['score', 'max', 'reasoning'] },
        monetization: { type: 'object', properties: { score: { type: 'integer' }, max: { type: 'integer' }, reasoning: { type: 'string' } }, required: ['score', 'max', 'reasoning'] },
        anti_niche: { type: 'object', properties: { score: { type: 'integer' }, max: { type: 'integer' }, reasoning: { type: 'string' } }, required: ['score', 'max', 'reasoning'] },
        leverage: { type: 'object', properties: { score: { type: 'integer' }, max: { type: 'integer' }, reasoning: { type: 'string' } }, required: ['score', 'max', 'reasoning'] },
        summary: { type: 'string' },
        reasoning: { type: 'string' },
      },
      required: ['total', 'problem_clarity', 'creator_fit', 'audience_reach', 'simplicity', 'monetization', 'anti_niche', 'leverage', 'summary', 'reasoning'],
    },
    okamoto: {
      type: 'object',
      properties: {
        total: { type: 'integer' },
        target_audience: { type: 'object', properties: { score: { type: 'integer' }, max: { type: 'integer' }, reasoning: { type: 'string' } }, required: ['score', 'max', 'reasoning'] },
        value_proposition: { type: 'object', properties: { score: { type: 'integer' }, max: { type: 'integer' }, reasoning: { type: 'string' } }, required: ['score', 'max', 'reasoning'] },
        distribution_channel: { type: 'object', properties: { score: { type: 'integer' }, max: { type: 'integer' }, reasoning: { type: 'string' } }, required: ['score', 'max', 'reasoning'] },
        business_model: { type: 'object', properties: { score: { type: 'integer' }, max: { type: 'integer' }, reasoning: { type: 'string' } }, required: ['score', 'max', 'reasoning'] },
        assumption_risk: { type: 'object', properties: { score: { type: 'integer' }, max: { type: 'integer' }, reasoning: { type: 'string' } }, required: ['score', 'max', 'reasoning'] },
        validation_readiness: { type: 'object', properties: { score: { type: 'integer' }, max: { type: 'integer' }, reasoning: { type: 'string' } }, required: ['score', 'max', 'reasoning'] },
        summary: { type: 'string' },
        reasoning: { type: 'string' },
      },
      required: ['total', 'target_audience', 'value_proposition', 'distribution_channel', 'business_model', 'assumption_risk', 'validation_readiness', 'summary', 'reasoning'],
    },
    yc: {
      type: 'object',
      properties: {
        total: { type: 'integer' },
        raw_total: { type: 'integer' },
        demand_reality: { type: 'object', properties: { score: { type: 'integer' }, max: { type: 'integer' }, reasoning: { type: 'string' } }, required: ['score', 'max', 'reasoning'] },
        status_quo: { type: 'object', properties: { score: { type: 'integer' }, max: { type: 'integer' }, reasoning: { type: 'string' } }, required: ['score', 'max', 'reasoning'] },
        desperate_specificity: { type: 'object', properties: { score: { type: 'integer' }, max: { type: 'integer' }, reasoning: { type: 'string' } }, required: ['score', 'max', 'reasoning'] },
        narrowest_wedge: { type: 'object', properties: { score: { type: 'integer' }, max: { type: 'integer' }, reasoning: { type: 'string' } }, required: ['score', 'max', 'reasoning'] },
        observation_surprise: { type: 'object', properties: { score: { type: 'integer' }, max: { type: 'integer' }, reasoning: { type: 'string' } }, required: ['score', 'max', 'reasoning'] },
        future_fit: { type: 'object', properties: { score: { type: 'integer' }, max: { type: 'integer' }, reasoning: { type: 'string' } }, required: ['score', 'max', 'reasoning'] },
        summary: { type: 'string' },
        reasoning: { type: 'string' },
      },
      required: ['total', 'raw_total', 'demand_reality', 'status_quo', 'desperate_specificity', 'narrowest_wedge', 'observation_surprise', 'future_fit', 'summary', 'reasoning'],
    },
    synthesis: {
      type: 'object',
      properties: {
        verdict: { type: 'string', enum: ['BUILD', 'VALIDATE_FIRST', 'SKIP'] },
        composite_score: { type: 'integer' },
        one_liner: { type: 'string' },
        the_pain: { type: 'string' },
        the_gap: { type: 'string' },
        build_angle: { type: 'string' },
        competition_level: { type: 'string', enum: ['none', 'low', 'moderate', 'crowded', 'dominated'] },
        market_potential: { type: 'string', enum: ['niche', 'growing', 'large'] },
        strengths: { type: 'array', items: { type: 'string' } },
        risks: { type: 'array', items: { type: 'string' } },
        next_steps: { type: 'array', items: { type: 'string' } },
        reasoning: { type: 'string' },
      },
      required: ['verdict', 'composite_score', 'one_liner', 'the_pain', 'the_gap', 'build_angle', 'competition_level', 'market_potential', 'strengths', 'risks', 'next_steps', 'reasoning'],
    },
  },
  required: ['flylabs', 'hormozi', 'koe', 'okamoto', 'yc', 'synthesis'],
};

function buildUserPrompt(idea, research) {
  const parts = [
    `Idea: ${idea.idea_title}`,
    idea.idea_description ? `Description: ${idea.idea_description}` : null,
    idea.industry ? `Industry: ${idea.industry}` : null,
    idea.tags ? `Tags: ${idea.tags}` : null,
    idea.country ? `Country: ${idea.country}` : null,
  ];

  // YC Graveyard context
  if (idea.meta?.failure_analysis) {
    const fa = idea.meta.failure_analysis;
    parts.push('', '=== YC Graveyard Context ===');
    parts.push(`A YC startup (${fa.company_name || 'unknown'}, ${fa.batch || 'unknown batch'}) tried to solve this and failed.`);
    if (fa.team_size) parts.push(`Team size: ${fa.team_size}`);
    if (fa.failure_reason) parts.push(`Why it failed: ${fa.failure_reason}`);
    if (fa.what_changed) parts.push(`What changed since: ${fa.what_changed}`);
    if (fa.rebuild_angle) parts.push(`Solo builder angle: ${fa.rebuild_angle}`);
    if (fa.team_size && fa.team_size > 10) {
      parts.push(`\nWARNING: Team of ${fa.team_size}. Large teams suggest the problem may require significant engineering a solo builder cannot replicate.`);
    }
  }

  // Research data
  if (research) {
    // X Evidence
    if (research.x_evidence?.highlights?.length > 0) {
      parts.push('', '=== X/Twitter Evidence (live search) ===');
      parts.push(`${research.x_evidence.total_found} relevant tweets found.`);
      for (const h of research.x_evidence.highlights.slice(0, 8)) {
        parts.push(`  ${h.author} (${h.engagement} engagement, ${h.sentiment}): "${h.text}"`);
      }
    }

    // X Competitors
    if (research.x_competitors?.competitors?.length > 0) {
      parts.push('', '=== Competitor Intelligence (live search) ===');
      parts.push(`Market maturity: ${research.x_competitors.market_maturity}`);
      parts.push(`Competitors found: ${research.x_competitors.competitor_count}`);
      parts.push(`Funded players: ${research.x_competitors.has_funded_players ? 'YES' : 'no'}`);
      parts.push(`Big Tech presence: ${research.x_competitors.has_big_tech ? 'YES' : 'no'}`);
      for (const c of research.x_competitors.competitors.slice(0, 8)) {
        parts.push(`  - ${c.name}: ${c.description} (${c.pricing}, ${c.funding_detail})`);
        if (c.complaints?.length > 0) parts.push(`    Complaints: ${c.complaints.join('; ')}`);
      }
      if (research.x_competitors.pricing_signals?.length > 0) {
        parts.push(`Pricing signals: ${research.x_competitors.pricing_signals.join('; ')}`);
      }
      if (research.x_competitors.feature_gaps?.length > 0) {
        parts.push(`Feature gaps: ${research.x_competitors.feature_gaps.join('; ')}`);
      }
      parts.push('Use this real competitor data when scoring Pillar 2 (IS THERE A GAP?). Do NOT ignore funded competitors.');
    }

    // Reddit
    if (research.reddit?.highlights?.length > 0) {
      parts.push('', '=== Reddit Evidence ===');
      parts.push(`${research.reddit.total_found} relevant posts from ${research.reddit.subreddits.join(', ')}.`);
      for (const p of research.reddit.highlights.slice(0, 5)) {
        parts.push(`  r/${p.subreddit} (${p.upvotes} upvotes, ${p.comments} comments): ${p.title}`);
      }
    }

    // Google Search (broader web - primary competitor source)
    if (research.web) {
      if (research.web.market_signals) {
        parts.push('', '=== Market Intelligence (Google Search) ===');
        parts.push(`Market overview: ${research.web.market_signals}`);
      }
      if (research.web.pricing_landscape) {
        parts.push(`Pricing landscape: ${research.web.pricing_landscape}`);
      }
      if (research.web.product_hunt_launches > 0) {
        parts.push(`Product Hunt: ${research.web.product_hunt_launches} related launches found.`);
      }
      if (research.web.user_frustrations?.length > 0) {
        parts.push('User frustrations (from "alternative" and "vs" searches):');
        for (const f of research.web.user_frustrations.slice(0, 5)) {
          parts.push(`  - ${f}`);
        }
        parts.push('Use these real frustrations when scoring Pillar 2 (addressable_complaints) and Pillar 3 (switching_motivation).');
      }
      if (research.web.recent_news?.length > 0) {
        parts.push('Recent news in this space:');
        for (const n of research.web.recent_news.slice(0, 3)) {
          parts.push(`  ${n.title} (${n.source}, ${n.date})`);
        }
      }
    }
  }

  return parts.filter(Boolean).join('\n');
}

async function scoreWithGemini(userPrompt) {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: userPrompt,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: 'application/json',
      responseSchema: SCORE_SCHEMA,
      thinkingConfig: { thinkingBudget: THINKING_BUDGET },
    },
  });

  return JSON.parse(response.text);
}

async function scoreWithAnthropic(userPrompt) {
  // Lazy import
  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const response = await anthropic.messages.create({
    model: backfill ? 'claude-haiku-4-5-20251001' : 'claude-sonnet-4-20250514',
    max_tokens: backfill ? 6000 : 4000,
    system: SYSTEM_PROMPT + `\n\nReturn this JSON:\n${JSON.stringify(SCORE_SCHEMA, null, 2)}`,
    messages: [{ role: 'user', content: userPrompt }],
  });

  let text = response.content[0].text.trim();
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }
  const jsonStart = text.indexOf('{');
  if (jsonStart > 0) text = text.slice(jsonStart);
  const lastBrace = text.lastIndexOf('}');
  if (lastBrace > 0 && lastBrace < text.length - 1) text = text.slice(0, lastBrace + 1);
  return JSON.parse(text);
}

function applyServerSideRules(parsed, idea) {
  const clamp = (v) => Math.max(0, Math.min(100, Math.round(v)));
  parsed.flylabs.total = clamp(parsed.flylabs.total);
  parsed.hormozi.total = clamp(parsed.hormozi.total);
  parsed.koe.total = clamp(parsed.koe.total);
  parsed.okamoto.total = clamp(parsed.okamoto.total);
  parsed.yc.total = clamp(parsed.yc.total);

  const fl = parsed.flylabs.total;
  const buildability = parsed.flylabs?.buildability?.score ?? 0;

  // composite_score = flylabs_score (backward compat)
  parsed.synthesis.composite_score = fl;

  // Verdict rules: FL score only, simple and deterministic
  let verdict;
  if (fl >= 65 && buildability >= 10) {
    verdict = 'BUILD';
  } else if (fl >= 40) {
    verdict = 'VALIDATE_FIRST';
  } else {
    verdict = 'SKIP';
  }

  // YC team-size gate
  if (verdict === 'BUILD' && idea.source === 'yc') {
    const teamSize = idea.meta?.failure_analysis?.team_size;
    if (teamSize > 10 && buildability < 12) {
      console.warn(`  YC gate: team of ${teamSize}, buildability ${buildability}/20 -> VALIDATE_FIRST`);
      verdict = 'VALIDATE_FIRST';
    }
  }

  if (parsed.synthesis.verdict !== verdict) {
    console.warn(`  Verdict: AI="${parsed.synthesis.verdict}" -> computed="${verdict}" (FL:${fl} B:${buildability})`);
  }
  parsed.synthesis.verdict = verdict;

  return parsed;
}

// Compute confidence from evidence counts
function computeConfidence(research) {
  if (!research) return null;
  const xCount = research.x_evidence?.total_found || 0;
  const redditCount = research.reddit?.total_found || 0;
  const webCount = (research.web?.competitors_found || 0) + (research.web?.recent_news?.length || 0);
  const total = xCount + redditCount + webCount;
  if (total >= 10) return 'high';
  if (total >= 5) return 'medium';
  return 'low';
}

async function processIdea(idea) {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Step 1: Research (unless skipped or using existing data)
      let research = null;
      if (!skipResearch) {
        process.stdout.write('research... ');
        research = await researchIdea(idea);
        const xCount = research.x_evidence?.total_found || 0;
        const rCount = research.reddit?.total_found || 0;
        const cCount = research.x_competitors?.competitor_count || 0;
        const wCount = research.web?.competitors_found || 0;
        process.stdout.write(`G:${wCount} R:${rCount} C:${cCount}${xCount > 0 ? ' X:' + xCount : ''} `);
      } else if (idea.meta?.research) {
        research = idea.meta.research;
        process.stdout.write('(cached research) ');
      }

      // Step 2: Score
      process.stdout.write('scoring... ');
      const userPrompt = buildUserPrompt(idea, research);
      let parsed;

      if (useAnthropic) {
        parsed = await scoreWithAnthropic(userPrompt);
      } else {
        parsed = await scoreWithGemini(userPrompt);
      }

      // Validate required fields
      if (typeof parsed.flylabs?.total !== 'number' || typeof parsed.hormozi?.total !== 'number' ||
          typeof parsed.koe?.total !== 'number' || typeof parsed.okamoto?.total !== 'number' ||
          typeof parsed.yc?.total !== 'number') {
        throw new Error('Invalid score structure');
      }

      // Step 3: Apply server-side rules
      parsed = applyServerSideRules(parsed, idea);
      const confidence = computeConfidence(research);

      return { scores: parsed, research, confidence };
    } catch (err) {
      if (err.message?.includes('credit') || err.message?.includes('quota') || err.message?.includes('RESOURCE_EXHAUSTED')) {
        console.error(`\n  Credits/quota exhausted. Stopping.`);
        process.exit(1);
      }
      if (attempt < MAX_RETRIES) {
        console.warn(`\n  Retry ${attempt + 1}: ${err.message}`);
        await sleep(2000);
      } else {
        console.error(`\n  Failed after ${MAX_RETRIES + 1} attempts: ${err.message}`);
        return null;
      }
    }
  }
}

// ════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════

async function main() {
  const model = useAnthropic ? (backfill ? 'Claude Haiku' : 'Claude Sonnet') : 'Gemini 2.5 Flash';
  console.log(`Scoring with ${model}${skipResearch ? ' (no research)' : ''}${skipReddit ? ' (no Reddit)' : ''}${skipWeb ? ' (no web)' : ''}${useGrok ? ' (+Grok)' : ''}`);

  // Init Reddit OAuth
  if (!skipReddit && !skipResearch) {
    redditToken = await getRedditToken();
    if (redditToken) console.log('Reddit OAuth: authenticated (100 QPM)');
  }

  // Fetch ideas
  let ideas = [];
  let mode = '';
  if (scoreAll) {
    // Re-score everything (use sparingly)
    const { data, error } = await supabase.from('ideas').select('*').eq('approved', true).limit(MAX_IDEAS_PER_RUN);
    if (error) { console.error('Failed to fetch ideas:', error.message); process.exit(1); }
    ideas = data;
    mode = '--all';
    console.log(`WARNING: --all re-scores ALL ideas including already-researched ones.`);
  } else if (fillResearch) {
    // Score ideas that have a score but no research data (the smart backfill)
    const { data, error } = await supabase.from('ideas').select('*').eq('approved', true)
      .not('flylabs_score', 'is', null)
      .is('meta->research', null)
      .limit(MAX_IDEAS_PER_RUN);
    if (error) { console.error('Failed to fetch ideas:', error.message); process.exit(1); }
    ideas = data;
    mode = '--fill-research';
  } else {
    // Default: only unscored ideas
    const { data, error } = await supabase.from('ideas').select('*').eq('approved', true)
      .or('flylabs_score.is.null,hormozi_score.is.null,koe_score.is.null,okamoto_score.is.null,yc_score.is.null')
      .limit(MAX_IDEAS_PER_RUN);
    if (error) { console.error('Failed to fetch ideas:', error.message); process.exit(1); }
    ideas = data;
    mode = 'default (unscored)';
  }

  const costPerIdea = useAnthropic ? (backfill ? 0.005 : 0.05) : 0.003;
  console.log(`Found ${ideas.length} ideas to score (${mode}). Est cost: ~$${(ideas.length * costPerIdea).toFixed(2)}`);
  if (ideas.length === 0) return;

  let scored = 0;
  let failed = 0;

  for (let i = 0; i < ideas.length; i += BATCH_SIZE) {
    const batch = ideas.slice(i, i + BATCH_SIZE);
    console.log(`\nBatch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} ideas...`);

    for (const idea of batch) {
      process.stdout.write(`  "${idea.idea_title.slice(0, 50)}"... `);
      const result = await processIdea(idea);

      if (result) {
        // Build meta with research data
        const existingMeta = idea.meta || {};
        const newMeta = { ...existingMeta };
        if (result.research) {
          newMeta.research = result.research;
        }
        // Keep legacy data but don't actively use it
        // (competitor_scout stays if it was there)

        const { error: updateErr } = await supabase
          .from('ideas')
          .update({
            flylabs_score: result.scores.flylabs.total,
            hormozi_score: result.scores.hormozi.total,
            koe_score: result.scores.koe.total,
            okamoto_score: result.scores.okamoto.total,
            yc_score: result.scores.yc.total,
            score_breakdown: result.scores,
            verdict: result.scores.synthesis?.verdict || null,
            confidence: result.confidence,
            composite_score: result.scores.flylabs.total,
            meta: newMeta,
          })
          .eq('id', idea.id);

        if (updateErr) {
          console.log('DB error:', updateErr.message);
          failed++;
        } else {
          const s = result.scores;
          console.log(`F:${s.flylabs.total} H:${s.hormozi.total} K:${s.koe.total} B:${s.okamoto.total} Y:${s.yc.total} -> ${s.synthesis.verdict}`);
          scored++;
        }
      } else {
        failed++;
      }
    }

    // Rate limit between batches
    if (i + BATCH_SIZE < ideas.length) {
      await sleep(BATCH_DELAY_MS);
    }
  }

  console.log(`\nDone. Scored: ${scored}, Failed: ${failed}`);
  console.log(`Est cost: ~$${(scored * costPerIdea).toFixed(2)} (${model})`);
}

main();
