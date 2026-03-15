import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bot, ArrowRight, Target, Sparkles, MessageSquare, TrendingUp,
  Zap, ShieldCheck, Github, ExternalLink,
} from 'lucide-react';
import { PageLayout } from '@/components/PageLayout.jsx';
import { motion } from 'framer-motion';
import { fadeUp, staggerContainer, staggerItem } from '@/lib/animations.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { trackEvent } from '@/lib/analytics.js';
import { SOURCE_COUNT, FRAMEWORK_COUNT, PROMPT_COUNT } from '@/lib/data/siteStats.js';
import { ScoreBar, getScoreTier, verdictStyles, FRAMEWORK_CONFIG } from '@/components/ideas/ScoreUtils.jsx';
import supabase from '@/lib/supabaseClient.js';

const capabilities = [
  {
    icon: Target,
    title: 'Score Ideas',
    desc: 'Describe a problem. Get a verdict: BUILD, VALIDATE, or SKIP. Four frameworks, one honest answer.',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  {
    icon: Sparkles,
    title: 'Write Content',
    desc: 'Articles, Substack Notes, titles. The same frameworks behind @falacomigo, working on your stuff.',
    color: 'text-secondary',
    bgColor: 'bg-secondary/10',
  },
  {
    icon: MessageSquare,
    title: 'Think Through Decisions',
    desc: 'Stuck between two ideas? Unsure about pricing? Name your project? Talk it through.',
    color: 'text-accent',
    bgColor: 'bg-accent/10',
  },
  {
    icon: TrendingUp,
    title: 'The Finance Brain',
    desc: 'Behavioral finance meets builder decisions. Spot your confirmation bias before it costs you a weekend.',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
  },
];

const steps = [
  { num: '01', title: 'Describe what you\'re building', desc: 'Type naturally. A problem, an idea, a question about your project.' },
  { num: '02', title: 'FlyBot evaluates', desc: 'Scores, patterns, frameworks. Real analysis in seconds.' },
  { num: '03', title: 'You decide', desc: 'BUILD, VALIDATE, or move on. Your call, informed by data.' },
];

// Static example evaluation for the demo
const exampleEval = {
  idea_title: 'Meal prep subscription tracker for busy professionals',
  flylabs_score: 62,
  hormozi_score: 58,
  koe_score: 55,
  okamoto_score: 64,
  composite_score: 60,
  verdict: 'VALIDATE_FIRST',
};

const AnimatedNumber = ({ value, suffix = '' }) => {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (value == null) return;
    const duration = 1200;
    const steps = 40;
    const increment = value / steps;
    let current = 0;
    const interval = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplay(value);
        clearInterval(interval);
      } else {
        setDisplay(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(interval);
  }, [value]);

  if (value == null) return <span>...</span>;
  return <span>{display.toLocaleString()}{suffix}</span>;
};

const FlyBotLandingPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
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

  const handleCTA = () => {
    trackEvent('cta_click', { cta: 'flybot_start', location: 'flybot_landing' });
    if (isAuthenticated) {
      navigate('/flybot/chat');
    } else {
      navigate('/login');
    }
  };

  const vs = verdictStyles[exampleEval.verdict];
  const tier = getScoreTier(exampleEval.composite_score);

  const scores = [
    { key: 'flylabs', score: exampleEval.flylabs_score, config: FRAMEWORK_CONFIG[0] },
    { key: 'hormozi', score: exampleEval.hormozi_score, config: FRAMEWORK_CONFIG[1] },
    { key: 'koe', score: exampleEval.koe_score, config: FRAMEWORK_CONFIG[2] },
    { key: 'okamoto', score: exampleEval.okamoto_score, config: FRAMEWORK_CONFIG[3] },
  ];

  return (
    <PageLayout
      seo={{
        title: "FlyBot: Your AI Vibe Building Partner",
        description: "Score ideas, write content, think through decisions. 4 frameworks, 670+ scored ideas, one conversation. Free during beta.",
        keywords: "AI building partner, idea scoring AI, vibe building AI, business idea evaluator, FlyBot, content writing AI",
        url: "https://flylabs.fun/flybot",
        schema: {
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "FlyBot",
          "applicationCategory": "BusinessApplication",
          "operatingSystem": "Web",
          "url": "https://flylabs.fun/flybot",
          "description": "AI-powered vibe building partner. Score ideas, write content, think through decisions.",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD",
          },
        },
      }}
    >
      {/* ===== HERO ===== */}
      <section className="relative pt-24 sm:pt-32 md:pt-36 pb-12 md:pb-16 px-6 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 max-w-5xl mx-auto"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: copy */}
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Bot className="w-6 h-6 text-primary" />
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                  Free during beta
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-foreground leading-[1.05] mb-5">
                FlyBot
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground font-medium leading-relaxed mb-8 max-w-lg">
                Your vibe building partner. Score ideas. Write content. Think through decisions. A real conversation with someone who knows the data.
              </p>

              <div className="flex flex-col sm:flex-row items-start gap-3">
                <button
                  onClick={handleCTA}
                  className="inline-flex items-center justify-center w-full sm:w-auto px-8 py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-lg hover:brightness-110 transition-[filter,transform] duration-150 active:translate-y-0.5"
                >
                  Start a conversation <ArrowRight className="w-5 h-5 ml-2" />
                </button>
                <Link
                  to="/scoring"
                  className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors py-2"
                >
                  See how scoring works <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </div>

            {/* Right: example score card */}
            <div className="hidden lg:block">
              <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm max-w-sm mx-auto">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <h4 className="font-semibold text-sm leading-snug">{exampleEval.idea_title}</h4>
                    <div className="flex items-baseline gap-1.5 mt-1.5">
                      <span className={`text-3xl font-bold tabular-nums tracking-tight ${tier.color}`}>
                        {exampleEval.composite_score}
                      </span>
                      <span className="text-xs text-muted-foreground/50">/100</span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide border ${vs.bg} ${vs.border} ${vs.text}`}>
                    {vs.label}
                  </span>
                </div>
                <div className="space-y-2.5">
                  {scores.map(({ key, score, config }) => (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[11px] font-medium ${config.color || 'text-muted-foreground'}`}>
                          {config.label}
                        </span>
                        <span className="text-[11px] font-bold tabular-nums text-muted-foreground">
                          {score}
                        </span>
                      </div>
                      <ScoreBar score={score} color={config.barColor} />
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground/40 mt-3 text-center">Example evaluation</p>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ===== THE PROBLEM ===== */}
      <section className="py-10 md:py-14 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div {...fadeUp} transition={{ duration: 0.5 }} className="space-y-5">
            <p className="text-lg md:text-xl text-muted-foreground font-medium leading-relaxed">
              You have an idea. You don't know if it's worth your weekend.
            </p>
            <p className="text-lg md:text-xl text-muted-foreground font-medium leading-relaxed">
              You wrote something. You can't tell if it's good or if it just sounds good.
            </p>
            <p className="text-lg md:text-xl text-muted-foreground font-medium leading-relaxed">
              You're stuck between two paths. You need someone to pressure-test your thinking.
            </p>
            <p className="text-xl md:text-2xl text-foreground font-bold">
              That's what FlyBot does.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ===== CAPABILITIES ===== */}
      <section className="py-10 md:py-14 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeUp} transition={{ duration: 0.5 }} className="mb-10">
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-foreground mb-3">
              What FlyBot does
            </h2>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            {...staggerContainer}
          >
            {capabilities.map((cap) => (
              <motion.div
                key={cap.title}
                {...staggerItem}
                className="card-glow p-6"
              >
                <div className={`w-10 h-10 rounded-lg ${cap.bgColor} ${cap.color} flex items-center justify-center mb-4`}>
                  <cap.icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-foreground mb-2">{cap.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{cap.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="py-10 md:py-14 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div {...fadeUp} transition={{ duration: 0.5 }} className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-foreground mb-3">
              How it works
            </h2>
          </motion.div>

          <motion.div className="grid grid-cols-1 sm:grid-cols-3 gap-4" {...staggerContainer}>
            {steps.map((step) => (
              <motion.div key={step.num} {...staggerItem} className="glass-card p-6 text-center">
                <span className="text-xs font-black uppercase tracking-widest text-primary mb-3 block">
                  {step.num}
                </span>
                <h3 className="font-bold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== EXAMPLE EVALUATION (mobile) ===== */}
      <section className="py-10 md:py-14 px-6 lg:hidden">
        <div className="max-w-sm mx-auto">
          <motion.div {...fadeUp} transition={{ duration: 0.5 }}>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-4 text-center">
              Example evaluation
            </p>
            <div className="rounded-xl border border-border/60 bg-card p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <h4 className="font-semibold text-sm leading-snug">{exampleEval.idea_title}</h4>
                  <div className="flex items-baseline gap-1.5 mt-1.5">
                    <span className={`text-3xl font-bold tabular-nums tracking-tight ${tier.color}`}>
                      {exampleEval.composite_score}
                    </span>
                    <span className="text-xs text-muted-foreground/50">/100</span>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide border ${vs.bg} ${vs.border} ${vs.text}`}>
                  {vs.label}
                </span>
              </div>
              <div className="space-y-2.5">
                {scores.map(({ key, score, config }) => (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[11px] font-medium ${config.color || 'text-muted-foreground'}`}>
                        {config.label}
                      </span>
                      <span className="text-[11px] font-bold tabular-nums text-muted-foreground">
                        {score}
                      </span>
                    </div>
                    <ScoreBar score={score} color={config.barColor} />
                  </div>
                ))}
              </div>
            </div>
            <p className="text-center text-sm text-muted-foreground mt-4">
              This is what 5 minutes with FlyBot looks like.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ===== WHAT IT KNOWS ===== */}
      <section className="py-10 md:py-14 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div {...fadeUp} transition={{ duration: 0.5 }} className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-foreground mb-3">
              What it knows
            </h2>
          </motion.div>

          <motion.div
            className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6"
            {...staggerContainer}
          >
            {[
              { value: ideaCount, label: 'Ideas scored', icon: Zap, color: 'text-primary' },
              { value: SOURCE_COUNT, label: 'Sources monitored', icon: Target, color: 'text-secondary' },
              { value: FRAMEWORK_COUNT, label: 'Scoring frameworks', icon: TrendingUp, color: 'text-accent' },
              { value: PROMPT_COUNT, label: 'Prompts in library', icon: Sparkles, color: 'text-amber-500' },
            ].map((stat) => (
              <motion.div key={stat.label} {...staggerItem} className="glass-card p-4 text-center">
                <stat.icon className={`w-4 h-4 ${stat.color} mx-auto mb-2`} />
                <div className="text-2xl md:text-3xl font-black text-foreground">
                  {stat.value != null ? <AnimatedNumber value={stat.value} suffix="+" /> : '...'}
                </div>
                <div className="text-xs font-medium text-muted-foreground mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>

          <motion.p {...fadeUp} className="text-center text-sm text-muted-foreground max-w-xl mx-auto">
            FlyBot has access to every scored idea, every prompt, and every framework on the platform. It connects dots you can't see in a list.
          </motion.p>
        </div>
      </section>

      {/* ===== TRANSPARENCY ===== */}
      <section className="py-10 md:py-14 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div {...fadeUp} transition={{ duration: 0.5 }}>
            <div className="glass-card p-6 md:p-8">
              <div className="flex items-center gap-3 mb-4">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">What this is and isn't</h2>
              </div>
              <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                <p>
                  Powered by Claude (Anthropic). 5 free messages per account during beta. Conversations are stored securely and only visible to you.
                </p>
                <p>
                  FlyBot scores business ideas, helps write content, and thinks through building decisions. It won't do life advice, investment recommendations, or homework. Scores and verdicts are AI opinions, not guarantees.
                </p>
                <p>
                  The full codebase is open source.{' '}
                  <a
                    href="https://github.com/fly-labs/website"
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    <Github className="w-3.5 h-3.5" /> github.com/fly-labs/website
                  </a>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== CTA FOOTER ===== */}
      <section className="relative py-14 md:py-20 px-6 overflow-hidden">
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.5 }}
          className="relative z-10 max-w-3xl mx-auto text-center"
        >
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-foreground mb-5">
            Your first conversation is free.
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <button
              onClick={handleCTA}
              className="inline-flex items-center justify-center w-full sm:w-auto px-8 py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-lg hover:brightness-110 transition-[filter,transform] duration-150 active:translate-y-0.5"
            >
              Start building <ArrowRight className="w-5 h-5 ml-2" />
            </button>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
            <Link to="/ideas" className="hover:text-primary transition-colors">Explore the Idea Lab</Link>
            <span className="text-muted-foreground/30">|</span>
            <Link to="/prompts" className="hover:text-primary transition-colors">Browse the Prompt Library</Link>
            <span className="text-muted-foreground/30">|</span>
            <Link to="/newsletter" className="hover:text-primary transition-colors">Read the newsletter</Link>
          </div>
        </motion.div>
      </section>
    </PageLayout>
  );
};

export default FlyBotLandingPage;
