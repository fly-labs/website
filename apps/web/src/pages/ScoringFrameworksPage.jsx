
import React, { useState, useEffect } from 'react';
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
import { trackScrollDepth } from '@/lib/analytics.js';
import { useChatContext } from '@/contexts/ChatContext.jsx';
import { EXPERT_COUNT, QUESTION_COUNT } from '@/lib/data/siteStats.js';
import { SOURCE_COUNT } from '@/lib/data/ideas.js';
import { useTranslation } from 'react-i18next';

const ExpertSection = ({ framework, t }) => {
  const colorMap = {
    primary: { tag: 'bg-primary/10 text-primary border-primary/20', link: 'hover:text-primary' },
    secondary: { tag: 'bg-secondary/10 text-secondary border-secondary/20', link: 'hover:text-secondary' },
    accent: { tag: 'bg-accent/10 text-accent border-accent/20', link: 'hover:text-accent' },
    orange: { tag: 'bg-orange-500/10 text-orange-500 border-orange-500/20', link: 'hover:text-orange-500' },
  };
  const colors = colorMap[framework.color];

  return (
    <div className="mb-10">
      <div className="mb-4">
        <div className="flex items-center gap-3 mb-2">
          <h3 className="text-xl font-black tracking-tight">{framework.name}</h3>
          <span className="text-[10px] font-bold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">{t('experts.weight', { weight: framework.weight })}</span>
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
  const { t } = useTranslation('scoring');
  const [expertOpen, setExpertOpen] = useState(false);
  const { setPageDetail } = useChatContext();

  useEffect(() => trackScrollDepth('scoring'), []);
  useEffect(() => { setPageDetail({ viewing: 'scoring_frameworks' }); }, [setPageDetail]);

  const flylabsQuestions = [
    {
      question: t('questions.q1'),
      label: t('questions.q1Label'),
      points: 30,
      icon: Eye,
      what: t('questions.q1What'),
      signals: [t('questions.q1Signal1'), t('questions.q1Signal2'), t('questions.q1Signal3')],
    },
    {
      question: t('questions.q2'),
      label: t('questions.q2Label'),
      points: 25,
      icon: Search,
      what: t('questions.q2What'),
      signals: [t('questions.q2Signal1'), t('questions.q2Signal2'), t('questions.q2Signal3'), t('questions.q2Signal4')],
    },
    {
      question: t('questions.q3'),
      label: t('questions.q3Label'),
      points: 25,
      icon: Zap,
      what: t('questions.q3What'),
      signals: [t('questions.q3Signal1'), t('questions.q3Signal2'), t('questions.q3Signal3')],
    },
    {
      question: t('questions.q4'),
      label: t('questions.q4Label'),
      points: 20,
      icon: Rocket,
      what: t('questions.q4What'),
      signals: [t('questions.q4Signal1'), t('questions.q4Signal2'), t('questions.q4Signal3')],
    },
  ];

  const hormoziPillars = [
    { title: t('experts.hormoziPillar1'), points: 20, icon: Target, items: [t('experts.hormoziPillar1Item1'), t('experts.hormoziPillar1Item2'), t('experts.hormoziPillar1Item3')], color: 'border-primary' },
    { title: t('experts.hormoziPillar2'), points: 25, icon: Lightbulb, items: [t('experts.hormoziPillar2Item1'), t('experts.hormoziPillar2Item2'), t('experts.hormoziPillar2Item3'), t('experts.hormoziPillar2Item4')], color: 'border-secondary' },
    { title: t('experts.hormoziPillar3'), points: 15, icon: TrendingUp, items: [t('experts.hormoziPillar3Item1'), t('experts.hormoziPillar3Item2')], color: 'border-accent' },
    { title: t('experts.hormoziPillar4'), points: 20, icon: Shield, items: [t('experts.hormoziPillar4Item1'), t('experts.hormoziPillar4Item2'), t('experts.hormoziPillar4Item3')], color: 'border-primary' },
    { title: t('experts.hormoziPillar5'), points: 20, icon: Rocket, items: [t('experts.hormoziPillar5Item1'), t('experts.hormoziPillar5Item2'), t('experts.hormoziPillar5Item3')], color: 'border-secondary' },
  ];

  const koeDimensions = [
    { title: t('experts.koePillar1'), points: 25, icon: Eye, desc: t('experts.koePillar1Desc'), color: 'border-primary' },
    { title: t('experts.koePillar2'), points: 20, icon: User, desc: t('experts.koePillar2Desc'), color: 'border-secondary' },
    { title: t('experts.koePillar3'), points: 15, icon: Users, desc: t('experts.koePillar3Desc'), color: 'border-accent' },
    { title: t('experts.koePillar4'), points: 15, icon: Zap, desc: t('experts.koePillar4Desc'), color: 'border-primary' },
    { title: t('experts.koePillar5'), points: 15, icon: DollarSign, desc: t('experts.koePillar5Desc'), color: 'border-secondary' },
    { title: t('experts.koePillar6'), points: 5, icon: Sparkles, desc: t('experts.koePillar6Desc'), color: 'border-accent' },
    { title: t('experts.koePillar7'), points: 5, icon: Layers, desc: t('experts.koePillar7Desc'), color: 'border-primary' },
  ];

  const okamotoPillars = [
    { title: t('experts.okamotoPillar1'), points: 20, icon: Search, items: [t('experts.okamotoPillar1Item1'), t('experts.okamotoPillar1Item2'), t('experts.okamotoPillar1Item3')], color: 'border-accent' },
    { title: t('experts.okamotoPillar2'), points: 25, icon: Lightbulb, items: [t('experts.okamotoPillar2Item1'), t('experts.okamotoPillar2Item2'), t('experts.okamotoPillar2Item3')], color: 'border-accent' },
    { title: t('experts.okamotoPillar3'), points: 20, icon: Megaphone, items: [t('experts.okamotoPillar3Item1'), t('experts.okamotoPillar3Item2'), t('experts.okamotoPillar3Item3')], color: 'border-accent' },
    { title: t('experts.okamotoPillar4'), points: 15, icon: CircleDollarSign, items: [t('experts.okamotoPillar4Item1'), t('experts.okamotoPillar4Item2'), t('experts.okamotoPillar4Item3')], color: 'border-accent' },
    { title: t('experts.okamotoPillar5'), points: 10, icon: HelpCircle, items: [t('experts.okamotoPillar5Item1'), t('experts.okamotoPillar5Item2')], color: 'border-accent' },
    { title: t('experts.okamotoPillar6'), points: 10, icon: FlaskConical, items: [t('experts.okamotoPillar6Item1'), t('experts.okamotoPillar6Item2')], color: 'border-accent' },
  ];

  const ycQuestions = [
    { title: t('experts.ycPillar1'), points: 15, icon: Eye, desc: t('experts.ycPillar1Desc'), color: 'border-orange-500' },
    { title: t('experts.ycPillar2'), points: 15, icon: Search, desc: t('experts.ycPillar2Desc'), color: 'border-orange-500' },
    { title: t('experts.ycPillar3'), points: 15, icon: User, desc: t('experts.ycPillar3Desc'), color: 'border-orange-500' },
    { title: t('experts.ycPillar4'), points: 15, icon: Zap, desc: t('experts.ycPillar4Desc'), color: 'border-orange-500' },
    { title: t('experts.ycPillar5'), points: 15, icon: Sparkles, desc: t('experts.ycPillar5Desc'), color: 'border-orange-500' },
    { title: t('experts.ycPillar6'), points: 15, icon: TrendingUp, desc: t('experts.ycPillar6Desc'), color: 'border-orange-500' },
  ];

  const expertFrameworks = [
    {
      id: 'hormozi',
      name: t('experts.hormozi'),
      weight: '20%',
      tagline: t('experts.hormoziTagline'),
      disclaimer: t('experts.hormoziDisclaimer'),
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
      name: t('experts.koe'),
      weight: '20%',
      tagline: t('experts.koeTagline'),
      disclaimer: t('experts.koeDisclaimer'),
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
      name: t('experts.okamoto'),
      weight: '20%',
      tagline: t('experts.okamotoTagline'),
      disclaimer: t('experts.okamotoDisclaimer'),
      pillars: okamotoPillars,
      color: 'accent',
      links: [
        { label: 'LinkedIn', url: 'https://www.linkedin.com/in/brunomicrosaas' },
        { label: 'Substack', url: 'https://microsaas.substack.com' },
        { label: 'microsaas.com.br', url: 'https://microsaas.com.br' },
      ],
    },
    {
      id: 'yc',
      name: t('experts.yc'),
      weight: '20%',
      tagline: t('experts.ycTagline'),
      disclaimer: t('experts.ycDisclaimer'),
      pillars: ycQuestions,
      color: 'orange',
      links: [
        { label: 'ycombinator.com', url: 'https://www.ycombinator.com' },
        { label: 'YouTube', url: 'https://www.youtube.com/@ycombinator' },
        { label: 'Garry Tan', url: 'https://x.com/garrytan' },
      ],
      isDimension: true,
    },
  ];

  const pipelineSteps = [
    {
      label: t('steps.find'),
      detail: t('steps.findDesc', { sourceCount: SOURCE_COUNT }),
      icon: Database,
      color: 'text-secondary',
      bg: 'bg-secondary/10',
      border: 'border-secondary/20',
    },
    {
      label: t('steps.researchAndScore'),
      detail: t('steps.researchAndScoreDesc', { questionCount: QUESTION_COUNT }),
      icon: BarChart3,
      color: 'text-indigo-500',
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/20',
    },
    {
      label: t('steps.verdict'),
      detail: t('steps.verdictDesc'),
      icon: CheckCircle2,
      color: 'text-primary',
      bg: 'bg-primary/10',
      border: 'border-primary/20',
    },
  ];

  const cycleStages = [
    { label: t('cycle.ideation'), active: true },
    { label: t('cycle.build'), active: false },
    { label: t('cycle.market'), active: false },
    { label: t('cycle.close'), active: false },
    { label: t('cycle.compound'), active: false },
  ];

  const scoreTiers = [
    { range: '75-100', label: t('scoreTiers.exceptional'), color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' },
    { range: '60-74', label: t('scoreTiers.strong'), color: 'text-secondary', bg: 'bg-secondary/10', border: 'border-secondary/20' },
    { range: '45-59', label: t('scoreTiers.moderate'), color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    { range: '30-44', label: t('scoreTiers.weak'), color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
    { range: '0-29', label: t('scoreTiers.risky'), color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  ];

  const validationPhases = [
    {
      icon: MessageSquare,
      title: t('validationSection.evidenceTitle'),
      desc: t('validationSection.evidenceDesc'),
    },
    {
      icon: Search,
      title: t('validationSection.competitiveTitle'),
      desc: t('validationSection.competitiveDesc'),
    },
    {
      icon: TrendingUp,
      title: t('validationSection.confidenceTitle'),
      desc: t('validationSection.confidenceDesc'),
    },
  ];

  return (
    <PageLayout
      seo={{
        title: t('seo.title'),
        description: t('seo.description', { sourceCount: SOURCE_COUNT, questionCount: QUESTION_COUNT }),
        keywords: "Fly Labs Method, vibe building, idea scoring, AI validation, Hormozi, Dan Koe, Bruno Okamoto, YC Lens, Y Combinator, startup ideas, problem-solution fit",
        url: "https://flylabs.fun/scoring",
        schema: [
          {
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": "How We Score Ideas: Fly Labs Method + AI Validation",
            "description": `The Ideas Lab finds real problems from ${SOURCE_COUNT} sources, asks ${QUESTION_COUNT} questions, validates against X and Reddit, and gives a verdict.`,
            "url": "https://flylabs.fun/scoring",
            "author": { "@type": "Person", "name": "Luiz Alves" },
            "publisher": { "@type": "Organization", "name": "Fly Labs", "url": "https://flylabs.fun" }
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "How does idea scoring work?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Every idea gets scored by asking 4 questions across the Fly Labs Method, Hormozi, Dan Koe, and Okamoto frameworks. The FL score is the primary score. Ideas scoring 65+ with buildable characteristics get a BUILD verdict."
                }
              },
              {
                "@type": "Question",
                "name": "What is a BUILD verdict?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "BUILD means the idea scored 65+ on the FL score and shows strong buildable characteristics. VALIDATE_FIRST means the score is between 40-64 and needs more validation. SKIP means the score is below 40."
                }
              },
              {
                "@type": "Question",
                "name": "Is the scoring free?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes, all scoring is free and automated. Ideas are scored by AI across multiple frameworks, validated against X and Reddit, and given a verdict."
                }
              }
            ]
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://flylabs.fun/" },
              { "@type": "ListItem", "position": 2, "name": "Ideas Lab", "item": "https://flylabs.fun/ideas" },
              { "@type": "ListItem", "position": 3, "name": "How We Score" },
            ],
          },
        ],
      }}
      className="pt-32 pb-24"
    >
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">

          {/* Back link */}
          <Link to="/ideas" className="inline-flex items-center text-muted-foreground hover:text-foreground font-bold mb-8 transition-colors bg-card px-4 py-2 rounded-xl border border-border shadow-sm">
            <ArrowLeft className="w-4 h-4 mr-2" /> {t('nav.backToIdeas')}
          </Link>

          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <span className="inline-block text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-accent/10 text-accent border border-accent/20 mb-4">
              {t('hero.badge')}
            </span>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight mb-6">
              {t('hero.headline1')}<br />
              {t('hero.headline2', { count: QUESTION_COUNT }).split(/<1>|<\/1>/).map((part, i) =>
                i === 1 ? <span key={i} className="text-primary">{part}</span> : <React.Fragment key={i}>{part}</React.Fragment>
              )}<br />
              {t('hero.headline3')}
            </h1>
            <p className="text-lg text-muted-foreground font-medium leading-relaxed max-w-2xl mx-auto">
              {t('hero.description', { sourceCount: SOURCE_COUNT })}
            </p>
          </motion.div>

          {/* Pipeline: Find -> Score -> Validate -> Verdict */}
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
                    {!stage.active && <span className="text-[10px] ml-1 opacity-60">{t('cycle.soon')}</span>}
                  </div>
                </React.Fragment>
              ))}
            </div>
            <p className="text-center text-sm text-muted-foreground max-w-xl mx-auto">
              {t('cycle.description')}
            </p>
          </motion.div>

          {/* THE FLY LABS METHOD */}
          <div className="mb-24">
            <motion.div {...fadeUp} transition={{ duration: 0.5 }} className="mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-500 font-bold text-sm border border-indigo-500/20 mb-4">
                <Lightbulb className="w-4 h-4" /> {t('method.badge')}
              </div>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">
                {t('method.title', { count: QUESTION_COUNT })}
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl">
                {t('method.description', { count: QUESTION_COUNT })}
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
                <p className="text-sm font-bold text-primary uppercase tracking-wider mb-2">{t('buildersNote.label')}</p>
                <p className="text-muted-foreground leading-relaxed">
                  {t('buildersNote.text', { count: QUESTION_COUNT })}
                </p>
              </div>
            </motion.div>
          </div>

          {/* VALIDATION */}
          <div className="mb-24">
            <motion.div {...fadeUp} transition={{ duration: 0.5 }} className="mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-600 font-bold text-sm border border-yellow-500/20 mb-4">
                <Globe className="w-4 h-4" /> {t('validationSection.badge')}
              </div>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">{t('validationSection.title')}</h2>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl">
                {t('validationSection.description')}
              </p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {validationPhases.map((phase, i) => (
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

          {/* VERDICT */}
          <div className="mb-24">
            <motion.div {...fadeUp} transition={{ duration: 0.5 }} className="mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-foreground/10 text-foreground font-bold text-sm border border-foreground/20 mb-4">
                <CheckCircle2 className="w-4 h-4" /> {t('verdicts.badge')}
              </div>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">{t('verdicts.title')}</h2>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl">
                {t('verdicts.description', { questionCount: QUESTION_COUNT, expertCount: EXPERT_COUNT })}
              </p>
            </motion.div>
            <div className="flex flex-col sm:flex-row gap-3 max-w-3xl mx-auto">
              <div className="flex-1 p-5 rounded-xl border border-primary/20 bg-primary/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-black text-primary">{t('verdicts.build')}</span>
                  <span className="text-xs font-bold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded tabular-nums">65+</span>
                </div>
                <p className="text-xs text-muted-foreground">{t('verdicts.buildDesc')}</p>
              </div>
              <div className="flex-1 p-5 rounded-xl border border-amber-500/20 bg-amber-500/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-black text-amber-600">{t('verdicts.validate')}</span>
                  <span className="text-xs font-bold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded tabular-nums">40-64</span>
                </div>
                <p className="text-xs text-muted-foreground">{t('verdicts.validateDesc')}</p>
              </div>
              <div className="flex-1 p-5 rounded-xl border border-red-500/20 bg-red-500/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-black text-red-500">{t('verdicts.skip')}</span>
                  <span className="text-xs font-bold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded tabular-nums">{"<"}40</span>
                </div>
                <p className="text-xs text-muted-foreground">{t('verdicts.skipDesc')}</p>
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
              {t('scoreTiers.title')}
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

          {/* EXPERT PERSPECTIVES (Collapsible) */}
          <div className="mb-24">
            <motion.div {...fadeUp}>
              <button
                onClick={() => setExpertOpen(!expertOpen)}
                className="w-full flex items-center justify-between p-5 rounded-xl border border-border bg-card transition-colors hover:bg-muted/30"
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-muted-foreground" />
                  <div className="text-left">
                    <h2 className="text-xl font-black tracking-tight">{t('experts.title')}</h2>
                    <p className="text-sm text-muted-foreground">
                      {t('experts.description', { count: EXPERT_COUNT })}
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
                      {t('experts.disclaimer')}
                    </p>
                    {expertFrameworks.map((fw) => (
                      <ExpertSection key={fw.id} framework={fw} t={t} />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* DYOR */}
          <motion.div
            {...fadeUp}
            className="bg-muted/30 border border-border rounded-2xl p-6 md:p-8 mb-24 flex gap-4 items-start"
          >
            <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">{t('dyor.title')}</p>
              <p className="text-muted-foreground leading-relaxed">
                {t('dyor.text')}
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
              {t('cta.browseIdeas')} <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="text-muted-foreground font-bold mt-4">
              {t('cta.subtitle')}
            </p>
          </motion.div>

        </div>
      </div>
    </PageLayout>
  );
};

export default ScoringFrameworksPage;
