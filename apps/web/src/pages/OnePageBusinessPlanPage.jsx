
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, Clock, MessageSquare } from 'lucide-react';
import { PageLayout } from '@/components/PageLayout.jsx';

import { motion } from 'framer-motion';
import { fadeUp } from '@/lib/animations.js';

const questions = [
  {
    number: '01',
    question: 'What will you sell?',
    description: 'Define your product or service in one sentence. If you can\'t explain it simply, you don\'t understand it well enough.',
  },
  {
    number: '02',
    question: 'Who will buy it?',
    description: 'Describe your ideal customer. Not a vague demographic. A real person with a real problem.',
  },
  {
    number: '03',
    question: 'How will it help people?',
    description: 'What transformation does your product create? People buy outcomes, not features.',
  },
  {
    number: '04',
    question: 'How will you get paid?',
    description: 'Your pricing model, payment method, and revenue target. Keep it dead simple.',
  },
  {
    number: '05',
    question: 'How will people find you?',
    description: 'Your top 2-3 distribution channels. Focus beats breadth every time.',
  },
];

const OnePageBusinessPlanPage = () => {
  return (
    <PageLayout
      seo={{
        title: "One-Page Business Plan | Fly Labs",
        description: "Answer five questions and get clarity on your entire business. A free Notion template inspired by The $100 Startup. No fluff, just the essentials that matter.",
        keywords: "business plan, one page business plan, Notion template, startup planning, The $100 Startup, free template",
        url: "https://flylabs.fun/templates/one-page-business-plan",
        schema: [
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://flylabs.fun/" },
              { "@type": "ListItem", "position": 2, "name": "Templates", "item": "https://flylabs.fun/templates" },
              { "@type": "ListItem", "position": 3, "name": "One-Page Business Plan" },
            ],
          },
        ],
      }}
      className="pt-32 pb-24"
    >
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto">

          {/* Back link */}
          <Link to="/explore" className="inline-flex items-center text-muted-foreground hover:text-foreground font-bold mb-8 transition-colors bg-card px-4 py-2 rounded-xl border border-border shadow-sm">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Explore
          </Link>

          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-16"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 text-violet-500 font-bold text-sm border border-violet-500/20 mb-6">
              <FileText className="w-4 h-4" /> Notion Template
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight mb-6">
              One-Page <span className="text-primary">Business Plan</span>
            </h1>
            <p className="text-xl text-muted-foreground font-bold leading-relaxed max-w-2xl">
              Five questions. That's it. Answer them and you'll know more about your business than most founders do after months of planning.
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
                Every project I've launched started with these five questions scribbled on a napkin. The format forced me to cut the fluff and focus on what actually matters. If your plan doesn't fit on one page, it's too complicated to execute.
              </p>
            </div>
          </motion.div>

          {/* The Five Questions */}
          <motion.div {...fadeUp} className="mb-16">
            <h2 className="text-3xl font-black tracking-tight mb-8">The Five Questions</h2>
            <div className="space-y-4">
              {questions.map((q, i) => (
                <motion.div
                  key={q.number}
                  {...fadeUp}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className="card-playful p-6 bg-card flex gap-5"
                >
                  <span className="text-3xl font-black text-violet-500/30 shrink-0 leading-none pt-1">{q.number}</span>
                  <div>
                    <h3 className="text-lg font-black mb-1">{q.question}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{q.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div
            {...fadeUp}
            className="bg-violet-500/5 border border-violet-500/20 rounded-3xl p-8 md:p-12 text-center mb-12"
          >
            <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-4">This template is being built</h2>
            <p className="text-muted-foreground font-medium mb-8 max-w-lg mx-auto">
              I'm testing this on real ideas before shipping it. Subscribe to the newsletter and I'll let you know when it's ready.
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

export default OnePageBusinessPlanPage;
