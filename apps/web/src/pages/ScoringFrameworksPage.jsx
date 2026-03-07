
import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Target, Lightbulb, BarChart3, Sparkles, MessageSquare,
  TrendingUp, User, Zap, DollarSign, Eye, Layers, Rocket, Shield, Clock, Users,
  Search, Megaphone, CircleDollarSign, HelpCircle, FlaskConical,
} from 'lucide-react';
import { PageLayout } from '@/components/PageLayout.jsx';
import { motion } from 'framer-motion';
import { fadeUp } from '@/lib/animations.js';

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
    items: ['Dream Outcome', 'Likelihood', 'Speed', 'Low Effort'],
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

const ScoringFrameworksPage = () => {
  return (
    <PageLayout
      seo={{
        title: "AI Scoring Frameworks - Hormozi, Dan Koe & Okamoto Methods",
        description: "How we score every idea with AI. Three frameworks: Hormozi's $100M evaluation, Dan Koe's one-person business lens, and Bruno Okamoto's MicroSaaS validation methodology.",
        keywords: "idea scoring, Hormozi framework, Dan Koe, Bruno Okamoto, MicroSaaS, business evaluation, AI scoring, startup ideas, validation",
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
            className="text-center mb-16"
          >
            <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight mb-6">
              How We <span className="text-primary">Score Ideas</span>
            </h1>
            <p className="text-xl text-muted-foreground font-bold leading-relaxed max-w-2xl mx-auto">
              Every idea on the board gets AI-scored using three complementary business frameworks.
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
                I picked these three frameworks because they answer different questions. Hormozi asks "Is this a $100M business?" Koe asks "Can one person build this?" Okamoto asks "Can you validate this before building?" Together they filter signal from noise.
              </p>
            </div>
          </motion.div>

          {/* Alex Hormozi Section */}
          <div className="mb-24">
            <motion.div {...fadeUp} transition={{ duration: 0.5 }} className="mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary font-bold text-sm border border-primary/20 mb-4">
                <Target className="w-4 h-4" /> Framework 1
              </div>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">Alex Hormozi</h2>
              <p className="text-muted-foreground leading-relaxed max-w-3xl">
                Entrepreneur, author of $100M Offers and $100M Leads. Co-founder of Acquisition.com. Has scaled 10+ companies to $10M+. His value equation framework revolutionized how entrepreneurs think about offer design.
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
                <User className="w-4 h-4" /> Framework 2
              </div>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">Dan Koe</h2>
              <p className="text-muted-foreground leading-relaxed max-w-3xl">
                Creator, writer, and entrepreneur behind The Human Colosseum newsletter (500K+ subscribers). Built a $5M+ one-person business. Author of "The Art of Focus." Popularized the anti-niche approach and one-person business model.
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
                <FlaskConical className="w-4 h-4" /> Framework 3
              </div>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">Bruno Okamoto</h2>
              <p className="text-muted-foreground leading-relaxed max-w-3xl mb-4">
                3x Founder, TEDx Speaker, Creator & Investor in Micro-SaaS. Creator of Comunidade MicroSaaS, Brazil's largest MicroSaaS community with 20,000+ founders. His 4 Pillars of a Scalable MVP and Validation Copilot methodology help founders validate ideas before writing a single line of code.
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

            {/* Decision Governance */}
            <motion.div {...fadeUp} transition={{ duration: 0.5, delay: 0.3 }} className="mt-8">
              <h3 className="font-bold text-sm mb-4 text-center">Decision Governance</h3>
              <div className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
                <div className="flex-1 flex items-center gap-3 p-3 rounded-xl border border-primary/20 bg-primary/10">
                  <span className="text-sm font-bold text-primary tabular-nums">70-100</span>
                  <span className="text-sm font-bold text-primary">FOLLOW</span>
                  <span className="text-xs text-muted-foreground ml-auto">Proceed to build</span>
                </div>
                <div className="flex-1 flex items-center gap-3 p-3 rounded-xl border border-amber-500/20 bg-amber-500/10">
                  <span className="text-sm font-bold text-amber-500 tabular-nums">40-69</span>
                  <span className="text-sm font-bold text-amber-500">ADJUST</span>
                  <span className="text-xs text-muted-foreground ml-auto">Pivot some assumptions</span>
                </div>
                <div className="flex-1 flex items-center gap-3 p-3 rounded-xl border border-red-500/20 bg-red-500/10">
                  <span className="text-sm font-bold text-red-500 tabular-nums">0-39</span>
                  <span className="text-sm font-bold text-red-500">PIVOT</span>
                  <span className="text-xs text-muted-foreground ml-auto">Rethink fundamentals</span>
                </div>
              </div>
            </motion.div>
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
              Claude AI analyzes problem description, industry context, and market signals independently through all three frameworks. Scores update daily as new ideas come in.
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
              Explore the Idea Lab <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="text-muted-foreground font-bold mt-4">
              Every idea scored. Every framework explained. Go find the signal.
            </p>
          </motion.div>

        </div>
      </div>
    </PageLayout>
  );
};

export default ScoringFrameworksPage;
