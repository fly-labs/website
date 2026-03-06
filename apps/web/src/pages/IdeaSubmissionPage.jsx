
import React, { useState, useEffect } from 'react';
import { Send, ChevronUp, ChevronLeft, ChevronRight, Zap, ArrowRight, X, Loader2, CheckCircle2, Activity, Globe, Flame, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast.js';
import { PageLayout } from '@/components/PageLayout.jsx';
import supabase from '@/lib/supabaseClient.js';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeUp } from '@/lib/animations.js';
import { useAuth } from '@/contexts/AuthContext.jsx';

import { categories, industries, statusConfig, sortOptions, sourceOptions, perPageOptions, frequencyOptions, formSteps } from '@/lib/data/ideas.js';
import { timeAgo, isValidEmail } from '@/lib/utils.js';
import { trackEvent } from '@/lib/analytics.js';

// Score tier helpers
const getScoreTier = (score) => {
  if (score >= 75) return { label: 'Exceptional', color: 'text-primary', bg: 'bg-primary/10', bar: 'bg-primary' };
  if (score >= 60) return { label: 'Strong', color: 'text-secondary', bg: 'bg-secondary/10', bar: 'bg-secondary' };
  if (score >= 45) return { label: 'Moderate', color: 'text-amber-500', bg: 'bg-amber-500/10', bar: 'bg-amber-500' };
  if (score >= 30) return { label: 'Weak', color: 'text-orange-500', bg: 'bg-orange-500/10', bar: 'bg-orange-500' };
  return { label: 'Risky', color: 'text-red-500', bg: 'bg-red-500/10', bar: 'bg-red-500' };
};

const ScoreBar = ({ score, max, color }) => {
  const pct = max > 0 ? (score / max) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full bg-muted/50 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium tabular-nums text-muted-foreground w-10 text-right">{score}/{max}</span>
    </div>
  );
};

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
  const [activeSource, setActiveSource] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [formStep, setFormStep] = useState(0);
  const [selectedIdea, setSelectedIdea] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    idea_title: '',
    idea_description: '',
    category: 'Tool',
    industry: '',
    frequency: '',
    existing_solutions: '',
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

  // Filter + Sort + Pagination pipeline
  const sourceFiltered = activeSource === 'all'
    ? ideas
    : activeSource === 'community'
      ? ideas.filter(i => !i.source || i.source === 'community')
      : ideas.filter(i => i.source === activeSource);

  const typeFiltered = activeType === 'All'
    ? sourceFiltered
    : sourceFiltered.filter(i => i.category === activeType);

  const filtered = activeIndustry === 'All'
    ? typeFiltered
    : typeFiltered.filter(i => i.industry === activeIndustry);

  const sorted = (() => {
    const arr = [...filtered];
    switch (sortBy) {
      case 'hot': return arr.sort((a, b) => getHotScore(b) - getHotScore(a));
      case 'new': return arr.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      case 'oldest': return arr.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      case 'top': return arr.sort((a, b) => (b.votes || 0) - (a.votes || 0));
      case 'hormozi': return arr.sort((a, b) => (b.hormozi_score || 0) - (a.hormozi_score || 0));
      case 'koe': return arr.sort((a, b) => (b.koe_score || 0) - (a.koe_score || 0));
      default: return arr;
    }
  })();

  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage));
  const paginated = sorted.slice((currentPage - 1) * perPage, currentPage * perPage);

  // Reset page on filter/sort/perPage change
  useEffect(() => { setCurrentPage(1); }, [activeSource, activeType, activeIndustry, sortBy, perPage]);

  // Dynamic industries based on source + type filtered results
  const activeIndustries = industries.filter(ind =>
    typeFiltered.some(i => i.industry === ind.value)
  );

  // Vote handler
  const handleVote = async (id) => {
    if (votedIds.includes(id)) return;

    const newVotedIds = [...votedIds, id];
    setVotedIds(newVotedIds);
    localStorage.setItem('voted_ideas', JSON.stringify(newVotedIds));
    setIdeas((prev) =>
      prev.map((idea) =>
        idea.id === id ? { ...idea, votes: (idea.votes || 0) + 1 } : idea
      )
    );

    const idea = ideas.find(i => i.id === id);
    trackEvent('idea_voted', {
      idea_id: id,
      idea_title: idea?.idea_title,
      category: idea?.category,
    });

    const { error } = await supabase.rpc('increment_vote', { idea_id: id });
    if (error) {
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

    if (!formData.idea_title) {
      toast({ title: 'Missing field', description: 'Please describe the problem.', variant: 'destructive' });
      return;
    }
    if (!formData.email) {
      toast({ title: 'Missing email', description: 'Please enter your email.', variant: 'destructive' });
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
    if (formData.idea_description && formData.idea_description.length > 1000) {
      toast({ title: 'Description too long', description: 'Max 1000 characters.', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      // Check rate limit
      const { data: rateCount } = await supabase.rpc('check_idea_rate_limit', { p_email: formData.email.trim().toLowerCase() });
      if (rateCount && rateCount >= 3) {
        toast({ title: "You've shared 3 ideas today", description: 'Come back tomorrow with more.', variant: 'destructive' });
        setIsSubmitting(false);
        return;
      }

      const sanitized = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        idea_title: formData.idea_title.trim(),
        idea_description: formData.idea_description?.trim() || null,
        category: formData.category,
        ...(formData.industry && { industry: formData.industry }),
        ...(formData.frequency && { frequency: formData.frequency }),
        ...(formData.existing_solutions && { existing_solutions: formData.existing_solutions.trim() }),
      };
      const { error } = await supabase.from('ideas').insert(sanitized);
      if (error) throw error;

      // Log submission for rate limiting
      await supabase.rpc('log_idea_submission', { p_email: sanitized.email });

      trackEvent('idea_submitted', { category: formData.category });

      toast({
        title: 'Idea received!',
        description: "I'll review it and score it with AI. It'll show up on the board soon.",
      });

      setFormData({
        name: '',
        email: '',
        idea_title: '',
        idea_description: '',
        category: 'Tool',
        industry: '',
        frequency: '',
        existing_solutions: '',
      });
      setFormStep(0);
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

  const clearAllFilters = () => {
    setActiveSource('all');
    setActiveType('All');
    setActiveIndustry('All');
    setSortBy('hot');
  };

  // Pagination helpers
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <>
      <PageLayout
        seo={{
          title: "Ideas",
          description: "Real problems from Reddit, ProblemHunt, and the community. Every idea scored by AI. Drop yours and watch it fly.",
          keywords: "submit idea, project idea, community, vote, tool request, hormozi score, dan koe score, reddit ideas, business opportunities",
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
              <p className="text-lg md:text-xl text-muted-foreground font-medium max-w-xl mx-auto leading-relaxed mb-4">
                We scan <span className="text-red-500 font-semibold">Reddit</span>, <span className="text-accent font-semibold">ProblemHunt</span>, and the community for real problems worth solving. AI scores them. You vote. I build the best ones.
              </p>
              <p className="text-sm text-muted-foreground/50 font-medium">
                {ideas.length} ideas{' '}<span className="text-muted-foreground/30">&middot;</span>{' '}3 sources{' '}<span className="text-muted-foreground/30">&middot;</span>{' '}AI-scored{' '}<span className="text-muted-foreground/30">&middot;</span>{' '}Updated 3x daily
              </p>
            </motion.div>

            {/* How it works callout */}
            <motion.div {...fadeUp} transition={{ duration: 0.5 }} className="mb-8">
              <div className="p-4 rounded-xl border border-accent/20 bg-accent/5">
                <div className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-1">How it works</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Every day we scan Reddit and ProblemHunt for real problems people are struggling with.
                      Community members submit their own too. AI scores every idea using Hormozi and Dan Koe frameworks.
                      The best ones get built. If your idea flies, we partner up.
                      {' '}<Link to="/scoring" className="text-accent hover:underline font-medium">How scoring works</Link>
                    </p>
                  </div>
                </div>
              </div>
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
              {/* Row 1: Sort + Submit */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                  {sortOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setSortBy(opt.value)}
                      className="relative px-4 py-2 rounded-full text-sm font-medium transition-colors shrink-0"
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
                  onClick={() => { setFormStep(0); setShowModal(true); }}
                  className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors shrink-0"
                >
                  Submit an idea <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Row 2: Source filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground/60 shrink-0">Source:</span>
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                  {sourceOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setActiveSource(opt.value)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors shrink-0 ${
                        activeSource === opt.value
                          ? 'bg-primary/10 text-primary border border-primary/30'
                          : 'text-muted-foreground hover:text-foreground bg-muted/50 border border-transparent'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Row 3: Type filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground/60 shrink-0">Type:</span>
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                  {['All', ...categories.map(c => c.value)].map((type) => (
                    <button
                      key={type}
                      onClick={() => setActiveType(type)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors shrink-0 ${
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

              {/* Row 4: Industry filter */}
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
                <p className="text-muted-foreground font-medium mb-3">No ideas match these filters.</p>
                <button
                  onClick={clearAllFilters}
                  className="text-sm text-primary font-medium hover:underline"
                >
                  Clear all filters
                </button>
              </motion.div>
            ) : (
              <>
                <motion.div className="flex flex-col gap-3">
                  <AnimatePresence mode="wait">
                    {paginated.map((idea, i) => {
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
                          onClick={() => setSelectedIdea(idea)}
                          className={`group px-5 py-4 rounded-xl border border-border/60 bg-card/50 hover:bg-card hover:border-border transition-colors duration-200 cursor-pointer ${
                            hasVoted ? 'border-l-2 border-l-primary/40' : ''
                          }`}
                        >
                          <div className="flex gap-3.5">
                            {/* Vote button */}
                            <button
                              onClick={(e) => { e.stopPropagation(); handleVote(idea.id); }}
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
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <div className="flex items-center gap-2 min-w-0">
                                  <h3 className="font-semibold text-foreground leading-snug group-hover:text-primary transition-colors">
                                    {(idea.source === 'problemhunt' || idea.source === 'reddit') && idea.source_url ? (
                                      <a
                                        href={idea.source_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          trackEvent('outbound_click', {
                                            link_url: idea.source_url,
                                            link_label: idea.idea_title,
                                            location: 'ideas',
                                          });
                                        }}
                                        className="hover:underline"
                                      >
                                        {idea.idea_title}
                                      </a>
                                    ) : (
                                      idea.idea_title
                                    )}
                                  </h3>
                                  {(idea.votes || 0) >= TRENDING_THRESHOLD && (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-500 bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20 shrink-0">
                                      <Flame className="w-3 h-3" /> Trending
                                    </span>
                                  )}
                                </div>

                                {/* Score badges */}
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {idea.hormozi_score != null && (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setSelectedIdea(idea); }}
                                      className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[11px] font-bold tabular-nums hover:bg-primary/20 transition-colors"
                                      title="Hormozi Score"
                                    >
                                      H {idea.hormozi_score}
                                    </button>
                                  )}
                                  {idea.koe_score != null && (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setSelectedIdea(idea); }}
                                      className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary/10 text-secondary text-[11px] font-bold tabular-nums hover:bg-secondary/20 transition-colors"
                                      title="Koe Score"
                                    >
                                      K {idea.koe_score}
                                    </button>
                                  )}
                                </div>
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
                                      href={idea.source_url || 'https://problemhunt.pro'}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-accent hover:underline font-medium"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        trackEvent('outbound_click', {
                                          link_url: idea.source_url || 'https://problemhunt.pro',
                                          link_label: 'ProblemHunt',
                                          location: 'ideas',
                                        });
                                      }}
                                    >
                                      via ProblemHunt
                                    </a>
                                  ) : idea.source === 'reddit' && idea.source_url ? (
                                    <a
                                      href={idea.source_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-red-500 hover:underline font-medium"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        trackEvent('outbound_click', {
                                          link_url: idea.source_url,
                                          link_label: 'Reddit',
                                          location: 'ideas',
                                        });
                                      }}
                                    >
                                      via Reddit
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

                {/* Pagination Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground/60 font-medium">Show:</span>
                    {perPageOptions.map((n) => (
                      <button
                        key={n}
                        onClick={() => setPerPage(n)}
                        className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                          perPage === n
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    {getPageNumbers().map((page, idx) => (
                      page === '...' ? (
                        <span key={`ellipsis-${idx}`} className="px-2 text-xs text-muted-foreground/50">...</span>
                      ) : (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                            currentPage === page
                              ? 'bg-primary/10 text-primary'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                          }`}
                        >
                          {page}
                        </button>
                      )
                    ))}
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <span className="text-xs text-muted-foreground/60 font-medium tabular-nums">
                    {(currentPage - 1) * perPage + 1}-{Math.min(currentPage * perPage, sorted.length)} of {sorted.length}
                  </span>
                </div>
              </>
            )}

          </div>
        </div>
      </PageLayout>

      {/* Multi-Step Submit Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setShowModal(false); setFormStep(0); }}
              className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
            />

            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: 'spring', duration: 0.5, bounce: 0.3 }}
                role="dialog" aria-modal="true"
                className="w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl overflow-hidden pointer-events-auto relative"
              >
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-primary/20 via-secondary/20 to-background opacity-50 pointer-events-none" />

                <button
                  onClick={() => { setShowModal(false); setFormStep(0); }}
                  type="button"
                  className="absolute top-4 right-4 p-3 rounded-full bg-background/50 hover:bg-muted text-muted-foreground transition-colors z-20"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="p-5 pt-10 sm:p-8 sm:pt-12 relative z-10">
                  {/* AI Scoring Pitch */}
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/5 border border-accent/10 mb-4">
                    <Zap className="w-4 h-4 text-accent shrink-0" />
                    <p className="text-xs text-muted-foreground">
                      Your idea will be scored by AI using{' '}
                      <span className="font-semibold text-foreground">Hormozi</span> and{' '}
                      <span className="font-semibold text-foreground">Dan Koe</span> frameworks.
                      Top ideas get built. Min. 1% equity if it flies.
                    </p>
                  </div>

                  {/* Step indicator */}
                  <div className="flex items-center justify-center gap-0 mb-8">
                    {formSteps.map((step, idx) => (
                      <React.Fragment key={step.id}>
                        <div className="flex flex-col items-center gap-1">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                            idx <= formStep
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {idx + 1}
                          </div>
                          <span className={`text-[10px] font-medium ${idx <= formStep ? 'text-primary' : 'text-muted-foreground/50'}`}>
                            {step.label}
                          </span>
                        </div>
                        {idx < formSteps.length - 1 && (
                          <div className={`w-12 h-0.5 mx-1 mb-4 rounded ${idx < formStep ? 'bg-primary' : 'bg-muted'}`} />
                        )}
                      </React.Fragment>
                    ))}
                  </div>

                  <form onSubmit={handleSubmit}>
                    {/* Step 1: The Problem */}
                    {formStep === 0 && (
                      <div className="space-y-5">
                        <div className="text-center mb-6">
                          <h2 className="text-2xl font-black tracking-tight mb-2">What's bugging you?</h2>
                          <p className="text-muted-foreground font-medium text-sm">
                            Rough is fine. I care about the problem, not the pitch.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <label htmlFor="idea_title" className="text-sm font-medium text-muted-foreground">What's the problem? *</label>
                          <input
                            id="idea_title"
                            name="idea_title"
                            type="text"
                            required
                            maxLength={100}
                            placeholder="I wish there was a tool that..."
                            value={formData.idea_title}
                            onChange={handleChange}
                            className="w-full h-11 px-4 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
                          />
                        </div>

                        <div className="space-y-2">
                          <label htmlFor="idea_description" className="text-sm font-medium text-muted-foreground">
                            Tell me more <span className="text-muted-foreground/50">(optional)</span>
                          </label>
                          <textarea
                            id="idea_description"
                            name="idea_description"
                            rows={4}
                            maxLength={1000}
                            placeholder="What makes this annoying? Who else has it?"
                            value={formData.idea_description}
                            onChange={handleChange}
                            className="w-full p-4 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors resize-y leading-relaxed"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (!formData.idea_title.trim()) {
                              toast({ title: 'Describe the problem first', variant: 'destructive' });
                              return;
                            }
                            setFormStep(1);
                          }}
                          className="w-full h-11 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                        >
                          Continue <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Step 2: Context */}
                    {formStep === 1 && (
                      <div className="space-y-5">
                        <div className="text-center mb-6">
                          <h2 className="text-2xl font-black tracking-tight mb-2">A little context</h2>
                          <p className="text-muted-foreground font-medium text-sm">
                            All optional. Helps me understand what to build.
                          </p>
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
                            <label htmlFor="industry" className="text-sm font-medium text-muted-foreground">Industry</label>
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
                          <label className="text-sm font-medium text-muted-foreground">How often do you hit this?</label>
                          <div className="flex gap-2 flex-wrap">
                            {frequencyOptions.map((freq) => (
                              <button
                                key={freq}
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, frequency: prev.frequency === freq ? '' : freq }))}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                                  formData.frequency === freq
                                    ? 'bg-primary/10 text-primary border border-primary/30'
                                    : 'text-muted-foreground hover:text-foreground bg-muted/50 border border-transparent'
                                }`}
                              >
                                {freq}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label htmlFor="existing_solutions" className="text-sm font-medium text-muted-foreground">
                            Tried anything to solve it?
                          </label>
                          <input
                            id="existing_solutions"
                            name="existing_solutions"
                            type="text"
                            maxLength={200}
                            placeholder="Spreadsheets, existing tools, nothing..."
                            value={formData.existing_solutions}
                            onChange={handleChange}
                            className="w-full h-11 px-4 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
                          />
                        </div>

                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => setFormStep(0)}
                            className="flex-1 h-11 rounded-lg border border-border text-foreground text-sm font-semibold hover:bg-muted/50 transition-colors"
                          >
                            Back
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormStep(2)}
                            className="flex-1 h-11 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                          >
                            Continue <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Step 3: About You */}
                    {formStep === 2 && (
                      <div className="space-y-5">
                        <div className="text-center mb-6">
                          <h2 className="text-2xl font-black tracking-tight mb-2">Almost done</h2>
                          <p className="text-muted-foreground font-medium text-sm">
                            So I can follow up when I build it. If it flies, we partner up.
                          </p>
                        </div>

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
                            <label htmlFor="email" className="text-sm font-medium text-muted-foreground">Email *</label>
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

                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => setFormStep(1)}
                            className="flex-1 h-11 rounded-lg border border-border text-foreground text-sm font-semibold hover:bg-muted/50 transition-colors"
                          >
                            Back
                          </button>
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 h-11 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            {isSubmitting ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>Send it <Send className="w-3.5 h-3.5" /></>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </form>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Detail Drawer */}
      <AnimatePresence>
        {selectedIdea && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedIdea(null)}
              className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-lg bg-card border-l border-border shadow-2xl overflow-y-auto"
            >
              <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-border bg-card/95 backdrop-blur-sm">
                <h2 className="text-lg font-bold truncate">Idea Analysis</h2>
                <button
                  onClick={() => setSelectedIdea(null)}
                  className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Idea info */}
                <div>
                  <h3 className="text-xl font-bold mb-2">{selectedIdea.idea_title}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70 flex-wrap mb-3">
                    <span>{selectedIdea.source === 'problemhunt' ? <span className="text-accent font-medium">via ProblemHunt</span> : selectedIdea.source === 'reddit' ? <span className="text-red-500 font-medium">via Reddit</span> : `by ${selectedIdea.name || 'Anonymous'}`}</span>
                    <span className="text-muted-foreground/40">&middot;</span>
                    <span>{timeAgo(selectedIdea.created_at)}</span>
                    {selectedIdea.industry && (
                      <>
                        <span className="text-muted-foreground/40">&middot;</span>
                        <span>{industries.find(i => i.value === selectedIdea.industry)?.label || selectedIdea.industry}</span>
                      </>
                    )}
                    {selectedIdea.country && (
                      <>
                        <span className="text-muted-foreground/40">&middot;</span>
                        <span>{selectedIdea.country}</span>
                      </>
                    )}
                  </div>
                  {selectedIdea.idea_description && selectedIdea.idea_description !== selectedIdea.idea_title && (
                    <p className="text-sm text-muted-foreground leading-relaxed">{selectedIdea.idea_description}</p>
                  )}
                </div>

                {/* Hormozi Score */}
                {selectedIdea.score_breakdown?.hormozi && (() => {
                  const h = selectedIdea.score_breakdown.hormozi;
                  const tier = getScoreTier(h.total);
                  return (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold">Hormozi Score</h4>
                        <div className="flex items-center gap-2">
                          <span className={`text-2xl font-black tabular-nums ${tier.color}`}>{h.total}</span>
                          <span className="text-xs text-muted-foreground/60">/100</span>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${tier.bg} ${tier.color}`}>{tier.label}</span>
                        </div>
                      </div>

                      {h.summary && (
                        <p className="text-sm text-muted-foreground italic">"{h.summary}"</p>
                      )}

                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">Market Viability</span>
                          </div>
                          <ScoreBar score={h.market_viability?.score || 0} max={h.market_viability?.max || 20} color={tier.bar} />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">Value Equation</span>
                          </div>
                          <ScoreBar score={h.value_equation?.score || 0} max={h.value_equation?.max || 25} color={tier.bar} />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">Market Growth</span>
                          </div>
                          <ScoreBar score={h.market_growth?.score || 0} max={h.market_growth?.max || 15} color={tier.bar} />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">Differentiation</span>
                          </div>
                          <ScoreBar score={h.differentiation?.score || 0} max={h.differentiation?.max || 20} color={tier.bar} />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">Feasibility</span>
                          </div>
                          <ScoreBar score={h.feasibility?.score || 0} max={h.feasibility?.max || 20} color={tier.bar} />
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Dan Koe Score */}
                {selectedIdea.score_breakdown?.koe && (() => {
                  const k = selectedIdea.score_breakdown.koe;
                  const tier = getScoreTier(k.total);
                  return (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold">Dan Koe Score</h4>
                        <div className="flex items-center gap-2">
                          <span className={`text-2xl font-black tabular-nums ${tier.color}`}>{k.total}</span>
                          <span className="text-xs text-muted-foreground/60">/100</span>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${tier.bg} ${tier.color}`}>{tier.label}</span>
                        </div>
                      </div>

                      {k.summary && (
                        <p className="text-sm text-muted-foreground italic">"{k.summary}"</p>
                      )}

                      <div className="space-y-3">
                        <div>
                          <span className="text-sm font-medium">Problem Clarity</span>
                          <ScoreBar score={k.problem_clarity?.score || 0} max={k.problem_clarity?.max || 25} color={tier.bar} />
                        </div>
                        <div>
                          <span className="text-sm font-medium">Creator Fit</span>
                          <ScoreBar score={k.creator_fit?.score || 0} max={k.creator_fit?.max || 20} color={tier.bar} />
                        </div>
                        <div>
                          <span className="text-sm font-medium">Audience Reach</span>
                          <ScoreBar score={k.audience_reach?.score || 0} max={k.audience_reach?.max || 15} color={tier.bar} />
                        </div>
                        <div>
                          <span className="text-sm font-medium">Simplicity</span>
                          <ScoreBar score={k.simplicity?.score || 0} max={k.simplicity?.max || 15} color={tier.bar} />
                        </div>
                        <div>
                          <span className="text-sm font-medium">Monetization</span>
                          <ScoreBar score={k.monetization?.score || 0} max={k.monetization?.max || 15} color={tier.bar} />
                        </div>
                        <div>
                          <span className="text-sm font-medium">Anti-Niche POV</span>
                          <ScoreBar score={k.anti_niche?.score || 0} max={k.anti_niche?.max || 5} color={tier.bar} />
                        </div>
                        <div>
                          <span className="text-sm font-medium">Leverage</span>
                          <ScoreBar score={k.leverage?.score || 0} max={k.leverage?.max || 5} color={tier.bar} />
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* No scores yet */}
                {!selectedIdea.score_breakdown && (
                  <div className="text-center py-8">
                    <Zap className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground font-medium">Scores pending. New ideas are scored daily.</p>
                  </div>
                )}

                {/* How scoring works - collapsible */}
                <details className="group">
                  <summary className="flex items-center gap-2 cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                    <Info className="w-4 h-4" />
                    How are these scores calculated?
                  </summary>
                  <div className="mt-3 space-y-3 text-sm text-muted-foreground leading-relaxed">
                    <p>
                      <strong className="text-foreground">Hormozi Score</strong> evaluates ideas through Alex Hormozi's $100M framework:
                      market pain, value equation (dream outcome vs. effort), growth timing,
                      differentiation, and execution feasibility. Great for assessing commercial viability.
                    </p>
                    <p>
                      <strong className="text-foreground">Dan Koe Score</strong> evaluates through the one-person business lens:
                      problem clarity, solo creator fit, audience reach, simplicity,
                      monetization path, unique angle, and leverage potential. Great for
                      assessing if a solo builder should tackle this.
                    </p>
                    <p className="text-muted-foreground/60">
                      Both scores are generated by Claude AI analyzing the problem description,
                      industry context, and market signals.
                    </p>
                    <Link to="/scoring" className="inline-flex items-center gap-1 text-accent hover:underline font-medium" onClick={() => setSelectedIdea(null)}>
                      Full framework breakdown <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </details>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-2 border-t border-border">
                  <button
                    onClick={() => { handleVote(selectedIdea.id); }}
                    disabled={votedIds.includes(selectedIdea.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      votedIds.includes(selectedIdea.id)
                        ? 'bg-primary/10 text-primary cursor-default'
                        : 'bg-primary text-primary-foreground hover:bg-primary/90'
                    }`}
                  >
                    <ChevronUp className="w-4 h-4" />
                    {votedIds.includes(selectedIdea.id) ? 'Voted' : 'Vote'}
                    <span className="tabular-nums">{selectedIdea.votes || 0}</span>
                  </button>
                  {selectedIdea.source === 'problemhunt' && (
                    <a
                      href={selectedIdea.source_url || 'https://problemhunt.pro'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 rounded-lg border border-accent/20 text-sm font-medium text-accent hover:bg-accent/10 transition-colors"
                      onClick={() => trackEvent('outbound_click', { link_url: selectedIdea.source_url || 'https://problemhunt.pro', link_label: 'ProblemHunt Detail', location: 'ideas_drawer' })}
                    >
                      via ProblemHunt <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {selectedIdea.source === 'reddit' && selectedIdea.source_url && (
                    <a
                      href={selectedIdea.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-500/20 text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors"
                      onClick={() => trackEvent('outbound_click', { link_url: selectedIdea.source_url, link_label: 'Reddit Detail', location: 'ideas_drawer' })}
                    >
                      via Reddit <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default IdeaSubmissionPage;
