
import React from 'react';
import { Link } from 'react-router-dom';
import { Youtube, Github, Linkedin, Mail, BookOpen, ArrowRight, Terminal } from 'lucide-react';
import { GitHubHeatmap } from '@/components/GitHubHeatmap.jsx';
import { PageLayout } from '@/components/PageLayout.jsx';
import { XIcon } from '@/components/XIcon.jsx';
import { motion } from 'framer-motion';
import { fadeUp } from '@/lib/animations.js';

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
        title: "Luiz Alves | Builder, Portfolio Manager & Creator",
        description: "Meet Luiz Alves, CFA, CAIA. The story behind Fly Labs, vibe building, and building real products with AI and no-code tools.",
        keywords: "Luiz Alves, CFA, CAIA, vibe building, vibe coding, indie maker, no-code, AI builder, portfolio manager",
        url: "https://flylabs.fun/about",
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
                className="w-44 h-44 md:w-56 md:h-56 object-cover rounded-2xl border border-border shadow-xl grayscale hover:grayscale-0 transition-all duration-700"
              />
            </div>
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-foreground mb-4">
              Nobody asked me to build any of this. I did it anyway, for fun.
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground font-medium leading-relaxed mb-6">
              I'm Luiz Alves. CFA, CAIA - that's the day job. By night I ship tools, templates, and tiny products with AI and no-code.
            </p>
            <div className="flex flex-wrap gap-2">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  {...(s.external ? { target: '_blank', rel: 'noreferrer' } : {})}
                  className="p-2.5 rounded-lg border border-border bg-card hover:bg-muted transition-colors"
                  title={s.label}
                  aria-label={s.label}
                >
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                </a>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Story blocks */}
        <div className="max-w-5xl mx-auto space-y-20">

          {/* Block 1: How it started */}
          <motion.section {...fadeUp} transition={{ duration: 0.5 }}>
            <h2 className="text-sm font-semibold uppercase tracking-widest text-primary mb-6">How it started</h2>
            <div className="space-y-5 text-base md:text-lg text-muted-foreground font-medium leading-relaxed">
              <p>
                It all began with a small frustration. I wanted to sync my Garmin watch data into Notion and nothing out there did that. So I built it myself, put it on GitHub, and people actually started using it.
              </p>
              <p>
                That tiny moment changed something in me. I realized that if I have a problem, chances are someone else has the same one. And if I can build the solution, why not share it?
              </p>
              <Link to="/templates/garmin-to-notion" className="inline-flex items-center text-sm font-semibold text-primary hover:underline">
                See the Garmin to Notion integration <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>
          </motion.section>

          {/* Block: Building in Public */}
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

          {/* Block 2: Vibe building */}
          <motion.section {...fadeUp} transition={{ duration: 0.5 }}>
            <h2 className="text-sm font-semibold uppercase tracking-widest text-primary mb-6">What is vibe building</h2>
            <div className="space-y-5 text-base md:text-lg text-muted-foreground font-medium leading-relaxed">
              <p>
                AI and no-code changed everything. What used to take a team and months of work, one person can now ship in a weekend. You've probably heard of <span className="text-primary font-bold">vibe coding</span> - Andrej Karpathy's concept of fully giving in to AI-assisted development. There's also vibe marketing, vibe design, entire workflows being reimagined.
              </p>
              <p>
                <span className="text-primary font-bold">Vibe building</span> is the natural extension of all of that. It's the whole picture. You start with a real problem, usually your own. You build something small. You share it with the world. No investors, no pitch decks, no growth-at-all-costs pressure. Just you, your curiosity, and the joy of making something useful.
              </p>
              <p>
                Every project teaches you something you didn't expect. One day you're learning APIs, the next you're figuring out how to write copy that actually connects with people. It's the ultimate creative side hustle, and honestly, it doesn't feel like work at all.
              </p>
            </div>
          </motion.section>

          {/* Block 4: What Fly Labs is */}
          <motion.section {...fadeUp} transition={{ duration: 0.5 }}>
            <h2 className="text-sm font-semibold uppercase tracking-widest text-primary mb-6">What is Fly Labs</h2>
            <div className="space-y-5 text-base md:text-lg text-muted-foreground font-medium leading-relaxed">
              <p>
                Fly Labs is where all of that lives. The tools I build for myself, the templates I wish existed, the experiments that might go somewhere or might just be fun to try. Everything here is open, free, and built with the same energy: solve a real problem, learn along the way, share it openly.
              </p>
              <p className="text-foreground font-bold text-lg md:text-xl">
                If you've ever had an idea stuck in your head and wondered "what if I just built it?"... you're in the right place.
              </p>
            </div>
          </motion.section>

          {/* CTA */}
          <motion.section {...fadeUp} transition={{ duration: 0.5 }} className="border-t border-border/50 pt-12 text-center">
            <p className="text-muted-foreground font-medium mb-6">
              Curious? Go explore what I've been building.
            </p>
            <Link
              to="/explore"
              className="inline-flex items-center px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
            >
              Explore The Lab <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </motion.section>

          <motion.section {...fadeUp} transition={{ duration: 0.5 }} className="text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-4">Newsletter</p>
            <p className="text-muted-foreground font-medium mb-6 max-w-lg mx-auto">
              I write a newsletter called Fala Comigo about building, shipping, and the maker journey. In English and Portuguese. Always free.
            </p>
            <a
              href="https://falacomigo.substack.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center text-sm font-semibold text-primary hover:underline"
            >
              Subscribe on Substack <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </a>
          </motion.section>

        </div>
      </div>
    </PageLayout>
  );
};

export default AboutPage;
