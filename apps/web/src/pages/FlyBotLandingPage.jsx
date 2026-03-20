import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Bot, ArrowRight, Target, Sparkles, MessageSquare,
  Zap, ShieldCheck, Github, Database, BookOpen, Search,
  BarChart3, Layers, AlertTriangle,
} from 'lucide-react';
import { PageLayout } from '@/components/PageLayout.jsx';
import { motion } from 'framer-motion';
import { fadeUp, staggerContainer, staggerItem } from '@/lib/animations.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { trackEvent, trackScrollDepth } from '@/lib/analytics.js';
import { SOURCE_COUNT, QUESTION_COUNT, PROMPT_COUNT } from '@/lib/data/siteStats.js';
import { ScoreBar, getScoreTier, verdictStyles, FRAMEWORK_CONFIG } from '@/components/ideas/ScoreUtils.jsx';
import supabase from '@/lib/supabaseClient.js';

const exampleEval = {
  idea_title: 'Meal prep subscription tracker for busy professionals',
  flylabs_score: 62,
  hormozi_score: 58,
  koe_score: 55,
  okamoto_score: 64,
  yc_score: 57,
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

const ExampleScoreCard = ({ scores, vs, tier, footerText }) => (
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
    <p className="text-[10px] text-muted-foreground/40 mt-3 text-center">{footerText}</p>
  </div>
);

const FlyBotLandingPage = () => {
  const { t } = useTranslation('flybot');
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [ideaCount, setIdeaCount] = useState(null);

  useEffect(() => trackScrollDepth('flybot_landing'), []);

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
    navigate(isAuthenticated ? '/flybot/chat' : '/login?redirect=%2Fflybot%2Fchat');
  };

  const vs = verdictStyles[exampleEval.verdict];
  const tier = getScoreTier(exampleEval.flylabs_score);
  const scores = [
    { key: 'flylabs', score: exampleEval.flylabs_score, config: FRAMEWORK_CONFIG[0] },
    { key: 'hormozi', score: exampleEval.hormozi_score, config: FRAMEWORK_CONFIG[1] },
    { key: 'koe', score: exampleEval.koe_score, config: FRAMEWORK_CONFIG[2] },
    { key: 'okamoto', score: exampleEval.okamoto_score, config: FRAMEWORK_CONFIG[3] },
    { key: 'yc', score: exampleEval.yc_score, config: FRAMEWORK_CONFIG[4] },
  ];

  return (
    <PageLayout
      seo={{
        title: t('seo.title'),
        description: t('seo.description', { questionCount: QUESTION_COUNT, promptCount: PROMPT_COUNT }),
        keywords: "AI idea scoring, business idea evaluator, FlyBot, idea validation AI, vibe building, content strategy AI, solo builder tools",
        url: "https://flylabs.fun/flybot",
        schema: {
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "FlyBot",
          "applicationCategory": "BusinessApplication",
          "operatingSystem": "Web",
          "url": "https://flylabs.fun/flybot",
          "description": `AI partner for solo builders. Scores ideas, writes content, catches blind spots. Loaded with hundreds of scored problems and ${PROMPT_COUNT} prompts.`,
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
                  {t('landing.badge')}
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-foreground leading-[1.05] mb-5">
                {t('landing.headline')}
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground font-medium leading-relaxed mb-4 max-w-lg">
                {t('landing.description1', { ideaCount: ideaCount ? `${ideaCount}` : '', promptCount: PROMPT_COUNT, sourceCount: SOURCE_COUNT })}
              </p>
              <p className="text-base text-muted-foreground/70 font-medium leading-relaxed mb-8 max-w-lg">
                {t('landing.description2')}
              </p>

              <div className="flex flex-col sm:flex-row items-start gap-3">
                <button
                  onClick={handleCTA}
                  className="inline-flex items-center justify-center w-full sm:w-auto px-8 py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-lg hover:brightness-110 transition-[filter,transform] duration-150 active:translate-y-0.5"
                >
                  {t('landing.tryCta')} <ArrowRight className="w-5 h-5 ml-2" />
                </button>
                <Link
                  to="/scoring"
                  className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors py-2"
                >
                  {t('landing.scoringLink')} <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </div>

            <div className="hidden lg:block">
              <ExampleScoreCard scores={scores} vs={vs} tier={tier} footerText={t('landing.exampleFooter')} />
            </div>
          </div>
        </motion.div>
      </section>

      {/* ===== THE PROBLEM (storytelling, not jargon) ===== */}
      <section className="py-10 md:py-14 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div {...fadeUp} transition={{ duration: 0.5 }} className="space-y-5">
            <p className="text-lg md:text-xl text-muted-foreground font-medium leading-relaxed">
              {t('landing.problem1')}
            </p>
            <p className="text-lg md:text-xl text-muted-foreground font-medium leading-relaxed">
              {t('landing.problem2')}
            </p>
            <p className="text-lg md:text-xl text-muted-foreground font-medium leading-relaxed">
              {t('landing.problem3')}
            </p>
            <p className="text-xl md:text-2xl text-foreground font-bold">
              {t('landing.problemHighlight')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* ===== WHAT'S LOADED (the data, not the methodology) ===== */}
      <section className="py-10 md:py-14 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div {...fadeUp} transition={{ duration: 0.5 }} className="mb-10">
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-foreground mb-3">
              {t('landing.insideTitle')}
            </h2>
            <p className="text-muted-foreground font-medium max-w-2xl">
              {t('landing.insideSubtitle', { sourceCount: SOURCE_COUNT })}
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            {...staggerContainer}
          >
            {[
              {
                icon: Database,
                title: t('landing.cap1Title', { count: ideaCount || '' }),
                desc: t('landing.cap1Desc'),
                color: 'text-primary',
                bgColor: 'bg-primary/10',
              },
              {
                icon: Layers,
                title: t('landing.cap2Title', { count: QUESTION_COUNT }),
                desc: t('landing.cap2Desc'),
                color: 'text-secondary',
                bgColor: 'bg-secondary/10',
              },
              {
                icon: Sparkles,
                title: t('landing.cap3Title', { count: PROMPT_COUNT }),
                desc: t('landing.cap3Desc'),
                color: 'text-accent',
                bgColor: 'bg-accent/10',
              },
              {
                icon: AlertTriangle,
                title: t('landing.cap4Title'),
                desc: t('landing.cap4Desc'),
                color: 'text-amber-500',
                bgColor: 'bg-amber-500/10',
              },
              {
                icon: BookOpen,
                title: t('landing.cap5Title'),
                desc: t('landing.cap5Desc'),
                color: 'text-purple-500',
                bgColor: 'bg-purple-500/10',
              },
              {
                icon: Search,
                title: t('landing.cap6Title'),
                desc: t('landing.cap6Desc'),
                color: 'text-blue-500',
                bgColor: 'bg-blue-500/10',
              },
              {
                icon: BarChart3,
                title: t('landing.cap7Title'),
                desc: t('landing.cap7Desc'),
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
              {t('landing.convoTitle')}
            </h2>
          </motion.div>

          <motion.div className="space-y-4" {...staggerContainer}>
            {[
              {
                label: t('landing.convo1Q'),
                response: t('landing.convo1A'),
                icon: Target,
                color: 'text-primary',
              },
              {
                label: t('landing.convo2Q'),
                response: t('landing.convo2A'),
                icon: Sparkles,
                color: 'text-secondary',
              },
              {
                label: t('landing.convo3Q'),
                response: t('landing.convo3A'),
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
                {t('landing.exampleLabel')}
              </p>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight text-foreground mb-4">
                {t('landing.exampleTitle')}
              </h2>
              <p className="text-muted-foreground font-medium leading-relaxed mb-4">
                {t('landing.exampleDesc1')}
              </p>
              <p className="text-sm text-muted-foreground/70 leading-relaxed">
                {t('landing.exampleDesc2')}
              </p>
            </motion.div>

            <motion.div {...fadeUp} transition={{ duration: 0.5, delay: 0.1 }}>
              <ExampleScoreCard scores={scores} vs={vs} tier={tier} footerText={t('landing.exampleFooter')} />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== LIVE NUMBERS ===== */}
      <section className="py-10 md:py-14 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div {...fadeUp} transition={{ duration: 0.5 }} className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-foreground mb-3">
              {t('landing.statsTitle')}
            </h2>
            <p className="text-muted-foreground font-medium max-w-xl mx-auto">
              {t('landing.statsSubtitle')}
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-2 sm:grid-cols-4 gap-4"
            {...staggerContainer}
          >
            {[
              { value: ideaCount, label: t('landing.statsIdeas'), sub: t('landing.statsIdeasSub'), icon: BarChart3, color: 'text-primary' },
              { value: SOURCE_COUNT, label: t('landing.statsSources'), sub: t('landing.statsSourcesSub'), icon: Database, color: 'text-secondary' },
              { value: QUESTION_COUNT, label: t('landing.statsQuestions'), sub: t('landing.statsQuestionsSub'), icon: Target, color: 'text-accent' },
              { value: PROMPT_COUNT, label: t('landing.statsPrompts'), sub: t('landing.statsPromptsSub'), icon: Sparkles, color: 'text-amber-500' },
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
              {t('landing.howTitle')}
            </h2>
          </motion.div>

          <motion.div className="grid grid-cols-1 sm:grid-cols-3 gap-4" {...staggerContainer}>
            {[
              { num: '01', title: t('landing.how1Title'), desc: t('landing.how1Desc') },
              { num: '02', title: t('landing.how2Title'), desc: t('landing.how2Desc') },
              { num: '03', title: t('landing.how3Title'), desc: t('landing.how3Desc') },
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
                <h2 className="text-lg font-bold text-foreground">{t('landing.transparencyTitle')}</h2>
              </div>
              <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                <p>
                  {t('landing.transparency1')}
                </p>
                <p>
                  {t('landing.transparency2')}
                </p>
                <p>
                  {t('landing.transparency3')}{' '}
                  <a
                    href="https://github.com/fly-labs/website"
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    <Github className="w-3.5 h-3.5" /> {t('landing.seeCode')}
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
            {t('landing.ctaTitle')}
          </h2>
          <p className="text-muted-foreground font-medium mb-8 max-w-lg mx-auto">
            {t('landing.ctaSubtitle')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <button
              onClick={handleCTA}
              className="inline-flex items-center justify-center w-full sm:w-auto px-8 py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-lg hover:brightness-110 transition-[filter,transform] duration-150 active:translate-y-0.5"
            >
              {t('landing.ctaCta')} <ArrowRight className="w-5 h-5 ml-2" />
            </button>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
            <Link to="/ideas" className="hover:text-primary transition-colors">{t('landing.ctaIdeas')}</Link>
            <span className="text-muted-foreground/30">|</span>
            <Link to="/prompts" className="hover:text-primary transition-colors">{t('landing.ctaPrompts', { count: PROMPT_COUNT })}</Link>
            <span className="text-muted-foreground/30">|</span>
            <Link to="/scoring" className="hover:text-primary transition-colors">{t('landing.ctaFrameworks')}</Link>
          </div>
        </motion.div>
      </section>

    </PageLayout>
  );
};

export default FlyBotLandingPage;
