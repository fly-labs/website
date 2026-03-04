const API_URL = 'https://gh-calendar.rschristian.dev/user/fly-labs';
const CACHE_KEY = 'gh_contributions';
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

function getCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    return cached;
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

export async function fetchContributions() {
  const cached = getCache();

  // Return fresh cache
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.data;
  }

  try {
    const res = await fetch(API_URL);
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
