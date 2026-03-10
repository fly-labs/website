
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, Zap, Loader2, CheckCircle2, Activity, Globe, Send, ChevronDown, SlidersHorizontal, Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast.js';
import { PageLayout } from '@/components/PageLayout.jsx';
import supabase from '@/lib/supabaseClient.js';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeUp } from '@/lib/animations.js';
import { useAuth } from '@/contexts/AuthContext.jsx';

import { categories, industries, sortOptions, sourceOptions, verdictOptions, frequencyOptions, verdictColors } from '@/lib/data/ideas.js';
import { isValidEmail } from '@/lib/utils.js';
import { trackEvent } from '@/lib/analytics.js';
import { useIdeaFilters } from '@/hooks/useIdeaFilters.js';

import IdeaCard from '@/components/ideas/IdeaCard.jsx';
import IdeaDrawer from '@/components/ideas/IdeaDrawer.jsx';
import IdeaSubmitModal from '@/components/ideas/IdeaSubmitModal.jsx';
import IdeaFilterSheet from '@/components/ideas/IdeaFilterSheet.jsx';

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
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [votedIds, setVotedIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('voted_ideas') || '[]');
    } catch {
      return [];
    }
  });
  const [formStep, setFormStep] = useState(0);
  const [selectedIdea, setSelectedIdea] = useState(null);
  const [showMoreSort, setShowMoreSort] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const moreSortRef = useRef(null);
  const searchTimerRef = useRef(null);
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

  // Hook: all filter/sort/pagination logic + data fetching
  const filters = useIdeaFilters();
  const {
    sortBy, setSortBy,
    activeSource, setActiveSource,
    verdict, setVerdict,
    searchQuery, setSearchQuery,
    perPage,
    currentPage, setCurrentPage,
    loading, ideas, totalCount,
    sorted, paginated, totalPages,
    sourceCounts, verdictCounts,
    activeFilterCount,
    activeFilters,
    clearAllFilters,
    getPageNumbers,
  } = filters;

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

  // Sync searchInput with URL state
  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  // Debounced search
  const handleSearchInput = useCallback((e) => {
    const value = e.target.value;
    setSearchInput(value);
    clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setSearchQuery(value);
    }, 300);
  }, [setSearchQuery]);

  const clearSearch = useCallback(() => {
    setSearchInput('');
    setSearchQuery('');
  }, [setSearchQuery]);

  // Vote handler
  const handleVote = async (id) => {
    if (votedIds.includes(id)) return;

    const newVotedIds = [...votedIds, id];
    setVotedIds(newVotedIds);
    localStorage.setItem('voted_ideas', JSON.stringify(newVotedIds));

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
        title: 'Your idea is in the lab.',
        description: "We'll score it, give it a verdict, and validate the best ones against real market conversations.",
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

  const handleSortChange = (v) => {
    setSortBy(v);
    setShowMoreSort(false);
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

  const ShippedIcon = ({ icon }) => {
    if (icon === 'activity') return <Activity className="w-5 h-5" />;
    return <Globe className="w-5 h-5" />;
  };

  // Most restrictive filter for smart empty state
  const getMostRestrictiveFilter = () => {
    if (activeFilters.length === 0) return null;
    // Priority: search > confidence > min_score > verdict > industry > type > source
    const priority = ['q', 'confidence', 'min_score', 'verdict', 'industry', 'type', 'source'];
    for (const key of priority) {
      const f = activeFilters.find(af => af.key === key);
      if (f) return f;
    }
    return activeFilters[0];
  };

  return (
    <>
      <PageLayout
        seo={{
          title: "Idea Lab - AI-Scored Problems with BUILD/VALIDATE/SKIP Verdicts",
          description: "Real problems from Reddit, Hacker News, GitHub Issues, ProblemHunt, Product Hunt, X, and the community. Scored by 4 AI frameworks (Fly Labs Method + Hormozi, Dan Koe, Okamoto) with per-pillar reasoning, synthesized into BUILD/VALIDATE/SKIP verdicts, and validated against real market conversations with competitive intelligence.",
          keywords: "submit idea, project idea, community, vote, tool request, hormozi score, dan koe score, okamoto score, reddit ideas, product hunt, hacker news, github issues, validation, competitive analysis, business opportunities, build verdict",
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
                {totalCount > 0 ? `${totalCount} ideas` : 'Ideas'}{' '}<span className="text-muted-foreground/30">&middot;</span>{' '}9 sources{' '}<span className="text-muted-foreground/30">&middot;</span>{' '}AI-scored + validated{' '}<span className="text-muted-foreground/30">&middot;</span>{' '}Updated 3x daily
              </p>
            </motion.div>

            {/* Toolbar */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="space-y-3 mb-4"
            >
              {/* Row 1: Search + Submit */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                  <input
                    type="text"
                    placeholder="Search ideas..."
                    value={searchInput}
                    onChange={handleSearchInput}
                    className="w-full h-10 pl-9 pr-8 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-colors"
                  />
                  {searchInput && (
                    <button
                      onClick={clearSearch}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded hover:bg-muted text-muted-foreground transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <button
                  onClick={openSubmitModal}
                  className="hidden sm:inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors shrink-0"
                >
                  Submit an idea <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Row 2: Sort pills + More dropdown + Filters toggle */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
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

              {/* Row 3: Source pills with counts */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
                {sourceOptions.map((opt) => {
                  const count = opt.value === 'all'
                    ? sourceCounts.all
                    : opt.value === 'community'
                      ? sourceCounts.community
                      : sourceCounts[opt.value];
                  return (
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
                      {count > 0 && (
                        <span className="ml-1 text-muted-foreground/40">{count}</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Row 4: Verdict tabs with counts */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
                {verdictOptions.map((opt) => {
                  const count = verdictCounts[opt.value] || 0;
                  const isActive = verdict === opt.value;
                  const colorClass = opt.value === 'all'
                    ? isActive
                      ? 'bg-primary/10 text-primary border-primary/30'
                      : 'text-muted-foreground hover:text-foreground bg-muted/50 border-transparent'
                    : isActive
                      ? verdictColors[opt.value]
                      : 'text-muted-foreground hover:text-foreground bg-muted/50 border-transparent';
                  return (
                    <button
                      key={opt.value}
                      onClick={() => setVerdict(opt.value)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-colors shrink-0 border ${colorClass}`}
                    >
                      {opt.label}
                      {count > 0 && opt.value !== 'all' && (
                        <span className="ml-1 opacity-60">{count}</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Row 5: Active filter chips */}
              {activeFilters.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {activeFilters.map((chip) => (
                    <span
                      key={chip.key}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/30"
                    >
                      {chip.label}: {chip.value}
                      <button
                        onClick={chip.onRemove}
                        className="ml-0.5 p-0.5 rounded-full hover:bg-primary/20 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <button
                    onClick={clearAllFilters}
                    className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Clear all
                  </button>
                </div>
              )}

              {/* Expandable filter sheet (desktop inline) */}
              <IdeaFilterSheet
                show={showFilters}
                onClose={() => setShowFilters(false)}
                filters={filters}
              />
            </motion.div>

            {/* Result counter */}
            {!loading && totalCount > 0 && (
              <div className="text-xs text-muted-foreground/60 font-medium mb-3 tabular-nums">
                Showing {(currentPage - 1) * perPage + 1}-{Math.min(currentPage * perPage, totalCount)} of {totalCount} ideas
              </div>
            )}

            {/* Ideas feed */}
            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : totalCount === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20"
              >
                <Zap className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground font-medium mb-3">The filters are tight. Loosen up or try a different angle.</p>
                {(() => {
                  const restrictive = getMostRestrictiveFilter();
                  if (restrictive) {
                    return (
                      <p className="text-sm text-muted-foreground/60 mb-3">
                        Try removing <button onClick={restrictive.onRemove} className="text-primary font-medium hover:underline">{restrictive.label}: {restrictive.value}</button> to see more ideas.
                      </p>
                    );
                  }
                  return null;
                })()}
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
                <div className="flex items-center justify-between gap-4 mt-6 px-1">
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
                    {(currentPage - 1) * perPage + 1}-{Math.min(currentPage * perPage, totalCount)} of {totalCount}
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
                {SHIPPED_FALLBACK.map((item) => (
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
                ))}
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
                      The hardest part of building is knowing what to build. Most people grab the first
                      idea that excites them and start coding. Six months later they've built something
                      nobody wants. This system fixes that. We pull real problems from 9 sources daily,
                      score each one through the Fly Labs Method and 3 expert frameworks, then validate
                      top ideas against real conversations on X and Reddit. You get a verdict: build it,
                      validate first, or move on.
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
