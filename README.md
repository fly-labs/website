# FlyLabs Website

The playground for creators. Tools, templates, and AI prompts built in public.

**Live:** [flylabs.fun](https://flylabs.fun)

## What's Inside

- **AI Prompt Library** - 24 curated prompts for coding, writing, and thinking. 5 public, full library for members
- **Explore** - Catalog of projects and tools built by the team
- **Idea Submissions** - Public form where anyone can submit tool ideas with community voting
- **Newsletter** - RSS-powered feed from the Fala Comigo Substack
- **Micro Tools Waitlist** - Email capture for upcoming small, focused tools
- **Templates** - Systems, tools, and blueprints built for real use
- **Website Blueprint** - Full stack breakdown of how this site was built (open source)
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
│   │   └── utils.js          # cn(), timeAgo(), isValidEmail()
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
| `/prompts` | AI Prompt Library | Hybrid (5 public, full for members) |
| `/microsaas` | Micro Tools | Public (waitlist capture) |
| `/templates` | Templates | Members only |
| `/templates/website-blueprint` | Website Blueprint | Public |
| `/profile` | User Profile | Members only |

## Supabase Setup

Schema and RLS policies are versioned in `supabase/migrations/`. Apply with `supabase db push` or manually in the [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql). See [docs/SUPABASE.md](docs/SUPABASE.md) for details.

### Tables

**profiles** - User profiles (synced with Supabase Auth, auto-created on signup)

**ideas** - Community idea submissions (public read when approved, anyone can insert)

**prompt_votes** - Upvotes on prompts (RPC: `toggle_prompt_vote`)

**prompt_comments** - Comments on prompts

**waitlist** - Email capture (anyone can insert; use RPC `get_waitlist_count` for counts)

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
