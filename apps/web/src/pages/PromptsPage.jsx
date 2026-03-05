import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Sparkles, Copy, Check, Search, ShieldCheck, X,
  ChevronUp, ChevronDown, MessageCircle, Flame, Send, Trash2,
  Lock, ArrowRight, LayoutTemplate, Code,
} from 'lucide-react';
import { PageLayout } from '@/components/PageLayout.jsx';
import { useToast } from '@/hooks/use-toast.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import { prompts } from '@/lib/data/prompts.js';
import supabase from '@/lib/supabaseClient.js';
import { timeAgo } from '@/lib/utils.js';
import { trackEvent } from '@/lib/analytics.js';

const CATEGORIES = ['All', 'Coding', 'Writing', 'Strategy', 'Thinking'];
const SORT_OPTIONS = [
  { value: 'hot', label: 'Hot' },
  { value: 'new', label: 'New' },
  { value: 'az', label: 'A-Z' },
];
const POPULAR_THRESHOLD = 3;

const CATEGORY_COLORS = {
  Coding:   { text: 'text-blue-500',   bg: 'bg-blue-500/10',   border: 'border-blue-500/25',   pill: 'text-blue-500',   pillBg: 'bg-blue-500/10',   pillBorder: 'border-blue-500/30' },
  Writing:  { text: 'text-violet-500',  bg: 'bg-violet-500/10',  border: 'border-violet-500/25',  pill: 'text-violet-500',  pillBg: 'bg-violet-500/10',  pillBorder: 'border-violet-500/30' },
  Strategy: { text: 'text-amber-500',   bg: 'bg-amber-500/10',   border: 'border-amber-500/25',   pill: 'text-amber-500',   pillBg: 'bg-amber-500/10',   pillBorder: 'border-amber-500/30' },
  Thinking: { text: 'text-cyan-500',    bg: 'bg-cyan-500/10',    border: 'border-cyan-500/25',    pill: 'text-cyan-500',    pillBg: 'bg-cyan-500/10',    pillBorder: 'border-cyan-500/30' },
};

const lockedPreviewPrompts = prompts.filter(p => !p.featured).slice(0, 3);

const PromptsPage = () => {
  const { toast } = useToast();
  const { currentUser, profile, isAuthenticated } = useAuth();

  // UI state
  const [copiedId, setCopiedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [sortBy, setSortBy] = useState('hot');
  const [expandedPromptId, setExpandedPromptId] = useState(null);
  const [commentInputs, setCommentInputs] = useState({});

  // Data state
  const [voteCounts, setVoteCounts] = useState({});
  const [userVotes, setUserVotes] = useState(new Set());
  const [comments, setComments] = useState({});
  const [votingIds, setVotingIds] = useState(new Set());
  const [submittingComment, setSubmittingComment] = useState(null);

  // Copy counts from localStorage
  const [copyCounts, setCopyCounts] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('prompt_copy_counts') || '{}');
    } catch {
      return {};
    }
  });

  // Which prompts to show
  const visiblePrompts = isAuthenticated ? prompts : prompts.filter(p => p.featured);
  const lockedCount = prompts.length - prompts.filter(p => p.featured).length;

  // Fetch votes and comments on mount (only for authenticated users)
  useEffect(() => {
    if (!currentUser) return;

    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Fetch current user's votes only (vote counts come from RPC)
      const { data: myVoteData, error: votesError } = await supabase
        .from('prompt_votes')
        .select('prompt_id')
        .eq('user_id', session.user.id);

      if (votesError) {
        // silently fail - votes are non-critical
      } else if (myVoteData) {
        const myVotes = new Set();
        for (const v of myVoteData) {
          myVotes.add(v.prompt_id);
        }
        setUserVotes(myVotes);
      }

      // Fetch comments
      const { data: commentData, error: commentsError } = await supabase
        .from('prompt_comments')
        .select('*')
        .order('created_at', { ascending: true });

      if (commentsError) {
        // silently fail - comments are non-critical
      } else if (commentData) {
        const userIds = [...new Set(commentData.map(c => c.user_id))];
        const profileMap = {};
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, name')
            .in('id', userIds);
          if (profiles) {
            for (const p of profiles) profileMap[p.id] = p.name;
          }
        }

        const grouped = {};
        for (const c of commentData) {
          if (!grouped[c.prompt_id]) grouped[c.prompt_id] = [];
          grouped[c.prompt_id].push({
            ...c,
            author_name: profileMap[c.user_id] || 'Anonymous',
          });
        }
        setComments(grouped);
      }
    };

    fetchData();
  }, [currentUser]);

  // Copy handler
  const handleCopy = async (id, content) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(id);
      toast({ title: "Copied to clipboard!" });
      setTimeout(() => setCopiedId(null), 2000);

      const p = prompts.find(x => x.id === id);
      trackEvent('prompt_copied', {
        prompt_id: id,
        prompt_title: p?.title,
        category: p?.category,
      });

      setCopyCounts(prev => {
        const updated = { ...prev, [id]: (prev[id] || 0) + 1 };
        localStorage.setItem('prompt_copy_counts', JSON.stringify(updated));
        return updated;
      });
    } catch {
      toast({ title: "Copy failed", description: "Could not copy to clipboard.", variant: "destructive" });
    }
  };

  // Vote handler (optimistic) - only for authenticated users
  const handleVote = useCallback(async (promptId) => {
    if (!isAuthenticated) {
      toast({ title: "Sign up to vote", description: "Create a free account to upvote prompts." });
      return;
    }
    if (votingIds.has(promptId)) return;

    const wasVoted = userVotes.has(promptId);
    const prevCount = voteCounts[promptId] || 0;

    setVotingIds(prev => new Set(prev).add(promptId));
    setUserVotes(prev => {
      const next = new Set(prev);
      if (wasVoted) next.delete(promptId);
      else next.add(promptId);
      return next;
    });
    setVoteCounts(prev => ({
      ...prev,
      [promptId]: wasVoted ? Math.max(prevCount - 1, 0) : prevCount + 1,
    }));

    const { data, error } = await supabase.rpc('toggle_prompt_vote', {
      p_prompt_id: promptId,
    });

    if (error) {
      setUserVotes(prev => {
        const next = new Set(prev);
        if (wasVoted) next.add(promptId);
        else next.delete(promptId);
        return next;
      });
      setVoteCounts(prev => ({ ...prev, [promptId]: prevCount }));
      toast({ title: "Vote failed", variant: "destructive" });
    } else if (data) {
      setVoteCounts(prev => ({ ...prev, [promptId]: data.count }));
      if (!wasVoted) {
        const p = prompts.find(x => x.id === promptId);
        trackEvent('prompt_voted', {
          prompt_id: promptId,
          prompt_title: p?.title,
          category: p?.category,
        });
      }
    }

    setVotingIds(prev => {
      const next = new Set(prev);
      next.delete(promptId);
      return next;
    });
  }, [isAuthenticated, votingIds, userVotes, voteCounts, toast]);

  // Comment handlers
  const handleSubmitComment = async (promptId) => {
    const content = (commentInputs[promptId] || '').trim();
    if (!content || !currentUser) return;
    if (content.length > 500) {
      toast({ title: "Comment too long", description: "Max 500 characters.", variant: "destructive" });
      return;
    }

    setSubmittingComment(promptId);

    const { data, error } = await supabase
      .from('prompt_comments')
      .insert({ prompt_id: promptId, user_id: currentUser.id, content })
      .select()
      .single();

    if (error) {
      toast({ title: "Comment failed", variant: "destructive" });
    } else {
      const newComment = { ...data, author_name: profile?.name || 'Anonymous' };
      setComments(prev => ({
        ...prev,
        [promptId]: [...(prev[promptId] || []), newComment],
      }));
      setCommentInputs(prev => ({ ...prev, [promptId]: '' }));

      const p = prompts.find(x => x.id === promptId);
      trackEvent('prompt_commented', {
        prompt_id: promptId,
        prompt_title: p?.title,
        category: p?.category,
      });
    }

    setSubmittingComment(null);
  };

  const handleDeleteComment = async (commentId, promptId) => {
    const comment = (comments[promptId] || []).find(c => c.id === commentId);
    if (!comment || !currentUser || comment.user_id !== currentUser.id) return;

    const { error } = await supabase
      .from('prompt_comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', currentUser.id);

    if (error) {
      toast({ title: "Delete failed", variant: "destructive" });
    } else {
      setComments(prev => ({
        ...prev,
        [promptId]: (prev[promptId] || []).filter(c => c.id !== commentId),
      }));
    }
  };

  // Popular badge
  const topVotedId = (() => {
    let maxId = null;
    let maxCount = 0;
    for (const [id, count] of Object.entries(voteCounts)) {
      if (count >= POPULAR_THRESHOLD && count > maxCount) {
        maxCount = count;
        maxId = Number(id);
      }
    }
    return maxId;
  })();

  // Filter and sort
  const filtered = visiblePrompts.filter(p => {
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q ||
      p.title.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  const sorted = (() => {
    const arr = [...filtered];
    if (sortBy === 'hot') return arr.sort((a, b) => (voteCounts[b.id] || 0) - (voteCounts[a.id] || 0));
    if (sortBy === 'new') return arr.sort((a, b) => b.id - a.id);
    const catOrder = CATEGORIES.filter(c => c !== 'All');
    return arr.sort((a, b) => {
      const catDiff = catOrder.indexOf(a.category) - catOrder.indexOf(b.category);
      if (catDiff !== 0) return catDiff;
      return a.title.localeCompare(b.title);
    });
  })();

  // Category counts for filter pills
  const categoryCounts = {};
  for (const p of visiblePrompts) {
    categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
  }

  return (
    <PageLayout
      seo={{
        title: "Prompts",
        description: "Curated AI prompts for coding, writing, and thinking. Copy them, tweak them, make them yours.",
        keywords: "AI prompts, coding prompts, writing prompts, ChatGPT prompts, Claude prompts",
        url: "https://flylabs.fun/prompts",
      }}
      className="pt-32 pb-24"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto px-6"
      >
        <div className="max-w-4xl mx-auto">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-12">
            <Link to="/explore" className="inline-flex items-center text-muted-foreground hover:text-foreground font-bold transition-colors bg-card px-4 py-2 rounded-xl border border-border shadow-sm">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Playground
            </Link>
            <div className="flex items-center gap-2 text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">
              {isAuthenticated ? (
                <><ShieldCheck className="w-4 h-4" /> Member Access</>
              ) : (
                <><Sparkles className="w-4 h-4" /> 5 Free Prompts</>
              )}
            </div>
          </div>

          {/* Header */}
          <div className="flex items-center gap-4 md:gap-6 mb-10">
            <div className="bg-primary/10 w-14 h-14 md:w-20 md:h-20 rounded-2xl flex items-center justify-center border border-primary/20 shadow-inner shrink-0">
              <Sparkles className="w-7 h-7 md:w-10 md:h-10 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tight">Prompts</h1>
              <p className="text-lg md:text-xl text-muted-foreground font-bold mt-2">Copy-paste prompts that actually work. Tested, tweaked, ready to use.</p>
            </div>
          </div>

          {/* Search - only show for authenticated users */}
          {isAuthenticated && (
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <label htmlFor="prompt-search" className="sr-only">Search prompts</label>
              <input
                id="prompt-search"
                type="text"
                placeholder="Search by title, category, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 pl-11 pr-10 rounded-2xl border border-border bg-card text-sm font-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* Filters row - only show for authenticated users */}
          {isAuthenticated && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
              {/* Categories */}
              <div className="flex gap-1.5 flex-wrap">
                {CATEGORIES.map(cat => {
                  const count = cat === 'All' ? visiblePrompts.length : (categoryCounts[cat] || 0);
                  const colors = CATEGORY_COLORS[cat];
                  const isActive = activeCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className="relative px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors"
                    >
                      {isActive && (
                        <motion.span
                          layoutId="activeCategory"
                          className={`absolute inset-0 border rounded-full ${colors ? `${colors.pillBg} ${colors.pillBorder}` : 'bg-primary/10 border-primary/30'}`}
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        />
                      )}
                      <span className={`relative z-10 ${isActive ? (colors ? colors.pill : 'text-primary') : 'text-muted-foreground hover:text-foreground'}`}>
                        {cat} <span className="text-xs opacity-60">{count}</span>
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Sort + count */}
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  {SORT_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setSortBy(opt.value)}
                      className="relative px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
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
                <span className="text-xs text-muted-foreground/60 font-medium tabular-nums">
                  {sorted.length} prompt{sorted.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          )}

          {/* Column header */}
          <div className="flex items-center gap-3 md:gap-4 px-4 md:px-5 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50">
            <span className="shrink-0 w-10 text-center">Votes</span>
            <span className="flex-1 min-w-0">Prompt</span>
            <span className="hidden sm:inline w-16 text-center">Comments</span>
            <span className="w-20 text-center">Copy</span>
            <span className="w-4" />
          </div>

          {/* Prompt list */}
          <div className="rounded-2xl border border-border overflow-hidden bg-card">
            {sorted.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground font-medium">
                No prompts found matching your search.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {(() => {
                  let lastCategory = null;
                  let itemIndex = 0;
                  return sorted.map((prompt) => {
                    const voteCount = voteCounts[prompt.id] || 0;
                    const hasVoted = userVotes.has(prompt.id);
                    const isPopular = prompt.id === topVotedId;
                    const promptComments = comments[prompt.id] || [];
                    const isExpanded = expandedPromptId === prompt.id;
                    const copyCount = copyCounts[prompt.id] || 0;
                    const c = CATEGORY_COLORS[prompt.category];

                    const showCategoryHeader = activeCategory === 'All' && sortBy === 'az' && prompt.category !== lastCategory;
                    lastCategory = prompt.category;
                    const currentIndex = itemIndex++;

                    return (
                      <React.Fragment key={prompt.id}>
                        {showCategoryHeader && (
                          <div className={`flex items-center gap-2.5 px-4 md:px-5 py-2.5 ${c ? c.bg : 'bg-muted/30'}`}>
                            <span className={`text-xs font-bold uppercase tracking-wider ${c ? c.text : 'text-primary'}`}>
                              {prompt.category}
                            </span>
                            <span className="text-[10px] font-medium text-muted-foreground/50">
                              {categoryCounts[prompt.category]} prompt{categoryCounts[prompt.category] !== 1 ? 's' : ''}
                            </span>
                          </div>
                        )}

                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: currentIndex * 0.05 }}
                          className="group/row relative"
                        >
                          {/* Compact row */}
                          <div
                            onClick={() => setExpandedPromptId(isExpanded ? null : prompt.id)}
                            className="w-full text-left px-4 md:px-5 py-3.5 flex items-center gap-3 md:gap-4 hover:bg-muted/30 transition-colors cursor-pointer"
                          >
                            {/* Vote */}
                            <motion.div
                              whileTap={{ scale: 1.3 }}
                              transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                              onClick={(e) => { e.stopPropagation(); handleVote(prompt.id); }}
                              className={`flex flex-col items-center gap-0.5 shrink-0 w-10 cursor-pointer transition-colors ${
                                hasVoted ? 'text-primary' : 'text-muted-foreground hover:text-primary'
                              }`}
                              title={!isAuthenticated ? 'Sign up to vote' : undefined}
                            >
                              <ChevronUp className={`w-4 h-4 ${hasVoted ? 'stroke-[2.5]' : ''}`} />
                              <AnimatePresence mode="wait">
                                <motion.span
                                  key={voteCount}
                                  initial={{ opacity: 0, y: 4 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -4 }}
                                  transition={{ duration: 0.15 }}
                                  className="text-xs font-bold tabular-nums"
                                >
                                  {voteCount}
                                </motion.span>
                              </AnimatePresence>
                            </motion.div>

                            {/* Title + category badge */}
                            <div className="flex-1 min-w-0 flex items-center gap-2.5">
                              <span className={`text-[11px] font-bold px-2 py-0.5 rounded border shrink-0 ${c ? `${c.text} ${c.bg} ${c.border}` : 'text-primary bg-primary/10 border-primary/20'}`}>
                                {prompt.category}
                              </span>
                              <span className="font-semibold text-foreground truncate">
                                {prompt.title}
                              </span>
                              {prompt.author && (
                                <span className="hidden md:inline text-[10px] font-semibold text-muted-foreground/50 shrink-0">
                                  by {prompt.author}
                                </span>
                              )}
                              {isPopular && (
                                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-orange-500 bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20 shrink-0">
                                  <Flame className="w-3 h-3" /> Popular
                                </span>
                              )}
                            </div>

                            {/* Comments count */}
                            <span className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-muted-foreground/60 w-16 justify-center shrink-0">
                              <MessageCircle className="w-3.5 h-3.5" /> {promptComments.length}
                            </span>

                            {/* Copy button */}
                            <button
                              onClick={(e) => { e.stopPropagation(); handleCopy(prompt.id, prompt.content); }}
                              className={`shrink-0 w-20 inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                                copiedId === prompt.id
                                  ? 'bg-primary/15 text-primary'
                                  : 'bg-muted/50 text-muted-foreground hover:text-primary hover:bg-primary/10'
                              }`}
                            >
                              {copiedId === prompt.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                              {copiedId === prompt.id ? 'Copied!' : 'Copy'}
                            </button>

                            {/* Expand chevron */}
                            <ChevronDown className={`w-4 h-4 shrink-0 text-muted-foreground/40 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                          </div>

                          {/* Hover tooltip - only when collapsed */}
                          {!isExpanded && (
                            <div className="pointer-events-none absolute left-14 right-14 top-full z-30 opacity-0 translate-y-1 group-hover/row:opacity-100 group-hover/row:translate-y-0 transition-all duration-200 delay-300">
                              <div className="mt-1 px-4 py-3 rounded-xl bg-popover border border-border shadow-lg text-sm text-muted-foreground font-medium leading-relaxed">
                                {prompt.description}
                              </div>
                            </div>
                          )}

                          {/* Expanded content */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25, ease: 'easeInOut' }}
                                className="overflow-hidden"
                              >
                                <div className="px-4 md:px-5 pb-5 pt-1">
                                  {/* Description + author */}
                                  <div className="pl-0 sm:pl-[52px] mb-4">
                                    <p className="text-sm text-muted-foreground font-medium">
                                      {prompt.description}
                                    </p>
                                    {prompt.author && (
                                      <p className="text-xs font-semibold text-muted-foreground/40 mt-1">
                                        Inspired by {prompt.author}
                                      </p>
                                    )}
                                  </div>

                                  {/* Prompt content block */}
                                  <div className="ml-0 sm:ml-[52px]">
                                    <div className="relative group/code">
                                      <pre className="bg-muted/50 p-4 pr-4 sm:pr-24 rounded-xl text-sm font-mono text-foreground/80 border border-border/50 whitespace-pre-wrap leading-relaxed mb-4">
                                        {prompt.content}
                                      </pre>
                                      <button
                                        onClick={() => handleCopy(prompt.id, prompt.content)}
                                        className="absolute top-3 right-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
                                      >
                                        {copiedId === prompt.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                        {copiedId === prompt.id ? 'Copied!' : 'Copy'}
                                      </button>
                                    </div>

                                    {/* Action bar */}
                                    <div className="flex items-center gap-2.5 mb-4">
                                      <motion.button
                                        whileTap={{ scale: 1.3 }}
                                        transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                                        onClick={() => handleVote(prompt.id)}
                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                                          hasVoted
                                            ? 'bg-primary/10 text-primary border border-primary/30'
                                            : 'bg-muted/50 text-muted-foreground hover:text-primary hover:bg-primary/5 border border-border/50'
                                        }`}
                                        title={!isAuthenticated ? 'Sign up to vote' : undefined}
                                      >
                                        <ChevronUp className={`w-4 h-4 ${hasVoted ? 'stroke-[2.5]' : ''}`} />
                                        Upvote {voteCount > 0 && voteCount}
                                      </motion.button>

                                      <button
                                        onClick={() => {
                                          if (!isAuthenticated) {
                                            toast({ title: "Sign up to comment", description: "Create a free account to join the conversation." });
                                            return;
                                          }
                                          const el = document.getElementById(`comments-${prompt.id}`);
                                          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                                        }}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold bg-muted/50 text-muted-foreground hover:text-foreground border border-border/50 transition-colors"
                                      >
                                        <MessageCircle className="w-4 h-4" />
                                        {promptComments.length} Comment{promptComments.length !== 1 ? 's' : ''}
                                      </button>

                                      {copyCount > 0 && (
                                        <span className="text-xs font-medium text-muted-foreground/60 tabular-nums ml-auto">
                                          Copied {copyCount}x
                                        </span>
                                      )}
                                    </div>

                                    {/* Comments section - only for authenticated users */}
                                    {isAuthenticated && (
                                      <div id={`comments-${prompt.id}`} className="border-t border-border/50 pt-4 space-y-3">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                          {promptComments.length} Comment{promptComments.length !== 1 ? 's' : ''}
                                        </p>

                                        {promptComments.length > 0 && (
                                          <div className="space-y-2.5 max-h-[50vh] sm:max-h-64 overflow-y-auto">
                                            {promptComments.map(comment => (
                                              <div key={comment.id} className="flex gap-2 group/comment py-1">
                                                <div className="flex-1 min-w-0">
                                                  <div className="flex items-center gap-1.5 mb-0.5">
                                                    <span className="text-xs font-semibold text-foreground">{comment.author_name}</span>
                                                    <span className="text-xs text-muted-foreground/40">{timeAgo(comment.created_at)}</span>
                                                  </div>
                                                  <p className="text-sm text-muted-foreground leading-relaxed break-words">{comment.content}</p>
                                                </div>
                                                {currentUser && comment.user_id === currentUser.id && (
                                                  <button
                                                    onClick={() => handleDeleteComment(comment.id, prompt.id)}
                                                    className="opacity-60 sm:opacity-0 sm:group-hover/comment:opacity-100 shrink-0 p-2 text-muted-foreground/50 hover:text-destructive transition-all"
                                                    aria-label="Delete comment"
                                                  >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                  </button>
                                                )}
                                              </div>
                                            ))}
                                          </div>
                                        )}

                                        {/* Comment input */}
                                        <div className="flex gap-2">
                                          <input
                                            type="text"
                                            placeholder="Add a comment..."
                                            maxLength={500}
                                            value={commentInputs[prompt.id] || ''}
                                            onChange={(e) => setCommentInputs(prev => ({ ...prev, [prompt.id]: e.target.value }))}
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSubmitComment(prompt.id);
                                              }
                                            }}
                                            className="flex-1 h-9 px-3 rounded-lg border border-border bg-background text-sm font-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all"
                                          />
                                          <button
                                            onClick={() => handleSubmitComment(prompt.id)}
                                            disabled={submittingComment === prompt.id || !(commentInputs[prompt.id] || '').trim()}
                                            className="shrink-0 h-9 w-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                          >
                                            <Send className="w-4 h-4" />
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      </React.Fragment>
                    );
                  });
                })()}
              </div>
            )}
          </div>

          {/* Gate section for unauthenticated users */}
          {!isAuthenticated && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-12"
            >
              {/* Blurred preview cards */}
              <div className="relative mb-8">
                <div className="rounded-2xl border border-border overflow-hidden bg-card">
                  <div className="divide-y divide-border">
                    {lockedPreviewPrompts.map((prompt) => {
                      const c = CATEGORY_COLORS[prompt.category];
                      return (
                        <div key={prompt.id} className="px-4 md:px-5 py-3.5 flex items-center gap-3 md:gap-4 select-none">
                          <div className="flex flex-col items-center gap-0.5 shrink-0 w-10 text-muted-foreground/30">
                            <ChevronUp className="w-4 h-4" />
                            <span className="text-xs font-bold tabular-nums blur-[2px]">0</span>
                          </div>
                          <div className="flex-1 min-w-0 flex items-center gap-2.5">
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded border shrink-0 ${c ? `${c.text} ${c.bg} ${c.border}` : 'text-primary bg-primary/10 border-primary/20'}`}>
                              {prompt.category}
                            </span>
                            <span className="font-semibold text-foreground truncate">
                              {prompt.title}
                            </span>
                          </div>
                          <Lock className="w-4 h-4 text-muted-foreground/30 shrink-0" />
                        </div>
                      );
                    })}
                  </div>
                </div>
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent rounded-2xl pointer-events-none" />
              </div>

              {/* Unlock CTA */}
              <div className="text-center bg-card border border-border rounded-2xl p-8 md:p-12">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-primary/20">
                  <Lock className="w-7 h-7 text-primary" />
                </div>
                <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-3">
                  Unlock {lockedCount} more prompts
                </h2>
                <p className="text-muted-foreground font-medium mb-6 max-w-md mx-auto">
                  Create a free account to access the full library, vote on your favorites, and leave comments.
                </p>

                {/* Value bullets */}
                <div className="flex flex-col gap-2 mb-8 max-w-xs mx-auto text-left">
                  <div className="flex items-center gap-3 text-sm">
                    <Sparkles className="w-4 h-4 text-primary shrink-0" />
                    <span className="font-medium">{prompts.length} curated AI prompts</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <LayoutTemplate className="w-4 h-4 text-secondary shrink-0" />
                    <span className="font-medium">Ready-made Notion systems</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Code className="w-4 h-4 text-blue-500 shrink-0" />
                    <span className="font-medium">First access to new tools</span>
                  </div>
                </div>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link
                    to="/signup"
                    className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
                    onClick={() => trackEvent('cta_click', { cta: 'signup', location: 'prompts_gate' })}
                  >
                    Create Free Account <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center px-6 py-3 rounded-xl border border-border text-foreground font-semibold hover:bg-muted transition-colors"
                  >
                    Log in
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </PageLayout>
  );
};

export default PromptsPage;
