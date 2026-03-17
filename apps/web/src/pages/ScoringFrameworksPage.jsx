
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Target, Lightbulb, BarChart3, Sparkles, MessageSquare,
  TrendingUp, User, Zap, DollarSign, Eye, Layers, Rocket, Shield, Clock, Users,
  Search, Megaphone, CircleDollarSign, HelpCircle, FlaskConical, Globe,
  ChevronDown, ChevronUp, AlertTriangle, Database, CheckCircle2,
} from 'lucide-react';
import { PageLayout } from '@/components/PageLayout.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeUp } from '@/lib/animations.js';
import { EXPERT_COUNT, QUESTION_COUNT } from '@/lib/data/siteStats.js';
import { SOURCE_COUNT } from '@/lib/data/ideas.js';

const flylabsQuestions = [
  {
    question: 'Is the pain real?',
    label: 'Problem Clarity',
    points: 30,
    icon: Eye,
    what: 'Does this problem actually exist? Are people aware of it? How bad does it hurt?',
    signals: ['Existence & Awareness', 'Specificity', 'Severity'],
  },
  {
    question: 'Is there room for something new?',
    label: 'Solution Gap',
    points: 25,
    icon: Search,
    what: 'What already exists? Where do current solutions fall short? Is there whitespace?',
    signals: ['Alternative Quality', 'Addressable Complaints', 'Whitespace'],
  },
  {
    question: 'Would people actually do something about it?',
    label: 'Willingness to Act',
    points: 25,
    icon: Zap,
    what: 'Are people frustrated enough to switch? Would they pay? Is there urgency?',
    signals: ['Switching Motivation', 'Payment Signals', 'Urgency'],
  },
  {
    question: 'Can I actually ship this?',
    label: 'Buildability',
    points: 20,
    icon: Rocket,
    what: 'Can one person build this with AI tools and limited time? How fast? Does it compound?',
    signals: ['Solo Feasibility', 'Speed to Market', 'Compound Value'],
  },
];

const hormoziPillars = [
  { title: 'Market Viability', points: 20, icon: Target, items: ['Massive Pain', 'Purchasing Power', 'Easy to Target'], color: 'border-primary' },
  { title: 'Value Equation', points: 25, icon: Lightbulb, items: ['Dream Outcome (0-7)', 'Perceived Likelihood (0-6)', 'Speed to First Result (0-6)', 'Low Effort/Sacrifice (0-6)'], color: 'border-secondary' },
  { title: 'Market Growth & Timing', points: 15, icon: TrendingUp, items: ['Market Trajectory', 'Timing Fit'], color: 'border-accent' },
  { title: 'Offer Differentiation', points: 20, icon: Shield, items: ['Competitive Moat', 'Offer Stacking', 'Pricing Power'], color: 'border-primary' },
  { title: 'Execution Feasibility', points: 20, icon: Rocket, items: ['Build Complexity', 'GTM Clarity', 'Resource Requirements'], color: 'border-secondary' },
];

const koeDimensions = [
  { title: 'Problem Clarity', points: 25, icon: Eye, desc: 'Specific, quantifiable, urgent', color: 'border-primary' },
  { title: 'Creator Fit', points: 20, icon: User, desc: 'Solo creator / small team buildable', color: 'border-secondary' },
  { title: 'Audience Reach', points: 15, icon: Users, desc: 'Identifiable, connected, reachable online', color: 'border-accent' },
  { title: 'Simplicity', points: 15, icon: Zap, desc: 'Quick adoption, hours not months', color: 'border-primary' },
  { title: 'Monetization', points: 15, icon: DollarSign, desc: 'Clear revenue path', color: 'border-secondary' },
  { title: 'Anti-Niche POV', points: 5, icon: Sparkles, desc: 'Unique angle, hard to replicate', color: 'border-accent' },
  { title: 'Leverage Potential', points: 5, icon: Layers, desc: 'Scales without founder bottleneck', color: 'border-primary' },
];

const okamotoPillars = [
  { title: 'Target Audience', points: 20, icon: Search, items: ['Specificity', 'Identifiability', 'Reachability'], color: 'border-accent' },
  { title: 'Value Proposition', points: 25, icon: Lightbulb, items: ['Clarity', 'Specificity', 'Measurability'], color: 'border-accent' },
  { title: 'Distribution Channel', points: 20, icon: Megaphone, items: ['Accessibility', 'Viral Coefficient', 'CAC Efficiency'], color: 'border-accent' },
  { title: 'Business Model', points: 15, icon: CircleDollarSign, items: ['Monetization Clarity', 'Willingness to Pay', 'Pricing Power'], color: 'border-accent' },
  { title: 'Assumption Risk', points: 10, icon: HelpCircle, items: ['Testability', 'Critical Assumptions'], color: 'border-accent' },
  { title: 'Validation Readiness', points: 10, icon: FlaskConical, items: ['Experiment Feasibility', 'Evidence Availability'], color: 'border-accent' },
];

const expertFrameworks = [
  {
    id: 'hormozi',
    name: 'Alex Hormozi',
    weight: '20%',
    tagline: 'Wrote the book on offer design. His Value Equation reframes what makes people buy.',
    disclaimer: 'Inspired by $100M Offers and related content. Adapted for solo builders.',
    pillars: hormoziPillars,
    color: 'primary',
    links: [
      { label: 'acquisition.com', url: 'https://www.acquisition.com' },
      { label: 'YouTube', url: 'https://www.youtube.com/@AlexHormozi' },
      { label: 'X', url: 'https://x.com/alexhormozi' },
    ],
  },
  {
    id: 'koe',
    name: 'Dan Koe',
    weight: '20%',
    tagline: 'Built a one-person business proving you don\'t need a team or a niche. His framework checks whether a solo creator can actually ship and monetize.',
    disclaimer: 'Inspired by Dan Koe\'s public content on one-person businesses. Adapted for idea evaluation.',
    pillars: koeDimensions,
    color: 'secondary',
    links: [
      { label: 'thedankoe.com', url: 'https://thedankoe.com' },
      { label: 'YouTube', url: 'https://www.youtube.com/@thedankoe' },
      { label: 'X', url: 'https://x.com/thedankoe' },
    ],
    isDimension: true,
  },
  {
    id: 'okamoto',
    name: 'Bruno Okamoto',
    weight: '20%',
    tagline: 'Built 3 companies and Brazil\'s largest MicroSaaS community (20,000+ founders). Stress-tests distribution and business model assumptions.',
    disclaimer: 'Inspired by Bruno Okamoto\'s MicroSaaS validation methodology. Adapted for vibe builders.',
    pillars: okamotoPillars,
    color: 'accent',
    links: [
      { label: 'LinkedIn', url: 'https://www.linkedin.com/in/brunomicrosaas' },
      { label: 'Substack', url: 'https://microsaas.substack.com' },
      { label: 'microsaas.com.br', url: 'https://microsaas.com.br' },
    ],
  },
];

const pipelineSteps = [
  {
    label: 'Find',
    detail: `${SOURCE_COUNT} sources`,
    icon: Database,
    color: 'text-secondary',
    bg: 'bg-secondary/10',
    border: 'border-secondary/20',
  },
  {
    label: 'Score',
    detail: `${QUESTION_COUNT} questions`,
    icon: BarChart3,
    color: 'text-indigo-500',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/20',
  },
  {
    label: 'Validate',
    detail: 'X + Reddit',
    icon: Globe,
    color: 'text-yellow-600',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/20',
  },
  {
    label: 'Verdict',
    detail: 'BUILD / VALIDATE / SKIP',
    icon: CheckCircle2,
    color: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/20',
  },
];

const cycleStages = [
  { label: 'Ideation', active: true },
  { label: 'Build', active: false },
  { label: 'Market', active: false },
  { label: 'Close', active: false },
  { label: 'Compound', active: false },
];

const scoreTiers = [
  { range: '75-100', label: 'Exceptional', color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' },
  { range: '60-74', label: 'Strong', color: 'text-secondary', bg: 'bg-secondary/10', border: 'border-secondary/20' },
  { range: '45-59', label: 'Moderate', color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  { range: '30-44', label: 'Weak', color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
  { range: '0-29', label: 'Risky', color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' },
];

const ExpertSection = ({ framework }) => {
  const colorMap = {
    primary: { tag: 'bg-primary/10 text-primary border-primary/20', link: 'hover:text-primary' },
    secondary: { tag: 'bg-secondary/10 text-secondary border-secondary/20', link: 'hover:text-secondary' },
    accent: { tag: 'bg-accent/10 text-accent border-accent/20', link: 'hover:text-accent' },
  };
  const colors = colorMap[framework.color];

  return (
    <div className="mb-10">
      <div className="mb-4">
        <div className="flex items-center gap-3 mb-2">
          <h3 className="text-xl font-black tracking-tight">{framework.name}</h3>
          <span className="text-[10px] font-bold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">{framework.weight} weight</span>
        </div>
        <p className="text-sm text-muted-foreground mb-2">{framework.tagline}</p>
        <p className="text-xs text-muted-foreground/60 italic mb-3">{framework.disclaimer}</p>
        <div className="flex items-center gap-3 flex-wrap">
          {framework.links.map((link, i) => (
            <React.Fragment key={link.url}>
              {i > 0 && <span className="text-muted-foreground/30">|</span>}
              <a href={link.url} target="_blank" rel="noopener noreferrer" className={`text-xs font-medium text-muted-foreground ${colors.link} transition-colors`}>{link.label}</a>
            </React.Fragment>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {framework.pillars.map((pillar) => (
          <div
            key={pillar.title}
            className={`p-4 bg-card rounded-xl border border-border border-l-4 ${pillar.color}`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <pillar.icon className="w-4 h-4 text-foreground" />
                <span className="font-bold text-xs">{pillar.title}</span>
              </div>
              <span className="text-[10px] font-bold text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">{pillar.points} pts</span>
            </div>
            {framework.isDimension ? (
              <p className="text-xs text-muted-foreground">{pillar.desc}</p>
            ) : (
              <ul className="space-y-0.5">
                {pillar.items.map((item) => (
                  <li key={item} className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-muted-foreground/40 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const ScoringFrameworksPage = () => {
  const [expertOpen, setExpertOpen] = useState(false);

  return (
    <PageLayout
      seo={{
        title: "How We Score Ideas | Fly Labs",
        description: `The Ideas Lab finds real problems from ${SOURCE_COUNT} sources, asks ${QUESTION_COUNT} questions, validates against X and Reddit, and gives a verdict. Here's how.`,
        keywords: "Fly Labs Method, vibe building, idea scoring, AI validation, Hormozi, Dan Koe, Bruno Okamoto, startup ideas, problem-solution fit",
        url: "https://flylabs.fun/scoring",
        schema: {
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": "How We Score Ideas: Fly Labs Method + AI Validation",
          "description": `The Ideas Lab finds real problems from ${SOURCE_COUNT} sources, asks ${QUESTION_COUNT} questions, validates against X and Reddit, and gives a verdict.`,
          "url": "https://flylabs.fun/scoring",
          "author": { "@type": "Person", "name": "Luiz Alves" },
          "publisher": { "@type": "Organization", "name": "Fly Labs", "url": "https://flylabs.fun" }
        },
      }}
      className="pt-32 pb-24"
    >
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">

          {/* Back link */}
          <Link to="/ideas" className="inline-flex items-center text-muted-foreground hover:text-foreground font-bold mb-8 transition-colors bg-card px-4 py-2 rounded-xl border border-border shadow-sm">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Ideas Lab
          </Link>

          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <span className="inline-block text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-accent/10 text-accent border border-accent/20 mb-4">
              Free during beta
            </span>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight mb-6">
              We find real problems.<br />
              We ask <span className="text-primary">{QUESTION_COUNT} questions</span>.<br />
              We give a verdict.
            </h1>
            <p className="text-lg text-muted-foreground font-medium leading-relaxed max-w-2xl mx-auto">
              The Ideas Lab pulls problems from {SOURCE_COUNT} sources, scores them through the Fly Labs Method, validates against real conversations on X and Reddit, and tells you: build it, validate it, or skip it.
            </p>
          </motion.div>

          {/* Pipeline: Find → Score → Validate → Verdict */}
          <motion.div
            {...fadeUp}
            className="mb-20"
          >
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-2 max-w-4xl mx-auto">
              {pipelineSteps.map((step, i) => (
                <React.Fragment key={step.label}>
                  {i > 0 && (
                    <ArrowRight className="w-4 h-4 text-muted-foreground/30 hidden sm:block shrink-0 mx-1" />
                  )}
                  <div className={`flex-1 flex items-center gap-3 px-5 py-4 rounded-xl border ${step.border} ${step.bg}`}>
                    <step.icon className={`w-5 h-5 ${step.color} shrink-0`} />
                    <div>
                      <p className={`font-black text-sm ${step.color}`}>{step.label}</p>
                      <p className="text-xs text-muted-foreground font-medium">{step.detail}</p>
                    </div>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </motion.div>

          {/* Vibe Building Cycle */}
          <motion.div
            {...fadeUp}
            className="mb-20"
          >
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-4">
              {cycleStages.map((stage, i) => (
                <React.Fragment key={stage.label}>
                  {i > 0 && (
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/30 hidden sm:block shrink-0" />
                  )}
                  <div
                    className={`px-4 py-2 rounded-full text-sm font-bold border transition-colors ${
                      stage.active
                        ? 'bg-primary/10 text-primary border-primary/30 shadow-sm shadow-primary/10'
                        : 'bg-muted/30 text-muted-foreground/50 border-border/50'
                    }`}
                  >
                    {stage.label}
                    {!stage.active && <span className="text-[10px] ml-1 opacity-60">soon</span>}
                  </div>
                </React.Fragment>
              ))}
            </div>
            <p className="text-center text-sm text-muted-foreground max-w-xl mx-auto">
              The Ideas Lab covers Stage 1 of the vibe building cycle: finding problems worth solving. More stages coming.
            </p>
          </motion.div>

          {/* ─── THE FLY LABS METHOD ─── */}
          <div className="mb-24">
            <motion.div {...fadeUp} transition={{ duration: 0.5 }} className="mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-500 font-bold text-sm border border-indigo-500/20 mb-4">
                <Lightbulb className="w-4 h-4" /> The Method
              </div>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">
                {QUESTION_COUNT} Questions Before You Write a Line of Code
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl">
                The Fly Labs Method evaluates every idea from the perspective of a solo builder with AI tools and limited time. {QUESTION_COUNT} questions, 100 points. That's it.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {flylabsQuestions.map((q, i) => (
                <motion.div
                  key={q.label}
                  {...fadeUp}
                  transition={{ duration: 0.3, delay: i * 0.06 }}
                  className="card-playful p-6 bg-card border-l-4 border-indigo-500"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <q.icon className="w-5 h-5 text-indigo-500" />
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{q.label}</span>
                    </div>
                    <span className="text-xs font-bold text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded">{q.points} pts</span>
                  </div>
                  <h3 className="text-lg font-black mb-2">{q.question}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{q.what}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {q.signals.map((signal) => (
                      <span key={signal} className="text-[10px] font-medium text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">{signal}</span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Builder's Note */}
            <motion.div
              {...fadeUp}
              className="bg-primary/5 border border-primary/20 rounded-2xl p-6 md:p-8 mt-8 flex gap-4 items-start"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold text-primary uppercase tracking-wider mb-2">Builder's Note</p>
                <p className="text-muted-foreground leading-relaxed">
                  I built this because the hardest part of building is knowing WHAT to build. You can have the skills, the tools, the time on a Saturday morning. But if you pick the wrong problem, none of that matters. These {QUESTION_COUNT} questions are the filter I wish I had before I started.
                </p>
              </div>
            </motion.div>
          </div>

          {/* ─── VALIDATION ─── */}
          <div className="mb-24">
            <motion.div {...fadeUp} transition={{ duration: 0.5 }} className="mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-600 font-bold text-sm border border-yellow-500/20 mb-4">
                <Globe className="w-4 h-4" /> Validation
              </div>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">Then We Check the Real World</h2>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl">
                Scores tell you what frameworks think. Validation tells you what actual people are saying. We search X and Reddit for real frustration, real complaints, real conversations about the problem.
              </p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  icon: MessageSquare,
                  title: 'Evidence Search',
                  desc: 'We search X and Reddit for real people experiencing this pain. Tweets with engagement, Reddit threads with upvotes and comments, frustration language from actual users.',
                },
                {
                  icon: Search,
                  title: 'Competitive Intelligence',
                  desc: 'Who else is solving this? What do they charge? Where do people complain about them? We map the landscape from real conversations, not marketing pages.',
                },
                {
                  icon: TrendingUp,
                  title: 'Confidence Synthesis',
                  desc: 'AI synthesizes everything with a confidence level (high, medium, low based on evidence volume), recurring themes, unmet needs, and a final take that cross-references scores with market reality.',
                },
              ].map((phase, i) => (
                <motion.div
                  key={phase.title}
                  {...fadeUp}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className="card-playful p-5 bg-card border-l-4 border-yellow-500"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <phase.icon className="w-5 h-5 text-foreground" />
                    <h3 className="font-bold text-sm">{phase.title}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">{phase.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* ─── VERDICT ─── */}
          <div className="mb-24">
            <motion.div {...fadeUp} transition={{ duration: 0.5 }} className="mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-foreground/10 text-foreground font-bold text-sm border border-foreground/20 mb-4">
                <CheckCircle2 className="w-4 h-4" /> Verdict
              </div>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">One Answer</h2>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl">
                The Fly Labs Method answers {QUESTION_COUNT} questions. That score decides the verdict. {EXPERT_COUNT} expert perspectives add depth on the detail page but they don't change the number. When market validation exists, real evidence informs confidence. You get one of three answers.
              </p>
            </motion.div>
            <div className="flex flex-col sm:flex-row gap-3 max-w-3xl mx-auto">
              <div className="flex-1 p-5 rounded-xl border border-primary/20 bg-primary/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-black text-primary">BUILD</span>
                  <span className="text-xs font-bold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded tabular-nums">65+</span>
                </div>
                <p className="text-xs text-muted-foreground">FL score 65 or higher and you can actually build it. Strong signal. Worth your Saturday morning.</p>
              </div>
              <div className="flex-1 p-5 rounded-xl border border-amber-500/20 bg-amber-500/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-black text-amber-600">VALIDATE</span>
                  <span className="text-xs font-bold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded tabular-nums">40-64</span>
                </div>
                <p className="text-xs text-muted-foreground">FL score 40 to 64. Promising but something's off. Talk to real people before you build.</p>
              </div>
              <div className="flex-1 p-5 rounded-xl border border-red-500/20 bg-red-500/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-black text-red-500">SKIP</span>
                  <span className="text-xs font-bold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded tabular-nums">{"<"}40</span>
                </div>
                <p className="text-xs text-muted-foreground">FL score below 40. The numbers say move on. There are more ideas in the lab.</p>
              </div>
            </div>
          </div>

          {/* Score Interpretation */}
          <div className="mb-24">
            <motion.h2
              {...fadeUp}
              transition={{ duration: 0.5 }}
              className="text-3xl md:text-4xl font-black tracking-tight mb-8 text-center"
            >
              Score Tiers
            </motion.h2>
            <motion.div {...fadeUp} transition={{ duration: 0.5, delay: 0.1 }} className="max-w-xl mx-auto">
              <div className="space-y-3">
                {scoreTiers.map((tier) => (
                  <div key={tier.range} className={`flex items-center justify-between p-3 rounded-xl border ${tier.border} ${tier.bg}`}>
                    <span className={`text-sm font-bold tabular-nums ${tier.color}`}>{tier.range}</span>
                    <span className={`text-sm font-bold ${tier.color}`}>{tier.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* ─── EXPERT PERSPECTIVES (Collapsible) ─── */}
          <div className="mb-24">
            <motion.div {...fadeUp}>
              <button
                onClick={() => setExpertOpen(!expertOpen)}
                className="w-full flex items-center justify-between p-5 rounded-xl border border-border bg-card transition-colors hover:bg-muted/30"
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-muted-foreground" />
                  <div className="text-left">
                    <h2 className="text-xl font-black tracking-tight">Want more depth?</h2>
                    <p className="text-sm text-muted-foreground">
                      {EXPERT_COUNT} expert perspectives (Hormozi, Dan Koe, Okamoto) add depth on the detail page. They do not affect the score or verdict.
                    </p>
                  </div>
                </div>
                {expertOpen ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground shrink-0 ml-4" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0 ml-4" />
                )}
              </button>
            </motion.div>

            <AnimatePresence>
              {expertOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="pt-8 space-y-4">
                    <p className="text-sm text-muted-foreground mb-8 max-w-2xl">
                      These frameworks were adapted from public teachings by each author. They add depth to the Fly Labs Method and help catch blind spots. The original authors are not affiliated with Fly Labs.
                    </p>
                    {expertFrameworks.map((fw) => (
                      <ExpertSection key={fw.id} framework={fw} />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ─── DYOR ─── */}
          <motion.div
            {...fadeUp}
            className="bg-muted/30 border border-border rounded-2xl p-6 md:p-8 mb-24 flex gap-4 items-start"
          >
            <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Do Your Own Research</p>
              <p className="text-muted-foreground leading-relaxed">
                AI scores are a starting point, not the finish line. They catch patterns and save you hours of research, but they can't talk to your potential users, understand your specific context, or feel the problem the way you can. Use the scores to narrow the field, then do the work only a human can do: talk to people, test assumptions, build a prototype. The best ideas still need a builder who cares enough to figure out the last mile.
              </p>
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div
            {...fadeUp}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <Link
              to="/ideas"
              className="btn-playful btn-playful-primary text-base h-12 px-6 md:text-lg md:h-14 md:px-8 inline-flex items-center gap-2"
            >
              Browse the Ideas Lab <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="text-muted-foreground font-bold mt-4">
              Every idea scored, validated, and given a verdict. Go find the signal.
            </p>
          </motion.div>

        </div>
      </div>
    </PageLayout>
  );
};

export default ScoringFrameworksPage;
