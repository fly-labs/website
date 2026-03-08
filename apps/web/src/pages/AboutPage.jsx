
import React from 'react';
import { Link } from 'react-router-dom';
import { Youtube, Github, Linkedin, Mail, BookOpen, ArrowRight, Terminal, ChevronDown } from 'lucide-react';
import { GitHubHeatmap } from '@/components/GitHubHeatmap.jsx';
import { PageLayout } from '@/components/PageLayout.jsx';
import { XIcon } from '@/components/XIcon.jsx';
import { motion } from 'framer-motion';
import { fadeUp } from '@/lib/animations.js';
import { trackEvent } from '@/lib/analytics.js';

const socials = [
  { href: 'mailto:luiz@flylabs.fun', icon: Mail, label: 'Email', color: 'text-primary' },
  { href: 'https://falacomigo.substack.com', icon: BookOpen, label: 'Substack', color: 'text-secondary', external: true },
  { href: 'https://github.com/fly-labs', icon: Github, label: 'GitHub', color: 'text-foreground', external: true },
  { href: 'https://x.com/alvesluizc', icon: XIcon, label: 'X', color: 'text-foreground', external: true },
  { href: 'https://youtube.com/@falacomigoyt', icon: Youtube, label: 'YouTube', color: 'text-[#FF0000]', external: true },
  { href: 'https://br.linkedin.com/in/alvesluizc', icon: Linkedin, label: 'LinkedIn', color: 'text-[#0A66C2]', external: true },
];

const milestones = [
  {
    phase: 'The spark',
    title: 'A watch, a database, and zero solutions',
    description: 'I wanted to sync my Garmin watch data into Notion. Nothing existed. So I built it, put it on GitHub, and people actually started using it.',
    link: { label: 'See the integration', to: '/templates/garmin-to-notion' },
  },
  {
    phase: 'The pattern',
    title: 'If I have the problem, someone else does too',
    description: "That tiny moment changed something. If I have a problem, chances are someone else has the same one. And if I can build the solution, why not share it?",
  },
  {
    phase: 'The lab',
    title: 'A home for tools, templates, and experiments',
    description: 'So I built a home for all of it. Tools, templates, experiments. Open, free, and built with the same energy: solve a real problem, share it openly.',
    link: { label: 'See everything', to: '/explore' },
  },
  {
    phase: 'Right now',
    title: 'AI scores ideas, the community votes, the best get built',
    description: 'New ideas come from Reddit, Hacker News, GitHub Issues, ProblemHunt, Product Hunt, X, and the community. AI scores them with 3 frameworks, validates against real conversations, and maps the competitive landscape. The best ones get built.',
    link: { label: 'Browse the idea lab', to: '/ideas' },
  },
];

const AboutPage = () => {
  return (
    <PageLayout
      seo={{
        title: "About Luiz Alves - Builder, CFA & Creator",
        description: "Meet Luiz Alves - CFA, CAIA, and vibe builder. AI tools, templates, and open source experiments at Fly Labs.",
        keywords: "Luiz Alves, CFA, CAIA, indie maker, AI builder, open source, tools, templates",
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
              I'm Luiz Alves. CFA, CAIA, vibe builder. I ship tools and templates with AI and no-code. All open source.
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
              You start with a real problem, usually your own. You build something small. You share it with the world.
            </p>
          </blockquote>
        </motion.div>

        {/* Story blocks */}
        <div className="max-w-5xl mx-auto space-y-20">

          {/* Journey Timeline */}
          <motion.section {...fadeUp} transition={{ duration: 0.5 }}>
            <h2 className="text-sm font-semibold uppercase tracking-widest text-primary mb-8">The journey</h2>
            <div className="relative">
              <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />
              <div className="space-y-8">
                {milestones.map((m, i) => (
                  <motion.div
                    key={m.phase}
                    {...fadeUp}
                    transition={{ duration: 0.3, delay: i * 0.08 }}
                    className="relative pl-8"
                  >
                    <div className={`absolute left-0 top-1.5 w-[15px] h-[15px] rounded-full border-2 border-primary ${i === milestones.length - 1 ? 'bg-primary' : 'bg-background'}`} />
                    <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">{m.phase}</p>
                    <h3 className="text-lg font-bold text-foreground mb-2">{m.title}</h3>
                    <p className="text-base text-muted-foreground font-medium leading-relaxed">{m.description}</p>
                    {m.link && (
                      <Link to={m.link.to} className="inline-flex items-center text-sm font-semibold text-primary hover:underline mt-2">
                        {m.link.label} <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Link>
                    )}
                  </motion.div>
                ))}
              </div>
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
                { text: 'Idea Lab - 7 sources, AI-scored, validated against real conversations', link: '/ideas' },
              ].map((item) => (
                <li key={item.text}>
                  <Link to={item.link} className="inline-flex items-center text-base md:text-lg text-muted-foreground font-medium hover:text-primary transition-colors">
                    <span className="w-2 h-2 rounded-full bg-primary mr-3 shrink-0" />
                    {item.text}
                    <ArrowRight className="w-3.5 h-3.5 ml-2 opacity-0 group-hover:opacity-100" />
                  </Link>
                </li>
              ))}
            </ul>
          </motion.section>

          {/* The approach */}
          <motion.section {...fadeUp} transition={{ duration: 0.5 }}>
            <h2 className="text-sm font-semibold uppercase tracking-widest text-primary mb-6">The approach</h2>
            <div className="space-y-5 text-base md:text-lg text-muted-foreground font-medium leading-relaxed">
              <p>
                AI and no-code changed everything. What used to take a team and months of work, one person can now ship in a weekend. You've probably heard of <span className="text-primary font-bold">vibe coding</span> - Andrej Karpathy's concept of fully giving in to AI-assisted development. There's also vibe marketing, vibe design, entire workflows being reimagined.
              </p>
              <p>
                <span className="text-primary font-bold">Vibe building</span> is the natural extension of all of that. It's the whole picture. No investors, no pitch decks, no growth-at-all-costs pressure. Just you, your curiosity, and the joy of making something useful.
              </p>
              <p>
                Every project teaches you something you didn't expect. One day you're learning APIs, the next you're figuring out how to write copy that actually connects with people. It's the ultimate creative side hustle, and honestly, it doesn't feel like work at all.
              </p>
            </div>
          </motion.section>

          {/* What Fly Labs is + Closing */}
          <motion.section {...fadeUp} transition={{ duration: 0.5 }}>
            <h2 className="text-sm font-semibold uppercase tracking-widest text-primary mb-6">What is Fly Labs</h2>
            <div className="space-y-5 text-base md:text-lg text-muted-foreground font-medium leading-relaxed mb-8">
              <p>
                Fly Labs is where all of that lives. The tools I build for myself, the templates I wish existed, the experiments that might go somewhere or might just be fun to try. Everything here is open, free, and built with the same energy: solve a real problem, learn along the way, share it openly.
              </p>
              <p className="text-foreground font-bold text-lg md:text-xl">
                If you've ever had an idea stuck in your head and wondered "what if I just built it?"... you're in the right place.
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
