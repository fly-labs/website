import { useMemo, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { industries } from '@/lib/data/ideas.js';
import { trackEvent } from '@/lib/analytics.js';

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

function getVerdict(idea) {
  return (
    idea.enrichment?.verdict?.recommendation ||
    idea.score_breakdown?.synthesis?.verdict ||
    null
  );
}

function getConfidence(idea) {
  return (
    idea.enrichment?.validation?.confidence ||
    null
  );
}

function getCompositeScore(idea) {
  return idea.score_breakdown?.synthesis?.composite_score || 0;
}

// Time-decay hot score: votes / (hoursAge + 2)^1.5
function getHotScore(idea) {
  const votes = idea.votes || 0;
  const hoursAge =
    (Date.now() - new Date(idea.published_at || idea.created_at).getTime()) /
    (1000 * 60 * 60);
  return votes / Math.pow(hoursAge + 2, 1.5);
}

function sortIdeas(arr, sortBy) {
  const sorted = [...arr];
  switch (sortBy) {
    case 'hot':
      return sorted.sort((a, b) => getHotScore(b) - getHotScore(a));
    case 'new':
      return sorted.sort(
        (a, b) =>
          new Date(b.published_at || b.created_at) -
          new Date(a.published_at || a.created_at)
      );
    case 'oldest':
      return sorted.sort(
        (a, b) =>
          new Date(a.published_at || a.created_at) -
          new Date(b.published_at || b.created_at)
      );
    case 'top':
      return sorted.sort((a, b) => (b.votes || 0) - (a.votes || 0));
    case 'flylabs':
      return sorted.sort(
        (a, b) => (b.flylabs_score || 0) - (a.flylabs_score || 0)
      );
    case 'hormozi':
      return sorted.sort(
        (a, b) => (b.hormozi_score || 0) - (a.hormozi_score || 0)
      );
    case 'koe':
      return sorted.sort((a, b) => (b.koe_score || 0) - (a.koe_score || 0));
    case 'okamoto':
      return sorted.sort(
        (a, b) => (b.okamoto_score || 0) - (a.okamoto_score || 0)
      );
    case 'validation':
      return sorted.sort(
        (a, b) => (b.validation_score || 0) - (a.validation_score || 0)
      );
    case 'verdict': {
      const priority = { BUILD: 3, VALIDATE_FIRST: 2, SKIP: 1 };
      return sorted.sort((a, b) => {
        const pa = priority[getVerdict(a)] || 0;
        const pb = priority[getVerdict(b)] || 0;
        if (pa !== pb) return pb - pa;
        return getCompositeScore(b) - getCompositeScore(a);
      });
    }
    default:
      return sorted;
  }
}

export function useIdeaFilters(ideas) {
  const [searchParams, setSearchParams] = useSearchParams();

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

  // Filter pipeline: search -> source -> type -> industry -> verdict -> score -> confidence -> sort -> paginate
  const { filtered, sorted, paginated, totalPages, sourceCounts, typeCounts, industryCounts, verdictCounts, confidenceCounts } = useMemo(() => {
    // 1. Search
    const searched = searchQuery
      ? ideas.filter((i) => {
          const q = searchQuery.toLowerCase();
          return (
            (i.idea_title || '').toLowerCase().includes(q) ||
            (i.idea_description || '').toLowerCase().includes(q)
          );
        })
      : ideas;

    // 2. Source
    const sourceFiltered =
      activeSource === 'all'
        ? searched
        : activeSource === 'community'
          ? searched.filter((i) => !i.source || i.source === 'community')
          : searched.filter((i) => i.source === activeSource);

    // Compute source counts (after search only)
    const srcCounts = {};
    for (const i of searched) {
      const s = i.source || 'community';
      srcCounts[s] = (srcCounts[s] || 0) + 1;
    }
    srcCounts.all = searched.length;

    // 3. Type
    const typeFiltered =
      activeType === 'All'
        ? sourceFiltered
        : sourceFiltered.filter((i) => i.category === activeType);

    // Compute type counts (after source filter)
    const tCounts = { All: sourceFiltered.length };
    for (const i of sourceFiltered) {
      const t = i.category || 'Other';
      tCounts[t] = (tCounts[t] || 0) + 1;
    }

    // 4. Industry
    const industryFiltered =
      activeIndustry === 'All'
        ? typeFiltered
        : typeFiltered.filter((i) => i.industry === activeIndustry);

    // Compute industry counts (after type filter)
    const indCounts = { All: typeFiltered.length };
    for (const i of typeFiltered) {
      if (i.industry) {
        indCounts[i.industry] = (indCounts[i.industry] || 0) + 1;
      }
    }

    // 5. Verdict
    const verdictFiltered =
      verdict === 'all'
        ? industryFiltered
        : industryFiltered.filter((i) => getVerdict(i) === verdict);

    // Compute verdict counts (after industry filter)
    const vCounts = { all: industryFiltered.length };
    for (const i of industryFiltered) {
      const v = getVerdict(i);
      if (v) vCounts[v] = (vCounts[v] || 0) + 1;
    }

    // 6. Score threshold
    const scoreFiltered =
      minScore === 0
        ? verdictFiltered
        : verdictFiltered.filter(
            (i) => getCompositeScore(i) >= minScore
          );

    // 7. Confidence
    const confFiltered =
      confidence === 'all'
        ? scoreFiltered
        : scoreFiltered.filter((i) => getConfidence(i) === confidence);

    // Compute confidence counts (after score filter)
    const cCounts = { all: scoreFiltered.length };
    for (const i of scoreFiltered) {
      const c = getConfidence(i);
      if (c) cCounts[c] = (cCounts[c] || 0) + 1;
    }

    // Sort
    const sortedArr = sortIdeas(confFiltered, sortBy);

    // Paginate
    const tp = Math.max(1, Math.ceil(sortedArr.length / perPage));
    const p = Math.min(currentPage, tp);
    const paginatedArr = sortedArr.slice((p - 1) * perPage, p * perPage);

    return {
      filtered: confFiltered,
      sorted: sortedArr,
      paginated: paginatedArr,
      totalPages: tp,
      sourceCounts: srcCounts,
      typeCounts: tCounts,
      industryCounts: indCounts,
      verdictCounts: vCounts,
      confidenceCounts: cCounts,
    };
  }, [ideas, searchQuery, activeSource, activeType, activeIndustry, verdict, minScore, confidence, sortBy, perPage, currentPage]);

  // Dynamic industries based on type-filtered results
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

    // Computed
    filtered,
    sorted,
    paginated,
    totalPages,
    sourceCounts,
    typeCounts,
    industryCounts,
    verdictCounts,
    confidenceCounts,
    activeIndustries,
    activeFilterCount,
    activeFilters,
    clearAllFilters,
    getPageNumbers,
  };
}
