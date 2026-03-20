
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Youtube, Github, Linkedin, Mail, BookOpen, ArrowRight, ChevronDown, FlaskConical, BarChart3, Rocket, Zap, Sparkles, Terminal, Music, Brain, Globe, Database, GitBranch, Search, Filter, CheckCircle2, XCircle, AlertTriangle, Headphones, MessageSquare, TrendingUp, Repeat, Lightbulb, Hammer, Gift } from 'lucide-react';
import { GitHubHeatmap, RecentCommits } from '@/components/GitHubHeatmap.jsx';
import { PageLayout } from '@/components/PageLayout.jsx';
import { SmileLogo } from '@/components/SmileLogo.jsx';
import { XIcon } from '@/components/XIcon.jsx';
import { motion } from 'framer-motion';
import { fadeUp, staggerContainer, staggerItem } from '@/lib/animations.js';
import { trackEvent, trackScrollDepth } from '@/lib/analytics.js';
import { SOURCE_COUNT, PROMPT_COUNT, CATEGORY_COUNT, TRACK_COUNT, VIBE_COUNT } from '@/lib/data/siteStats.js';
import supabase from '@/lib/supabaseClient.js';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation('about');
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
        title: t('seo.title'),
        description: t('seo.description'),
        keywords: "Luiz Alves, indie maker, AI builder, open source, tools, templates, vibe building",
        url: "https://flylabs.fun/about",
        schema: {
          "@context": "https://schema.org",
          "@type": "Person",
          "name": "Luiz Alves",
          "url": "https://flylabs.fun/about",
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
        <section className="max-w-3xl mx-auto text-center">
          {/* SmileLogo with soft glow */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex justify-center mb-6"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl scale-150 pointer-events-none" />
              <div className="relative">
                <SmileLogo className="w-16 h-16 md:w-20 md:h-20" />
              </div>
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-foreground mb-4"
          >
            {t('hero.headline')}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="text-lg md:text-xl text-muted-foreground font-medium leading-relaxed mb-6"
          >
            {t('hero.text')}
          </motion.p>

          {/* Social icons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.36, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-wrap justify-center gap-2 mb-6"
          >
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                {...(s.external ? { target: '_blank', rel: 'noreferrer' } : {})}
                className="p-3 rounded-lg border border-border bg-card hover:bg-muted transition-colors"
                title={s.label}
                aria-label={s.label}
                onClick={() => trackEvent('outbound_click', { link_url: s.href, link_label: s.label, location: 'about_hero' })}
              >
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </a>
            ))}
          </motion.div>

          {/* Scroll hint */}
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="hidden md:flex justify-center"
          >
            <ChevronDown className="w-5 h-5 text-muted-foreground/50" />
          </motion.div>
        </section>

        <div className="max-w-5xl mx-auto space-y-10 md:space-y-14">

          {/* 2. THE MANIFESTO */}
          <motion.section {...fadeUp} transition={{ duration: 0.5 }}>
            <SectionLabel icon={FlaskConical} label={t('manifesto.label')} color="text-primary" />
            <div className="glass-card p-6 md:p-8">
              <blockquote className="border-l-4 border-primary pl-6">
                <p className="text-xl md:text-2xl font-black text-foreground leading-snug">
                  {t('manifesto.quote')}
                </p>
              </blockquote>
            </div>
          </motion.section>

          {/* 3. THE STORY - narrative that introduces the ecosystem naturally */}
          <motion.section {...staggerContainer}>
            <motion.div {...staggerItem}>
              <SectionLabel icon={BookOpen} label={t('story.label')} color="text-secondary" />
            </motion.div>

            {/* The Origin */}
            <motion.div {...staggerItem} className="card-glow p-6 md:p-8 mb-4">
              <p className="text-xs font-bold uppercase tracking-widest text-secondary mb-4">{t('story.originLabel')}</p>
              <div className="space-y-4 text-base md:text-lg text-muted-foreground font-medium leading-relaxed">
                <p>
                  {t('story.origin1')}
                </p>
                <p>
                  {t('story.origin2')}
                </p>
              </div>
            </motion.div>

            {/* What grew from that curiosity */}
            <motion.div {...staggerItem} className="card-glow p-6 md:p-8 mb-4">
              <p className="text-xs font-bold uppercase tracking-widest text-secondary mb-4">{t('story.grewLabel')}</p>
              <div className="space-y-4 text-base md:text-lg text-muted-foreground font-medium leading-relaxed">
                <p>
                  {t('story.grewText1Before')}<Link to="/library" className="text-foreground font-semibold hover:text-primary transition-colors">{t('story.libraryLink')}</Link>{t('story.grewText1Between')}<Link to="/templates" className="text-foreground font-semibold hover:text-primary transition-colors">{t('story.templatesLink')}</Link>{t('story.grewText1After')}
                </p>
                <p>
                  {t('story.grewText2Before')}<Link to="/prompts" className="text-foreground font-semibold hover:text-primary transition-colors">{t('story.promptLibraryLink')}</Link>{t('story.promptLibraryText', { promptCount: PROMPT_COUNT, categoryCount: CATEGORY_COUNT })}
                </p>
              </div>
            </motion.div>

            {/* The Ideas Lab */}
            <motion.div {...staggerItem} className="card-glow p-6 md:p-8 border-l-4 border-primary mb-4">
              <p className="text-xs font-bold uppercase tracking-widest text-primary mb-4">{t('story.ideasLabLabel')}</p>
              <div className="space-y-4 text-base md:text-lg text-muted-foreground font-medium leading-relaxed">
                <p>
                  {t('story.ideasLabTextBefore')}<Link to="/ideas" className="text-foreground font-semibold hover:text-primary transition-colors">{t('story.ideasLabLink')}</Link>{t('story.ideasLabTextAfter', { sourceCount: SOURCE_COUNT })}
                </p>

                {/* Verdict badges */}
                <div className="flex flex-wrap gap-2 py-1">
                  {[
                    { label: t('story.verdictBuild'), icon: CheckCircle2, bg: 'bg-primary/10', border: 'border-primary/30', text: 'text-primary', desc: t('story.verdictBuildDesc') },
                    { label: t('story.verdictValidate'), icon: AlertTriangle, bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-600 dark:text-amber-400', desc: t('story.verdictValidateDesc') },
                    { label: t('story.verdictSkip'), icon: XCircle, bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-500', desc: t('story.verdictSkipDesc') },
                  ].map((v) => (
                    <div key={v.label} className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${v.border} ${v.bg}`}>
                      <v.icon className={`w-4 h-4 ${v.text}`} />
                      <span className={`text-sm font-bold ${v.text}`}>{v.label}</span>
                      <span className="text-xs text-muted-foreground hidden sm:inline">{v.desc}</span>
                    </div>
                  ))}
                </div>

                <p>
                  {t('story.ideasCountBefore')}{ideaCount != null ? <span className="text-foreground font-semibold">{ideaCount.toLocaleString()}</span> : '...'}{t('story.ideasCountAfter')}
                </p>
                <p>
                  {t('story.analyticsTextBefore')}<Link to="/ideas/analytics" className="text-foreground font-semibold hover:text-primary transition-colors">{t('story.analyticsLink')}</Link>{t('story.analyticsTextAfter')}
                </p>
              </div>
              <div className="flex flex-wrap gap-3 mt-4">
                <Link to="/ideas" className="inline-flex items-center text-sm font-semibold text-primary hover:underline">
                  {t('story.browseIdeas')} <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Link>
                <Link to="/ideas/analytics" className="inline-flex items-center text-sm font-semibold text-muted-foreground hover:text-primary hover:underline">
                  {t('story.seeAnalytics')} <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </div>
            </motion.div>

            {/* FlyBot & The Experience */}
            <motion.div {...staggerItem} className="card-glow p-6 md:p-8 border-l-4 border-secondary mb-4">
              <p className="text-xs font-bold uppercase tracking-widest text-secondary mb-4">{t('story.coachLabel')}</p>
              <div className="space-y-4 text-base md:text-lg text-muted-foreground font-medium leading-relaxed">
                <p>
                  {t('story.coachTextBefore')}<Link to="/flybot" className="text-foreground font-semibold hover:text-secondary transition-colors">{t('story.flybot')}</Link>{t('story.coachTextAfter')}
                </p>

                {/* FlyBot + Music visual */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-1">
                  <div className="flex items-start gap-3 p-3 rounded-xl border border-secondary/20 bg-secondary/5">
                    <div className="w-9 h-9 rounded-lg bg-secondary/15 flex items-center justify-center shrink-0 mt-0.5">
                      <MessageSquare className="w-4.5 h-4.5 text-secondary" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{t('story.coachCard')}</p>
                      <p className="text-xs text-muted-foreground leading-snug mt-0.5">{t('story.coachCardDesc', { count: ideaCount != null ? ideaCount.toLocaleString() : '...' })}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-xl border border-accent/20 bg-accent/5">
                    <div className="w-9 h-9 rounded-lg bg-accent/15 flex items-center justify-center shrink-0 mt-0.5">
                      <Headphones className="w-4.5 h-4.5 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{t('story.musicCard')}</p>
                      <p className="text-xs text-muted-foreground leading-snug mt-0.5">{t('story.musicCardDesc', { vibeCount: VIBE_COUNT, trackCount: TRACK_COUNT })}</p>
                    </div>
                  </div>
                </div>

                <p>
                  {t('story.musicReflection')}
                </p>
              </div>
              <Link to="/flybot" className="inline-flex items-center text-sm font-semibold text-secondary hover:underline mt-4">
                {t('story.tryFlyBot')} <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </motion.div>

            {/* Vibe Building */}
            <motion.div {...staggerItem} className="card-glow p-6 md:p-8 border-l-4 border-accent">
              <p className="text-xs font-bold uppercase tracking-widest text-accent mb-4">{t('vibeBuild.label')}</p>
              <div className="space-y-4 text-base md:text-lg text-muted-foreground font-medium leading-relaxed">
                <p>
                  {t('vibeBuild.intro1')}
                </p>
                <p>
                  {t('vibeBuild.intro2')}
                </p>
                <p className="text-foreground font-semibold">
                  {t('vibeBuild.cycleIntro')}
                </p>

                {/* The Cycle - visual connected flow */}
                {(() => {
                  const steps = [
                    { step: '01', label: t('vibeBuild.ideation'), desc: t('vibeBuild.ideationDesc'), icon: Lightbulb, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/30' },
                    { step: '02', label: t('vibeBuild.build'), desc: t('vibeBuild.buildDesc'), icon: Hammer, color: 'text-secondary', bg: 'bg-secondary/10', border: 'border-secondary/30' },
                    { step: '03', label: t('vibeBuild.share'), desc: t('vibeBuild.shareDesc'), icon: Gift, color: 'text-accent', bg: 'bg-accent/10', border: 'border-accent/30' },
                    { step: '04', label: t('vibeBuild.compound'), desc: t('vibeBuild.compoundDesc'), icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/30' },
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
                  <span className="text-xs text-muted-foreground/50 font-medium">{t('vibeBuild.cycleRepeat')}</span>
                </div>

                <p>
                  {t('vibeBuild.closing1')}
                </p>
                <p>
                  {t('vibeBuild.closing2')}
                </p>
              </div>
            </motion.div>
          </motion.section>

          {/* 4. THE PIPELINE */}
          <motion.section {...fadeUp} transition={{ duration: 0.5 }}>
            <SectionLabel icon={Database} label={t('pipeline.label')} color="text-secondary" />
            <div className="card-glow p-6 md:p-8">
              <p className="text-base md:text-lg text-muted-foreground font-medium leading-relaxed mb-6">
                {t('pipeline.description')}
              </p>

              {/* Visual Pipeline Flow */}
              {(() => {
                const stages = [
                  { title: t('pipeline.sources'), subtitle: t('pipeline.sourcesSub', { count: SOURCE_COUNT }), icon: Search, color: 'text-secondary', bg: 'bg-secondary/5', iconBg: 'bg-secondary/15', border: 'border-secondary/30', dotColor: 'bg-secondary/40', items: ['Reddit', 'Product Hunt', 'Hacker News', 'X/Twitter', 'GitHub', 'ProblemHunt', 'YC Graveyard', 'Community'] },
                  { title: t('pipeline.scoring'), subtitle: t('pipeline.scoringSub'), icon: Filter, color: 'text-primary', bg: 'bg-primary/5', iconBg: 'bg-primary/15', border: 'border-primary/30', dotColor: 'bg-primary/40', items: [t('pipeline.q1'), t('pipeline.q2'), t('pipeline.q3'), t('pipeline.q4')] },
                  { title: t('pipeline.validation'), subtitle: t('pipeline.validationSub'), icon: CheckCircle2, color: 'text-accent', bg: 'bg-accent/5', iconBg: 'bg-accent/15', border: 'border-accent/30', dotColor: 'bg-accent/40', items: [t('pipeline.xSearch'), t('pipeline.redditConvos'), t('pipeline.confidenceScoring'), t('pipeline.finalVerdict')] },
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
                  <span>{t('pipeline.footer')}</span>
                </div>
              </div>
            </div>
          </motion.section>

          {/* 5. BY THE NUMBERS */}
          <motion.section {...staggerContainer}>
            <motion.div {...staggerItem}>
              <SectionLabel icon={BarChart3} label={t('stats.label')} color="text-primary" />
              <p className="text-base md:text-lg text-muted-foreground font-medium leading-relaxed mb-4">
                {t('stats.description')}
              </p>
            </motion.div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
              {[
                { value: ideaCount, label: t('stats.ideasScored'), icon: Zap, color: 'text-primary' },
                { value: SOURCE_COUNT, label: t('stats.dataSources'), icon: Globe, color: 'text-secondary' },
                { value: PROMPT_COUNT, label: t('stats.aiPrompts'), icon: Sparkles, color: 'text-accent' },
                { value: 4, label: t('stats.scoringQuestions'), icon: Brain, color: 'text-primary' },
                { value: CATEGORY_COUNT, label: t('stats.promptCategories'), icon: Terminal, color: 'text-secondary' },
                { value: TRACK_COUNT, label: t('stats.lofiTracks'), icon: Music, color: 'text-accent' },
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
            <SectionLabel icon={Github} label={t('openSource.label')} color="text-foreground" />
            <div className="card-glow p-6 md:p-8">
              <div className="space-y-4 text-base md:text-lg text-muted-foreground font-medium leading-relaxed mb-6">
                <p>
                  {t('openSource.text1')}
                </p>
                <p>
                  {t('openSource.text2')}
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
                {t('openSource.viewGithub')}
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </motion.section>

          {/* 7. CLOSING */}
          <motion.section {...fadeUp} transition={{ duration: 0.5 }}>
            <SectionLabel icon={Rocket} label={t('closing.label')} color="text-accent" />
            <div className="card-glow p-6 md:p-8">
              <div className="space-y-4 mb-8">
                <p className="text-base md:text-lg text-muted-foreground font-medium leading-relaxed">
                  {t('closing.text1')}
                </p>
                <p className="text-foreground font-bold text-lg md:text-xl">
                  {t('closing.text2')}
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <Link
                  to="/ideas"
                  className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:brightness-110 transition-[filter,transform] duration-150 active:translate-y-0.5"
                >
                  {t('closing.ctaIdeas')} <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
                <span className="hidden sm:inline text-muted-foreground">{t('closing.or')}</span>
                <Link
                  to="/newsletter"
                  className="inline-flex items-center text-sm font-semibold text-primary hover:underline"
                  onClick={() => trackEvent('newsletter_click', { location: 'about_bottom' })}
                >
                  {t('closing.ctaNewsletter')} <ArrowRight className="w-3.5 h-3.5 ml-1" />
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
