import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Globe, Code, Zap, Palette, Layers, Navigation, Sparkles,
  Smile, Database, BarChart3, Layout, AtSign, ShieldCheck, CheckCircle2,
  GitBranch, Rocket, Moon, Sun, ArrowRight, MessageSquare, Brain, Search,
  Users, BookOpen, Lightbulb, Terminal, Clock, Music,
} from 'lucide-react';
import { PageLayout } from '@/components/PageLayout.jsx';
import { motion } from 'framer-motion';
import { fadeUp } from '@/lib/animations.js';
import { trackEvent } from '@/lib/analytics.js';
import {
  SOURCE_COUNT, PROMPT_COUNT, CATEGORY_COUNT, CATEGORY_LIST,
  VIBE_COUNT, TRACK_COUNT,
} from '@/lib/data/siteStats.js';

const GITHUB_URL = 'https://github.com/fly-labs/website';

const heroStats = [
  { label: 'Data Sources', value: String(SOURCE_COUNT) },
  { label: 'Scoring Questions', value: '4' },
  { label: 'Prompts', value: String(PROMPT_COUNT) },
  { label: 'Vibe Modes', value: String(VIBE_COUNT) },
  { label: 'Tracks', value: String(TRACK_COUNT) },
  { label: 'Categories', value: String(CATEGORY_COUNT) },
];

const platformSections = [
  {
    stage: 'Ideation',
    title: 'Ideas Lab',
    route: '/ideas',
    desc: `${SOURCE_COUNT} automated sources pull real problems from Reddit, X, Hacker News, GitHub Issues, Product Hunt, ProblemHunt, the YC Graveyard, and the community. Claude AI asks 4 questions about each idea. Grok validates against real conversations. BUILD, VALIDATE, or SKIP.`,
    highlights: [`${SOURCE_COUNT} sources`, '4 questions, 1 verdict', 'Market validation'],
    icon: Lightbulb,
    color: 'border-primary',
  },
  {
    stage: 'Ideation',
    title: 'Scoring Frameworks',
    route: '/scoring',
    desc: 'The Fly Labs Method asks 4 questions, gives one score, one verdict. Hormozi, Dan Koe, Okamoto, and the YC Lens add expert perspectives on the detail page. Per-pillar reasoning throughout.',
    highlights: ['4 questions, 1 score', 'Per-pillar reasoning', '4 expert perspectives'],
    icon: BarChart3,
    color: 'border-secondary',
  },
  {
    stage: 'Ideation',
    title: 'Prompt Library',
    route: '/prompts',
    desc: `${PROMPT_COUNT} prompts across ${CATEGORY_LIST}. 10 free for everyone, full library for members. Community voting, comments, and suggestions.`,
    highlights: [`${PROMPT_COUNT} prompts`, `${CATEGORY_COUNT} categories`, 'Voting + comments'],
    icon: Sparkles,
    color: 'border-accent',
  },
  {
    stage: 'Building',
    title: 'Templates',
    route: '/templates',
    desc: 'Blueprints for builders. Garmin-to-Notion sync and this Website Blueprint. Built from real workflows, open source.',
    highlights: ['2 live templates', 'Open source'],
    icon: Layout,
    color: 'border-primary',
  },
  {
    stage: 'Building',
    title: 'Micro Tools',
    route: '/microsaas',
    desc: 'Small, focused apps that do one thing well. Waitlist is live, first batch coming soon.',
    highlights: ['Building next', 'Waitlist live'],
    icon: Zap,
    color: 'border-secondary',
  },
  {
    stage: 'Building',
    title: 'FlyBot',
    route: '/flybot',
    desc: 'AI-powered vibe building partner. Asks 4 questions about your idea, gives one score, one verdict. Also helps write content and controls the lofi player. Claude-powered, 10 free messages during beta.',
    highlights: ['AI partner', '4 questions, 1 verdict', 'Music control', 'Beta'],
    icon: Brain,
    color: 'border-accent',
  },
  {
    stage: 'Building',
    title: 'Vibe Coding',
    route: null,
    desc: `Built-in lofi music player with ${VIBE_COUNT} vibe modes and ${TRACK_COUNT} tracks. Pick your mood, get matched beats. CC0 tracks on Cloudflare R2, Web Audio visualizer, lock screen controls. FlyBot can start it for you.`,
    highlights: [`${VIBE_COUNT} vibe modes`, `${TRACK_COUNT} tracks`, 'FlyBot integration'],
    icon: Music,
    color: 'border-primary',
  },
  {
    stage: 'Compounding',
    title: 'Library',
    route: '/library',
    desc: 'Free ebooks distilled from real reading. AI, business, mindset. Topic filtering and waitlist for upcoming titles.',
    highlights: ['Free ebooks', '5 topics'],
    icon: BookOpen,
    color: 'border-accent',
  },
];

const stackItems = [
  { name: 'Gemini 2.5 Flash', icon: Brain, desc: '4 questions per idea. Per-pillar reasoning. One score, one verdict. Google Search for web intelligence.', color: 'border-accent' },
  { name: 'Grok xAI', icon: Search, desc: 'X/Twitter research via x_search. Real conversation evidence and competitor landscape.', color: 'border-primary' },
  { name: 'Supabase', icon: Database, desc: 'PostgreSQL + Auth + RLS. JSONB columns, materialized verdicts, atomic RPCs.', color: 'border-secondary' },
  { name: 'GitHub Actions', icon: GitBranch, desc: `${workflows.length} workflows. Sync + score daily, auto-deploy on push.`, color: 'border-accent' },
  { name: 'React 18', icon: Code, desc: 'UI framework. Lazy-loaded routes. JSX, no TypeScript.', color: 'border-primary' },
  { name: 'Vite 7', icon: Zap, desc: 'Dev server and builds. Vendor/motion/supabase chunking.', color: 'border-secondary' },
  { name: 'Tailwind CSS', icon: Palette, desc: 'Utility-first with HSL theming. Light and dark mode.', color: 'border-accent' },
  { name: 'shadcn/ui', icon: Layers, desc: 'Radix primitives with CVA variants.', color: 'border-primary' },
  { name: 'React Router v7', icon: Navigation, desc: 'Client-side SPA. URL state persistence for filters.', color: 'border-secondary' },
  { name: 'Framer Motion 11', icon: Sparkles, desc: 'Scroll-triggered animations. No layout thrashing.', color: 'border-accent' },
  { name: 'Lucide React', icon: Smile, desc: 'Tree-shakeable icon library.', color: 'border-primary' },
  { name: 'Google Analytics 4', icon: BarChart3, desc: 'Custom events across every feature. User properties. Debug mode in dev.', color: 'border-secondary' },
  { name: 'react-helmet-async', icon: Globe, desc: 'SEO meta tags, Open Graph, JSON-LD schemas.', color: 'border-accent' },
  { name: 'Web Audio API', icon: Music, desc: 'Frequency visualizer. DPR-scaled canvas, 16-bar lerp smoothing.', color: 'border-accent' },
  { name: 'Vercel', icon: Rocket, desc: 'Push to main, deployed in seconds.', color: 'border-primary' },
];

const dataSources = [
  { name: 'Reddit', detail: '19 subreddits incl. 3 Portuguese. Claude AI batch filter.', icon: MessageSquare },
  { name: 'X / Twitter', detail: 'Grok xAI x_search. 8 prompts, rotates 2 daily.', icon: AtSign },
  { name: 'Hacker News', detail: 'Firebase API. Ask + Show stories. 70%+ Claude rejection rate.', icon: Zap },
  { name: 'GitHub Issues', detail: 'Search API. Pain-point queries. 35+ repo exclusions.', icon: GitBranch },
  { name: 'Product Hunt', detail: 'GraphQL API. Claude extracts underlying problems.', icon: Rocket },
  { name: 'ProblemHunt', detail: 'Tilda feed API. Daily sync of real user problems.', icon: Globe },
  { name: 'YC Graveyard', detail: 'yc-oss API. ~1,700 dead startups filtered for solo builders.', icon: Database },
  { name: 'Community', detail: '3-step form. Rate limiting + honeypot defense.', icon: Users },
];

const workflows = [
  { name: 'Sync Ideas', schedule: 'Daily', desc: 'ProblemHunt, Reddit, Product Hunt, X, HN, GitHub, YC. Then research (Grok + Reddit + Google Search) and score with Gemini.' },
  { name: 'CI', schedule: 'Every PR', desc: 'Lint + build. Catches breaks before deploy.' },
];

const scripts = [
  { name: 'sync-problemhunt', desc: 'Tilda feed API' },
  { name: 'sync-reddit', desc: 'Reddit OAuth + 19 subreddits' },
  { name: 'sync-producthunt', desc: 'Product Hunt GraphQL' },
  { name: 'sync-x', desc: 'Grok xAI x_search' },
  { name: 'sync-hackernews', desc: 'Firebase API' },
  { name: 'sync-github', desc: 'GitHub Search API' },
  { name: 'sync-yc', desc: 'yc-oss dead startups' },
  { name: 'score-ideas', desc: 'Research + Gemini 2.5 Flash scoring' },
  { name: 'backfill-yc', desc: 'YC Lens backfill (Haiku)' },
  { name: 'clean-titles', desc: 'One-time DB cleanup' },
  { name: 'setup-music', desc: 'Upload tracks to Cloudflare R2' },
];

const folderTree = `src/
  components/
    ui/             # shadcn/ui (button, avatar, input, tabs, toast)
    ideas/          # IdeaCard, IdeaFilterSheet, IdeaSubmitModal, ScoreUtils, SourceBadge
    chat/           # FlyBot chat (messages, input, evaluation cards)
    flybot/         # FlyBot widget (trigger, panel)
    music/          # Vibe Coding player (widget, trigger, panel + visualizer)
    Header.jsx      # Sticky nav, blur backdrop
    PageLayout.jsx  # SEO + Header + Footer + ScrollProgress
    AuthModal.jsx   # Login/signup (tabs, Google OAuth)
  pages/            # One file per route, lazy-loaded
  hooks/
    useIdeaFilters.js  # Server-side pagination, URL state, 7 filter dimensions
    useChat.js         # FlyBot state (messages, streaming, conversations)
  lib/
    data/           # projects, prompts, ideas, library, tracks
    analytics.js    # GA4 helpers
    supabaseClient.js
  contexts/         # Auth, Chat, Music, Theme
scripts/            # ${scripts.length} scripts
.github/workflows/  # ${workflows.length} workflows`;

const dbHighlights = [
  { title: 'JSONB Columns', desc: 'score_breakdown (per-framework reasoning), meta.research (X evidence, competitors, Reddit, web intelligence), meta.failure_analysis (YC context).', icon: Layers },
  { title: 'Materialized Columns', desc: 'verdict, confidence, flylabs_score (= composite_score). Written by scripts, used for server-side filtering.', icon: Zap },
  { title: 'Row Level Security', desc: 'Every table has RLS. Public read for approved ideas, auth-gated writes.', icon: ShieldCheck },
  { title: 'RPCs', desc: 'Atomic operations: vote incrementing, rate limiting, waitlist counts, prompt votes.', icon: Code },
];

const securityItems = [
  'Email/password + Google OAuth via Supabase',
  'Row Level Security on every database table',
  'Rate limiting on idea submissions (3/email/24h)',
  'Honeypot defense in submission RPCs',
  'CSP (incl. media-src for audio streaming), HSTS, COOP, Permissions-Policy headers',
  'Input validation on all user-facing forms',
  'No secrets in client-side code',
  'Every page lazy-loaded via React.lazy',
  'Vendor/motion/supabase chunk splitting',
  'Viewport-triggered animations, no layout thrash',
  'GitHub Actions CI on every PR',
  'Push to main = live via Vercel',
];

const stageColors = {
  Ideation: 'text-primary bg-primary/10 border-primary/30',
  Building: 'text-secondary bg-secondary/10 border-secondary/30',
  Compounding: 'text-accent bg-accent/10 border-accent/30',
};

const stageDotColors = {
  Ideation: 'bg-primary',
  Building: 'bg-secondary',
  Compounding: 'bg-accent',
};

const WebsiteBlueprintPage = () => {
  const handleGitHubClick = (location) => {
    trackEvent('outbound_click', {
      link_url: GITHUB_URL,
      link_label: 'GitHub',
      location,
    });
  };

  // Group platform sections by stage for the timeline
  const stages = [...new Set(platformSections.map((s) => s.stage))];

  return (
    <PageLayout
      seo={{
        title: "Website Blueprint - How flylabs.fun Was Built | Fly Labs",
        description: "How flylabs.fun was built. React, Supabase, Claude AI, Grok, open source. Full stack breakdown of every layer.",
        keywords: "website blueprint, React SPA, open source, Supabase, AI scoring, data pipeline, Claude AI, Grok, Tailwind CSS, Vite, web development, architecture guide",
        url: "https://flylabs.fun/templates/website-blueprint",
        schema: [
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://flylabs.fun/" },
              { "@type": "ListItem", "position": 2, "name": "Templates", "item": "https://flylabs.fun/templates" },
              { "@type": "ListItem", "position": 3, "name": "Website Blueprint" },
            ],
          },
        ],
      }}
      className="pt-32 pb-24"
    >
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">

          {/* Back link */}
          <Link to="/explore" className="inline-flex items-center text-muted-foreground hover:text-foreground font-bold mb-8 transition-colors bg-card px-4 py-2 rounded-xl border border-border shadow-sm">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Explore
          </Link>

          {/* Section 1: Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-24"
          >
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary font-bold text-sm border border-primary/20">
                <Globe className="w-4 h-4" /> Open Source
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight">
                Website <span className="text-primary">Blueprint</span>
              </h1>
              <p className="text-xl text-muted-foreground font-bold leading-relaxed">
                {SOURCE_COUNT} data sources, {scripts.length} scripts, {workflows.length} automated workflows, {PROMPT_COUNT} prompts, 4 scoring questions. Built by one person. Open source.
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <a
                  href={GITHUB_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-playful btn-playful-primary text-base h-12 px-6 md:text-lg md:h-14 md:px-8 inline-flex items-center gap-2"
                  onClick={() => handleGitHubClick('blueprint_hero')}
                >
                  <Code className="w-5 h-5" /> View on GitHub
                </a>
                <Link
                  to="/explore"
                  className="btn-playful btn-playful-outline text-base h-12 px-6 md:text-lg md:h-14 md:px-8 inline-flex items-center gap-2 bg-card"
                >
                  Explore the Site <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>

            {/* Stat grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {heroStats.map((stat, i) => {
                const borderColors = ['border-primary', 'border-secondary', 'border-accent'];
                return (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 + i * 0.06 }}
                    className={`card-playful p-4 bg-card text-center border-t-2 ${borderColors[i % 3]}`}
                  >
                    <p className="text-2xl md:text-3xl font-black text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground font-medium mt-1">{stat.label}</p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Section 2: Builder's Note */}
          <motion.div
            {...fadeUp}
            className="bg-primary/5 border border-primary/20 rounded-2xl p-6 md:p-8 mb-20 flex gap-4 items-start"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <MessageSquare className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-primary uppercase tracking-wider mb-2">Builder's Note</p>
              <p className="text-muted-foreground leading-relaxed">
                I open-sourced this because I wish someone had shown me how a real site is built when I was starting out. The actual code, the actual decisions, and the actual trade-offs. Fork it, break it, make it yours.
              </p>
            </div>
          </motion.div>

          {/* Section 3: The Platform */}
          <div className="mb-24">
            <motion.div
              {...fadeUp}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">
                The Platform
              </h2>
              <p className="text-lg text-muted-foreground font-medium leading-relaxed max-w-2xl mx-auto">
                Fly Labs covers the vibe building cycle: ideation, building, and compounding. Each section is a tool for a different stage. Here's what's live.
              </p>
            </motion.div>

            {/* Timeline */}
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-4 md:left-6 top-0 bottom-0 w-px bg-border" />

              {stages.map((stage) => {
                const items = platformSections.filter((s) => s.stage === stage);
                return (
                  <div key={stage} className="mb-10 last:mb-0">
                    {/* Stage label */}
                    <motion.div
                      {...fadeUp}
                      className="relative flex items-center gap-3 mb-6 pl-1 md:pl-3"
                    >
                      <div className={`w-7 h-7 md:w-7 md:h-7 rounded-full ${stageDotColors[stage]} flex items-center justify-center z-10 shrink-0`}>
                        <div className="w-2.5 h-2.5 rounded-full bg-white" />
                      </div>
                      <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${stageColors[stage]}`}>
                        {stage}
                      </span>
                    </motion.div>

                    {/* Items */}
                    <div className="space-y-4 pl-11 md:pl-14">
                      {items.map((item, i) => (
                        <motion.div
                          key={item.title}
                          {...fadeUp}
                          transition={{ duration: 0.3, delay: i * 0.05 }}
                          className={`card-playful p-5 bg-card border-l-4 ${item.color}`}
                        >
                          <div className="flex items-start gap-4">
                            <item.icon className="w-6 h-6 text-foreground shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2 flex-wrap">
                                <h3 className="font-bold text-base">{item.title}</h3>
                                {item.route && (
                                  <Link
                                    to={item.route}
                                    className="text-xs text-primary font-semibold hover:underline transition-colors inline-flex items-center gap-1"
                                  >
                                    See it live <ArrowRight className="w-3 h-3" />
                                  </Link>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground font-medium leading-relaxed mb-3">{item.desc}</p>
                              <div className="flex flex-wrap gap-2">
                                {item.highlights.map((h) => (
                                  <span key={h} className="text-xs font-semibold px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
                                    {h}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 4: The Stack */}
          <div className="mb-24">
            <motion.h2
              {...fadeUp}
              className="text-3xl md:text-4xl font-black tracking-tight mb-8 text-center"
            >
              The Stack
            </motion.h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {stackItems.map((item, index) => (
                <motion.div
                  key={item.name}
                  {...fadeUp}
                  transition={{ duration: 0.3, delay: index * 0.04 }}
                  className={`card-playful p-4 bg-card border-l-4 ${item.color}`}
                >
                  <item.icon className="w-6 h-6 text-foreground mb-2" />
                  <h3 className="font-bold text-sm mb-1">{item.name}</h3>
                  <p className="text-xs text-muted-foreground font-medium leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Section 5: The Intelligence Layer */}
          <div className="mb-24">
            <motion.div
              {...fadeUp}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">
                The Intelligence Layer
              </h2>
              <p className="text-lg text-muted-foreground font-medium leading-relaxed max-w-2xl mx-auto">
                What runs behind the scenes. Automated data collection, AI scoring, market validation, and deployment pipelines.
              </p>
            </motion.div>

            {/* 5a: Data Sources */}
            <motion.div {...fadeUp} className="mb-10">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Terminal className="w-5 h-5 text-primary" /> Data Sources
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {dataSources.map((source, i) => (
                  <motion.div
                    key={source.name}
                    {...fadeUp}
                    transition={{ duration: 0.3, delay: i * 0.04 }}
                    className="card-playful p-4 bg-card"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <source.icon className="w-4 h-4 text-foreground" />
                      <h4 className="font-bold text-sm">{source.name}</h4>
                    </div>
                    <p className="text-xs text-muted-foreground font-medium leading-relaxed">{source.detail}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* 5b: Scoring */}
            <motion.div {...fadeUp} className="mb-10">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Brain className="w-5 h-5 text-accent" /> Scoring
              </h3>
              <div className="card-playful p-5 bg-card">
                <p className="text-sm text-muted-foreground font-medium leading-relaxed mb-4">
                  Every idea gets scored by asking 4 questions: Is the pain real? Is there a gap? Would someone pay? Can you build it? The FL score determines the verdict: BUILD, VALIDATE, or SKIP. Four expert perspectives (Hormozi, Dan Koe, Okamoto, YC Lens) add depth on the detail page.
                </p>
                <div className="flex flex-wrap gap-3">
                  {[
                    { name: 'Fly Labs Method', tag: 'THE score', color: 'bg-primary/10 text-primary border-primary/30' },
                    { name: 'Hormozi', tag: 'expert', color: 'bg-secondary/10 text-secondary border-secondary/30' },
                    { name: 'Dan Koe', tag: 'expert', color: 'bg-accent/10 text-accent border-accent/30' },
                    { name: 'Okamoto', tag: 'expert', color: 'bg-muted text-muted-foreground border-border' },
                    { name: 'YC Lens', tag: 'expert', color: 'bg-orange-500/10 text-orange-500 border-orange-500/30' },
                  ].map((fw) => (
                    <span key={fw.name} className={`text-xs font-bold px-3 py-1.5 rounded-full border ${fw.color}`}>
                      {fw.name} ({fw.tag})
                    </span>
                  ))}
                </div>
                <Link to="/scoring" className="inline-flex items-center gap-1 text-xs text-primary font-semibold mt-4 hover:underline transition-colors">
                  How the scoring works <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </motion.div>

            {/* 5c: Validation */}
            <motion.div {...fadeUp} className="mb-10">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Search className="w-5 h-5 text-secondary" /> Validation
              </h3>
              <div className="card-playful p-5 bg-card">
                <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                  Top-scoring ideas get validated against real market conversations. Grok xAI searches X for live evidence. Reddit adds a second signal. Claude synthesizes both into a confidence level with evidence counts and a validation verdict. If the data disagrees with the score, the validation layer catches it.
                </p>
              </div>
            </motion.div>

            {/* 5d: Automation */}
            <motion.div {...fadeUp} className="mb-10">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" /> Automation
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {workflows.map((wf, i) => (
                  <motion.div
                    key={wf.name}
                    {...fadeUp}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    className="card-playful p-4 bg-card"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-sm">{wf.name}</h4>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">{wf.schedule}</span>
                    </div>
                    <p className="text-xs text-muted-foreground font-medium leading-relaxed">{wf.desc}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* 5e: Scripts */}
            <motion.div {...fadeUp}>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Code className="w-5 h-5 text-accent" /> Scripts
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {scripts.map((s) => (
                  <div key={s.name} className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-muted/50 border border-border">
                    <code className="text-xs font-mono font-bold text-foreground">{s.name}</code>
                    <span className="text-xs text-muted-foreground font-medium">{s.desc}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Section 6: How It's Organized */}
          <div className="mb-24">
            <motion.h2
              {...fadeUp}
              className="text-3xl md:text-4xl font-black tracking-tight mb-8 text-center"
            >
              How It's Organized
            </motion.h2>
            <motion.pre
              {...fadeUp}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-muted/50 rounded-xl border border-border p-6 font-mono text-sm text-foreground/80 leading-relaxed overflow-x-auto mb-8"
            >
              {folderTree}
            </motion.pre>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { icon: Layout, title: 'PageLayout wraps everything', desc: 'SEO, Header, Footer included automatically.' },
                { icon: Database, title: 'Server-side filtering with URL state', desc: 'useIdeaFilters hook: 7 dimensions, cascading counts, shareable URLs.' },
                { icon: Layers, title: 'Extracted components for complexity', desc: 'Ideas page split into 5 components. Pattern scales to future sections.' },
              ].map((card, i) => (
                <motion.div
                  key={card.title}
                  {...fadeUp}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className="card-playful p-5 bg-card"
                >
                  <card.icon className="w-6 h-6 text-primary mb-3" />
                  <h3 className="font-bold text-sm mb-1">{card.title}</h3>
                  <p className="text-xs text-muted-foreground font-medium">{card.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Section 7: The Database */}
          <div className="mb-24">
            <motion.div
              {...fadeUp}
              className="text-center mb-8"
            >
              <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">
                The Database
              </h2>
              <p className="text-lg text-muted-foreground font-medium leading-relaxed max-w-2xl mx-auto">
                PostgreSQL with Row Level Security on everything. JSONB columns, materialized verdicts, 30+ columns on the ideas table alone.
              </p>
            </motion.div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {dbHighlights.map((item, i) => (
                <motion.div
                  key={item.title}
                  {...fadeUp}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className={`card-playful p-5 bg-card border-l-4 ${['border-primary', 'border-secondary', 'border-accent', 'border-primary'][i]}`}
                >
                  <item.icon className="w-6 h-6 text-foreground mb-3" />
                  <h3 className="font-bold text-sm mb-1">{item.title}</h3>
                  <p className="text-xs text-muted-foreground font-medium leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Section 8: The Design System */}
          <div className="mb-24">
            <motion.h2
              {...fadeUp}
              className="text-3xl md:text-4xl font-black tracking-tight mb-8 text-center"
            >
              The Design System
            </motion.h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left column */}
              <motion.div
                {...fadeUp}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="card-playful p-6 bg-card space-y-6"
              >
                <div>
                  <h3 className="font-bold text-sm mb-3 uppercase tracking-wider text-muted-foreground">Colors</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-primary border-2 border-primary/30" />
                      <span className="text-xs font-medium text-muted-foreground">Primary</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-secondary border-2 border-secondary/30" />
                      <span className="text-xs font-medium text-muted-foreground">Secondary</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-accent border-2 border-accent/30" />
                      <span className="text-xs font-medium text-muted-foreground">Accent</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-sm mb-2 uppercase tracking-wider text-muted-foreground">Font</h3>
                  <p className="text-foreground"><span className="font-bold">Inter</span> <span className="text-muted-foreground text-sm">(primary), system-ui (fallback)</span></p>
                </div>
                <div>
                  <h3 className="font-bold text-sm mb-2 uppercase tracking-wider text-muted-foreground">Radius</h3>
                  <p className="text-foreground font-medium">0.75rem base</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                  <Moon className="w-4 h-4" />
                  <span>/</span>
                  <Sun className="w-4 h-4" />
                  <span>Works in light and dark mode</span>
                </div>
              </motion.div>

              {/* Right column */}
              <motion.div
                {...fadeUp}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="card-playful p-6 bg-card space-y-6"
              >
                <div>
                  <h3 className="font-bold text-sm mb-3 uppercase tracking-wider text-muted-foreground">Buttons</h3>
                  <div className="flex flex-wrap gap-3">
                    <span className="btn-playful btn-playful-primary px-4 py-2 text-sm pointer-events-none" tabIndex={-1}>Primary</span>
                    <span className="btn-playful btn-playful-secondary px-4 py-2 text-sm pointer-events-none" tabIndex={-1}>Secondary</span>
                    <span className="btn-playful btn-playful-accent px-4 py-2 text-sm pointer-events-none" tabIndex={-1}>Accent</span>
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-sm mb-3 uppercase tracking-wider text-muted-foreground">Card</h3>
                  <div className="card-playful p-4 bg-muted/30">
                    <p className="text-sm font-semibold mb-1">card-playful</p>
                    <p className="text-xs text-muted-foreground">Shadow + border highlight. Used everywhere.</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Section 9: Auth, Security, and DevOps */}
          <motion.div
            {...fadeUp}
            className="card-playful p-6 md:p-10 bg-card mb-24"
          >
            <div className="flex items-center gap-3 mb-6">
              <ShieldCheck className="w-7 h-7 text-primary" />
              <h2 className="text-2xl md:text-3xl font-black tracking-tight">Auth, Security, and DevOps</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {securityItems.map((item) => (
                <div key={item} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm font-medium text-foreground">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Section 10: Fully open source */}
          <motion.div
            {...fadeUp}
            className="bg-primary/5 border border-primary/20 rounded-3xl p-8 md:p-12 text-center mb-24"
          >
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-6">
              Fully open source
            </h2>
            <p className="text-lg text-muted-foreground font-medium leading-relaxed max-w-2xl mx-auto mb-4">
              The entire codebase is on GitHub. Fork it, clone it, make it yours. MIT License.
            </p>
          </motion.div>

          {/* Section 11: CTA Footer */}
          <motion.div
            {...fadeUp}
            className="text-center"
          >
            <div className="flex flex-wrap items-center justify-center gap-4 mb-6">
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noreferrer"
                className="btn-playful btn-playful-primary text-base h-12 px-6 md:text-lg md:h-14 md:px-8 inline-flex items-center gap-2"
                onClick={() => handleGitHubClick('blueprint_cta')}
              >
                <Code className="w-5 h-5" /> View on GitHub
              </a>
              <Link
                to="/explore"
                className="btn-playful btn-playful-outline text-base h-12 px-6 md:text-lg md:h-14 md:px-8 inline-flex items-center gap-2 bg-card"
              >
                Back to Explore
              </Link>
            </div>
            <p className="text-muted-foreground font-bold">
              Still cooking. New sections every month. Come build with me.
            </p>
          </motion.div>

        </div>
      </div>
    </PageLayout>
  );
};

export default WebsiteBlueprintPage;
