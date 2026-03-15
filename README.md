<p align="center">
  <a href="https://flylabs.fun"><img src="https://img.shields.io/badge/Live-flylabs.fun-229648?style=for-the-badge" alt="Live at flylabs.fun" /></a>
</p>

# Fly Labs

**The vibe building hub.** One person, AI tools, weekends. This is what comes out.

Fly Labs is an open source platform for builders who want to find ideas worth building, score them with real frameworks, and ship faster. It scrapes problems from 9 sources daily, scores them with AI using 4 frameworks, validates the best ones against live market data, and gives you an AI coach that knows all of it.

[![CI](https://github.com/fly-labs/website/actions/workflows/ci.yml/badge.svg)](https://github.com/fly-labs/website/actions/workflows/ci.yml)
[![Sync Ideas](https://github.com/fly-labs/website/actions/workflows/sync-problemhunt.yml/badge.svg)](https://github.com/fly-labs/website/actions/workflows/sync-problemhunt.yml)
[![Enrich Ideas](https://github.com/fly-labs/website/actions/workflows/enrich-ideas.yml/badge.svg)](https://github.com/fly-labs/website/actions/workflows/enrich-ideas.yml)
![License](https://img.shields.io/github/license/fly-labs/website)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)

---

## What You Get

**Ideas Lab** - 1,000+ real problems scraped daily from Reddit (19 subs), Product Hunt, Hacker News, X/Twitter, GitHub Issues, ProblemHunt, the YC Graveyard, and community submissions. 4 questions decide the verdict. 3 expert perspectives add depth. BUILD, VALIDATE, or SKIP verdict with reasoning. Card/table views, 7-dimension filtering, full-text search.

**FlyBot** - AI coach that sits on top of all the scored data. Evaluate your own ideas, get prompt recommendations, ask about patterns in the data. Claude-powered with streaming responses and conversation memory.

**Prompt Library** - 81 copy-paste prompts across 8 categories (Coding, Writing, Strategy, Marketing, SEO, Research, Workflows, Thinking). Voting, comments, and community suggestions.

**Analytics Dashboard** - 10 interactive charts: verdict distribution, source breakdown, score histograms, framework radar, growth timeline, source quality heatmap, and more.

**Scoring Frameworks** - The full methodology: Fly Labs Method (4 questions, solo builder lens) + 3 expert perspectives (Hormozi, Dan Koe, Okamoto) for depth on the detail page.

**Templates** - Website Blueprint (how this site was built), Garmin to Notion sync, Launch Checklist, One-Page Business Plan.

**Vibe Coding Player** - Built-in lofi music player with 6 vibe modes (Ideate, Build, Create, Cafe, Study, Retro). 58 CC0 tracks on Cloudflare R2 (zero egress fees), Web Audio API visualizer, drag-to-seek, lock screen controls. FlyBot can start playback and select vibes via conversation.

**FlyBoard** - Collaborative whiteboard powered by Excalidraw. Pick a template, sketch your ideas, and export when ready.

**Library** - Free ebooks from study notes. AI, business, mindset.

**Newsletter** - Substack archive with engagement metrics, read time, and Notes.

## The Pipeline

Every day at 6 AM UTC, GitHub Actions runs 7 sync scripts and a scoring pass:

```
Sources (8)          Scoring (Claude Sonnet)         Validation (Grok + Reddit)
───────────          ──────────────────────          ──────────────────────────
Reddit (19 subs)  →  Fly Labs Method (THE score)  →  x_search live evidence
Product Hunt      →  + 3 expert perspectives      →  Reddit conversation mining
Hacker News       →    (Hormozi, Koe, Okamoto)    →  Confidence scoring
X/Twitter (Grok)  →  ─────────────────────        →  Competitive intelligence
GitHub Issues     →  FL >= 65 → BUILD
ProblemHunt       →  FL 40-64 → VALIDATE
YC Graveyard      →  FL < 40  → SKIP
Community         →
```

Cost: ~$30/month for the entire pipeline.

## Quick Start

```bash
git clone https://github.com/fly-labs/website.git
cd website
npm install
cp apps/web/.env.example apps/web/.env
# Add your Supabase credentials to .env
npm run dev
# http://localhost:3001
```

**Requirements:** Node.js >= 20 (see `.nvmrc`)

### Environment Variables

**Client-side** (in `apps/web/.env`):

| Variable | Required | What it does |
|----------|----------|--------------|
| `VITE_SUPABASE_URL` | Yes | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |
| `VITE_GA_ID` | No | Google Analytics 4 ID |

**Server-side** (for sync + scoring scripts):

| Variable | Required | What it does |
|----------|----------|--------------|
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key |
| `ANTHROPIC_API_KEY` | Yes | Claude API (scoring + filtering) |
| `XAI_API_KEY` | Yes | Grok API (X sync + enrichment) |
| `PRODUCTHUNT_API_KEY` | Yes | Product Hunt GraphQL API |
| `PRODUCTHUNT_API_SECRET` | Yes | Product Hunt API secret |
| `REDDIT_CLIENT_ID` | No | Higher Reddit rate limits |
| `REDDIT_CLIENT_SECRET` | No | Reddit OAuth |
| `GITHUB_TOKEN` | No | 5K req/hr vs 60 unauthenticated |
| `R2_ACCOUNT_ID` | For music | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | For music | R2 API token access key |
| `R2_SECRET_ACCESS_KEY` | For music | R2 API token secret key |
| `R2_BUCKET_NAME` | For music | R2 bucket name (default: flylabs-music) |
| `R2_PUBLIC_URL` | For music | R2 public URL (e.g. https://pub-xxx.r2.dev) |

## Scripts

| Command | What it does |
|---------|--------------|
| `npm run dev` | Dev server on port 3001 |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run sync` | Sync ProblemHunt ideas |
| `npm run sync:reddit` | Sync from 19 targeted subreddits |
| `npm run sync:producthunt` | Sync Product Hunt (extracts underlying problems) |
| `npm run sync:x` | Sync from X via Grok xAI |
| `npm run sync:hackernews` | Sync from HN (Firebase API) |
| `npm run sync:github` | Sync from GitHub Issues |
| `npm run sync:yc` | Sync dead YC startups |
| `npm run score` | Score unscored ideas with Claude Sonnet |
| `npm run score:backfill` | Re-score ALL ideas (backfill-all.mjs) |
| `npm run enrich` | Validate top ideas with Grok + Reddit |
| `npm run setup:music` | Upload tracks to Cloudflare R2 + generate tracks.js |

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | React 18 + Vite 7 (JSX, no TypeScript) |
| Styling | Tailwind CSS 3.4 + CSS variables |
| Components | shadcn/ui (Radix UI + CVA) |
| Animation | Framer Motion 11 |
| Charts | Recharts (lazy-loaded) |
| Backend | Supabase (PostgreSQL + Auth) + Cloudflare R2 (music storage) |
| AI | Claude API (scoring, coaching) + Grok (validation) |
| Deploy | Vercel (auto-deploy on push) |

## Project Structure

```
apps/web/
├── src/
│   ├── components/
│   │   ├── ui/           # shadcn/ui primitives
│   │   ├── ideas/        # Ideas Lab components (cards, filters, scoring)
│   │   ├── chat/         # FlyBot chat (messages, input, evaluation cards)
│   │   ├── flybot/       # FlyBot widget (trigger, panel)
│   │   └── music/        # Vibe Coding player (trigger, panel, visualizer)
│   ├── contexts/         # Auth, Chat, Music, Theme
│   ├── hooks/            # useIdeaFilters, useChat
│   ├── lib/data/         # prompts, projects, ideas config, tracks, stats
│   └── pages/            # 24 route pages (all lazy-loaded)
├── api/                  # Vercel serverless (chat, conversations)
├── scripts/              # Sync + scoring scripts (7 sources + Claude)
└── .github/workflows/    # CI, daily sync, daily enrichment
```

## Routes

24 routes total. Public pages, hybrid pages (partial access for guests), and member-only areas.

| Path | What | Access |
|------|------|--------|
| `/` | Landing page | Public |
| `/explore` | Project catalog | Public |
| `/ideas` | Ideas Lab (AI-scored, multi-filter) | Public |
| `/ideas/:id` | Idea detail (verdict, scores, evidence) | Public |
| `/ideas/analytics` | Analytics dashboard (10 charts) | Public |
| `/prompts` | Prompt Library (81+ prompts) | Hybrid |
| `/flybot` | FlyBot landing | Public |
| `/flybot/chat` | FlyBot full chat | Members |
| `/flyboard` | FlyBoard whiteboard | Public |
| `/scoring` | Scoring methodology | Public |
| `/newsletter` | Substack archive | Public |
| `/library` | Free ebooks | Public |
| `/about` | The story | Public |
| `/templates/*` | Build templates | Mixed |
| `/profile` | User settings | Members |

## Database

Supabase PostgreSQL with Row Level Security on every table. Schema in `supabase/migrations/`.

**Tables:** profiles, ideas, idea_rate_limits, prompt_votes, prompt_comments, waitlist, conversations, messages, flybot_waitlist

**Automation:** Daily sync at 6 AM UTC (GitHub Actions) pulls from 9 sources, scores with Claude, enriches top ideas with Grok. See `.github/workflows/` for the full pipeline.

## Design

Hand-drawn lab doodles are the brand. No gradient text, no glow orbs, no AI-looking effects. Clean dark theme with green/cyan/violet accents. Mobile-first. Every page gets the doodle background through `PageLayout`.

## Building in Public

Built by [Luiz Alves](https://flylabs.fun/about). The process, decisions, and lessons are documented on the [Fala Comigo newsletter](https://falacomigo.substack.com).

## Contributing

Contributions welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

[MIT](LICENSE)
