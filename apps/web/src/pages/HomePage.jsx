import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, LayoutTemplate, Code, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { PageLayout } from '@/components/PageLayout.jsx';
import { fadeUp } from '@/lib/animations.js';
import { trackEvent } from '@/lib/analytics.js';
import { prompts } from '@/lib/data/prompts.js';
import { supabase } from '@/lib/supabaseClient.js';
import { cn } from '@/lib/utils.js';

const pillars = [
  {
    title: 'Prompts',
    icon: Sparkles,
    description: 'Copy-paste AI prompts for coding, writing, and thinking. Built from real workflows, not generic templates.',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    link: '/prompts',
    stat: `${prompts.length} prompts`,
    statColor: 'text-primary bg-primary/10 border-primary/20',
    accentBorder: 'hover:border-primary/40',
  },
  {
    title: 'Templates',
    icon: LayoutTemplate,
    description: 'Automation templates that connect your favorite tools. Set them up once, save hours every week.',
    color: 'text-secondary',
    bgColor: 'bg-secondary/10',
    link: '/templates',
    stat: 'Notion + GitHub',
    statColor: 'text-secondary bg-secondary/10 border-secondary/20',
    accentBorder: 'hover:border-secondary/40',
  },
  {
    title: 'Micro Tools',
    icon: Code,
    description: 'Small, focused apps that do one thing really well. No bloat, no sign-ups, no nonsense.',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    link: '/microsaas',
    stat: 'Coming soon',
    statColor: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    accentBorder: 'hover:border-blue-500/40',
  },
  {
    title: 'Idea Board',
    icon: Users,
    description: 'Real problems scraped from Reddit and ProblemHunt, scored by AI, voted by the community. Drop yours too.',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    link: '/ideas',
    stat: null, // dynamic
    statColor: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
    accentBorder: 'hover:border-orange-500/40',
  },
];

const HomePage = () => {
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

  return (
    <PageLayout
      seo={{
        title: "Fly Labs | Free AI Tools, Templates & Prompts for Builders",
        description: "Free AI tools, Notion templates, and curated prompts built by one indie maker. Open source, community-driven, and updated daily. Start building today.",
        keywords: "vibe building, vibe coding, AI tools, no-code, automation, open source, free tools, Notion templates, AI prompts, indie maker",
        url: "https://flylabs.fun",
      }}
    >

      {/* Section 1: Hero */}
      <section className="pt-32 pb-10 md:pb-14 px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center"
        >
          <div className="flex items-center justify-center gap-3 mb-6">
            <img
              src="/images/luiz-alves.png"
              alt="Luiz Alves"
              className="w-8 h-8 rounded-full object-cover border border-border"
            />
            <span className="text-sm font-semibold text-muted-foreground">Built by Luiz Alves</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-black tracking-tight text-foreground leading-[1.1] mb-6">
            I build things I wish existed.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed mb-10">
            Free tools, templates, and AI prompts. Built from scratch by one person with AI and no-code. All open source.
          </p>
          <div className="flex flex-col items-center gap-3">
            <Link
              to="/explore"
              className="inline-flex items-center justify-center w-full sm:w-auto px-8 py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-lg hover:bg-primary/90 transition-colors"
              onClick={() => trackEvent('cta_click', { cta: 'explore', location: 'home_hero' })}
            >
              Explore what I've built <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link
              to="/about"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              or read my story
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Section 2: Value Pillars */}
      <section className="py-12 md:py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            {...fadeUp}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <h2 className="text-sm font-semibold uppercase tracking-widest text-primary mb-3">
              What you'll find here
            </h2>
            <p className="text-muted-foreground font-medium">
              Everything started as a real need. Built from scratch, shared with everyone.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 xl:gap-6">
            {pillars.map((pillar, i) => {
              const stat = pillar.title === 'Idea Board' && ideaCount != null
                ? `${ideaCount} ideas`
                : pillar.stat;
              return (
                <motion.div
                  key={pillar.title}
                  {...fadeUp}
                  transition={{ duration: 0.3, delay: i * 0.04 }}
                >
                  <Link
                    to={pillar.link}
                    className={cn(
                      "group flex flex-col h-full p-6 rounded-xl border border-border/60 bg-card/50 hover:bg-card transition-colors duration-200",
                      pillar.accentBorder
                    )}
                    onClick={() => trackEvent('cta_click', { cta: pillar.title.toLowerCase(), location: 'home_pillars' })}
                  >
                    <div className={`w-10 h-10 rounded-lg ${pillar.bgColor} ${pillar.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-200 mb-4`}>
                      <pillar.icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-2">
                      {pillar.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed flex-grow mb-4">
                      {pillar.description}
                    </p>
                    {stat && (
                      <span className={cn("inline-block text-xs font-bold px-2.5 py-1 rounded-full border mb-3", pillar.statColor)}>
                        {stat}
                      </span>
                    )}
                    <span className="inline-flex items-center text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors mt-auto">
                      Browse {pillar.title.toLowerCase()}
                      <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform duration-200" />
                    </span>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Section 3: Closing */}
      <section className="py-12 md:py-16 px-6">
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto text-center"
        >
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-foreground mb-4">
            What would you build if you could?
          </h2>
          <p className="text-muted-foreground font-medium leading-relaxed mb-8 max-w-xl mx-auto">
            I write about building, shipping, and the maker journey. In English and Portuguese. Always free.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/newsletter"
              className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
              onClick={() => trackEvent('newsletter_click', { location: 'home_closing' })}
            >
              Read the newsletter <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
            <Link
              to="/about"
              className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-3 rounded-xl border border-border font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              Read my story
            </Link>
          </div>
        </motion.div>
      </section>

    </PageLayout>
  );
};

export default HomePage;
