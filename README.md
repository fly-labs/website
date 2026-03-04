# FlyLabs Website

The playground for creators. Tools, templates, and experiments built by the FlyLabs team.

**Live:** [https://flylabs.fun](https://flylabs.fun)

## Stack

- **Frontend:** React 18 + Vite + Tailwind CSS + Radix UI (shadcn/ui pattern)
- **Backend:** Supabase (Auth, PostgreSQL, Storage)
- **Hosting:** Vercel (SPA static deploy)
- **Domain:** flylabs.fun (DNS managed via Vercel)

## Prerequisites

- Node.js >= 18
- npm >= 9
- A Supabase project ([supabase.com](https://supabase.com))

## Getting Started

```bash
# Clone
git clone https://github.com/fly-labs/flylabs-website.git
cd flylabs-website

# Install dependencies
npm install

# Set up environment variables
cp apps/web/.env.example apps/web/.env
# Edit apps/web/.env with your Supabase credentials

# Start dev server
npm run dev
# Opens at http://localhost:3000
```

## Environment Variables

All env vars live in `apps/web/.env` and use the `VITE_` prefix (exposed to the client).

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL (`https://xxx.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public key |
| `VITE_GA_ID` | Google Analytics 4 Measurement ID (`G-XXXXXXXXXX`) |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server on port 3000 |
| `npm run build` | Production build to `apps/web/dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |

## Project Structure

```
├── package.json              # Root (delegates to apps/web)
├── apps/
│   └── web/
│       ├── index.html        # Entry HTML
│       ├── vite.config.js    # Vite configuration
│       ├── tailwind.config.js
│       ├── vercel.json       # SPA rewrites for Vercel
│       ├── public/           # Static assets (sitemap, robots.txt)
│       └── src/
│           ├── main.jsx      # React entry point
│           ├── App.jsx       # Router and providers
│           ├── index.css     # Tailwind + CSS variables (light/dark theme)
│           ├── pages/        # Route pages
│           ├── components/   # Shared components (UI, Header, Footer, modals)
│           ├── contexts/     # AuthContext, ThemeContext
│           ├── hooks/        # Custom hooks (use-toast)
│           └── lib/          # Supabase client, analytics, utils
```

## Routes

| Path | Page | Access |
|------|------|--------|
| `/` | Home | Public |
| `/explore` | Explore (project catalog) | Public |
| `/ideas` | Idea submission form | Public |
| `/newsletter` | Newsletter (Substack RSS) | Public |
| `/about` | About page | Public |
| `/login` | Login | Public |
| `/signup` | Signup | Public |
| `/prompts` | AI Prompt Library | Authenticated |
| `/templates` | Notion Templates | Authenticated |
| `/templates/garmin-to-notion` | Garmin to Notion | Authenticated |
| `/microsaas` | Micro SaaS Tools | Authenticated |

## Supabase Setup

### Tables

**ideas** -- Idea submissions from visitors

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key, auto-generated |
| created_at | timestamptz | Auto-generated |
| name | text | Optional |
| email | text | Required |
| idea_title | text | Required |
| idea_description | text | Required |
| category | text | Default: 'Tool' |

**notifications** -- Email notification signups

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key, auto-generated |
| created_at | timestamptz | Auto-generated |
| email | text | Required, unique |

### Auth

- Email/password authentication
- Google OAuth (requires Google Cloud Console credentials)

### Row Level Security

- Both tables allow anonymous INSERT (public forms)
- SELECT restricted to authenticated users

## Deployment

Deployed automatically via Vercel on push to `main`.

### Vercel Configuration

- **Framework:** Vite
- **Root Directory:** `apps/web`
- **Build Command:** `vite build`
- **Output Directory:** `dist`

### DNS

Domain `flylabs.fun` uses Vercel nameservers (`ns1.vercel-dns.com`, `ns2.vercel-dns.com`).

## License

Private -- All rights reserved.
