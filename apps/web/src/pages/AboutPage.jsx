
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Youtube, Github, Linkedin, Mail, BookOpen, ArrowRight, ChevronDown, FlaskConical, BarChart3, Rocket, Zap, Sparkles, Users, Terminal } from 'lucide-react';
import { GitHubHeatmap } from '@/components/GitHubHeatmap.jsx';
import { PageLayout } from '@/components/PageLayout.jsx';
import { XIcon } from '@/components/XIcon.jsx';
import { motion } from 'framer-motion';
import { fadeUp, staggerContainer, staggerItem } from '@/lib/animations.js';
import { trackEvent } from '@/lib/analytics.js';
import { SOURCE_COUNT, FRAMEWORK_COUNT, PROMPT_COUNT, CATEGORY_COUNT } from '@/lib/data/siteStats.js';
import supabase from '@/lib/supabaseClient.js';

const socials = [
  { href: 'mailto:luiz@flylabs.fun', icon: Mail, label: 'Email', color: 'text-primary' },
  { href: 'https://falacomigo.substack.com', icon: BookOpen, label: 'Substack', color: 'text-secondary', external: true },
  { href: 'https://github.com/fly-labs', icon: Github, label: 'GitHub', color: 'text-foreground', external: true },
  { href: 'https://x.com/alvesluizc', icon: XIcon, label: 'X', color: 'text-foreground', external: true },
  { href: 'https://youtube.com/@falacomigoyt', icon: Youtube, label: 'YouTube', color: 'text-[#FF0000]', external: true },
  { href: 'https://br.linkedin.com/in/alvesluizc', icon: Linkedin, label: 'LinkedIn', color: 'text-[#0A66C2]', external: true },
];

const storyBeats = [
  {
    label: 'The Origin',
    color: 'text-secondary',
    paragraphs: [
      "I work in finance. Have for over a decade. It's a serious job and I take it seriously. But somewhere along the way I started playing with AI tools, and I realized I could actually build things. Real things. Apps, templates, automated pipelines. With zero engineering background.",
      "The first time I shipped something and a stranger used it, something clicked. I wasn't thinking about a business. I was just curious: what else can I build? What other problems can I solve? That curiosity turned into weekend mornings and late nights in front of the screen, and honestly, it doesn't feel like work.",
    ],
  },
  {
    label: 'The Tools',
    color: 'text-secondary',
    paragraphs: [
      <>I've been reading a lot of business books. AI, strategy, mindset, the random stuff I can't stop learning about. My study notes kept piling up, so I turned them into something useful: <Link to="/library" className="text-foreground font-semibold hover:text-primary transition-colors">a library of free ebooks</Link>. Some of those books had templates I thought were worth highlighting, so I built <Link to="/templates" className="text-foreground font-semibold hover:text-primary transition-colors">a templates section</Link> for those too.</>,
      <>Then the prompts rabbit hole happened. I started collecting AI prompts from everywhere. My notes app turned into a mess. So I built <Link to="/prompts" className="text-foreground font-semibold hover:text-primary transition-colors">a prompt library</Link> with {PROMPT_COUNT} prompts across {CATEGORY_COUNT} categories, a proper search, and filters that actually help me find what I need.</>,
    ],
  },
  {
    label: 'The Idea Lab',
    color: 'text-primary',
    accent: true,
    paragraphs: [
      <>The <Link to="/ideas" className="text-foreground font-semibold hover:text-primary transition-colors">Idea Lab</Link> is a different beast. It was born to consolidate real pain points from {SOURCE_COUNT} sources: Reddit, Product Hunt, Hacker News, X, GitHub, and more. Every idea gets scored by {FRAMEWORK_COUNT} AI frameworks, including our own Fly Labs Method, which we built specifically for one-person builders. Then the top ideas get validated against real conversations happening online. This is ideation done right: the first step of what I call <span className="text-foreground font-semibold">vibe building</span>.</>,
    ],
    link: { label: 'Browse the Idea Lab', to: '/ideas' },
  },
  {
    label: 'The Philosophy',
    color: 'text-accent',
    paragraphs: [
      "Vibe building is the whole cycle. You find a real problem, you build a solution with AI, you share it openly. One person can now do what used to require a team. Andrej Karpathy named the coding part \"vibe coding.\" I think the whole thing is bigger than code. It's ideation, building, marketing, compounding. Each project feeds the next one.",
      "This site is my playground. The way I organize, study, create, and share everything. I'm constantly improving it with AI tools, which is honestly the most fun part. Tomorrow I might reevaluate. I might be wrong about some of this. But I'd rather say what I actually think than perform certainty I don't have.",
    ],
  },
];

const SectionLabel = ({ icon: Icon, label, color }) => (
  <div className="flex items-center gap-2 mb-4">
    <Icon className={`w-4 h-4 ${color}`} />
    <h2 className={`text-sm font-semibold uppercase tracking-widest ${color}`}>{label}</h2>
  </div>
);

const AboutPage = () => {
  const [ideaCount, setIdeaCount] = useState(null);

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
        title: "About Luiz Alves - Vibe Builder at Fly Labs",
        description: "Finance background, vibe builder. I build digital assets with AI on nights and weekends. Tools, templates, and open source experiments at Fly Labs.",
        keywords: "Luiz Alves, indie maker, AI builder, open source, tools, templates, vibe building",
        url: "https://flylabs.fun/about",
        schema: {
          "@context": "https://schema.org",
          "@type": "Person",
          "name": "Luiz Alves",
          "url": "https://flylabs.fun/about",
          "image": "https://flylabs.fun/images/luiz-alves.png",
          "jobTitle": "Vibe Builder & CFA Charterholder",
          "sameAs": [
            "https://github.com/fly-labs",
            "https://x.com/alvesluizc",
            "https://youtube.com/@falacomigoyt",
            "https://br.linkedin.com/in/alvesluizc",
            "https://falacomigo.substack.com"
          ]
        },
      }}
      className="pt-32 pb-24"
    >
      <div className="container mx-auto px-6">

        {/* 1. HERO */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-[auto_1fr] gap-8 md:gap-12 items-center mb-16 md:mb-20"
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

        <div className="max-w-5xl mx-auto space-y-16 md:space-y-20">

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

          {/* 3. THE STORY */}
          <motion.section {...staggerContainer}>
            <motion.div {...staggerItem}>
              <SectionLabel icon={BookOpen} label="The Story" color="text-secondary" />
            </motion.div>
            <div className="space-y-4">
              {storyBeats.map((beat) => (
                <motion.div
                  key={beat.label}
                  {...staggerItem}
                  className={`card-glow p-6 md:p-8 ${beat.accent ? 'border-l-4 border-primary' : ''}`}
                >
                  <p className={`text-xs font-bold uppercase tracking-widest ${beat.color} mb-4`}>{beat.label}</p>
                  <div className="space-y-4 text-base md:text-lg text-muted-foreground font-medium leading-relaxed">
                    {beat.paragraphs.map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>
                  {beat.link && (
                    <Link to={beat.link.to} className="inline-flex items-center text-sm font-semibold text-primary hover:underline mt-4">
                      {beat.link.label} <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Link>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* 4. BY THE NUMBERS */}
          <motion.section {...staggerContainer}>
            <motion.div {...staggerItem}>
              <SectionLabel icon={BarChart3} label="By The Numbers" color="text-primary" />
              <p className="text-base md:text-lg text-muted-foreground font-medium leading-relaxed mb-6">
                Real numbers from a real project.
              </p>
            </motion.div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { value: ideaCount, label: 'Ideas scored', icon: Zap, color: 'text-primary' },
                { value: SOURCE_COUNT, label: 'Data sources', icon: Users, color: 'text-secondary' },
                { value: PROMPT_COUNT, label: 'AI prompts', icon: Sparkles, color: 'text-accent' },
                { value: FRAMEWORK_COUNT, label: 'Scoring frameworks', icon: Terminal, color: 'text-primary' },
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
            <div className="glass-card p-5 md:p-6 mt-8">
              <GitHubHeatmap variant="full" />
            </div>
          </motion.section>

          {/* 5. CLOSING */}
          <motion.section {...fadeUp} transition={{ duration: 0.5 }}>
            <SectionLabel icon={Rocket} label="Come Build Something" color="text-accent" />
            <div className="glass-card p-6 md:p-8">
              <div className="space-y-6 mb-8">
                <p className="text-base md:text-lg text-muted-foreground font-medium leading-relaxed">
                  Fly Labs is where all of it lives. The tools I build, the templates I wish existed, the ideas I'm testing. Everything is open, free, and documented. If you're curious about building with AI, or you just want to see what one person can ship in their spare time, poke around.
                </p>
                <p className="text-foreground font-bold text-lg md:text-xl">
                  Come build something.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <Link
                  to="/explore"
                  className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:brightness-110 transition-[filter,transform] duration-150 active:translate-y-0.5"
                >
                  Explore The Lab <ArrowRight className="w-4 h-4 ml-2" />
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
