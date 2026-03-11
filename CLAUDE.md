# FlyLabs Website - Development Guide

## Project Overview
**FlyLabs** (flylabs.fun) - "Tools, templates, and ideas for business and learning."
A React SPA built by Luiz Alves. Community-facing site with public pages (explore, ideas, newsletter, about), hybrid public/gated pages (prompts, micro tools), and member-only areas (templates, profile). Explore page organizes projects by category (Business, Tools, Learn).

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
- **Analytics:** Google Analytics 4 via `lib/analytics.js` (trackPageView, trackEvent, trackError, setUserProperties, setUserId). Debug mode (`debug_mode: true` + console logs) auto-enabled in dev
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
│   │   ├── SEO.jsx           # Helmet wrapper (title, meta, OG, JSON-LD, noindex, array schema support)
│   │   ├── PageLayout.jsx    # Page wrapper (SEO, Header, Footer, ScrollProgress, background)
│   │   ├── ScrollProgress.jsx # 2px scroll progress bar (Framer Motion useScroll)
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
│   │   ├── ScrollToTop.jsx   # Resets scroll on route change
│   │   └── ideas/            # Extracted Ideas page components
│   │       ├── IdeaCard.jsx      # Idea card (vote, verdict + FL score badges, competitor count, navigates to /ideas/:id via useNavigate)
│   │       ├── IdeaFilterSheet.jsx # Bottom sheet (mobile) + inline panel (desktop) for type/industry/score/confidence/perPage
│   │       ├── IdeaSubmitModal.jsx # 3-step submit form modal
│   │       ├── ScoreUtils.jsx    # Shared scoring utilities (getScoreTier, ScoreBar, FRAMEWORK_CONFIG, verdictStyles, confidenceColors)
│   │       └── SourceBadge.jsx    # Shared source link badge (used in IdeaCard + IdeaDetailPage)
│   ├── contexts/
│   │   ├── AuthContext.jsx   # Supabase auth state, login/signup/logout, profile CRUD (optimistic update), GA4 user props
│   │   └── ThemeContext.jsx  # Dark/light mode (localStorage + system preference)
│   ├── hooks/
│   │   ├── useIdeaFilters.js # Server-side paginated filter hook (Supabase queries, URL state, 7 filter dimensions, cascading counts)
│   │   └── use-toast.js
│   ├── lib/
│   │   ├── data/
│   │   │   ├── projects.js       # projects array (title, type, status, category, colors) + categories exports
│   │   │   ├── prompts.js        # 30 prompts across 5 categories (featured flag for lead magnet)
│   │   │   ├── library.js        # Books array, topics, topicColors for Library page
│   │   │   └── ideas.js          # Idea categories, industries, statusConfig, sortOptions (10-way), sourceOptions (8 sources), verdictOptions, scoreThresholds, confidenceOptions, perPageOptions, frequencyOptions, formSteps, verdictColors, verdictLabels, SOURCE_COUNT
│   │   ├── supabaseClient.js # Supabase init (env vars: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
│   │   ├── analytics.js      # GA4 (trackPageView, trackEvent, setUserProperties, setUserId)
│   │   ├── animations.js     # Shared animation variants (fadeUp: scroll-triggered fade + slide)
│   │   ├── githubApi.js      # GitHub contribution API (fetchContributions, localStorage cache, 1h TTL)
│   │   └── utils.js          # cn(), timeAgo(), isValidEmail()
│   └── pages/
│       ├── HomePage.jsx          # Brand landing (hero, 5 live-stat pillars, social proof strip, narrative closing)
│       ├── ExplorePage.jsx       # Project catalog (flat grid with category filter)
│       ├── IdeaSubmissionPage.jsx # Idea Lab list (URL state filters via useIdeaFilters hook, search, verdict tabs, active chips, 9-source pills, filter sheet, smart empty states)
│       ├── IdeaDetailPage.jsx    # Full idea detail page (/ideas/:id) with verdict, scoring breakdown, market evidence, YC graveyard, vote, share
│       ├── NewsletterPage.jsx    # Substack RSS feed + subscribe CTA
│       ├── AboutPage.jsx         # Pull quote, journey timeline, GitHub heatmap, current focus, the approach, social links
│       ├── LoginPage.jsx         # Email + Google OAuth login
│       ├── SignupPage.jsx        # Email + Google OAuth signup (password strength)
│       ├── PromptsPage.jsx       # Hybrid: 5 public / full library for members (vote, comment, copy, suggest)
│       ├── TemplatesPage.jsx     # Protected template directory (4 templates)
│       ├── GarminToNotionPage.jsx  # Protected - Garmin sync details + builder's note
│       ├── WebsiteBlueprintPage.jsx # Public - full stack breakdown + builder's note
│       ├── LaunchChecklistPage.jsx  # Public - 4-phase Notion template (coming soon)
│       ├── OnePageBusinessPlanPage.jsx # Public - 5-question Notion template (coming soon)
│       ├── MicroSaasPage.jsx       # Public with waitlist capture
│       ├── ScoringFrameworksPage.jsx # Public - Fly Labs Method + Hormozi + Dan Koe + Okamoto scoring + Validation Layer explained
│       ├── LibraryPage.jsx         # Public - free ebooks with topic filter and waitlist
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
| `/ideas/:id` | IdeaDetailPage | Public |
| `/newsletter` | NewsletterPage | Public |
| `/about` | AboutPage | Public |
| `/login` | LoginPage | Public |
| `/signup` | SignupPage | Public |
| `/scoring` | ScoringFrameworksPage | Public |
| `/library` | LibraryPage | Public |
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
- **Ideas columns:** id, idea_title, idea_description (nullable), category (Type: Tool/Template/Prompt/Article/Other), industry (domain vertical, nullable), source (default 'community', values: community/problemhunt/reddit/producthunt/x/hackernews/github/yc), source_url, external_id (dedup key), tags, country, name, email (nullable), votes, approved, status, frequency, existing_solutions, flylabs_score, hormozi_score, koe_score, okamoto_score, score_breakdown (JSONB with flylabs/hormozi/koe/okamoto keys + synthesis with verdict/reasoning/next_steps + per-pillar reasoning), enrichment (JSONB with validation/competitors/summary + confidence/evidence_count + verdict with recommendation/reasoning/confidence), validation_score (integer 0-100), verdict (materialized: BUILD/VALIDATE_FIRST/SKIP), confidence (materialized: high/medium/low), composite_score (materialized weighted avg), published_at (original publication date), meta (JSONB, source-specific context, e.g. YC failure_analysis), created_at, updated_at (auto-updated via trigger)
- **idea_rate_limits table:** Rate limiting for submissions (email, created_at). Max 3 per email per 24h. RLS enabled with honeypot defense in `log_idea_submission` RPC
- **RPCs:** `increment_vote(idea_id)`, `toggle_prompt_vote(p_prompt_id)`, `get_prompt_vote_counts()`, `get_waitlist_count(p_source)`, `check_idea_rate_limit(p_email)`, `log_idea_submission(p_email)`
- **Seed data:** `supabase/seed-data/problemhunt.json` (171 ProblemHunt items). Import: `node supabase/seed-data/import-problemhunt.mjs`. Classify existing: `node supabase/seed-data/classify-existing.mjs`
- **Scripts:** `scripts/score-ideas.mjs` (Claude Sonnet-powered Fly Labs Method + Hormozi + Dan Koe + Okamoto scoring with per-pillar reasoning + synthesis verdict, weights: 40% Fly Labs + 20% Hormozi + 20% Koe + 20% Okamoto, passes YC meta context when available), `scripts/sync-problemhunt.mjs` (daily sync via Tilda feed API), `scripts/sync-reddit.mjs` (daily sync from 19 subreddits incl. 3 Portuguese, supports Reddit OAuth auto-upgrade, Haiku AI batch filtering for quality, bilingual prompt), `scripts/sync-producthunt.mjs` (Product Hunt GraphQL API sync - uses Haiku to extract the underlying PROBLEM from each product, filters non-problems), `scripts/sync-x.mjs` (X/Twitter sync via Grok xAI API with x_search tool, rotates 2 of 8 search prompts daily incl. 2 Portuguese, extracts tweet dates), `scripts/sync-hackernews.mjs` (Hacker News sync via Firebase API, fetches top+ask stories, Haiku AI batch filter for quality, keyword-based industry detection), `scripts/sync-github.mjs` (GitHub Issues sync via Search API, rotates 2 of 6 queries daily targeting feature-request/enhancement/help-wanted labels, Haiku AI batch filter, optional GITHUB_TOKEN for 5K req/hr), `scripts/sync-yc.mjs` (YC Graveyard sync via yc-oss API, filters ~1,700 dead startups through Haiku for solo builder viability, stores failure_analysis in meta JSONB), `scripts/enrich-ideas.mjs` (dual-source validation: Grok x_search primary + Reddit secondary with Portuguese evidence, Claude Sonnet synthesis with evidence confidence + enrichment verdict, avg score >= 40 threshold). Also: `scripts/clean-titles.mjs` (one-time DB cleanup to strip source prefixes like "Show HN:", "[Feature Request]" from idea titles). Run via `npm run score` / `npm run sync` / `npm run sync:reddit` / `npm run sync:producthunt` / `npm run sync:x` / `npm run sync:hackernews` / `npm run sync:github` / `npm run sync:yc` / `npm run enrich`
- **GitHub Actions:** `.github/workflows/sync-problemhunt.yml` ("Sync Ideas") - runs daily at 6 AM UTC to sync ProblemHunt + Reddit + Product Hunt + X + Hacker News + GitHub Issues + YC Graveyard + score new ideas with Claude Sonnet. `.github/workflows/enrich-ideas.yml` ("Enrich Ideas") - runs daily at 4 AM UTC to validate top-scoring ideas with Grok x_search + Reddit

## Design System
**Colors (HSL via CSS vars, light/dark themes in index.css):**
- **Primary:** Green `hsl(142 70% 35%)` light / `hsl(142 72% 50%)` dark
- **Secondary:** Cyan `hsl(186 80% 30%)` light / `hsl(180 60% 45%)` dark
- **Accent:** Violet `hsl(262 60% 50%)` light / `hsl(262 50% 60%)` dark
- **Background:** White `hsl(0 0% 100%)` / Warm dark `hsl(220 15% 6%)`
- **Foreground:** Near-black `hsl(240 10% 3.9%)` / Off-white `hsl(0 0% 98%)`

**Font:** Inter (primary), system-ui (fallback)

**Radius:** 0.75rem base (--radius)

**Custom classes (in index.css):**
- `.btn-playful` - flat with subtle `active:translate-y-0.5` micro-interaction
- `.btn-playful-primary`, `.btn-playful-secondary`, `.btn-playful-accent`, `.btn-playful-outline` - color variants with brightness hover
- `.card-playful` - card with subtle shadow + border highlight on hover (uses scoped transitions, NOT `transition-all`)

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
- **projects.js:** `projects` array (9 items), `categories` array (All/Business/Tools/Learn). Each project has: title, description, icon, link, color, bgColor, type, status (Live/Beta/Soon/Open), category, isGated (optional)
- **prompts.js:** 30 prompts across 5 categories (Coding, Writing, Strategy, Marketing, Thinking). Each has: id, title, category, description, content, author (optional), featured (optional - marks lead magnet for guest view)
- **library.js:** `books` array (id, title, description, topic, status, coverColor, downloadUrl, pageCount), `topics` array, `topicColors` map. Topics: AI, Business, Mindset, Mindfulness, Random
- **ideas.js:** categories (Tool/Template/Prompt/Article/Other), industries (30 domain verticals from ProblemHunt/Reddit + Other), statusConfig (open/building/shipped), sortOptions (10-way: hot/newest/oldest/top/flylabs/hormozi/koe/okamoto/validation/verdict), sourceOptions (9: all/community/problemhunt/reddit/producthunt/x/hackernews/github/yc), verdictOptions (all/BUILD/VALIDATE_FIRST/SKIP), verdictColors + verdictLabels (shared constants), scoreThresholds (0/40/60/75), confidenceOptions (all/high/medium/low), perPageOptions (5/10/20/50), frequencyOptions (Daily/Weekly/Sometimes/Once), formSteps (3-step submit). Seven-dimension filtering: Search x Source x Type x Industry x Verdict x Score x Confidence. URL state persistence via useIdeaFilters hook

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
| `ideas_sort_change` | useIdeaFilters | `sort_by` |
| `ideas_filter_change` | useIdeaFilters | `filter_type` (source/type/industry/per_page), `filter_value` |
| `ideas_search` | useIdeaFilters | `query` |
| `ideas_verdict_filter` | useIdeaFilters | `verdict` |
| `ideas_score_filter` | useIdeaFilters | `min_score` |
| `ideas_confidence_filter` | useIdeaFilters | `confidence` |
| `ideas_filter_removed` | useIdeaFilters | `filter_type`, `filter_value` |
| `ideas_filters_cleared` | useIdeaFilters | `previous_count` |
| `idea_detail_opened` | IdeaCard | `idea_id`, `idea_title`, `source` |
| `idea_shared` | IdeaDetailPage | `idea_id`, `idea_title` |
| `idea_form_step` | IdeaSubmissionPage | `step` (0/1/2), `step_name` (problem/context/about_you) |
| `ebook_clicked` | LibraryPage | `book_id`, `book_title`, `topic`, `status` |
| `ebook_downloaded` | LibraryPage | `book_id`, `book_title`, `topic` |
| `ebook_notify` | LibraryPage | `book_id`, `book_title`, `topic` |
| `library_filter_change` | LibraryPage | `topic` |
| `page_not_found` | NotFoundPage | `page_path`, `page_referrer` |
| `exception` | ErrorBoundary, trackError() | `description`, `fatal` |

## Environment Variables
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GA_ID=G-XXXXXXXXXX
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ANTHROPIC_API_KEY=your-anthropic-api-key
PRODUCTHUNT_API_KEY=your-producthunt-api-key
PRODUCTHUNT_API_SECRET=your-producthunt-api-secret
XAI_API_KEY=your-xai-api-key
REDDIT_CLIENT_ID=your-reddit-client-id (optional)
REDDIT_CLIENT_SECRET=your-reddit-client-secret (optional)
GITHUB_TOKEN=your-github-pat (optional, for 5K req/hr vs 60)
```

## Git
- **Main branch:** `main` (auto-deploys to Vercel)
- **Node version:** 20.19.1 (see .nvmrc)
