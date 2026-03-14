const ARCHIVE_URL = 'https://falacomigo.substack.com/api/v1/archive';
const RSS_URL = 'https://api.rss2json.com/v1/api.json?rss_url=https://falacomigo.substack.com/feed';
const CACHE_KEY = 'substack_articles';
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

function getCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function setCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
  } catch {
    // localStorage full or unavailable
  }
}

function normalize(post) {
  const wordCount = post.wordcount || 0;
  return {
    id: post.id,
    title: post.title,
    subtitle: post.subtitle || '',
    slug: post.slug,
    url: post.canonical_url || `https://falacomigo.substack.com/p/${post.slug}`,
    coverImage: post.cover_image || post.thumbnail || '',
    publishedAt: post.post_date || post.pubDate || post.published_at,
    wordCount,
    reactions: post.reaction_count || 0,
    comments: post.comment_count || 0,
    restacks: post.child_publication_count || 0,
    readTime: Math.max(1, Math.ceil(wordCount / 250)),
  };
}

function normalizeRss(item) {
  return {
    id: item.guid || item.link,
    title: item.title,
    subtitle: item.description ? item.description.replace(/<[^>]*>?/gm, '') : '',
    slug: '',
    url: item.link,
    coverImage: item.thumbnail || '',
    publishedAt: item.pubDate,
    wordCount: 0,
    reactions: 0,
    comments: 0,
    restacks: 0,
    readTime: 0,
  };
}

async function fetchFromArchive(limit) {
  const res = await fetch(`${ARCHIVE_URL}?sort=new&offset=0&limit=${limit}`, {
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const posts = await res.json();
  return posts.map(normalize);
}

async function fetchFromRss(limit) {
  const res = await fetch(RSS_URL, { signal: AbortSignal.timeout(10000) });
  const data = await res.json();
  if (data.status !== 'ok') throw new Error('RSS feed error');
  return data.items.slice(0, limit).map(normalizeRss);
}

export async function fetchArticles(limit = 12) {
  const cached = getCache();

  // Return fresh cache
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.data;
  }

  try {
    // Try archive API first (has engagement metrics)
    const articles = await fetchFromArchive(limit);
    setCache(articles);
    return articles;
  } catch {
    try {
      // Fallback to RSS (no engagement metrics)
      const articles = await fetchFromRss(limit);
      setCache(articles);
      return articles;
    } catch {
      // Fall back to stale cache
      if (cached) return cached.data;
      return null;
    }
  }
}
