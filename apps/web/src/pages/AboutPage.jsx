
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Youtube, Github, Linkedin, Mail, BookOpen, ArrowRight, ChevronDown, FlaskConical, BarChart3, Rocket, Zap, Sparkles, Terminal, Music, Brain, Globe, Database, GitBranch, Search, Filter, CheckCircle2, XCircle, AlertTriangle, Headphones, MessageSquare, TrendingUp, Repeat, Lightbulb, Hammer, Gift } from 'lucide-react';
import { GitHubHeatmap, RecentCommits } from '@/components/GitHubHeatmap.jsx';
import { PageLayout } from '@/components/PageLayout.jsx';
import { XIcon } from '@/components/XIcon.jsx';
import { motion } from 'framer-motion';
import { fadeUp, staggerContainer, staggerItem } from '@/lib/animations.js';
import { trackEvent, trackScrollDepth } from '@/lib/analytics.js';
import { SOURCE_COUNT, PROMPT_COUNT, CATEGORY_COUNT, TRACK_COUNT, VIBE_COUNT } from '@/lib/data/siteStats.js';
import supabase from '@/lib/supabaseClient.js';

const socials = [
  { href: 'mailto:luiz@flylabs.fun', icon: Mail, label: 'Email', color: 'text-primary' },
  { href: 'https://falacomigo.substack.com', icon: BookOpen, label: 'Substack', color: 'text-secondary', external: true },
  { href: 'https://github.com/fly-labs', icon: Github, label: 'GitHub', color: 'text-foreground', external: true },
  { href: 'https://x.com/alvesluizc', icon: XIcon, label: 'X', color: 'text-foreground', external: true },
  { href: 'https://youtube.com/@falacomigoyt', icon: Youtube, label: 'YouTube', color: 'text-[#FF0000]', external: true },
  { href: 'https://br.linkedin.com/in/alvesluizc', icon: Linkedin, label: 'LinkedIn', color: 'text-[#0A66C2]', external: true },
];

const SectionLabel = ({ icon: Icon, label, color }) => (
  <div className="flex items-center gap-2 mb-4">
    <Icon className={`w-4 h-4 ${color}`} />
    <h2 className={`text-sm font-semibold uppercase tracking-widest ${color}`}>{label}</h2>
  </div>
);

const AboutPage = () => {
  const [ideaCount, setIdeaCount] = useState(null);

  useEffect(() => trackScrollDepth('about'), []);

  useEffect(() => {
    supabase
      .from('ideas')
      .select('id', { count: 'exact', head: true })
      .eq('approved', true)
      .then(({ count }) => {
        if (count != null) setIdeaCount(count);
      });
  }, []);

  return (
    <PageLayout
      seo={{
        title: "About | Fly Labs",
        description: "Finance background, vibe builder. I build digital assets with AI on nights and weekends. Tools, templates, and open source experiments at Fly Labs.",
        keywords: "Luiz Alves, indie maker, AI builder, open source, tools, templates, vibe building",
        url: "https://flylabs.fun/about",
        schema: {
          "@context": "https://schema.org",
          "@type": "Person",
          "name": "Luiz Alves",
          "url": "https://flylabs.fun/about",
          "image": "https://flylabs.fun/images/luiz-alves.png",
          "jobTitle": "Vibe Builder",
          "sameAs": [
            "https://github.com/fly-labs",
            "https://x.com/alvesluizc",
            "https://youtube.com/@falacomigoyt",
            "https://br.linkedin.com/in/alvesluizc",
            "https://falacomigo.substack.com"
          ]
        },
      }}
      className="pt-24 pb-16"
    >
      <div className="container mx-auto px-6">

        {/* 1. HERO */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-[auto_1fr] gap-8 md:gap-12 items-center"
        >
          <div className="flex justify-center">
            <img
              src="/images/luiz-alves.png"
              alt="Luiz Alves"
              loading="lazy"
              className="w-36 h-36 sm:w-44 sm:h-44 md:w-56 md:h-56 object-cover rounded-2xl border-2 border-border shadow-xl grayscale hover:grayscale-0 transition-[filter] duration-700"
            />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-foreground mb-4">
              Nobody asked me to build any of this. I did it anyway, for fun.
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground font-medium leading-relaxed mb-6">
              I'm Luiz Alves. Over a decade in finance. I build things with AI on nights and weekends because it's fun. Everything here is open source.
            </p>
            <div className="flex flex-wrap gap-2 mb-6">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  {...(s.external ? { target: '_blank', rel: 'noreferrer' } : {})}
                  className="p-2.5 rounded-lg border border-border bg-card hover:bg-muted transition-colors"
                  title={s.label}
                  aria-label={s.label}
                  onClick={() => trackEvent('outbound_click', { link_url: s.href, link_label: s.label, location: 'about_hero' })}
                >
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                </a>
              ))}
            </div>
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="hidden md:flex justify-start"
            >
              <ChevronDown className="w-5 h-5 text-muted-foreground/50" />
            </motion.div>
          </div>
        </motion.section>

        <div className="max-w-5xl mx-auto space-y-10 md:space-y-14">

          {/* 2. THE MANIFESTO */}
          <motion.section {...fadeUp} transition={{ duration: 0.5 }}>
            <SectionLabel icon={FlaskConical} label="The Manifesto" color="text-primary" />
            <div className="glass-card p-6 md:p-8">
              <blockquote className="border-l-4 border-primary pl-6">
                <p className="text-xl md:text-2xl font-black text-foreground leading-snug">
                  I want to see what happens when one person builds in public, gives everything away, and lets the work speak for itself.
                </p>
              </blockquote>
            </div>
          </motion.section>

          {/* 3. THE STORY - narrative that introduces the ecosystem naturally */}
          <motion.section {...staggerContainer}>
            <motion.div {...staggerItem}>
              <SectionLabel icon={BookOpen} label="The Story" color="text-secondary" />
            </motion.div>

            {/* The Origin */}
            <motion.div {...staggerItem} className="card-glow p-6 md:p-8 mb-4">
              <p className="text-xs font-bold uppercase tracking-widest text-secondary mb-4">The Origin</p>
              <div className="space-y-4 text-base md:text-lg text-muted-foreground font-medium leading-relaxed">
                <p>
                  I work in finance. Have for over a decade. It's a serious job and I take it seriously. But somewhere along the way I started playing with AI tools, and I realized I could actually build things. Real things. Apps, templates, automated pipelines. With zero engineering background.
                </p>
                <p>
                  The first time I shipped something and a stranger used it, something clicked. I wasn't thinking about a business. I was just curious: what else can I build? What other problems can I solve? That curiosity turned into weekend mornings and late nights in front of the screen, and honestly, it doesn't feel like work.
                </p>
              </div>
            </motion.div>

            {/* What grew from that curiosity */}
            <motion.div {...staggerItem} className="card-glow p-6 md:p-8 mb-4">
              <p className="text-xs font-bold uppercase tracking-widest text-secondary mb-4">What Grew From That</p>
              <div className="space-y-4 text-base md:text-lg text-muted-foreground font-medium leading-relaxed">
                <p>
                  I've been reading a lot of business books. AI, strategy, mindset, the random stuff I can't stop learning about. My study notes kept piling up, so I turned them into something useful: <Link to="/library" className="text-foreground font-semibold hover:text-primary transition-colors">a library of free ebooks</Link>. Some of those books had templates I thought were worth highlighting, so I built <Link to="/templates" className="text-foreground font-semibold hover:text-primary transition-colors">a templates section</Link> for those too.
                </p>
                <p>
                  Then the prompts rabbit hole happened. I started collecting AI prompts from everywhere. My notes app turned into a mess. So I built <Link to="/prompts" className="text-foreground font-semibold hover:text-primary transition-colors">a prompt library</Link> with {PROMPT_COUNT} prompts across {CATEGORY_COUNT} categories, a proper search, and filters that actually help me find what I need.
                </p>
              </div>
            </motion.div>

            {/* The Ideas Lab */}
            <motion.div {...staggerItem} className="card-glow p-6 md:p-8 border-l-4 border-primary mb-4">
              <p className="text-xs font-bold uppercase tracking-widest text-primary mb-4">The Ideas Lab</p>
              <div className="space-y-4 text-base md:text-lg text-muted-foreground font-medium leading-relaxed">
                <p>
                  The <Link to="/ideas" className="text-foreground font-semibold hover:text-primary transition-colors">Ideas Lab</Link> is a different beast. Every day it pulls real problems people are complaining about across {SOURCE_COUNT} sources online. AI scores each one, validates the best against live conversations, and gives you a verdict. No guesswork. The whole point is to answer the question every solo builder asks: "is this worth my time?"
                </p>

                {/* Verdict badges */}
                <div className="flex flex-wrap gap-2 py-1">
                  {[
                    { label: 'BUILD', icon: CheckCircle2, bg: 'bg-primary/10', border: 'border-primary/30', text: 'text-primary', desc: 'Strong signal. Ship it.' },
                    { label: 'VALIDATE', icon: AlertTriangle, bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-600 dark:text-amber-400', desc: 'Promising. Needs proof.' },
                    { label: 'SKIP', icon: XCircle, bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-500', desc: 'Weak signal. Move on.' },
                  ].map((v) => (
                    <div key={v.label} className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${v.border} ${v.bg}`}>
                      <v.icon className={`w-4 h-4 ${v.text}`} />
                      <span className={`text-sm font-bold ${v.text}`}>{v.label}</span>
                      <span className="text-xs text-muted-foreground hidden sm:inline">{v.desc}</span>
                    </div>
                  ))}
                </div>

                <p>
                  Right now the lab has scored {ideaCount != null ? <span className="text-foreground font-semibold">{ideaCount.toLocaleString()}</span> : '...'} ideas. That number goes up every day because the entire pipeline runs on autopilot. GitHub Actions wakes up at 6 AM UTC, syncs fresh problems, scores them with Claude, validates the best ones with Grok. About $30/month for the whole thing.
                </p>
                <p>
                  There's also a full <Link to="/ideas/analytics" className="text-foreground font-semibold hover:text-primary transition-colors">analytics dashboard</Link> with 12 interactive visualizations sitting on top of all that data. Which sources produce the best ideas, what industries are heating up, how scores distribute across verdicts. All there, updated live.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 mt-4">
                <Link to="/ideas" className="inline-flex items-center text-sm font-semibold text-primary hover:underline">
                  Browse the Ideas Lab <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Link>
                <Link to="/ideas/analytics" className="inline-flex items-center text-sm font-semibold text-muted-foreground hover:text-primary hover:underline">
                  See the analytics <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </div>
            </motion.div>

            {/* FlyBot & The Experience */}
            <motion.div {...staggerItem} className="card-glow p-6 md:p-8 border-l-4 border-secondary mb-4">
              <p className="text-xs font-bold uppercase tracking-widest text-secondary mb-4">The AI Coach</p>
              <div className="space-y-4 text-base md:text-lg text-muted-foreground font-medium leading-relaxed">
                <p>
                  I wanted something that could sit on top of all the scored data and have a real conversation about it. So I built <Link to="/flybot" className="text-foreground font-semibold hover:text-secondary transition-colors">FlyBot</Link>. Describe what you want to build, and it pulls up similar ideas the lab already scored, flags the gaps, tells you if it's worth your weekend. It knows every framework, every source, and it writes like a person, not a chatbot.
                </p>

                {/* FlyBot + Music visual */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-1">
                  <div className="flex items-start gap-3 p-3 rounded-xl border border-secondary/20 bg-secondary/5">
                    <div className="w-9 h-9 rounded-lg bg-secondary/15 flex items-center justify-center shrink-0 mt-0.5">
                      <MessageSquare className="w-4.5 h-4.5 text-secondary" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">AI Coach</p>
                      <p className="text-xs text-muted-foreground leading-snug mt-0.5">Validates your idea against {ideaCount != null ? ideaCount.toLocaleString() : '...'} scored entries. Real frameworks, real data.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-xl border border-accent/20 bg-accent/5">
                    <div className="w-9 h-9 rounded-lg bg-accent/15 flex items-center justify-center shrink-0 mt-0.5">
                      <Headphones className="w-4.5 h-4.5 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">Focus Music</p>
                      <p className="text-xs text-muted-foreground leading-snug mt-0.5">{VIBE_COUNT} vibe modes. Pick yours: ideate, build, create, cafe, study, or retro. {TRACK_COUNT}+ tracks of curated lofi, free.</p>
                    </div>
                  </div>
                </div>

                <p>
                  It sounds like a small thing, but it changed the whole vibe of spending time here. You open the lab, put on some music, start exploring ideas. It feels like a place you want to hang out in, not a tool you use and leave.
                </p>
              </div>
              <Link to="/flybot" className="inline-flex items-center text-sm font-semibold text-secondary hover:underline mt-4">
                Try FlyBot <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </motion.div>

            {/* Vibe Building */}
            <motion.div {...staggerItem} className="card-glow p-6 md:p-8 border-l-4 border-accent">
              <p className="text-xs font-bold uppercase tracking-widest text-accent mb-4">Vibe Building</p>
              <div className="space-y-4 text-base md:text-lg text-muted-foreground font-medium leading-relaxed">
                <p>
                  Here's what I keep hearing from people who want to build something on their own: they don't know where to start. They have ideas but no way to validate them. They feel like they need a team, a budget, a business plan. They read about indie hackers shipping things in a weekend and think "that's not me."
                </p>
                <p>
                  I think most of that friction is gone now. AI changed the equation. One person with curiosity and spare time can build things that used to take a team. Andrej Karpathy called the coding part "vibe coding." I think the whole thing is bigger than code.
                </p>
                <p className="text-foreground font-semibold">
                  I call it vibe building. It's the full cycle:
                </p>

                {/* The Cycle - visual connected flow */}
                {(() => {
                  const steps = [
                    { step: '01', label: 'Ideation', desc: 'Find real problems people already have', icon: Lightbulb, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/30' },
                    { step: '02', label: 'Build', desc: 'Ship a solution with AI. Fast, scrappy, real', icon: Hammer, color: 'text-secondary', bg: 'bg-secondary/10', border: 'border-secondary/30' },
                    { step: '03', label: 'Share', desc: 'Open source it. Document the process. Give it away', icon: Gift, color: 'text-accent', bg: 'bg-accent/10', border: 'border-accent/30' },
                    { step: '04', label: 'Compound', desc: 'Each project feeds the next. Skills, audience, ideas', icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/30' },
                  ];
                  return (
                    <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 sm:gap-0 py-3">
                      {steps.map((s, i) => (
                        <React.Fragment key={s.step}>
                          {/* Step */}
                          <div className="flex flex-row sm:flex-col items-center sm:items-center gap-4 sm:gap-0 sm:text-center sm:flex-1 w-full sm:w-auto">
                            <div className={`w-14 h-14 shrink-0 rounded-2xl ${s.bg} border ${s.border} flex items-center justify-center sm:mb-3`}>
                              <s.icon className={`w-6 h-6 ${s.color}`} />
                            </div>
                            <div className="sm:text-center">
                              <span className={`text-[10px] font-bold uppercase tracking-widest ${s.color}`}>{s.step}</span>
                              <p className="text-sm font-bold text-foreground">{s.label}</p>
                              <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{s.desc}</p>
                            </div>
                          </div>
                          {/* Arrow between steps */}
                          {i < steps.length - 1 && (
                            <>
                              <div className="hidden sm:flex items-center px-1 pt-4">
                                <ArrowRight className="w-4 h-4 text-muted-foreground/30" />
                              </div>
                              <div className="flex sm:hidden justify-center">
                                <ChevronDown className="w-4 h-4 text-muted-foreground/25" />
                              </div>
                            </>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  );
                })()}
                {/* Loop hint */}
                <div className="flex items-center justify-center gap-2 pt-1">
                  <Repeat className="w-3.5 h-3.5 text-muted-foreground/40" />
                  <span className="text-xs text-muted-foreground/50 font-medium">The cycle repeats. Each loop gets faster.</span>
                </div>

                <p>
                  Fly Labs covers the entire cycle. The Ideas Lab handles ideation. The prompts, templates, and blueprints help you build. The newsletter documents the process. And the whole thing is open source, so every project compounds into the next one.
                </p>
                <p>
                  If you've ever thought "I want to build something but I don't know where to start," this is the place. Not a course. Not a community with paid tiers. Just the tools, the data, and an honest look at what it takes to build things as one person.
                </p>
              </div>
            </motion.div>
          </motion.section>

          {/* 4. THE PIPELINE */}
          <motion.section {...fadeUp} transition={{ duration: 0.5 }}>
            <SectionLabel icon={Database} label="The Pipeline" color="text-secondary" />
            <div className="card-glow p-6 md:p-8">
              <p className="text-base md:text-lg text-muted-foreground font-medium leading-relaxed mb-6">
                How ideas go from "someone complained on Reddit" to a scored, validated verdict. Every day, automatically.
              </p>

              {/* Visual Pipeline Flow */}
              {(() => {
                const stages = [
                  { title: 'Sources', subtitle: `${SOURCE_COUNT} feeds`, icon: Search, color: 'text-secondary', bg: 'bg-secondary/5', iconBg: 'bg-secondary/15', border: 'border-secondary/30', dotColor: 'bg-secondary/40', items: ['Reddit', 'Product Hunt', 'Hacker News', 'X/Twitter', 'GitHub', 'ProblemHunt', 'YC Graveyard', 'Community'] },
                  { title: 'Scoring', subtitle: '4 questions, 1 verdict', icon: Filter, color: 'text-primary', bg: 'bg-primary/5', iconBg: 'bg-primary/15', border: 'border-primary/30', dotColor: 'bg-primary/40', items: ['Is the pain real?', 'Is there a gap?', 'Would someone pay?', 'Can you build it?'] },
                  { title: 'Validation', subtitle: 'Live evidence', icon: CheckCircle2, color: 'text-accent', bg: 'bg-accent/5', iconBg: 'bg-accent/15', border: 'border-accent/30', dotColor: 'bg-accent/40', items: ['X/Twitter search', 'Reddit conversations', 'Confidence scoring', 'Final verdict'] },
                ];
                return (
                  <div className="flex flex-col md:flex-row items-stretch gap-0">
                    {stages.map((stage, i) => (
                      <React.Fragment key={stage.title}>
                        <div className={`flex-1 rounded-xl border ${stage.border} ${stage.bg} p-4`}>
                          <div className="flex items-center gap-2 mb-3">
                            <div className={`w-8 h-8 rounded-lg ${stage.iconBg} flex items-center justify-center`}>
                              <stage.icon className={`w-4 h-4 ${stage.color}`} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-foreground">{stage.title}</p>
                              <p className={`text-[10px] font-medium ${stage.color}`}>{stage.subtitle}</p>
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            {stage.items.map((item) => (
                              <div key={item} className="flex items-center gap-1.5">
                                <div className={`w-1 h-1 rounded-full ${stage.dotColor}`} />
                                <span className="text-[11px] text-muted-foreground">{item}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        {i < stages.length - 1 && (
                          <>
                            <div className="hidden md:flex items-center px-2">
                              <ArrowRight className="w-4 h-4 text-muted-foreground/30" />
                            </div>
                            <div className="flex md:hidden justify-center py-2">
                              <ChevronDown className="w-4 h-4 text-muted-foreground/25" />
                            </div>
                          </>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                );
              })()}

              <div className="flex items-center gap-4 mt-6 pt-4 border-t border-border">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <GitBranch className="w-3.5 h-3.5 text-primary" />
                  <span>Runs on GitHub Actions, daily at 6 AM UTC</span>
                </div>
              </div>
            </div>
          </motion.section>

          {/* 5. BY THE NUMBERS */}
          <motion.section {...staggerContainer}>
            <motion.div {...staggerItem}>
              <SectionLabel icon={BarChart3} label="By The Numbers" color="text-primary" />
              <p className="text-base md:text-lg text-muted-foreground font-medium leading-relaxed mb-4">
                Real numbers from a real project. All computed live from the codebase and database.
              </p>
            </motion.div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
              {[
                { value: ideaCount, label: 'Ideas scored', icon: Zap, color: 'text-primary' },
                { value: SOURCE_COUNT, label: 'Data sources', icon: Globe, color: 'text-secondary' },
                { value: PROMPT_COUNT, label: 'AI prompts', icon: Sparkles, color: 'text-accent' },
                { value: 4, label: 'Scoring questions', icon: Brain, color: 'text-primary' },
                { value: CATEGORY_COUNT, label: 'Prompt categories', icon: Terminal, color: 'text-secondary' },
                { value: TRACK_COUNT, label: 'Lofi tracks', icon: Music, color: 'text-accent' },
              ].map((stat) => (
                <motion.div key={stat.label} {...staggerItem} className="glass-card p-4 text-center">
                  <stat.icon className={`w-4 h-4 ${stat.color} mx-auto mb-2`} />
                  <div className="text-2xl md:text-3xl font-black text-foreground">
                    {stat.value != null ? stat.value.toLocaleString() : '...'}
                  </div>
                  <div className="text-xs font-medium text-muted-foreground mt-1">{stat.label}</div>
                </motion.div>
              ))}
            </div>

            {/* GitHub Activity */}
            <div className="glass-card p-5 md:p-6 mt-4">
              <GitHubHeatmap variant="full" />
            </div>
            <div className="glass-card p-5 md:p-6 mt-4">
              <RecentCommits count={10} />
            </div>
          </motion.section>

          {/* 6. OPEN SOURCE */}
          <motion.section {...fadeUp} transition={{ duration: 0.5 }}>
            <SectionLabel icon={Github} label="Open Source" color="text-foreground" />
            <div className="card-glow p-6 md:p-8">
              <div className="space-y-4 text-base md:text-lg text-muted-foreground font-medium leading-relaxed mb-6">
                <p>
                  The entire platform is open source. MIT licensed. You can fork the repo, read every line of code, and build on top of it. The scoring scripts, the sync pipeline, the AI prompts: it's all there.
                </p>
                <p>
                  I believe the best way to build trust is to show the work. No black boxes, no gatekeeping. If something here is useful to you, take it.
                </p>
              </div>
              <a
                href="https://github.com/fly-labs/website"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border bg-card hover:bg-muted transition-colors font-semibold text-sm"
                onClick={() => trackEvent('outbound_click', { link_url: 'https://github.com/fly-labs/website', link_label: 'View GitHub', location: 'about_opensource' })}
              >
                <Github className="w-4 h-4" />
                View on GitHub
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </motion.section>

          {/* 7. CLOSING */}
          <motion.section {...fadeUp} transition={{ duration: 0.5 }}>
            <SectionLabel icon={Rocket} label="Your move" color="text-accent" />
            <div className="card-glow p-6 md:p-8">
              <div className="space-y-4 mb-8">
                <p className="text-base md:text-lg text-muted-foreground font-medium leading-relaxed">
                  Fly Labs is where all of it lives. The tools I build, the templates I wish existed, the ideas I'm testing, the music I listen to while building. Everything is open, free, and documented. If you're curious about building with AI, or you just want to see what one person can ship in their spare time, this is the place.
                </p>
                <p className="text-foreground font-bold text-lg md:text-xl">
                  Start with the Ideas Lab. Or just look around.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <Link
                  to="/ideas"
                  className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:brightness-110 transition-[filter,transform] duration-150 active:translate-y-0.5"
                >
                  Explore the Ideas Lab <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
                <span className="hidden sm:inline text-muted-foreground">or</span>
                <Link
                  to="/newsletter"
                  className="inline-flex items-center text-sm font-semibold text-primary hover:underline"
                  onClick={() => trackEvent('newsletter_click', { location: 'about_bottom' })}
                >
                  Read the newsletter <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </div>
            </div>
          </motion.section>

        </div>
      </div>
    </PageLayout>
  );
};

export default AboutPage;
