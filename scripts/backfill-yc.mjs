/**
 * Backfill YC Lens scores for ideas that already have FL scores.
 *
 * Only touches yc_score and score_breakdown.yc - preserves all existing scores.
 * Uses Haiku for cost efficiency (~$0.003/idea).
 *
 * Run: node scripts/backfill-yc.mjs
 */
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
const MAX_IDEAS_PER_RUN = 500;
const MODEL = 'claude-haiku-4-5-20251001';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !ANTHROPIC_API_KEY) {
  console.error('Missing env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You evaluate business ideas through the YC Lens - how Y Combinator evaluates products. Return ONLY valid JSON, no markdown.

Score these 6 questions (0-15 each, total 0-90, then normalize to 0-100):

1. DEMAND REALITY (0-15): Would someone be genuinely upset if this product disappeared tomorrow? Not "that's nice to have" but actually frustrated. Score 0 if it's a vitamin, 15 if it's a painkiller people depend on.

2. STATUS QUO (0-15): What are users doing TODAY to solve this badly? What does the current workaround cost them in time, money, or sanity? Score 0 if the status quo is fine, 15 if people are duct-taping terrible solutions together.

3. DESPERATE SPECIFICITY (0-15): Can you name the actual human who needs this most? Not "developers" but "Sarah, a frontend dev at a 10-person startup who spends 3 hours every Friday manually updating the changelog." Score 0 for vague demographics, 15 for a person you could email right now.

4. NARROWEST WEDGE (0-15): What's the smallest possible version someone would pay for THIS WEEK? Not the grand vision - the tiniest useful thing. Score 0 if the MVP needs months, 15 if you could charge for a weekend build.

5. OBSERVATION & SURPRISE (0-15): Is there evidence of real usage or unexpected behavior? Have people hacked together their own solution? Has anything about this problem surprised you? Score 0 for pure speculation, 15 for documented real-world usage patterns.

6. FUTURE-FIT (0-15): In 3 years, will this problem be MORE essential or less? Is the tailwind growing? Score 0 if the problem is shrinking, 15 if it's accelerating.

Return this JSON:
{
  "yc": {
    "total": <0-100, normalized from 0-90 raw>,
    "raw_total": <0-90, sum of 6 pillars>,
    "demand_reality": { "score": <0-15>, "max": 15, "reasoning": "..." },
    "status_quo": { "score": <0-15>, "max": 15, "reasoning": "..." },
    "desperate_specificity": { "score": <0-15>, "max": 15, "reasoning": "..." },
    "narrowest_wedge": { "score": <0-15>, "max": 15, "reasoning": "..." },
    "observation_surprise": { "score": <0-15>, "max": 15, "reasoning": "..." },
    "future_fit": { "score": <0-15>, "max": 15, "reasoning": "..." },
    "summary": "One-line summary of YC evaluation",
    "reasoning": "1-2 sentences explaining the overall YC assessment"
  }
}`;

async function scoreIdea(idea) {
  const parts = [
    `Idea: ${idea.idea_title}`,
    idea.idea_description ? `Description: ${idea.idea_description}` : null,
    idea.industry ? `Industry: ${idea.industry}` : null,
    idea.tags ? `Tags: ${idea.tags}` : null,
  ].filter(Boolean);

  // Include YC failure analysis when available
  if (idea.meta?.failure_analysis) {
    const fa = idea.meta.failure_analysis;
    parts.push('');
    parts.push('=== YC Graveyard Context ===');
    parts.push(`A YC startup (${fa.company_name || 'unknown'}, ${fa.batch || 'unknown batch'}) tried this and failed.`);
    if (fa.failure_reason) parts.push(`Why: ${fa.failure_reason}`);
    if (fa.what_changed) parts.push(`What changed: ${fa.what_changed}`);
  }

  const userPrompt = parts.join('\n');

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 2000,
        system: SYSTEM_PROMPT,
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
      const parsed = JSON.parse(text);

      if (typeof parsed.yc?.total !== 'number') {
        throw new Error('Invalid YC score structure');
      }

      // Clamp to 0-100
      parsed.yc.total = Math.max(0, Math.min(100, Math.round(parsed.yc.total)));

      return parsed;
    } catch (err) {
      if (err.message?.includes('credit balance is too low')) {
        console.error('  Credits exhausted. Stopping.');
        process.exit(1);
      }
      if (attempt < MAX_RETRIES) {
        console.warn(`  Retry ${attempt + 1} for "${idea.idea_title}": ${err.message}`);
        await new Promise(r => setTimeout(r, 2000));
      } else {
        console.error(`  Failed "${idea.idea_title}" after ${MAX_RETRIES + 1} attempts: ${err.message}`);
        return null;
      }
    }
  }
}

async function main() {
  // Fetch ideas with FL score but no YC score
  const { data: ideas, error } = await supabase
    .from('ideas')
    .select('id, idea_title, idea_description, industry, tags, source, meta, score_breakdown')
    .eq('approved', true)
    .not('flylabs_score', 'is', null)
    .is('yc_score', null)
    .limit(MAX_IDEAS_PER_RUN);

  if (error) { console.error('Failed to fetch ideas:', error.message); process.exit(1); }

  console.log(`Found ${ideas.length} ideas to backfill with YC scores`);
  console.log(`Using ${MODEL} (~$0.003/idea, estimated total: ~$${(ideas.length * 0.003).toFixed(2)})`);
  if (ideas.length === 0) return;

  let scored = 0;
  let failed = 0;

  for (let i = 0; i < ideas.length; i += BATCH_SIZE) {
    const batch = ideas.slice(i, i + BATCH_SIZE);
    console.log(`\nBatch ${Math.floor(i / BATCH_SIZE) + 1}: scoring ${batch.length} ideas...`);

    for (const idea of batch) {
      process.stdout.write(`  YC scoring: "${idea.idea_title}"... `);
      const result = await scoreIdea(idea);

      if (result) {
        // Merge yc into existing score_breakdown, preserving all other scores
        const existingBreakdown = idea.score_breakdown || {};
        const updatedBreakdown = { ...existingBreakdown, yc: result.yc };

        const { error: updateErr } = await supabase
          .from('ideas')
          .update({
            yc_score: result.yc.total,
            score_breakdown: updatedBreakdown,
          })
          .eq('id', idea.id);

        if (updateErr) {
          console.log('DB error:', updateErr.message);
          failed++;
        } else {
          console.log(`YC: ${result.yc.total}`);
          scored++;
        }
      } else {
        failed++;
      }
    }

    if (i + BATCH_SIZE < ideas.length) {
      await new Promise(r => setTimeout(r, BATCH_DELAY_MS));
    }
  }

  console.log(`\nDone. Scored: ${scored}, Failed: ${failed}`);
  console.log(`Estimated cost: ~$${(scored * 0.003).toFixed(2)} (${MODEL})`);
}

main().catch(err => { console.error(`Fatal: ${err.message}`); process.exit(1); });
