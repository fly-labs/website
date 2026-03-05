import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, LayoutTemplate, Code, Users, Mail } from 'lucide-react';
import { GitHubHeatmap } from '@/components/GitHubHeatmap.jsx';
import { motion } from 'framer-motion';
import { PageLayout } from '@/components/PageLayout.jsx';
import { fadeUp } from '@/lib/animations.js';
import { trackEvent } from '@/lib/analytics.js';

const pillars = [
  {
    title: 'Prompts',
    icon: Sparkles,
    description: 'Copy-paste AI prompts for coding, writing, and thinking. Built from real workflows, not generic templates.',
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    link: '/prompts',
    badge: '5 free prompts',
  },
  {
    title: 'Templates',
    icon: LayoutTemplate,
    description: 'Automation templates that connect your favorite tools. Set them up once, save hours every week.',
    color: 'text-secondary',
    bgColor: 'bg-secondary/10',
    link: '/templates',
  },
  {
    title: 'Micro Tools',
    icon: Code,
    description: 'Small, focused apps that do one thing really well. No bloat, no sign-ups, no nonsense.',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    link: '/microsaas',
  },
  {
    title: 'Community',
    icon: Users,
    description: 'Shape what gets built next. Submit ideas, vote on features, and get early access to everything.',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    link: '/ideas',
  },
];

const HomePage = () => {
  return (
    <PageLayout
      seo={{
        title: "Fly Labs | Vibe building things I wish existed",
        description: "Free tools, templates, and AI prompts built from scratch by one maker. Open source.",
        keywords: "vibe building, vibe coding, vibe marketing, AI tools, no-code, automation, open source, free tools, templates, prompts, indie maker",
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
          <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-6">
            The vibe builder's lab
          </p>
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
            {pillars.map((pillar, i) => (
              <motion.div
                key={pillar.title}
                {...fadeUp}
                transition={{ duration: 0.3, delay: i * 0.04 }}
              >
                <Link
                  to={pillar.link}
                  className="group flex flex-col h-full p-6 rounded-xl border border-border/60 bg-card/50 hover:bg-card hover:border-border hover:-translate-y-0.5 transition-all duration-200"
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
                  {pillar.badge && (
                    <span className="inline-block text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20 mb-3">
                      {pillar.badge}
                    </span>
                  )}
                  <span className="inline-flex items-center text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors mt-auto">
                    Browse {pillar.title.toLowerCase()}
                    <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform duration-200" />
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3: About the Maker + GitHub Activity */}
      <section className="py-12 md:py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            {...fadeUp}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <h2 className="text-sm font-semibold uppercase tracking-widest text-primary">
              Who's behind this
            </h2>
          </motion.div>
          <motion.div
            {...fadeUp}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-2xl border border-border/60 bg-gradient-to-l from-primary/5 to-transparent p-6 md:p-12"
          >
            <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] lg:grid-cols-[280px_1fr] gap-8 items-start">
              <div className="flex justify-center md:justify-start">
                <img
                  src="/images/luiz-alves.png"
                  alt="Luiz Alves"
                  className="w-36 h-36 sm:w-44 sm:h-44 md:w-52 md:h-52 lg:w-60 lg:h-60 rounded-2xl object-cover border border-border grayscale hover:grayscale-0 transition-all duration-700"
                />
              </div>
              <div className="text-center md:text-left">
                <h3 className="text-2xl md:text-3xl font-black text-foreground mb-1">
                  Luiz Alves
                </h3>
                <p className="text-sm font-semibold text-muted-foreground mb-4">
                  CFA, CAIA. Portfolio manager by day. Builder for fun.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  I ship tools, templates, and small products with AI and no-code. Everything here started as something I needed myself.
                </p>
                <Link
                  to="/about"
                  className="inline-flex items-center text-sm font-semibold text-primary hover:underline"
                >
                  Read the full story <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </div>
            </div>
          </motion.div>

          {/* GitHub activity - nested under the same section */}
          <motion.div
            {...fadeUp}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 rounded-2xl border border-border/60 bg-card/50 p-6 md:p-8"
          >
            <GitHubHeatmap variant="compact" />
          </motion.div>
        </div>
      </section>

      {/* Section 4: Newsletter CTA */}
      <section className="py-12 md:py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            {...fadeUp}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <h2 className="text-sm font-semibold uppercase tracking-widest text-primary">
              Stay in the loop
            </h2>
          </motion.div>
          <motion.div
            {...fadeUp}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-center bg-primary/10 border border-primary/30 rounded-2xl p-8 md:p-12 lg:p-16"
          >
            <Mail className="w-8 h-8 text-primary mx-auto mb-4" />
            <h3 className="text-2xl md:text-3xl font-black tracking-tight text-foreground mb-4">
              The Fala Comigo Newsletter
            </h3>
            <p className="text-muted-foreground font-medium leading-relaxed mb-8 max-w-xl mx-auto">
              A newsletter about building, shipping, and the maker journey. In English and Portuguese. Always free.
            </p>
            <Link
              to="/newsletter"
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
            >
              Start reading <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Section 5: Tagline Closer */}
      <section className="py-10 md:py-12 px-6">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.8 }}
          className="text-2xl md:text-3xl font-black text-muted-foreground/70 tracking-tight text-center"
        >
          What would you build?
        </motion.p>
      </section>

    </PageLayout>
  );
};

export default HomePage;
