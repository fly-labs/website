import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { industries } from '@/lib/data/ideas.js';
import { trackEvent } from '@/lib/analytics.js';
import supabase from '@/lib/supabaseClient.js';

const DEFAULTS = {
  sort: 'hot',
  source: 'all',
  type: 'All',
  industry: 'All',
  q: '',
  verdict: 'all',
  min_score: 0,
  confidence: 'all',
  per_page: 10,
  page: 1,
};

// Time-decay hot score: votes / (hoursAge + 2)^1.5
// Used client-side for hot sort only (can't be done server-side without RPC)
function getHotScore(idea) {
  const votes = idea.votes || 0;
  const hoursAge =
    (Date.now() - new Date(idea.published_at || idea.created_at).getTime()) /
    (1000 * 60 * 60);
  return votes / Math.pow(hoursAge + 2, 1.5);
}

export function useIdeaFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [ideas, setIdeas] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [globalCount, setGlobalCount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({
    source: { all: 0 },
    type: { All: 0 },
    industry: { All: 0 },
    verdict: { all: 0 },
    confidence: { all: 0 },
  });
  const abortRef = useRef(null);

  // Fetch total idea count once (unaffected by filters)
  useEffect(() => {
    supabase.from('ideas').select('*', { count: 'exact', head: true }).eq('approved', true)
      .then(({ count }) => { if (count != null) setGlobalCount(count); });
  }, []);

  // Read state from URL (fallback to defaults)
  const sortBy = searchParams.get('sort') || DEFAULTS.sort;
  const activeSource = searchParams.get('source') || DEFAULTS.source;
  const activeType = searchParams.get('type') || DEFAULTS.type;
  const activeIndustry = searchParams.get('industry') || DEFAULTS.industry;
  const searchQuery = searchParams.get('q') || DEFAULTS.q;
  const verdict = searchParams.get('verdict') || DEFAULTS.verdict;
  const minScore = Number(searchParams.get('min_score')) || DEFAULTS.min_score;
  const confidence = searchParams.get('confidence') || DEFAULTS.confidence;
  const perPage = Number(searchParams.get('per_page')) || DEFAULTS.per_page;
  const currentPage = Number(searchParams.get('page')) || DEFAULTS.page;

  // Update URL params (only non-defaults)
  const updateParams = useCallback(
    (updates) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(updates)) {
            const defaultVal = DEFAULTS[key];
            if (value === defaultVal || value === String(defaultVal)) {
              next.delete(key);
            } else {
              next.set(key, String(value));
            }
          }
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  // Setters
  const setSortBy = useCallback(
    (v) => {
      updateParams({ sort: v, page: 1 });
      trackEvent('ideas_sort_change', { sort_by: v });
    },
    [updateParams]
  );

  const setActiveSource = useCallback(
    (v) => {
      updateParams({ source: v, page: 1 });
      trackEvent('ideas_filter_change', { filter_type: 'source', filter_value: v });
    },
    [updateParams]
  );

  const setActiveType = useCallback(
    (v) => {
      updateParams({ type: v, page: 1 });
      trackEvent('ideas_filter_change', { filter_type: 'type', filter_value: v });
    },
    [updateParams]
  );

  const setActiveIndustry = useCallback(
    (v) => {
      updateParams({ industry: v, page: 1 });
      trackEvent('ideas_filter_change', { filter_type: 'industry', filter_value: v });
    },
    [updateParams]
  );

  const setSearchQuery = useCallback(
    (v) => {
      updateParams({ q: v, page: 1 });
      if (v) trackEvent('ideas_search', { query: v });
    },
    [updateParams]
  );

  const setVerdict = useCallback(
    (v) => {
      updateParams({ verdict: v, page: 1 });
      trackEvent('ideas_verdict_filter', { verdict: v });
    },
    [updateParams]
  );

  const setMinScore = useCallback(
    (v) => {
      updateParams({ min_score: v, page: 1 });
      trackEvent('ideas_score_filter', { min_score: v });
    },
    [updateParams]
  );

  const setConfidence = useCallback(
    (v) => {
      updateParams({ confidence: v, page: 1 });
      trackEvent('ideas_confidence_filter', { confidence: v });
    },
    [updateParams]
  );

  const setPerPage = useCallback(
    (v) => {
      updateParams({ per_page: v, page: 1 });
      trackEvent('ideas_filter_change', { filter_type: 'per_page', filter_value: v });
    },
    [updateParams]
  );

  const setCurrentPage = useCallback(
    (v) => {
      updateParams({ page: typeof v === 'function' ? v(currentPage) : v });
    },
    [updateParams, currentPage]
  );

  // Build base query with all filters (reused for data + counts)
  const buildFilteredQuery = useCallback((selectClause, opts = {}) => {
    let query = supabase
      .from('ideas')
      .select(selectClause, opts)
      .eq('approved', true);

    // Source filter
    if (activeSource !== 'all') {
      if (activeSource === 'community') {
        query = query.or('source.is.null,source.eq.community');
      } else {
        query = query.eq('source', activeSource);
      }
    }

    // Type filter
    if (activeType !== 'All') {
      query = query.eq('category', activeType);
    }

    // Industry filter
    if (activeIndustry !== 'All') {
      query = query.eq('industry', activeIndustry);
    }

    // Text search
    if (searchQuery) {
      const escaped = searchQuery.replace(/%/g, '\\%').replace(/_/g, '\\_');
      query = query.or(`idea_title.ilike.%${escaped}%,idea_description.ilike.%${escaped}%`);
    }

    // Verdict filter (uses materialized column)
    if (verdict !== 'all') {
      query = query.eq('verdict', verdict);
    }

    // Score threshold (uses materialized composite_score)
    if (minScore > 0) {
      query = query.gte('composite_score', minScore);
    }

    // Confidence filter (uses materialized column)
    if (confidence !== 'all') {
      query = query.eq('confidence', confidence);
    }

    return query;
  }, [activeSource, activeType, activeIndustry, searchQuery, verdict, minScore, confidence]);

  // Apply sorting to query
  const applySorting = useCallback((query, sort) => {
    switch (sort) {
      case 'new':
        return query
          .order('published_at', { ascending: false, nullsFirst: false })
          .order('created_at', { ascending: false });
      case 'oldest':
        return query
          .order('published_at', { ascending: true, nullsFirst: true })
          .order('created_at', { ascending: true });
      case 'top':
        return query.order('votes', { ascending: false });
      case 'flylabs':
        return query.order('flylabs_score', { ascending: false, nullsFirst: false });
      case 'verdict':
        // Verdict sort: BUILD > VALIDATE_FIRST > SKIP, then by composite_score
        return query
          .order('verdict', { ascending: true, nullsFirst: false })
          .order('composite_score', { ascending: false, nullsFirst: false });
      case 'hot':
      default:
        // Hot sort requires client-side computation, fetch by votes+recency as approximation
        // We'll re-sort client-side after fetch
        return query
          .order('votes', { ascending: false })
          .order('created_at', { ascending: false });
    }
  }, []);

  // Fetch paginated data
  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);

      try {
        // Hot sort needs all results for proper scoring, but we cap at reasonable limit
        const isHotSort = sortBy === 'hot';
        const isVerdictSort = sortBy === 'verdict';

        let data, count;

        if (isHotSort) {
          // For hot sort, fetch all matching items (lightweight), sort client-side, then slice
          // This is necessary because hot score is a computed value
          const query = buildFilteredQuery('*', { count: 'exact' });
          const result = await query.limit(500);
          if (cancelled) return;
          if (result.error) throw result.error;

          // Sort by hot score client-side
          const sorted = (result.data || []).sort((a, b) => getHotScore(b) - getHotScore(a));
          count = result.count || sorted.length;

          // Paginate client-side
          const from = (currentPage - 1) * perPage;
          data = sorted.slice(from, from + perPage);
        } else {
          // For all other sorts, use server-side pagination
          let query = buildFilteredQuery('*', { count: 'exact' });
          query = applySorting(query, sortBy);

          const from = (currentPage - 1) * perPage;
          const to = from + perPage - 1;
          query = query.range(from, to);

          const result = await query;
          if (cancelled) return;
          if (result.error) throw result.error;

          data = result.data || [];
          count = result.count || 0;

          // For verdict sort, re-sort client-side with proper priority
          if (isVerdictSort) {
            const priority = { BUILD: 3, VALIDATE_FIRST: 2, SKIP: 1 };
            data.sort((a, b) => {
              const pa = priority[a.verdict] || 0;
              const pb = priority[b.verdict] || 0;
              if (pa !== pb) return pb - pa;
              return (b.composite_score || 0) - (a.composite_score || 0);
            });
          }
        }

        if (!cancelled) {
          setIdeas(data);
          setTotalCount(count);
        }
      } catch (err) {
        console.error('Failed to fetch ideas:', err);
        if (!cancelled) {
          setIdeas([]);
          setTotalCount(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, [buildFilteredQuery, applySorting, sortBy, perPage, currentPage]);

  // Fetch counts for filters (lightweight query)
  useEffect(() => {
    let cancelled = false;

    const fetchCounts = async () => {
      try {
        // Fetch lightweight data for all approved ideas matching search only
        // (counts should reflect what's available before source/type/industry/verdict/score/confidence filters)
        let query = supabase
          .from('ideas')
          .select('source, category, industry, verdict, confidence')
          .eq('approved', true);

        if (searchQuery) {
          const escaped = searchQuery.replace(/%/g, '\\%').replace(/_/g, '\\_');
          query = query.or(`idea_title.ilike.%${escaped}%,idea_description.ilike.%${escaped}%`);
        }

        const { data, error } = await query.limit(2000);
        if (cancelled || error) return;

        const src = { all: data.length };
        const typ = { All: 0 };
        const ind = { All: 0 };
        const vrd = { all: 0 };
        const cnf = { all: 0 };

        // Apply cascading counts
        // Source counts: after search
        for (const i of data) {
          const s = i.source || 'community';
          src[s] = (src[s] || 0) + 1;
        }

        // Type counts: after search + source
        const sourceFiltered = activeSource === 'all'
          ? data
          : activeSource === 'community'
            ? data.filter(i => !i.source || i.source === 'community')
            : data.filter(i => i.source === activeSource);
        typ.All = sourceFiltered.length;
        for (const i of sourceFiltered) {
          const t = i.category || 'Other';
          typ[t] = (typ[t] || 0) + 1;
        }

        // Industry counts: after search + source + type
        const typeFiltered = activeType === 'All'
          ? sourceFiltered
          : sourceFiltered.filter(i => i.category === activeType);
        ind.All = typeFiltered.length;
        for (const i of typeFiltered) {
          if (i.industry) ind[i.industry] = (ind[i.industry] || 0) + 1;
        }

        // Verdict counts: after search + source + type + industry
        const industryFiltered = activeIndustry === 'All'
          ? typeFiltered
          : typeFiltered.filter(i => i.industry === activeIndustry);
        vrd.all = industryFiltered.length;
        for (const i of industryFiltered) {
          if (i.verdict) vrd[i.verdict] = (vrd[i.verdict] || 0) + 1;
        }

        // Confidence counts: after all above + verdict + score
        const verdictFiltered = verdict === 'all'
          ? industryFiltered
          : industryFiltered.filter(i => i.verdict === verdict);
        cnf.all = verdictFiltered.length;
        for (const i of verdictFiltered) {
          if (i.confidence) cnf[i.confidence] = (cnf[i.confidence] || 0) + 1;
        }

        if (!cancelled) {
          setCounts({
            source: src,
            type: typ,
            industry: ind,
            verdict: vrd,
            confidence: cnf,
          });
        }
      } catch (err) {
        // silently fail for counts
      }
    };

    fetchCounts();
    return () => { cancelled = true; };
  }, [searchQuery, activeSource, activeType, activeIndustry, verdict]);

  const totalPages = Math.max(1, Math.ceil(totalCount / perPage));
  const paginated = ideas;
  const sorted = ideas; // Already sorted from server

  // Dynamic industries based on counts
  const industryCounts = counts.industry;
  const activeIndustries = useMemo(
    () => industries.filter((ind) => industryCounts[ind.value] > 0),
    [industryCounts]
  );

  // Active filter count for badge
  const activeFilterCount =
    (activeSource !== 'all' ? 1 : 0) +
    (activeType !== 'All' ? 1 : 0) +
    (activeIndustry !== 'All' ? 1 : 0) +
    (verdict !== 'all' ? 1 : 0) +
    (minScore > 0 ? 1 : 0) +
    (confidence !== 'all' ? 1 : 0);

  // Active filters as chip array
  const activeFilters = useMemo(() => {
    const chips = [];
    if (activeSource !== 'all') {
      chips.push({
        key: 'source',
        label: 'Source',
        value: activeSource,
        onRemove: () => {
          setActiveSource('all');
          trackEvent('ideas_filter_removed', { filter_type: 'source', filter_value: activeSource });
        },
      });
    }
    if (activeType !== 'All') {
      chips.push({
        key: 'type',
        label: 'Type',
        value: activeType,
        onRemove: () => {
          setActiveType('All');
          trackEvent('ideas_filter_removed', { filter_type: 'type', filter_value: activeType });
        },
      });
    }
    if (activeIndustry !== 'All') {
      const label = industries.find((i) => i.value === activeIndustry)?.label || activeIndustry;
      chips.push({
        key: 'industry',
        label: 'Industry',
        value: label,
        onRemove: () => {
          setActiveIndustry('All');
          trackEvent('ideas_filter_removed', { filter_type: 'industry', filter_value: activeIndustry });
        },
      });
    }
    if (verdict !== 'all') {
      chips.push({
        key: 'verdict',
        label: 'Verdict',
        value: verdict === 'VALIDATE_FIRST' ? 'VALIDATE' : verdict,
        onRemove: () => {
          setVerdict('all');
          trackEvent('ideas_filter_removed', { filter_type: 'verdict', filter_value: verdict });
        },
      });
    }
    if (minScore > 0) {
      chips.push({
        key: 'min_score',
        label: 'Score',
        value: `\u2265${minScore}`,
        onRemove: () => {
          setMinScore(0);
          trackEvent('ideas_filter_removed', { filter_type: 'min_score', filter_value: minScore });
        },
      });
    }
    if (confidence !== 'all') {
      chips.push({
        key: 'confidence',
        label: 'Confidence',
        value: confidence,
        onRemove: () => {
          setConfidence('all');
          trackEvent('ideas_filter_removed', { filter_type: 'confidence', filter_value: confidence });
        },
      });
    }
    if (searchQuery) {
      chips.push({
        key: 'q',
        label: 'Search',
        value: searchQuery,
        onRemove: () => {
          setSearchQuery('');
          trackEvent('ideas_filter_removed', { filter_type: 'search', filter_value: searchQuery });
        },
      });
    }
    return chips;
  }, [activeSource, activeType, activeIndustry, verdict, minScore, confidence, searchQuery, setActiveSource, setActiveType, setActiveIndustry, setVerdict, setMinScore, setConfidence, setSearchQuery]);

  const clearAllFilters = useCallback(() => {
    const prevCount = activeFilters.length;
    setSearchParams({}, { replace: true });
    trackEvent('ideas_filters_cleared', { previous_count: prevCount });
  }, [setSearchParams, activeFilters.length]);

  // Pagination helpers
  const getPageNumbers = useCallback(() => {
    const pages = [];
    const tp = totalPages;
    const cp = Math.min(currentPage, tp);
    if (tp <= 7) {
      for (let i = 1; i <= tp; i++) pages.push(i);
    } else {
      pages.push(1);
      if (cp > 3) pages.push('...');
      for (let i = Math.max(2, cp - 1); i <= Math.min(tp - 1, cp + 1); i++) {
        pages.push(i);
      }
      if (cp < tp - 2) pages.push('...');
      pages.push(tp);
    }
    return pages;
  }, [totalPages, currentPage]);

  return {
    // State
    sortBy,
    activeSource,
    activeType,
    activeIndustry,
    searchQuery,
    verdict,
    minScore,
    confidence,
    perPage,
    currentPage,

    // Setters
    setSortBy,
    setActiveSource,
    setActiveType,
    setActiveIndustry,
    setSearchQuery,
    setVerdict,
    setMinScore,
    setConfidence,
    setPerPage,
    setCurrentPage,

    // Data
    loading,
    ideas,
    totalCount,
    globalCount,

    // Computed
    sorted,
    paginated,
    totalPages,
    sourceCounts: counts.source,
    typeCounts: counts.type,
    industryCounts: counts.industry,
    verdictCounts: counts.verdict,
    confidenceCounts: counts.confidence,
    activeIndustries,
    activeFilterCount,
    activeFilters,
    clearAllFilters,
    getPageNumbers,
  };
}
