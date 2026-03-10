import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { resolve, dirname } from 'path';
config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../apps/web/.env') });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // Optional, for higher rate limits

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const anthropic = ANTHROPIC_API_KEY ? new Anthropic({ apiKey: ANTHROPIC_API_KEY }) : null;

const AI_BATCH_SIZE = 15;
const REQUEST_DELAY = 2000; // GitHub API: be polite
const MAX_RESULTS_PER_QUERY = 30;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Mega-repos that produce IDE/framework/infra wishlists, not business opportunities
const EXCLUDED_REPOS = new Set([
  // Editors/IDEs
  'microsoft/vscode', 'microsoft/terminal', 'microsoft/TypeScript',
  'microsoft/vscode-remote-release', 'microsoft/Git-Credential-Manager-for-Windows',
  'atom/atom', 'atom/find-and-replace',
  'JetBrains/intellij-community', 'neovim/neovim', 'vim/vim',
  // Frontend frameworks
  'facebook/react', 'angular/angular', 'vuejs/vue', 'vuejs/core',
  'vercel/next.js', 'sveltejs/svelte', 'flutter/flutter',
  // Runtimes/languages
  'electron/electron', 'nodejs/node', 'denoland/deno',
  'golang/go', 'rust-lang/rust', 'python/cpython',
  'dart-lang/sdk', 'apple/swift', 'dotnet/runtime',
  // Infrastructure
  'kubernetes/kubernetes', 'docker/compose', 'hashicorp/terraform',
  'torvalds/linux', 'systemd/systemd',
  // Web frameworks
  'jekyll/jekyll', 'rails/rails', 'django/django', 'laravel/framework',
  'spring-projects/spring-boot', 'pallets/flask',
  // Package managers / build tools
  'npm/cli', 'yarnpkg/yarn', 'pnpm/pnpm', 'webpack/webpack',
  // Misc mega-repos from first run
  'springfox/springfox', 'debug-js/debug',
  'git-lfs/git-lfs', 'argoproj/argo-cd', 'cilium/cilium',
  'firebase/firebase-js-sdk', 'firebase/firebase-tools',
  'bluesky-social/social-app', 'coldfix/udiskie',
  'joeyespo/grip', 'hashicorp/nomad',
  'django-oauth/django-oauth-toolkit',
]);

// 6 search queries targeting pain points in issues
// No label filters (most repos don't use standardized labels)
// Mega-repo exclusion + strict AI filter do the quality work
// Rotate 2 per daily run (same pattern as sync-x.mjs)
const SEARCH_QUERIES = [
  '"I wish there was" OR "would pay for" OR "willing to pay"',
  '"pain point" OR "workaround" OR "no good solution"',
  '"need a tool" OR "looking for a solution" OR "looking for a way"',
  '"missing feature" OR "no way to" OR "impossible to"',
  '"manually" OR "time-consuming" OR "tedious" OR "repetitive"',
  '"better alternative" OR "alternative to" OR "replacement for"',
];

function getRotatedQueries() {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000
  );
  const startIndex = (dayOfYear * 2) % SEARCH_QUERIES.length;
  return [
    SEARCH_QUERIES[startIndex],
    SEARCH_QUERIES[(startIndex + 1) % SEARCH_QUERIES.length],
  ];
}

async function searchIssues(query) {
  const url = `https://api.github.com/search/issues?q=${encodeURIComponent(
    query + ' is:issue is:open'
  )}&sort=reactions&order=desc&per_page=${MAX_RESULTS_PER_QUERY}`;

  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'FlyLabs-Sync/1.0 (https://flylabs.fun)',
  };
  if (GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
  }

  const res = await fetch(url, { headers });

  if (!res.ok) {
    if (res.status === 403) {
      console.warn('GitHub API rate limit reached. Try setting GITHUB_TOKEN for higher limits.');
      return [];
    }
    throw new Error(`GitHub API error ${res.status}: ${res.statusText}`);
  }

  const data = await res.json();
  return data.items || [];
}

// AI batch filter: evaluate issues for real buildable problems
async function aiBatchFilter(issues) {
  if (!anthropic || issues.length === 0) {
    return issues.map((i) => ({
      ...i,
      _ai: { is_real_problem: false, category: 'Tool', reason: 'AI filter skipped' },
    }));
  }

  const results = [];

  for (let i = 0; i < issues.length; i += AI_BATCH_SIZE) {
    const batch = issues.slice(i, i + AI_BATCH_SIZE);
    const issuesText = batch
      .map((issue, idx) => {
        const body = issue.body ? issue.body.replace(/<[^>]+>/g, '').slice(0, 300) : '';
        return `[${idx}] Title: ${issue.title}\nRepo: ${issue.repository_url?.split('/').slice(-2).join('/') || 'unknown'}\n${body ? `Body: ${body}` : ''}`;
      })
      .join('\n\n---\n\n');

    try {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        system: `You are a STRICT filter for an idea lab that surfaces real business opportunities. Be very selective (reject 70%+).

For each GitHub issue, determine:
- is_real_problem (boolean): TRUE ONLY if this describes a problem that someone could build a STANDALONE product, tool, or SaaS to solve AND people would pay for it. The problem must exist beyond the specific repo.
- category (Tool/Template/Prompt/Article/Other): What type of solution would address this?
- reason (string): One sentence explaining your decision

REJECT (is_real_problem = false):
- Feature requests that only make sense inside that specific project (e.g., "add vertical tabs to VS Code")
- Bug reports, typos, documentation fixes, CI/CD issues
- Internal tooling, config options, or settings requests
- Highly niche technical issues (< 1000 people affected)
- Issues that are already solved by existing popular tools
- Migration requests or version upgrade issues
- Issues about editor/IDE features (syntax highlighting, keybindings, themes)
- Protocol or spec compliance requests
- Performance optimizations within a specific tool

ACCEPT only when ALL of these are true:
1. The pain point exists ACROSS many users/projects (not just users of this specific repo)
2. A founder could build a STANDALONE product to solve it (not a PR to this repo)
3. Someone would realistically pay for the solution
4. It's NOT a feature request that the maintainers of THIS project should implement themselves
5. There are signals of pain severity (significant reactions, multiple people confirming, or workaround descriptions)

Return ONLY valid JSON (no markdown, no code fences):
{"results": [{"index": 0, "is_real_problem": true, "category": "Tool", "reason": "..."}, ...]}`,
        messages: [
          {
            role: 'user',
            content: `Evaluate these ${batch.length} GitHub issues:\n\n${issuesText}`,
          },
        ],
      });

      let text = response.content[0].text.trim();
      if (text.startsWith('```')) {
        text = text.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
      }
      const parsed = JSON.parse(text);

      for (const r of parsed.results || []) {
        if (r.index >= 0 && r.index < batch.length) {
          batch[r.index]._ai = {
            is_real_problem: r.is_real_problem,
            category: r.category,
            reason: r.reason,
          };
        }
      }
    } catch (err) {
      console.warn(`  AI batch filter failed: ${err.message}. Passing batch through.`);
      for (const issue of batch) {
        if (!issue._ai)
          issue._ai = { is_real_problem: false, category: 'Tool', reason: 'AI filter error' };
      }
    }

    results.push(...batch);
    if (i + AI_BATCH_SIZE < issues.length) await sleep(1000);
  }

  return results;
}

// Industry mapping based on repo name and issue content
const INDUSTRY_KEYWORDS = {
  Ai: ['ai', 'machine-learning', 'llm', 'gpt', 'openai', 'langchain', 'transformers'],
  Dev: ['developer', 'sdk', 'cli', 'api', 'framework', 'library', 'devops', 'docker', 'kubernetes'],
  Finance: ['finance', 'payment', 'stripe', 'invoice', 'accounting', 'fintech', 'crypto'],
  Productivity: ['productivity', 'workflow', 'automation', 'notion', 'todoist', 'calendar'],
  'Marketing Sales': ['marketing', 'seo', 'analytics', 'email', 'crm', 'hubspot'],
  Education: ['education', 'learning', 'course', 'lms', 'edtech'],
  'Design Creative': ['design', 'figma', 'ui', 'ux', 'css', 'tailwind'],
  Ecommerce: ['ecommerce', 'shopify', 'store', 'cart', 'checkout'],
  'No Code': ['no-code', 'nocode', 'low-code', 'zapier', 'retool'],
  'Medicine Health': ['health', 'medical', 'fitness', 'wellness'],
};

function detectIndustry(issue) {
  const repoName = issue.repository_url?.split('/').slice(-2).join('/') || '';
  const text = `${repoName} ${issue.title} ${(issue.body || '').slice(0, 500)}`.toLowerCase();

  for (const [industry, keywords] of Object.entries(INDUSTRY_KEYWORDS)) {
    for (const kw of keywords) {
      if (text.includes(kw)) return industry;
    }
  }
  return 'Other';
}

function transformIssue(issue) {
  const category =
    issue._ai?.category &&
    ['Tool', 'Template', 'Prompt', 'Article', 'Other'].includes(issue._ai.category)
      ? issue._ai.category
      : 'Tool';

  const repoFullName = issue.repository_url?.split('/').slice(-2).join('/') || null;

  return {
    idea_title: issue.title.replace(/^\[(?:Feature Request|Enhancement|Bug|Help Wanted|RFC)\]\s*/i, '').replace(/^(?:Feature Request|Enhancement):\s*/i, '').slice(0, 200),
    idea_description: issue.body ? issue.body.replace(/<[^>]+>/g, '').slice(0, 2000) : null,
    category,
    industry: detectIndustry(issue),
    source: 'github',
    source_url: issue.html_url,
    external_id: `github-${issue.id}`,
    tags: repoFullName,
    country: null,
    published_at: issue.created_at,
    approved: true,
    name: issue.user?.login ? `@${issue.user.login}` : 'Anonymous',
    email: null,
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
    const queries = getRotatedQueries();
    console.log(`Running GitHub Issues sync with ${queries.length} search queries...`);
    if (GITHUB_TOKEN) {
      console.log('GitHub token detected (5,000 req/hr)');
    } else {
      console.log('No GitHub token (60 req/hr). Set GITHUB_TOKEN for higher limits.');
    }

    const allIssues = new Map(); // Dedup by issue ID

    for (let i = 0; i < queries.length; i++) {
      console.log(`\nSearch ${i + 1}: ${queries[i].slice(0, 80)}...`);
      const issues = await searchIssues(queries[i]);
      console.log(`  Found ${issues.length} issues`);

      for (const issue of issues) {
        // Skip PRs
        if (issue.pull_request) continue;

        // Skip mega-repos (produce IDE wishlists, not business opportunities)
        const repoFullName = issue.repository_url?.split('/').slice(-2).join('/');
        if (repoFullName && EXCLUDED_REPOS.has(repoFullName)) continue;

        // Hard filters: enough engagement to signal real demand
        if ((issue.reactions?.total_count || 0) < 5) continue;
        if ((issue.comments || 0) < 3) continue;

        // Skip very old issues (> 5 years) - stale problems
        const issueAge = Date.now() - new Date(issue.created_at).getTime();
        if (issueAge > 5 * 365 * 86400000) continue;

        if (!allIssues.has(issue.id)) {
          allIssues.set(issue.id, issue);
        }
      }

      if (i < queries.length - 1) await sleep(REQUEST_DELAY);
    }

    const dedupedIssues = Array.from(allIssues.values());
    console.log(`\n${dedupedIssues.length} unique issues passed hard filters`);

    if (dedupedIssues.length === 0) {
      console.log('No issues found. Done.');
      return;
    }

    // AI batch filter
    if (anthropic) {
      console.log('Running AI quality filter...');
    }
    const aiFiltered = await aiBatchFilter(dedupedIssues);
    const qualityIssues = aiFiltered.filter((i) => i._ai?.is_real_problem !== false);
    const rejected = aiFiltered.length - qualityIssues.length;
    if (rejected > 0)
      console.log(`AI filter: ${rejected} issues rejected, ${qualityIssues.length} passed`);

    const ideas = qualityIssues.map(transformIssue);

    // Dedup by external_id
    const unique = new Map();
    for (const idea of ideas) {
      unique.set(idea.external_id, idea);
    }
    const dedupedIdeas = Array.from(unique.values());

    console.log(`Total: ${dedupedIdeas.length} unique ideas`);

    if (dedupedIdeas.length === 0) {
      console.log('No ideas found. Done.');
      return;
    }

    await syncToSupabase(dedupedIdeas);
    console.log('Sync complete.');
  } catch (err) {
    console.error('Sync failed:', err.message);
    process.exit(1);
  }
}

main();
