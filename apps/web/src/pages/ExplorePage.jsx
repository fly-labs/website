
import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Lock, ArrowRight } from 'lucide-react';
import { PageLayout } from '@/components/PageLayout.jsx';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import { projects, categories } from '@/lib/data/projects.js';
import { trackEvent } from '@/lib/analytics.js';

const ExplorePage = () => {
  const { isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = categories.includes(searchParams.get('category')) ? searchParams.get('category') : 'All';
  const [activeCategory, setActiveCategory] = useState(initialCategory);

  const filteredProjects = activeCategory === 'All'
    ? projects
    : projects.filter(p => p.category === activeCategory);

  return (
    <PageLayout
      seo={{
        title: "Browse Free AI Tools & Templates",
        description: "Browse all Fly Labs projects. AI prompts, automation templates, micro tools, and no-code experiments. Free and open source.",
        url: "https://flylabs.fun/explore",
      }}
      className="pt-32 pb-24"
    >
      <div className="container mx-auto px-6">
        <div className="max-w-7xl mx-auto">

          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto text-center mb-14"
          >
            <h1 className="text-4xl md:text-7xl font-black mb-5 tracking-tight">The Playground</h1>
            <p className="text-lg md:text-xl text-muted-foreground font-medium max-w-xl mx-auto leading-relaxed">
              AI prompts, templates, and micro tools. All free, all open source.
            </p>
          </motion.div>

          {/* Filter Pills */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="relative mb-10 -mx-6 px-6 overflow-x-auto scrollbar-hide"
          >
            <div className="flex justify-center gap-1.5 min-w-max mx-auto">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => { setActiveCategory(cat); setSearchParams(cat === 'All' ? {} : { category: cat }); }}
                  className="relative px-4 py-2 rounded-full text-sm font-medium transition-colors" aria-pressed={activeCategory === cat}
                >
                  {activeCategory === cat && (
                    <motion.span
                      layoutId="activeCategory"
                      className="absolute inset-0 bg-primary/10 border border-primary/30 rounded-full"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className={`relative z-10 ${activeCategory === cat ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                    {cat}
                  </span>
                </button>
              ))}
            </div>
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-background to-transparent pointer-events-none md:hidden" />
          </motion.div>

          {/* Project Grid */}
          <AnimatePresence mode="popLayout">
            {filteredProjects.length === 0 ? (
              <motion.p
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center text-muted-foreground py-20"
              >
                Nothing here yet. But stay tuned.
              </motion.p>
            ) : (
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 xl:gap-4"
              >
                {filteredProjects.map((project, i) => {
                  const isLocked = project.isGated && !isAuthenticated;

                  return (
                    <motion.div
                      key={project.title}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      transition={{ duration: 0.3, delay: i * 0.04 }}
                    >
                      <Link
                        to={project.link}
                        className="group flex flex-col h-full p-5 md:p-6 rounded-xl border border-border/60 bg-card/50 hover:bg-card hover:border-border transition-colors duration-200"
                        onClick={() => trackEvent('project_click', { project: project.title, category: project.category })}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className={`w-10 h-10 rounded-lg ${project.bgColor} ${project.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                            <project.icon className="w-5 h-5" />
                          </div>
                          <div className="flex items-center gap-2">
                            {isLocked && (
                              <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                            )}
                            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                              project.status === 'Live' ? 'bg-primary/10 text-primary' :
                              project.status === 'Beta' ? 'bg-blue-500/10 text-blue-500' :
                              'bg-orange-500/10 text-orange-500'
                            }`}>
                              {project.status}
                            </span>
                          </div>
                        </div>

                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-1.5">
                          {project.title}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed flex-grow mb-4">
                          {project.description}
                        </p>

                        <span className="inline-flex items-center text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors mt-auto">
                          {isLocked ? 'Free account required' : 'Check it out'}
                          <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform duration-200" />
                        </span>
                      </Link>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </PageLayout>
  );
};

export default ExplorePage;
