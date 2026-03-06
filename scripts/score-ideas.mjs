import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { resolve, dirname } from 'path';
config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../apps/web/.env') });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const MAX_IDEAS_PER_RUN = 50;
const BATCH_SIZE = 10;
const BATCH_DELAY_MS = 1000;
const MAX_RETRIES = 2;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !ANTHROPIC_API_KEY) {
  console.error('Missing env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

const scoreAll = process.argv.includes('--all');

const SYSTEM_PROMPT = `You are an expert startup and business idea evaluator. You will evaluate ideas using two frameworks and return ONLY valid JSON.

**Hormozi Evaluation (0-100)** based on Alex Hormozi's $100M framework:
- Market Viability (20pts): Massive Pain (0-7), Purchasing Power (0-7), Easy to Target (0-6)
- Value Equation (25pts): Dream Outcome (0-8), Likelihood of Achievement (0-9), Speed to Results (0-4), Low Effort Required (0-4)
- Market Growth & Timing (15pts): Market Trajectory (0-8), Timing Fit (0-7)
- Offer Differentiation (20pts): Competitive Moat (0-7), Offer Stacking (0-6), Pricing Power (0-7)
- Execution Feasibility (20pts): Build Complexity (0-7), GTM Clarity (0-7), Resource Requirements (0-6)

**Dan Koe Evaluation (0-100)** based on the one-person business lens:
- Problem Clarity (25pts): Is the problem specific, quantifiable, urgent?
- Creator Fit (20pts): Can a solo creator/small team build this?
- Audience Reach (15pts): Is the audience identifiable, connected, reachable online?
- Simplicity (15pts): Can users adopt quickly? Hours not months?
- Monetization (15pts): Clear path to revenue? SaaS, templates, services?
- Anti-Niche POV (5pts): Unique angle that's hard to replicate?
- Leverage Potential (5pts): Can it scale without founder bottleneck?

Return ONLY this JSON structure (no markdown, no code fences):
{
  "hormozi": {
    "total": <number 0-100>,
    "market_viability": { "score": <0-20>, "max": 20, "pain": <0-7>, "purchasing_power": <0-7>, "targeting": <0-6> },
    "value_equation": { "score": <0-25>, "max": 25, "dream_outcome": <0-8>, "likelihood": <0-9>, "speed": <0-4>, "effort": <0-4> },
    "market_growth": { "score": <0-15>, "max": 15, "trajectory": <0-8>, "timing": <0-7> },
    "differentiation": { "score": <0-20>, "max": 20, "moat": <0-7>, "stacking": <0-6>, "pricing": <0-7> },
    "feasibility": { "score": <0-20>, "max": 20, "build": <0-7>, "gtm": <0-7>, "resources": <0-6> },
    "summary": "<one-line Hormozi-style assessment>"
  },
  "koe": {
    "total": <number 0-100>,
    "problem_clarity": { "score": <0-25>, "max": 25 },
    "creator_fit": { "score": <0-20>, "max": 20 },
    "audience_reach": { "score": <0-15>, "max": 15 },
    "simplicity": { "score": <0-15>, "max": 15 },
    "monetization": { "score": <0-15>, "max": 15 },
    "anti_niche": { "score": <0-5>, "max": 5 },
    "leverage": { "score": <0-5>, "max": 5 },
    "summary": "<one-line Koe-style assessment>"
  }
}`;

async function scoreIdea(idea) {
  const userPrompt = [
    `Idea: ${idea.idea_title}`,
    idea.idea_description ? `Description: ${idea.idea_description}` : null,
    idea.industry ? `Industry: ${idea.industry}` : null,
    idea.tags ? `Tags: ${idea.tags}` : null,
    idea.country ? `Country: ${idea.country}` : null,
  ].filter(Boolean).join('\n');

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      });

      const text = response.content[0].text.trim();
      const parsed = JSON.parse(text);

      if (typeof parsed.hormozi?.total !== 'number' || typeof parsed.koe?.total !== 'number') {
        throw new Error('Invalid score structure');
      }

      return parsed;
    } catch (err) {
      if (attempt < MAX_RETRIES) {
        console.warn(`  Retry ${attempt + 1} for "${idea.idea_title}": ${err.message}`);
        await sleep(2000);
      } else {
        console.error(`  Failed to score "${idea.idea_title}" after ${MAX_RETRIES + 1} attempts: ${err.message}`);
        return null;
      }
    }
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  // Fetch ideas to score
  let query = supabase.from('ideas').select('*').eq('approved', true);
  if (!scoreAll) {
    query = query.is('hormozi_score', null);
  }
  query = query.limit(MAX_IDEAS_PER_RUN);

  const { data: ideas, error } = await query;
  if (error) {
    console.error('Failed to fetch ideas:', error.message);
    process.exit(1);
  }

  console.log(`Found ${ideas.length} ideas to score${scoreAll ? ' (--all mode)' : ''}`);
  if (ideas.length === 0) return;

  let scored = 0;
  let failed = 0;

  for (let i = 0; i < ideas.length; i += BATCH_SIZE) {
    const batch = ideas.slice(i, i + BATCH_SIZE);
    console.log(`\nBatch ${Math.floor(i / BATCH_SIZE) + 1}: scoring ${batch.length} ideas...`);

    for (const idea of batch) {
      process.stdout.write(`  Scoring: "${idea.idea_title}"... `);
      const result = await scoreIdea(idea);

      if (result) {
        const { error: updateErr } = await supabase
          .from('ideas')
          .update({
            hormozi_score: result.hormozi.total,
            koe_score: result.koe.total,
            score_breakdown: result,
          })
          .eq('id', idea.id);

        if (updateErr) {
          console.log('DB error:', updateErr.message);
          failed++;
        } else {
          console.log(`H:${result.hormozi.total} K:${result.koe.total}`);
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
}

main();
