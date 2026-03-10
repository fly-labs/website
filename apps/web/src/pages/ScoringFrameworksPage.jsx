
import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Target, Lightbulb, BarChart3, Sparkles, MessageSquare,
  TrendingUp, User, Zap, DollarSign, Eye, Layers, Rocket, Shield, Clock, Users,
  Search, Megaphone, CircleDollarSign, HelpCircle, FlaskConical, Globe,
} from 'lucide-react';
import { PageLayout } from '@/components/PageLayout.jsx';
import { motion } from 'framer-motion';
import { fadeUp } from '@/lib/animations.js';

const flylabsDimensions = [
  {
    title: 'Problem Clarity',
    points: 30,
    icon: Eye,
    question: 'Is this problem real?',
    items: ['Existence & Awareness', 'Specificity', 'Severity'],
    color: 'border-indigo-500',
  },
  {
    title: 'Solution Gap',
    points: 25,
    icon: Search,
    question: 'Is there room for something new?',
    items: ['Alternative Quality', 'Addressable Complaints', 'Whitespace'],
    color: 'border-indigo-500',
  },
  {
    title: 'Willingness to Act',
    points: 25,
    icon: Zap,
    question: 'Would people actually act?',
    items: ['Switching Motivation', 'Payment Signals', 'Urgency'],
    color: 'border-indigo-500',
  },
  {
    title: 'Buildability',
    points: 20,
    icon: Rocket,
    question: 'Can I ship this?',
    items: ['Solo Feasibility', 'Speed to Market', 'Compound Value'],
    color: 'border-indigo-500',
  },
];

const hormoziPillars = [
  {
    title: 'Market Viability',
    points: 20,
    icon: Target,
    items: ['Massive Pain', 'Purchasing Power', 'Easy to Target'],
    color: 'border-primary',
  },
  {
    title: 'Value Equation',
    points: 25,
    icon: Lightbulb,
    items: ['Dream Outcome (0-7)', 'Perceived Likelihood (0-6)', 'Speed to First Result (0-6)', 'Low Effort/Sacrifice (0-6)'],
    color: 'border-secondary',
  },
  {
    title: 'Market Growth & Timing',
    points: 15,
    icon: TrendingUp,
    items: ['Market Trajectory', 'Timing Fit'],
    color: 'border-accent',
  },
  {
    title: 'Offer Differentiation',
    points: 20,
    icon: Shield,
    items: ['Competitive Moat', 'Offer Stacking', 'Pricing Power'],
    color: 'border-primary',
  },
  {
    title: 'Execution Feasibility',
    points: 20,
    icon: Rocket,
    items: ['Build Complexity', 'GTM Clarity', 'Resource Requirements'],
    color: 'border-secondary',
  },
];

const koeDimensions = [
  {
    title: 'Problem Clarity',
    points: 25,
    icon: Eye,
    desc: 'Specific, quantifiable, urgent',
    color: 'border-primary',
  },
  {
    title: 'Creator Fit',
    points: 20,
    icon: User,
    desc: 'Solo creator / small team buildable',
    color: 'border-secondary',
  },
  {
    title: 'Audience Reach',
    points: 15,
    icon: Users,
    desc: 'Identifiable, connected, reachable online',
    color: 'border-accent',
  },
  {
    title: 'Simplicity',
    points: 15,
    icon: Zap,
    desc: 'Quick adoption, hours not months',
    color: 'border-primary',
  },
  {
    title: 'Monetization',
    points: 15,
    icon: DollarSign,
    desc: 'Clear revenue path',
    color: 'border-secondary',
  },
  {
    title: 'Anti-Niche POV',
    points: 5,
    icon: Sparkles,
    desc: 'Unique angle, hard to replicate',
    color: 'border-accent',
  },
  {
    title: 'Leverage Potential',
    points: 5,
    icon: Layers,
    desc: 'Scales without founder bottleneck',
    color: 'border-primary',
  },
];

const okamotoPillars = [
  {
    title: 'Target Audience',
    points: 20,
    icon: Search,
    items: ['Specificity', 'Identifiability', 'Reachability'],
    color: 'border-accent',
  },
  {
    title: 'Value Proposition',
    points: 25,
    icon: Lightbulb,
    items: ['Clarity', 'Specificity', 'Measurability'],
    color: 'border-accent',
  },
  {
    title: 'Distribution Channel',
    points: 20,
    icon: Megaphone,
    items: ['Accessibility', 'Viral Coefficient', 'CAC Efficiency'],
    color: 'border-accent',
  },
  {
    title: 'Business Model',
    points: 15,
    icon: CircleDollarSign,
    items: ['Monetization Clarity', 'Willingness to Pay', 'Pricing Power'],
    color: 'border-accent',
  },
  {
    title: 'Assumption Risk',
    points: 10,
    icon: HelpCircle,
    items: ['Testability', 'Critical Assumptions'],
    color: 'border-accent',
  },
  {
    title: 'Validation Readiness',
    points: 10,
    icon: FlaskConical,
    items: ['Experiment Feasibility', 'Evidence Availability'],
    color: 'border-accent',
  },
];

const scoreTiers = [
  { range: '75-100', label: 'Exceptional', color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' },
  { range: '60-74', label: 'Strong', color: 'text-secondary', bg: 'bg-secondary/10', border: 'border-secondary/20' },
  { range: '45-59', label: 'Moderate', color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  { range: '30-44', label: 'Weak', color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
  { range: '0-29', label: 'Risky', color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' },
];

const cycleStages = [
  { label: 'Ideation', active: true },
  { label: 'Build', active: false },
  { label: 'Market', active: false },
  { label: 'Close', active: false },
  { label: 'Compound', active: false },
];

const ScoringFrameworksPage = () => {
  return (
    <PageLayout
      seo={{
        title: "Fly Labs Method + AI Scoring, Verdicts & Validation",
        description: "How the Idea Lab evaluates every idea. The Fly Labs Method (problem-solution fit for vibe builders) plus Hormozi, Dan Koe, and Okamoto frameworks. 7 sources, 4 frameworks, market validation, one verdict.",
        keywords: "Fly Labs Method, vibe building, problem-solution fit, ideation, idea scoring, Hormozi framework, Dan Koe, Bruno Okamoto, MicroSaaS, business evaluation, AI scoring, startup ideas, validation, competitive analysis",
        url: "https://flylabs.fun/scoring",
      }}
      className="pt-32 pb-24"
    >
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">

          {/* Back link */}
          <Link to="/ideas" className="inline-flex items-center text-muted-foreground hover:text-foreground font-bold mb-8 transition-colors bg-card px-4 py-2 rounded-xl border border-border shadow-sm">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Idea Lab
          </Link>

          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight mb-6">
              How We <span className="text-primary">Score Ideas</span>
            </h1>
            <p className="text-xl text-muted-foreground font-bold leading-relaxed max-w-2xl mx-auto">
              Every idea gets evaluated through the Fly Labs Method and 3 expert frameworks, then validated against real conversations. 7 sources, 4 frameworks, one verdict.
            </p>
          </motion.div>

          {/* Vibe Building Cycle */}
          <motion.div
            {...fadeUp}
            className="mb-16"
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
              The Idea Lab covers Stage 1 of the vibe building cycle: finding problems worth solving. The Fly Labs Method is how we separate signal from noise.
            </p>
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
                I built this system because the hardest part of building is knowing WHAT to build. The Fly Labs Method asks the 4 questions that matter: Is the problem real? Is there room for something new? Would people act? Can I ship this? The expert frameworks add depth. The market validation adds evidence. Together they give you everything you need to decide: build, validate, or move on.
              </p>
            </div>
          </motion.div>

          {/* Fly Labs Method Section */}
          <div className="mb-24">
            <motion.div {...fadeUp} transition={{ duration: 0.5 }} className="mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-500 font-bold text-sm border border-indigo-500/20 mb-4">
                <Lightbulb className="w-4 h-4" /> Our Method
              </div>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">Fly Labs Method</h2>
              <p className="text-lg text-muted-foreground font-medium mb-2">Problem-Solution Fit for Vibe Builders</p>
              <p className="text-muted-foreground leading-relaxed max-w-3xl">
                The 4 questions every vibe builder should ask before writing a line of code. Evaluates from the perspective of a solo builder with AI tools and limited time.
              </p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {flylabsDimensions.map((dim, i) => (
                <motion.div
                  key={dim.title}
                  {...fadeUp}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className={`card-playful p-5 bg-card border-l-4 ${dim.color}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <dim.icon className="w-5 h-5 text-foreground" />
                      <h3 className="font-bold text-sm">{dim.title}</h3>
                    </div>
                    <span className="text-xs font-bold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">{dim.points} pts</span>
                  </div>
                  <p className="text-sm font-medium text-indigo-500 mb-2">{dim.question}</p>
                  <ul className="space-y-1">
                    {dim.items.map((item) => (
                      <li key={item} className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/40 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Expert Perspectives Divider */}
          <div className="flex items-center gap-3 mb-12">
            <span className="text-sm font-bold text-muted-foreground/50 uppercase tracking-wider whitespace-nowrap">Expert Perspectives</span>
            <div className="flex-1 h-px bg-border" />
          </div>
          <p className="text-muted-foreground text-sm mb-16 max-w-xl">
            Three frameworks that add depth to the Fly Labs Method.
          </p>

          {/* Alex Hormozi Section */}
          <div className="mb-24">
            <motion.div {...fadeUp} transition={{ duration: 0.5 }} className="mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary font-bold text-sm border border-primary/20 mb-4">
                <Target className="w-4 h-4" /> Expert Perspective 1
              </div>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">Alex Hormozi</h2>
              <p className="text-muted-foreground leading-relaxed max-w-3xl">
                Built $100M+ in revenue and wrote the book on offer design. His Value Equation changed how entrepreneurs think about what makes people buy. We adapted it for solo builders evaluating ideas before writing code.
              </p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {hormoziPillars.map((pillar, i) => (
                <motion.div
                  key={pillar.title}
                  {...fadeUp}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className={`card-playful p-5 bg-card border-l-4 ${pillar.color}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <pillar.icon className="w-5 h-5 text-foreground" />
                      <h3 className="font-bold text-sm">{pillar.title}</h3>
                    </div>
                    <span className="text-xs font-bold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">{pillar.points} pts</span>
                  </div>
                  <ul className="space-y-1">
                    {pillar.items.map((item) => (
                      <li key={item} className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/40 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Dan Koe Section */}
          <div className="mb-24">
            <motion.div {...fadeUp} transition={{ duration: 0.5 }} className="mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 text-secondary font-bold text-sm border border-secondary/20 mb-4">
                <User className="w-4 h-4" /> Expert Perspective 2
              </div>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">Dan Koe</h2>
              <p className="text-muted-foreground leading-relaxed max-w-3xl">
                Built a $5M+ one-person business and 500K+ newsletter subscribers by proving you don't need a team or a niche to win. His framework evaluates whether a solo creator can actually ship and monetize an idea.
              </p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {koeDimensions.map((dim, i) => (
                <motion.div
                  key={dim.title}
                  {...fadeUp}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className={`card-playful p-5 bg-card border-l-4 ${dim.color}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <dim.icon className="w-5 h-5 text-foreground" />
                      <h3 className="font-bold text-sm">{dim.title}</h3>
                    </div>
                    <span className="text-xs font-bold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">{dim.points} pts</span>
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">{dim.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Bruno Okamoto Section */}
          <div className="mb-24">
            <motion.div {...fadeUp} transition={{ duration: 0.5 }} className="mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent font-bold text-sm border border-accent/20 mb-4">
                <FlaskConical className="w-4 h-4" /> Expert Perspective 3
              </div>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">Bruno Okamoto</h2>
              <p className="text-muted-foreground leading-relaxed max-w-3xl mb-4">
                Built 3 companies and Brazil's largest MicroSaaS community (20,000+ founders). His validation methodology helps founders kill bad ideas before wasting months building them. We use his framework to stress-test distribution and business model assumptions.
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                <a href="https://www.linkedin.com/in/brunomicrosaas" target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-muted-foreground hover:text-accent transition-colors">LinkedIn</a>
                <span className="text-muted-foreground/30">|</span>
                <a href="https://microsaas.substack.com" target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-muted-foreground hover:text-accent transition-colors">Substack</a>
                <span className="text-muted-foreground/30">|</span>
                <a href="https://microsaas.com.br" target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-muted-foreground hover:text-accent transition-colors">microsaas.com.br</a>
              </div>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {okamotoPillars.map((pillar, i) => (
                <motion.div
                  key={pillar.title}
                  {...fadeUp}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className={`card-playful p-5 bg-card border-l-4 ${pillar.color}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <pillar.icon className="w-5 h-5 text-foreground" />
                      <h3 className="font-bold text-sm">{pillar.title}</h3>
                    </div>
                    <span className="text-xs font-bold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">{pillar.points} pts</span>
                  </div>
                  <ul className="space-y-1">
                    {pillar.items.map((item) => (
                      <li key={item} className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/40 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>

          </div>

          {/* Validation Layer */}
          <div className="mb-24">
            <motion.div {...fadeUp} transition={{ duration: 0.5 }} className="mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-600 font-bold text-sm border border-yellow-500/20 mb-4">
                <Search className="w-4 h-4" /> Validation Layer
              </div>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">Idea Validation</h2>
              <p className="text-muted-foreground leading-relaxed max-w-3xl">
                Scores tell you what frameworks think. Validation tells you what the market says. We search real conversations on X and Reddit, extract frustration language, map competitors (who they are, what they charge, where they fall short), and synthesize everything with confidence scoring.
              </p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  icon: MessageSquare,
                  title: 'Cross-Platform Evidence Search',
                  desc: 'Search X and Reddit for real people experiencing this pain. Pull tweets with engagement, find Reddit threads with upvotes and comments, capture frustration language from actual users.',
                },
                {
                  icon: Globe,
                  title: 'Competitive Intelligence',
                  desc: 'Search X and Reddit for discussions about existing solutions. Map complaints, pricing sentiment, feature gaps from real user conversations across both platforms.',
                },
                {
                  icon: TrendingUp,
                  title: 'Opportunity Synthesis',
                  desc: 'AI synthesizes evidence from X and Reddit with confidence scoring (high/medium/low based on evidence volume), recurring themes, unmet needs, and a final verdict that cross-references framework scores with market evidence.',
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

          {/* Synthesis Verdict */}
          <div className="mb-24">
            <motion.div {...fadeUp} transition={{ duration: 0.5 }} className="mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-foreground/10 text-foreground font-bold text-sm border border-foreground/20 mb-4">
                <BarChart3 className="w-4 h-4" /> Final Verdict
              </div>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">Synthesis</h2>
              <p className="text-muted-foreground leading-relaxed max-w-3xl">
                Four frameworks, one verdict. The composite score blends all four (40% Fly Labs + 20% each expert). Each pillar includes reasoning explaining the score. When market validation exists, real evidence gets the final say.
              </p>
            </motion.div>
            <div className="flex flex-col sm:flex-row gap-3 max-w-3xl mx-auto">
              <div className="flex-1 p-5 rounded-xl border border-primary/20 bg-primary/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-black text-primary">BUILD</span>
                  <span className="text-xs font-bold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded tabular-nums">70+</span>
                </div>
                <p className="text-xs text-muted-foreground">Composite {">="} 70, Fly Labs {">="} 60, no framework below 30. Strong signal across all lenses. This is worth building.</p>
              </div>
              <div className="flex-1 p-5 rounded-xl border border-amber-500/20 bg-amber-500/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-black text-amber-600">VALIDATE FIRST</span>
                  <span className="text-xs font-bold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded tabular-nums">45-69</span>
                </div>
                <p className="text-xs text-muted-foreground">Composite 45-69, or gaps in any single framework. Promising but has gaps. Validate before investing time.</p>
              </div>
              <div className="flex-1 p-5 rounded-xl border border-red-500/20 bg-red-500/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-black text-red-500">SKIP</span>
                  <span className="text-xs font-bold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded tabular-nums">{"<"}45</span>
                </div>
                <p className="text-xs text-muted-foreground">Composite below 45. Not viable for a solo builder right now. Move on to the next idea.</p>
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
              Score Interpretation
            </motion.h2>
            <motion.div {...fadeUp} transition={{ duration: 0.5, delay: 0.1 }} className="max-w-xl mx-auto">
              <div className="space-y-3">
                {scoreTiers.map((tier) => (
                  <div key={tier.range} className={`flex items-center justify-between p-3 rounded-xl border ${tier.border} ${tier.bg}`}>
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-bold tabular-nums ${tier.color}`}>{tier.range}</span>
                    </div>
                    <span className={`text-sm font-bold ${tier.color}`}>{tier.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* How AI Scores */}
          <motion.div
            {...fadeUp}
            transition={{ duration: 0.5 }}
            className="card-playful p-6 md:p-10 bg-card mb-24 text-center"
          >
            <BarChart3 className="w-8 h-8 text-primary mx-auto mb-4" />
            <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-4">How AI Scores</h2>
            <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              7 sources. 4 frameworks. Real validation. Every idea gets scored by Claude AI through the Fly Labs Method and three expert perspectives, each with per-pillar reasoning. The scores synthesize into a BUILD / VALIDATE / SKIP verdict. Top ideas get validated against real conversations on X and Reddit with competitive intelligence and evidence confidence. Updated daily.
            </p>
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
              Browse the lab <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="text-muted-foreground font-bold mt-4">
              Every idea scored, reasoned, and given a verdict. Go find the signal.
            </p>
          </motion.div>

        </div>
      </div>
    </PageLayout>
  );
};

export default ScoringFrameworksPage;
