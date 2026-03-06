
import React, { useState, useEffect } from 'react';
import { Send, ChevronUp, Zap, ArrowRight, X, Loader2, CheckCircle2, Activity, Globe, Flame } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast.js';
import { PageLayout } from '@/components/PageLayout.jsx';
import supabase from '@/lib/supabaseClient.js';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeUp } from '@/lib/animations.js';
import { useAuth } from '@/contexts/AuthContext.jsx';

import { categories, industries, statusConfig, sortOptions } from '@/lib/data/ideas.js';
import { timeAgo, isValidEmail } from '@/lib/utils.js';
import { trackEvent } from '@/lib/analytics.js';

const IdeaSubmissionPage = () => {
  const { toast } = useToast();
  const { currentUser, profile, isAuthenticated } = useAuth();
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('hot');
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [votedIds, setVotedIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('voted_ideas') || '[]');
    } catch {
      return [];
    }
  });
  const [activeType, setActiveType] = useState('All');
  const [activeIndustry, setActiveIndustry] = useState('All');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    idea_title: '',
    idea_description: '',
    category: 'Tool',
    industry: '',
  });

  // Pre-fill form for logged-in users
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      setFormData((prev) => ({
        ...prev,
        email: prev.email || currentUser.email || '',
        name: prev.name || profile?.name || currentUser.user_metadata?.full_name || '',
      }));
    }
  }, [isAuthenticated, currentUser, profile]);

  // Fetch ideas on mount
  useEffect(() => {
    const fetchIdeas = async () => {
      try {
        const { data, error } = await supabase
          .from('ideas')
          .select('*')
          .eq('approved', true);
        if (error) throw error;
        setIdeas(data || []);
      } catch (error) {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchIdeas();
  }, []);

  // Time-decay hot score: votes / (hoursAge + 2)^1.5
  const getHotScore = (idea) => {
    const votes = idea.votes || 0;
    const hoursAge = (Date.now() - new Date(idea.created_at).getTime()) / (1000 * 60 * 60);
    return votes / Math.pow(hoursAge + 2, 1.5);
  };

  const TRENDING_THRESHOLD = 5;

  // Filter + Sort logic
  const filtered = ideas
    .filter(i => activeType === 'All' || i.category === activeType)
    .filter(i => activeIndustry === 'All' || i.industry === activeIndustry);
  const sorted = sortBy === 'hot'
    ? [...filtered].sort((a, b) => getHotScore(b) - getHotScore(a))
    : [...filtered].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  // Industries that have at least one idea (for dynamic filter)
  const activeIndustries = industries.filter(ind =>
    ideas.some(i => i.industry === ind.value)
  );

  // Vote handler
  const handleVote = async (id) => {
    if (votedIds.includes(id)) return;

    // Optimistic update
    const newVotedIds = [...votedIds, id];
    setVotedIds(newVotedIds);
    localStorage.setItem('voted_ideas', JSON.stringify(newVotedIds));
    setIdeas((prev) =>
      prev.map((idea) =>
        idea.id === id ? { ...idea, votes: (idea.votes || 0) + 1 } : idea
      )
    );

    // Atomic increment via RPC (race-safe)
    const idea = ideas.find(i => i.id === id);
    trackEvent('idea_voted', {
      idea_id: id,
      idea_title: idea?.idea_title,
      category: idea?.category,
    });

    const { error } = await supabase.rpc('increment_vote', { idea_id: id });
    if (error) {
      // Revert optimistic update
      setVotedIds((prev) => prev.filter((vid) => vid !== id));
      localStorage.setItem('voted_ideas', JSON.stringify(votedIds));
      setIdeas((prev) =>
        prev.map((idea) =>
          idea.id === id ? { ...idea, votes: Math.max((idea.votes || 0) - 1, 0) } : idea
        )
      );
    }
  };

  // Form handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.idea_title || !formData.idea_description) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }
    if (!isValidEmail(formData.email.trim())) {
      toast({ title: 'Invalid email', description: 'Please enter a valid email address.', variant: 'destructive' });
      return;
    }

    const VALID_CATEGORIES = categories.map(c => c.value);
    if (!VALID_CATEGORIES.includes(formData.category)) {
      toast({ title: 'Invalid category', variant: 'destructive' });
      return;
    }
    if (formData.idea_title.length > 100) {
      toast({ title: 'Title too long', description: 'Max 100 characters.', variant: 'destructive' });
      return;
    }
    if (formData.idea_description.length > 1000) {
      toast({ title: 'Description too long', description: 'Max 1000 characters.', variant: 'destructive' });
      return;
    }
    if (formData.name && formData.name.length > 100) {
      toast({ title: 'Name too long', description: 'Max 100 characters.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const sanitized = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        idea_title: formData.idea_title.trim(),
        idea_description: formData.idea_description.trim(),
        category: formData.category,
        ...(formData.industry && { industry: formData.industry }),
      };
      const { error } = await supabase.from('ideas').insert(sanitized);
      if (error) throw error;

      trackEvent('idea_submitted', { category: formData.category });

      toast({
        title: 'Idea received!',
        description: "I'll review it and it will show up on the board soon.",
      });

      setFormData({
        name: '',
        email: '',
        idea_title: '',
        idea_description: '',
        category: 'Tool',
        industry: '',
      });
      setShowModal(false);
    } catch (error) {
      toast({
        title: 'Something went wrong',
        description: "Couldn't send your idea. Please try again.",
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <PageLayout
        seo={{
          title: "Ideas",
          description: "Got a tool you wish existed? Share your idea and vote on others. The best projects start as someone else's problem.",
          keywords: "submit idea, project idea, community, vote, tool request",
          url: "https://flylabs.fun/ideas",
        }}
        className="pt-32 pb-24"
      >
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">

            {/* Hero */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-10"
            >
              <h1 className="text-4xl md:text-7xl font-black mb-5 tracking-tight">
                The <span className="text-primary">Idea Board</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground font-medium max-w-xl mx-auto leading-relaxed mb-6">
                Got something you wish existed? Drop it here. If it resonates, I'll build it.
              </p>
              <p className="text-sm text-muted-foreground/70 font-medium">
                Share it{' '}<span className="text-muted-foreground/40">&middot;</span>{' '}Vote on it{' '}<span className="text-muted-foreground/40">&middot;</span>{' '}I build it
              </p>
            </motion.div>

            {/* Shipped from the board */}
            <motion.div {...fadeUp} transition={{ duration: 0.5 }} className="mb-10">
              <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-4">
                Shipped from the board
              </p>
              <div className="flex flex-col gap-3">
                <Link
                  to="/templates/garmin-to-notion"
                  className="group flex items-start gap-4 p-5 rounded-xl border border-border/60 bg-card/50 hover:bg-card hover:border-border transition-colors duration-200"
                >
                  <div className="w-10 h-10 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-200">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        Garmin to Notion Sync
                      </h3>
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        <CheckCircle2 className="w-3 h-3" /> Shipped
                      </span>
                      <span className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        Sport & Fitness
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                      Automatically sync your Garmin health data to Notion. Born from a community request, now live and open source.
                    </p>
                    <span className="inline-flex items-center text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors">
                      Check it out <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform duration-200" />
                    </span>
                  </div>
                </Link>

                <Link
                  to="/templates/website-blueprint"
                  className="group flex items-start gap-4 p-5 rounded-xl border border-border/60 bg-card/50 hover:bg-card hover:border-border transition-colors duration-200"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-200">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        Website Blueprint
                      </h3>
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        <CheckCircle2 className="w-3 h-3" /> Shipped
                      </span>
                      <span className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        Dev
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                      Full stack breakdown of how this site was built. Open source and free to fork.
                    </p>
                    <span className="inline-flex items-center text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors">
                      Check it out <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform duration-200" />
                    </span>
                  </div>
                </Link>
              </div>
            </motion.div>

            {/* Toolbar: Sort + Submit */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="space-y-3 mb-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex gap-1.5">
                  {sortOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setSortBy(opt.value)}
                      className="relative px-4 py-2 rounded-full text-sm font-medium transition-colors"
                    >
                      {sortBy === opt.value && (
                        <motion.span
                          layoutId="activeSort"
                          className="absolute inset-0 bg-primary/10 border border-primary/30 rounded-full"
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        />
                      )}
                      <span className={`relative z-10 ${sortBy === opt.value ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                        {opt.label}
                      </span>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setShowModal(true)}
                  className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
                >
                  Submit an idea <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Type filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground/60 shrink-0">Type:</span>
                <div className="flex gap-1.5 flex-wrap">
                  {['All', ...categories.map(c => c.value)].map((type) => (
                    <button
                      key={type}
                      onClick={() => setActiveType(type)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        activeType === type
                          ? 'bg-primary/10 text-primary border border-primary/30'
                          : 'text-muted-foreground hover:text-foreground bg-muted/50 border border-transparent'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Industry filter */}
              {activeIndustries.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground/60 shrink-0">Industry:</span>
                  <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                    <button
                      onClick={() => setActiveIndustry('All')}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors shrink-0 ${
                        activeIndustry === 'All'
                          ? 'bg-primary/10 text-primary border border-primary/30'
                          : 'text-muted-foreground hover:text-foreground bg-muted/50 border border-transparent'
                      }`}
                    >
                      All
                    </button>
                    {activeIndustries.map((ind) => (
                      <button
                        key={ind.value}
                        onClick={() => setActiveIndustry(ind.value)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors shrink-0 ${
                          activeIndustry === ind.value
                            ? 'bg-primary/10 text-primary border border-primary/30'
                            : 'text-muted-foreground hover:text-foreground bg-muted/50 border border-transparent'
                        }`}
                      >
                        {ind.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>

            {/* ProblemHunt credit */}
            <div className="flex items-center gap-2 mb-3 px-1">
              <span className="text-xs text-muted-foreground/60 font-medium">
                Real-world problems sourced from{' '}
                <a
                  href="https://problemhunt.pro"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline font-semibold"
                  onClick={() => trackEvent('outbound_click', { link_url: 'https://problemhunt.pro', link_label: 'ProblemHunt', location: 'ideas' })}
                >
                  ProblemHunt
                </a>
              </span>
            </div>

            {/* Ideas board */}
            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : sorted.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20"
              >
                <Zap className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground font-medium">No ideas yet. Be the first.</p>
              </motion.div>
            ) : (
              <motion.div
                className="flex flex-col gap-3"
              >
                <AnimatePresence mode="wait">
                  {sorted.map((idea, i) => {
                    const hasVoted = votedIds.includes(idea.id);
                    const status = statusConfig[idea.status] || statusConfig.open;
                    const dotColor = idea.status === 'building'
                      ? 'bg-blue-500'
                      : idea.status === 'shipped'
                        ? 'bg-primary'
                        : 'bg-orange-500';

                    return (
                      <motion.div
                        key={idea.id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.97 }}
                        transition={{ duration: 0.3, delay: i * 0.04 }}
                        className={`group px-5 py-4 rounded-xl border border-border/60 bg-card/50 hover:bg-card hover:border-border transition-colors duration-200 ${
                          hasVoted ? 'border-l-2 border-l-primary/40' : ''
                        }`}
                      >
                        <div className="flex gap-3.5">
                          {/* Vote button */}
                          <button
                            onClick={() => handleVote(idea.id)}
                            disabled={hasVoted}
                            aria-label={`Vote for ${idea.idea_title}${hasVoted ? ' (voted)' : ''}`}
                            className={`flex flex-col items-center gap-0.5 pt-0.5 shrink-0 transition-colors duration-200 ${
                              hasVoted
                                ? 'text-primary cursor-default'
                                : 'text-muted-foreground hover:text-primary cursor-pointer'
                            }`}
                          >
                            <motion.div
                              whileTap={!hasVoted ? { scale: 1.3 } : {}}
                              transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                            >
                              <ChevronUp className={`w-5 h-5 ${hasVoted ? 'stroke-[2.5]' : ''}`} />
                            </motion.div>
                            <AnimatePresence mode="wait">
                              <motion.span
                                key={idea.votes || 0}
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                transition={{ duration: 0.15 }}
                                className="text-xs font-semibold tabular-nums"
                              >
                                {idea.votes || 0}
                              </motion.span>
                            </AnimatePresence>
                          </button>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-foreground leading-snug group-hover:text-primary transition-colors">
                                {idea.idea_title}
                              </h3>
                              {(idea.votes || 0) >= TRENDING_THRESHOLD && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-500 bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20 shrink-0">
                                  <Flame className="w-3 h-3" /> Trending
                                </span>
                              )}
                            </div>
                            {idea.idea_description && idea.idea_description !== idea.idea_title && (
                              <p className="text-sm text-muted-foreground leading-relaxed mb-2 line-clamp-2">
                                {idea.idea_description}
                              </p>
                            )}
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70 flex-wrap">
                              <span>
                                {idea.source === 'problemhunt' ? (
                                  <a
                                    href={idea.source_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-accent hover:underline font-medium"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      trackEvent('outbound_click', {
                                        link_url: idea.source_url,
                                        link_label: 'ProblemHunt',
                                        location: 'ideas',
                                      });
                                    }}
                                  >
                                    via ProblemHunt
                                  </a>
                                ) : (
                                  `by ${idea.name || 'Anonymous'}`
                                )}
                              </span>
                              <span className="text-muted-foreground/40">&middot;</span>
                              <span>{timeAgo(idea.created_at)}</span>
                              <span className="text-muted-foreground/40">&middot;</span>
                              <span>{idea.category || 'Other'}</span>
                              {idea.industry && (
                                <>
                                  <span className="text-muted-foreground/40">&middot;</span>
                                  <span>{industries.find(i => i.value === idea.industry)?.label || idea.industry}</span>
                                </>
                              )}
                              {idea.country && (
                                <>
                                  <span className="text-muted-foreground/40">&middot;</span>
                                  <span>{idea.country}</span>
                                </>
                              )}
                              <span className="text-muted-foreground/40">&middot;</span>
                              <span className="inline-flex items-center gap-1">
                                <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                                {status.label}
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </motion.div>
            )}

          </div>
        </div>
      </PageLayout>

      {/* Submit Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: 'spring', duration: 0.5, bounce: 0.3 }}
                role="dialog" aria-modal="true"
                className="w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl overflow-hidden pointer-events-auto relative"
              >
                {/* Decorative Background */}
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-primary/20 via-secondary/20 to-background opacity-50 pointer-events-none" />

                <button
                  onClick={() => setShowModal(false)}
                  type="button"
                  className="absolute top-4 right-4 p-3 rounded-full bg-background/50 hover:bg-muted text-muted-foreground transition-colors z-20"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="p-5 pt-10 sm:p-8 sm:pt-12 relative z-10">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-black tracking-tight mb-2">Share Your Idea</h2>
                    <p className="text-muted-foreground font-medium">
                      Rough is fine. I care about the problem, not the pitch.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label htmlFor="name" className="text-sm font-medium text-muted-foreground">
                          Name <span className="text-muted-foreground/50">(optional)</span>
                        </label>
                        <input
                          id="name"
                          name="name"
                          type="text"
                          maxLength={100}
                          placeholder="What should I call you?"
                          value={formData.name}
                          onChange={handleChange}
                          className="w-full h-11 px-4 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium text-muted-foreground">Email</label>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          required
                          placeholder="So I can follow up"
                          value={formData.email}
                          onChange={handleChange}
                          className="w-full h-11 px-4 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="idea_title" className="text-sm font-medium text-muted-foreground">What's the idea?</label>
                      <input
                        id="idea_title"
                        name="idea_title"
                        type="text"
                        required
                        maxLength={100}
                        placeholder="Give it a name"
                        value={formData.idea_title}
                        onChange={handleChange}
                        className="w-full h-11 px-4 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label htmlFor="category" className="text-sm font-medium text-muted-foreground">Type</label>
                        <div className="relative">
                          <select
                            id="category"
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            className="w-full h-11 px-4 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors appearance-none cursor-pointer"
                          >
                            {categories.map((c) => (
                              <option key={c.value} value={c.value}>{c.label}</option>
                            ))}
                          </select>
                          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                              <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="industry" className="text-sm font-medium text-muted-foreground">
                          Industry <span className="text-muted-foreground/50">(optional)</span>
                        </label>
                        <div className="relative">
                          <select
                            id="industry"
                            name="industry"
                            value={formData.industry}
                            onChange={handleChange}
                            className="w-full h-11 px-4 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors appearance-none cursor-pointer"
                          >
                            <option value="">Select industry</option>
                            {industries.map((ind) => (
                              <option key={ind.value} value={ind.value}>{ind.label}</option>
                            ))}
                          </select>
                          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                              <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="idea_description" className="text-sm font-medium text-muted-foreground">Tell me more</label>
                      <textarea
                        id="idea_description"
                        name="idea_description"
                        required
                        rows={4}
                        maxLength={1000}
                        placeholder="What problem does it solve? Who's it for? Be as rough or detailed as you want."
                        value={formData.idea_description}
                        onChange={handleChange}
                        className="w-full p-4 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors resize-y leading-relaxed"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full h-11 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>Send it <Send className="w-3.5 h-3.5" /></>
                      )}
                    </button>
                  </form>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default IdeaSubmissionPage;
