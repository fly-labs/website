# FlyLabs Website

![Vercel](https://img.shields.io/badge/Vercel-deployed-black?logo=vercel)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite)
![License](https://img.shields.io/badge/License-MIT-green)

Tools, templates, and ideas for business and learning.
Built by one person with AI. Open source.

**Live:** [flylabs.fun](https://flylabs.fun)

## What's Inside

- **Explore** - Project catalog filterable by category (Business, Tools, Learn), with type and status badges
- **AI Prompt Library** - 24 curated prompts for coding, writing, strategy, and thinking. 5 public, full library for members. Vote, comment, and suggest new prompts
- **Idea Lab** - Community submissions + real-world problems from [ProblemHunt](https://problemhunt.pro), Reddit, Product Hunt, and X. Every idea scored by AI using Hormozi, Dan Koe, and Okamoto frameworks with per-pillar reasoning and a synthesized BUILD/VALIDATE/SKIP verdict. Top ideas validated against real conversations on X and Reddit, with evidence confidence scoring and competitive intelligence. Reddit sync uses Claude AI filtering for quality. Pagination, 9-way sort (including verdict), source/type/industry filtering, multi-step submit form, score badges + verdict badges with detail drawer, trending badges. Daily auto-sync via GitHub Actions
- **Scoring Frameworks** - Full breakdown of AI scoring frameworks (Hormozi's $100M evaluation, Dan Koe's one-person business lens, Okamoto's MicroSaaS validation) plus validation layer methodology
- **Library** - Ebooks from study notes. AI, business, mindset, and everything in between. Topic filtering and waitlist for coming-soon books
- **Newsletter** - RSS-powered feed from the Fala Comigo Substack
- **Micro Tools Waitlist** - Email capture for upcoming small, focused tools
- **Templates** - Systems, tools, and blueprints built for real use (4 templates):
  - Garmin to Notion Sync - auto-sync Garmin health data to Notion (live, open source)
  - Website Blueprint - full stack breakdown of how this site was built (live, open source)
  - Launch Checklist - 4-phase Notion template based on The $100 Startup (coming soon)
  - One-Page Business Plan - 5-question Notion template based on The $100 Startup (coming soon)
- **Member Profiles** - Auth-gated profiles with name, location, bio, and avatar

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 18 + Vite 7 (JSX, no TypeScript) |
| Styling | Tailwind CSS 3.4 + CSS variables (HSL theming) |
| Components | shadcn/ui pattern (Radix UI + CVA) |
| Routing | React Router DOM v7 |
| Animation | Framer Motion 11 |
| Icons | Lucide React |
| Backend | Supabase (PostgreSQL + Auth + Storage) |
| Auth | Email/password + Google OAuth |
| SEO | react-helmet-async + JSON-LD |
| Analytics | Google Analytics 4 (24 custom events) |
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
| `npm run score` | Score unscored ideas with Claude Sonnet (Hormozi + Dan Koe + Okamoto + synthesis verdict) |
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
│   │   ├── ideas/            # Extracted Ideas page components (IdeaCard, IdeaDrawer, IdeaSubmitModal)
│   │   └── ...               # ThemeToggle, SmileLogo, ScrollToTop, icons
│   ├── contexts/
│   │   ├── AuthContext.jsx   # Supabase auth state, profile CRUD, GA4 user props
│   │   └── ThemeContext.jsx  # Dark/light mode (localStorage + system preference)
│   ├── hooks/
│   │   └── use-toast.js
│   ├── lib/
│   │   ├── data/
│   │   │   ├── projects.js   # Projects array + categories
│   │   │   ├── prompts.js    # 24 prompts (4 categories, featured flag)
│   │   │   ├── library.js    # Books array, topics, topic colors
│   │   │   └── ideas.js      # Idea categories, industries, statusConfig, sortOptions, sourceOptions, perPageOptions, frequencyOptions, formSteps
│   │   ├── supabaseClient.js # Supabase init
│   │   ├── analytics.js      # GA4 helpers (trackPageView, trackEvent, setUserProperties, setUserId)
│   │   ├── animations.js     # Shared animation variants (fadeUp)
│   │   ├── githubApi.js      # GitHub contribution API (localStorage cache, 1h TTL)
│   │   └── utils.js          # cn(), timeAgo(), isValidEmail()
│   └── pages/                # 18 route pages (all lazy-loaded via React.lazy)
├── public/                   # Static assets (sitemap, robots.txt, images)
├── vite.config.js            # Port 3001, @ alias, vendor chunking
├── tailwind.config.js        # Design tokens, dark mode: 'class'
├── components.json           # shadcn/ui config
└── vercel.json               # SPA rewrites + security headers (CSP, HSTS, COOP)
```

## Routes

| Path | Page | Access |
|------|------|--------|
| `/` | Home (hero, value pillars, narrative closing) | Public |
| `/explore` | Explore (category filter: Business, Tools, Learn) | Public |
| `/ideas` | Idea Lab (AI-scored, validated, paginated, multi-filter) | Public |
| `/newsletter` | Newsletter (Substack RSS) | Public |
| `/about` | About (visual journey timeline, pull quote, GitHub heatmap) | Public |
| `/login` | Login | Public |
| `/signup` | Signup | Public |
| `/scoring` | Scoring Frameworks (Hormozi + Dan Koe + Okamoto + Validation) | Public |
| `/library` | Library (ebooks, topic filter, waitlist) | Public |
| `/prompts` | AI Prompt Library | Hybrid (5 public, full for members) |
| `/microsaas` | Micro Tools | Public (waitlist capture) |
| `/templates` | Templates directory | Members only |
| `/templates/garmin-to-notion` | Garmin to Notion Sync | Members only |
| `/templates/website-blueprint` | Website Blueprint | Public |
| `/templates/launch-checklist` | Launch Checklist (Notion) | Public (coming soon) |
| `/templates/one-page-business-plan` | One-Page Business Plan (Notion) | Public (coming soon) |
| `/profile` | User Profile | Members only |

## Supabase Setup

Schema and RLS policies are versioned in `supabase/migrations/`. Apply with `supabase db push` or manually in the [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql). See [docs/SUPABASE.md](docs/SUPABASE.md) for details.

### Tables

**profiles** - User profiles (synced with Supabase Auth, auto-created on signup). Fields: id, name, phone, country, city, age, gender, bio, avatar_url, updated_at

**ideas** - Community idea submissions + ProblemHunt + Reddit + Product Hunt imports (public read when approved, anyone can insert). Fields: id, name, email (nullable), idea_title, idea_description (nullable), category, industry, source (default 'community', also 'problemhunt', 'reddit', or 'producthunt'), source_url, external_id, tags, country, votes, status, approved, frequency, existing_solutions, hormozi_score, koe_score, okamoto_score, score_breakdown (JSONB), enrichment (JSONB), validation_score, created_at

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

## Building in Public

This project is built in public by [Luiz Alves](https://flylabs.fun/about). Follow along on the [Fala Comigo newsletter](https://falacomigo.substack.com) for updates on the process, decisions, and lessons learned.

## License

MIT - see [LICENSE](LICENSE) for details.
