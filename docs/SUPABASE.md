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
| `ideas` | Community idea submissions with voting |
| `prompt_votes` | Upvotes on prompts |
| `prompt_comments` | Comments on prompts |
| `waitlist` | Email capture for micro tools |

## RPCs

| Function | Purpose |
|----------|---------|
| `increment_vote(idea_id)` | Atomic vote increment for ideas |
| `toggle_prompt_vote(p_prompt_id)` | Toggle vote on prompt, returns `{ count }` |
| `get_waitlist_count(p_source)` | Returns waitlist count (no email exposure) |

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
