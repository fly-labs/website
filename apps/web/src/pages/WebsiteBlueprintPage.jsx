
import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Globe, Code, Zap, Palette, Layers, Navigation, Sparkles,
  Smile, Database, BarChart3, Layout, AtSign, ShieldCheck, CheckCircle2,
  Scissors, GitBranch, Rocket, Moon, Sun, ArrowRight, MessageSquare,
} from 'lucide-react';
import { PageLayout } from '@/components/PageLayout.jsx';
import { motion } from 'framer-motion';
import { fadeUp } from '@/lib/animations.js';
import { trackEvent } from '@/lib/analytics.js';

const GITHUB_URL = 'https://github.com/fly-labs/website';

const stackItems = [
  { name: 'React 18', icon: Code, desc: 'UI framework. JSX, no TypeScript.', color: 'border-primary' },
  { name: 'Vite 7', icon: Zap, desc: 'Dev server and builds. Stupid fast.', color: 'border-secondary' },
  { name: 'Tailwind CSS', icon: Palette, desc: 'Utility-first styling with HSL theming.', color: 'border-accent' },
  { name: 'shadcn/ui', icon: Layers, desc: 'Radix primitives with CVA variants.', color: 'border-primary' },
  { name: 'React Router v7', icon: Navigation, desc: 'Client-side SPA routing.', color: 'border-secondary' },
  { name: 'Framer Motion', icon: Sparkles, desc: 'Smooth page and scroll animations.', color: 'border-accent' },
  { name: 'Lucide React', icon: Smile, desc: 'Tree-shakeable icon library. 250+ icons.', color: 'border-primary' },
  { name: 'Supabase', icon: Database, desc: 'PostgreSQL, Auth, and Row Level Security.', color: 'border-secondary' },
  { name: 'Google Analytics 4', icon: BarChart3, desc: 'Event tracking. Privacy-respecting.', color: 'border-accent' },
  { name: 'Vercel', icon: Globe, desc: 'Push to main, deployed in seconds.', color: 'border-primary' },
];

const folderTree = `src/
  components/
    ui/           # shadcn/ui primitives
    Header.jsx    # Sticky nav
    Footer.jsx    # Social links
    PageLayout.jsx# SEO + Header + Footer
  pages/          # One file per route
  lib/
    data/         # Static data (projects, prompts)
    analytics.js  # GA4 helpers
    utils.js      # cn(), timeAgo()
  contexts/       # Auth + Theme providers
  hooks/          # Custom hooks`;

const WebsiteBlueprintPage = () => {
  const handleGitHubClick = (location) => {
    trackEvent('outbound_click', {
      link_url: GITHUB_URL,
      link_label: 'GitHub',
      location,
    });
  };

  return (
    <PageLayout
      seo={{
        title: "Website Blueprint | Fly Labs",
        description: "See exactly how flylabs.fun was built. Full stack breakdown, architecture, and design decisions. Open source and free to fork.",
        keywords: "website blueprint, React SPA, open source, Supabase, Tailwind CSS, Vite, web development, full stack",
        url: "https://flylabs.fun/templates/website-blueprint",
      }}
      className="pt-32 pb-24"
    >
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">

          {/* Back link */}
          <Link to="/explore" className="inline-flex items-center text-muted-foreground hover:text-foreground font-bold mb-8 transition-colors bg-card px-4 py-2 rounded-xl border border-border shadow-sm">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Playground
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
                This is exactly how I built flylabs.fun. Every tool, every decision, every line of thinking. Think of it as me walking you through my project over coffee.
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

            {/* Decorative cards (desktop only) */}
            <div className="hidden lg:flex items-center justify-center relative h-72">
              <div className="absolute w-48 h-32 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center -rotate-6 -translate-x-6 translate-y-4 shadow-lg">
                <span className="text-primary font-black text-lg">React</span>
              </div>
              <div className="absolute w-48 h-32 rounded-2xl bg-secondary/10 border border-secondary/20 flex items-center justify-center rotate-3 translate-x-2 -translate-y-2 shadow-lg">
                <span className="text-secondary font-black text-lg">Tailwind</span>
              </div>
              <div className="absolute w-48 h-32 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center rotate-12 translate-x-10 translate-y-8 shadow-lg">
                <span className="text-accent font-black text-lg">Supabase</span>
              </div>
            </div>
          </motion.div>

          {/* Builder's Note */}
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
                I open-sourced this because I wish someone had shown me how a real site is built when I was starting out. Not a tutorial. Not a course. Just the actual code, the actual decisions, and the actual trade-offs. Fork it, break it, make it yours.
              </p>
            </div>
          </motion.div>

          {/* Section 2: What You're Looking At */}
          <motion.div
            {...fadeUp}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto text-center mb-24"
          >
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-6">
              What You're Looking At
            </h2>
            <p className="text-lg text-muted-foreground font-medium leading-relaxed">
              This isn't a polished template you download and forget. It's a live website I'm building in public, upgrading in real-time. You're looking at a React SPA with auth, a database, analytics, SEO, dark mode, animations, and responsive design. All of it open source. Still a work in progress. That's the fun part.
            </p>
          </motion.div>

          {/* Section 3: The Stack */}
          <div className="mb-24">
            <motion.h2
              {...fadeUp}
              transition={{ duration: 0.5 }}
              className="text-3xl md:text-4xl font-black tracking-tight mb-8 text-center"
            >
              The Stack
            </motion.h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {stackItems.map((item, index) => (
                <motion.div
                  key={item.name}
                  {...fadeUp}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={`card-playful p-4 bg-card border-l-4 ${item.color}`}
                >
                  <item.icon className="w-6 h-6 text-foreground mb-2" />
                  <h3 className="font-bold text-sm mb-1">{item.name}</h3>
                  <p className="text-xs text-muted-foreground font-medium leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Section 4: How It's Organized */}
          <div className="mb-24">
            <motion.h2
              {...fadeUp}
              transition={{ duration: 0.5 }}
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
                { icon: Zap, title: 'Every page is lazy-loaded', desc: 'React.lazy + Suspense, code-split per route.' },
                { icon: AtSign, title: 'Clean imports with @/', desc: 'Path alias, zero relative path mess.' },
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

          {/* Section 5: The Design System */}
          <div className="mb-24">
            <motion.h2
              {...fadeUp}
              transition={{ duration: 0.5 }}
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
                  <p className="text-foreground"><span className="font-bold">Nunito</span> <span className="text-muted-foreground text-sm">(primary), Inter (fallback)</span></p>
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

          {/* Section 6: Auth and Security */}
          <motion.div
            {...fadeUp}
            transition={{ duration: 0.5 }}
            className="card-playful p-6 md:p-10 bg-card mb-24"
          >
            <div className="flex items-center gap-3 mb-6">
              <ShieldCheck className="w-7 h-7 text-primary" />
              <h2 className="text-2xl md:text-3xl font-black tracking-tight">Auth and Security</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                'Email/password + Google OAuth via Supabase',
                'Row Level Security on every database table',
                'Security headers (CSP, HSTS, COOP, Permissions-Policy)',
                'Input validation on all user-facing forms',
                'No secrets in client-side code',
                'GitHub Actions CI on every pull request',
              ].map((item) => (
                <div key={item} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm font-medium text-foreground">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Section 7: Performance and DevOps */}
          <div className="mb-24">
            <motion.h2
              {...fadeUp}
              transition={{ duration: 0.5 }}
              className="text-3xl md:text-4xl font-black tracking-tight mb-8 text-center"
            >
              Performance and DevOps
            </motion.h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: Scissors, title: 'Code Splitting', desc: 'Every page lazy-loaded via React.lazy.' },
                { icon: Sparkles, title: 'Smart Animations', desc: 'Viewport-triggered, no layout thrashing.' },
                { icon: GitBranch, title: 'CI/CD', desc: 'GitHub Actions lint + build on every PR.' },
                { icon: Rocket, title: 'Auto-Deploy', desc: 'Push to main, live in seconds via Vercel.' },
              ].map((card, i) => (
                <motion.div
                  key={card.title}
                  {...fadeUp}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className="card-playful p-5 bg-card text-center"
                >
                  <card.icon className="w-7 h-7 text-primary mx-auto mb-3" />
                  <h3 className="font-bold text-sm mb-1">{card.title}</h3>
                  <p className="text-xs text-muted-foreground font-medium">{card.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Section 8: What would this cost? */}
          <motion.div
            {...fadeUp}
            transition={{ duration: 0.5 }}
            className="bg-primary/5 border border-primary/20 rounded-3xl p-8 md:p-12 text-center mb-24"
          >
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-6">
              What would this cost?
            </h2>
            <p className="text-lg text-muted-foreground font-medium leading-relaxed max-w-2xl mx-auto mb-8">
              A custom React site with auth, database, analytics, SEO, dark mode, animations, and responsive design? Freelancers charge $300 to $500+ for this kind of setup. I'm giving it away. Fork it, clone it, make it yours.
            </p>
            <div className="flex items-center justify-center gap-4 mb-4">
              <span className="line-through text-muted-foreground text-xl font-medium">$300+</span>
              <span className="text-primary font-black text-3xl">Free</span>
            </div>
            <p className="text-sm text-muted-foreground font-medium">MIT License. Do whatever you want with it.</p>
          </motion.div>

          {/* Section 9: CTA Footer */}
          <motion.div
            {...fadeUp}
            transition={{ duration: 0.5 }}
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
              Still cooking. Being upgraded in real-time. Come build with me.
            </p>
          </motion.div>

        </div>
      </div>
    </PageLayout>
  );
};

export default WebsiteBlueprintPage;
