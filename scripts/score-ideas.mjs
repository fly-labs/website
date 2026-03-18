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

const SYSTEM_PROMPT = `You score business ideas for solo builders. Return ONLY valid JSON, no markdown.

**FLY LABS METHOD (0-100)** - The primary score. Would a solo builder's weekend be well spent?

1. IS THE PAIN REAL? (30 points)
   - Do people talk about this problem online? (0-10) Hidden or suppressed problems score low.
   - Is it specific enough to build for? (0-10) "Communication is hard" = 2. "Remote teams waste 30 min/day switching between chat and PM tools" = 9.
   - How bad is it? (0-10) Daily frustration = 8-10. Mild annual annoyance = 1-3.

2. IS THERE A GAP? (25 points)
   Competition is GOOD. It proves demand. The question is whether there's a specific angle left.
   - How well do current tools solve this? (0-8) Excellent incumbents = 0-2. Mediocre or overpriced for a specific audience = 5-8.
   - Are there specific complaints you could fix? (0-8) "It's expensive" = 2. "Zapier breaks on webhook timeouts with no retry" = 7.
   - Is there a narrow angle nobody took? (0-9) "Better UI" = 1. "Built for Notion freelancers" = 8. Can you name the specific user AND their workflow in one sentence? If yes, there's an angle.

3. WOULD SOMEONE PAY? (25 points)
   - Is the pain bad enough to switch tools? (0-10) People hate switching. The pain must overcome that.
   - Any signals people would pay? (0-8) Pricing discussions, complaints about free tools, time spent on workarounds.
   - Is this urgent or "maybe someday"? (0-7) Growing problems and things getting worse score higher.

4. CAN YOU BUILD IT? (20 points)
   - Can one person with AI tools ship an MVP? (0-8)
   - Can you ship something useful in weeks, not months? (0-7)
   - Does building this help your next project too? (0-5)

**EXPERT SECOND OPINIONS (0-100 each)** - Three lenses that catch what the main score might miss.

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

**SYNTHESIS** - Cross-reference all four scores. The verdict is computed server-side from the numbers, so focus on quality scoring and the actionable fields below.

Return this JSON:
{
  "flylabs": {
    "total": <0-100>,
    "problem_clarity": { "score": <0-30>, "max": 30, "existence": <0-10>, "specificity": <0-10>, "severity": <0-10>, "reasoning": "..." },
    "solution_gap": { "score": <0-25>, "max": 25, "alternative_quality": <0-8>, "addressable_complaints": <0-8>, "whitespace": <0-9>, "reasoning": "..." },
    "willingness": { "score": <0-25>, "max": 25, "switching_motivation": <0-10>, "payment_signals": <0-8>, "urgency": <0-7>, "reasoning": "..." },
    "buildability": { "score": <0-20>, "max": 20, "solo_feasibility": <0-8>, "speed_to_market": <0-7>, "compound_value": <0-5>, "reasoning": "..." },
    "summary": "...", "reasoning": "..."
  },
  "hormozi": {
    "total": <0-100>,
    "market_viability": { "score": <0-20>, "max": 20, "reasoning": "..." },
    "value_equation": { "score": <0-25>, "max": 25, "reasoning": "..." },
    "market_growth": { "score": <0-15>, "max": 15, "reasoning": "..." },
    "differentiation": { "score": <0-20>, "max": 20, "reasoning": "..." },
    "feasibility": { "score": <0-20>, "max": 20, "reasoning": "..." },
    "summary": "...", "reasoning": "..."
  },
  "koe": {
    "total": <0-100>,
    "problem_clarity": { "score": <0-25>, "max": 25, "reasoning": "..." },
    "creator_fit": { "score": <0-20>, "max": 20, "reasoning": "..." },
    "audience_reach": { "score": <0-15>, "max": 15, "reasoning": "..." },
    "simplicity": { "score": <0-15>, "max": 15, "reasoning": "..." },
    "monetization": { "score": <0-15>, "max": 15, "reasoning": "..." },
    "anti_niche": { "score": <0-5>, "max": 5, "reasoning": "..." },
    "leverage": { "score": <0-5>, "max": 5, "reasoning": "..." },
    "summary": "...", "reasoning": "..."
  },
  "okamoto": {
    "total": <0-100>,
    "target_audience": { "score": <0-20>, "max": 20, "reasoning": "..." },
    "value_proposition": { "score": <0-25>, "max": 25, "reasoning": "..." },
    "distribution_channel": { "score": <0-20>, "max": 20, "reasoning": "..." },
    "business_model": { "score": <0-15>, "max": 15, "reasoning": "..." },
    "assumption_risk": { "score": <0-10>, "max": 10, "reasoning": "..." },
    "validation_readiness": { "score": <0-10>, "max": 10, "reasoning": "..." },
    "summary": "...", "reasoning": "..."
  },
  "yc": {
    "total": <0-100>,
    "raw_total": <0-90>,
    "demand_reality": { "score": <0-15>, "max": 15, "reasoning": "..." },
    "status_quo": { "score": <0-15>, "max": 15, "reasoning": "..." },
    "desperate_specificity": { "score": <0-15>, "max": 15, "reasoning": "..." },
    "narrowest_wedge": { "score": <0-15>, "max": 15, "reasoning": "..." },
    "observation_surprise": { "score": <0-15>, "max": 15, "reasoning": "..." },
    "future_fit": { "score": <0-15>, "max": 15, "reasoning": "..." },
    "summary": "...", "reasoning": "..."
  },
  "synthesis": {
    "verdict": "<BUILD|VALIDATE_FIRST|SKIP>",
    "composite_score": <0-100>,
    "one_liner": "<What you'd build and for whom. Specific enough to start coding from this sentence.>",
    "the_pain": "<The felt pain in one sentence. Use real language.>",
    "the_gap": "<What current solutions miss. Be specific.>",
    "build_angle": "<The narrow angle for a solo builder: format, scope, price point.>",
    "saturation_capped": false,
    "strengths": ["...", "..."],
    "risks": ["...", "..."],
    "next_steps": ["...", "...", "..."],
    "reasoning": "<2-3 sentences explaining the verdict>"
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

      if (typeof parsed.flylabs?.total !== 'number' || typeof parsed.hormozi?.total !== 'number' || typeof parsed.koe?.total !== 'number' || typeof parsed.okamoto?.total !== 'number' || typeof parsed.yc?.total !== 'number') {
        throw new Error('Invalid score structure');
      }

      // Clamp all scores to 0-100
      const clamp = (v) => Math.max(0, Math.min(100, Math.round(v)));
      parsed.flylabs.total = clamp(parsed.flylabs.total);
      parsed.hormozi.total = clamp(parsed.hormozi.total);
      parsed.koe.total = clamp(parsed.koe.total);
      parsed.okamoto.total = clamp(parsed.okamoto.total);
      parsed.yc.total = clamp(parsed.yc.total);

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

      // ── Server-side truth: FL score IS the score, verdict from FL alone ──
      if (parsed.synthesis) {
        const fl = parsed.flylabs.total;
        const buildability = parsed.flylabs?.buildability?.score ?? 0;

        // composite_score = flylabs_score (backward compat for existing sorts/filters)
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

        // YC team-size gate: big teams suggest the problem needs more than one person
        if (verdict === 'BUILD' && idea.source === 'yc') {
          const teamSize = idea.meta?.failure_analysis?.team_size;
          if (teamSize > 10 && buildability < 12) {
            console.warn(`  YC gate: team of ${teamSize}, buildability ${buildability}/20 → VALIDATE_FIRST`);
            verdict = 'VALIDATE_FIRST';
          }
        }

        if (parsed.synthesis.verdict !== verdict) {
          console.warn(`  Verdict: AI="${parsed.synthesis.verdict}" → computed="${verdict}" (FL:${fl} B:${buildability})`);
        }
        parsed.synthesis.verdict = verdict;
      }

      return parsed;
    } catch (err) {
      // Stop immediately on credit exhaustion (no point retrying)
      if (err.message?.includes('credit balance is too low')) {
        console.error(`  Credits exhausted. Stopping.`);
        process.exit(1);
      }
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
    // --all: re-score already scored ideas (use sparingly, costs ~$0.05/idea with Sonnet)
    // --all --backfill: re-score with Haiku (~$0.005/idea)
    let query = supabase.from('ideas').select('*').eq('approved', true)
      .limit(MAX_IDEAS_PER_RUN);
    const { data, error } = await query;
    if (error) { console.error('Failed to fetch ideas:', error.message); process.exit(1); }
    ideas = data;
    console.log(`WARNING: --all re-scores existing ideas. Cost: ~$${(data.length * (backfill ? 0.005 : 0.05)).toFixed(2)}`);
  } else {
    // Fetch ideas missing any score (flylabs, hormozi, koe, or okamoto)
    const { data, error } = await supabase.from('ideas').select('*').eq('approved', true)
      .or('flylabs_score.is.null,hormozi_score.is.null,koe_score.is.null,okamoto_score.is.null,yc_score.is.null')
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
            yc_score: result.yc.total,
            score_breakdown: result,
            verdict: result.synthesis?.verdict || null,
            composite_score: result.flylabs.total, // FL = the score (backward compat)
          })
          .eq('id', idea.id);

        if (updateErr) {
          console.log('DB error:', updateErr.message);
          failed++;
        } else {
          console.log(`F:${result.flylabs.total} H:${result.hormozi.total} K:${result.koe.total} B:${result.okamoto.total} Y:${result.yc.total}`);
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

  const costPerIdea = backfill ? 0.005 : 0.05;
  console.log(`\nDone. Scored: ${scored}, Failed: ${failed}`);
  console.log(`Estimated cost: ~$${(scored * costPerIdea).toFixed(2)} (${MODEL})`);
}

main();
