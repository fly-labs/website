
import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, Zap, Loader2, CheckCircle2, Activity, Globe, Send, ChevronDown, SlidersHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast.js';
import { PageLayout } from '@/components/PageLayout.jsx';
import supabase from '@/lib/supabaseClient.js';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeUp } from '@/lib/animations.js';
import { useAuth } from '@/contexts/AuthContext.jsx';

import { categories, industries, statusConfig, sortOptions, sourceOptions, perPageOptions, frequencyOptions } from '@/lib/data/ideas.js';
import { timeAgo, isValidEmail } from '@/lib/utils.js';
import { trackEvent } from '@/lib/analytics.js';

import IdeaCard from '@/components/ideas/IdeaCard.jsx';
import IdeaDrawer from '@/components/ideas/IdeaDrawer.jsx';
import IdeaSubmitModal from '@/components/ideas/IdeaSubmitModal.jsx';

// Shipped fallback - shown if no shipped ideas in DB
const SHIPPED_FALLBACK = [
  {
    title: 'Garmin to Notion Sync',
    description: 'Automatically sync your Garmin health data to Notion. Born from a community request, now live and open source.',
    industry: 'Sport & Fitness',
    link: '/templates/garmin-to-notion',
    icon: 'activity',
  },
  {
    title: 'Website Blueprint',
    description: 'Full stack breakdown of how this site was built. Open source and free to fork.',
    industry: 'Dev',
    link: '/templates/website-blueprint',
    icon: 'globe',
  },
];

// Primary sort pills shown inline
const PRIMARY_SORTS = ['hot', 'new', 'top'];

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
  const [perPage, setPerPage] = useState(5);
  const [formStep, setFormStep] = useState(0);
  const [selectedIdea, setSelectedIdea] = useState(null);
  const [showMoreSort, setShowMoreSort] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const moreSortRef = useRef(null);
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

  // Close "More" dropdown on outside click
  useEffect(() => {
    if (!showMoreSort) return;
    const handleClick = (e) => {
      if (moreSortRef.current && !moreSortRef.current.contains(e.target)) {
        setShowMoreSort(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showMoreSort]);

  // Time-decay hot score: votes / (hoursAge + 2)^1.5
  const getHotScore = (idea) => {
    const votes = idea.votes || 0;
    const hoursAge = (Date.now() - new Date(idea.published_at || idea.created_at).getTime()) / (1000 * 60 * 60);
    return votes / Math.pow(hoursAge + 2, 1.5);
  };

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
      case 'new': return arr.sort((a, b) => new Date(b.published_at || b.created_at) - new Date(a.published_at || a.created_at));
      case 'oldest': return arr.sort((a, b) => new Date(a.published_at || a.created_at) - new Date(b.published_at || b.created_at));
      case 'top': return arr.sort((a, b) => (b.votes || 0) - (a.votes || 0));
      case 'hormozi': return arr.sort((a, b) => (b.hormozi_score || 0) - (a.hormozi_score || 0));
      case 'koe': return arr.sort((a, b) => (b.koe_score || 0) - (a.koe_score || 0));
      case 'okamoto': return arr.sort((a, b) => (b.okamoto_score || 0) - (a.okamoto_score || 0));
      case 'validation': return arr.sort((a, b) => (b.validation_score || 0) - (a.validation_score || 0));
      case 'verdict': return arr.sort((a, b) => {
        const priority = { BUILD: 3, VALIDATE_FIRST: 2, SKIP: 1 };
        const va = a.enrichment?.verdict?.recommendation || a.score_breakdown?.synthesis?.verdict;
        const vb = b.enrichment?.verdict?.recommendation || b.score_breakdown?.synthesis?.verdict;
        const pa = priority[va] || 0;
        const pb = priority[vb] || 0;
        if (pa !== pb) return pb - pa;
        const ca = a.score_breakdown?.synthesis?.composite_score || 0;
        const cb = b.score_breakdown?.synthesis?.composite_score || 0;
        return cb - ca;
      });
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

  // Active filter count for badge
  const activeFilterCount =
    (activeType !== 'All' ? 1 : 0) +
    (activeIndustry !== 'All' ? 1 : 0);

  // Shipped ideas from DB, fall back to static
  const shippedFromDB = ideas.filter(i => i.status === 'shipped');
  const shippedItems = shippedFromDB.length > 0 ? shippedFromDB : null;

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
        name: formData.name.trim() || null,
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
        description: "It'll be AI-scored with 3 frameworks and given a verdict. Top ideas get validated against real conversations.",
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

  const handleSortChange = (v) => {
    setSortBy(v);
    setShowMoreSort(false);
    trackEvent('ideas_sort_change', { sort_by: v });
  };

  const handleSourceChange = (v) => {
    setActiveSource(v);
    trackEvent('ideas_filter_change', { filter_type: 'source', filter_value: v });
  };

  const handleTypeChange = (v) => {
    setActiveType(v);
    trackEvent('ideas_filter_change', { filter_type: 'type', filter_value: v });
  };

  const handleIndustryChange = (v) => {
    setActiveIndustry(v);
    trackEvent('ideas_filter_change', { filter_type: 'industry', filter_value: v });
  };

  const handlePerPageChange = (v) => {
    setPerPage(v);
    trackEvent('ideas_filter_change', { filter_type: 'per_page', filter_value: v });
  };

  const handleOpenDrawer = (idea) => {
    setSelectedIdea(idea);
    trackEvent('idea_drawer_opened', { idea_id: idea.id, idea_title: idea.idea_title, source: idea.source });
  };

  const openSubmitModal = () => {
    setFormStep(0);
    setShowModal(true);
    trackEvent('idea_form_step', { step: 0, step_name: 'problem' });
  };

  // "More" sort label - shows active label when a secondary sort is active
  const moreSortActive = sortOptions.find(o => !PRIMARY_SORTS.includes(o.value) && o.value === sortBy);

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

  const ShippedIcon = ({ icon }) => {
    if (icon === 'activity') return <Activity className="w-5 h-5" />;
    return <Globe className="w-5 h-5" />;
  };

  return (
    <>
      <PageLayout
        seo={{
          title: "Idea Lab - AI-Scored Problems with BUILD/VALIDATE/SKIP Verdicts",
          description: "Real problems from Reddit, ProblemHunt, Product Hunt, X, and the community. Scored by 3 AI frameworks with per-pillar reasoning, synthesized into BUILD/VALIDATE/SKIP verdicts, and validated against real market conversations.",
          keywords: "submit idea, project idea, community, vote, tool request, hormozi score, dan koe score, okamoto score, reddit ideas, product hunt, validation, competitive analysis, business opportunities, build verdict",
          url: "https://flylabs.fun/ideas",
        }}
        className="pt-32 pb-28 sm:pb-24"
      >
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">

            {/* Hero - compact */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-6"
            >
              <h1 className="text-4xl md:text-7xl font-black mb-3 tracking-tight">
                The <span className="text-primary">Idea Lab</span>
              </h1>
              <p className="text-sm text-muted-foreground/50 font-medium">
                {ideas.length} ideas{' '}<span className="text-muted-foreground/30">&middot;</span>{' '}5 sources{' '}<span className="text-muted-foreground/30">&middot;</span>{' '}AI-scored + verdict{' '}<span className="text-muted-foreground/30">&middot;</span>{' '}Updated 3x daily
              </p>
            </motion.div>

            {/* Toolbar: 2 rows */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="space-y-3 mb-4"
            >
              {/* Row 1: Sort pills + More dropdown + Submit button */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  {sortOptions.filter(o => PRIMARY_SORTS.includes(o.value)).map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleSortChange(opt.value)}
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

                  {/* More dropdown */}
                  <div className="relative" ref={moreSortRef}>
                    <button
                      onClick={() => setShowMoreSort(!showMoreSort)}
                      className={`relative px-4 py-2 rounded-full text-sm font-medium transition-colors shrink-0 flex items-center gap-1 ${
                        moreSortActive
                          ? 'bg-primary/10 border border-primary/30 text-primary'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {moreSortActive ? moreSortActive.label : 'More'}
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showMoreSort ? 'rotate-180' : ''}`} />
                    </button>
                    {showMoreSort && (
                      <>
                        <div className="fixed inset-0 z-30" onClick={() => setShowMoreSort(false)} />
                        <div className="absolute top-full left-0 mt-1 z-40 bg-card border border-border rounded-xl shadow-lg py-1 min-w-[160px]">
                          {sortOptions.filter(o => !PRIMARY_SORTS.includes(o.value)).map((opt) => (
                            <button
                              key={opt.value}
                              onClick={() => handleSortChange(opt.value)}
                              className={`w-full text-left px-4 py-2 text-sm font-medium transition-colors ${
                                sortBy === opt.value
                                  ? 'text-primary bg-primary/5'
                                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <button
                  onClick={openSubmitModal}
                  className="hidden sm:inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors shrink-0"
                >
                  Submit an idea <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Row 2: Source pills + Filters toggle */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                  {sourceOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleSourceChange(opt.value)}
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

                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors shrink-0 ${
                    showFilters || activeFilterCount > 0
                      ? 'bg-primary/10 text-primary border border-primary/30'
                      : 'text-muted-foreground hover:text-foreground bg-muted/50 border border-transparent'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Expandable filters: Type + Industry */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden space-y-3"
                  >
                    {/* Type filter */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground/60 shrink-0">Type:</span>
                      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                        {['All', ...categories.map(c => c.value)].map((type) => (
                          <button
                            key={type}
                            onClick={() => handleTypeChange(type)}
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

                    {/* Industry filter */}
                    {activeIndustries.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground/60 shrink-0">Industry:</span>
                        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                          <button
                            onClick={() => handleIndustryChange('All')}
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
                              onClick={() => handleIndustryChange(ind.value)}
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
                )}
              </AnimatePresence>
            </motion.div>

            {/* Ideas feed */}
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
                    {paginated.map((idea, i) => (
                      <IdeaCard
                        key={idea.id}
                        idea={idea}
                        hasVoted={votedIds.includes(idea.id)}
                        onVote={handleVote}
                        onOpenDrawer={handleOpenDrawer}
                        index={i}
                      />
                    ))}
                  </AnimatePresence>
                </motion.div>

                {/* Pagination Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground/60 font-medium">Show:</span>
                    {perPageOptions.map((n) => (
                      <button
                        key={n}
                        onClick={() => handlePerPageChange(n)}
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

            {/* Below the fold: Shipped from the lab */}
            <motion.div {...fadeUp} transition={{ duration: 0.5 }} className="mt-16 mb-10">
              <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-4">
                Shipped from the lab
              </p>
              <div className="flex flex-col gap-3">
                {shippedItems ? (
                  shippedItems.map((idea) => (
                    <div
                      key={idea.id}
                      onClick={() => handleOpenDrawer(idea)}
                      className="group flex items-start gap-4 p-5 rounded-xl border border-border/60 bg-card/50 hover:bg-card hover:border-border transition-colors duration-200 cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-200">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {idea.idea_title}
                          </h3>
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                            <CheckCircle2 className="w-3 h-3" /> Shipped
                          </span>
                        </div>
                        {idea.idea_description && (
                          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                            {idea.idea_description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  SHIPPED_FALLBACK.map((item) => (
                    <Link
                      key={item.link}
                      to={item.link}
                      className="group flex items-start gap-4 p-5 rounded-xl border border-border/60 bg-card/50 hover:bg-card hover:border-border transition-colors duration-200"
                    >
                      <div className={`w-10 h-10 rounded-lg ${item.icon === 'activity' ? 'bg-secondary/10 text-secondary' : 'bg-primary/10 text-primary'} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-200`}>
                        <ShippedIcon icon={item.icon} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {item.title}
                          </h3>
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                            <CheckCircle2 className="w-3 h-3" /> Shipped
                          </span>
                          <span className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                            {item.industry}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                          {item.description}
                        </p>
                        <span className="inline-flex items-center text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors">
                          Check it out <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform duration-200" />
                        </span>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </motion.div>

            {/* How it works callout */}
            <motion.div {...fadeUp} transition={{ duration: 0.5 }} className="mb-8">
              <div className="p-4 rounded-xl border border-accent/20 bg-accent/5">
                <div className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-1">How it works</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Every day we scan Reddit, ProblemHunt, Product Hunt, and X for real
                      problems people are struggling with. Community members submit their own too. AI scores every idea
                      using Hormozi, Dan Koe, and Okamoto frameworks with per-pillar reasoning, then synthesizes a
                      BUILD / VALIDATE / SKIP verdict. Top ideas get validated against
                      real conversations on X and Reddit, with evidence confidence and competitive intelligence.
                      The best ones get built.
                      {' '}<Link to="/scoring" className="text-accent hover:underline font-medium">How scoring works</Link>
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </PageLayout>

      {/* Sticky mobile CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-40 sm:hidden border-t border-border bg-background/80 backdrop-blur-md px-4 py-3">
        <button
          onClick={openSubmitModal}
          className="w-full flex items-center justify-center gap-2 h-11 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          <Send className="w-4 h-4" />
          Submit an idea
        </button>
      </div>

      {/* Submit Modal */}
      <AnimatePresence>
        <IdeaSubmitModal
          show={showModal}
          onClose={() => setShowModal(false)}
          formData={formData}
          onFormChange={handleChange}
          formStep={formStep}
          onStepChange={setFormStep}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          toast={toast}
        />
      </AnimatePresence>

      {/* Detail Drawer */}
      <AnimatePresence>
        {selectedIdea && (
          <IdeaDrawer
            idea={selectedIdea}
            onClose={() => setSelectedIdea(null)}
            onVote={handleVote}
            hasVoted={votedIds.includes(selectedIdea.id)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default IdeaSubmissionPage;
