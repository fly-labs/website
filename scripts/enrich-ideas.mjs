import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { resolve, dirname } from 'path';
config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../apps/web/.env') });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const XAI_API_KEY = process.env.XAI_API_KEY;
const REDDIT_CLIENT_ID = process.env.REDDIT_CLIENT_ID;
const REDDIT_CLIENT_SECRET = process.env.REDDIT_CLIENT_SECRET;

const MAX_IDEAS_PER_RUN = 20;
const MAX_RETRIES = 2;
const REDDIT_DELAY = 6000; // 6s between requests (safer for unauthenticated)
const USER_AGENT = 'FlyLabs-Sync/1.0 (https://flylabs.fun) Node.js';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !ANTHROPIC_API_KEY) {
  console.error('Missing env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
const enrichAll = process.argv.includes('--all');
let redditToken = null;
let redditTokenExpiry = 0;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// --- Reddit OAuth (auto-upgrade when credentials available) ---

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
      redditTokenExpiry = Date.now() + (data.expires_in || 3600) * 1000 - 60000; // refresh 1min early
      return data.access_token;
    }
    console.warn('Reddit OAuth: token exchange failed, using unauthenticated');
    return null;
  } catch (err) {
    console.warn(`Reddit OAuth: ${err.message}, using unauthenticated`);
    return null;
  }
}

// --- Grok x_search (primary evidence source) ---

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

Find tweets showing:
- Frustration with current solutions or lack of solutions
- Willingness to pay for a fix
- Workarounds people are using
- Complaints about existing tools

Also search in Portuguese for this problem (e.g., "frustração", "preciso de", "alguém conhece").

Return a JSON object with these fields:
- evidence: array of objects with tweet_summary (string), author (string), engagement (string like "5 likes, 2 reposts"), sentiment (one of: frustration, need, complaint, workaround, wishlist)
- total_found: integer count of relevant tweets found
- search_queries_used: array of search query strings you used`,
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'evidence_search',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                evidence: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      tweet_summary: { type: 'string' },
                      author: { type: 'string' },
                      engagement: { type: 'string' },
                      sentiment: { type: 'string', enum: ['frustration', 'need', 'complaint', 'workaround', 'wishlist'] },
                    },
                    required: ['tweet_summary', 'author', 'engagement', 'sentiment'],
                    additionalProperties: false,
                  },
                },
                total_found: { type: 'integer' },
                search_queries_used: { type: 'array', items: { type: 'string' } },
              },
              required: ['evidence', 'total_found', 'search_queries_used'],
              additionalProperties: false,
            },
          },
        },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.warn(`  Grok evidence search failed: ${response.status} ${text.slice(0, 200)}`);
      return null;
    }

    const data = await response.json();
    const messageItem = data.output?.find((item) => item.type === 'message');
    const textContent = messageItem?.content?.find((c) => c.type === 'output_text' || c.type === 'text');
    if (!textContent?.text) return null;

    let text = textContent.text.trim();
    if (text.startsWith('```')) {
      text = text.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
    }
    return JSON.parse(text);
  } catch (err) {
    console.warn(`  Grok evidence search error: ${err.message}`);
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
        input: `Search X/Twitter for discussions about tools, products, and solutions related to: "${idea.idea_title}"${idea.idea_description ? `. Context: ${idea.idea_description.slice(0, 200)}` : ''}

Find tweets about:
- Existing tools/products that solve this problem
- Complaints about current solutions (pricing, UX, missing features)
- Comparisons between competing products
- Feature requests and wishlists
- Pricing discussions

Return a JSON object with these fields:
- competitors: array of objects with name (string), mentions (integer), sentiment (one of: positive, negative, mixed), key_complaint (string)
- pricing_signals: array of strings with pricing-related observations
- feature_gaps: array of strings describing what users want but don't have`,
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
                      mentions: { type: 'integer' },
                      sentiment: { type: 'string', enum: ['positive', 'negative', 'mixed'] },
                      key_complaint: { type: 'string' },
                    },
                    required: ['name', 'mentions', 'sentiment', 'key_complaint'],
                    additionalProperties: false,
                  },
                },
                pricing_signals: { type: 'array', items: { type: 'string' } },
                feature_gaps: { type: 'array', items: { type: 'string' } },
              },
              required: ['competitors', 'pricing_signals', 'feature_gaps'],
              additionalProperties: false,
            },
          },
        },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.warn(`  Grok competitor search failed: ${response.status} ${text.slice(0, 200)}`);
      return null;
    }

    const data = await response.json();
    const messageItem = data.output?.find((item) => item.type === 'message');
    const textContent = messageItem?.content?.find((c) => c.type === 'output_text' || c.type === 'text');
    if (!textContent?.text) return null;

    let text = textContent.text.trim();
    if (text.startsWith('```')) {
      text = text.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
    }
    return JSON.parse(text);
  } catch (err) {
    console.warn(`  Grok competitor search error: ${err.message}`);
    return null;
  }
}

// --- Reddit search (best-effort secondary source) ---

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

Return ONLY this JSON (no markdown, no code fences). Keep it focused - max 3 queries and 3 subreddits:
{
  "queries": ["query 1", "query 2", "query 3"],
  "subreddits": ["sub1", "sub2", "sub3"]
}`,
    messages: [{ role: 'user', content: userPrompt }],
  });

  let text = response.content[0].text.trim();
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }
  return JSON.parse(text);
}

async function ensureRedditToken() {
  if (redditToken && Date.now() < redditTokenExpiry) return;
  if (REDDIT_CLIENT_ID && REDDIT_CLIENT_SECRET) {
    redditToken = await getRedditToken();
  }
}

async function searchReddit(subreddit, query) {
  await ensureRedditToken();
  const baseUrl = redditToken ? 'https://oauth.reddit.com' : 'https://www.reddit.com';
  const headers = redditToken
    ? { 'Authorization': `Bearer ${redditToken}`, 'User-Agent': USER_AGENT }
    : { 'User-Agent': USER_AGENT };

  const url = `${baseUrl}/r/${subreddit}/search.json?q=${encodeURIComponent(query)}&restrict_sr=on&sort=relevance&t=year&limit=10`;

  try {
    const res = await fetch(url, { headers });

    if (!res.ok) {
      if (res.status === 429) {
        // Exponential backoff on rate limit
        console.warn(`  Rate limited on r/${subreddit}, backing off...`);
        await sleep(10000);
        // Retry once after backoff
        const retry = await fetch(url, { headers });
        if (!retry.ok) return [];
        const retryData = await retry.json();
        const retryChildren = retryData?.data?.children || [];
        return retryChildren
          .filter((c) => c.data && c.data.is_self && c.data.selftext && c.data.selftext !== '[deleted]')
          .map((c) => ({
            title: c.data.title,
            selftext: c.data.selftext.slice(0, 500),
            score: c.data.score || 0,
            subreddit: c.data.subreddit,
            num_comments: c.data.num_comments || 0,
            permalink: c.data.permalink,
          }));
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
  const delay = redditToken ? 1000 : REDDIT_DELAY; // Faster with OAuth

  for (const sub of searchPlan.subreddits) {
    for (const query of searchPlan.queries) {
      const posts = await searchReddit(sub, query);
      for (const post of posts) {
        const key = post.permalink;
        if (!allPosts.has(key) || post.score > allPosts.get(key).score) {
          allPosts.set(key, post);
        }
      }
      await sleep(delay);
    }
  }

  return Array.from(allPosts.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}

// --- Claude synthesis (combines X + Reddit evidence) ---

async function synthesizeEvidence(idea, xEvidence, xCompetitors, redditPosts) {
  const sections = [
    `Idea: ${idea.idea_title}`,
    idea.idea_description ? `Description: ${idea.idea_description}` : null,
    idea.industry ? `Industry: ${idea.industry}` : null,
  ].filter(Boolean);

  // X evidence section
  if (xEvidence?.evidence?.length > 0) {
    sections.push('', '=== X/Twitter Evidence ===');
    for (const e of xEvidence.evidence) {
      sections.push(`@${e.author} (${e.engagement}, ${e.sentiment}): ${e.tweet_summary}`);
    }
    sections.push(`Total relevant tweets found: ${xEvidence.total_found}`);
  } else {
    sections.push('', '=== X/Twitter Evidence ===', '(No relevant tweets found)');
  }

  // X competitor section
  if (xCompetitors?.competitors?.length > 0) {
    sections.push('', '=== X/Twitter Competitor Mentions ===');
    for (const c of xCompetitors.competitors) {
      sections.push(`${c.name} (${c.mentions} mentions, ${c.sentiment}): ${c.key_complaint}`);
    }
    if (xCompetitors.pricing_signals?.length > 0) {
      sections.push(`Pricing signals: ${xCompetitors.pricing_signals.join('; ')}`);
    }
    if (xCompetitors.feature_gaps?.length > 0) {
      sections.push(`Feature gaps: ${xCompetitors.feature_gaps.join('; ')}`);
    }
  }

  // Reddit section
  if (redditPosts?.length > 0) {
    sections.push('', '=== Reddit Evidence ===');
    for (const p of redditPosts) {
      sections.push(`r/${p.subreddit} (${p.score} upvotes, ${p.num_comments} comments): ${p.title}\n${p.selftext}`);
    }
  } else {
    sections.push('', '=== Reddit Evidence ===', '(No relevant posts found - Reddit rate limited or no matches)');
  }

  const xCount = xEvidence?.evidence?.length || 0;
  const redditCount = redditPosts?.length || 0;
  const totalEvidence = xCount + redditCount;
  const hasXEvidence = xCount > 0;
  const hasReddit = redditCount > 0;
  const sourceNote = hasXEvidence && hasReddit
    ? 'Evidence comes from both X and Reddit - weight both sources.'
    : hasXEvidence
      ? 'Evidence comes primarily from X. Reddit was limited or returned no results.'
      : hasReddit
        ? 'Evidence comes primarily from Reddit. X search was unavailable.'
        : 'Limited evidence available from both sources. Be conservative with scoring.';

  // Pass FL score + buildability for cross-referencing
  const buildabilityScore = idea.score_breakdown?.flylabs?.buildability?.score;
  const buildabilityReasoning = idea.score_breakdown?.flylabs?.buildability?.reasoning;
  const fl = idea.flylabs_score || idea.score_breakdown?.flylabs?.total;
  const scoreContext = fl != null ? `\n\n=== Fly Labs Score ===\nFL Score: ${fl}/100${idea.score_breakdown?.synthesis ? `\nScoring Verdict: ${idea.score_breakdown.synthesis.verdict}` : ''}${buildabilityScore != null ? `\nBuildability: ${buildabilityScore}/20${buildabilityScore < 10 ? ' (BELOW MINIMUM for BUILD verdict)' : ''}` : ''}${buildabilityReasoning ? `\nBuildability Reasoning: ${buildabilityReasoning}` : ''}` : '';

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    system: `You are a market researcher validating a business idea against real evidence from X/Twitter and Reddit.

${sourceNote}

Evidence volume: ${xCount} tweets from X, ${redditCount} posts from Reddit (${totalEvidence} total)

IMPORTANT: Base your analysis on ACTUAL evidence provided. If evidence is limited, reflect that in lower validation strength scores. Do not fabricate evidence or inflate scores.

When both X and Reddit have strong evidence, give a confidence boost to the validation strength (up to +10 points).

Confidence rules:
- high: 10+ pieces of evidence from 2+ sources, consistent frustration signals
- medium: 5-9 pieces of evidence, or single-source only
- low: < 5 pieces of evidence total

For the verdict, cross-reference the Fly Labs score (if provided) with the market evidence to give the most informed recommendation possible. This verdict supersedes the scoring-only verdict because it has real market evidence.
- BUILD: Strong market evidence confirms the FL score. Real people are experiencing this pain and willing to pay. FL score MUST be >= 65 for BUILD. If FL < 65, the verdict CANNOT be BUILD regardless of how strong the market evidence is. Use VALIDATE_FIRST instead. IMPORTANT: If the Fly Labs buildability score is below 10/20, the verdict CANNOT be BUILD regardless of market evidence. Strong demand for something a solo builder cannot ship is a trap, not an opportunity. Downgrade to VALIDATE_FIRST.
- VALIDATE_FIRST: Some evidence exists but gaps remain. Need more data before committing.
- SKIP: Weak or contradicting evidence. The market signal does not support the idea.

Return ONLY this JSON (no markdown, no code fences):
{
  "validation": {
    "strength": <0-100>,
    "confidence": "<high|medium|low>",
    "evidence_count": { "x_tweets": ${xCount}, "reddit_posts": ${redditCount}, "total": ${totalEvidence} },
    "evidence_summary": "2-3 sentence summary referencing real evidence from X and/or Reddit",
    "frustration_language": ["actual phrases from tweets/posts"],
    "communities": [
      { "subreddit": "r/... or X community/hashtag", "relevance": "high|medium|low", "post_count": <n> }
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
  "verdict": {
    "recommendation": "<BUILD|VALIDATE_FIRST|SKIP>",
    "reasoning": "2-3 sentences combining scoring frameworks + real market evidence",
    "confidence": "<high|medium|low>"
  },
  "summary": "one-paragraph validation verdict for a solo builder"
}`,
    messages: [{ role: 'user', content: sections.join('\n') + scoreContext }],
  });

  let text = response.content[0].text.trim();
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }
  return JSON.parse(text);
}

// --- Enrichment pipeline ---

async function enrichIdea(idea) {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Step 1: Run Grok x_search calls in parallel with Reddit search
      process.stdout.write('  Searching X + Reddit... ');

      // Generate Reddit search queries (needed before Reddit search)
      let searchPlan = null;
      try {
        searchPlan = await generateSearchQueries(idea);
        searchPlan.queries = (searchPlan.queries || []).slice(0, 3);
        searchPlan.subreddits = (searchPlan.subreddits || []).slice(0, 3);
      } catch (err) {
        console.warn(`search query generation failed: ${err.message}`);
      }

      // Run all evidence searches in parallel
      const [xEvidence, xCompetitors, redditPosts] = await Promise.all([
        grokEvidenceSearch(idea),
        grokCompetitorSearch(idea),
        searchPlan ? fetchRedditPosts(searchPlan) : Promise.resolve([]),
      ]);

      const xCount = xEvidence?.evidence?.length || 0;
      const redditCount = redditPosts?.length || 0;
      console.log(`X: ${xCount} tweets, Reddit: ${redditCount} posts`);

      // Step 2: Claude synthesizes all evidence
      process.stdout.write('  Synthesizing evidence... ');
      const analysis = await synthesizeEvidence(idea, xEvidence, xCompetitors, redditPosts);
      console.log(`Validation: ${analysis.validation?.strength || 0}/100`);

      return analysis;
    } catch (err) {
      if (err.message?.includes('credit balance is too low')) {
        console.error('Credits exhausted. Stopping enrichment.');
        process.exit(1);
      }
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
  // Initialize Reddit OAuth if credentials available
  redditToken = await getRedditToken();

  if (!XAI_API_KEY) {
    console.warn('XAI_API_KEY not set - X evidence search disabled, using Reddit only');
  }

  // Fetch promising, unvalidated ideas
  let query = supabase.from('ideas').select('*')
    .eq('approved', true)
    .not('hormozi_score', 'is', null)
    .not('flylabs_score', 'is', null);
  if (!enrichAll) {
    query = query.is('enrichment', null);
  }
  query = query.limit(200);

  const { data: ideas, error } = await query;
  if (error) {
    console.error('Failed to fetch ideas:', error.message);
    process.exit(1);
  }

  // Filter: FL score >= 40 (the only score that matters for eligibility)
  const eligible = ideas.filter((idea) => {
    return idea.flylabs_score != null && idea.flylabs_score >= 40;
  });

  // Sort by highest FL score first
  eligible.sort((a, b) => (b.flylabs_score || 0) - (a.flylabs_score || 0));

  const batch = eligible.slice(0, MAX_IDEAS_PER_RUN);
  console.log(`Found ${ideas.length} ideas, ${eligible.length} eligible, processing top ${batch.length}${enrichAll ? ' (--all mode)' : ''}`);
  if (batch.length === 0) return;

  let enriched = 0;
  let failed = 0;

  for (const idea of batch) {
    console.log(`\nEnriching: "${idea.idea_title}"`);
    const result = await enrichIdea(idea);

    if (result) {
      const validationScore = result.validation?.strength || 0;
      let enrichmentVerdict = result.verdict?.recommendation || null;

      // Post-enrichment saturation check with semantic gap detection
      const competitorCount = result.competitors?.products?.length || 0;

      // Check for funded competitors
      const hasFundedCompetitors = result.competitors?.products?.some(p => {
        const desc = ((p.description || '') + ' ' + (p.name || '') + ' ' + (p.positioning || '') + ' ' + (p.key_complaint || '')).toLowerCase();
        return desc.includes('raised') || desc.includes('funding') || desc.includes('series') || desc.includes('unicorn') || desc.includes('yc') || desc.includes('acquired');
      }) || false;

      // Also check scout data for funded competitors
      const scoutHasFunded = idea.meta?.competitor_scout?.has_funded_players || false;
      const anyFunded = hasFundedCompetitors || scoutHasFunded;

      // Semantic gap check: gap must name a SPECIFIC unserved user, not just "better/cheaper"
      const marketGap = (result.competitors?.market_gap || '').toLowerCase();
      const diffAngle = (result.competitors?.differentiation_angle || '').toLowerCase();
      const genericPatterns = ['better', 'cheaper', 'simpler', 'easier', 'faster', 'more affordable', 'small teams', 'indie', 'solo', 'individual', 'lightweight', 'open source alternative'];
      const isGenericGap = genericPatterns.some(w => marketGap.includes(w)) && !marketGap.match(/\b(for|targeting|built for)\s+\w+\s+\w+\s+(who|that|with)\b/);
      const hasSpecificGap = marketGap.length > 20 && !isGenericGap;
      const hasSpecificAngle = diffAngle.length > 20 && !genericPatterns.some(w => diffAngle.includes(w));

      // Saturation cap: 5+ competitors without SPECIFIC gap = VALIDATE_FIRST
      if (competitorCount >= 5 && enrichmentVerdict === 'BUILD' && !hasSpecificGap && !hasSpecificAngle) {
        console.log(`  Saturation cap: ${competitorCount} competitors, generic gap, overriding BUILD -> VALIDATE_FIRST`);
        enrichmentVerdict = 'VALIDATE_FIRST';
        result.verdict.recommendation = 'VALIDATE_FIRST';
        result.verdict.saturation_override = true;
        result.verdict.competitor_count = competitorCount;
        result.verdict.original_recommendation = result.verdict.original_recommendation || 'BUILD';
        result.verdict.override_reason = `${competitorCount} established competitors without specific differentiation`;
      } else if (competitorCount >= 3 && anyFunded && enrichmentVerdict === 'BUILD' && !hasSpecificGap) {
        // 3+ competitors with funding and no specific gap = also cap
        console.log(`  Funded competitor cap: ${competitorCount} funded competitors, generic gap, overriding BUILD -> VALIDATE_FIRST`);
        enrichmentVerdict = 'VALIDATE_FIRST';
        result.verdict.recommendation = 'VALIDATE_FIRST';
        result.verdict.saturation_override = true;
        result.verdict.competitor_count = competitorCount;
        result.verdict.funded_competitors = true;
        result.verdict.original_recommendation = result.verdict.original_recommendation || 'BUILD';
        result.verdict.override_reason = `${competitorCount} competitors including funded players without specific differentiation`;
      } else if (competitorCount >= 5 && enrichmentVerdict === 'BUILD') {
        console.log(`  ${competitorCount} competitors found but specific gap identified, keeping BUILD`);
        result.verdict.competitor_count = competitorCount;
        result.verdict.has_gap = true;
      }
      // Store competitor count for frontend display
      if (result.competitors) {
        result.competitors.competitor_count = competitorCount;
      }
      // Boost confidence for underserved markets (0-1 competitors)
      if (competitorCount <= 1 && result.validation) {
        result.validation.confidence = 'high';
        result.validation.underserved_market = true;
      }

      // Post-enrichment FL score adjustment for crowded markets
      if (competitorCount >= 5 && !hasSpecificGap) {
        const currentFl = idea.flylabs_score || 0;
        const penalty = anyFunded ? 15 : 10;
        const adjustedFl = Math.max(30, currentFl - penalty);
        if (adjustedFl !== currentFl) {
          console.log(`  FL adjustment: ${currentFl} -> ${adjustedFl} (-${penalty} for ${competitorCount} competitors${anyFunded ? ', funded' : ''})`);
          result.fl_adjustment = { original: currentFl, adjusted: adjustedFl, penalty, reason: `${competitorCount} competitors${anyFunded ? ' (funded)' : ''}` };
        }
      } else if (competitorCount >= 3 && anyFunded && !hasSpecificGap) {
        const currentFl = idea.flylabs_score || 0;
        const penalty = 10;
        const adjustedFl = Math.max(30, currentFl - penalty);
        if (adjustedFl !== currentFl) {
          console.log(`  FL adjustment: ${currentFl} -> ${adjustedFl} (-${penalty} for funded competitors)`);
          result.fl_adjustment = { original: currentFl, adjusted: adjustedFl, penalty, reason: `${competitorCount} funded competitors` };
        }
      }

      // Server-side FL score gate: enrichment cannot set BUILD if FL < 65
      const fl = idea.flylabs_score || idea.score_breakdown?.flylabs?.total;
      if (enrichmentVerdict === 'BUILD' && fl != null && fl < 65) {
        console.log(`  FL gate: ${fl}/100 < 65, overriding enrichment BUILD → VALIDATE_FIRST`);
        enrichmentVerdict = 'VALIDATE_FIRST';
        result.verdict.recommendation = 'VALIDATE_FIRST';
        result.verdict.fl_override = true;
        result.verdict.original_recommendation = result.verdict.original_recommendation || 'BUILD';
        result.verdict.override_reason = `FL score ${fl}/100 below minimum threshold of 65 for BUILD`;
      }

      // Server-side buildability gate: enrichment cannot override to BUILD if buildability < 10
      const buildability = idea.score_breakdown?.flylabs?.buildability?.score;
      if (enrichmentVerdict === 'BUILD' && buildability != null && buildability < 10) {
        console.log(`  Buildability gate: ${buildability}/20 too low, overriding enrichment BUILD → VALIDATE_FIRST`);
        enrichmentVerdict = 'VALIDATE_FIRST';
        result.verdict.recommendation = 'VALIDATE_FIRST';
        result.verdict.buildability_override = true;
        result.verdict.original_recommendation = 'BUILD';
        result.verdict.override_reason = `Buildability ${buildability}/20 below minimum threshold of 10 for solo builder`;
      }

      // Audit trail: track if enrichment changed the scoring verdict
      const scoringVerdict = idea.score_breakdown?.synthesis?.verdict;
      if (scoringVerdict && enrichmentVerdict && scoringVerdict !== enrichmentVerdict) {
        result.verdict.previous_verdict = scoringVerdict;
        result.verdict.verdict_changed = true;
      }

      const updateData = {
        enrichment: result,
        validation_score: validationScore,
        confidence: result.validation?.confidence || null,
      };

      // Apply FL score adjustment from competition analysis
      if (result.fl_adjustment) {
        updateData.flylabs_score = result.fl_adjustment.adjusted;
        updateData.composite_score = result.fl_adjustment.adjusted;
      }

      // Recompute verdict based on potentially adjusted FL score
      const effectiveFl = updateData.flylabs_score || idea.flylabs_score;
      if (effectiveFl != null) {
        const effectiveBuildability = idea.score_breakdown?.flylabs?.buildability?.score;
        if (effectiveFl >= 65 && effectiveBuildability >= 10 && enrichmentVerdict === 'BUILD') {
          updateData.verdict = 'BUILD';
        } else if (effectiveFl >= 40) {
          updateData.verdict = 'VALIDATE_FIRST';
        } else {
          updateData.verdict = 'SKIP';
        }
      } else {
        updateData.verdict = enrichmentVerdict;
      }

      const { error: updateErr } = await supabase
        .from('ideas')
        .update(updateData)
        .eq('id', idea.id);

      if (updateErr) {
        console.log('  DB error:', updateErr.message);
        failed++;
      } else {
        const flNote = result.fl_adjustment ? ` FL:${result.fl_adjustment.original}->${result.fl_adjustment.adjusted}` : '';
        console.log(`  Saved. V:${validationScore} Verdict:${updateData.verdict}${flNote}`);
        enriched++;
      }
    } else {
      failed++;
    }
  }

  console.log(`\nDone. Enriched: ${enriched}, Failed: ${failed}`);
}

main();
