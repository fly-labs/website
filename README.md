# FlyLabs Website

![Vercel](https://img.shields.io/badge/Vercel-deployed-black?logo=vercel)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite)
![License](https://img.shields.io/badge/License-MIT-green)

Tools, templates, and ideas for business and learning.
Built by one person with AI. Open source.

**Live:** [flylabs.fun](https://flylabs.fun)

## What's Inside

This platform changes every week. New prompts, new ideas scored, new tools shipped. Numbers below are always growing.

- **Explore** - Every project in one place. Filter by Business, Tools, or Learn. Each card shows what it is, what stage it's at, and where to go next.
- **AI Prompt Library** - A growing collection of copy-paste prompts across Coding, Writing, Strategy, Marketing, SEO, Research, Workflows, and Thinking. Five are public. Members get the full library plus voting, comments, and the ability to suggest new ones.
- **Idea Lab** - The engine of the whole platform. Real problems scraped daily from [ProblemHunt](https://problemhunt.pro), Reddit, Product Hunt, X, Hacker News, GitHub Issues, and the YC Graveyard, plus community submissions. Every idea is scored by AI using four frameworks (the Fly Labs Method for solo builders + Hormozi, Dan Koe, and Okamoto as expert lenses), then the top ones are validated against live conversations on X and Reddit. The result: a BUILD, VALIDATE_FIRST, or SKIP verdict with per-pillar reasoning, confidence scoring, and competitive intelligence. Card and table views, full-text search, seven-dimension filtering, trending badges, and a multi-step submit form. New ideas flow in automatically via GitHub Actions.
- **Scoring Frameworks** - The full methodology behind the AI scoring: Fly Labs Method (Problem Clarity, Solution Gap, Willingness to Act, Buildability) plus three expert perspectives (Hormozi's $100M evaluation, Dan Koe's one-person business lens, Okamoto's MicroSaaS validation) and a validation layer that checks ideas against real-world evidence.
- **Library** - Ebooks built from study notes. AI, business, mindset, and everything in between. New titles added as they're written. Topic filtering and waitlist for upcoming books.
- **Newsletter** - Powered by the Substack archive API (with rss2json fallback). Shows engagement metrics (reactions, comments, restacks), read time, and a Notes redirect section. The 3 latest articles also appear on the homepage.
- **Idea Lab Analytics** - Interactive dashboard at `/ideas/analytics` with recharts visualizations: verdict donut, source breakdown, score histogram, framework radar, growth timeline, source x verdict heatmap, day-of-week activity, top industries, source quality, and auto-generated key insights. Designed for screenshot-worthy Notes content.
- **Micro Tools** - Small, focused apps that do one thing well. Waitlist open, first batch in progress.
- **Templates** - Systems and blueprints built for real use:
  - Garmin to Notion Sync - auto-sync health data to Notion (live, open source)
  - Website Blueprint - full stack breakdown of how this site was built (live, open source)
  - Launch Checklist - 4-phase Notion template based on The $100 Startup (coming soon)
  - One-Page Business Plan - 5-question Notion template based on The $100 Startup (coming soon)
- **FlyBot** - AI-powered vibe building partner. Score ideas with 4 frameworks, write content, think through building decisions. Claude-powered, 5 free messages during beta. Public landing page at `/flybot`, protected chat at `/flybot/chat`.
- **Member Profiles** - Auth-gated profiles with name, location, bio, and avatar

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 18 + Vite 7 (JSX, no TypeScript) |
| Styling | Tailwind CSS 3.4 + CSS variables (HSL theming) |
| Components | shadcn/ui pattern (Radix UI + CVA) |
| Routing | React Router DOM v7 |
| Animation | Framer Motion 11 (fadeUp, fadeIn, scaleIn, stagger) |
| Charts | Recharts (lazy-loaded, separate vendor chunk) |
| Icons | Lucide React |
| Backend | Supabase (PostgreSQL + Auth + Storage) |
| Auth | Email/password + Google OAuth |
| SEO | react-helmet-async + JSON-LD |
| Analytics | Google Analytics 4 (custom events across all user interactions) |
| Deploy | Vercel (auto-deploy on push to `main`) |

## Getting Started

### Prerequisites

- Node.js >= 20 (see `.nvmrc`)
- npm
- A [Supabase](https://supabase.com) project

### Setup

```bash
git clone https://github.com/fly-labs/website.git
cd website
npm install

# Configure environment
cp apps/web/.env.example apps/web/.env
# Edit apps/web/.env with your Supabase credentials

# Start dev server
npm run dev
# Opens at http://localhost:3001
```

### Environment Variables

All env vars live in `apps/web/.env` with the `VITE_` prefix (client-side).

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL (`https://xxx.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |
| `VITE_GA_ID` | No | Google Analytics 4 Measurement ID (`G-XXXXXXXXXX`) |

**Server-side** (for sync, scoring, and enrichment scripts):

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | Yes | Same as `VITE_SUPABASE_URL` (scripts read both) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (Settings > API) |
| `ANTHROPIC_API_KEY` | Yes | Anthropic API key (for Claude scoring + PH problem extraction) |
| `PRODUCTHUNT_API_KEY` | Yes | Product Hunt API key |
| `PRODUCTHUNT_API_SECRET` | Yes | Product Hunt API secret |
| `XAI_API_KEY` | Yes | xAI API key (for Grok x_search in sync:x and enrichment) |
| `REDDIT_CLIENT_ID` | No | Reddit OAuth client ID (higher rate limits) |
| `REDDIT_CLIENT_SECRET` | No | Reddit OAuth client secret |
| `GITHUB_TOKEN` | No | GitHub personal access token (5K req/hr vs 60 unauthenticated) |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server on port 3001 |
| `npm run build` | Production build to `apps/web/dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |
| `npm run deploy` | Stage, commit, and push to `main` (triggers Vercel deploy) |
| `npm run sync` | Sync new problems from ProblemHunt (via Tilda feed API) and upsert to Supabase |
| `npm run sync:reddit` | Sync business opportunities from targeted Reddit subreddits to Supabase |
| `npm run sync:producthunt` | Sync top posts from Product Hunt (GraphQL API) to Supabase |
| `npm run sync:x` | Sync problems from X/Twitter via Grok xAI API with x_search tool |
| `npm run sync:hackernews` | Sync problems from Hacker News (Firebase API + Claude AI filter) |
| `npm run sync:github` | Sync feature requests from GitHub Issues (Search API + Claude AI filter) |
| `npm run sync:yc` | Sync dead YC startups from YC Graveyard (yc-oss API + Claude AI filter) |
| `npm run score` | Score unscored ideas with Claude Sonnet (Fly Labs Method + Hormozi + Dan Koe + Okamoto + synthesis verdict) |
| `npm run enrich` | Validate top-scoring ideas with Grok x_search (primary) + Reddit (secondary) |

## Project Structure

```
apps/web/
├── src/
│   ├── main.jsx              # Entry point
│   ├── App.jsx               # Router + providers (Auth, Theme, Helmet)
│   ├── index.css             # Tailwind + design tokens (CSS vars, custom classes)
│   ├── components/
│   │   ├── ui/               # shadcn/ui primitives (button, avatar, input, tabs, toast, toaster)
│   │   ├── Header.jsx        # Sticky nav with blur backdrop
│   │   ├── Footer.jsx        # Footer with social links
│   │   ├── PageLayout.jsx    # Page wrapper (SEO, Header, Footer, background)
│   │   ├── SEO.jsx           # Helmet wrapper (title, meta, OG, JSON-LD)
│   │   ├── AuthModal.jsx     # Login/signup modal (Google OAuth, password strength)
│   │   ├── ProtectedRoute.jsx # Redirects guests to AuthModal
│   │   ├── ScrollProgress.jsx # 2px scroll progress bar (Framer Motion)
│   │   ├── GitHubHeatmap.jsx # GitHub contribution heatmap (compact + full)
│   │   ├── GridBackground.jsx # Subtle graph-paper grid
│   │   ├── GeometricBackground.jsx # Hand-drawn doodle background
│   │   ├── ideas/            # Extracted Ideas page components (IdeaCard, IdeaSubmitModal, IdeaFilterSheet, ScoreUtils)
│   │   └── ...               # ThemeToggle, SmileLogo, ScrollToTop, icons
│   ├── contexts/
│   │   ├── AuthContext.jsx   # Supabase auth state, profile CRUD, GA4 user props
│   │   └── ThemeContext.jsx  # Dark/light mode (localStorage + system preference)
│   ├── hooks/
│   │   ├── useIdeaFilters.js # URL state filter hook (search, sort, filter, paginate with useSearchParams)
│   │   └── use-toast.js
│   ├── lib/
│   │   ├── data/
│   │   │   ├── projects.js   # Projects array + categories
│   │   │   ├── prompts.js    # Prompt definitions (featured flag for lead magnet)
│   │   │   ├── library.js    # Books array, topics, topic colors
│   │   │   ├── ideas.js      # Idea categories, industries, statusConfig, sortOptions, sourceOptions, verdictOptions, scoreThresholds, confidenceOptions, perPageOptions, frequencyOptions, formSteps, verdictColors, verdictLabels, SOURCE_COUNT
│   │   │   ├── siteStats.js  # Centralized dynamic counts (prompts, categories, books, templates, frameworks, routes, etc.)
│   │   │   └── constants.js  # Shared constants (FRAMEWORK_COUNT) to prevent circular deps
│   │   ├── supabaseClient.js # Supabase init
│   │   ├── analytics.js      # GA4 helpers (trackPageView, trackEvent, setUserProperties, setUserId)
│   │   ├── animations.js     # Shared animation variants (fadeUp, fadeIn, scaleIn, stagger)
│   │   ├── githubApi.js      # GitHub contribution API (localStorage cache, 1h TTL)
│   │   ├── substackApi.js   # Substack archive API + rss2json fallback (fetchArticles, cache, 1h TTL)
│   │   └── utils.js          # cn(), timeAgo(), isValidEmail()
│   └── pages/                # 23 route pages (all lazy-loaded via React.lazy)
├── public/                   # Static assets (sitemap, robots.txt, images)
├── vite.config.js            # Port 3001, @ alias, vendor/motion/supabase/recharts chunking
├── tailwind.config.js        # Design tokens, dark mode: 'class'
├── components.json           # shadcn/ui config
└── vercel.json               # SPA rewrites + security headers (CSP, HSTS, COOP)
```

## Routes

| Path | Page | Access |
|------|------|--------|
| `/` | Home (hero, value pillars, newsletter preview, narrative closing) | Public |
| `/explore` | Explore (category filter: Business, Tools, Learn) | Public |
| `/ideas` | Idea Lab (AI-scored, validated, paginated, multi-filter) | Public |
| `/ideas/:id` | Idea detail (verdict, scoring, market evidence, vote, share) | Public |
| `/ideas/analytics` | Idea Lab analytics dashboard (recharts, noindex) | Public |
| `/newsletter` | Newsletter (Substack archive API + engagement metrics) | Public |
| `/about` | About (5-act visual journey: manifesto, story beat cards, stats + GitHub heatmap, closing CTA) | Public |
| `/login` | Login | Public |
| `/signup` | Signup | Public |
| `/scoring` | Scoring Frameworks (Fly Labs Method + Hormozi + Dan Koe + Okamoto + Validation) | Public |
| `/library` | Library (ebooks, topic filter, waitlist) | Public |
| `/prompts` | AI Prompt Library | Hybrid (5 public, full for members) |
| `/microsaas` | Micro Tools | Public (waitlist capture) |
| `/templates` | Templates directory | Members only |
| `/templates/garmin-to-notion` | Garmin to Notion Sync | Members only |
| `/templates/website-blueprint` | Website Blueprint | Public |
| `/templates/launch-checklist` | Launch Checklist (Notion) | Public (coming soon) |
| `/templates/one-page-business-plan` | One-Page Business Plan (Notion) | Public (coming soon) |
| `/flybot` | FlyBot landing page (capabilities, example eval, stats) | Public |
| `/flybot/chat` | FlyBot full-page chat (sidebar, conversations) | Members only |
| `/coach` | Redirect to `/flybot` | - |
| `/profile` | User Profile | Members only |

## Supabase Setup

Schema and RLS policies are versioned in `supabase/migrations/`. Apply with `supabase db push` or manually in the [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql). See [docs/SUPABASE.md](docs/SUPABASE.md) for details.

### Tables

**profiles** - User profiles (synced with Supabase Auth, auto-created on signup). Fields: id, name, phone, country, city, age, gender, bio, avatar_url, updated_at

**ideas** - Community idea submissions + automated imports from multiple sources (public read when approved, anyone can insert). Fields: id, name, email (nullable), idea_title, idea_description (nullable), category, industry, source (default 'community', also 'problemhunt', 'reddit', 'producthunt', 'x', 'hackernews', 'github', or 'yc'), source_url, external_id, tags, country, votes, status, approved, frequency, existing_solutions, flylabs_score, hormozi_score, koe_score, okamoto_score, score_breakdown (JSONB), enrichment (JSONB), validation_score, verdict (BUILD/VALIDATE_FIRST/SKIP), confidence (high/medium/low), composite_score, published_at, meta (JSONB), created_at, updated_at

**idea_rate_limits** - Rate limiting for idea submissions (max 3 per email per 24h)

**prompt_votes** - Upvotes on prompts (one per user per prompt)

**prompt_comments** - Comments on prompts (authenticated users only)

**waitlist** - Email capture (anyone can insert, unique constraint on email + source)

### RPCs

- `increment_vote(idea_id)` - Atomic vote increment for ideas
- `toggle_prompt_vote(p_prompt_id)` - Atomic vote toggle for prompts (insert or delete)
- `get_prompt_vote_counts()` - Returns vote counts for all prompts (SECURITY DEFINER, works without auth)
- `get_waitlist_count(p_source)` - Count waitlist entries by source
- `check_idea_rate_limit(p_email)` - Returns count of submissions in last 24h
- `log_idea_submission(p_email)` - Logs a submission for rate limiting

### Auth

- Email/password authentication
- Google OAuth (requires Google Cloud Console credentials in Supabase dashboard)
- Row Level Security on every table

## Deployment

Deployed automatically via Vercel on push to `main`.

**Vercel settings:**
- Framework: Vite
- Root Directory: `apps/web`
- Build Command: `vite build`
- Output Directory: `dist`

## Design Philosophy

Hand-drawn lab doodles are the brand identity. The `GeometricBackground` component renders 7 SVG doodles (flasks, beakers, atoms, paper planes, light bulbs, DNA helixes, and test tubes) with subtle float/drift/spin animations at near-invisible opacity. Every page inherits this through `PageLayout`.

- **No gradient text, no glow orbs, no AI-looking effects.** Solid colors only for emphasis (`text-primary`).
- **Clean dark theme** with warm background (`hsl(220 15% 6%)`), green/cyan/violet accent palette.
- **Hand-drawn stroke style** on all doodles: `strokeLinecap="round"`, `strokeLinejoin="round"`, slightly irregular paths.
- **Mobile-aware:** excess doodles hidden on small screens (`hidden md:block`).

## Building in Public

This project is built in public by [Luiz Alves](https://flylabs.fun/about). Follow along on the [Fala Comigo newsletter](https://falacomigo.substack.com) for updates on the process, decisions, and lessons learned.

## License

MIT - see [LICENSE](LICENSE) for details.
