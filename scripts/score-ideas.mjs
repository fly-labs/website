import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { resolve, dirname } from 'path';
config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../apps/web/.env') });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
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
const backfill = process.argv.includes('--backfill');
const MAX_IDEAS_PER_RUN = backfill ? 500 : 25;
const MODEL = backfill ? 'claude-haiku-4-5-20251001' : 'claude-sonnet-4-20250514';

if (backfill) {
  console.log(`Backfill mode: using ${MODEL} (cheaper), ${MAX_IDEAS_PER_RUN} ideas per run`);
}

const SYSTEM_PROMPT = `You are an expert startup and business idea evaluator. You will evaluate ideas using four frameworks, provide per-pillar reasoning, and synthesize a final verdict. Return ONLY valid JSON.

**Fly Labs Method (0-100)** - Problem-Solution Fit for Vibe Builders
Evaluate from the perspective of a solo builder with AI tools and limited time.
The 4 questions every vibe builder should ask before building:

1. Problem Clarity (30pts): Is this problem REAL and FELT?
   - Existence & Awareness (0-10): Do real people actively experience and discuss this pain? A hidden or suppressed problem is unwanted. Look for signals: people searching for solutions, discussing frustrations, creating workarounds.
   - Specificity (0-10): Is it concrete enough to build a targeted solution? "Communication is hard" scores low. "Remote teams waste 30 min/day switching between chat and project management tools" scores high.
   - Severity (0-10): How painful? Daily frustration (10) vs mild annual inconvenience (2). Consider frequency, time wasted, money lost, emotional impact.

2. Solution Gap (25pts): Is there ROOM for something new, or is this a commodity market?
   - Alternative Quality (0-8): How good are existing solutions? CRITICAL: also consider how MANY serious alternatives exist. If 10+ funded competitors address this problem (even poorly), cap this score at 4. A crowded market of mediocre tools is still a crowded market. If people are using spreadsheets and duct tape with no dedicated tools, score 7-8.
   - Addressable Complaints (0-8): Are there specific, BUILDABLE weaknesses in current solutions? Generic complaints score low: "it's expensive" = 2 max, "bad UX" = 2 max. Specific buildable gaps score high: "Zapier breaks when webhooks timeout and there's no retry logic" = 7-8. The complaint must point to something a solo builder can actually fix. Vague frustration is not a gap.
   - Whitespace (0-9): Is there a specific, narrow angle nobody occupies? "Better UI" is NOT whitespace (every competitor claims better UI, score 0-2). "Designed specifically for solo consultants who use Notion as their backend" IS whitespace (narrow, defensible). If the idea title could describe 10 different existing products, whitespace is 0-2. True whitespace requires a specific audience + specific workflow + specific integration that incumbents ignore.

3. Willingness to Act (25pts): Would people actually DO something?
   - Switching Motivation (0-10): Is the pain strong enough to overcome inertia? People hate switching tools. The problem must be painful enough to justify the effort.
   - Payment Signals (0-8): Evidence people would pay. Explicit statements ("I'd pay for this"), pricing discussions, complaints about free tools being insufficient, workaround effort (time = money).
   - Urgency (0-7): Is this "need it now" or "maybe someday"? Growing problems score higher. Problems getting worse with scale score higher.

4. Buildability (20pts): Can a VIBE BUILDER ship this?
   - Solo Feasibility (0-8): Can one person with AI tools (Claude, Cursor, no-code platforms) build an MVP? Consider technical complexity, integrations needed, infrastructure requirements.
   - Speed to Market (0-7): Can a useful v1 ship in days or weeks, not months? The best vibe building projects start small and iterate.
   - Compound Value (0-5): Does building this teach skills or create assets useful for the next project? Does it generate content? Does it compound?

Provide per-dimension reasoning (one sentence each explaining the score).

**Hormozi Evaluation (0-100)** based on Alex Hormozi's $100M framework:
- Market Viability (20pts): Massive Pain (0-7), Purchasing Power (0-7), Easy to Target (0-6)
- Value Equation (25pts) - Hormozi's perceived value formula: Value = (Dream Outcome x Likelihood) / (Time Delay x Effort)
  - Dream Outcome (0-7): The REAL dream the customer wants, not just the feature you're delivering. What transformation are they buying? Score high if the outcome connects to a deep desire (save time, make money, reduce stress), low if it's incremental improvement.
  - Perceived Likelihood (0-6): How likely does the customer BELIEVE your solution will work? Score based on proof signals (testimonials, demos, guarantees, social proof), not actual efficacy. A solution can be great but score low if it's hard to believe.
  - Speed to First Result (0-6): Time to FIRST visible result, not full transformation. Can the user see value in minutes (score 6) or does it take months (score 1)? The first "aha moment" determines retention.
  - Low Effort/Sacrifice (0-6): Perceived effort or sacrifice in the customer journey. Switching costs, learning curve, data migration, behavior change. Score high if frictionless, low if requires significant lifestyle or workflow changes.
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
**Synthesis** - After scoring all four frameworks, cross-reference them and produce a final verdict:
- composite_score: weighted average (40% flylabs + 20% hormozi + 20% koe + 20% okamoto)
- SATURATION CAP: If this idea describes a problem addressed by 5+ well-known products or funded competitors, cap composite at 65 max and verdict at VALIDATE_FIRST regardless of framework scores. A real problem in a crowded market is not a BUILD for a solo builder. Apply this cap BEFORE the verdict rules below.
- verdict rules (after saturation cap):
  - BUILD: composite >= 70 AND flylabs >= 60 AND flylabs buildability >= 10/20 AND no single framework below 30. Strong signal across all lenses. If buildability < 10, the idea requires too large a team or too much infrastructure for a solo builder, so downgrade to VALIDATE_FIRST regardless of other scores.
  - VALIDATE_FIRST: composite 45-69, OR composite >= 70 but flylabs < 60 or buildability < 10 or any framework below 30. Promising but has gaps.
  - SKIP: composite < 45. Not viable for a solo builder right now.

IMPORTANT: For each pillar, include a "reasoning" string (one sentence explaining the score). For each framework, include a "reasoning" string (2-3 sentences on what drives the score up and what holds it back).

Return ONLY this JSON structure (no markdown, no code fences):
{
  "flylabs": {
    "total": <number 0-100>,
    "problem_clarity": { "score": <0-30>, "max": 30, "existence": <0-10>, "specificity": <0-10>, "severity": <0-10>, "reasoning": "..." },
    "solution_gap": { "score": <0-25>, "max": 25, "alternative_quality": <0-8>, "addressable_complaints": <0-8>, "whitespace": <0-9>, "reasoning": "..." },
    "willingness": { "score": <0-25>, "max": 25, "switching_motivation": <0-10>, "payment_signals": <0-8>, "urgency": <0-7>, "reasoning": "..." },
    "buildability": { "score": <0-20>, "max": 20, "solo_feasibility": <0-8>, "speed_to_market": <0-7>, "compound_value": <0-5>, "reasoning": "..." },
    "summary": "<one-line>",
    "reasoning": "<2-3 sentences>"
  },
  "hormozi": {
    "total": <number 0-100>,
    "market_viability": { "score": <0-20>, "max": 20, "pain": <0-7>, "purchasing_power": <0-7>, "targeting": <0-6>, "reasoning": "..." },
    "value_equation": { "score": <0-25>, "max": 25, "dream_outcome": <0-7>, "likelihood": <0-6>, "speed": <0-6>, "effort": <0-6>, "reasoning": "..." },
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
    "summary": "<one-line validation-focused assessment>",
    "reasoning": "<2-3 sentences: what drives the score up, what holds it back>"
  },
  "synthesis": {
    "verdict": "<BUILD|VALIDATE_FIRST|SKIP>",
    "composite_score": <number 0-100>,
    "one_liner": "<One sentence that tells a builder EXACTLY what they'd build and who it's for. Not a verdict summary. Example: 'A Slack bot that auto-archives channels with no activity for 30 days, sold to IT admins at mid-size companies.' Specific enough to start building from this sentence.>",
    "the_pain": "<One sentence describing the specific, felt pain. Quote real language if possible. Example: 'Teams waste 20+ minutes per day scrolling past dead channels looking for the active ones.' If unclear, write what you can infer from the idea.>",
    "the_gap": "<One sentence describing what current solutions miss. Example: 'Slack's native archiving requires manual admin work and has no automation rules.' Be specific about WHAT is missing, not just that something is missing.>",
    "build_angle": "<One sentence describing the specific, defensible angle for a solo builder. Example: 'A lightweight Slack app (not a full platform) that just does auto-archiving with simple rules, priced at $5/team/month.' Include the format, the narrow scope, and the pricing position.>",
    "saturation_capped": <boolean, true if saturation cap was applied>,
    "strengths": ["strength 1", "strength 2"],
    "risks": ["risk 1", "risk 2"],
    "next_steps": ["step 1", "step 2", "step 3"],
    "reasoning": "<2-3 sentences explaining the verdict by cross-referencing all four frameworks>"
  }
}`;

async function scoreIdea(idea) {
  const parts = [
    `Idea: ${idea.idea_title}`,
    idea.idea_description ? `Description: ${idea.idea_description}` : null,
    idea.industry ? `Industry: ${idea.industry}` : null,
    idea.tags ? `Tags: ${idea.tags}` : null,
    idea.country ? `Country: ${idea.country}` : null,
  ];

  // Include YC failure analysis as additional context when available
  if (idea.meta?.failure_analysis) {
    const fa = idea.meta.failure_analysis;
    parts.push('');
    parts.push('=== YC Graveyard Context ===');
    parts.push(`A YC startup (${fa.company_name || 'unknown'}, ${fa.batch || 'unknown batch'}) tried to solve this problem and failed.`);
    if (fa.team_size) parts.push(`Team size: ${fa.team_size}`);
    if (fa.failure_reason) parts.push(`Why it failed: ${fa.failure_reason}`);
    if (fa.what_changed) parts.push(`What changed since: ${fa.what_changed}`);
    if (fa.rebuild_angle) parts.push(`Solo builder angle: ${fa.rebuild_angle}`);
    if (fa.original_one_liner) parts.push(`Original pitch: "${fa.original_one_liner}"`);
    if (fa.team_size && fa.team_size > 10) {
      parts.push(`\nWARNING: This startup had ${fa.team_size} employees. A large team suggests the problem may require significant engineering, ops, or infrastructure that a solo builder cannot replicate. Score buildability accordingly. Be skeptical of solo feasibility for problems that needed 10+ people to attempt.`);
    }
    parts.push('Score this idea in its CURRENT context. The YC failure provides useful signal about risks and timing.');
  }

  const userPrompt = parts.filter(Boolean).join('\n');

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: backfill ? 6000 : 4000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      });

      let text = response.content[0].text.trim();
      if (text.startsWith('```')) {
        text = text.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
      }
      // Extract first complete JSON object (Haiku sometimes adds text after the JSON)
      const jsonStart = text.indexOf('{');
      if (jsonStart > 0) text = text.slice(jsonStart);
      const lastBrace = text.lastIndexOf('}');
      if (lastBrace > 0 && lastBrace < text.length - 1) text = text.slice(0, lastBrace + 1);
      const parsed = JSON.parse(text);

      if (typeof parsed.flylabs?.total !== 'number' || typeof parsed.hormozi?.total !== 'number' || typeof parsed.koe?.total !== 'number' || typeof parsed.okamoto?.total !== 'number') {
        throw new Error('Invalid score structure');
      }

      // Clamp all scores to 0-100
      const clamp = (v) => Math.max(0, Math.min(100, Math.round(v)));
      parsed.flylabs.total = clamp(parsed.flylabs.total);
      parsed.hormozi.total = clamp(parsed.hormozi.total);
      parsed.koe.total = clamp(parsed.koe.total);
      parsed.okamoto.total = clamp(parsed.okamoto.total);

      // Validate verdict
      const VALID_VERDICTS = ['BUILD', 'VALIDATE_FIRST', 'SKIP'];
      if (parsed.synthesis?.verdict && !VALID_VERDICTS.includes(parsed.synthesis.verdict)) {
        console.warn(`  Invalid verdict "${parsed.synthesis.verdict}", falling back to VALIDATE_FIRST`);
        parsed.synthesis.verdict = 'VALIDATE_FIRST';
      }

      // Server-side buildability gate: BUILD requires buildability >= 10/20
      if (parsed.synthesis?.verdict === 'BUILD') {
        const buildability = parsed.flylabs?.buildability?.score;
        if (buildability != null && buildability < 10) {
          console.warn(`  Buildability gate: ${buildability}/20 too low for BUILD, downgrading to VALIDATE_FIRST`);
          parsed.synthesis.verdict = 'VALIDATE_FIRST';
        }
      }

      // Server-side saturation cap: crowded markets cap at VALIDATE_FIRST
      if (parsed.synthesis?.saturation_capped && parsed.synthesis?.verdict === 'BUILD') {
        console.warn(`  Saturation cap: AI flagged crowded market but gave BUILD, downgrading to VALIDATE_FIRST`);
        parsed.synthesis.verdict = 'VALIDATE_FIRST';
      }
      if (parsed.synthesis?.saturation_capped && parsed.synthesis?.composite_score > 65) {
        console.warn(`  Saturation cap: capping composite from ${parsed.synthesis.composite_score} to 65`);
        parsed.synthesis.composite_score = 65;
      }

      // Server-side YC team-size gate: large teams + low buildability = not solo-buildable
      if (parsed.synthesis?.verdict === 'BUILD' && idea.source === 'yc') {
        const teamSize = idea.meta?.failure_analysis?.team_size;
        const buildability = parsed.flylabs?.buildability?.score;
        if (teamSize && teamSize > 10 && buildability != null && buildability < 12) {
          console.warn(`  YC team-size gate: team of ${teamSize} with buildability ${buildability}/20, downgrading to VALIDATE_FIRST`);
          parsed.synthesis.verdict = 'VALIDATE_FIRST';
        }
      }

      // Recompute composite to verify AI math
      if (parsed.synthesis) {
        const expected = Math.round(
          parsed.flylabs.total * 0.4 +
          parsed.hormozi.total * 0.2 +
          parsed.koe.total * 0.2 +
          parsed.okamoto.total * 0.2
        );
        if (parsed.synthesis.composite_score != null && Math.abs(parsed.synthesis.composite_score - expected) > 3) {
          console.warn(`  Composite mismatch: AI=${parsed.synthesis.composite_score}, expected=${expected}. Using computed.`);
          parsed.synthesis.composite_score = expected;
        }
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
  // --all: re-score everything (or filtered by --backfill which skips SKIPs)
  // default: only ideas missing any score
  let ideas = [];
  if (scoreAll) {
    let query = supabase.from('ideas').select('*').eq('approved', true);
    // In backfill mode, skip SKIP ideas (they're already SKIP, no point re-scoring)
    if (backfill) {
      query = query.in('verdict', ['BUILD', 'VALIDATE_FIRST']);
    }
    query = query.limit(MAX_IDEAS_PER_RUN);
    const { data, error } = await query;
    if (error) { console.error('Failed to fetch ideas:', error.message); process.exit(1); }
    ideas = data;
  } else {
    // Fetch ideas missing any score (flylabs, hormozi, koe, or okamoto)
    const { data, error } = await supabase.from('ideas').select('*').eq('approved', true)
      .or('flylabs_score.is.null,hormozi_score.is.null,koe_score.is.null,okamoto_score.is.null')
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
            flylabs_score: result.flylabs.total,
            hormozi_score: result.hormozi.total,
            koe_score: result.koe.total,
            okamoto_score: result.okamoto.total,
            score_breakdown: result,
            verdict: result.synthesis?.verdict || null,
            composite_score: result.synthesis?.composite_score || null,
          })
          .eq('id', idea.id);

        if (updateErr) {
          console.log('DB error:', updateErr.message);
          failed++;
        } else {
          console.log(`F:${result.flylabs.total} H:${result.hormozi.total} K:${result.koe.total} B:${result.okamoto.total}`);
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
