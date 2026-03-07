# Supabase Setup

This document describes the database schema and Row Level Security (RLS) policies for FlyLabs.

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
| `ideas` | Community idea submissions + ProblemHunt/Reddit/Product Hunt imports with voting, AI scoring, and enrichment |
| `idea_rate_limits` | Rate limiting for idea submissions (max 3 per email per 24h) |
| `prompt_votes` | Upvotes on prompts |
| `prompt_comments` | Comments on prompts |
| `waitlist` | Email capture for micro tools and library |

### Ideas Table Columns

id, idea_title, idea_description (nullable), category, industry (nullable), source (default 'community'), source_url, external_id (dedup key), tags, country, name, email (nullable), votes, approved, status, frequency, existing_solutions, hormozi_score, koe_score, okamoto_score, score_breakdown (JSONB), enrichment (JSONB), validation_score (integer), created_at

## RPCs

| Function | Purpose |
|----------|---------|
| `increment_vote(idea_id)` | Atomic vote increment for ideas |
| `toggle_prompt_vote(p_prompt_id)` | Toggle vote on prompt, returns `{ count }` |
| `get_prompt_vote_counts()` | Returns vote counts for all prompts (SECURITY DEFINER) |
| `get_waitlist_count(p_source)` | Returns waitlist count (no email exposure) |
| `check_idea_rate_limit(p_email)` | Returns count of submissions in last 24h |
| `log_idea_submission(p_email)` | Logs a submission for rate limiting |

## RLS Policies

- **profiles**: Users can select/insert/update own profile
- **ideas**: Public select where `approved = true`; anyone can insert
- **prompt_votes**: Authenticated users can select, insert, delete own
- **prompt_comments**: Authenticated users can select all, insert/delete own
- **waitlist**: Anyone can insert; no public select (use `get_waitlist_count` RPC for counts)

## New Project Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run migrations in order (or use `supabase db push`)
3. Enable Email and Google auth in Authentication > Providers
4. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to `.env`

## Existing Projects

If you already have tables, run the migrations anyway. They use `CREATE TABLE IF NOT EXISTS` and `CREATE OR REPLACE FUNCTION`, so existing tables are preserved. The new `get_waitlist_count` RPC is required for the Micro Tools waitlist count to display.
