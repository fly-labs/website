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

const SYSTEM_PROMPT = `You are an expert startup and business idea evaluator. You will evaluate ideas using three frameworks, provide per-pillar reasoning, and synthesize a final verdict. Return ONLY valid JSON.

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

**Bruno Okamoto Evaluation (0-100)** based on MicroSaaS validation methodology (4 Pillars of a Scalable MVP + Validation Copilot):
- Target Audience (20pts): Specificity (0-7), Identifiability (0-7), Reachability (0-6). How well-defined and reachable is the target audience?
- Value Proposition (25pts): Clarity (0-8), Specificity (0-9), Measurability (0-8). Is the value proposition clear, specific, and measurable?
- Distribution Channel (20pts): Accessibility (0-7), Viral Coefficient (0-7), CAC Efficiency (0-6). Can you reach customers efficiently?
- Business Model (15pts): Monetization Clarity (0-5), Willingness to Pay (0-5), Pricing Power (0-5). Is there a clear path to revenue?
- Assumption Risk (10pts): Testability (0-5), Critical Assumptions (0-5). How testable are the core assumptions?
- Validation Readiness (10pts): Experiment Feasibility (0-5), Evidence Availability (0-5). Can you validate before building?
Decision: FOLLOW (>=70), ADJUST (40-69), or PIVOT (<40) based on total score.

**Synthesis** - After scoring all three frameworks, cross-reference them and produce a final verdict:
- composite_score: weighted average (35% hormozi + 30% koe + 35% okamoto)
- verdict rules:
  - BUILD: composite >= 70 AND no single framework below 40. Strong signal across all lenses.
  - VALIDATE_FIRST: composite 45-69, OR composite >= 70 but one framework below 40. Promising but has gaps.
  - SKIP: composite < 45. Not viable for a solo builder right now.

IMPORTANT: For each pillar, include a "reasoning" string (one sentence explaining the score). For each framework, include a "reasoning" string (2-3 sentences on what drives the score up and what holds it back).

Return ONLY this JSON structure (no markdown, no code fences):
{
  "hormozi": {
    "total": <number 0-100>,
    "market_viability": { "score": <0-20>, "max": 20, "pain": <0-7>, "purchasing_power": <0-7>, "targeting": <0-6>, "reasoning": "..." },
    "value_equation": { "score": <0-25>, "max": 25, "dream_outcome": <0-8>, "likelihood": <0-9>, "speed": <0-4>, "effort": <0-4>, "reasoning": "..." },
    "market_growth": { "score": <0-15>, "max": 15, "trajectory": <0-8>, "timing": <0-7>, "reasoning": "..." },
    "differentiation": { "score": <0-20>, "max": 20, "moat": <0-7>, "stacking": <0-6>, "pricing": <0-7>, "reasoning": "..." },
    "feasibility": { "score": <0-20>, "max": 20, "build": <0-7>, "gtm": <0-7>, "resources": <0-6>, "reasoning": "..." },
    "summary": "<one-line Hormozi-style assessment>",
    "reasoning": "<2-3 sentences: what drives the score up, what holds it back>"
  },
  "koe": {
    "total": <number 0-100>,
    "problem_clarity": { "score": <0-25>, "max": 25, "reasoning": "..." },
    "creator_fit": { "score": <0-20>, "max": 20, "reasoning": "..." },
    "audience_reach": { "score": <0-15>, "max": 15, "reasoning": "..." },
    "simplicity": { "score": <0-15>, "max": 15, "reasoning": "..." },
    "monetization": { "score": <0-15>, "max": 15, "reasoning": "..." },
    "anti_niche": { "score": <0-5>, "max": 5, "reasoning": "..." },
    "leverage": { "score": <0-5>, "max": 5, "reasoning": "..." },
    "summary": "<one-line Koe-style assessment>",
    "reasoning": "<2-3 sentences: what drives the score up, what holds it back>"
  },
  "okamoto": {
    "total": <number 0-100>,
    "target_audience": { "score": <0-20>, "max": 20, "specificity": <0-7>, "identifiability": <0-7>, "reachability": <0-6>, "reasoning": "..." },
    "value_proposition": { "score": <0-25>, "max": 25, "clarity": <0-8>, "specificity": <0-9>, "measurability": <0-8>, "reasoning": "..." },
    "distribution_channel": { "score": <0-20>, "max": 20, "accessibility": <0-7>, "viral_coefficient": <0-7>, "cac_efficiency": <0-6>, "reasoning": "..." },
    "business_model": { "score": <0-15>, "max": 15, "monetization_clarity": <0-5>, "willingness_to_pay": <0-5>, "pricing_power": <0-5>, "reasoning": "..." },
    "assumption_risk": { "score": <0-10>, "max": 10, "testability": <0-5>, "critical_assumptions": <0-5>, "reasoning": "..." },
    "validation_readiness": { "score": <0-10>, "max": 10, "experiment_feasibility": <0-5>, "evidence_availability": <0-5>, "reasoning": "..." },
    "decision": "<FOLLOW|ADJUST|PIVOT>",
    "summary": "<one-line validation-focused assessment>",
    "reasoning": "<2-3 sentences: what drives the score up, what holds it back>"
  },
  "synthesis": {
    "verdict": "<BUILD|VALIDATE_FIRST|SKIP>",
    "composite_score": <number 0-100>,
    "one_liner": "<One sentence: what this idea is and whether a solo builder should pursue it>",
    "strengths": ["strength 1", "strength 2"],
    "risks": ["risk 1", "risk 2"],
    "next_steps": ["step 1", "step 2", "step 3"],
    "reasoning": "<2-3 sentences explaining the verdict by cross-referencing all three frameworks>"
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
        max_tokens: 3000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      });

      let text = response.content[0].text.trim();
      if (text.startsWith('```')) {
        text = text.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
      }
      const parsed = JSON.parse(text);

      if (typeof parsed.hormozi?.total !== 'number' || typeof parsed.koe?.total !== 'number' || typeof parsed.okamoto?.total !== 'number') {
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
  // Fetch ideas to score: missing ANY of the 3 scores, or --all to re-score everything
  let ideas = [];
  if (scoreAll) {
    const { data, error } = await supabase.from('ideas').select('*').eq('approved', true).limit(MAX_IDEAS_PER_RUN);
    if (error) { console.error('Failed to fetch ideas:', error.message); process.exit(1); }
    ideas = data;
  } else {
    // Fetch ideas missing any score (hormozi, koe, or okamoto)
    const { data, error } = await supabase.from('ideas').select('*').eq('approved', true)
      .or('hormozi_score.is.null,koe_score.is.null,okamoto_score.is.null')
      .limit(MAX_IDEAS_PER_RUN);
    if (error) { console.error('Failed to fetch ideas:', error.message); process.exit(1); }
    ideas = data;
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
            okamoto_score: result.okamoto.total,
            score_breakdown: result,
          })
          .eq('id', idea.id);

        if (updateErr) {
          console.log('DB error:', updateErr.message);
          failed++;
        } else {
          console.log(`H:${result.hormozi.total} K:${result.koe.total} B:${result.okamoto.total}`);
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
