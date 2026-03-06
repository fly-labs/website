
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, LayoutTemplate, ArrowRight, Activity, Globe, ListChecks, FileText } from 'lucide-react';
import { PageLayout } from '@/components/PageLayout.jsx';
import { motion } from 'framer-motion';

const templates = [
  {
    id: 'garmin-to-notion',
    title: 'Garmin to Notion Sync',
    description: 'Automatically sync your Garmin workouts to a Notion database. Set it and forget it.',
    type: 'Notion',
    icon: Activity,
    path: '/templates/garmin-to-notion',
    color: 'text-secondary',
    bg: 'bg-secondary/10',
    border: 'border-secondary/20',
  },
  {
    id: 'website-blueprint',
    title: 'Website Blueprint',
    description: 'See exactly how I built this site. Full stack breakdown, architecture, and design decisions.',
    type: 'Development',
    icon: Globe,
    path: '/templates/website-blueprint',
    color: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/20',
  },
  {
    id: 'launch-checklist',
    title: 'Launch Checklist',
    description: 'A step-by-step Notion template to take your idea from zero to launched. Based on The $100 Startup.',
    type: 'Notion',
    icon: ListChecks,
    path: '/templates/launch-checklist',
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
  },
  {
    id: 'one-page-business-plan',
    title: 'One-Page Business Plan',
    description: 'Answer five questions. Get clarity on your entire business. Inspired by The $100 Startup.',
    type: 'Notion',
    icon: FileText,
    path: '/templates/one-page-business-plan',
    color: 'text-violet-500',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
  },
];

const TemplatesPage = () => {

  return (
    <PageLayout
      seo={{
        title: "Notion Templates & Developer Resources",
        description: "Systems, tools, and blueprints built for real use. Notion templates for launches, business plans, fitness tracking, and full website architecture breakdowns.",
        keywords: "Notion templates, developer resources, launch checklist, business plan template, website blueprint, Garmin Notion",
        url: "https://flylabs.fun/templates",
      }}
      className="pt-32 pb-24"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto px-6"
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <Link to="/explore" className="inline-flex items-center text-muted-foreground hover:text-foreground font-bold transition-colors bg-card px-4 py-2 rounded-xl border border-border shadow-sm">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Playground
            </Link>
          </div>

          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6 mb-16">
            <div className="bg-secondary/10 w-14 h-14 md:w-20 md:h-20 rounded-2xl flex items-center justify-center border border-secondary/20 shrink-0 shadow-inner">
              <LayoutTemplate className="w-7 h-7 md:w-10 md:h-10 text-secondary" />
            </div>
            <div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tight">Templates</h1>
              <p className="text-lg md:text-xl text-muted-foreground font-bold mt-2">Systems, tools, and blueprints I built for real use. Yours for free.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 xl:gap-8">
            {templates.map((template, index) => (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                key={template.id}
              >
                <Link
                  to={template.path}
                  className="group block h-full cursor-pointer"
                >
                  <div className="card-playful h-full flex flex-col bg-card overflow-hidden border-2 border-border hover:border-foreground/20">
                    {/* Card Header / Image Area */}
                    <div className={`h-48 ${template.bg} border-b border-border relative flex items-center justify-center overflow-hidden`}>
                      <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
                      <template.icon className={`w-16 h-16 ${template.color} relative z-10 group-hover:scale-110 transition-transform duration-500`} />
                      <span className={`absolute top-3 right-3 z-10 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                        template.type === 'Notion' ? 'bg-secondary/10 text-secondary border-secondary/20' :
                        'bg-primary/10 text-primary border-primary/20'
                      }`}>
                        {template.type}
                      </span>
                    </div>

                    {/* Card Content */}
                    <div className="p-6 flex flex-col flex-grow">
                      <h3 className="text-2xl font-black mb-3 group-hover:text-secondary transition-colors">
                        {template.title}
                      </h3>

                      <p className="text-muted-foreground font-medium mb-6 text-sm leading-relaxed flex-grow">
                        {template.description}
                      </p>

                      <div className="mt-auto flex items-center font-black text-foreground">
                        View Template <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-2 transition-transform" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

        </div>
      </motion.div>
    </PageLayout>
  );
};

export default TemplatesPage;
