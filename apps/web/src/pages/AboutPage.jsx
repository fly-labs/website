
import React from 'react';
import { Link } from 'react-router-dom';
import { Youtube, Github, Linkedin, Mail, BookOpen, ArrowRight, Terminal, ChevronDown } from 'lucide-react';
import { GitHubHeatmap } from '@/components/GitHubHeatmap.jsx';
import { PageLayout } from '@/components/PageLayout.jsx';
import { XIcon } from '@/components/XIcon.jsx';
import { motion } from 'framer-motion';
import { fadeUp } from '@/lib/animations.js';
import { trackEvent } from '@/lib/analytics.js';
import { SOURCE_COUNT, FRAMEWORK_COUNT } from '@/lib/data/siteStats.js';

const socials = [
  { href: 'mailto:luiz@flylabs.fun', icon: Mail, label: 'Email', color: 'text-primary' },
  { href: 'https://falacomigo.substack.com', icon: BookOpen, label: 'Substack', color: 'text-secondary', external: true },
  { href: 'https://github.com/fly-labs', icon: Github, label: 'GitHub', color: 'text-foreground', external: true },
  { href: 'https://x.com/alvesluizc', icon: XIcon, label: 'X', color: 'text-foreground', external: true },
  { href: 'https://youtube.com/@falacomigoyt', icon: Youtube, label: 'YouTube', color: 'text-[#FF0000]', external: true },
  { href: 'https://br.linkedin.com/in/alvesluizc', icon: Linkedin, label: 'LinkedIn', color: 'text-[#0A66C2]', external: true },
];

const AboutPage = () => {
  return (
    <PageLayout
      seo={{
        title: "About Luiz Alves - Builder & Creator at Fly Labs",
        description: "Meet Luiz Alves. Finance background, vibe builder. AI tools, templates, and open source experiments at Fly Labs.",
        keywords: "Luiz Alves, indie maker, AI builder, open source, tools, templates, vibe building",
        url: "https://flylabs.fun/about",
        schema: {
          "@context": "https://schema.org",
          "@type": "Person",
          "name": "Luiz Alves",
          "url": "https://flylabs.fun/about",
          "image": "https://flylabs.fun/images/luiz-alves.png",
          "jobTitle": "Vibe Builder & CFA Charterholder",
          "sameAs": [
            "https://github.com/fly-labs",
            "https://x.com/alvesluizc",
            "https://youtube.com/@falacomigoyt",
            "https://br.linkedin.com/in/alvesluizc",
            "https://falacomigo.substack.com"
          ]
        },
      }}
      className="pt-32 pb-24"
    >
      <div className="container mx-auto px-6">

        {/* Hero: Photo + Intro */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-[auto_1fr] gap-8 md:gap-12 items-center mb-24"
        >
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute -inset-3 bg-gradient-to-br from-primary/15 via-transparent to-secondary/15 rounded-2xl blur-2xl -z-10" />
              <img
                src="/images/luiz-alves.png"
                alt="Luiz Alves"
                loading="lazy"
                className="w-36 h-36 sm:w-44 sm:h-44 md:w-56 md:h-56 object-cover rounded-2xl border border-border shadow-xl grayscale hover:grayscale-0 transition-[filter] duration-700"
              />
            </div>
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-foreground mb-4">
              Nobody asked me to build any of this. I did it anyway, for fun.
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground font-medium leading-relaxed mb-6">
              I'm Luiz Alves. Over a decade in finance. I build things with AI on nights and weekends because it's fun. Everything here is open source.
            </p>
            <div className="flex flex-wrap gap-2 mb-6">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  {...(s.external ? { target: '_blank', rel: 'noreferrer' } : {})}
                  className="p-2.5 rounded-lg border border-border bg-card hover:bg-muted transition-colors"
                  title={s.label}
                  aria-label={s.label}
                  onClick={() => trackEvent('outbound_click', { link_url: s.href, link_label: s.label, location: 'about_hero' })}
                >
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                </a>
              ))}
            </div>
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="hidden md:flex justify-start"
            >
              <ChevronDown className="w-5 h-5 text-muted-foreground/50" />
            </motion.div>
          </div>
        </motion.section>

        {/* Pull quote */}
        <motion.div {...fadeUp} transition={{ duration: 0.5 }} className="max-w-5xl mx-auto mb-20">
          <blockquote className="border-l-4 border-primary pl-6">
            <p className="text-xl md:text-2xl font-black text-foreground leading-snug">
              I'm not trying to prove anything. I'm just building things I find interesting and sharing the process.
            </p>
          </blockquote>
        </motion.div>

        {/* Story blocks */}
        <div className="max-w-5xl mx-auto space-y-20">

          {/* The story */}
          <motion.section {...fadeUp} transition={{ duration: 0.5 }}>
            <div className="space-y-5 text-base md:text-lg text-muted-foreground font-medium leading-relaxed">
              <p>
                I work in finance. Have for over a decade. It's a serious job and I take it seriously. But somewhere along the way I started playing with AI tools, and I realized I could actually build things. Real things. Apps, templates, automated pipelines. With zero engineering background.
              </p>
              <p>
                The first time I shipped something and a stranger used it, something clicked. I wasn't thinking about a business. I was just curious: what else can I build? What other problems can I solve? That curiosity turned into weekends and late nights in front of the screen, and honestly, it doesn't feel like work.
              </p>
              <p>
                I call it vibe building. Andrej Karpathy called the coding part vibe coding. I think the whole thing is bigger than code. You find a real problem, you build a solution, you share it openly. One person can now do what used to require a team. That feels like a shift worth paying attention to.
              </p>
              <p>
                I share what I'm building, what I think is working, and what I'd do differently. Tomorrow I might reevaluate. I might be wrong about some of this. But I'd rather say what I actually think than perform certainty I don't have.
              </p>
            </div>
          </motion.section>

          {/* Building in Public */}
          <motion.section {...fadeUp} transition={{ duration: 0.5 }}>
            <div className="flex items-center gap-2 mb-6">
              <Terminal className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold uppercase tracking-widest text-primary">Building in Public</h2>
            </div>
            <p className="text-base md:text-lg text-muted-foreground font-medium leading-relaxed mb-6">
              Real commit activity from the Fly Labs GitHub. Every green square is a shipped feature, a fixed bug, or a new experiment.
            </p>
            <GitHubHeatmap variant="full" />
          </motion.section>

          {/* What I'm working on now */}
          <motion.section {...fadeUp} transition={{ duration: 0.5 }}>
            <h2 className="text-sm font-semibold uppercase tracking-widest text-primary mb-6">What I'm working on now</h2>
            <ul className="space-y-3">
              {[
                { text: 'Library - writing the first ebooks', link: '/library' },
                { text: 'Micro Tools - building the first batch', link: '/microsaas' },
                { text: `Idea Lab - ${SOURCE_COUNT} sources, ${FRAMEWORK_COUNT} AI frameworks, market validated`, link: '/ideas' },
              ].map((item) => (
                <li key={item.text}>
                  <Link to={item.link} className="inline-flex items-center text-base md:text-lg text-muted-foreground font-medium hover:text-primary transition-colors">
                    <span className="w-2 h-2 rounded-full bg-primary mr-3 shrink-0" />
                    {item.text}
                    <ArrowRight className="w-3.5 h-3.5 ml-2 opacity-60" />
                  </Link>
                </li>
              ))}
            </ul>
          </motion.section>

          {/* What Fly Labs is + Closing */}
          <motion.section {...fadeUp} transition={{ duration: 0.5 }}>
            <h2 className="text-sm font-semibold uppercase tracking-widest text-primary mb-6">What is Fly Labs</h2>
            <div className="space-y-5 text-base md:text-lg text-muted-foreground font-medium leading-relaxed mb-8">
              <p>
                Fly Labs is where all of it lives. The tools I build, the templates I wish existed, the ideas I'm testing. Everything is open, free, and documented. If you're curious about building with AI, or you just want to see what one person can ship in their spare time, poke around.
              </p>
              <p className="text-foreground font-bold text-lg md:text-xl">
                Come build something.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <Link
                to="/explore"
                className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
              >
                Explore The Lab <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
              <span className="hidden sm:inline text-muted-foreground">or</span>
              <a
                href="https://falacomigo.substack.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center text-sm font-semibold text-primary hover:underline"
                onClick={() => trackEvent('newsletter_click', { location: 'about_bottom' })}
              >
                Subscribe to the newsletter <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </a>
            </div>
          </motion.section>

        </div>
      </div>
    </PageLayout>
  );
};

export default AboutPage;
