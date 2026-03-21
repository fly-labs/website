
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, ChevronLeft, ChevronRight, Zap, Loader2, CheckCircle2, Activity, Globe, PenLine, Send, ChevronDown, SlidersHorizontal, Search, X, LayoutList, LayoutGrid, Bot, Lock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast.js';
import { PageLayout } from '@/components/PageLayout.jsx';
import supabase from '@/lib/supabaseClient.js';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeUp } from '@/lib/animations.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useChatContext } from '@/contexts/ChatContext.jsx';

import { categories, industries, sortOptions, sourceOptions, verdictOptions, frequencyOptions, verdictColors, SOURCE_COUNT } from '@/lib/data/ideas.js';
import { QUESTION_COUNT } from '@/lib/data/siteStats.js';
import { isValidEmail } from '@/lib/utils.js';
import { trackEvent } from '@/lib/analytics.js';
import { useIdeaFilters } from '@/hooks/useIdeaFilters.js';

import IdeaCard from '@/components/ideas/IdeaCard.jsx';
import IdeaTableRow from '@/components/ideas/IdeaTableRow.jsx';
import IdeaSubmitModal from '@/components/ideas/IdeaSubmitModal.jsx';
import IdeaFilterSheet from '@/components/ideas/IdeaFilterSheet.jsx';

// Shipped fallback - shown if no shipped ideas in DB
const SHIPPED_FALLBACK = [
  {
    title: 'FlyBot',
    descKey: 'shipped.flybotDesc',
    industry: 'AI',
    link: '/flybot',
    icon: 'bot',
  },
  {
    title: 'FlyBoard',
    descKey: 'shipped.flyboardDesc',
    industry: 'Productivity',
    link: '/flyboard',
    icon: 'penline',
  },
  {
    title: 'Garmin to Notion Sync',
    descKey: 'shipped.garminDesc',
    industry: 'Sport & Fitness',
    link: '/templates/garmin-to-notion',
    icon: 'activity',
  },
  {
    title: 'Website Blueprint',
    descKey: 'shipped.blueprintDesc',
    industry: 'Dev',
    link: '/templates/website-blueprint',
    icon: 'globe',
  },
];

// Primary sort pills shown inline
const PRIMARY_SORTS = ['hot', 'new', 'top'];

const IdeaSubmissionPage = () => {
  const { t } = useTranslation('ideas');
  const { toast } = useToast();
  const navigate = useNavigate();
  const { currentUser, profile, isAuthenticated } = useAuth();
  const { openWidget, setPageDetail } = useChatContext();
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
  const [viewMode, setViewMode] = useState(() => {
    try { return localStorage.getItem('ideas_view') || 'cards'; } catch { return 'cards'; }
  });
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
    website: '', // honeypot
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
    loading, ideas, totalCount, globalCount,
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

  // Redirect legacy ?idea= URLs to /ideas/:id
  useEffect(() => {
    const ideaId = new URLSearchParams(window.location.search).get('idea');
    if (ideaId) navigate(`/ideas/${ideaId}`, { replace: true });
  }, [navigate]);

  // Sync searchInput with URL state
  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  // Enrich FlyBot page context with current filter state
  useEffect(() => {
    setPageDetail({
      source: activeSource !== 'all' ? activeSource : undefined,
      verdict: verdict !== 'all' ? verdict : undefined,
      searchQuery: searchQuery || undefined,
      sort: sortBy,
      resultCount: totalCount,
    });
  }, [activeSource, verdict, searchQuery, sortBy, totalCount, setPageDetail]);

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

  // Vote handler (toggle: vote/unvote)
  const handleVote = async (id) => {
    const alreadyVoted = votedIds.includes(id);
    const idea = ideas.find(i => i.id === id);

    if (alreadyVoted) {
      const newVotedIds = votedIds.filter(vid => vid !== id);
      setVotedIds(newVotedIds);
      localStorage.setItem('voted_ideas', JSON.stringify(newVotedIds));
      trackEvent('idea_unvoted', { idea_id: id, idea_title: idea?.idea_title, category: idea?.category });
      const { error } = await supabase.rpc('decrement_vote', { idea_id: id });
      if (error) {
        setVotedIds(prev => [...prev, id]);
        localStorage.setItem('voted_ideas', JSON.stringify(votedIds));
      }
    } else {
      const newVotedIds = [...votedIds, id];
      setVotedIds(newVotedIds);
      localStorage.setItem('voted_ideas', JSON.stringify(newVotedIds));
      trackEvent('idea_voted', { idea_id: id, idea_title: idea?.idea_title, category: idea?.category });
      const { error } = await supabase.rpc('increment_vote', { idea_id: id });
      if (error) {
        setVotedIds(prev => prev.filter(vid => vid !== id));
        localStorage.setItem('voted_ideas', JSON.stringify(votedIds));
      }
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
      toast({ title: t('toast.missingField'), description: t('toast.describeProblem'), variant: 'destructive' });
      return;
    }
    if (!formData.email) {
      toast({ title: t('toast.missingEmail'), description: t('toast.enterEmail'), variant: 'destructive' });
      return;
    }
    if (!isValidEmail(formData.email.trim())) {
      toast({ title: t('toast.invalidEmail'), description: t('toast.enterValidEmail'), variant: 'destructive' });
      return;
    }

    const VALID_CATEGORIES = categories.map(c => c.value);
    if (!VALID_CATEGORIES.includes(formData.category)) {
      toast({ title: t('toast.invalidCategory'), variant: 'destructive' });
      return;
    }
    if (formData.idea_title.length > 100) {
      toast({ title: t('toast.titleTooLong'), description: t('toast.maxChars100'), variant: 'destructive' });
      return;
    }
    if (formData.idea_description && formData.idea_description.length > 1000) {
      toast({ title: t('toast.descTooLong'), description: t('toast.maxChars1000'), variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      // Check rate limit
      const { data: rateCount } = await supabase.rpc('check_idea_rate_limit', { p_email: formData.email.trim().toLowerCase() });
      if (rateCount && rateCount >= 3) {
        toast({ title: t('toast.rateLimited'), description: t('toast.rateLimitedDesc'), variant: 'destructive' });
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
      await supabase.rpc('log_idea_submission', { p_email: sanitized.email, p_honeypot: formData.website });

      trackEvent('idea_submitted', { category: formData.category });

      toast({
        title: t('toast.submitted'),
        description: t('toast.submittedDesc'),
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
        website: '',
      });
      setFormStep(0);
      setShowModal(false);
    } catch (error) {
      toast({
        title: t('toast.submitFailed'),
        description: t('toast.submitFailedDesc'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleView = useCallback((mode) => {
    setViewMode(mode);
    try { localStorage.setItem('ideas_view', mode); } catch {}
  }, []);

  const handleSortChange = (v) => {
    setSortBy(v);
    setShowMoreSort(false);
  };

  const openSubmitModal = () => {
    setFormStep(0);
    setShowModal(true);
    trackEvent('idea_form_step', { step: 0, step_name: 'problem' });
  };

  // "More" sort label - shows active label when a secondary sort is active
  const moreSortActive = sortOptions.find(o => !PRIMARY_SORTS.includes(o.value) && o.value === sortBy);

  const ShippedIcon = ({ icon }) => {
    if (icon === 'bot') return <Bot className="w-5 h-5" />;
    if (icon === 'activity') return <Activity className="w-5 h-5" />;
    if (icon === 'penline') return <PenLine className="w-5 h-5" />;
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
          title: t('seo.title'),
          description: t('seo.description'),
          keywords: "submit idea, project idea, community, vote, tool request, reddit ideas, product hunt, hacker news, github issues, validation, competitive analysis, business opportunities, build verdict",
          url: "https://flylabs.fun/ideas",
          schema: [
            {
              "@context": "https://schema.org",
              "@type": "ItemList",
              "name": "AI-Scored Business Ideas",
              "description": "Hundreds of real problems scored by AI across 4 frameworks from 9 sources",
              "url": "https://flylabs.fun/ideas",
              "numberOfItems": totalCount || 0,
              "itemListElement": (paginated || []).slice(0, 10).map((idea, i) => ({
                "@type": "ListItem",
                "position": i + 1,
                "name": idea.idea_title,
                "url": `https://flylabs.fun/ideas/${idea.id}`
              }))
            },
            {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://flylabs.fun/" },
                { "@type": "ListItem", "position": 2, "name": "Ideas Lab" },
              ],
            },
          ],
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
                {t('hero.title').split('Ideas Lab')[0]}<span className="text-primary">Ideas Lab</span>
              </h1>
              <p className="text-sm text-muted-foreground font-medium max-w-lg mx-auto">
                {globalCount ? t('hero.ideasCount', { count: globalCount }) : t('hero.ideas')} {t('hero.from', { sourceCount: SOURCE_COUNT, questionCount: QUESTION_COUNT })} <span className="font-bold text-foreground/70">{t('verdicts.build')}</span>, <span className="font-bold text-foreground/70">{t('verdicts.validate')}</span>, or <span className="font-bold text-foreground/70">{t('verdicts.skip')}</span>.{' '}
                <Link to="/scoring" className="text-primary hover:underline">{t('hero.howItWorks')}</Link>
              </p>
              <Link
                to="/ideas/analytics"
                className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-full text-xs font-semibold bg-accent/10 text-accent border border-accent/20 hover:bg-accent/15 transition-colors"
              >
                <Activity className="w-3.5 h-3.5" />
                <span className="sm:hidden">{t('hero.liveAnalytics')}</span>
                <span className="hidden sm:inline">{t('hero.liveAnalyticsLong')}</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
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
                    placeholder={t('toolbar.searchPlaceholder')}
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
                  {t('toolbar.submitIdea')} <ArrowRight className="w-3.5 h-3.5" />
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
                        {t('sort.' + opt.value)}
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
                      {moreSortActive ? t('sort.' + moreSortActive.value) : t('toolbar.more')}
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
                              {t('sort.' + opt.value)}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* View toggle */}
                  <div className="hidden sm:flex items-center rounded-full bg-muted/50 border border-transparent p-0.5">
                    <button
                      onClick={() => toggleView('cards')}
                      className={`p-1.5 rounded-full transition-colors ${viewMode === 'cards' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                      aria-label={t('toolbar.cardView')}
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => toggleView('table')}
                      className={`p-1.5 rounded-full transition-colors ${viewMode === 'table' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                      aria-label={t('toolbar.tableView')}
                    >
                      <LayoutList className="w-3.5 h-3.5" />
                    </button>
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
                    {t('toolbar.filters')}
                    {activeFilterCount > 0 && (
                      <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                        {activeFilterCount}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Row 3: Source pills with counts */}
              <div className="relative">
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
              <div className="absolute right-0 top-0 bottom-1 w-6 bg-gradient-to-l from-background to-transparent pointer-events-none sm:hidden" />
              </div>

              {/* Row 4: Verdict tabs with counts (members only) */}
              {isAuthenticated && <div className="relative">
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
              <div className="absolute right-0 top-0 bottom-1 w-6 bg-gradient-to-l from-background to-transparent pointer-events-none sm:hidden" />
              </div>}

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
                    {t('results.clearAll')}
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
                {t('results.showing', { from: (currentPage - 1) * perPage + 1, to: Math.min(currentPage * perPage, totalCount), total: totalCount })}
                {sortBy !== 'hot' && <span className="text-muted-foreground/40"> &middot; {t('results.sortedBy', { sort: t('sort.' + sortBy).toLowerCase() })}</span>}
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
                <p className="text-muted-foreground font-medium mb-3">{t('results.noMatch')}</p>
                {(() => {
                  const restrictive = getMostRestrictiveFilter();
                  if (restrictive) {
                    return (
                      <p className="text-sm text-muted-foreground/60 mb-3">
                        {t('results.tryClearFilter', { filter: `${restrictive.label}: ${restrictive.value}` }).split(`${restrictive.label}: ${restrictive.value}`)[0]}
                        <button onClick={restrictive.onRemove} className="text-primary font-medium hover:underline">{restrictive.label}: {restrictive.value}</button>
                        {t('results.tryClearFilter', { filter: `${restrictive.label}: ${restrictive.value}` }).split(`${restrictive.label}: ${restrictive.value}`)[1]}
                      </p>
                    );
                  }
                  return null;
                })()}
                <button
                  onClick={clearAllFilters}
                  className="text-sm text-primary font-medium hover:underline"
                >
                  {t('results.clearAllFilters')}
                </button>
              </motion.div>
            ) : (
              <>
                {/* Guest teaser banner */}
                {!isAuthenticated && (
                  <div className="mb-4 px-4 py-3 rounded-xl border border-primary/20 bg-primary/5 flex items-center gap-3 text-sm">
                    <Lock className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-muted-foreground">
                      {t('results.guestBanner')}{' '}
                      <a href="/signup" className="text-primary font-semibold hover:underline">{t('results.guestBannerLink')}</a> {t('results.guestBannerSuffix')}
                    </span>
                  </div>
                )}
                {viewMode === 'table' ? (
                  <div className="overflow-x-auto rounded-xl border border-border/60">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-border/60 bg-muted/30">
                          <th className="py-2 px-2 w-12 text-center text-[11px] font-medium text-muted-foreground uppercase tracking-wider"></th>
                          <th className="py-2 px-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{t('table.problem')}</th>
                          <th className="py-2 px-2 w-24 text-[11px] font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">{t('table.verdict')}</th>
                          <th className="py-2 px-2 w-16 text-center text-[11px] font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">{t('table.fl')}</th>
                          <th className="py-2 px-2 w-28 text-[11px] font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">{t('table.source')}</th>
                          <th className="py-2 px-2 w-20 text-right text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{t('table.age')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        <AnimatePresence mode="wait">
                          {paginated.map((idea, i) => (
                            <IdeaTableRow
                              key={idea.id}
                              idea={idea}
                              hasVoted={votedIds.includes(idea.id)}
                              onVote={handleVote}
                              index={i}
                              showScores={isAuthenticated}
                            />
                          ))}
                        </AnimatePresence>
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <motion.div className="flex flex-col gap-3">
                    <AnimatePresence mode="wait">
                      {paginated.map((idea, i) => (
                        <IdeaCard
                          key={idea.id}
                          idea={idea}
                          hasVoted={votedIds.includes(idea.id)}
                          onVote={handleVote}
                          index={i}
                          showScores={isAuthenticated}
                        />
                      ))}
                    </AnimatePresence>
                  </motion.div>
                )}

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
                    {t('results.showing', { from: (currentPage - 1) * perPage + 1, to: Math.min(currentPage * perPage, totalCount), total: totalCount })}
                  </span>
                </div>
              </>
            )}

            {/* Below the fold: Shipped from the lab */}
            <motion.div {...fadeUp} transition={{ duration: 0.5 }} className="mt-16 mb-10">
              <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-4">
                {t('shipped.title')}
              </p>
              <div className="flex flex-col gap-3">
                {SHIPPED_FALLBACK.map((item) => (
                    <Link
                      key={item.link}
                      to={item.link}
                      className="group flex items-start gap-4 p-5 rounded-xl border border-border/60 bg-card/50 hover:bg-card hover:border-border transition-colors duration-200"
                    >
                      <div className={`w-10 h-10 rounded-lg ${item.icon === 'bot' ? 'bg-accent/10 text-accent' : item.icon === 'activity' ? 'bg-secondary/10 text-secondary' : item.icon === 'penline' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-primary/10 text-primary'} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-200`}>
                        <ShippedIcon icon={item.icon} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {item.title}
                          </h3>
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                            <CheckCircle2 className="w-3 h-3" /> {t('shipped.badge')}
                          </span>
                          <span className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                            {item.industry}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                          {t(item.descKey)}
                        </p>
                        <span className="inline-flex items-center text-xs font-medium text-muted-foreground group-hover:text-primary transition-colors">
                          {t('shipped.checkItOut')} <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform duration-200" />
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
                    <p className="text-sm font-semibold text-foreground mb-1">{t('howItWorks.title')}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {t('howItWorks.description', { sourceCount: SOURCE_COUNT })}
                      {' '}<Link to="/scoring" className="text-accent hover:underline font-medium">{t('howItWorks.link')}</Link>
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* FlyBot hint */}
            <motion.div {...fadeUp} transition={{ duration: 0.5 }}>
              <button
                onClick={() => {
                  openWidget();
                  trackEvent('cta_click', { cta: 'flybot_from_ideas', location: 'ideas_hint' });
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors text-left group"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{t('flybot.hintTitle')}</p>
                  <p className="text-xs text-muted-foreground">{t('flybot.hintDescription')}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
              </button>
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
          {t('submit.mobileCta')}
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

    </>
  );
};

export default IdeaSubmissionPage;
