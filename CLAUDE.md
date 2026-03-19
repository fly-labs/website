# FlyLabs Website - Development Guide

## Project Overview
**FlyLabs** (flylabs.fun) - "Tools, templates, and ideas for business and learning."
A React SPA built by Luiz Alves. Community-facing site with public pages (explore, newsletter, about), hybrid public/gated pages (ideas, ideas analytics, prompts, micro tools), and member-only areas (templates, flybot chat, profile). Freemium model: guests get a taste of every feature (browsing, teaser content), members unlock full AI scoring, analytics, and FlyBot. Explore page organizes projects by category (Business, Tools, Learn).

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
- **Charts:** Recharts (lazy-loaded, separate vendor chunk)
- **Icons:** Lucide React
- **Backend:** Supabase (PostgreSQL + Auth) + Cloudflare R2 (music storage)
- **Auth:** Email/password + Google OAuth via Supabase
- **SEO:** react-helmet-async + JSON-LD (wrapped in `<HelmetProvider>` at App root). Dynamic sitemap via `api/sitemap.js`, Core Web Vitals via web-vitals. OG image function (`api/og.js.disabled`) temporarily disabled due to @vercel/og edge runtime incompatibility
- **Analytics:** Google Analytics 4 via `lib/analytics.js` (trackPageView, trackEvent, trackError, trackWebVitals, trackScrollDepth, trackEventOnce, setUserProperties, setUserId). UTM/referrer tracking on page view. Debug mode (`debug_mode: true` + console logs) auto-enabled in dev
- **i18n:** react-i18next + i18next (EN + PT-BR). State-based toggle (localStorage `language` key), browser language detection. 11 namespace files per language. `LanguageToggle.jsx` in Header. FlyBot responds in user's UI language via system prompt injection. `scripts/translate-missing.mjs` checks coverage and auto-translates with Claude Haiku
- **Deploy:** Vercel (auto-deploy on push to `main`)

## Project Structure
```
apps/web/
├── src/
│   ├── main.jsx              # Entry point (imports i18n before App)
│   ├── App.jsx               # Router + providers (AuthProvider, ThemeProvider, HelmetProvider)
│   ├── index.css             # Tailwind base + design tokens (CSS vars)
│   ├── i18n/
│   │   ├── index.js          # i18next init (language detector, 11 namespaces, html lang sync)
│   │   ├── en/               # English translations (11 namespace JSON files)
│   │   └── pt-BR/            # Brazilian Portuguese translations (11 namespace JSON files)
│   ├── components/
│   │   ├── ui/               # shadcn/ui components (button, avatar, input, tabs)
│   │   ├── Header.jsx        # Nav bar (sticky, blur backdrop)
│   │   ├── Footer.jsx        # Footer with social links
│   │   ├── SEO.jsx           # Helmet wrapper (title, meta, OG, JSON-LD, noindex, array schema support)
│   │   ├── PageLayout.jsx    # Page wrapper (SEO, Header, Footer, ScrollProgress, background)
│   │   ├── ScrollProgress.jsx # 2px scroll progress bar (Framer Motion useScroll)
│   │   ├── ErrorBoundary.jsx # Error boundary fallback
│   │   ├── AuthModal.jsx     # Login/signup modal (tabs, Google OAuth, password strength)
│   │   ├── ProtectedRoute.jsx # Redirects guests to AuthModal
│   │   ├── GatedOverlay.jsx  # Reusable freemium gating (blur overlay + CTA card, inline lock badge). Used by Ideas, Analytics, Detail pages
│   │   ├── ThemeToggle.jsx   # Dark/light switch
│   │   ├── LanguageToggle.jsx # EN/PT language switch (localStorage + GA4 event)
│   │   ├── GoogleIcon.jsx    # Shared Google "G" SVG
│   │   ├── XIcon.jsx         # X/Twitter icon
│   │   ├── GeometricBackground.jsx  # Hand-drawn doodle background (7 SVGs: flask, beaker, atom, plane, bulb, DNA, test tube)
│   │   ├── GridBackground.jsx       # Subtle 32px graph-paper grid
│   │   ├── GitHubHeatmap.jsx        # GitHub contribution heatmap (compact + full)
│   │   ├── SmileLogo.jsx     # Animated brand logo
│   │   ├── ScrollToTop.jsx   # Resets scroll on route change
│   │   └── ideas/            # Extracted Ideas page components
│   │       ├── IdeaCard.jsx      # Idea card view (vote, verdict + FL score + confidence badges, competitor count, navigates to /ideas/:id). showScores prop for freemium gating
│   │       ├── IdeaTableRow.jsx  # Compact table row view (vote, title, verdict, FL score, source, age). showScores prop for freemium gating
│   │       ├── IdeaFilterSheet.jsx # Bottom sheet (mobile) + inline panel (desktop) for type/industry/score/confidence/perPage
│   │       ├── IdeaSubmitModal.jsx # 3-step submit form modal
│   │       ├── ScoreUtils.jsx    # Shared scoring utilities (getScoreTier, ScoreBar, FRAMEWORK_CONFIG, EXPERT_CONFIG with 4 experts incl. YC Lens, verdictStyles, confidenceColors)
│   │       └── SourceBadge.jsx    # Shared source link badge (used in IdeaCard + IdeaDetailPage)
│   │   └── chat/            # FlyBot chat components
│   │       ├── ChatMessages.jsx  # Scrollable message list, auto-scroll, typing indicator
│   │       ├── ChatMessage.jsx   # Message bubble with markdown rendering + ChatEvaluation
│   │       ├── ChatInput.jsx     # Textarea + send button, message counter progress bar
│   │       ├── ChatEvaluation.jsx # Rich score card (reuses ScoreUtils)
│   │       ├── ChatSidebar.jsx   # Conversation list, new chat, mobile slide-in
│   │       ├── ChatEmpty.jsx     # Landing with suggested prompt chips
│   │       ├── ChatLimitReached.jsx # Email capture waitlist with waitlist count
│   │       └── FlyBotDisclosure.jsx # Disclaimer/transparency note
│   │   └── flybot/          # FlyBot site-wide widget components
│   │       ├── FlyBotWidget.jsx  # Orchestrator: trigger + lazy panel, hidden on /flybot. Guests see panel with AuthGate CTA (no redirect)
│   │       ├── FlyBotTrigger.jsx # Floating action button (bottom-right, Cmd+K, pulse glow)
│   │       └── FlyBotPanel.jsx   # Slide-in chat panel (right panel desktop, bottom sheet mobile)
│   │   └── music/           # Vibe Coding music player components
│   │       ├── MusicWidget.jsx   # Orchestrator: trigger + lazy panel, hidden when no tracks
│   │       ├── MusicTrigger.jsx  # Floating action button (bottom-left, equalizer icon, pulse glow)
│   │       └── MusicPanel.jsx    # Slide-up player panel (vibe selector pills, track info, visualizer, controls, volume)
│   │   └── board/           # FlyBoard whiteboard components
│   │       ├── ExcalidrawCanvas.jsx  # Excalidraw wrapper canvas
│   │       ├── ExportMenu.jsx        # Export options menu
│   │       └── TemplatePicker.jsx    # Board template selector
│   ├── contexts/
│   │   ├── AuthContext.jsx   # Supabase auth state, login/signup/logout, profile CRUD (optimistic update), GA4 user props
│   │   ├── BoardContext.jsx  # FlyBoard state management
│   │   ├── ChatContext.jsx   # App-wide chat state (wraps useChat, widget open/close, page context, lazy init)
│   │   ├── MusicContext.jsx  # Audio engine (HTML5 Audio + Web Audio API visualizer, 6 vibe modes, shuffle within vibe, volume, FlyBot bridge with vibe selection, MediaSession)
│   │   └── ThemeContext.jsx  # Dark/light mode (localStorage + system preference)
│   ├── hooks/
│   │   ├── useIdeaFilters.js # Server-side paginated filter hook (Supabase queries, URL state, 7 filter dimensions, cascading counts)
│   │   ├── useChat.js        # FlyBot chat state (messages, streaming, conversations, message count/limit)
│   │   ├── useBoard.js       # FlyBoard hook
│   │   └── use-toast.js
│   ├── lib/
│   │   ├── data/
│   │   │   ├── projects.js       # projects array (title, type, status, category, colors) + categories exports
│   │   │   ├── prompts.js        # Prompts across 8 categories (featured flag for lead magnet)
│   │   │   ├── library.js        # Books array, topics, topicColors for Library page
│   │   │   ├── ideas.js          # Idea categories, industries, statusConfig, sortOptions (6-way: hot/new/oldest/top/score/verdict), sourceOptions (9: all/community/problemhunt/reddit/producthunt/x/hackernews/github/yc), verdictOptions, scoreThresholds, confidenceOptions, perPageOptions, frequencyOptions, formSteps, verdictColors, verdictLabels, SOURCE_COUNT
│   │   │   ├── tracks.js        # Music player track data with vibe modes (auto-generated by scripts/setup-music.mjs)
│   │   │   ├── siteStats.js     # Centralized dynamic counts (prompts, categories, books, templates, frameworks, routes, etc.)
│   │   │   ├── boardTemplates.js # FlyBoard template definitions
│   │   │   └── constants.js    # Shared constants (FRAMEWORK_COUNT) to prevent circular deps
│   │   ├── supabaseClient.js # Supabase init (env vars: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
│   │   ├── analytics.js      # GA4 (trackPageView, trackEvent, trackError, trackWebVitals, trackScrollDepth, trackEventOnce, setUserProperties, setUserId). UTM/referrer on page view
│   │   ├── animations.js     # Shared animation variants (fadeUp, fadeIn, scaleIn, staggerContainer + staggerItem)
│   │   ├── githubApi.js      # GitHub contribution API (fetchContributions, localStorage cache, 1h TTL)
│   │   ├── substackApi.js   # Substack archive API + rss2json fallback (fetchArticles, localStorage cache, 1h TTL)
│   │   ├── chatApi.js       # FlyBot API client (streamChat SSE, listConversations, createConversation, deleteConversation, loadMessages, joinFlyBotWaitlist)
│   │   ├── boardBridge.js   # FlyBot x FlyBoard bridge (buildExcalidrawElements, extractBoardContent). CustomEvent bridge pattern
│   │   └── utils.js          # cn(), timeAgo(), isValidEmail()
│   └── pages/
│       ├── HomePage.jsx          # Brand landing (hero, 6 live-stat pillars incl. FlyBot, how it works, newsletter preview, narrative closing)
│       ├── ExplorePage.jsx       # Project catalog (flat grid with category filter)
│       ├── IdeaSubmissionPage.jsx # Ideas Lab list (card/table view toggle, URL state filters via useIdeaFilters hook, search, verdict tabs, active chips, source pills, filter sheet, smart empty states). Hybrid: guests see ideas but no scores/verdicts
│       ├── IdeaDetailPage.jsx    # Full idea detail page (/ideas/:id) with verdict, scoring breakdown, market evidence, YC graveyard, vote, share. Hybrid: scoring sections gated behind GatedOverlay for guests
│       ├── IdeasAnalyticsPage.jsx # Ideas Lab analytics dashboard (recharts: verdict donut, source breakdown, score histogram, framework radar, growth timeline, source x verdict heatmap, verdict-over-time stacked bar, day-of-week activity, top industries, source quality). Hybrid: stats + verdict donut public, rest gated behind GatedOverlay for guests
│       ├── NewsletterPage.jsx    # Substack archive API feed + engagement metrics + Notes section + subscribe CTA
│       ├── AboutPage.jsx         # 5-act visual journey: hero, manifesto, story beat cards, by-the-numbers stats + GitHub heatmap, closing CTA
│       ├── LoginPage.jsx         # Email + Google OAuth login
│       ├── SignupPage.jsx        # Email + Google OAuth signup (password strength)
│       ├── PromptsPage.jsx       # Hybrid: 10 public / full library for members (vote, comment, copy, suggest)
│       ├── TemplatesPage.jsx     # Protected template directory (4 templates)
│       ├── GarminToNotionPage.jsx  # Protected - Garmin sync details + builder's note
│       ├── WebsiteBlueprintPage.jsx # Public - full stack breakdown + builder's note
│       ├── LaunchChecklistPage.jsx  # Public - 4-phase Notion template (coming soon)
│       ├── OnePageBusinessPlanPage.jsx # Public - 5-question Notion template (coming soon)
│       ├── MicroSaasPage.jsx       # Public with waitlist capture
│       ├── ScoringFrameworksPage.jsx # Public - Fly Labs Method + Hormozi + Dan Koe + Okamoto scoring + Validation Layer explained
│       ├── LibraryPage.jsx         # Public - free ebooks with topic filter and waitlist
│       ├── FlyBotLandingPage.jsx   # Public - FlyBot landing page (hero, capabilities, how it works, example eval, stats, transparency, CTA)
│       ├── FlyBotPage.jsx         # Protected - FlyBot full-page chat (sidebar + chat area, URL param ?c=)
│       ├── FlyBoardPage.jsx       # Public - FlyBoard whiteboard (desktop only, mobile shows redirect)
│       ├── ProfilePage.jsx         # Protected - user settings (name, phone, location, bio, avatar)
│       └── NotFoundPage.jsx
├── api/                         # Vercel Serverless Functions (Node.js, server-side)
│   ├── chat.js                  # POST streaming SSE - FlyBot chat (Claude Haiku/Sonnet, JWT auth, rate limit 10req/min, 5 message limit, 10 conversation cap, 2000 char max, cross-session memory, returns message_id)
│   ├── conversations.js         # GET/POST/DELETE - conversation CRUD (soft delete)
│   ├── feedback.js              # POST/DELETE - FlyBot message feedback (thumbs up/down with optional comment)
│   ├── og.js.disabled            # Edge function - dynamic OG images (@vercel/og), temporarily disabled
│   ├── sitemap.js               # Dynamic XML sitemap (static routes + all approved ideas from Supabase)
│   └── lib/
│       ├── auth.js              # Supabase JWT verification, admin email check
│       └── coach-prompt.js      # FlyBot system prompt builder (4 layers: philosophy, craft, frameworks incl. YC Lens, dynamic context + page context + board_action/music_action + user memory injection + conversation progression)
├── public/
│   ├── images/luiz-alves.png
│   └── robots.txt
├── vite.config.js           # Port 3001, @ alias -> ./src, vendor/motion/supabase/recharts chunking
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
| `/ideas` | IdeaSubmissionPage | Hybrid (browsable for guests, scores/verdicts hidden behind signup CTA) |
| `/ideas/:id` | IdeaDetailPage | Hybrid (title/description public, scoring/analysis gated behind GatedOverlay) |
| `/ideas/analytics` | IdeasAnalyticsPage | Hybrid (stats + verdict donut public, rest gated behind GatedOverlay, noindex) |
| `/newsletter` | NewsletterPage | Public |
| `/about` | AboutPage | Public |
| `/login` | LoginPage | Public |
| `/signup` | SignupPage | Public |
| `/scoring` | ScoringFrameworksPage | Public |
| `/library` | LibraryPage | Public |
| `/prompts` | PromptsPage | Hybrid (10 public, full library for members) |
| `/microsaas` | MicroSaasPage | Public (waitlist capture) |
| `/templates` | TemplatesPage | Protected |
| `/templates/garmin-to-notion` | GarminToNotionPage | Protected |
| `/templates/website-blueprint` | WebsiteBlueprintPage | Public |
| `/templates/launch-checklist` | LaunchChecklistPage | Public (coming soon) |
| `/templates/one-page-business-plan` | OnePageBusinessPlanPage | Public (coming soon) |
| `/flybot` | FlyBotLandingPage | Public |
| `/flybot/chat` | FlyBotPage | Protected (noindex) |
| `/flyboard` | FlyBoardPage | Public (desktop only) |
| `/coach` | Redirects to `/flybot` | - |
| `/profile` | ProfilePage | Protected |

## Supabase
- **Migrations:** `supabase/migrations/` (schema + RLS). Apply with `supabase db push`. See `docs/SUPABASE.md`
- **Tables:** profiles, ideas, prompt_votes, prompt_comments, waitlist, idea_rate_limits, conversations, messages, flybot_waitlist, boards, board_folders, flybot_feedback (message ratings), flybot_memory (cross-session user context)
- **Ideas columns:** id, idea_title, idea_description (nullable), category (Type: Tool/Template/Prompt/Article/Other), industry (domain vertical, nullable), source (default 'community', values: community/problemhunt/reddit/producthunt/x/hackernews/github/yc), source_url, external_id (dedup key), tags, country, name, email (nullable), votes, approved, status, frequency, existing_solutions, flylabs_score, hormozi_score, koe_score, okamoto_score, yc_score, score_breakdown (JSONB with flylabs/hormozi/koe/okamoto/yc keys + synthesis with verdict/reasoning/next_steps + per-pillar reasoning), enrichment (JSONB with validation/competitors/summary + confidence/evidence_count + verdict with recommendation/reasoning/confidence), validation_score (integer 0-100), verdict (materialized: BUILD/VALIDATE_FIRST/SKIP), confidence (materialized: high/medium/low), composite_score (materialized FL score, = flylabs_score for backward compat), published_at (original publication date), meta (JSONB, source-specific context, e.g. YC failure_analysis), created_at, updated_at (auto-updated via trigger)
- **idea_rate_limits table:** Rate limiting for submissions (email, created_at). Max 3 per email per 24h. RLS enabled with honeypot defense in `log_idea_submission` RPC
- **RPCs:** `increment_vote(idea_id)`, `decrement_vote(idea_id)`, `toggle_prompt_vote(p_prompt_id)`, `get_prompt_vote_counts()`, `get_waitlist_count(p_source)`, `check_idea_rate_limit(p_email)`, `log_idea_submission(p_email)`, `get_user_message_count(p_user_id)`, `init_flyboard_defaults(p_user_id)`, `move_board(p_board_id, p_folder_id)`
- **Seed data:** `supabase/seed-data/problemhunt.json` (171 ProblemHunt items). Import: `node supabase/seed-data/import-problemhunt.mjs`. Classify existing: `node supabase/seed-data/classify-existing.mjs`
- **Scripts:** `scripts/score-ideas.mjs` (FL-primary scoring: Claude Sonnet scores with Fly Labs Method as the score, composite_score = flylabs_score for backward compat. Expert scores (Hormozi/Koe/Okamoto/YC Lens) stored in score_breakdown for detail page only. Verdict: FL >= 65 + buildable = BUILD, FL 40-64 = VALIDATE_FIRST, FL < 40 = SKIP. Passes YC meta context when available. Saturation-aware: Solution Gap penalizes crowded markets. Synthesis includes the_pain/the_gap/build_angle fields for actionable Quick Read display), `scripts/backfill-all.mjs` (scores ALL ideas, not just non-SKIPs), `scripts/check-backfill.mjs` (checks backfill progress and scoring coverage), `scripts/sync-problemhunt.mjs` (daily sync via Tilda feed API), `scripts/sync-reddit.mjs` (daily sync from 19 subreddits incl. 3 Portuguese, supports Reddit OAuth auto-upgrade, Haiku AI batch filtering for quality, bilingual prompt), `scripts/sync-producthunt.mjs` (Product Hunt GraphQL API sync - uses Haiku to extract the underlying PROBLEM from each product, filters non-problems), `scripts/sync-x.mjs` (X/Twitter sync via Grok xAI API with x_search tool, rotates 2 of 10 search prompts daily (incl. builder community threads) incl. 2 Portuguese, extracts tweet dates), `scripts/sync-hackernews.mjs` (Hacker News sync via Firebase API, fetches top+ask stories, Haiku AI batch filter for quality, keyword-based industry detection), `scripts/sync-github.mjs` (GitHub Issues + Discussions sync via Search API, rotates 4 of 8 market-level pain queries daily, pre-AI keyword scoring, Haiku AI batch filter, optional GITHUB_TOKEN for 5K req/hr), `scripts/sync-yc.mjs` (YC Graveyard sync via yc-oss API, filters ~1,700 dead startups through Haiku for solo builder viability, stores failure_analysis in meta JSONB), `scripts/enrich-ideas.mjs` (dual-source validation: Grok x_search primary + Reddit secondary with Portuguese evidence, Claude Sonnet synthesis with evidence confidence + enrichment verdict, avg score >= 40 threshold. Post-enrichment saturation cap: 5+ competitors caps verdict at VALIDATE_FIRST, 0-1 competitors boosts confidence to high. Stores competitor_count in enrichment JSONB). Run via `npm run score` / `npm run sync` / `npm run sync:reddit` / `npm run sync:producthunt` / `npm run sync:x` / `npm run sync:hackernews` / `npm run sync:github` / `npm run sync:yc` / `npm run enrich` / `npm run score:yc`. Also: `scripts/setup-music.mjs` (uploads CC0 MP3s from scripts/music/{ideate,build,create,study,retro}/ subfolders to Cloudflare R2 via S3-compatible API, auto-generates src/lib/data/tracks.js with vibe modes and R2 public URLs). Run via `npm run setup:music`. `scripts/translate-missing.mjs` (checks i18n translation coverage across en/ and pt-BR/ namespaces, with --translate flag auto-translates missing keys using Claude Haiku). Run via `npm run translate` / `npm run translate:auto`
- **GitHub Actions:** `.github/workflows/ci.yml` ("CI") - runs on every push, lint + build. `.github/workflows/sync-problemhunt.yml` ("Sync Ideas") - runs daily at 6 AM UTC to sync ProblemHunt + Reddit + Product Hunt + X + Hacker News + GitHub Issues + YC Graveyard + score new ideas with Claude Sonnet. `.github/workflows/enrich-ideas.yml` ("Enrich Ideas") - runs daily at 4 AM UTC to validate top-scoring ideas with Grok x_search + Reddit

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
- **Hybrid pages:** Use `useAuth()` to render different content for guests vs members. Two patterns: (1) `showScores` prop on IdeaCard/IdeaTableRow for field-level gating, (2) `<GatedOverlay>` component for section-level blur + CTA (e.g., IdeaDetailPage scoring, IdeasAnalyticsPage charts). GatedOverlay supports `variant="overlay"` (blur children + CTA card) and `variant="inline"` (compact lock badge). Always pass `location` prop for GA4 tracking
- **State:** Local state (`useState`) for UI, Context for auth/theme. No Redux or external state lib
- **Supabase:** Use `supabase` client from `@/lib/supabaseClient.js`. RPC for atomic operations
- **No em dashes:** Never use the em dash character in text or documentation. Use periods, colons, or hyphens instead
- **Mobile-first responsive:** Use Tailwind breakpoint prefixes (`sm:`, `md:`, `lg:`) to progressively enhance. Touch targets must be at least 44px (use `p-3` on icon-only buttons). Hover-only interactions (tooltips, opacity reveals) must have a touch fallback (e.g., `onClick` toggle or always-visible on mobile with `opacity-60 sm:opacity-0 sm:group-hover:opacity-100`). Fixed left padding/margins (e.g., `pl-[52px]`) should collapse on mobile (`pl-0 sm:pl-[52px]`). Test at 375px (iPhone SE) in DevTools
- **No layout-shifting transitions on tappable elements:** Never use `transition-all`, `hover:-translate-y-*`, or `hover:scale-*` on Links, buttons, or anchors. These shift touch targets on mobile tap, making elements untappable. Use `transition-colors` (or scoped like `transition-[color,background-color,border-color,box-shadow]`). `group-hover:scale-*` on child icons inside a tappable parent is fine. Framer Motion `layout` prop must not be used on card grid containers or individual card wrappers (causes persistent CSS transforms)
- **Security headers:** CSP, COOP, HSTS, and Permissions-Policy in `vercel.json`. CSP uses `https://*.supabase.co` (no hardcoded project URL). GA4 requires `unsafe-inline` for script-src
- **Validation:** Use `isValidEmail()` from `@/lib/utils.js` for email fields (waitlist, ideas)
- **i18n:** All user-visible strings go in namespace JSON files under `src/i18n/{en,pt-BR}/`. Use `const { t } = useTranslation('namespace')` in components. Keys are dot-separated (e.g., `t('hero.title')`). Dynamic values use interpolation: `t('key', { count: 5 })`. When adding new strings, add to both en/ and pt-BR/ files, or add to en/ only and run `npm run translate:auto` to auto-translate missing keys. Product names (BUILD, SKIP, FL score, FlyBot, Ideas Lab) stay in English in both languages. Run `npm run translate` to check coverage

## Development Workflow
- **Plan first:** For any change touching 3+ files or involving architectural decisions, write the plan before coding. If something breaks mid-implementation, stop and re-plan.
- **Verify before done:** After implementing, prove it works. Run the dev server, check the browser, test edge cases. Never mark a task complete without demonstrating correctness.
- **Fix autonomously:** When encountering a bug or failing build, diagnose and fix it. Point at the error, explain the cause, resolve it. Zero hand-holding required.

## Data Layer
- **projects.js:** `projects` array (10 items), `categories` array (All/Business/Tools/Learn). Each project has: title, description, icon, link, color, bgColor, type, status (Live/Beta/Soon/Open), category, isGated (optional)
- **prompts.js:** Prompts across 8 categories (Coding, Writing, Strategy, Marketing, SEO, Research, Workflows, Thinking). Each has: id, title, category, description, content, featured (optional - marks lead magnet for guest view), tools (optional - array of tool names for workflows)
- **siteStats.js:** Centralized dynamic counts computed from data arrays (PROMPT_COUNT, CATEGORY_COUNT, BOOK_COUNT, TEMPLATE_COUNT, SOURCE_COUNT, EXPERT_COUNT, QUESTION_COUNT, TRACK_COUNT, VIBE_COUNT, FRAMEWORK_COUNT, YC_QUESTION_COUNT). Imported by pages instead of hardcoding numbers
- **library.js:** `books` array (id, title, description, topic, status, coverColor, downloadUrl, pageCount), `topics` array, `topicColors` map. Topics: AI, Business, Mindset, Mindfulness, Random
- **ideas.js:** categories (Tool/Template/Prompt/Article/Other), industries (30 domain verticals from ProblemHunt/Reddit + Other), statusConfig (open/building/shipped), sortOptions (6-way: hot/new/oldest/top/score/verdict), sourceOptions (9: all/community/problemhunt/reddit/producthunt/x/hackernews/github/yc), verdictOptions (all/BUILD/VALIDATE_FIRST/SKIP), verdictColors + verdictLabels (shared constants), scoreThresholds (0/40/60/75), confidenceOptions (all/high/medium/low), perPageOptions (5/10/20/50), frequencyOptions (Daily/Weekly/Sometimes/Once), formSteps (3-step submit). Seven-dimension filtering: Search x Source x Type x Industry x Verdict x Score x Confidence. URL state persistence via useIdeaFilters hook

## Analytics Events (GA4)
All custom events use `trackEvent(name, params)` from `lib/analytics.js`. User properties (`auth_provider`, `is_member`) and `user_id` are set on auth state change in `AuthContext.jsx`. 66 events total.

**Auth (2)**
| Event | Fired From | Key Params |
|-------|-----------|------------|
| `sign_up` | AuthContext | `method` (email/google) |
| `login` | AuthContext | `method` |

**Ideas (6)**
| Event | Fired From | Key Params |
|-------|-----------|------------|
| `idea_submitted` | IdeaSubmissionPage, PromptsPage | `category`, `prompt_category` (PromptsPage only) |
| `idea_voted` | IdeaSubmissionPage, IdeaDetailPage | `idea_id`, `idea_title`, `category` |
| `idea_unvoted` | IdeaSubmissionPage, IdeaDetailPage | `idea_id`, `idea_title`, `category` |
| `idea_detail_opened` | IdeaCard, IdeaTableRow | `idea_id`, `idea_title`, `source` |
| `idea_shared` | IdeaDetailPage | `idea_id`, `idea_title` |
| `idea_form_step` | IdeaSubmissionPage, IdeaSubmitModal | `step` (0/1/2), `step_name` (problem/context/about_you) |

**Ideas Filters (8)**
| Event | Fired From | Key Params |
|-------|-----------|------------|
| `ideas_sort_change` | useIdeaFilters | `sort_by` |
| `ideas_filter_change` | useIdeaFilters | `filter_type` (source/type/industry/per_page), `filter_value` |
| `ideas_search` | useIdeaFilters | `query` |
| `ideas_verdict_filter` | useIdeaFilters | `verdict` |
| `ideas_score_filter` | useIdeaFilters | `min_score` |
| `ideas_confidence_filter` | useIdeaFilters | `confidence` |
| `ideas_filter_removed` | useIdeaFilters | `filter_type`, `filter_value` |
| `ideas_filters_cleared` | useIdeaFilters | `previous_count` |

**FlyBot (8)**
| Event | Fired From | Key Params |
|-------|-----------|------------|
| `flybot_message_sent` | FlyBotPage, FlyBotPanel | `conversation_id`, `message_length`, `source` (widget/full_page) |
| `flybot_prompt_clicked` | FlyBotPage, FlyBotPanel | `prompt`, `source` |
| `flybot_link_clicked` | ChatMessage | `link_url`, `link_text` |
| `flybot_conversation_created` | useChat | `conversation_id` |
| `flybot_conversation_deleted` | useChat | `conversation_id` |
| `flybot_evaluation_displayed` | useChat | `idea_title`, `verdict`, `composite_score` |
| `flybot_waitlist_joined` | ChatLimitReached | `message_count` |
| `flybot_feedback_submitted` | useChat | `rating`, `has_comment`, `message_id` |

**FlyBoard (20)**
| Event | Fired From | Key Params |
|-------|-----------|------------|
| `flyboard_board_opened` | useBoard | `board_id`, `board_title` |
| `flyboard_board_saved` | useBoard | `board_id`, `element_count` |
| `flyboard_board_created` | useBoard | `board_id`, `board_title` |
| `flyboard_board_deleted` | useBoard | `board_id` |
| `flyboard_board_duplicated` | FlyBoardPage | `board_id` |
| `flyboard_board_moved` | useBoard | `board_id`, `folder_id` |
| `flyboard_favorite_toggled` | useBoard | `board_id`, `is_favorite` |
| `flyboard_folder_created` | useBoard | `folder_id`, `folder_name` |
| `flyboard_folder_deleted` | useBoard | `folder_id` |
| `flyboard_template_used` | FlyBoardPage | `template_id`, `template_title` |
| `flyboard_grid_changed` | FlyBoardPage | `grid_style` |
| `flyboard_bg_changed` | FlyBoardPage | `bg_preset` |
| `flyboard_font_changed` | FlyBoardPage | `font_id` |
| `flyboard_stroke_color_changed` | FlyBoardPage | `color` |
| `flyboard_stroke_width_changed` | FlyBoardPage | `width` |
| `flyboard_arrow_preset_changed` | FlyBoardPage | `preset` |
| `flyboard_exported` | ExportMenu | `format`, `element_count` |
| `flyboard_fill_color_changed` | FlyBoardPage | `color` |
| `flyboard_fill_style_changed` | FlyBoardPage | `fill_style` |
| `flyboard_board_action` | useChat.js | `action` (add_elements/load_template/clear) |

**Music (5)**
| Event | Fired From | Key Params |
|-------|-----------|------------|
| `music_player_toggled` | MusicWidget | `state` (open/close) |
| `music_track_played` | MusicContext | `track_title`, `track_artist`, `vibe`, `source` (user/flybot) |
| `music_track_skipped` | MusicContext | `track_title`, `direction` (next/prev) |
| `music_vibe_changed` | MusicContext | `vibe` (ideate/build/create/cafe/study/retro) |
| `music_flybot_control` | useChat.js | `action` (play/pause/open) |

**Prompts (3)**
| Event | Fired From | Key Params |
|-------|-----------|------------|
| `prompt_copied` | PromptsPage | `prompt_id`, `prompt_title`, `category` |
| `prompt_voted` | PromptsPage | `prompt_id`, `prompt_title`, `category` |
| `prompt_commented` | PromptsPage | `prompt_id`, `prompt_title`, `category` |

**Library (4)**
| Event | Fired From | Key Params |
|-------|-----------|------------|
| `ebook_clicked` | LibraryPage | `book_id`, `book_title`, `topic`, `status` |
| `ebook_downloaded` | LibraryPage | `book_id`, `book_title`, `topic` |
| `ebook_notify` | LibraryPage | `book_id`, `book_title`, `topic` |
| `library_filter_change` | LibraryPage | `topic` |

**Freemium Gating (1)**
| Event | Fired From | Key Params |
|-------|-----------|------------|
| `gated_cta_click` | GatedOverlay | `location` (idea_detail/ideas_analytics/etc), `title` |

**Navigation (5)**
| Event | Fired From | Key Params |
|-------|-----------|------------|
| `cta_click` | HomePage, PromptsPage, FlyBotLandingPage, IdeaSubmissionPage, IdeaDetailPage | `cta`, `location` |
| `newsletter_click` | NewsletterPage, AboutPage, HomePage | `location` |
| `article_click` | NewsletterPage, HomePage | `article_title`, `location` |
| `outbound_click` | Footer, AboutPage, GarminToNotionPage, WebsiteBlueprintPage, NewsletterPage, IdeaDetailPage, SourceBadge, GitHubHeatmap | `link_url`, `link_label`, `location` |
| `project_click` | ExplorePage | `project`, `category` |

**User (3)**
| Event | Fired From | Key Params |
|-------|-----------|------------|
| `profile_updated` | ProfilePage | `fields_filled` |
| `waitlist_joined` | MicroSaasPage | `source` |
| `page_not_found` | NotFoundPage | `page_path`, `page_referrer` |
| `language_changed` | LanguageToggle | `language` |

**System (1)**
| Event | Fired From | Key Params |
|-------|-----------|------------|
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
R2_ACCOUNT_ID=your-cloudflare-account-id (for music upload)
R2_ACCESS_KEY_ID=your-r2-access-key
R2_SECRET_ACCESS_KEY=your-r2-secret-key
R2_BUCKET_NAME=flylabs-music
R2_PUBLIC_URL=https://pub-xxx.r2.dev
```

## Git
- **Main branch:** `main` (auto-deploys to Vercel)
- **Node version:** 20.19.1 (see .nvmrc)
