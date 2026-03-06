# FlyLabs Website

The playground for creators. Tools, templates, and AI prompts built in public.

**Live:** [flylabs.fun](https://flylabs.fun)

## What's Inside

- **Explore** - Project catalog organized by curated stacks (Launch, Productivity, Community), filterable by category, with type and status badges
- **AI Prompt Library** - 24 curated prompts for coding, writing, strategy, and thinking. 5 public, full library for members. Vote, comment, and suggest new prompts
- **Idea Board** - Community submissions + real-world problems from [ProblemHunt](https://problemhunt.pro). Every idea scored by AI using Hormozi and Dan Koe frameworks. Pagination, 6-way sort (hot/newest/oldest/top voted/Hormozi score/Koe score), source/type/industry filtering, multi-step submit form, score badges with detail drawer, trending badges. Daily auto-sync via GitHub Actions
- **Scoring Frameworks** - Full breakdown of both AI scoring frameworks (Hormozi's $100M evaluation + Dan Koe's one-person business lens) with pillar details, score tiers, and methodology
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
| Analytics | Google Analytics 4 (14 custom events) |
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

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server on port 3001 |
| `npm run build` | Production build to `apps/web/dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |
| `npm run deploy` | Stage, commit, and push to `main` (triggers Vercel deploy) |
| `npm run sync` | Scrape new problems from ProblemHunt and import to Supabase |
| `npm run score` | Score unscored ideas with Claude Sonnet (Hormozi + Dan Koe) |

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
│   │   ├── GitHubHeatmap.jsx # GitHub contribution heatmap (compact + full)
│   │   ├── GridBackground.jsx # Subtle graph-paper grid
│   │   ├── GeometricBackground.jsx # Hand-drawn doodle background
│   │   └── ...               # ThemeToggle, SmileLogo, ScrollToTop, icons
│   ├── contexts/
│   │   ├── AuthContext.jsx   # Supabase auth state, profile CRUD, GA4 user props
│   │   └── ThemeContext.jsx  # Dark/light mode (localStorage + system preference)
│   ├── hooks/
│   │   └── use-toast.js
│   ├── lib/
│   │   ├── data/
│   │   │   ├── projects.js   # Projects array + stacks + categories
│   │   │   ├── prompts.js    # 24 prompts (4 categories, featured flag)
│   │   │   └── ideas.js      # Idea categories, industries, statusConfig, sortOptions, sourceOptions, perPageOptions, frequencyOptions, formSteps
│   │   ├── supabaseClient.js # Supabase init
│   │   ├── analytics.js      # GA4 helpers (trackPageView, trackEvent, setUserProperties, setUserId)
│   │   ├── animations.js     # Shared animation variants (fadeUp)
│   │   ├── githubApi.js      # GitHub contribution API (localStorage cache, 1h TTL)
│   │   └── utils.js          # cn(), timeAgo(), isValidEmail()
│   └── pages/                # 17 route pages (all lazy-loaded via React.lazy)
├── public/                   # Static assets (sitemap, robots.txt, images)
├── vite.config.js            # Port 3001, @ alias, vendor chunking
├── tailwind.config.js        # Design tokens, dark mode: 'class'
├── components.json           # shadcn/ui config
└── vercel.json               # SPA rewrites + security headers (CSP, HSTS, COOP)
```

## Routes

| Path | Page | Access |
|------|------|--------|
| `/` | Home | Public |
| `/explore` | Explore (curated stacks + category filter) | Public |
| `/ideas` | Idea Board (AI-scored, paginated, multi-filter) | Public |
| `/newsletter` | Newsletter (Substack RSS) | Public |
| `/about` | About (bio, GitHub heatmap) | Public |
| `/login` | Login | Public |
| `/signup` | Signup | Public |
| `/scoring` | Scoring Frameworks (Hormozi + Dan Koe) | Public |
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

**ideas** - Community idea submissions + ProblemHunt imports (public read when approved, anyone can insert). Fields: id, name, email (nullable), idea_title, idea_description (nullable), category, industry, source (default 'community'), source_url, external_id, tags, country, votes, status, approved, frequency, existing_solutions, hormozi_score, koe_score, score_breakdown (JSONB), created_at

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
