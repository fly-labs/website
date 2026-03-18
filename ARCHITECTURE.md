# Architecture

## Overview

FlyLabs is a React SPA backed by Supabase (PostgreSQL + Auth), Vercel Serverless Functions, and Claude AI. This stack was chosen for solo-builder velocity: Supabase eliminates the need to manage a database server or write auth from scratch, Vercel deploys on every push to `main` with zero config, and React with Vite keeps the feedback loop under 2 seconds. There is no TypeScript. The tradeoff is intentional: for a solo builder iterating fast, type safety slows down more than it protects. If the team grows, this decision gets revisited.

## Scoring Pipeline

```
Sources (9)          Sync Scripts          Supabase           Score               Enrich            Frontend
 ProblemHunt    -->                   -->            -->                    -->               -->
 Reddit              (Claude Haiku        (ideas table)      (Claude Sonnet)     (Grok x_search     IdeaDetailPage
 Product Hunt         filters junk)                           FL Method:          + Reddit)           IdeaCard
 X/Twitter                                                    4 questions,                            IdeasAnalytics
 Hacker News                                                  one score,
 GitHub Issues                                                one verdict
 YC Graveyard
 Community
```

**Why two AI tiers.** Sync scripts process hundreds of raw items per run. Most are noise. Claude Haiku filters them at roughly 1/10th the cost of Sonnet. Scoring is quality-critical because the verdict (BUILD / VALIDATE_FIRST / SKIP) is the product. Claude Sonnet handles scoring and enrichment synthesis because a wrong verdict erodes trust.

**Why the Fly Labs Method is primary.** The system started with three expert frameworks (Hormozi, Koe, Okamoto) weighted equally. In practice, the composite score was hard to explain and the frameworks sometimes disagreed in confusing ways. The fix: one proprietary method with four clear questions (Is the pain real? Is there a gap? Would someone pay? Can you build it?), one score 0-100, one verdict. Expert scores still exist in `score_breakdown` JSONB for the detail page, but they do not affect the verdict. Simplicity for the reader won over theoretical completeness.

**Why five frameworks exist if only one decides.** The four expert perspectives (Hormozi Value Equation, Dan Koe positioning, Okamoto micro-SaaS lens, YC Lens) add depth for users who want to dig deeper. The YC Lens is the newest addition, asking the questions Y Combinator uses to evaluate products: demand reality, desperate specificity, narrowest wedge. They cost almost nothing extra since Claude scores all five in a single prompt call. Removing them would lose information without saving money.

**Why enrichment is a separate step.** Scoring uses only the idea description. Enrichment cross-references real-world evidence (Grok web search + Reddit threads) to validate whether the problem actually exists in the wild. Running them together would make the scoring prompt enormous and unreliable. Separating them also means enrichment can fail gracefully without blocking scores.

## FlyBot Architecture

```
React Frontend        Vercel Serverless         Claude API        Supabase
 ChatInput.jsx   -->   api/chat.js          -->  Haiku/Sonnet  --> conversations
 (SSE stream)          (JWT auth, rate limit,                      messages
                        memory injection,                          flybot_memory
                        tag parsing)                               flybot_feedback
```

**Why SSE over WebSockets.** Vercel Serverless Functions support streaming responses natively. WebSockets require a persistent connection and a different infrastructure (like a dedicated server or Vercel's Edge Runtime with Durable Objects). SSE is simpler, works within the existing deployment model, and matches the LLM streaming pattern perfectly: server sends tokens, client renders them. The connection closes when the response is done.

**Why Haiku for users, Sonnet for admin.** At 5 free messages per user, FlyBot needs to be cheap per interaction. Haiku handles conversational coaching well enough. The admin (Luiz) gets Sonnet for testing and deeper analysis. If revenue justifies it, the tier boundary moves.

**Why cross-session memory.** FlyBot stores up to 10 key-value pairs per user (what they are building, their tools, their goals). This means the second conversation picks up where the first left off without the user repeating context. The model outputs `<memory>` tags that the server parses and stores. The alternative was stuffing entire conversation history into the prompt, which burns tokens and hits context limits fast.

**Why the CustomEvent bridge pattern.** FlyBot can control the music player ("play some lofi") and the whiteboard ("draw a business model canvas"). These features live in separate React contexts (MusicContext, BoardContext). Wiring them through shared React state would create tight coupling and circular dependencies. Instead, `useChat.js` dispatches browser CustomEvents (`flybot-music-action`, `flybot-board-action`), and the respective contexts listen. This keeps each feature independently testable and removable.

## Data Flow

**Supabase as single source of truth.** All ideas, scores, enrichment data, conversations, and user profiles live in PostgreSQL via Supabase. The frontend reads directly from Supabase using the client SDK. Server-side scripts write scores and enrichment results back to the same tables. There is no separate API layer for data reads. This simplifies the architecture at the cost of coupling the frontend to Supabase's query interface.

**Why Row Level Security.** RLS policies ensure that users can only read their own conversations, messages, and profile data. This matters because the Supabase anon key is exposed in the frontend bundle. Without RLS, anyone with the key could read other users' data. RLS moves authorization into the database layer where it cannot be bypassed by client-side code.

**Why materialized columns for verdict, confidence, and composite_score.** These values are computed by server-side scripts and written directly to columns on the ideas table. The alternative (computing them from `score_breakdown` JSONB in every query) would make filtering and sorting impossible at the database level. Seven-dimension filtering (search, source, type, industry, verdict, score threshold, confidence) requires these columns to be indexable.

**Why score_breakdown and enrichment are JSONB.** Each scoring framework has different fields. Hormozi has four sub-scores, Koe has three, Okamoto has three, and the FL Method has four. JSONB lets each framework store its breakdown without requiring a normalized table per framework. The same logic applies to enrichment: competitor lists, evidence summaries, and confidence breakdowns vary in shape. JSONB absorbs that variance.

**Why meta JSONB exists separately.** The `meta` column stores source-specific context that does not fit the standard schema. Currently only YC Graveyard uses it (failure_analysis with company name, batch, why it failed, what changed). Keeping it separate from score_breakdown and enrichment avoids polluting those structured fields with source-specific data.

## Frontend Patterns

**Why lazy loading for Recharts and Excalidraw.** Recharts adds ~180KB gzipped. Excalidraw is even larger. Most visitors never visit the analytics dashboard or the whiteboard. Vite's `manualChunks` configuration splits these into separate vendor bundles that load only when the route is accessed. The initial page load stays under 200KB.

**Why GatedOverlay for freemium.** The freemium model needs to show value before asking for signup. Blurring content behind a GatedOverlay lets guests see that scores, charts, and analysis exist without revealing the actual data. This is more persuasive than a blank "sign up to see this" wall. Two variants handle different layouts: `overlay` for full sections (analytics charts), `inline` for compact badges (individual score fields).

**Why no TypeScript.** This is a solo project built on weekends. TypeScript adds friction to every file, every prop, every API response. The codebase is small enough (39 components, 24 routes) that the builder holds the full mental model. JSX with prop destructuring at the top of each component documents the interface well enough. The tradeoff reverses if a second developer joins.

**Why no Redux or external state library.** Auth and theme are the only truly global state. Everything else is local to a page or a feature. React Context handles the two global cases without adding a dependency. Chat state, board state, and music state each get their own context because they are feature-scoped, not app-scoped.

**Why AnimatePresence is never used on Routes.** Early in development, wrapping `<Routes>` in Framer Motion's `AnimatePresence` caused lazy-loaded route transitions to hang. The exit animation would block the incoming route from mounting. The fix: use AnimatePresence only for local UI (modals, toasts, accordions), never for route-level transitions.

## Cost Architecture

**Sync scripts use batch processing.** Each sync script collects raw items from its source API, then sends them to Claude Haiku in batches for filtering. This reduces the number of API calls compared to evaluating items one at a time. All seven sync scripts include credit exhaustion detection and exit immediately if the Anthropic balance is too low. This guard was added after a runaway backfill process burned through credits.

**Cloudflare R2 for music storage.** R2 has zero egress fees. The music player streams 120 tracks (~1GB total) directly from R2 public URLs. With S3, egress costs would scale linearly with listeners. R2 eliminates that variable cost entirely. The upload script (`setup-music.mjs`) uses the S3-compatible API, so switching providers later would be straightforward.

**GitHub Actions for daily orchestration.** Two workflows run on a schedule: "Sync Ideas" at 6 AM UTC (all 7 source syncs + scoring) and "Enrich Ideas" at 4 AM UTC (validation of top-scoring ideas). Running these as cron jobs on GitHub Actions costs nothing within the free tier and avoids maintaining a separate scheduler or server.

**Vercel for hosting and serverless.** The free tier covers the SPA hosting and the serverless functions (chat, conversations, feedback). Auto-deploy on push to `main` means zero deployment friction. The serverless functions have cold start latency, but for a chat interface with SSE streaming, the initial delay is masked by the time it takes the LLM to start generating tokens.
