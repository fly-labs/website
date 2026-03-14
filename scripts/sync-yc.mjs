import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { resolve, dirname } from 'path';
config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../apps/web/.env') });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const anthropic = ANTHROPIC_API_KEY ? new Anthropic({ apiKey: ANTHROPIC_API_KEY }) : null;

const YC_API_URL = 'https://yc-oss.github.io/api/companies/all.json';
const AI_BATCH_SIZE = 15;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Industry mapping from YC industries to our enum
const INDUSTRY_MAP = {
  'B2B': 'Business',
  'Consumer': 'Other',
  'Healthcare': 'Medicine Health',
  'Fintech': 'Finance',
  'Education': 'Education',
  'Real Estate and Construction': 'Realty',
  'Industrials': 'Other',
  'Infrastructure': 'Dev',
  'Government': 'Other',
};

function mapIndustry(ycIndustry) {
  if (!ycIndustry) return 'Other';
  // Try direct match first
  if (INDUSTRY_MAP[ycIndustry]) return INDUSTRY_MAP[ycIndustry];
  // Try substring match
  const lower = ycIndustry.toLowerCase();
  if (lower.includes('health')) return 'Medicine Health';
  if (lower.includes('fintech') || lower.includes('finance')) return 'Finance';
  if (lower.includes('education')) return 'Education';
  if (lower.includes('real estate')) return 'Realty';
  if (lower.includes('developer') || lower.includes('infrastructure')) return 'Dev';
  if (lower.includes('ai') || lower.includes('machine learning')) return 'Ai';
  if (lower.includes('consumer')) return 'Other';
  return 'Other';
}

async function fetchYCCompanies() {
  console.log('Fetching YC companies from API...');
  const res = await fetch(YC_API_URL);
  if (!res.ok) throw new Error(`YC API error: ${res.status}`);
  const companies = await res.json();
  console.log(`Total YC companies: ${companies.length}`);

  // Filter for inactive (dead) companies
  const inactive = companies.filter((c) => c.status === 'Inactive');
  console.log(`Inactive (dead) companies: ${inactive.length}`);
  return inactive;
}

async function getExistingIds() {
  const { data, error } = await supabase
    .from('ideas')
    .select('external_id')
    .eq('source', 'yc');
  if (error) {
    console.warn('Could not fetch existing YC ids:', error.message);
    return new Set();
  }
  return new Set(data.map((d) => d.external_id));
}

async function aiBatchFilter(companies) {
  if (!anthropic || companies.length === 0) {
    return [];
  }

  const results = [];

  for (let i = 0; i < companies.length; i += AI_BATCH_SIZE) {
    const batch = companies.slice(i, i + AI_BATCH_SIZE);
    const companiesText = batch
      .map((c, idx) => {
        const parts = [
          `[${idx}]`,
          `Name: ${c.name}`,
          c.one_liner ? `One-liner: ${c.one_liner}` : null,
          c.batch ? `Batch: ${c.batch}` : null,
          c.team_size ? `Team size: ${c.team_size}` : null,
          c.industry ? `Industry: ${c.industry}` : null,
        ].filter(Boolean);
        return parts.join('\n');
      })
      .join('\n\n---\n\n');

    try {
      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4000,
        system: `You evaluate dead YC startups for solo builder opportunities. These companies failed, but the PROBLEM they tried to solve might still be real. AI slashed build costs, so previously unviable ideas might work now for a one-person builder.

For each company, determine:
1. Is the PROBLEM this startup tried to solve still real today?
2. Could a solo builder with AI tools build a lean version in 2-4 weeks?
3. What killed this startup? (timing, needed huge team, burned cash, market not ready, regulation, etc.)
4. What's different now? (AI tools, lower costs, market matured, etc.)
5. What's the rebuild angle for a solo builder?

Return a JSON object for each viable company:
{
  "is_viable": true/false,
  "problem_title": "Reframed as the PROBLEM (not the company name). Make it a clear problem statement.",
  "problem_description": "What the company tried to solve and why it still matters. 1-2 sentences.",
  "category": "Tool|Template|Other",
  "industry": "One of: Marketing Sales, Finance, Medicine Health, Business, Realty, Productivity, Education, Hr Career, Ai, Sport Fitness, Ecommerce, Retail, Freelance, Dev, Transportation, Media, Food Nutrition, Legal, Vc Startups, Travel, Logistics Delivery, Psychology, Design Creative, Immigration, Hardware, Dating Community, Seo Geo, Agtech, No Code, Other",
  "failure_analysis": {
    "company_name": "Original company name",
    "batch": "e.g. Winter 2012",
    "team_size": 5,
    "failure_reason": "One sentence: why it failed",
    "what_changed": "One sentence: what's different now",
    "rebuild_angle": "One sentence: how a solo builder would approach this differently",
    "original_one_liner": "The company's original tagline"
  }
}

REJECT (is_viable = false) if:
- Social networks or two-sided marketplaces requiring network effects
- Hardware companies or deep tech requiring lab/manufacturing
- Regulatory-dependent (fintech requiring bank licenses, healthcare requiring FDA)
- The problem is no longer real (solved by existing tools like Stripe, Slack, etc.)
- Needs massive data or infrastructure a solo builder can't access
- The one-liner is missing or too vague to assess
- The idea only makes sense at massive scale (millions of users needed)
- Team size was 20+ people AND the problem inherently requires complex infrastructure, ops, or coordination that a solo builder cannot replicate with AI tools. Large teams are a strong signal the problem needs significant resources. Be extra skeptical when team_size > 15.

Be selective. Only pass ideas where a solo builder with Claude/Cursor/no-code could realistically ship a lean v1.

Return ONLY valid JSON (no markdown, no code fences):
{"results": [{"index": 0, "is_viable": true, ...}, {"index": 1, "is_viable": false}, ...]}`,
        messages: [
          {
            role: 'user',
            content: `Evaluate these ${batch.length} dead YC startups for solo builder opportunities:\n\n${companiesText}`,
          },
        ],
      });

      let text = response.content[0].text.trim();
      if (text.startsWith('```')) {
        text = text.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
      }
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch {
        // Retry once on JSON parse failure (Haiku can be flaky with structured output)
        await sleep(500);
        const retry = await anthropic.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 4000,
          messages: [
            { role: 'user', content: `Fix this invalid JSON and return ONLY valid JSON, nothing else:\n\n${text}` },
          ],
        });
        let retryText = retry.content[0].text.trim();
        if (retryText.startsWith('```')) {
          retryText = retryText.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
        }
        parsed = JSON.parse(retryText);
      }

      for (const r of parsed.results || []) {
        if (r.index >= 0 && r.index < batch.length && r.is_viable) {
          results.push({
            company: batch[r.index],
            ai: r,
          });
        }
      }

      const viable = (parsed.results || []).filter((r) => r.is_viable).length;
      const rejected = batch.length - viable;
      console.log(`  Batch ${Math.floor(i / AI_BATCH_SIZE) + 1}: ${viable} viable, ${rejected} rejected`);
    } catch (err) {
      console.warn(`  AI batch filter failed: ${err.message}. Skipping batch.`);
    }

    if (i + AI_BATCH_SIZE < companies.length) await sleep(1000);
  }

  return results;
}

function parseBatchYear(batch) {
  if (!batch) return null;
  // Extract year from batch like "Winter 2012", "Summer 2019", "S21", "W23"
  const yearMatch = batch.match(/(\d{4})/);
  if (yearMatch) return yearMatch[1];
  // Handle short format: S21 -> 2021, W23 -> 2023
  const shortMatch = batch.match(/[SWsw](\d{2})/);
  if (shortMatch) {
    const yr = parseInt(shortMatch[1]);
    return `20${yr < 50 ? yr.toString().padStart(2, '0') : yr}`;
  }
  return null;
}

function transformResult(item) {
  const { company, ai } = item;

  const batchYear = parseBatchYear(ai.failure_analysis?.batch || company.batch);
  const publishedAt = batchYear ? new Date(`${batchYear}-06-01`).toISOString() : null;

  return {
    idea_title: (ai.problem_title || company.one_liner || company.name).slice(0, 200),
    idea_description: ai.problem_description || null,
    category: ['Tool', 'Template', 'Prompt', 'Article', 'Other'].includes(ai.category) ? ai.category : 'Tool',
    industry: ai.industry || mapIndustry(company.industry),
    source: 'yc',
    source_url: company.url || `https://www.ycombinator.com/companies/${company.slug}`,
    external_id: `yc-${company.id}`,
    tags: company.batch || null,
    country: null,
    published_at: publishedAt,
    approved: true,
    name: company.name,
    email: null,
    meta: {
      failure_analysis: {
        company_name: ai.failure_analysis?.company_name || company.name,
        batch: ai.failure_analysis?.batch || company.batch || null,
        team_size: ai.failure_analysis?.team_size || company.team_size || null,
        failure_reason: ai.failure_analysis?.failure_reason || null,
        what_changed: ai.failure_analysis?.what_changed || null,
        rebuild_angle: ai.failure_analysis?.rebuild_angle || null,
        original_one_liner: ai.failure_analysis?.original_one_liner || company.one_liner || null,
      },
    },
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
    if (!anthropic) {
      console.error('ANTHROPIC_API_KEY required for YC sync (Claude evaluates each company)');
      process.exit(1);
    }

    // Fetch all YC companies
    const inactive = await fetchYCCompanies();

    // Skip already-synced companies
    const existingIds = await getExistingIds();
    const newCompanies = inactive.filter((c) => !existingIds.has(`yc-${c.id}`));
    console.log(`New companies to evaluate: ${newCompanies.length} (${existingIds.size} already synced)`);

    if (newCompanies.length === 0) {
      console.log('No new companies to process. Done.');
      return;
    }

    // AI batch filter: evaluate all new companies
    console.log('\nRunning AI evaluation...');
    const viable = await aiBatchFilter(newCompanies);
    console.log(`\n${viable.length} viable ideas from ${newCompanies.length} dead startups`);

    if (viable.length === 0) {
      console.log('No viable ideas found. Done.');
      return;
    }

    // Transform to ideas format
    const ideas = viable.map(transformResult);

    // Dedup by external_id
    const unique = new Map();
    for (const idea of ideas) {
      unique.set(idea.external_id, idea);
    }
    const dedupedIdeas = Array.from(unique.values());

    console.log(`Total: ${dedupedIdeas.length} unique ideas`);

    await syncToSupabase(dedupedIdeas);
    console.log('Sync complete.');
  } catch (err) {
    console.error('Sync failed:', err.message);
    process.exit(1);
  }
}

main();
