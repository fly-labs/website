# Changelog

All notable changes to FlyLabs (flylabs.fun) are documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/). Versioning follows [Semantic Versioning](https://semver.org/).

## [1.25.0] - 2026-03-21

### Added
- Competition-aware scoring: pre-score competitor scout via Grok x_search + optional OpenAI GPT-4o-mini
- `scout-competitors.mjs` script: searches for competitors before scoring, stores in meta.competitor_scout
- `incumbent_strength` sub-dimension (0-4) in FL Method Pillar 2 (IS THERE A GAP?)
- `competition_level` field in score synthesis (none/low/moderate/crowded/dominated)
- Post-enrichment FL score adjustment for crowded markets with funded competitors
- Competitor intelligence display on idea detail pages (market maturity badge, funded/big tech indicators, FL adjustment note)
- "Scout" step in ScoringFrameworksPage pipeline visual (Find -> Scout -> Score -> Validate -> Verdict)
- `npm run scout` command

### Changed
- Pillar 2 reframed: sub-dimensions now 0-7/0-7/0-7/0-4 (was 0-8/0-8/0-9), competition awareness replaces "competition is GOOD"
- Scoring prompt receives live competitor data from scout when available
- Enrichment saturation cap: semantic gap detection replaces string length check
- Funded competitor detection: 3+ funded competitors without specific gap triggers VALIDATE_FIRST cap
- Enrichment can now adjust FL score downward (-10 to -15) for crowded markets
- Pipeline order: Sync -> Scout -> Score -> Enrich (was Sync -> Score -> Enrich)
- Daily GitHub Actions workflow includes scout step before scoring

## [1.24.0] - 2026-03-18

### Added
- YC Lens as 5th scoring framework with "Build From Here" angle
- FlyBot upgrade with YC Lens context integration

### Changed
- Score histogram Y-axis improved for legibility
- SEO page titles cleaned, hardcoded numbers removed
- X sync expanded with builder community search patterns

## [1.23.0] - 2026-03-16

### Fixed
- Verdict integrity: frontend was using enrichment verdict instead of materialized column, showing BUILD for FL<65 ideas
- FlyBoard fonts: EXCALIDRAW_ASSET_PATH set in index.html, proper font IDs, mutateElement for font/size changes
- API cost crisis: infinite loop in backfill-all.mjs re-scoring all ideas. Credit exhaustion detection added to all 7 scripts
- FlyBot chat header spacer for fixed header overlap, auto-scroll with requestAnimationFrame

### Changed
- FlyBoard UX: fullscreen overlay removed (was blocking toolbar), 5s interval autosave, board state persists on navigation
- Security: email flash in header fixed, CFA removed from schema.org and SEO keywords, Dependabot enabled
- Analytics cards design unified, GitHub heatmap layout improved

## [1.22.0] - 2026-03-15

### Added
- FlyBot feedback system: thumbs up/down on assistant messages with optional comment on thumbs down
- Cross-session memory: FlyBot remembers user context across conversations (10 keys, 200 chars each)
- Real message IDs returned from API for feedback targeting

### Changed
- Feedback buttons hover-reveal on desktop, always-visible on mobile
- DB_TABLE_COUNT 11 to 13, GA4_EVENT_COUNT 64 to 65

## [1.21.0] - 2026-03-15

### Added
- FlyBot x FlyBoard integration via CustomEvent bridge pattern (add_elements, load_template, clear actions)
- Shape fill UX: 9 fill colors, 3 fill styles (hachure, cross-hatch, solid), persisted to localStorage
- Board-specific prompts and capabilities card in ChatEmpty on /flyboard

### Changed
- GA4_EVENT_COUNT 61 to 64 (3 new FlyBoard events)

## [1.20.0] - 2026-03-15

### Added
- FlyBoard locked tool mode for multi-placement (rectangle, text, arrow stay active)
- Sitemap entries for /templates/launch-checklist and /templates/one-page-business-plan

### Fixed
- Analytics crash: Math.max(...[]) returning -Infinity in heatmap opacity calculations
- FlyBoard dark mode filter targeting both canvas tag and .excalidraw__canvas class
- Unused imports removed (Minus, Line)

### Changed
- siteStats updated: SCRIPT_COUNT 13, GA4_EVENT_COUNT 61, DB_TABLE_COUNT 11, RPC_COUNT 10
- CLAUDE.md full analytics table rewrite (61 events in 11 categories)

## [1.19.0] - 2026-03-15

### Added
- Premium Analytics Intelligence: Momentum Dashboard, Top 10 Leaderboard with Hidden Gems, Framework Disagreement Detector, Industry Intelligence Matrix, Opportunity Map scatter chart
- FlyBot real-time analytics integration: industry intelligence, source momentum, score trends, hidden gems in context
- "Which industries are trending this week?" prompt in ChatEmpty
- "Live analytics intelligence" capability card on FlyBot landing page

### Changed
- IdeasAnalyticsPage upgraded from 1067 to 1509 lines with 7 new intelligence sections
- FlyBot search intent upgraded with industry pattern detection and confidence filtering

## [1.18.0] - 2026-03-15

### Changed
- FL score IS the score: composite_score = flylabs_score, experts are bonus reading only
- Rename "Idea Lab" to "Ideas Lab" across ~30 files
- Sort options reduced from 10 to 6 (removed hormozi/koe/okamoto/validation)
- IdeaDetailPage: FL score prominent with "The Score" section, expert perspectives collapsible
- ScoringFrameworksPage rewritten with Find, Score, Validate, Verdict flow
- ChatEvaluation: FL score 4xl, experts in compact row, DYOR footer

## [1.17.0] - 2026-03-15

### Changed
- FlyBot first message rewritten: curiosity first, data second, under 30 words
- ChatEmpty prompts reordered (strongest first, added music prompt)
- ChatInput placeholder updated to "Describe an idea, ask for prompts, or just talk..."
- Music branding unified: "lofi + bossa nova" to "lofi" across all files

### Added
- FlyBot hint card on IdeaSubmissionPage (opens widget via useChatContext)
- MusicPanel UX: mobile-visible scrubber thumb, spacebar play/pause, iOS volume detection

## [1.16.0] - 2026-03-15

### Added
- Vibe Coding Music Player: 15 CC0 lofi tracks with HTML5 Audio + Web Audio API visualizer
- 3-file widget pattern (MusicWidget/MusicTrigger/MusicPanel) with floating equalizer trigger
- MusicContext with 6 vibe modes, shuffle, MediaSession API for lock screen controls
- FlyBot music integration via CustomEvent bridge (play, pause, open actions)
- DPR-aware canvas visualizer with drag-to-seek progress bar
- scripts/setup-music.mjs for Supabase Storage upload and tracks.js generation
- 4 new GA4 events (music_player_toggled, music_track_played, music_track_skipped, music_flybot_control)

## [1.15.0] - 2026-03-15

### Added
- FlyBot: full-stack conversational AI vibe building partner
- Backend: Vercel Serverless Functions with SSE streaming (api/chat.js, api/conversations.js)
- 4-layer system prompt with full knowledge base (coach-prompt.js)
- 7 chat components: ChatMessages, ChatMessage (markdown + eval cards), ChatInput, ChatEvaluation, ChatSidebar, ChatEmpty, ChatLimitReached
- Rich idea evaluation with JSON tags parsed into score cards
- Claude Haiku for users, Sonnet for admin. 5 free messages then waitlist
- 3 new GA4 events

## [1.14.0] - 2026-03-14

### Added
- FlyBot Landing Page at /flybot (public) with hero, capability cards, how it works, animated stats
- Twitter @alvesluizc creator/site tags in SEO.jsx
- LoginPage, SignupPage, GarminToNotionPage noindexed

### Fixed
- IdeaSubmissionPage analytics pill responsive text on mobile
- IdeasAnalyticsPage hero badges flex-wrap
- FlyBotPage sidebar button 44px touch target

### Changed
- FlyBot chat moved from /coach to /flybot/chat (protected)
- HomePage expanded to 6 pillars (FlyBot added)
- SEO descriptions trimmed to <160 chars across key pages

## [1.13.0] - 2026-03-14

### Added
- Newsletter integration: Substack archive API with rss2json fallback, engagement metrics (reactions, comments, restacks)
- HomePage 3-card newsletter preview section
- Ideas Analytics dashboard at /ideas/analytics with 10 recharts visualizations
- Recharts lazy-loaded as separate vendor chunk

### Changed
- CSP updated for falacomigo.substack.com
- Route count increased to 21

## [1.12.0] - 2026-03-10

### Added
- Dedicated idea detail page at /ideas/:id replacing IdeaDrawer side panel
- ScoreUtils.jsx: shared scoring utilities (getScoreTier, ScoreBar, FRAMEWORK_CONFIG)
- Mobile sticky action bar on idea detail page
- SEO: BreadcrumbList + Article schema on detail pages
- New analytics: idea_detail_opened, idea_shared

### Changed
- IdeaCard navigates via useNavigate instead of opening drawer
- Legacy ?idea= URLs redirect to /ideas/:id
- IdeaDrawer.jsx deleted

## [1.11.0] - 2026-03-10

### Changed
- Design system refined: softer green (hsl 142 72% 50%), muted violet accent, warmed dark background
- Typography upgraded from Nunito to Inter, heading letter-spacing -0.02em
- Buttons flattened: removed 3D border-b-4 and neon glow, added brightness hover
- Cards simplified: thinner borders, subtler shadows
- Header polished: font-medium nav, bottom dot active indicator
- GeometricBackground rewritten with 7 lab doodle SVGs (flask, beaker, atom, plane, bulb, DNA, test tube)
- Explore page renamed from "The Playground", all project descriptions rewritten
- IdeaCard simplified: only verdict + FL score on cards

### Fixed
- score-ideas.mjs: score clamping, verdict validation, composite recomputation
- enrich-ideas.mjs: Reddit token expiry tracking with auto-refresh
- sync-hackernews.mjs + sync-github.mjs strip source prefixes from titles

## [1.10.0] - 2026-03-10

### Added
- YC Graveyard as 8th source: sync-yc.mjs syncs ~1,700 dead YC startups filtered by Claude for solo builder viability
- meta JSONB column for source-specific context (YC failure_analysis)
- IdeaDetailPage: YC Graveyard section (failure reason, what changed, rebuild angle)
- Portuguese queries: 3 BR subreddits, 2 PT search prompts in X sync, PT evidence in enrichment

### Changed
- Shared verdictColors/verdictLabels constants extracted to ideas.js
- Source count updated to 8 across all pages
- Dead shippedItems code removed from IdeaSubmissionPage

## [1.9.0] - 2026-03-09

### Changed
- Remove Okamoto decision governance (FOLLOW/ADJUST/PIVOT), only BUILD/VALIDATE_FIRST/SKIP verdict decides
- IdeaCard mobile: badge flex-wrap, vertical stacking, 3-line clamp
- IdeaDrawer mobile: full-width, verdict hero stacking, 44px touch targets
- IdeaFilterSheet close button 44px, sort toolbar stacking on mobile

## [1.8.0] - 2026-03-09

### Added
- Fly Labs Method as primary scoring framework: Problem Clarity (30pts), Solution Gap (25pts), Willingness to Act (25pts), Buildability (20pts)
- flylabs_score column + database index
- FL badge (indigo) on IdeaCard

### Changed
- Fly Labs Method is primary (40% weight), verdict rules updated (flylabs >= 60)
- Hormozi Value Equation rebalanced (Dream Outcome 0-7, Likelihood/Speed/Effort 0-6)
- ScoringFrameworksPage redesigned: Fly Labs Method first, expert perspectives framing
- Enhanced sync filters with Fly Labs problem quality lens across all 5 sync scripts

## [1.7.0] - 2026-03-08

### Added
- Hacker News as 6th source via Firebase API (top+ask stories, Claude AI batch filter)
- GitHub Issues as 7th source via Search API (8 market-level pain queries, pre-AI keyword scoring)
- useIdeaFilters hook: 7 filter dimensions, URL state persistence, cascading counts, active filter chips
- IdeaFilterSheet component (mobile bottom sheet + desktop inline panel)
- Full-text search, verdict tabs, score/confidence filtering, smart empty states

## [1.6.0] - 2026-03-08

### Added
- published_at column for original publication dates from sources
- Verdict system: BUILD/VALIDATE_FIRST/SKIP with per-pillar reasoning and synthesis
- Enrichment with evidence confidence levels (high/medium/low)
- Verdict hero in drawer, reasoning under each ScoreBar, verdict badge on cards, verdict sort

### Changed
- Reddit quality upgrade: higher thresholds + Claude AI batch filter
- Scoring engine outputs per-pillar reasoning + synthesis verdict

## [1.5.0] - 2026-03-08

### Added
- X/Twitter as 5th source via Grok xAI API with x_search tool
- Dual-source validation: Grok x_search primary + Reddit secondary with OAuth support
- Reddit OAuth auto-upgrade in sync-reddit.mjs

### Fixed
- Code fence parsing fix in score-ideas.mjs
- sync-x.mjs retry logic for resilience

## [1.4.0] - 2026-03-07

### Added
- Bruno Okamoto MicroSaaS validation score as 3rd scoring framework
- Product Hunt as 4th source (OAuth + GraphQL sync, Haiku extracts underlying problems)
- Validation enrichment pipeline: Reddit cross-validation + competitive analysis
- Validation Layer section on /scoring page, V badge + validation/competitors in drawer

### Changed
- Rename "Idea Board" to "Idea Lab" across codebase

## [1.3.0] - 2026-03-06

### Added
- Library page with free ebooks, topic filter, and waitlist
- ScrollProgress component (2px Framer Motion scroll bar)
- SEO schemas (BreadcrumbList, Article)

### Changed
- Home + About pages restructured (3 sections, timeline, 5/page default)
- Category reorganization: Business, Tools, Learn (flat grid with filter)
- ProblemHunt sync rewritten to use Tilda feed API with UID-based external_ids

### Fixed
- Prompt suggest form (missing name column)
- Gradient text removed from 5 pages (convention added)
- Supabase import consistency across codebase

## [1.2.0] - 2026-03-06

### Added
- Ideas Lab: paginated idea list with multi-step submission form
- AI scoring with Hormozi Value Equation + Dan Koe Alignment Score
- Rate limiting for idea submissions (3 per email per 24h)
- ProblemHunt sync via GitHub Actions (daily at 6 AM UTC)
- /scoring page explaining all frameworks

### Changed
- Hormozi/Koe sort options added
- HomePage pillar rename

## [1.1.0] - 2026-03-05

### Added
- Type badges on project cards
- Hot sort with trending badges
- Copy counts on prompts
- Builder's Notes sections on template pages
- 2 new template pages (Launch Checklist, One Page Business Plan)
- Website Blueprint card on Explore page
- Suggest a Prompt form

### Fixed
- AnimatePresence blocking lazy-loaded route transitions

## [1.0.0] - 2026-03-04

### Added
- GA4 analytics: 14 custom events across 12 files, user properties on auth state change
- react-helmet-async migration for SEO
- Security headers: CSP, HSTS, COOP, Permissions-Policy in vercel.json
- CLAUDE.md coding conventions established

### Fixed
- Mobile tap failures: removed transition-all, hover transforms, and layout props from tappable elements
- Mobile responsiveness fixes across 8 files
- README rewritten for accuracy
