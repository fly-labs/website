
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ListChecks, Clock, MessageSquare, Eye, Megaphone, Rocket, BarChart3 } from 'lucide-react';
import { PageLayout } from '@/components/PageLayout.jsx';

import { motion } from 'framer-motion';
import { fadeUp } from '@/lib/animations.js';

const phases = [
  {
    icon: Eye,
    title: 'The Big Picture',
    items: ['Define your vision and what success looks like', 'Identify your target audience and their biggest pain', 'Set 1-3 measurable goals for launch'],
  },
  {
    icon: Megaphone,
    title: 'Before Launch',
    items: ['Prepare your landing page and messaging', 'Build your launch asset list (screenshots, copy, links)', 'Line up your distribution channels'],
  },
  {
    icon: Rocket,
    title: 'Launch Day',
    items: ['Execute your launch sequence step by step', 'Engage with early users and respond to feedback', 'Track your key metrics in real time'],
  },
  {
    icon: BarChart3,
    title: 'Post-Launch',
    items: ['Send follow-up messages and thank-you notes', 'Review what worked and what didn\'t', 'Plan your next iteration based on real data'],
  },
];

const LaunchChecklistPage = () => {
  return (
    <PageLayout
      seo={{
        title: "Launch Checklist - From Idea to Shipped Product",
        description: "A step-by-step Notion template to take your idea from zero to shipped. Four phases based on The $100 Startup framework. Plan, build, launch, and iterate.",
        keywords: "launch checklist, Notion template, startup launch, product launch, The $100 Startup, ship product",
        url: "https://flylabs.fun/templates/launch-checklist",
      }}
      className="pt-32 pb-24"
    >
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto">

          {/* Back link */}
          <Link to="/explore" className="inline-flex items-center text-muted-foreground hover:text-foreground font-bold mb-8 transition-colors bg-card px-4 py-2 rounded-xl border border-border shadow-sm">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Playground
          </Link>

          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-16"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 font-bold text-sm border border-amber-500/20 mb-6">
              <ListChecks className="w-4 h-4" /> Notion Template
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight mb-6">
              Launch <span className="text-primary">Checklist</span>
            </h1>
            <p className="text-xl text-muted-foreground font-bold leading-relaxed max-w-2xl">
              Stop overthinking your launch. This Notion template breaks it down into four phases so you know exactly what to do, when to do it, and what to track.
            </p>
          </motion.div>

          {/* Builder's Note */}
          <motion.div
            {...fadeUp}
            className="bg-primary/5 border border-primary/20 rounded-2xl p-6 md:p-8 mb-16 flex gap-4 items-start"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <MessageSquare className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-primary uppercase tracking-wider mb-2">Builder's Note</p>
              <p className="text-muted-foreground leading-relaxed">
                Most people don't fail at launching. They fail at knowing what to do next. This checklist exists because I needed it myself. It turns the chaos of "I have an idea" into a clear sequence of steps. Nothing fancy, just the stuff that actually matters.
              </p>
            </div>
          </motion.div>

          {/* What's Inside */}
          <motion.div {...fadeUp} className="mb-16">
            <h2 className="text-3xl font-black tracking-tight mb-8">What's Inside</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {phases.map((phase, i) => (
                <motion.div
                  key={phase.title}
                  {...fadeUp}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className="card-playful p-6 bg-card"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                      <phase.icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-black">{phase.title}</h3>
                  </div>
                  <ul className="space-y-2">
                    {phase.items.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500/50 mt-1.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div
            {...fadeUp}
            className="bg-amber-500/5 border border-amber-500/20 rounded-3xl p-8 md:p-12 text-center mb-12"
          >
            <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-4">This template is being built</h2>
            <p className="text-muted-foreground font-medium mb-8 max-w-lg mx-auto">
              I'm still crafting this Notion template to make sure it's actually useful. Subscribe to the newsletter to get notified when it drops.
            </p>
            <span className="inline-flex items-center gap-2 h-12 px-6 md:h-14 md:px-8 rounded-xl bg-muted text-muted-foreground text-base md:text-lg font-semibold border border-border cursor-default">
              <Clock className="w-5 h-5" /> Coming Soon
            </span>
          </motion.div>

          {/* Attribution */}
          <p className="text-center text-sm text-muted-foreground/60 font-medium">
            Inspired by <em>The $100 Startup</em> by Chris Guillebeau
          </p>

        </div>
      </div>
    </PageLayout>
  );
};

export default LaunchChecklistPage;
