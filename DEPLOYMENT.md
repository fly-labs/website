# Deployment Guide

How to fork this repo and deploy your own Fly Labs instance. Should take about 30 minutes.

## Prerequisites

- Node.js 20+ (check `.nvmrc` for exact version)
- A [Supabase](https://supabase.com) account (free tier works)
- A [Vercel](https://vercel.com) account (free tier works)
- An [Anthropic](https://console.anthropic.com) API key (for AI scoring)

## 1. Fork and Clone

```bash
# Fork the repo on GitHub, then:
git clone https://github.com/YOUR_USERNAME/website.git
cd website
npm install
```

This is a monorepo. The root `package.json` uses npm workspaces with the frontend at `apps/web/`.

## 2. Supabase Setup

1. Create a new project at [supabase.com/dashboard](https://supabase.com/dashboard)
2. Wait for the project to finish provisioning
3. Install the [Supabase CLI](https://supabase.com/docs/guides/cli) and link your project:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

4. Apply all migrations (21 files in `supabase/migrations/`):

```bash
supabase db push
```

Or paste each migration file into the [SQL Editor](https://supabase.com/dashboard/project/_/sql) manually, in order.

5. Enable Google OAuth (optional): go to Authentication > Providers > Google in your Supabase dashboard and add your Google OAuth credentials.

6. Seed data (optional): import ProblemHunt ideas to start with some content:

```bash
node supabase/seed-data/import-problemhunt.mjs
```

All RLS policies are included in the migrations. No extra security setup needed.

## 3. Environment Variables

Copy the example file and fill in your values:

```bash
cp apps/web/.env.example apps/web/.env
```

### Required for the frontend

| Variable | Where to find it |
|----------|-----------------|
| `VITE_SUPABASE_URL` | Supabase dashboard > Settings > API > Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase dashboard > Settings > API > anon/public key |

### Required for scoring and sync scripts

| Variable | Where to find it |
|----------|-----------------|
| `SUPABASE_URL` | Same as VITE_SUPABASE_URL (scripts read both) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase dashboard > Settings > API > service_role key. Never expose this to the client |
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) > API Keys |

### Optional (enable specific sync sources)

| Variable | What it enables | Where to get it |
|----------|----------------|-----------------|
| `VITE_GA_ID` | Google Analytics 4 tracking | GA4 dashboard > Admin > Data Streams |
| `XAI_API_KEY` | X/Twitter sync + idea enrichment via Grok | [x.ai](https://x.ai) API console |
| `PRODUCTHUNT_API_KEY` | Product Hunt sync | [producthunt.com/v2/oauth/applications](https://www.producthunt.com/v2/oauth/applications) |
| `PRODUCTHUNT_API_SECRET` | Product Hunt sync (paired with key above) | Same as above |
| `REDDIT_CLIENT_ID` | Higher Reddit rate limits (works without, just slower) | [reddit.com/prefs/apps](https://www.reddit.com/prefs/apps) - create a "script" app |
| `REDDIT_CLIENT_SECRET` | Paired with Reddit client ID | Same as above |
| `GITHUB_TOKEN` | 5,000 req/hr instead of 60 for GitHub sync | GitHub > Settings > Developer Settings > Personal Access Tokens |
| `R2_ACCOUNT_ID` | Music player storage | Cloudflare dashboard URL: `dash.cloudflare.com/ACCOUNT_ID` |
| `R2_ACCESS_KEY_ID` | Music player storage | Cloudflare R2 > Manage API Tokens |
| `R2_SECRET_ACCESS_KEY` | Music player storage | Same as above |
| `R2_BUCKET_NAME` | Music player storage (default: `flylabs-music`) | Your R2 bucket name |
| `R2_PUBLIC_URL` | Music player storage | R2 bucket settings > Public access URL |

The frontend runs fine with just the two `VITE_` Supabase variables. Everything else adds optional features.

## 4. Local Development

```bash
npm run dev
# Opens at http://localhost:3001
```

Other useful commands:

```bash
npm run build    # Production build (Vite)
npm run lint     # ESLint
npm run preview  # Preview production build locally
```

## 5. Vercel Deployment

1. Go to [vercel.com/new](https://vercel.com/new) and import your forked GitHub repo
2. Set the **Root Directory** to `apps/web`
3. Vercel auto-detects the Vite framework. No build settings to change
4. Add your environment variables in Vercel dashboard > Settings > Environment Variables. At minimum:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_GA_ID` (if you want analytics)
5. Deploy. Every push to `main` auto-deploys from here

The `vercel.json` at `apps/web/vercel.json` handles SPA rewrites (all routes serve `index.html`) and security headers (CSP, HSTS, X-Frame-Options, Permissions-Policy).

### Custom domain

In Vercel dashboard > Settings > Domains, add your domain and update DNS records as instructed.

### FlyBot serverless functions

The `apps/web/api/` directory contains Vercel Serverless Functions for FlyBot (chat streaming, conversations, feedback). These deploy automatically with Vercel. They need these additional env vars in the Vercel dashboard:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`

## 6. GitHub Actions

Three workflows run automatically. To enable them, add the required secrets in your GitHub repo at Settings > Secrets and variables > Actions.

### CI (`.github/workflows/ci.yml`)

Runs lint + build on every push and PR. No secrets needed (uses placeholder env vars for the build step).

### Sync Ideas (`.github/workflows/sync-problemhunt.yml`)

Runs daily at 6 AM UTC. Syncs ideas from up to 8 sources, then scores new ideas with Claude Sonnet.

**Required secrets:**
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`

**Optional secrets (enable more sources):**
- `REDDIT_CLIENT_ID` + `REDDIT_CLIENT_SECRET` (Reddit sync)
- `PRODUCTHUNT_API_KEY` + `PRODUCTHUNT_API_SECRET` (Product Hunt sync)
- `XAI_API_KEY` (X/Twitter sync)
- `GITHUB_TOKEN` (GitHub Issues sync, higher rate limit)

Each sync step has `continue-on-error: true`, so missing API keys only skip that source. You can start with just Supabase + Anthropic and add sources over time.

### Enrich Ideas (`.github/workflows/enrich-ideas.yml`)

Runs daily at 4 AM UTC. Validates top-scoring ideas with live market data.

**Required secrets:**
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`
- `XAI_API_KEY` (Grok x_search is the primary validation source)

**Optional secrets:**
- `REDDIT_CLIENT_ID` + `REDDIT_CLIENT_SECRET` (adds Reddit as secondary evidence source)

### Manual triggers

All workflows support `workflow_dispatch`, so you can trigger them manually from the Actions tab.

## 7. Running Scripts Locally

You can run any sync or scoring script from the project root:

```bash
# Sync individual sources
npm run sync              # ProblemHunt
npm run sync:reddit       # Reddit (19 subreddits)
npm run sync:producthunt  # Product Hunt
npm run sync:x            # X/Twitter via Grok
npm run sync:hackernews   # Hacker News (Firebase API, no auth needed)
npm run sync:github       # GitHub Issues
npm run sync:yc           # YC Graveyard

# Score and validate
npm run score             # Score unscored ideas with Claude Sonnet
npm run score:backfill    # Re-score ALL ideas
npm run enrich            # Validate top ideas with Grok + Reddit
```

Scripts read env vars from `apps/web/.env` (via `SUPABASE_URL` or `VITE_SUPABASE_URL`). Make sure that file has the server-side keys too.

## 8. Music Player (Optional)

The built-in lofi music player streams CC0 tracks from Cloudflare R2.

1. Create a Cloudflare R2 bucket and enable public access
2. Set the 5 R2 env vars in `apps/web/.env`
3. Place MP3 files in subfolders by vibe mode:

```
scripts/music/
├── ideate/    # Ambient, exploratory
├── build/     # Focused, steady
├── create/    # Energetic, creative
├── cafe/      # Bossa nova, relaxed
├── study/     # Calm, minimal
└── retro/     # Vintage, warm
```

4. Upload and generate the track manifest:

```bash
npm run setup:music
```

This uploads files to R2 and auto-generates `src/lib/data/tracks.js`. The player works immediately after.

Without R2 configured, the music widget simply does not appear on the site.

## 9. Cost Estimates

### Free tier coverage

| Service | Free tier | Enough for |
|---------|-----------|------------|
| Supabase | 500 MB database, 1 GB file storage, 50K monthly active users | Most projects indefinitely |
| Vercel | 100 GB bandwidth, serverless functions included | Most projects indefinitely |
| Cloudflare R2 | 10 GB storage, zero egress fees | Hundreds of tracks |

### Paid costs (AI APIs)

| Operation | Model | Cost per idea | Notes |
|-----------|-------|---------------|-------|
| Sync filtering | Claude Haiku | ~$0.003 | Filters noise from raw sources |
| Scoring | Claude Sonnet | ~$0.05 | Scores accepted ideas with 5 frameworks |
| Enrichment | Grok + Claude Sonnet | ~$0.08 | Live market validation |
| X/Twitter sync | Grok | ~$0.02/query | x_search tool calls |

A typical daily sync (all sources + scoring) costs about $1-2, or roughly $30-50/month depending on volume. You can reduce this by disabling sources you do not need.

### Starting minimal

The cheapest path: set up only Supabase + Anthropic. That gives you the frontend, community idea submissions, and AI scoring. Add sources one by one as needed. ProblemHunt and Hacker News sync require no additional API keys (just Supabase + Anthropic).

## 10. Troubleshooting

**Build fails locally:** check Node version (`node -v`). Must be 20+.

**Supabase connection errors:** verify `VITE_SUPABASE_URL` starts with `https://` and `VITE_SUPABASE_ANON_KEY` is the anon key (not the service role key).

**Scripts fail with "credit balance too low":** all scripts detect Anthropic credit exhaustion and exit cleanly. Top up your Anthropic account.

**GitHub Actions fail on specific sync step:** each step uses `continue-on-error: true`. Check if the required API key is set as a GitHub secret. Missing keys skip that source without failing the workflow.

**Music player does not appear:** this is expected without R2 configuration. The widget only renders when tracks exist.

**CSP errors in browser console:** if you change the Supabase project or add external services, update the Content-Security-Policy header in `apps/web/vercel.json`.
