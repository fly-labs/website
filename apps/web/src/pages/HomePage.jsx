import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, LayoutTemplate, Code, Users, BookOpen, Github, Zap, Heart, MessageCircle, Repeat2, Clock, Bot } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { PageLayout } from '@/components/PageLayout.jsx';
import { fadeUp, staggerContainer, staggerItem } from '@/lib/animations.js';
import { trackEvent, trackScrollDepth } from '@/lib/analytics.js';
import { prompts } from '@/lib/data/prompts.js';
import { books } from '@/lib/data/library.js';
import { SOURCE_COUNT, QUESTION_COUNT } from '@/lib/data/siteStats.js';
import supabase from '@/lib/supabaseClient.js';
import { cn } from '@/lib/utils.js';
import { fetchArticles } from '@/lib/substackApi.js';

const availableBookCount = books.filter((b) => b.status === 'available').length;

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

const HomePage = () => {
  const { t } = useTranslation('home');
  const [ideaCount, setIdeaCount] = useState(null);
  const [articles, setArticles] = useState(null);

  useEffect(() => trackScrollDepth('home'), []);

  useEffect(() => {
    supabase
      .from('ideas')
      .select('id', { count: 'exact', head: true })
      .eq('approved', true)
      .then(({ count }) => {
        if (count != null) setIdeaCount(count);
      });

    fetchArticles(3).then((data) => {
      if (data) setArticles(data.slice(0, 3));
    }).catch(() => {});
  }, []);

  const pillars = [
    {
      title: t('pillars.ideasLab.title'),
      icon: Users,
      description: t('pillars.ideasLab.description', { sourceCount: SOURCE_COUNT, questionCount: QUESTION_COUNT }),
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      link: '/ideas',
      stat: null,
      featured: true,
    },
    {
      title: t('pillars.prompts.title'),
      icon: Sparkles,
      description: t('pillars.prompts.description'),
      color: 'text-secondary',
      bgColor: 'bg-secondary/10',
      link: '/prompts',
      stat: `${prompts.length} prompts`,
    },
    {
      title: t('pillars.templates.title'),
      icon: LayoutTemplate,
      description: t('pillars.templates.description'),
      color: 'text-accent',
      bgColor: 'bg-accent/10',
      link: '/templates',
      stat: t('pillars.templates.stat'),
    },
    {
      title: t('pillars.microTools.title'),
      icon: Code,
      description: t('pillars.microTools.description'),
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      link: '/microsaas',
      stat: t('pillars.microTools.stat'),
    },
    {
      title: t('pillars.library.title'),
      icon: BookOpen,
      description: t('pillars.library.description'),
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      link: '/library',
      stat: availableBookCount > 0 ? `${availableBookCount} ${availableBookCount > 1 ? t('pillars.library.ebooks') : t('pillars.library.ebook')}` : t('pillars.microTools.stat'),
    },
    {
      title: t('pillars.flybot.title'),
      icon: Bot,
      description: t('pillars.flybot.description'),
      color: 'text-accent',
      bgColor: 'bg-accent/10',
      link: '/flybot',
      stat: t('pillars.flybot.stat'),
    },
  ];

  const cycleSteps = [
    { step: '01', title: t('cycle.ideation.title'), desc: t('cycle.ideation.description'), color: 'text-primary' },
    { step: '02', title: t('cycle.build.title'), desc: t('cycle.build.description'), color: 'text-secondary' },
    { step: '03', title: t('cycle.share.title'), desc: t('cycle.share.description'), color: 'text-accent' },
    { step: '04', title: t('cycle.compound.title'), desc: t('cycle.compound.description'), color: 'text-primary' },
  ];

  return (
    <PageLayout
      seo={{
        title: t('seo.title'),
        description: t('seo.description'),
        keywords: "vibe building, AI tools, idea validation, one person business, open source, indie maker, prompt library, build in public",
        url: "https://flylabs.fun",
      }}
    >

      {/* ==================== HERO ==================== */}
      <section className="relative pt-20 sm:pt-28 md:pt-36 pb-10 md:pb-16 px-6 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 max-w-5xl mx-auto text-center"
        >
          {/* Social proof badges */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-wrap items-center justify-center gap-3 mb-8"
          >
            {ideaCount != null && (
              <span className="stat-pill">
                <Zap className="w-3.5 h-3.5 text-primary" />
                <AnimatedNumber value={ideaCount} suffix="+" /> {t('stats.ideasScored')}
              </span>
            )}
            <span className="stat-pill">
              <Sparkles className="w-3.5 h-3.5 text-secondary" />
              {prompts.length} {t('stats.prompts')}
            </span>
            <span className="stat-pill">
              <Github className="w-3.5 h-3.5" />
              {t('stats.openSource')}
            </span>
          </motion.div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-black tracking-tight text-foreground leading-[1.05] mb-5 max-w-4xl mx-auto">
            {t('hero.headline')}
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed mb-6 sm:mb-10">
            {t('hero.subheadline')}
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/ideas"
              className="inline-flex items-center justify-center w-full sm:w-auto px-8 py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-lg hover:brightness-110 transition-[filter,transform] duration-150 active:translate-y-0.5"
              onClick={() => trackEvent('cta_click', { cta: 'explore_ideas', location: 'home_hero' })}
            >
              {t('hero.cta')} <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link
              to="/explore"
              className="inline-flex items-center justify-center w-full sm:w-auto px-8 py-4 rounded-xl border border-border font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              onClick={() => trackEvent('cta_click', { cta: 'explore', location: 'home_hero' })}
            >
              {t('hero.ctaSecondary')}
            </Link>
          </div>
        </motion.div>
      </section>

      {/* ==================== PILLARS (Bento Grid) ==================== */}
      <section className="py-10 md:py-14 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            {...fadeUp}
            transition={{ duration: 0.5 }}
            className="mb-10"
          >
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-foreground mb-3">
              {t('pillars.title')}
            </h2>
            <p className="text-muted-foreground font-medium max-w-2xl">
              {t('pillars.subtitle')}
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            {...staggerContainer}
          >
            {pillars.map((pillar) => {
              const stat = pillar.title === t('pillars.ideasLab.title') && ideaCount != null
                ? `${ideaCount} ${t('stats.ideasScored')}`
                : pillar.stat;
              return (
                <motion.div
                  key={pillar.title}
                  {...staggerItem}
                  className={pillar.featured ? 'card-bento-featured' : ''}
                >
                  <Link
                    to={pillar.link}
                    className={cn(
                      "card-glow group flex flex-col h-full p-6 lg:p-8",
                      pillar.featured && "bg-gradient-to-br from-primary/[0.04] to-transparent"
                    )}
                    onClick={() => trackEvent('cta_click', { cta: pillar.title.toLowerCase(), location: 'home_pillars' })}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-10 h-10 rounded-lg ${pillar.bgColor} ${pillar.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                        <pillar.icon className="w-5 h-5" />
                      </div>
                      {stat && (
                        <span className={cn(
                          "text-xs font-bold px-2.5 py-1 rounded-full border",
                          pillar.featured
                            ? "text-primary bg-primary/10 border-primary/20"
                            : "text-muted-foreground bg-muted border-border"
                        )}>
                          {stat}
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors mb-2">
                      {pillar.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed flex-grow mb-4">
                      {pillar.description}
                    </p>
                    <span className="inline-flex items-center text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors mt-auto">
                      {t('pillars.explore')}
                      <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform duration-200" />
                    </span>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ==================== HOW IT WORKS ==================== */}
      <section className="py-10 md:py-14 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div {...fadeUp} transition={{ duration: 0.5 }} className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-foreground mb-3">
              {t('cycle.title')}
            </h2>
            <p className="text-muted-foreground font-medium max-w-2xl mx-auto">
              {t('cycle.subtitle')}
            </p>
          </motion.div>

          <motion.div className="grid grid-cols-1 sm:grid-cols-2 gap-4" {...staggerContainer}>
            {cycleSteps.map((item) => (
              <motion.div
                key={item.step}
                {...staggerItem}
                className="glass-card p-6"
              >
                <span className={`text-xs font-black uppercase tracking-widest ${item.color} mb-3 block`}>
                  {item.step}
                </span>
                <h3 className="font-bold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ==================== NEWSLETTER ==================== */}
      {articles && articles.length > 0 && (
        <section className="py-10 md:py-14 px-6">
          <div className="max-w-6xl mx-auto">
            <motion.div
              {...fadeUp}
              transition={{ duration: 0.5 }}
              className="mb-10"
            >
              <h2 className="text-2xl md:text-3xl font-black tracking-tight text-foreground mb-3">
                {t('newsletter.title')}
              </h2>
              <p className="text-muted-foreground font-medium max-w-2xl">
                {t('newsletter.subtitle')}
              </p>
            </motion.div>

            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6"
              {...staggerContainer}
            >
              {articles.map((article) => {
                const hasEngagement = article.reactions > 0;
                return (
                  <motion.a
                    key={article.id}
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Read "${article.title}" on Substack (opens in new tab)`}
                    onClick={() => trackEvent('article_click', { article_title: article.title, location: 'home_newsletter' })}
                    {...staggerItem}
                    className="card-glow group flex flex-col overflow-hidden"
                  >
                    {article.coverImage && (
                      <div className="aspect-video overflow-hidden bg-muted">
                        <img
                          src={article.coverImage}
                          alt={article.title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    )}
                    <div className="p-5 flex flex-col flex-grow">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                        <span>{new Date(article.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        {article.readTime > 0 && (
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {article.readTime} min
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-3 flex-grow">
                        {article.title}
                      </h3>
                      {hasEngagement && (
                        <div className="inline-flex items-center gap-3 text-xs text-muted-foreground">
                          {article.reactions > 0 && (
                            <span className="inline-flex items-center gap-1">
                              <Heart className="w-3 h-3" /> {article.reactions}
                            </span>
                          )}
                          {article.comments > 0 && (
                            <span className="inline-flex items-center gap-1">
                              <MessageCircle className="w-3 h-3" /> {article.comments}
                            </span>
                          )}
                          {article.restacks > 0 && (
                            <span className="inline-flex items-center gap-1">
                              <Repeat2 className="w-3 h-3" /> {article.restacks}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.a>
                );
              })}
            </motion.div>

            <motion.div {...fadeUp} transition={{ duration: 0.5 }}>
              <Link
                to="/newsletter"
                className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                onClick={() => trackEvent('newsletter_click', { location: 'home_newsletter' })}
              >
                {t('newsletter.seeAll')} <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </motion.div>
          </div>
        </section>
      )}

      {/* ==================== CLOSING ==================== */}
      <section className="relative py-14 md:py-20 px-6 overflow-hidden">
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.5 }}
          className="relative z-10 max-w-3xl mx-auto text-center"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-foreground mb-5">
            {t('closing.headline')}
            <br />
            <span className="text-muted-foreground">{t('closing.subheadline')}</span>
          </h2>
          <p className="text-lg text-muted-foreground font-medium leading-relaxed mb-10 max-w-2xl mx-auto">
            {t('closing.text')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/newsletter"
              className="inline-flex items-center justify-center w-full sm:w-auto px-8 py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-lg hover:brightness-110 transition-[filter,transform] duration-150 active:translate-y-0.5"
              onClick={() => trackEvent('newsletter_click', { location: 'home_closing' })}
            >
              {t('closing.ctaNewsletter')} <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link
              to="/about"
              className="inline-flex items-center justify-center w-full sm:w-auto px-8 py-4 rounded-xl border border-border font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              {t('closing.ctaAbout')}
            </Link>
          </div>
        </motion.div>
      </section>

    </PageLayout>
  );
};

export default HomePage;
