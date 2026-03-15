import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bot, ArrowRight, Target, Sparkles, MessageSquare,
  Zap, ShieldCheck, Github, Database, BookOpen, Search,
  BarChart3, Layers, AlertTriangle,
} from 'lucide-react';
import { PageLayout } from '@/components/PageLayout.jsx';
import { motion } from 'framer-motion';
import { fadeUp, staggerContainer, staggerItem } from '@/lib/animations.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { trackEvent } from '@/lib/analytics.js';
import { SOURCE_COUNT, QUESTION_COUNT, PROMPT_COUNT } from '@/lib/data/siteStats.js';
import { ScoreBar, getScoreTier, verdictStyles, FRAMEWORK_CONFIG } from '@/components/ideas/ScoreUtils.jsx';
import supabase from '@/lib/supabaseClient.js';

const exampleEval = {
  idea_title: 'Meal prep subscription tracker for busy professionals',
  flylabs_score: 62,
  hormozi_score: 58,
  koe_score: 55,
  okamoto_score: 64,
  composite_score: 62, // = flylabs_score (backward compat)
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
            {exampleEval.flylabs_score}
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
            <span className={`text-[11px] font-medium ${config.color || 'text-muted-foreground'}`}>{config.label}</span>
            <span className="text-[11px] font-bold tabular-nums text-muted-foreground">{score}</span>
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
    navigate(isAuthenticated ? '/flybot/chat' : '/login');
  };

  const vs = verdictStyles[exampleEval.verdict];
  const tier = getScoreTier(exampleEval.flylabs_score);
  const scores = [
    { key: 'flylabs', score: exampleEval.flylabs_score, config: FRAMEWORK_CONFIG[0] },
    { key: 'hormozi', score: exampleEval.hormozi_score, config: FRAMEWORK_CONFIG[1] },
    { key: 'koe', score: exampleEval.koe_score, config: FRAMEWORK_CONFIG[2] },
    { key: 'okamoto', score: exampleEval.okamoto_score, config: FRAMEWORK_CONFIG[3] },
  ];

  return (
    <PageLayout
      seo={{
        title: "FlyBot: An AI That Already Did the Homework",
        description: `Describe a problem, get a real verdict. FlyBot has scored hundreds of ideas across ${QUESTION_COUNT} questions and knows ${PROMPT_COUNT} prompts by name. Free during beta.`,
        keywords: "AI idea scoring, business idea evaluator, FlyBot, idea validation AI, vibe building, content strategy AI, solo builder tools",
        url: "https://flylabs.fun/flybot",
        schema: {
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "FlyBot",
          "applicationCategory": "BusinessApplication",
          "operatingSystem": "Web",
          "url": "https://flylabs.fun/flybot",
          "description": "AI partner for solo builders. Scores ideas, writes content, catches blind spots. Loaded with hundreds of scored problems and 80 prompts.",
          "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
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
                FlyBot sits on top of {ideaCount ? `${ideaCount}+` : 'hundreds of'} scored ideas, {PROMPT_COUNT} prompts, and {SOURCE_COUNT} live data sources. When you describe what you're building, it doesn't start from zero.
              </p>
              <p className="text-base text-muted-foreground/70 font-medium leading-relaxed mb-8 max-w-lg">
                It tells you what it's already seen. Which similar ideas scored well. Where yours might break. And whether it's worth your weekend.
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

            <div className="hidden lg:block">
              <ExampleScoreCard scores={scores} vs={vs} tier={tier} />
            </div>
          </div>
        </motion.div>
      </section>

      {/* ===== THE PROBLEM (storytelling, not jargon) ===== */}
      <section className="py-10 md:py-14 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div {...fadeUp} transition={{ duration: 0.5 }} className="space-y-5">
            <p className="text-lg md:text-xl text-muted-foreground font-medium leading-relaxed">
              You ask ChatGPT about your idea. It says "that sounds promising!" and gives you a list of next steps that could apply to literally anything.
            </p>
            <p className="text-lg md:text-xl text-muted-foreground font-medium leading-relaxed">
              You ask FlyBot. It pulls up three similar ideas that already scored below 45. It flags that nobody in those markets was willing to pay. It finds a YC startup that tried the same angle and shut down in 18 months.
            </p>
            <p className="text-lg md:text-xl text-muted-foreground font-medium leading-relaxed">
              Then it scores your idea anyway, because yours might be different. And it tells you exactly where it's different and where it's not.
            </p>
            <p className="text-xl md:text-2xl text-foreground font-bold">
              Same question. Different answer. Because one of them has data.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ===== WHAT'S LOADED (the data, not the methodology) ===== */}
      <section className="py-10 md:py-14 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div {...fadeUp} transition={{ duration: 0.5 }} className="mb-10">
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-foreground mb-3">
              What's already inside
            </h2>
            <p className="text-muted-foreground font-medium max-w-2xl">
              Every day, automated pipelines pull real problems from {SOURCE_COUNT} sources and score them. That data lives inside FlyBot. When you bring your idea, it already has context.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            {...staggerContainer}
          >
            {[
              {
                icon: Database,
                title: ideaCount ? `${ideaCount}+ real problems scored` : 'Hundreds of real problems scored',
                desc: 'From Reddit, Hacker News, GitHub, X, Product Hunt, the YC Graveyard, and more. Each one scored across 4 questions with a final verdict. FlyBot can search this database while you talk.',
                color: 'text-primary',
                bgColor: 'bg-primary/10',
              },
              {
                icon: Layers,
                title: `${QUESTION_COUNT} questions about your idea`,
                desc: 'Is the problem real? Is there room for something new? Would people pay? Can you build it alone? Four questions, scored from different angles, combined into one honest verdict: BUILD, VALIDATE, or SKIP.',
                color: 'text-secondary',
                bgColor: 'bg-secondary/10',
              },
              {
                icon: Sparkles,
                title: `${PROMPT_COUNT} prompts it recommends by name`,
                desc: 'Need to write a landing page? There\'s a prompt for that. Want to structure a Substack post? FlyBot will name the specific prompt, explain why it fits, and quote the key instructions from it.',
                color: 'text-accent',
                bgColor: 'bg-accent/10',
              },
              {
                icon: AlertTriangle,
                title: 'A built-in BS detector',
                desc: 'Are you only looking for evidence that agrees with you? Holding onto a project because you already spent three weekends on it? FlyBot spots the patterns that make smart people waste time on the wrong things.',
                color: 'text-amber-500',
                bgColor: 'bg-amber-500/10',
              },
              {
                icon: BookOpen,
                title: 'You built something. Now what do you say?',
                desc: 'Most builders ship and then stare at a blank page. FlyBot has 12 title formulas, 5 article structures, and 7 hook patterns loaded. Tell it what you built and it helps you figure out how to talk about it.',
                color: 'text-purple-500',
                bgColor: 'bg-purple-500/10',
              },
              {
                icon: Search,
                title: 'Real conversations as proof',
                desc: 'The best ideas get validated against live discussions on X and Reddit. FlyBot knows which problems have real people actively complaining about them, and which ones are just theories.',
                color: 'text-blue-500',
                bgColor: 'bg-blue-500/10',
              },
              {
                icon: BarChart3,
                title: 'Live analytics intelligence',
                desc: 'Which industries are trending? Which sources produce the best ideas? Where do frameworks disagree? FlyBot has real-time analytics loaded and can surface patterns, hidden gems, and momentum shifts you\'d miss scrolling through ideas manually.',
                color: 'text-cyan-500',
                bgColor: 'bg-cyan-500/10',
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

      {/* ===== THREE CONVERSATIONS ===== */}
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
                label: '"I have an idea. Is it any good?"',
                response: 'Describe the problem you want to solve. FlyBot asks 4 questions about it, pulls similar ideas from the database, checks for dead startups that tried the same thing, and gives you a score with a BUILD, VALIDATE, or SKIP verdict. With per-pillar reasoning so you know exactly where the gaps are.',
                icon: Target,
                color: 'text-primary',
              },
              {
                label: '"I need to write about what I\'m building."',
                response: `FlyBot has 12 title formulas, 5 article structures, and 7 hook patterns loaded. It can recommend specific prompts from the library by name and tell you which one fits your situation. It writes like a person talks, not like a marketing team writes.`,
                icon: Sparkles,
                color: 'text-secondary',
              },
              {
                label: '"I can\'t decide. I keep going back and forth."',
                response: 'This is where FlyBot is most useful. It will ask you why you keep going back to the first option (maybe you\'re just attached to it). It will score both ideas side by side. And it will show you where the data actually points, even if it\'s not the answer you wanted.',
                icon: MessageSquare,
                color: 'text-accent',
              },
            ].map((item) => (
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

      {/* ===== SCORE CARD DEMO ===== */}
      <section className="py-10 md:py-14 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <motion.div {...fadeUp} transition={{ duration: 0.5 }}>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-4">
                What it looks like
              </p>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight text-foreground mb-4">
                You type an idea. This comes back.
              </h2>
              <p className="text-muted-foreground font-medium leading-relaxed mb-4">
                FlyBot talks first. What looks strong, what's risky, what patterns it recognizes from similar problems. Then it drops the score card with per-framework breakdowns and a final verdict.
              </p>
              <p className="text-sm text-muted-foreground/70 leading-relaxed">
                The same scoring engine that runs the Ideas Lab, now in a conversation you can steer.
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
              Gets smarter every day
            </h2>
            <p className="text-muted-foreground font-medium max-w-xl mx-auto">
              New ideas scored, new sources synced, new prompts added. These are live numbers.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-2 sm:grid-cols-4 gap-4"
            {...staggerContainer}
          >
            {[
              { value: ideaCount, label: 'Ideas scored', sub: 'with full reasoning', icon: BarChart3, color: 'text-primary' },
              { value: SOURCE_COUNT, label: 'Live sources', sub: 'synced daily', icon: Database, color: 'text-secondary' },
              { value: QUESTION_COUNT, label: 'Scoring questions', sub: 'one score, one verdict', icon: Target, color: 'text-accent' },
              { value: PROMPT_COUNT, label: 'Prompts loaded', sub: 'recommended by name', icon: Sparkles, color: 'text-amber-500' },
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
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">
              Under the hood
            </h2>
          </motion.div>

          <motion.div className="grid grid-cols-1 sm:grid-cols-3 gap-4" {...staggerContainer}>
            {[
              { num: '01', title: 'You talk', desc: 'Describe a problem, paste an idea, ask for help with a post. Just talk naturally.' },
              { num: '02', title: 'FlyBot connects dots', desc: 'Pulls similar ideas from the database. Matches prompts from the library. Asks the 4 scoring questions. Checks for dead startup overlaps.' },
              { num: '03', title: 'You get a real answer', desc: 'A score card, a verdict, per-pillar reasoning, and honest commentary. Then you decide what to do with it.' },
            ].map((step) => (
              <motion.div key={step.num} {...staggerItem} className="glass-card p-6 text-center">
                <span className="text-xs font-black uppercase tracking-widest text-primary mb-3 block">{step.num}</span>
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
                  Powered by Claude (Anthropic). 5 free messages per account during beta. Your conversations are private and only visible to you.
                </p>
                <p>
                  Scores are AI opinions based on real data. Good opinions, but opinions. FlyBot helps solo builders decide what to build and how to talk about it. It won't give investment advice, do your homework, or pretend to be a therapist.
                </p>
                <p>
                  The entire platform is open source.{' '}
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

      {/* ===== CTA ===== */}
      <section className="relative py-14 md:py-20 px-6 overflow-hidden">
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.5 }}
          className="relative z-10 max-w-3xl mx-auto text-center"
        >
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-foreground mb-3">
            Five messages. Real answers.
          </h2>
          <p className="text-muted-foreground font-medium mb-8 max-w-lg mx-auto">
            Bring an idea you're excited about. Or one you're not sure about. That's usually the more useful conversation.
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
            <Link to="/ideas" className="hover:text-primary transition-colors">Explore the Ideas Lab</Link>
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
