import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { resolve, dirname } from 'path';
config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../apps/web/.env') });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const XAI_API_KEY = process.env.XAI_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const BATCH_SIZE = 10;
const BATCH_DELAY_MS = 1000;
const MAX_RETRIES = 2;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

if (!XAI_API_KEY) {
  console.error('XAI_API_KEY required for competitor scouting');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const scoutAll = process.argv.includes('--all');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function grokScout(idea) {
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

Search for:
1. Named products/tools that address this exact problem
2. Whether any have raised venture funding (YC, a16z, Sequoia, Series A/B/C, etc.)
3. Whether any are Big Tech features (Google, Microsoft, Apple, Meta, Amazon)
4. Recent launches or announcements in this space

Return a JSON object:
{
  "competitors": [
    { "name": "string", "description": "what they do in 1 sentence", "funded": true/false, "funding_detail": "e.g. Series B, $50M" or "bootstrapped" or "unknown" }
  ],
  "competitor_count": integer,
  "has_funded_players": true/false,
  "has_big_tech": true/false,
  "market_maturity": "nascent|emerging|growing|mature|saturated",
  "summary": "1-2 sentence market overview"
}`,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'competitor_scout',
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
                    funded: { type: 'boolean' },
                    funding_detail: { type: 'string' },
                  },
                  required: ['name', 'description', 'funded', 'funding_detail'],
                  additionalProperties: false,
                },
              },
              competitor_count: { type: 'integer' },
              has_funded_players: { type: 'boolean' },
              has_big_tech: { type: 'boolean' },
              market_maturity: { type: 'string', enum: ['nascent', 'emerging', 'growing', 'mature', 'saturated'] },
              summary: { type: 'string' },
            },
            required: ['competitors', 'competitor_count', 'has_funded_players', 'has_big_tech', 'market_maturity', 'summary'],
            additionalProperties: false,
          },
        },
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Grok API error: ${response.status} ${text.slice(0, 200)}`);
  }

  const data = await response.json();
  const messageItem = data.output?.find((item) => item.type === 'message');
  const textContent = messageItem?.content?.find((c) => c.type === 'output_text' || c.type === 'text');
  if (!textContent?.text) throw new Error('No text in Grok response');

  let text = textContent.text.trim();
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }
  return JSON.parse(text);
}

async function openaiScout(idea) {
  if (!OPENAI_API_KEY) return null;

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        tools: [{ type: 'web_search_preview' }],
        input: `List all known funded competitors and existing products that solve this problem: "${idea.idea_title}". Include funding amounts, YC batch, or acquisition status if known. Focus on direct competitors only. Return JSON with: competitors (array of {name, description, funded, funding_detail}), competitor_count (integer).`,
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
    // Try to parse JSON from the response
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    if (jsonStart >= 0 && jsonEnd > jsonStart) {
      text = text.slice(jsonStart, jsonEnd + 1);
    }
    return JSON.parse(text);
  } catch (err) {
    console.warn(`  OpenAI scout error: ${err.message}`);
    return null;
  }
}

function mergeScoutResults(grokResult, openaiResult) {
  if (!openaiResult?.competitors?.length) return grokResult;

  // Merge: union of competitors by name (case-insensitive)
  const seen = new Set(grokResult.competitors.map(c => c.name.toLowerCase()));
  const merged = [...grokResult.competitors];

  for (const c of openaiResult.competitors) {
    if (!seen.has(c.name.toLowerCase())) {
      merged.push(c);
      seen.add(c.name.toLowerCase());
    }
  }

  return {
    ...grokResult,
    competitors: merged,
    competitor_count: merged.length,
    has_funded_players: grokResult.has_funded_players || merged.some(c => c.funded),
    openai_enriched: true,
  };
}

async function scoutIdea(idea) {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Run Grok and OpenAI in parallel
      const [grokResult, openaiResult] = await Promise.all([
        grokScout(idea),
        openaiScout(idea),
      ]);

      return mergeScoutResults(grokResult, openaiResult);
    } catch (err) {
      if (err.message?.includes('credit') || err.message?.includes('insufficient')) {
        console.error('  Credits exhausted. Stopping.');
        process.exit(1);
      }
      if (attempt < MAX_RETRIES) {
        console.warn(`  Retry ${attempt + 1} for "${idea.idea_title}": ${err.message}`);
        await sleep(2000);
      } else {
        console.error(`  Failed after ${MAX_RETRIES + 1} attempts: ${err.message}`);
        return null;
      }
    }
  }
}

async function main() {
  // Fetch ideas to scout
  let query;
  if (scoutAll) {
    query = supabase.from('ideas').select('id, idea_title, idea_description, meta')
      .eq('approved', true)
      .limit(500);
    console.log('Scouting ALL ideas (--all mode)');
  } else {
    // Default: scout unscored ideas (same filter as score-ideas.mjs default mode)
    query = supabase.from('ideas').select('id, idea_title, idea_description, meta')
      .eq('approved', true)
      .is('flylabs_score', null)
      .limit(100);
  }

  const { data: ideas, error } = await query;
  if (error) {
    console.error('Failed to fetch ideas:', error.message);
    process.exit(1);
  }

  // Filter out already-scouted ideas unless --all
  const toScout = scoutAll
    ? ideas
    : ideas.filter(idea => !idea.meta?.competitor_scout);

  console.log(`Found ${ideas.length} ideas, ${toScout.length} need scouting${OPENAI_API_KEY ? ' (Grok + OpenAI)' : ' (Grok only)'}`);
  if (toScout.length === 0) return;

  let scouted = 0;
  let failed = 0;

  for (let i = 0; i < toScout.length; i += BATCH_SIZE) {
    const batch = toScout.slice(i, i + BATCH_SIZE);
    console.log(`\nBatch ${Math.floor(i / BATCH_SIZE) + 1}: scouting ${batch.length} ideas...`);

    for (const idea of batch) {
      process.stdout.write(`  Scouting: "${idea.idea_title}"... `);
      const result = await scoutIdea(idea);

      if (result) {
        // Merge with existing meta (preserve YC failure_analysis etc.)
        const existingMeta = idea.meta || {};
        const newMeta = { ...existingMeta, competitor_scout: result };

        const { error: updateErr } = await supabase
          .from('ideas')
          .update({ meta: newMeta })
          .eq('id', idea.id);

        if (updateErr) {
          console.log('DB error:', updateErr.message);
          failed++;
        } else {
          const fundedTag = result.has_funded_players ? ' [FUNDED]' : '';
          const bigTechTag = result.has_big_tech ? ' [BIG TECH]' : '';
          console.log(`${result.competitor_count} competitors (${result.market_maturity})${fundedTag}${bigTechTag}`);
          scouted++;
        }
      } else {
        failed++;
      }
    }

    // Rate limit between batches
    if (i + BATCH_SIZE < toScout.length) {
      await sleep(BATCH_DELAY_MS);
    }
  }

  console.log(`\nDone. Scouted: ${scouted}, Failed: ${failed}`);
}

main().catch(err => { console.error('Scout failed:', err); process.exit(1); });
