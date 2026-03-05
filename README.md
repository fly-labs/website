# FlyLabs Website

The playground for creators. Tools, templates, and AI prompts built in public.

**Live:** [flylabs.fun](https://flylabs.fun)

## What's Inside

- **AI Prompt Library** - 24 curated prompts for coding, writing, and thinking. 5 free, full library for members
- **Explore** - Catalog of projects and tools built by the team
- **Idea Submissions** - Public form where anyone can submit tool ideas with community voting
- **Newsletter** - RSS-powered feed from the Fala Comigo Substack
- **Micro Tools Waitlist** - Email capture for upcoming small, focused tools
- **Notion Templates** - Downloadable templates for members
- **Member Profiles** - Auth-gated profiles with account management

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
| Analytics | Google Analytics 4 |
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

## Project Structure

```
apps/web/
├── src/
│   ├── main.jsx              # Entry point
│   ├── App.jsx               # Router + providers
│   ├── index.css             # Tailwind + design tokens (CSS vars)
│   ├── components/
│   │   ├── ui/               # shadcn/ui primitives (button, avatar, tabs, toast...)
│   │   ├── Header.jsx        # Sticky nav with blur backdrop
│   │   ├── Footer.jsx        # Footer with social links
│   │   ├── PageLayout.jsx    # Page wrapper (SEO, Header, Footer, background)
│   │   ├── AuthModal.jsx     # Login/signup modal
│   │   ├── GitHubHeatmap.jsx # GitHub contribution heatmap (compact + full)
│   │   └── ...
│   ├── contexts/             # AuthContext, ThemeContext
│   ├── hooks/                # use-toast
│   ├── lib/
│   │   ├── data/             # Static data (projects, prompts, ideas)
│   │   ├── supabaseClient.js # Supabase init
│   │   ├── analytics.js      # GA4 helpers
│   │   └── utils.js          # cn(), timeAgo()
│   └── pages/                # Route pages
├── public/                   # Static assets (sitemap, robots.txt, images)
├── vite.config.js
├── tailwind.config.js
└── vercel.json               # SPA rewrites + security headers
```

## Routes

| Path | Page | Access |
|------|------|--------|
| `/` | Home | Public |
| `/explore` | Explore (project catalog) | Public |
| `/ideas` | Idea submissions | Public |
| `/newsletter` | Newsletter (Substack RSS) | Public |
| `/about` | About | Public |
| `/prompts` | AI Prompt Library | Hybrid (5 free, full for members) |
| `/microsaas` | Micro Tools | Public (waitlist capture) |
| `/templates` | Notion Templates | Members only |
| `/profile` | User Profile | Members only |

## Supabase Setup

You need the following tables in your Supabase project. Enable Row Level Security on all tables.

### Tables

**profiles** - User profiles (synced with Supabase Auth)

**ideas** - Community idea submissions

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key, auto-generated |
| created_at | timestamptz | Auto-generated |
| name | text | Optional |
| email | text | Required |
| idea_title | text | Required |
| idea_description | text | Required |
| category | text | Default: 'Tool' |

**prompt_votes** - Upvotes on prompts (uses RPC: `toggle_prompt_vote`)

**prompt_comments** - Comments on prompts

**waitlist** - Email waitlist capture

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key, auto-generated |
| email | text | Required |
| source | text | Default: 'micro-tools' |
| created_at | timestamptz | Auto-generated |

Unique constraint on `(email, source)`. RLS policy: anyone can INSERT, only admins can SELECT.

### Auth

- Email/password authentication
- Google OAuth (requires Google Cloud Console credentials in Supabase dashboard)

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
