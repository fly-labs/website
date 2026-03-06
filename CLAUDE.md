# FlyLabs Website - Development Guide

## Project Overview
**FlyLabs** (flylabs.fun) - "The playground for creators. Tools, templates, and experiments."
A React SPA built by Luiz Alves. Community-facing site with public pages (explore, ideas, newsletter, about), hybrid public/gated pages (prompts, micro tools), and member-only areas (templates, profile). Explore page groups projects into curated stacks (Launch, Productivity, Community).

## Quick Start
```bash
npm install
npm run dev      # Dev server on http://localhost:3001
npm run build    # Production build (Vite)
npm run lint     # ESLint (quiet mode)
```

## Tech Stack
- **Framework:** React 18 + Vite 7 (JSX, no TypeScript)
- **Styling:** Tailwind CSS 3.4 + CSS variables (HSL) for theming
- **Components:** shadcn/ui pattern (Radix UI primitives + CVA variants) in `components/ui/`
- **Routing:** React Router DOM v7 (client-side SPA)
- **Animation:** Framer Motion 11
- **Icons:** Lucide React
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **Auth:** Email/password + Google OAuth via Supabase
- **SEO:** react-helmet-async + JSON-LD (wrapped in `<HelmetProvider>` at App root)
- **Analytics:** Google Analytics 4 via `lib/analytics.js` (trackPageView, trackEvent, setUserProperties, setUserId)
- **Deploy:** Vercel (auto-deploy on push to `main`)

## Project Structure
```
apps/web/
├── src/
│   ├── main.jsx              # Entry point
│   ├── App.jsx               # Router + providers (AuthProvider, ThemeProvider, HelmetProvider)
│   ├── index.css             # Tailwind base + design tokens (CSS vars)
│   ├── components/
│   │   ├── ui/               # shadcn/ui components (button, avatar, input, tabs, toast, toaster)
│   │   ├── Header.jsx        # Nav bar (sticky, blur backdrop)
│   │   ├── Footer.jsx        # Footer with social links
│   │   ├── SEO.jsx           # Helmet wrapper (title, meta, OG, JSON-LD)
│   │   ├── PageLayout.jsx    # Page wrapper (SEO, Header, Footer, background)
│   │   ├── ErrorBoundary.jsx # Error boundary fallback
│   │   ├── AuthModal.jsx     # Login/signup modal (tabs, Google OAuth, password strength)
│   │   ├── ProtectedRoute.jsx # Redirects guests to AuthModal
│   │   ├── ThemeToggle.jsx   # Dark/light switch
│   │   ├── GoogleIcon.jsx    # Shared Google "G" SVG
│   │   ├── XIcon.jsx         # X/Twitter icon
│   │   ├── GeometricBackground.jsx  # Hand-drawn doodle background
│   │   ├── GridBackground.jsx       # Subtle 32px graph-paper grid
│   │   ├── GitHubHeatmap.jsx        # GitHub contribution heatmap (compact + full)
│   │   ├── SmileLogo.jsx     # Animated brand logo
│   │   └── ScrollToTop.jsx   # Resets scroll on route change
│   ├── contexts/
│   │   ├── AuthContext.jsx   # Supabase auth state, login/signup/logout, profile CRUD (optimistic update), GA4 user props
│   │   └── ThemeContext.jsx  # Dark/light mode (localStorage + system preference)
│   ├── hooks/
│   │   └── use-toast.js
│   ├── lib/
│   │   ├── data/
│   │   │   ├── projects.js       # projects array (title, type, status, category, stack, colors) + stacks + categories exports
│   │   │   ├── prompts.js        # 24 prompts across 4 categories (featured flag for lead magnet)
│   │   │   └── ideas.js          # Idea categories, industries, statusConfig, sortOptions (4-way), sourceOptions, perPageOptions, frequencyOptions, formSteps
│   │   ├── supabaseClient.js # Supabase init (env vars: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
│   │   ├── analytics.js      # GA4 (trackPageView, trackEvent, setUserProperties, setUserId)
│   │   ├── animations.js     # Shared animation variants (fadeUp: scroll-triggered fade + slide)
│   │   ├── githubApi.js      # GitHub contribution API (fetchContributions, localStorage cache, 1h TTL)
│   │   └── utils.js          # cn(), timeAgo(), isValidEmail()
│   └── pages/
│       ├── HomePage.jsx          # Brand landing (pillars, bio, GitHub heatmap, newsletter CTA)
│       ├── ExplorePage.jsx       # Project catalog (stack-grouped or flat grid by category filter)
│       ├── IdeaSubmissionPage.jsx # Idea board (pagination, 4-way sort, source/type/industry filter, multi-step submit form, Hormozi + Dan Koe score badges, detail drawer)
│       ├── NewsletterPage.jsx    # Substack RSS feed + subscribe CTA
│       ├── AboutPage.jsx         # Bio, story, GitHub heatmap, social links
│       ├── LoginPage.jsx         # Email + Google OAuth login
│       ├── SignupPage.jsx        # Email + Google OAuth signup (password strength)
│       ├── PromptsPage.jsx       # Hybrid: 5 public / full library for members (vote, comment, copy, suggest)
│       ├── TemplatesPage.jsx     # Protected template directory (4 templates)
│       ├── GarminToNotionPage.jsx  # Protected - Garmin sync details + builder's note
│       ├── WebsiteBlueprintPage.jsx # Public - full stack breakdown + builder's note
│       ├── LaunchChecklistPage.jsx  # Public - 4-phase Notion template (coming soon)
│       ├── OnePageBusinessPlanPage.jsx # Public - 5-question Notion template (coming soon)
│       ├── MicroSaasPage.jsx       # Public with waitlist capture
│       ├── ScoringFrameworksPage.jsx # Public - Hormozi + Dan Koe scoring frameworks explained
│       ├── ProfilePage.jsx         # Protected - user settings (name, phone, location, bio, avatar)
│       └── NotFoundPage.jsx
├── public/
│   ├── images/luiz-alves.png
│   ├── robots.txt
│   └── sitemap.xml
├── vite.config.js           # Port 3001, @ alias -> ./src, vendor/motion/supabase chunking
├── tailwind.config.js       # Design tokens, dark mode: 'class', tailwindcss-animate plugin
├── components.json          # shadcn/ui: new-york style, JSX, lucide icons
├── vercel.json              # SPA rewrites + security headers (CSP, HSTS, COOP, Permissions-Policy)
└── .env                     # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_GA_ID
```

## Routes
| Path | Page | Auth |
|------|------|------|
| `/` | HomePage | Public |
| `/explore` | ExplorePage | Public |
| `/ideas` | IdeaSubmissionPage | Public |
| `/newsletter` | NewsletterPage | Public |
| `/about` | AboutPage | Public |
| `/login` | LoginPage | Public |
| `/signup` | SignupPage | Public |
| `/scoring` | ScoringFrameworksPage | Public |
| `/prompts` | PromptsPage | Hybrid (5 public, full library for members) |
| `/microsaas` | MicroSaasPage | Public (waitlist capture) |
| `/templates` | TemplatesPage | Protected |
| `/templates/garmin-to-notion` | GarminToNotionPage | Protected |
| `/templates/website-blueprint` | WebsiteBlueprintPage | Public |
| `/templates/launch-checklist` | LaunchChecklistPage | Public (coming soon) |
| `/templates/one-page-business-plan` | OnePageBusinessPlanPage | Public (coming soon) |
| `/profile` | ProfilePage | Protected |

## Supabase
- **Migrations:** `supabase/migrations/` (schema + RLS). Apply with `supabase db push`. See `docs/SUPABASE.md`
- **Tables:** profiles, ideas, prompt_votes, prompt_comments, waitlist
- **Ideas columns:** id, idea_title, idea_description (nullable), category (Type: Tool/Template/Prompt/Article/Other), industry (domain vertical, nullable), source (default 'community'), source_url, external_id (dedup key), tags, country, name, email (nullable), votes, approved, status, frequency, existing_solutions, hormozi_score, koe_score, score_breakdown (JSONB), created_at
- **idea_rate_limits table:** Rate limiting for submissions (email, created_at). Max 3 per email per 24h
- **RPCs:** `increment_vote(idea_id)`, `toggle_prompt_vote(p_prompt_id)`, `get_prompt_vote_counts()`, `get_waitlist_count(p_source)`, `check_idea_rate_limit(p_email)`, `log_idea_submission(p_email)`
- **Seed data:** `supabase/seed-data/problemhunt.json` (171 ProblemHunt items). Import: `node supabase/seed-data/import-problemhunt.mjs`. Classify existing: `node supabase/seed-data/classify-existing.mjs`
- **Scripts:** `scripts/score-ideas.mjs` (Claude Sonnet-powered Hormozi + Dan Koe scoring), `scripts/sync-problemhunt.mjs` (daily scraper). Run via `npm run score` / `npm run sync`
- **GitHub Actions:** `.github/workflows/sync-problemhunt.yml` - daily cron (2 AM UTC) to scrape ProblemHunt + score new ideas with Claude

## Design System
**Colors (HSL via CSS vars, light/dark themes in index.css):**
- **Primary:** Green `hsl(142 76% 36%)` light / `hsl(120 100% 50%)` dark
- **Secondary:** Cyan `hsl(186 100% 30%)` light / `hsl(180 100% 50%)` dark
- **Accent:** Magenta `hsl(292 84% 40%)` light / `hsl(300 100% 50%)` dark
- **Background:** White `hsl(0 0% 100%)` / Very dark blue `hsl(240 10% 3.9%)`
- **Foreground:** Near-black `hsl(240 10% 3.9%)` / Off-white `hsl(0 0% 98%)`

**Font:** Nunito (primary), Inter (fallback), system-ui

**Radius:** 0.75rem base (--radius)

**Custom classes (in index.css):**
- `.btn-playful` - 3D press effect with `active:translate-y-1` (intentional, uses `transition-all`)
- `.btn-playful-primary`, `.btn-playful-secondary`, `.btn-playful-accent`, `.btn-playful-outline` - color variants with glow on hover
- `.card-playful` - card with shadow + border highlight (uses scoped transitions, NOT `transition-all`)

## Coding Conventions
- **JSX only** - no TypeScript, no `.tsx` files
- **Path alias:** `@/` maps to `src/` (e.g., `import Header from '@/components/Header.jsx'`)
- **Always include `.jsx` extension** in imports
- **Component naming:** PascalCase files, default exports for pages, named exports for utilities
- **Styling:** Tailwind utility classes. Use `cn()` from `@/lib/utils.js` for conditional classes. Never use gradient text effects (`text-transparent bg-clip-text bg-gradient-to-*`) - use solid `text-primary` instead for emphasis
- **Animation:** Framer Motion `motion.div` with `initial/animate`. Use `AnimatePresence` only for local UI elements (modals, toasts, expand/collapse). Never wrap `<Routes>` with `AnimatePresence` - it blocks lazy-loaded route transitions
- **Icons:** Import individually from `lucide-react` (tree-shakeable)
- **Pages:** Wrap in `<PageLayout>` (provides SEO, Header, Footer, and background). Pass `seo={{ title, description, ... }}` prop
- **Protected pages:** Wrap route element in `<ProtectedRoute>` in App.jsx
- **Hybrid pages:** Use `useAuth()` to render different content for guests vs members (e.g., PromptsPage)
- **State:** Local state (`useState`) for UI, Context for auth/theme. No Redux or external state lib
- **Supabase:** Use `supabase` client from `@/lib/supabaseClient.js`. RPC for atomic operations
- **No em dashes:** Never use the em dash character in text or documentation. Use periods, colons, or hyphens instead
- **Mobile-first responsive:** Use Tailwind breakpoint prefixes (`sm:`, `md:`, `lg:`) to progressively enhance. Touch targets must be at least 44px (use `p-3` on icon-only buttons). Hover-only interactions (tooltips, opacity reveals) must have a touch fallback (e.g., `onClick` toggle or always-visible on mobile with `opacity-60 sm:opacity-0 sm:group-hover:opacity-100`). Fixed left padding/margins (e.g., `pl-[52px]`) should collapse on mobile (`pl-0 sm:pl-[52px]`). Test at 375px (iPhone SE) in DevTools
- **No layout-shifting transitions on tappable elements:** Never use `transition-all`, `hover:-translate-y-*`, or `hover:scale-*` on Links, buttons, or anchors. These shift touch targets on mobile tap, making elements untappable. Use `transition-colors` (or scoped like `transition-[color,background-color,border-color,box-shadow]`). `group-hover:scale-*` on child icons inside a tappable parent is fine. Framer Motion `layout` prop must not be used on card grid containers or individual card wrappers (causes persistent CSS transforms)
- **Security headers:** CSP, COOP, HSTS, and Permissions-Policy in `vercel.json`. CSP uses `https://*.supabase.co` (no hardcoded project URL). GA4 requires `unsafe-inline` for script-src
- **Validation:** Use `isValidEmail()` from `@/lib/utils.js` for email fields (waitlist, ideas)

## Data Layer
- **projects.js:** `projects` array (8 items), `stacks` array (launch/productivity/community), `categories` array. Each project has: title, description, icon, link, color, bgColor, type, status (Live/Beta/Soon/Open), category, stack, isGated (optional)
- **prompts.js:** 24 prompts across 4 categories (Coding, Writing, Strategy, Thinking). Each has: id, title, category, description, content, author (optional), featured (optional - marks lead magnet for guest view)
- **ideas.js:** categories (Tool/Template/Prompt/Article/Other), industries (29 domain verticals from ProblemHunt + Other), statusConfig (open/building/shipped), sortOptions (hot/newest/oldest/top/hormozi/koe), sourceOptions (all/community/problemhunt), perPageOptions (10/20/50), frequencyOptions (Daily/Weekly/Sometimes/Once), formSteps (3-step submit). Three-dimension filtering: Source x Type x Industry

## Analytics Events (GA4)
All custom events use `trackEvent(name, params)` from `lib/analytics.js`. User properties (`auth_provider`, `is_member`) and `user_id` are set on auth state change in `AuthContext.jsx`.

| Event | Fired From | Key Params |
|-------|-----------|------------|
| `sign_up` | AuthContext | `method` (email/google) |
| `login` | AuthContext | `method` |
| `prompt_copied` | PromptsPage | `prompt_id`, `prompt_title`, `category` |
| `prompt_voted` | PromptsPage | `prompt_id`, `prompt_title`, `category` |
| `prompt_commented` | PromptsPage | `prompt_id`, `prompt_title`, `category` |
| `idea_submitted` | IdeaSubmissionPage, PromptsPage | `category`, `prompt_category` (PromptsPage only) |
| `idea_voted` | IdeaSubmissionPage | `idea_id`, `idea_title`, `category` |
| `waitlist_joined` | MicroSaasPage | `source` |
| `newsletter_click` | NewsletterPage, AboutPage, HomePage | `location` |
| `article_click` | NewsletterPage | `article_title`, `location` |
| `outbound_click` | Footer, AboutPage, GarminToNotionPage, WebsiteBlueprintPage, NewsletterPage, IdeaSubmissionPage | `link_url`, `link_label`, `location` |
| `cta_click` | HomePage, PromptsPage | `cta`, `location` |
| `project_click` | ExplorePage | `project`, `category` |
| `profile_updated` | ProfilePage | `fields_filled` |

## Environment Variables
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GA_ID=G-XXXXXXXXXX
```

## Git
- **Main branch:** `main` (auto-deploys to Vercel)
- **Node version:** 20.19.1 (see .nvmrc)
