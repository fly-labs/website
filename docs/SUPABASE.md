# Supabase Setup

This document describes the database schema, Row Level Security (RLS) policies, RPCs, and scoring system for FlyLabs.

## Migrations

Migrations live in `supabase/migrations/` and can be applied with:

```bash
# If using Supabase CLI (linked to your project)
supabase db push
```

Or apply manually in the [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql).

## Schema Overview

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles (synced with auth.users) |
| `ideas` | Community + automated idea submissions with AI scoring, validation, and enrichment |
| `idea_rate_limits` | Rate limiting for idea submissions (max 3 per email per 24h) |
| `prompt_votes` | Upvotes on prompts (one per user per prompt) |
| `prompt_comments` | Comments on prompts |
| `waitlist` | Email capture for micro tools, library, and other features |
| `conversations` | FlyBot chat conversations (soft delete) |
| `messages` | FlyBot chat messages (user + assistant) |
| `flybot_waitlist` | FlyBot beta waitlist (email capture after message limit) |

## Table Details

### profiles

User profiles, automatically created on signup and synced with `auth.users`.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK, references `auth.users(id)` |
| `name` | text | Display name |
| `phone` | text | Phone number |
| `country` | text | Country |
| `city` | text | City |
| `age` | integer | Age |
| `gender` | text | Gender |
| `bio` | text | Short bio |
| `avatar_url` | text | Avatar image URL |
| `updated_at` | timestamptz | Last profile update |

### ideas

Community submissions and automated imports from 8 external sources. Each idea goes through AI scoring (5 frameworks) and optional enrichment (dual-source validation).

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | uuid | gen_random_uuid() | PK |
| `idea_title` | text | | Required |
| `idea_description` | text | | Nullable, longer description |
| `category` | text | | Tool, Template, Prompt, Article, or Other |
| `industry` | text | | Nullable, 30 domain verticals (Marketing & Sales, Developer Tools, Health & Fitness, etc.) |
| `source` | text | 'community' | One of: community, problemhunt, reddit, producthunt, x, hackernews, github, yc |
| `source_url` | text | | Link to original post/product/issue |
| `external_id` | text | | Unique dedup key per source (e.g. `reddit-abc123`, `yc-42`, `github-999`) |
| `tags` | text[] | | Array of tags |
| `country` | text | | Country of origin |
| `name` | text | | Submitter name (community submissions) |
| `email` | text | | Nullable, submitter email |
| `votes` | integer | 0 | Community upvote count |
| `approved` | boolean | false | Visibility flag (RLS filters on this) |
| `status` | text | | open, building, or shipped |
| `frequency` | text | | Daily, Weekly, Sometimes, Once |
| `existing_solutions` | text | | Known alternatives |
| `flylabs_score` | integer | | 0-100, Fly Labs Method score (THE score) |
| `hormozi_score` | integer | | 0-100, Hormozi Value Equation (expert perspective, detail page only) |
| `koe_score` | integer | | 0-100, Dan Koe One-Person Business (expert perspective, detail page only) |
| `okamoto_score` | integer | | 0-100, Okamoto MicroSaaS (expert perspective, detail page only) |
| `yc_score` | integer | | 0-100, YC Lens (expert perspective, detail page only) |
| `score_breakdown` | jsonb | | Per-framework pillar scores + reasoning + synthesis (verdict, reasoning, next_steps) |
| `enrichment` | jsonb | | Validation data: evidence, competitors, summary, confidence level, evidence_count, enrichment verdict |
| `validation_score` | integer | | 0-100, computed from enrichment evidence |
| `verdict` | text | | Materialized: BUILD, VALIDATE_FIRST, or SKIP |
| `confidence` | text | | Materialized: high, medium, or low |
| `composite_score` | numeric | | Materialized FL score (= flylabs_score, backward compat) |
| `published_at` | timestamptz | | Original publication date from source (tweet date, Reddit created_utc, etc.). Falls back to created_at in frontend |
| `meta` | jsonb | | Source-specific context. Currently used for YC ideas (failure_analysis: failure_reason, what_changed, rebuild_angle) |
| `created_at` | timestamptz | now() | Row creation time |
| `updated_at` | timestamptz | | Auto-updated via database trigger on any row change |

**Indexes:**
- Unique index on `external_id` (deduplication across syncs)
- Index on `flylabs_score` (sorting)
- Index on `composite_score` (sorting)
- Index on `verdict` (filtering)

**score_breakdown JSONB structure:**

```json
{
  "flylabs": { "total": 78, "pillars": { "problem_clarity": 24, "solution_gap": 20, "willingness_to_act": 18, "buildability": 16 }, "reasoning": "..." },
  "hormozi": { "total": 72, "pillars": { "dream_outcome": 6, "likelihood": 5, "speed": 5, "effort": 4 }, "reasoning": "..." },
  "koe": { "total": 68, "pillars": { ... }, "reasoning": "..." },
  "okamoto": { "total": 74, "pillars": { ... }, "reasoning": "..." },
  "synthesis": { "verdict": "BUILD", "reasoning": "...", "next_steps": ["..."] }
}
```

**enrichment JSONB structure:**

```json
{
  "validation": { "evidence": ["..."], "summary": "..." },
  "competitors": [{ "name": "...", "url": "...", "gap": "..." }],
  "confidence": "high",
  "evidence_count": 12,
  "verdict": { "recommendation": "BUILD", "reasoning": "...", "confidence": "high" }
}
```

### idea_rate_limits

Rate limiting table for community idea submissions. Maximum 3 submissions per email address per 24-hour window. RLS enabled, accessed exclusively via RPCs.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `email` | text | Submitter email |
| `created_at` | timestamptz | Submission timestamp |

### prompt_votes

One vote per user per prompt. Toggle behavior handled by `toggle_prompt_vote` RPC.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `user_id` | uuid | References `auth.users(id)` |
| `prompt_id` | text | Prompt identifier (matches frontend prompt data) |
| `created_at` | timestamptz | Vote timestamp |

**Constraints:** Unique on `(user_id, prompt_id)`.

### prompt_comments

Comments on prompts by authenticated users.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `user_id` | uuid | References `auth.users(id)` |
| `prompt_id` | text | Prompt identifier |
| `content` | text | Comment body |
| `created_at` | timestamptz | Comment timestamp |

### waitlist

Email capture for various features (micro tools, library ebooks, future products). Unique constraint on `(email, source)` prevents duplicate signups per feature.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `email` | text | Subscriber email |
| `source` | text | Feature identifier (e.g. `microsaas`, `library-ai-builders-toolkit`) |
| `created_at` | timestamptz | Signup timestamp |

### conversations

FlyBot chat conversations. Soft delete via `deleted_at` column.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `user_id` | uuid | References `auth.users(id)` |
| `title` | text | Auto-generated from first message |
| `deleted_at` | timestamptz | Soft delete timestamp |
| `created_at` | timestamptz | Conversation start time |

### messages

FlyBot chat messages (user and assistant roles).

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `conversation_id` | uuid | References `conversations(id)` |
| `role` | text | 'user' or 'assistant' |
| `content` | text | Message body |
| `created_at` | timestamptz | Message timestamp |

### flybot_waitlist

Email capture for users who hit the FlyBot message limit during beta.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `email` | text | User email |
| `message_count` | integer | Messages sent before hitting limit |
| `created_at` | timestamptz | Signup timestamp |

## RPCs

| Function | Purpose | Auth |
|----------|---------|------|
| `increment_vote(idea_id uuid)` | Atomic vote increment for ideas | Public |
| `toggle_prompt_vote(p_prompt_id text)` | Insert or delete a vote, returns `{ count }` | Authenticated |
| `get_prompt_vote_counts()` | Returns all prompt vote counts (no user data exposed) | SECURITY DEFINER |
| `get_waitlist_count(p_source text)` | Returns subscriber count for a source (no email exposure) | Public |
| `check_idea_rate_limit(p_email text)` | Returns count of submissions by this email in last 24h | Public |
| `log_idea_submission(p_email text)` | Logs a submission for rate limiting. Includes honeypot defense | Public |
| `get_user_message_count(p_user_id uuid)` | Returns FlyBot message count for a user | Authenticated |

## RLS Policies

All tables have RLS enabled.

| Table | Policy | Who | Rule |
|-------|--------|-----|------|
| `profiles` | Select own | Authenticated | `auth.uid() = id` |
| `profiles` | Insert own | Authenticated | `auth.uid() = id` |
| `profiles` | Update own | Authenticated | `auth.uid() = id` |
| `ideas` | Public read | Anyone | `approved = true` |
| `ideas` | Public insert | Anyone | All columns |
| `idea_rate_limits` | RLS enabled | N/A | Accessed exclusively via RPCs |
| `prompt_votes` | Select own | Authenticated | `auth.uid() = user_id` |
| `prompt_votes` | Insert own | Authenticated | `auth.uid() = user_id` |
| `prompt_votes` | Delete own | Authenticated | `auth.uid() = user_id` |
| `prompt_comments` | Select all | Authenticated | All rows |
| `prompt_comments` | Insert own | Authenticated | `auth.uid() = user_id` |
| `prompt_comments` | Delete own | Authenticated | `auth.uid() = user_id` |
| `waitlist` | Insert | Anyone | All columns |
| `waitlist` | No select | N/A | Use `get_waitlist_count` RPC for counts |
| `conversations` | Select own | Authenticated | `auth.uid() = user_id AND deleted_at IS NULL` |
| `conversations` | Insert own | Authenticated | `auth.uid() = user_id` |
| `conversations` | Update own | Authenticated | `auth.uid() = user_id` |
| `messages` | Select via conv | Authenticated | User owns the conversation |
| `messages` | Insert via conv | Authenticated | User owns the conversation |
| `flybot_waitlist` | Insert | Anyone | All columns |

## Scoring System

Ideas are scored by Claude Sonnet 4 across 5 frameworks via `scripts/score-ideas.mjs`.

### Frameworks

The FL score IS the score. Expert scores are stored in `score_breakdown` for the detail page only.

| Framework | Role | Score Range | Focus |
|-----------|------|-------------|-------|
| Fly Labs Method | THE score (composite_score = flylabs_score) | 0-100 | Problem Clarity (30pts), Solution Gap (25pts), Willingness to Act (25pts), Buildability (20pts) |
| Hormozi Value Equation | Expert perspective (detail page) | 0-100 | Dream Outcome, Likelihood, Speed, Effort |
| Dan Koe One-Person Business | Expert perspective (detail page) | 0-100 | 7 dimensions for solo creator viability |
| Okamoto MicroSaaS | Expert perspective (detail page) | 0-100 | 6 dimensions for micro-SaaS validation |

### Verdict Rules

| Verdict | Condition |
|---------|-----------|
| **BUILD** | FL >= 65 AND buildable |
| **VALIDATE_FIRST** | FL 40-64 |
| **SKIP** | FL < 40 |

The `verdict`, `confidence`, and `composite_score` columns are materialized by the scoring and enrichment scripts. They are not computed at query time.

## Enrichment System

Top-scoring ideas are enriched via `scripts/enrich-ideas.mjs` with dual-source validation.

- **Primary:** Grok xAI API with `x_search` tool (always available)
- **Secondary:** Reddit API with OAuth auto-upgrade (best-effort)
- **Synthesis:** Claude combines evidence from both sources, assigns confidence level (high/medium/low), counts evidence items, and produces an enrichment verdict (BUILD/VALIDATE_FIRST/SKIP)
- **Threshold:** Only ideas with FL score >= 40 are enriched
- **Schedule:** Daily at 4 AM UTC via GitHub Actions

Results are stored in the `enrichment` JSONB column and `validation_score` integer column.

## Idea Sources

| Source | Sync Script | External ID Format | Schedule |
|--------|-------------|-------------------|----------|
| community | Manual submissions | None (uuid) | On submit |
| problemhunt | `scripts/sync-problemhunt.mjs` | `problemhunt-{uid}` | Daily |
| reddit | `scripts/sync-reddit.mjs` | `reddit-{post_id}` | Daily |
| producthunt | `scripts/sync-producthunt.mjs` | `producthunt-{id}` | Daily |
| x | `scripts/sync-x.mjs` | `x-{tweet_id}` | Daily |
| hackernews | `scripts/sync-hackernews.mjs` | `hackernews-{id}` | Daily |
| github | `scripts/sync-github.mjs` | `github-{id}` | Daily |
| yc | `scripts/sync-yc.mjs` | `yc-{id}` | Daily |

All sync scripts run together via the "Sync Ideas" GitHub Actions workflow (daily at 6 AM UTC). Sync scripts use Claude Haiku for filtering. New ideas are automatically scored by Claude Sonnet after sync.

## New Project Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run migrations in order (or use `supabase db push`)
3. Enable Email and Google auth in Authentication > Providers
4. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to `.env`
5. Add `SUPABASE_SERVICE_ROLE_KEY` to `.env` for scripts (scoring, sync, enrichment)

## Existing Projects

If you already have tables, run the migrations anyway. They use `CREATE TABLE IF NOT EXISTS` and `CREATE OR REPLACE FUNCTION`, so existing tables are preserved.
