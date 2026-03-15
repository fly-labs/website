import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bot, ArrowRight, Target, Sparkles, MessageSquare, TrendingUp,
  Zap, ShieldCheck, Github, Database, Brain, BookOpen, Search,
  BarChart3, Layers,
} from 'lucide-react';
import { PageLayout } from '@/components/PageLayout.jsx';
import { motion } from 'framer-motion';
import { fadeUp, staggerContainer, staggerItem } from '@/lib/animations.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { trackEvent } from '@/lib/analytics.js';
import { SOURCE_COUNT, FRAMEWORK_COUNT, PROMPT_COUNT } from '@/lib/data/siteStats.js';
import { ScoreBar, getScoreTier, verdictStyles, FRAMEWORK_CONFIG } from '@/components/ideas/ScoreUtils.jsx';
import supabase from '@/lib/supabaseClient.js';

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

const ExampleScoreCard = ({ scores, vs, tier }) => (
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
    <p className="text-[10px] text-muted-foreground/40 mt-3 text-center">Real output from a FlyBot evaluation</p>
  </div>
);

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
        title: "FlyBot: AI With Hundreds of Scored Ideas Already Loaded",
        description: `Talk to an AI loaded with hundreds of scored ideas, ${FRAMEWORK_COUNT} frameworks, and ${PROMPT_COUNT} prompts. Describe a problem, get a real verdict. Free during beta.`,
        keywords: "AI idea scoring, vibe building AI, business idea evaluator, FlyBot, idea validation AI, content strategy AI, behavioral finance for builders",
        url: "https://flylabs.fun/flybot",
        schema: {
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "FlyBot",
          "applicationCategory": "BusinessApplication",
          "operatingSystem": "Web",
          "url": "https://flylabs.fun/flybot",
          "description": "AI-powered vibe building partner loaded with hundreds of scored ideas, 4 frameworks, 80 prompts, and behavioral finance models.",
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
                An AI that already did the homework.
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground font-medium leading-relaxed mb-4 max-w-lg">
                FlyBot has scored {ideaCount ? `${ideaCount}+` : 'hundreds of'} real problems from {SOURCE_COUNT} sources, knows {PROMPT_COUNT} prompts by name, and applies behavioral finance to your building decisions.
              </p>
              <p className="text-base text-muted-foreground/70 font-medium leading-relaxed mb-8 max-w-lg">
                When you describe an idea, it doesn't guess. It pattern-matches against hundreds of scored ideas and tells you what it's seen before.
              </p>

              <div className="flex flex-col sm:flex-row items-start gap-3">
                <button
                  onClick={handleCTA}
                  className="inline-flex items-center justify-center w-full sm:w-auto px-8 py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-lg hover:brightness-110 transition-[filter,transform] duration-150 active:translate-y-0.5"
                >
                  Try it free <ArrowRight className="w-5 h-5 ml-2" />
                </button>
                <Link
                  to="/scoring"
                  className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors py-2"
                >
                  How the scoring works <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </div>

            {/* Desktop: example score card */}
            <div className="hidden lg:block">
              <ExampleScoreCard scores={scores} vs={vs} tier={tier} />
            </div>
          </div>
        </motion.div>
      </section>

      {/* ===== THE DATA ADVANTAGE ===== */}
      <section className="py-10 md:py-14 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div {...fadeUp} transition={{ duration: 0.5 }} className="mb-10">
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-foreground mb-3">
              ChatGPT doesn't know your market. FlyBot does.
            </h2>
            <p className="text-muted-foreground font-medium max-w-2xl">
              Every day, automated pipelines pull real problems from {SOURCE_COUNT} sources and score them with {FRAMEWORK_COUNT} AI frameworks. That data lives inside FlyBot. When you bring an idea, it already has context.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            {...staggerContainer}
          >
            {[
              {
                icon: Database,
                title: ideaCount ? `${ideaCount}+ ideas scored and analyzed` : 'Hundreds of ideas scored and analyzed',
                desc: 'Real problems from Reddit, Hacker News, GitHub Issues, X, Product Hunt, the YC Graveyard, and more. Each one scored across 4 frameworks with per-pillar reasoning and a final verdict.',
                color: 'text-primary',
                bgColor: 'bg-primary/10',
              },
              {
                icon: Layers,
                title: `${FRAMEWORK_COUNT} scoring frameworks built in`,
                desc: 'The Fly Labs Method (solo builder fit), Hormozi\'s $100M evaluation, Dan Koe\'s one-person business lens, Okamoto\'s MicroSaaS validation. Weighted composite score. One verdict: BUILD, VALIDATE, or SKIP.',
                color: 'text-secondary',
                bgColor: 'bg-secondary/10',
              },
              {
                icon: Sparkles,
                title: `${PROMPT_COUNT} prompts it can recommend by name`,
                desc: 'Coding, writing, strategy, marketing, SEO, research, workflows, thinking. FlyBot knows every prompt in the library and will match the right one to your situation.',
                color: 'text-accent',
                bgColor: 'bg-accent/10',
              },
              {
                icon: Brain,
                title: 'The finance brain',
                desc: 'Confirmation bias, sunk cost fallacy, anchoring, loss aversion, disposition effect. CFA behavioral finance applied to builder decisions. It spots the bias before it costs you a weekend.',
                color: 'text-amber-500',
                bgColor: 'bg-amber-500/10',
              },
              {
                icon: BookOpen,
                title: 'A full content production system',
                desc: '12 title formulas, 7 subtitle moves, 5 article frameworks, 7 hook patterns for Notes, and the 2-hour content ecosystem. The same system behind @falacomigo, working on your content.',
                color: 'text-purple-500',
                bgColor: 'bg-purple-500/10',
              },
              {
                icon: Search,
                title: 'Market validation data',
                desc: 'Top ideas are validated against real conversations on X and Reddit via Grok and the Reddit API. FlyBot knows which ideas have real market evidence behind them.',
                color: 'text-blue-500',
                bgColor: 'bg-blue-500/10',
              },
            ].map((item) => (
              <motion.div
                key={item.title}
                {...staggerItem}
                className="card-glow p-6"
              >
                <div className={`w-10 h-10 rounded-lg ${item.bgColor} ${item.color} flex items-center justify-center mb-4`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-foreground mb-2 text-sm">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== THE PROBLEM ===== */}
      <section className="py-10 md:py-14 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div {...fadeUp} transition={{ duration: 0.5 }} className="space-y-5">
            <p className="text-lg md:text-xl text-muted-foreground font-medium leading-relaxed">
              You describe an idea to ChatGPT. It says "that sounds interesting" and gives you a generic SWOT analysis.
            </p>
            <p className="text-lg md:text-xl text-muted-foreground font-medium leading-relaxed">
              You describe the same idea to FlyBot. It tells you three similar ideas already scored below 45, that the problem has weak payment signals, and that a YC startup tried the same angle in 2019 and died because distribution was too expensive.
            </p>
            <p className="text-xl md:text-2xl text-foreground font-bold">
              The difference is data. FlyBot has it. General AI doesn't.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ===== WHAT YOU CAN DO ===== */}
      <section className="py-10 md:py-14 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div {...fadeUp} transition={{ duration: 0.5 }} className="mb-10">
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-foreground mb-3">
              Three conversations that save you a weekend
            </h2>
          </motion.div>

          <motion.div className="space-y-4" {...staggerContainer}>
            {[
              {
                label: '"Score my idea"',
                response: 'You describe the problem you want to solve. FlyBot runs it through 4 frameworks, pulls similar ideas from the database, checks for YC graveyard matches, and gives you a composite score with a BUILD, VALIDATE, or SKIP verdict. With per-pillar reasoning so you know exactly where the gaps are.',
                icon: Target,
                color: 'text-primary',
              },
              {
                label: '"Help me write about what I\'m building"',
                response: 'FlyBot knows 12 title formulas, 5 article structures, 7 hook patterns for Substack Notes, and the complete content production system behind a 460+ subscriber newsletter. It writes in bar talk, not marketing speak. And it can recommend specific prompts from the library by name.',
                icon: Sparkles,
                color: 'text-secondary',
              },
              {
                label: '"I\'m stuck between two paths"',
                response: 'This is where the finance brain kicks in. FlyBot will check if you\'re anchored on your first idea, whether sunk cost is clouding your judgment, or if confirmation bias is making a weak idea look strong. Then it scores both options and lets the data decide.',
                icon: Brain,
                color: 'text-accent',
              },
            ].map((item, i) => (
              <motion.div key={item.label} {...staggerItem} className="card-glow p-6">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-lg bg-card border border-border flex items-center justify-center shrink-0 ${item.color}`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground mb-2">{item.label}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.response}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== EXAMPLE EVALUATION (mobile + visual break) ===== */}
      <section className="py-10 md:py-14 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <motion.div {...fadeUp} transition={{ duration: 0.5 }}>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-4">
                What it looks like
              </p>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight text-foreground mb-4">
                You type an idea. You get this back.
              </h2>
              <p className="text-muted-foreground font-medium leading-relaxed mb-4">
                FlyBot talks about the idea first. What excites it, what worries it, what patterns it's seen in similar problems. Then it drops the score card with per-framework breakdowns and a final verdict.
              </p>
              <p className="text-sm text-muted-foreground/70 leading-relaxed">
                The same scoring engine that powers the Idea Lab, now in a conversation.
              </p>
            </motion.div>

            <motion.div {...fadeUp} transition={{ duration: 0.5, delay: 0.1 }}>
              <ExampleScoreCard scores={scores} vs={vs} tier={tier} />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== LIVE NUMBERS ===== */}
      <section className="py-10 md:py-14 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div {...fadeUp} transition={{ duration: 0.5 }} className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-foreground mb-3">
              The brain behind the conversation
            </h2>
            <p className="text-muted-foreground font-medium max-w-xl mx-auto">
              These numbers update daily. Every new idea scored, every new prompt added, every new source synced makes FlyBot smarter.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6"
            {...staggerContainer}
          >
            {[
              { value: ideaCount, label: 'Ideas scored', sub: 'across 4 frameworks', icon: BarChart3, color: 'text-primary' },
              { value: SOURCE_COUNT, label: 'Live sources', sub: 'synced daily', icon: Database, color: 'text-secondary' },
              { value: FRAMEWORK_COUNT, label: 'Scoring frameworks', sub: 'weighted composite', icon: Target, color: 'text-accent' },
              { value: PROMPT_COUNT, label: 'Prompts in memory', sub: 'recommended by name', icon: Sparkles, color: 'text-amber-500' },
            ].map((stat) => (
              <motion.div key={stat.label} {...staggerItem} className="glass-card p-4 text-center">
                <stat.icon className={`w-4 h-4 ${stat.color} mx-auto mb-2`} />
                <div className="text-2xl md:text-3xl font-black text-foreground">
                  {stat.value != null ? <AnimatedNumber value={stat.value} suffix="+" /> : '...'}
                </div>
                <div className="text-xs font-medium text-foreground mt-1">{stat.label}</div>
                <div className="text-[10px] text-muted-foreground/60 mt-0.5">{stat.sub}</div>
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
              How it works under the hood
            </h2>
          </motion.div>

          <motion.div className="grid grid-cols-1 sm:grid-cols-3 gap-4" {...staggerContainer}>
            {[
              { num: '01', title: 'You talk', desc: 'Describe a problem, paste an idea, ask for help writing. Natural language. No forms, no templates.' },
              { num: '02', title: 'FlyBot connects the dots', desc: `Pulls similar ideas from the database. Matches relevant prompts from the library. Runs the ${FRAMEWORK_COUNT} scoring frameworks. Checks for YC graveyard overlaps.` },
              { num: '03', title: 'You get a real answer', desc: 'A score card with per-framework breakdown, a verdict, per-pillar reasoning, and honest commentary on what\'s strong and what\'s weak.' },
            ].map((step) => (
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

      {/* ===== TRANSPARENCY ===== */}
      <section className="py-10 md:py-14 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div {...fadeUp} transition={{ duration: 0.5 }}>
            <div className="glass-card p-6 md:p-8">
              <div className="flex items-center gap-3 mb-4">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">Honest fine print</h2>
              </div>
              <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                <p>
                  Powered by Claude (Anthropic). 5 free messages per account during beta. Conversations are stored securely and only visible to you.
                </p>
                <p>
                  Scores and verdicts are AI opinions based on real data, not guarantees. FlyBot is tuned for one thing: helping solo builders make better decisions about what to build and how to talk about it. It won't do investment advice, personal coaching, or homework.
                </p>
                <p>
                  The entire platform, including FlyBot's system prompt architecture, is open source.{' '}
                  <a
                    href="https://github.com/fly-labs/website"
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    <Github className="w-3.5 h-3.5" /> See the code
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
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-foreground mb-3">
            Five free messages. Zero fluff.
          </h2>
          <p className="text-muted-foreground font-medium mb-8 max-w-lg mx-auto">
            Bring an idea, a draft, or a decision you're stuck on. FlyBot will tell you what the data says.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <button
              onClick={handleCTA}
              className="inline-flex items-center justify-center w-full sm:w-auto px-8 py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-lg hover:brightness-110 transition-[filter,transform] duration-150 active:translate-y-0.5"
            >
              Start a conversation <ArrowRight className="w-5 h-5 ml-2" />
            </button>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
            <Link to="/ideas" className="hover:text-primary transition-colors">Explore the Idea Lab</Link>
            <span className="text-muted-foreground/30">|</span>
            <Link to="/prompts" className="hover:text-primary transition-colors">Browse {PROMPT_COUNT} Prompts</Link>
            <span className="text-muted-foreground/30">|</span>
            <Link to="/scoring" className="hover:text-primary transition-colors">See the Frameworks</Link>
          </div>
        </motion.div>
      </section>
    </PageLayout>
  );
};

export default FlyBotLandingPage;
