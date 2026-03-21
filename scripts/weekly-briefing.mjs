import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { resolve, dirname } from 'path';
config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../apps/web/.env'), quiet: true });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing env vars: SUPABASE_URL or VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// CLI flags
const weeksBack = (() => {
  const idx = process.argv.indexOf('--weeks');
  return idx !== -1 && process.argv[idx + 1] ? parseInt(process.argv[idx + 1], 10) : 1;
})();
const pretty = process.argv.includes('--pretty');

// Date ranges
const now = new Date();
const weekEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate());
const weekStart = new Date(weekEnd);
weekStart.setDate(weekStart.getDate() - (7 * weeksBack));
const prevWeekStart = new Date(weekStart);
prevWeekStart.setDate(prevWeekStart.getDate() - 7);

const SELECT_FIELDS = 'id, idea_title, source, category, industry, verdict, confidence, flylabs_score, hormozi_score, koe_score, okamoto_score, yc_score, composite_score, validation_score, score_breakdown, enrichment, meta, published_at, created_at';

// Paginated fetch to handle >1000 rows
async function fetchAllIdeas(from, to) {
  const PAGE_SIZE = 1000;
  let page = 0;
  let allData = [];
  let hasMore = true;

  while (hasMore) {
    const rangeFrom = page * PAGE_SIZE;
    const rangeTo = rangeFrom + PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from('ideas')
      .select(SELECT_FIELDS)
      .eq('approved', true)
      .gte('created_at', from.toISOString())
      .lt('created_at', to.toISOString())
      .range(rangeFrom, rangeTo);

    if (error) {
      console.error('Supabase query error:', error.message);
      process.exit(1);
    }

    allData = allData.concat(data);
    hasMore = data.length === PAGE_SIZE;
    page++;
  }

  return allData;
}

async function fetchTotalCount() {
  const { count, error } = await supabase
    .from('ideas')
    .select('id', { count: 'exact', head: true })
    .eq('approved', true);

  if (error) {
    console.error('Count query error:', error.message);
    return 0;
  }
  return count;
}

// Extract one_liner from score_breakdown
function getOneLiner(idea) {
  try {
    const breakdown = typeof idea.score_breakdown === 'string'
      ? JSON.parse(idea.score_breakdown)
      : idea.score_breakdown;
    return breakdown?.synthesis?.one_liner || '';
  } catch {
    return '';
  }
}

// Build the briefing
async function buildBriefing() {
  console.error(`Fetching ideas from ${weekStart.toISOString().slice(0, 10)} to ${weekEnd.toISOString().slice(0, 10)}...`);

  const [thisWeek, prevWeek, totalCount] = await Promise.all([
    fetchAllIdeas(weekStart, weekEnd),
    fetchAllIdeas(prevWeekStart, weekStart),
    fetchTotalCount(),
  ]);

  console.error(`This week: ${thisWeek.length} ideas. Previous week: ${prevWeek.length} ideas. Total: ${totalCount}.`);

  // Verdict counts
  const verdicts = { BUILD: 0, VALIDATE_FIRST: 0, SKIP: 0 };
  for (const idea of thisWeek) {
    if (idea.verdict && verdicts[idea.verdict] !== undefined) {
      verdicts[idea.verdict]++;
    }
  }

  // Source breakdown
  const sources = {};
  for (const idea of thisWeek) {
    const src = idea.source || 'unknown';
    if (!sources[src]) sources[src] = { total: 0, builds: 0 };
    sources[src].total++;
    if (idea.verdict === 'BUILD') sources[src].builds++;
  }

  // Industry breakdown
  const industries = {};
  for (const idea of thisWeek) {
    const ind = idea.industry || 'Other';
    industries[ind] = (industries[ind] || 0) + 1;
  }

  // FL score stats
  const flScores = thisWeek.filter(i => i.flylabs_score != null).map(i => i.flylabs_score);
  const avgFl = flScores.length > 0 ? Math.round((flScores.reduce((a, b) => a + b, 0) / flScores.length) * 10) / 10 : 0;
  const highestFl = flScores.length > 0 ? Math.max(...flScores) : 0;

  // Build rate
  const totalScored = thisWeek.filter(i => i.verdict).length;
  const buildRate = totalScored > 0 ? Math.round((verdicts.BUILD / totalScored) * 1000) / 10 : 0;

  // All BUILD ideas (sorted by FL score desc)
  const builds = thisWeek
    .filter(i => i.verdict === 'BUILD')
    .sort((a, b) => (b.flylabs_score || 0) - (a.flylabs_score || 0))
    .map(i => ({ ...i, one_liner: getOneLiner(i) }));

  // Top 5 non-BUILD ideas (fallback if no BUILDs)
  const topNonBuild = thisWeek
    .filter(i => i.verdict === 'VALIDATE_FIRST')
    .sort((a, b) => (b.flylabs_score || 0) - (a.flylabs_score || 0))
    .slice(0, 5)
    .map(i => ({ ...i, one_liner: getOneLiner(i) }));

  // Week over week
  const prevVerdicts = { BUILD: 0, VALIDATE_FIRST: 0, SKIP: 0 };
  for (const idea of prevWeek) {
    if (idea.verdict && prevVerdicts[idea.verdict] !== undefined) {
      prevVerdicts[idea.verdict]++;
    }
  }
  const prevTotalScored = prevWeek.filter(i => i.verdict).length;
  const prevBuildRate = prevTotalScored > 0 ? Math.round((prevVerdicts.BUILD / prevTotalScored) * 1000) / 10 : 0;

  const totalChange = thisWeek.length - prevWeek.length;
  const buildRateChange = Math.round((buildRate - prevBuildRate) * 10) / 10;

  // Daily breakdown (for evolution chart)
  const dailyBreakdown = [];
  const dayMs = 24 * 60 * 60 * 1000;
  for (let d = new Date(weekStart); d < weekEnd; d = new Date(d.getTime() + dayMs)) {
    const dayStr = d.toISOString().slice(0, 10);
    const nextDay = new Date(d.getTime() + dayMs);
    const dayIdeas = thisWeek.filter(i => {
      const created = new Date(i.created_at);
      return created >= d && created < nextDay;
    });
    dailyBreakdown.push({
      date: dayStr,
      total: dayIdeas.length,
      build: dayIdeas.filter(i => i.verdict === 'BUILD').length,
      validate: dayIdeas.filter(i => i.verdict === 'VALIDATE_FIRST').length,
      skip: dayIdeas.filter(i => i.verdict === 'SKIP').length,
    });
  }

  const briefing = {
    week: {
      start: weekStart.toISOString().slice(0, 10),
      end: weekEnd.toISOString().slice(0, 10),
      weeks_covered: weeksBack,
    },
    summary: {
      total_new: thisWeek.length,
      verdicts,
      build_rate: buildRate,
      avg_fl_score: avgFl,
      highest_fl_score: highestFl,
    },
    sources,
    industries,
    builds,
    top_5_non_build: topNonBuild,
    week_over_week: {
      total_change: `${totalChange >= 0 ? '+' : ''}${totalChange}`,
      build_rate_change: `${buildRateChange >= 0 ? '+' : ''}${buildRateChange}pp`,
      prev_week_total: prevWeek.length,
    },
    all_time: {
      total_ideas: totalCount,
    },
    daily_breakdown: dailyBreakdown,
  };

  // Output to stdout (logs go to stderr)
  console.log(JSON.stringify(briefing, null, pretty ? 2 : 0));
}

buildBriefing().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
