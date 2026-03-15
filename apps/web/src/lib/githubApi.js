const API_URL = 'https://gh-calendar.rschristian.dev/user/fly-labs';
const COMMITS_API_URL = 'https://api.github.com/repos/fly-labs/website/commits';
const CACHE_KEY = 'gh_contributions';
const COMMITS_CACHE_KEY = 'gh_commits';
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

function getCache(key = CACHE_KEY) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function setCache(data, key = CACHE_KEY) {
  try {
    localStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
  } catch {
    // localStorage full or unavailable
  }
}

function computeStats(weeks) {
  const days = weeks.flat();
  const total = days.reduce((sum, d) => sum + d.count, 0);

  // Current streak (from most recent day going backwards)
  let currentStreak = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].count > 0) currentStreak++;
    else if (currentStreak > 0) break;
  }

  // Longest streak
  let longestStreak = 0;
  let streak = 0;
  for (const d of days) {
    if (d.count > 0) {
      streak++;
      if (streak > longestStreak) longestStreak = streak;
    } else {
      streak = 0;
    }
  }

  // Most active day of the week
  const dayCounts = [0, 0, 0, 0, 0, 0, 0];
  for (const d of days) {
    const dow = new Date(d.date + 'T00:00:00').getDay();
    dayCounts[dow] += d.count;
  }
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const maxIdx = dayCounts.indexOf(Math.max(...dayCounts));
  const mostActiveDay = dayNames[maxIdx];

  return { total, currentStreak, longestStreak, mostActiveDay };
}

export async function fetchRecentCommits(count = 10) {
  const cached = getCache(COMMITS_CACHE_KEY);

  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.data;
  }

  try {
    const res = await fetch(`${COMMITS_API_URL}?per_page=${count}`, {
      signal: AbortSignal.timeout(10000),
      headers: { Accept: 'application/vnd.github.v3+json' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();

    const commits = json.map((c) => ({
      sha: c.sha.slice(0, 7),
      message: c.commit.message.split('\n')[0],
      date: c.commit.committer.date,
      url: c.html_url,
    }));

    setCache(commits, COMMITS_CACHE_KEY);
    return commits;
  } catch {
    if (cached) return cached.data;
    return null;
  }
}

export async function fetchContributions() {
  const cached = getCache();

  // Return fresh cache
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.data;
  }

  try {
    const res = await fetch(API_URL, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();

    const weeks = json.contributions.map((week) =>
      week.map((day) => ({
        date: day.date,
        count: day.count,
        intensity: parseInt(day.intensity, 10),
      }))
    );

    const stats = computeStats(weeks);
    const result = { total: json.total, weeks, stats };
    setCache(result);
    return result;
  } catch {
    // Fall back to stale cache
    if (cached) return cached.data;
    return null;
  }
}
