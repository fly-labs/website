
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Loader2, TrendingUp, Target, Zap, Layers, FlaskConical, Lightbulb, BarChart3, Clock, ExternalLink, Trophy, Gem, ArrowUpRight, ArrowDownRight, GitCompare } from 'lucide-react';
import { PageLayout } from '@/components/PageLayout.jsx';
import { motion } from 'framer-motion';
import { fadeUp, staggerContainer, staggerItem } from '@/lib/animations.js';
import supabase from '@/lib/supabaseClient.js';
import { sourceOptions } from '@/lib/data/ideas.js';
import { cn, timeAgo } from '@/lib/utils.js';
import { verdictStyles, getScoreTier } from '@/components/ideas/ScoreUtils.jsx';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area,
  ComposedChart, Line,
  ScatterChart, Scatter, ZAxis,
} from 'recharts';

// ── Chart color palette (matches design system) ──
const COLORS = {
  primary: 'hsl(142, 70%, 40%)',
  secondary: 'hsl(186, 70%, 38%)',
  accent: 'hsl(262, 55%, 55%)',
  amber: 'hsl(38, 92%, 50%)',
  red: 'hsl(0, 72%, 51%)',
  indigo: 'hsl(234, 62%, 55%)',
  blue: 'hsl(210, 70%, 50%)',
  orange: 'hsl(25, 85%, 55%)',
};

const VERDICT_COLORS = {
  BUILD: COLORS.primary,
  VALIDATE_FIRST: COLORS.amber,
  SKIP: COLORS.red,
};

const SOURCE_COLORS = {
  community: COLORS.primary,
  problemhunt: COLORS.secondary,
  reddit: COLORS.orange,
  producthunt: COLORS.accent,
  x: COLORS.blue,
  hackernews: COLORS.amber,
  github: COLORS.indigo,
  yc: COLORS.red,
};

const FRAMEWORK_COLORS = {
  'Fly Labs': COLORS.primary,
  'Hormozi': COLORS.amber,
  'Koe': COLORS.accent,
  'Okamoto': COLORS.secondary,
};

// Short labels for mobile
const SOURCE_SHORT = {
  'Product Hunt': 'PH',
  'Hacker News': 'HN',
  'YC Graveyard': 'YC',
  'ProblemHunt': 'ProbHunt',
  'Community': 'Community',
  'Reddit': 'Reddit',
  'GitHub': 'GitHub',
  'X': 'X',
};

// ── Doodle SVG decorations ──
const PaperPlaneDoodle = ({ className }) => (
  <svg className={className} viewBox="0 0 56 56" fill="none">
    <path d="M6 46 L48 28 L6 8 L16 28 Z" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16 28 L48 28" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeDasharray="4 4" />
    <path d="M2 20 L8 22" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    <path d="M0 28 L6 28" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    <path d="M2 36 L8 34" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

const FlaskDoodle = ({ className }) => (
  <svg className={className} viewBox="0 0 48 60" fill="none">
    <path d="M18 4 L18 22 C18 22 6 36 7 46 C8 54 16 56 24 56 C32 56 40 54 41 46 C42 36 30 22 30 22 L30 4" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M14 4 L34 4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M12 42 C16 38 20 44 24 40 C28 36 32 42 36 40" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <circle cx="20" cy="46" r="2" stroke="currentColor" strokeWidth="1.4" />
    <circle cx="28" cy="42" r="1.5" stroke="currentColor" strokeWidth="1.2" />
  </svg>
);

const LightbulbDoodle = ({ className }) => (
  <svg className={className} viewBox="0 0 44 56" fill="none">
    <path d="M22 10 C14 10 8 16 8 24 C8 30 12 34 14 38 L14 42 L30 42 L30 38 C32 34 36 30 36 24 C36 16 30 10 22 10 Z" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16 42 L16 46 C16 48 18 50 22 50 C26 50 28 48 28 46 L28 42" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M22 2 L22 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M38 10 L35 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M6 10 L9 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const StarDoodle = ({ className }) => (
  <svg className={className} viewBox="0 0 40 40" fill="none">
    <path d="M20 4 L23 14 L34 14 L26 21 L28 32 L20 26 L12 32 L14 21 L6 14 L17 14 Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ── Y-axis number formatter ──
const formatAxisNumber = (v) => {
  if (v >= 1000) return `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}K`;
  return v.toLocaleString();
};

// ── Custom tooltip ──
const ChartTooltip = ({ active, payload, label, formatter }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg text-sm max-w-[200px]">
      {label && <p className="font-medium text-foreground mb-1 truncate">{label}</p>}
      {payload.map((entry, i) => (
        <p key={i} className="text-muted-foreground">
          <span className="inline-block w-2 h-2 rounded-full mr-2 shrink-0" style={{ background: entry.color || entry.fill }} />
          {formatter ? formatter(entry) : `${entry.name}: ${entry.value}`}
        </p>
      ))}
    </div>
  );
};

// ── Animated counter ──
const AnimatedStat = ({ value, suffix = '', label, icon: Icon, color = 'text-primary' }) => {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (value == null) return;
    const duration = 1400;
    const steps = 50;
    const increment = value / steps;
    let current = 0;
    const interval = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplay(value);
        clearInterval(interval);
      } else {
        setDisplay(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(interval);
  }, [value]);

  return (
    <div className="glass-card p-4 sm:p-6 text-center border border-border rounded-xl">
      <Icon className={cn("w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-1.5 sm:mb-2", color)} />
      <div className="text-2xl sm:text-4xl font-black tabular-nums text-foreground leading-tight">
        {value != null ? <>{display.toLocaleString()}{suffix}</> : '...'}
      </div>
      <p className="text-[10px] sm:text-xs text-muted-foreground font-medium mt-1 leading-tight">{label}</p>
    </div>
  );
};

// ── Chart wrapper with doodle ──
const ChartCard = ({ title, subtitle, children, className, doodle: Doodle, doodleClass }) => (
  <motion.div {...staggerItem} className={cn("card-glow p-4 sm:p-6 relative overflow-hidden", className)}>
    {Doodle && (
      <Doodle className={cn("absolute w-8 h-8 sm:w-12 sm:h-12 text-muted-foreground/10 pointer-events-none", doodleClass || "top-3 right-3")} />
    )}
    <div className="relative z-10">
      <h3 className="font-bold text-sm sm:text-base text-foreground mb-0.5">{title}</h3>
      {subtitle && <p className="text-[11px] sm:text-xs text-muted-foreground mb-3 sm:mb-4">{subtitle}</p>}
      {children}
    </div>
  </motion.div>
);

// ── Insight card ──
const InsightCard = ({ icon: Icon, color, text, link }) => (
  <motion.div
    {...staggerItem}
    className="glass-card p-4 border border-border rounded-xl flex items-start gap-3"
  >
    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", color === 'primary' ? 'bg-primary/10' : color === 'secondary' ? 'bg-secondary/10' : color === 'accent' ? 'bg-accent/10' : 'bg-muted')}>
      <Icon className={cn("w-4 h-4", color === 'primary' ? 'text-primary' : color === 'secondary' ? 'text-secondary' : color === 'accent' ? 'text-accent' : 'text-foreground')} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm text-foreground leading-relaxed">{text}</p>
      {link && (
        <Link to={link} className="text-xs text-primary hover:underline mt-1 inline-flex items-center gap-1">
          View idea <ExternalLink className="w-3 h-3" />
        </Link>
      )}
    </div>
  </motion.div>
);

// ── Recently Scored Card ──
const RecentIdeaRow = ({ idea }) => {
  const sourceLabel = sourceOptions.find(s => s.value === idea.source)?.label || idea.source;
  const vs = idea.verdict && verdictStyles[idea.verdict];

  return (
    <Link
      to={`/ideas/${idea.id}`}
      className="flex items-center gap-3 sm:gap-4 py-3 border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors -mx-2 px-2 rounded-lg"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{idea.idea_title || 'Untitled'}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[11px] text-muted-foreground">{sourceLabel}</span>
          <span className="text-[11px] text-muted-foreground/50">·</span>
          <span className="text-[11px] text-muted-foreground">{timeAgo(idea.updated_at || idea.created_at)}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs font-bold text-foreground tabular-nums">{idea.composite_score}</span>
        {vs && (
          <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded", vs.bg, vs.text)}>
            {idea.verdict === 'VALIDATE_FIRST' ? 'VALIDATE' : idea.verdict}
          </span>
        )}
      </div>
    </Link>
  );
};

// ── Delta badge for momentum indicators ──
const DeltaBadge = ({ value }) => {
  if (value == null || value === 0) return <span className="text-[10px] text-muted-foreground/60">no change</span>;
  const positive = value > 0;
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-[10px] font-bold", positive ? 'text-primary' : 'text-red-500')}>
      {positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
      {positive ? '+' : ''}{value}%
    </span>
  );
};

const IdeasAnalyticsPage = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [growthView, setGrowthView] = useState('combo'); // 'combo' | 'cumulative' | 'weekly'
  const [leaderboardTab, setLeaderboardTab] = useState('top'); // 'top' | 'gems'

  useEffect(() => {
    async function load() {
      try {
        // Paginate to bypass Supabase PostgREST max_rows (default 1000)
        const PAGE_SIZE = 1000;
        let ideas = [];
        let page = 0;
        let hasMore = true;

        while (hasMore) {
          const from = page * PAGE_SIZE;
          const to = from + PAGE_SIZE - 1;
          const { data, error } = await supabase
            .from('ideas')
            .select('id, idea_title, source, category, industry, verdict, confidence, composite_score, flylabs_score, hormozi_score, koe_score, okamoto_score, validation_score, votes, created_at, published_at, updated_at')
            .eq('approved', true)
            .range(from, to);

          if (error) { console.error('Supabase fetch error:', error); break; }
          if (data && data.length > 0) {
            ideas = ideas.concat(data);
            hasMore = data.length === PAGE_SIZE;
            page++;
          } else {
            hasMore = false;
          }
        }

        if (ideas.length === 0) {
          setLoading(false);
          return;
        }

        const total = ideas.length;
        const scored = ideas.filter(i => i.composite_score != null && i.composite_score > 0);
        const scoredCount = scored.length;

        // Verdicts
        const verdictCounts = { BUILD: 0, VALIDATE_FIRST: 0, SKIP: 0 };
        ideas.forEach(i => { if (i.verdict && verdictCounts[i.verdict] !== undefined) verdictCounts[i.verdict]++; });
        const withVerdict = Object.values(verdictCounts).reduce((a, b) => a + b, 0);
        const noVerdict = total - withVerdict;

        const verdictData = Object.entries(verdictCounts)
          .filter(([, v]) => v > 0)
          .map(([name, value]) => ({
            name: name === 'VALIDATE_FIRST' ? 'VALIDATE' : name,
            rawName: name,
            value,
            color: VERDICT_COLORS[name],
            pct: withVerdict > 0 ? Math.round((value / withVerdict) * 100) : 0,
          }));

        // Sources
        const sourceCounts = {};
        ideas.forEach(i => {
          const s = i.source || 'community';
          sourceCounts[s] = (sourceCounts[s] || 0) + 1;
        });
        const sourceData = Object.entries(sourceCounts)
          .map(([name, value]) => {
            const label = sourceOptions.find(s => s.value === name)?.label || name;
            return {
              name: label,
              shortName: SOURCE_SHORT[label] || label,
              value,
              fill: SOURCE_COLORS[name] || COLORS.primary,
            };
          })
          .sort((a, b) => b.value - a.value);

        // Source quality (avg composite by source, scored ideas only)
        const sourceScores = {};
        scored.forEach(i => {
          const s = i.source || 'community';
          if (!sourceScores[s]) sourceScores[s] = { sum: 0, count: 0 };
          sourceScores[s].sum += i.composite_score;
          sourceScores[s].count++;
        });
        const sourceQualityData = Object.entries(sourceScores)
          .map(([name, { sum, count }]) => ({
            name: sourceOptions.find(s => s.value === name)?.label || name,
            avg: Math.round(sum / count),
            count,
            fill: SOURCE_COLORS[name] || COLORS.primary,
          }))
          .sort((a, b) => b.avg - a.avg);

        // Score distribution (histogram)
        const scoreBuckets = [
          { range: '0-19', min: 0, max: 19, count: 0, label: 'Risky' },
          { range: '20-39', min: 20, max: 39, count: 0, label: 'Weak' },
          { range: '40-59', min: 40, max: 59, count: 0, label: 'Moderate' },
          { range: '60-79', min: 60, max: 79, count: 0, label: 'Strong' },
          { range: '80-100', min: 80, max: 100, count: 0, label: 'Exceptional' },
        ];
        scored.forEach(i => {
          const bucket = scoreBuckets.find(b => i.composite_score >= b.min && i.composite_score <= b.max);
          if (bucket) bucket.count++;
        });

        // Top industries
        const industryCounts = {};
        ideas.forEach(i => {
          if (i.industry) {
            industryCounts[i.industry] = (industryCounts[i.industry] || 0) + 1;
          }
        });
        const industryData = Object.entries(industryCounts)
          .map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 10);

        // Timeline (weekly, by created_at = when idea entered the system)
        const weeklyMap = {};
        ideas.forEach(i => {
          const d = new Date(i.created_at);
          const weekStart = new Date(d);
          weekStart.setDate(d.getDate() - d.getDay());
          const key = weekStart.toISOString().slice(0, 10);
          weeklyMap[key] = (weeklyMap[key] || 0) + 1;
        });
        const sortedWeeks = Object.keys(weeklyMap).sort();
        let cumulative = 0;
        const timelineData = sortedWeeks.map(week => {
          cumulative += weeklyMap[week];
          return {
            week: new Date(week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            added: weeklyMap[week],
            total: cumulative,
          };
        });

        // Framework averages (for horizontal bar chart)
        const fwSums = { flylabs: 0, hormozi: 0, koe: 0, okamoto: 0 };
        const fwCounts = { flylabs: 0, hormozi: 0, koe: 0, okamoto: 0 };
        ideas.forEach(i => {
          if (i.flylabs_score != null) { fwSums.flylabs += i.flylabs_score; fwCounts.flylabs++; }
          if (i.hormozi_score != null) { fwSums.hormozi += i.hormozi_score; fwCounts.hormozi++; }
          if (i.koe_score != null) { fwSums.koe += i.koe_score; fwCounts.koe++; }
          if (i.okamoto_score != null) { fwSums.okamoto += i.okamoto_score; fwCounts.okamoto++; }
        });
        const frameworkData = [
          { framework: 'Fly Labs', score: fwCounts.flylabs > 0 ? Math.round(fwSums.flylabs / fwCounts.flylabs) : 0, full: 'Fly Labs Method (40%)', fill: FRAMEWORK_COLORS['Fly Labs'] },
          { framework: 'Hormozi', score: fwCounts.hormozi > 0 ? Math.round(fwSums.hormozi / fwCounts.hormozi) : 0, full: 'Hormozi Value Equation (20%)', fill: FRAMEWORK_COLORS['Hormozi'] },
          { framework: 'Koe', score: fwCounts.koe > 0 ? Math.round(fwSums.koe / fwCounts.koe) : 0, full: 'Dan Koe Filter (20%)', fill: FRAMEWORK_COLORS['Koe'] },
          { framework: 'Okamoto', score: fwCounts.okamoto > 0 ? Math.round(fwSums.okamoto / fwCounts.okamoto) : 0, full: 'Okamoto MicroSaaS (20%)', fill: FRAMEWORK_COLORS['Okamoto'] },
        ];

        // Confidence
        const confidenceCounts = { high: 0, medium: 0, low: 0 };
        ideas.forEach(i => { if (i.confidence && confidenceCounts[i.confidence] !== undefined) confidenceCounts[i.confidence]++; });

        // Source x Verdict heatmap
        const sourceVerdictMap = {};
        const verdictKeys = ['BUILD', 'VALIDATE_FIRST', 'SKIP'];
        ideas.forEach(i => {
          const s = i.source || 'community';
          const label = sourceOptions.find(opt => opt.value === s)?.label || s;
          if (!sourceVerdictMap[label]) sourceVerdictMap[label] = { BUILD: 0, VALIDATE_FIRST: 0, SKIP: 0, total: 0 };
          if (i.verdict && verdictKeys.includes(i.verdict)) {
            sourceVerdictMap[label][i.verdict]++;
            sourceVerdictMap[label].total++;
          }
        });
        const sourceVerdictData = Object.entries(sourceVerdictMap)
          .filter(([, v]) => v.total > 0)
          .map(([source, counts]) => ({
            source,
            shortSource: SOURCE_SHORT[source] || source,
            ...counts,
            buildRate: counts.total > 0 ? Math.round((counts.BUILD / counts.total) * 100) : 0,
          }))
          .sort((a, b) => b.buildRate - a.buildRate);

        // Computed stats
        const avgComposite = scored.length > 0 ? Math.round(scored.reduce((a, i) => a + i.composite_score, 0) / scored.length) : 0;
        const totalVotes = ideas.reduce((a, i) => a + (i.votes || 0), 0);
        const activeSources = Object.keys(sourceCounts).length;

        // Build rate
        const buildRate = withVerdict > 0 ? Math.round((verdictCounts.BUILD / withVerdict) * 100) : 0;

        // Top source by volume
        const topSource = sourceData[0];
        // Best source by quality
        const bestQualitySource = sourceQualityData[0];
        // Top industry
        const topIndustry = industryData[0];
        // Highest score idea (with title and link)
        const topScoredIdea = scored.sort((a, b) => (b.composite_score || 0) - (a.composite_score || 0))[0];
        // Best BUILD idea
        const bestBuild = ideas.filter(i => i.verdict === 'BUILD').sort((a, b) => (b.composite_score || 0) - (a.composite_score || 0))[0];
        // Ideas added this week
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const thisWeek = ideas.filter(i => new Date(i.created_at) >= weekAgo).length;

        // Recently scored ideas (5 most recent with scores)
        const recentlyScored = scored
          .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))
          .slice(0, 5);

        // Verdict over time (weekly, stacked, last 12 weeks only)
        const verdictTimeMap = {};
        ideas.forEach(i => {
          if (!i.verdict) return;
          const d = new Date(i.created_at);
          const weekStart = new Date(d);
          weekStart.setDate(d.getDate() - d.getDay());
          const key = weekStart.toISOString().slice(0, 10);
          if (!verdictTimeMap[key]) verdictTimeMap[key] = { BUILD: 0, VALIDATE_FIRST: 0, SKIP: 0 };
          if (verdictTimeMap[key][i.verdict] !== undefined) verdictTimeMap[key][i.verdict]++;
        });
        const allVerdictWeeks = Object.keys(verdictTimeMap).sort();
        const recentVerdictWeeks = allVerdictWeeks.slice(-12);
        const verdictTimeData = recentVerdictWeeks.map(week => ({
          week: new Date(week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          BUILD: verdictTimeMap[week].BUILD,
          VALIDATE: verdictTimeMap[week].VALIDATE_FIRST,
          SKIP: verdictTimeMap[week].SKIP,
          total: verdictTimeMap[week].BUILD + verdictTimeMap[week].VALIDATE_FIRST + verdictTimeMap[week].SKIP,
        }));

        // ── Top 10 Leaderboard ──
        const leaderboard = ideas
          .filter(i => i.verdict === 'BUILD' && i.composite_score != null)
          .sort((a, b) => b.composite_score - a.composite_score)
          .slice(0, 10)
          .map(i => ({
            id: i.id, title: i.idea_title, composite: i.composite_score,
            flylabs: i.flylabs_score, hormozi: i.hormozi_score,
            koe: i.koe_score, okamoto: i.okamoto_score,
            source: i.source, industry: i.industry, votes: i.votes || 0,
          }));

        // ── Hidden Gems (high score, low votes) ──
        const hiddenGems = ideas
          .filter(i => i.composite_score >= 60 && (i.votes || 0) <= 2 && i.verdict !== 'SKIP')
          .sort((a, b) => b.composite_score - a.composite_score)
          .slice(0, 5)
          .map(i => ({
            id: i.id, title: i.idea_title, composite: i.composite_score,
            votes: i.votes || 0, source: i.source, verdict: i.verdict,
          }));

        // ── Industry Intelligence ──
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

        const industryIntelMap = {};
        ideas.forEach(i => {
          if (!i.industry) return;
          if (!industryIntelMap[i.industry]) {
            industryIntelMap[i.industry] = {
              count: 0, scoreSum: 0, scoreCount: 0,
              buildCount: 0, verdictCount: 0,
              sourceCounts: {}, thisWeek: 0, lastWeek: 0,
            };
          }
          const ind = industryIntelMap[i.industry];
          ind.count++;
          if (i.composite_score != null && i.composite_score > 0) { ind.scoreSum += i.composite_score; ind.scoreCount++; }
          if (i.verdict) { ind.verdictCount++; if (i.verdict === 'BUILD') ind.buildCount++; }
          const s = i.source || 'community';
          ind.sourceCounts[s] = (ind.sourceCounts[s] || 0) + 1;
          const created = new Date(i.created_at);
          if (created >= oneWeekAgo) ind.thisWeek++;
          else if (created >= twoWeeksAgo) ind.lastWeek++;
        });

        const industryIntelData = Object.entries(industryIntelMap)
          .filter(([, v]) => v.count >= 3)
          .map(([name, v]) => {
            const avgScore = v.scoreCount > 0 ? Math.round(v.scoreSum / v.scoreCount) : 0;
            const buildRateInd = v.verdictCount > 0 ? Math.round((v.buildCount / v.verdictCount) * 100) : 0;
            const bestSrc = Object.entries(v.sourceCounts).sort((a, b) => b[1] - a[1])[0];
            const wowDelta = v.lastWeek > 0
              ? Math.round(((v.thisWeek - v.lastWeek) / v.lastWeek) * 100)
              : (v.thisWeek > 0 ? 100 : 0);
            const opportunityScore = Math.round(avgScore * 0.4 + buildRateInd * 0.4 + Math.min(Math.max(wowDelta, -50), 50) * 0.2);
            return {
              name: name.replace(/_/g, ' '), count: v.count, avgScore, buildRate: buildRateInd,
              bestSource: bestSrc ? (sourceOptions.find(s => s.value === bestSrc[0])?.label || bestSrc[0]) : '-',
              thisWeek: v.thisWeek, wowDelta,
              trend: wowDelta > 10 ? 'up' : wowDelta < -10 ? 'down' : 'flat',
              opportunityScore, builds: v.buildCount,
            };
          })
          .sort((a, b) => b.opportunityScore - a.opportunityScore);

        // ── Framework Disagreements ──
        const disagreements = scored
          .map(i => {
            const fwScores = [i.flylabs_score, i.hormozi_score, i.koe_score, i.okamoto_score].filter(s => s != null);
            if (fwScores.length < 3) return null;
            const spread = Math.max(...fwScores) - Math.min(...fwScores);
            if (spread <= 25) return null;
            const fwMap = { 'Fly Labs': i.flylabs_score, 'Hormozi': i.hormozi_score, 'Koe': i.koe_score, 'Okamoto': i.okamoto_score };
            const sortedFw = Object.entries(fwMap).filter(([, v]) => v != null).sort((a, b) => b[1] - a[1]);
            return {
              id: i.id, title: i.idea_title, composite: i.composite_score,
              spread, highest: sortedFw[0], lowest: sortedFw[sortedFw.length - 1], verdict: i.verdict,
            };
          })
          .filter(Boolean)
          .sort((a, b) => b.spread - a.spread)
          .slice(0, 8);

        // ── Source Momentum ──
        const sourceMomentum = {};
        ideas.forEach(i => {
          const s = i.source || 'community';
          if (!sourceMomentum[s]) sourceMomentum[s] = { thisWeek: 0, lastWeek: 0 };
          const created = new Date(i.created_at);
          if (created >= oneWeekAgo) sourceMomentum[s].thisWeek++;
          else if (created >= twoWeeksAgo) sourceMomentum[s].lastWeek++;
        });
        const sourceMomentumData = Object.entries(sourceMomentum)
          .map(([source, { thisWeek: tw, lastWeek: lw }]) => ({
            source: sourceOptions.find(s => s.value === source)?.label || source,
            thisWeek: tw, lastWeek: lw,
            delta: lw > 0 ? Math.round(((tw - lw) / lw) * 100) : (tw > 0 ? 100 : 0),
          }))
          .filter(s => s.thisWeek > 0 || s.lastWeek > 0)
          .sort((a, b) => b.delta - a.delta);

        // ── Score Trend (rolling 4-week avg) ──
        const weeklyAvgScores = [];
        for (let w = 0; w < 4; w++) {
          const wEnd = new Date(now.getTime() - w * 7 * 24 * 60 * 60 * 1000);
          const wStart = new Date(wEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
          const wIdeas = scored.filter(i => { const d = new Date(i.created_at); return d >= wStart && d < wEnd; });
          weeklyAvgScores.unshift({
            avg: wIdeas.length > 0 ? Math.round(wIdeas.reduce((a, ii) => a + ii.composite_score, 0) / wIdeas.length) : null,
          });
        }
        const validWeekAvgs = weeklyAvgScores.filter(w => w.avg != null);
        const rollingAvg = validWeekAvgs.length > 0 ? Math.round(validWeekAvgs.reduce((a, w) => a + w.avg, 0) / validWeekAvgs.length) : 0;
        const currentWeekAvg = weeklyAvgScores[weeklyAvgScores.length - 1]?.avg || 0;
        const scoreTrend = rollingAvg > 0 ? Math.round(((currentWeekAvg - rollingAvg) / rollingAvg) * 100) : 0;

        // ── Pipeline Velocity ──
        const pipelineThisWeek = ideas.filter(i => new Date(i.created_at) >= oneWeekAgo).length;
        const pipelineLastWeek = ideas.filter(i => { const d = new Date(i.created_at); return d >= twoWeeksAgo && d < oneWeekAgo; }).length;
        const pipelineDelta = pipelineLastWeek > 0 ? Math.round(((pipelineThisWeek - pipelineLastWeek) / pipelineLastWeek) * 100) : 0;

        // ── Framework Correlation ──
        const frameworkPairs = [
          ['flylabs', 'hormozi', 'FL + H'], ['flylabs', 'koe', 'FL + K'],
          ['flylabs', 'okamoto', 'FL + O'], ['hormozi', 'koe', 'H + K'],
          ['hormozi', 'okamoto', 'H + O'], ['koe', 'okamoto', 'K + O'],
        ];
        const correlationData = frameworkPairs.map(([a, b, label]) => {
          const both = scored.filter(i => i[`${a}_score`] != null && i[`${b}_score`] != null);
          if (both.length < 5) return { label, agreement: 0, count: both.length };
          const scoresA = both.map(i => i[`${a}_score`]).sort((x, y) => x - y);
          const scoresB = both.map(i => i[`${b}_score`]).sort((x, y) => x - y);
          const medA = scoresA[Math.floor(scoresA.length / 2)];
          const medB = scoresB[Math.floor(scoresB.length / 2)];
          const agree = both.filter(i => (i[`${a}_score`] >= medA && i[`${b}_score`] >= medB) || (i[`${a}_score`] < medA && i[`${b}_score`] < medB)).length;
          return { label, agreement: Math.round((agree / both.length) * 100), count: both.length };
        }).sort((aa, bb) => bb.agreement - aa.agreement);

        // ── Opportunity Map ──
        const oppFiltered = industryIntelData.filter(ind => ind.count >= 3 && ind.avgScore > 0);
        const medianCount = oppFiltered.length > 0 ? oppFiltered.map(i => i.count).sort((a, b) => a - b)[Math.floor(oppFiltered.length / 2)] : 0;
        const medianBuildRate = oppFiltered.length > 0 ? oppFiltered.map(i => i.buildRate).sort((a, b) => a - b)[Math.floor(oppFiltered.length / 2)] : 0;
        const opportunityMapData = oppFiltered.map(ind => ({
          name: ind.name, volume: ind.count, buildRate: ind.buildRate, avgScore: ind.avgScore,
          quadrant: ind.count >= medianCount
            ? (ind.buildRate >= medianBuildRate ? 'Stars' : 'Crowded')
            : (ind.buildRate >= medianBuildRate ? 'Niche Gold' : 'Frontier'),
        }));

        setStats({
          total, scoredCount, avgComposite, totalVotes, activeSources,
          buildCount: verdictCounts.BUILD, buildRate,
          verdictData, noVerdict, withVerdict,
          sourceData, sourceQualityData,
          scoreBuckets, industryData,
          timelineData, frameworkData,
          confidenceCounts,
          sourceVerdictData,
          verdictTimeData,
          topSource, bestQualitySource, topIndustry,
          topScoredIdea, bestBuild, thisWeek,
          recentlyScored,
          leaderboard, hiddenGems, industryIntelData, disagreements,
          sourceMomentumData, scoreTrend, currentWeekAvg, rollingAvg,
          pipelineThisWeek, pipelineLastWeek, pipelineDelta,
          correlationData, opportunityMapData,
        });
      } catch (err) {
        console.error('Analytics load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Generate smart insights with cross-dimensional intelligence
  const insights = useMemo(() => {
    if (!stats) return [];
    const list = [];

    // 1. Cross-source quality comparison
    if (stats.sourceQualityData?.length >= 2) {
      const best = stats.sourceQualityData[0];
      const worst = stats.sourceQualityData[stats.sourceQualityData.length - 1];
      const diff = best.avg - worst.avg;
      if (diff > 5) {
        list.push({
          icon: TrendingUp, color: 'secondary',
          text: `${best.name} ideas score ${diff} points higher than ${worst.name} on average. Quality varies dramatically by source.`,
        });
      }
    }

    // 2. Top opportunity industry
    if (stats.industryIntelData?.length > 0) {
      const topInd = stats.industryIntelData[0];
      list.push({
        icon: Target, color: 'primary',
        text: `${topInd.name} has the highest opportunity score: ${topInd.buildRate}% BUILD rate across ${topInd.count} ideas, best source is ${topInd.bestSource}.`,
      });
    }

    // 3. Score trend
    if (stats.scoreTrend !== 0 && stats.scoreTrend != null) {
      const direction = stats.scoreTrend > 0 ? 'climbing' : 'dropping';
      list.push({
        icon: TrendingUp, color: stats.scoreTrend > 0 ? 'primary' : 'accent',
        text: `Average score is ${direction} ${Math.abs(stats.scoreTrend)}% vs the 4-week rolling average. ${stats.scoreTrend > 0 ? 'Pipeline quality is improving.' : 'More volume coming in, raw quality diluting slightly.'}`,
      });
    }

    // 4. Framework disagreement highlight
    if (stats.disagreements?.length > 0) {
      const maxD = stats.disagreements[0];
      list.push({
        icon: GitCompare, color: 'accent',
        text: `"${maxD.title}" has a ${maxD.spread}-point spread. ${maxD.highest[0]} scores ${maxD.highest[1]}, ${maxD.lowest[0]} only ${maxD.lowest[1]}. The experts can't agree.`,
        link: `/ideas/${maxD.id}`,
      });
    }

    // 5. Source momentum
    if (stats.sourceMomentumData?.length > 0) {
      const accelerating = stats.sourceMomentumData.filter(s => s.delta > 20);
      if (accelerating.length > 0) {
        list.push({
          icon: Zap, color: 'secondary',
          text: `${accelerating.map(s => s.source).join(' and ')} ${accelerating.length > 1 ? 'are' : 'is'} accelerating this week (${accelerating.map(s => `+${s.delta}%`).join(', ')}).`,
        });
      }
    }

    // 6. Hidden gem callout
    if (stats.hiddenGems?.length > 0) {
      const gem = stats.hiddenGems[0];
      list.push({
        icon: Gem, color: 'primary',
        text: `Hidden gem: "${gem.title}" scores ${gem.composite}/100 but has only ${gem.votes} vote${gem.votes !== 1 ? 's' : ''}. Nobody's noticed it yet.`,
        link: `/ideas/${gem.id}`,
      });
    }

    // 7. BUILD rate analysis
    if (stats.buildRate > 0) {
      list.push({
        icon: Target, color: 'primary',
        text: `${stats.buildRate}% of scored ideas get a BUILD verdict. ${stats.buildRate > 30 ? 'The pipeline is quality-rich.' : stats.buildRate > 15 ? 'Most ideas need more validation.' : 'The AI is ruthless. Only the strongest survive.'}`,
      });
    }

    // 8. Framework correlation
    if (stats.correlationData?.length > 0) {
      const mostAligned = stats.correlationData[0];
      const leastAligned = stats.correlationData[stats.correlationData.length - 1];
      if (mostAligned.agreement - leastAligned.agreement > 10) {
        list.push({
          icon: Layers, color: 'accent',
          text: `${mostAligned.label} agree ${mostAligned.agreement}% of the time. ${leastAligned.label} only ${leastAligned.agreement}%. Different lenses, different conclusions.`,
        });
      }
    }

    return list.slice(0, 8);
  }, [stats]);

  if (loading) {
    return (
      <PageLayout seo={{ title: "Idea Lab Analytics | Fly Labs", noindex: true }}>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </PageLayout>
    );
  }

  if (!stats) {
    return (
      <PageLayout seo={{ title: "Idea Lab Analytics | Fly Labs", noindex: true }}>
        <div className="min-h-screen flex flex-col items-center justify-center text-muted-foreground px-6">
          <FlaskConical className="w-12 h-12 mb-4" />
          <p>No data yet. Ideas need to be scored first.</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      seo={{
        title: "Idea Lab Analytics | Fly Labs",
        description: "Business intelligence dashboard. Momentum tracking, opportunity map, industry intelligence, framework analysis, hidden gems. Real-time analytics from AI-scored ideas.",
        url: "https://flylabs.fun/ideas/analytics",
        noindex: true,
      }}
      className="pt-28 sm:pt-32 pb-24"
    >
      <div className="container mx-auto px-4 sm:px-6 max-w-6xl">

        {/* Back link */}
        <motion.div {...fadeUp} className="mb-6 sm:mb-8">
          <Link
            to="/ideas"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors p-1 -ml-1"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Idea Lab
          </Link>
        </motion.div>

        {/* ── Hero ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative mb-8 sm:mb-12"
        >
          <PaperPlaneDoodle className="absolute -top-2 right-0 sm:right-8 w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground/15 rotate-12 geo-float-1 hidden sm:block" />
          <FlaskDoodle className="absolute -top-4 right-24 sm:right-32 w-8 h-10 sm:w-10 sm:h-12 text-primary/15 -rotate-6 geo-float-2 hidden md:block" />

          <div className="flex flex-wrap items-center gap-3 mb-3 sm:mb-4">
            <p className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-primary">
              Lab Report
            </p>
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
              Free during beta
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground mb-2 sm:mb-3">
            Idea Lab Analytics
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground font-medium max-w-xl">
            Momentum tracking, opportunity mapping, framework disagreements, industry intelligence, hidden gems. Real-time business intelligence from {stats.total} ideas scored by AI.
          </p>
        </motion.div>

        {/* ── Stats Row ── */}
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 mb-8 sm:mb-10"
          {...staggerContainer}
        >
          <motion.div {...staggerItem}>
            <AnimatedStat value={stats.total} label="Total ideas" icon={Layers} color="text-accent" />
          </motion.div>
          <motion.div {...staggerItem}>
            <AnimatedStat value={stats.scoredCount} label="Ideas scored" icon={Zap} color="text-primary" />
          </motion.div>
          <motion.div {...staggerItem}>
            <AnimatedStat value={stats.buildCount} label="Verdict: BUILD" icon={Target} color="text-primary" />
          </motion.div>
          <motion.div {...staggerItem}>
            <AnimatedStat value={stats.avgComposite} suffix="/100" label="Avg composite" icon={TrendingUp} color="text-secondary" />
          </motion.div>
        </motion.div>

        {/* ── Momentum Dashboard ── */}
        <motion.div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 mb-8 sm:mb-10" {...staggerContainer}>
          <motion.div {...staggerItem}>
            <div className="glass-card p-4 sm:p-5 border border-border rounded-xl">
              <ArrowUpRight className="w-4 h-4 text-primary mb-1.5" />
              <p className="text-base sm:text-xl font-black text-foreground leading-tight truncate">
                {stats.sourceMomentumData?.[0]?.source || '-'}
              </p>
              <DeltaBadge value={stats.sourceMomentumData?.[0]?.delta} />
              <p className="text-[10px] sm:text-xs text-muted-foreground font-medium mt-1">Fastest source</p>
            </div>
          </motion.div>
          <motion.div {...staggerItem}>
            <div className="glass-card p-4 sm:p-5 border border-border rounded-xl">
              <Zap className="w-4 h-4 text-secondary mb-1.5" />
              <p className="text-lg sm:text-2xl font-black text-foreground leading-tight tabular-nums">
                {stats.pipelineThisWeek}
              </p>
              <DeltaBadge value={stats.pipelineDelta} />
              <p className="text-[10px] sm:text-xs text-muted-foreground font-medium mt-1">Ideas this week</p>
            </div>
          </motion.div>
          <motion.div {...staggerItem}>
            <div className="glass-card p-4 sm:p-5 border border-border rounded-xl">
              <TrendingUp className="w-4 h-4 text-accent mb-1.5" />
              <p className="text-lg sm:text-2xl font-black text-foreground leading-tight tabular-nums">
                {stats.currentWeekAvg}<span className="text-sm text-muted-foreground font-normal">/100</span>
              </p>
              <DeltaBadge value={stats.scoreTrend} />
              <p className="text-[10px] sm:text-xs text-muted-foreground font-medium mt-1">Avg score this week</p>
            </div>
          </motion.div>
          <motion.div {...staggerItem}>
            <div className="glass-card p-4 sm:p-5 border border-border rounded-xl">
              <GitCompare className="w-4 h-4 text-amber-500 mb-1.5" />
              <p className="text-lg sm:text-2xl font-black text-foreground leading-tight tabular-nums">
                {stats.disagreements?.length || 0}
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground font-medium mt-1">Expert disagreements</p>
            </div>
          </motion.div>
        </motion.div>

        {/* ── Key Insights ── */}
        {insights.length > 0 && (
          <motion.div className="mb-8 sm:mb-10" {...fadeUp}>
            <h2 className="text-sm font-semibold uppercase tracking-widest text-primary mb-4">Key insights</h2>
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
              {...staggerContainer}
            >
              {insights.slice(0, 6).map((insight, i) => (
                <InsightCard key={i} {...insight} />
              ))}
            </motion.div>
          </motion.div>
        )}

        {/* ── Top 10 Leaderboard ── */}
        {stats.leaderboard?.length > 0 && (
          <motion.div className="mb-8 sm:mb-10" {...fadeUp}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-primary flex items-center gap-2">
                <Trophy className="w-4 h-4" /> {leaderboardTab === 'top' ? 'Top BUILD Ideas' : 'Hidden Gems'}
              </h2>
              <div className="flex items-center gap-1">
                <button onClick={() => setLeaderboardTab('top')} className={cn("text-[11px] font-medium px-2.5 py-1 rounded-full transition-colors", leaderboardTab === 'top' ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground')}>Top 10</button>
                <button onClick={() => setLeaderboardTab('gems')} className={cn("text-[11px] font-medium px-2.5 py-1 rounded-full transition-colors", leaderboardTab === 'gems' ? 'bg-accent/15 text-accent' : 'text-muted-foreground hover:text-foreground')}>Hidden Gems</button>
              </div>
            </div>
            <div className="card-glow overflow-x-auto">
              {leaderboardTab === 'top' ? (
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="py-2 px-3 font-medium text-muted-foreground w-8">#</th>
                      <th className="py-2 px-3 font-medium text-muted-foreground">Idea</th>
                      <th className="py-2 px-3 font-medium text-muted-foreground text-center w-16">Score</th>
                      <th className="py-2 px-3 font-medium text-muted-foreground text-center w-10 hidden sm:table-cell">FL</th>
                      <th className="py-2 px-3 font-medium text-muted-foreground text-center w-10 hidden sm:table-cell">H</th>
                      <th className="py-2 px-3 font-medium text-muted-foreground text-center w-10 hidden sm:table-cell">K</th>
                      <th className="py-2 px-3 font-medium text-muted-foreground text-center w-10 hidden sm:table-cell">O</th>
                      <th className="py-2 px-3 font-medium text-muted-foreground hidden md:table-cell">Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.leaderboard.map((idea, i) => {
                      const srcLabel = sourceOptions.find(s => s.value === idea.source)?.label || idea.source;
                      return (
                        <tr key={idea.id} className="border-b border-border/30 last:border-0">
                          <td className="py-2.5 px-3 text-muted-foreground font-bold tabular-nums">{i + 1}</td>
                          <td className="py-2.5 px-3">
                            <Link to={`/ideas/${idea.id}`} className="font-medium text-foreground hover:text-primary transition-colors line-clamp-1">{idea.title}</Link>
                            <span className="block text-[10px] text-muted-foreground mt-0.5 sm:hidden">{srcLabel}</span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold text-foreground tabular-nums">{idea.composite}</td>
                          <td className="py-2.5 px-3 text-center text-[11px] text-muted-foreground tabular-nums hidden sm:table-cell">{idea.flylabs ?? '-'}</td>
                          <td className="py-2.5 px-3 text-center text-[11px] text-muted-foreground tabular-nums hidden sm:table-cell">{idea.hormozi ?? '-'}</td>
                          <td className="py-2.5 px-3 text-center text-[11px] text-muted-foreground tabular-nums hidden sm:table-cell">{idea.koe ?? '-'}</td>
                          <td className="py-2.5 px-3 text-center text-[11px] text-muted-foreground tabular-nums hidden sm:table-cell">{idea.okamoto ?? '-'}</td>
                          <td className="py-2.5 px-3 text-[11px] text-muted-foreground hidden md:table-cell">{srcLabel}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="p-4 sm:p-5 space-y-3">
                  {stats.hiddenGems?.length > 0 ? stats.hiddenGems.map(gem => {
                    const srcLabel = sourceOptions.find(s => s.value === gem.source)?.label || gem.source;
                    return (
                      <Link key={gem.id} to={`/ideas/${gem.id}`} className="flex items-center gap-3 hover:bg-muted/30 -mx-2 px-2 py-2 rounded-lg transition-colors">
                        <Gem className="w-4 h-4 text-accent shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{gem.title}</p>
                          <p className="text-[11px] text-muted-foreground">{gem.composite}/100 · {gem.votes} vote{gem.votes !== 1 ? 's' : ''} · {srcLabel}</p>
                        </div>
                        <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded", gem.verdict === 'BUILD' ? 'bg-primary/10 text-primary' : 'bg-amber-500/10 text-amber-600')}>
                          {gem.verdict === 'VALIDATE_FIRST' ? 'VALIDATE' : gem.verdict}
                        </span>
                      </Link>
                    );
                  }) : <p className="text-sm text-muted-foreground text-center py-4">No hidden gems yet. High-scoring ideas with low visibility will appear here.</p>}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── Charts Grid ── */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-5 mb-8 sm:mb-10"
          {...staggerContainer}
        >

          {/* Verdict Distribution */}
          <ChartCard
            title="Verdict distribution"
            subtitle="What AI thinks you should do with these ideas"
            doodle={StarDoodle}
            doodleClass="top-3 right-3"
          >
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-40 h-40 sm:w-48 sm:h-48 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.verdictData}
                      cx="50%"
                      cy="50%"
                      innerRadius="40%"
                      outerRadius="70%"
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {stats.verdictData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip formatter={(e) => `${e.value} ideas`} />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-row sm:flex-col gap-3 sm:gap-2 flex-wrap justify-center">
                {stats.verdictData.map((v) => (
                  <div key={v.name} className="flex items-center gap-2 text-sm">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ background: v.color }} />
                    <span className="font-medium text-foreground">{v.name}</span>
                    <span className="text-muted-foreground">{v.pct}%</span>
                  </div>
                ))}
                {stats.noVerdict > 0 && (
                  <p className="text-[11px] text-muted-foreground">{stats.noVerdict} unscored</p>
                )}
              </div>
            </div>
          </ChartCard>

          {/* Source Breakdown */}
          <ChartCard
            title="Where ideas come from"
            subtitle={`${stats.activeSources} sources feeding the pipeline`}
            doodle={PaperPlaneDoodle}
            doodleClass="top-3 right-3 rotate-[-20deg]"
          >
            <div className="h-52 sm:h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.sourceData} layout="vertical" margin={{ left: 0, right: 12, top: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis
                    type="category"
                    dataKey="shortName"
                    width={70}
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip content={<ChartTooltip formatter={(e) => `${e.value} ideas`} />} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16}>
                    {stats.sourceData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          {/* Score Distribution */}
          <ChartCard
            title="Score distribution"
            subtitle="How ideas spread across quality tiers"
            doodle={LightbulbDoodle}
            doodleClass="top-3 right-3"
          >
            <div className="h-48 sm:h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.scoreBuckets} margin={{ left: -16, right: 4, top: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="range" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} width={28} />
                  <Tooltip content={<ChartTooltip formatter={(e) => {
                    const bucket = stats.scoreBuckets.find(b => b.count === e.value);
                    return `${e.value} ideas${bucket ? ` (${bucket.label})` : ''}`;
                  }} />} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={28}>
                    {stats.scoreBuckets.map((_, i) => {
                      const colors = [COLORS.red, COLORS.orange, COLORS.amber, COLORS.secondary, COLORS.primary];
                      return <Cell key={i} fill={colors[i]} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          {/* Framework Averages (horizontal bar chart) */}
          <ChartCard
            title="Framework averages"
            subtitle="How the four scoring brains compare"
            doodle={FlaskDoodle}
            doodleClass="top-3 right-3"
          >
            <div className="space-y-3 sm:space-y-4 pt-1">
              {stats.frameworkData.map((fw) => (
                <div key={fw.framework}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: fw.fill }} />
                      <span className="text-xs font-medium text-foreground">{fw.full}</span>
                    </div>
                    <span className="text-sm font-bold text-foreground tabular-nums">{fw.score}<span className="text-[10px] text-muted-foreground font-normal">/100</span></span>
                  </div>
                  <div className="h-2.5 rounded-full bg-muted/50 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${fw.score}%`, background: fw.fill }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>

          {/* Framework Disagreement */}
          {stats.disagreements?.length > 0 && (
            <ChartCard title="Where the experts disagree" subtitle="Ideas with 25+ point spread between frameworks" doodle={FlaskDoodle}>
              <div className="space-y-2.5">
                {stats.disagreements.slice(0, 5).map(d => (
                  <Link key={d.id} to={`/ideas/${d.id}`} className="flex items-center gap-3 hover:bg-muted/30 -mx-1 px-1 py-2 rounded-lg transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{d.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold text-primary">{d.highest[0]} {d.highest[1]}</span>
                        <span className="text-[10px] text-muted-foreground/40">vs</span>
                        <span className="text-[10px] font-bold text-red-500">{d.lowest[0]} {d.lowest[1]}</span>
                      </div>
                    </div>
                    <span className="text-xs font-black text-amber-500 tabular-nums shrink-0">{d.spread}pt</span>
                  </Link>
                ))}
              </div>
            </ChartCard>
          )}

          {/* Framework Correlation */}
          {stats.correlationData?.length > 0 && (
            <ChartCard title="Framework alignment" subtitle="How often the scoring brains agree">
              <div className="space-y-3">
                {stats.correlationData.map((pair, i) => (
                  <div key={pair.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-foreground">{pair.label}</span>
                      <div className="flex items-center gap-2">
                        {i === 0 && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary">Most aligned</span>}
                        {i === stats.correlationData.length - 1 && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-accent/10 text-accent">Most independent</span>}
                        <span className="text-xs font-bold text-foreground tabular-nums">{pair.agreement}%</span>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{
                        width: `${pair.agreement}%`,
                        background: pair.agreement > 70 ? COLORS.primary : pair.agreement > 50 ? COLORS.amber : COLORS.red,
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </ChartCard>
          )}

          {/* Ideas Timeline (full width) - ComposedChart with toggle */}
          <ChartCard
            title="Growth over time"
            subtitle="How the lab is growing week by week"
            className="md:col-span-2"
          >
            <div className="flex items-center gap-1.5 mb-3">
              {[
                { key: 'combo', label: 'Combined' },
                { key: 'cumulative', label: 'Cumulative' },
                { key: 'weekly', label: 'Weekly' },
              ].map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setGrowthView(opt.key)}
                  className={cn(
                    "text-[11px] font-medium px-2.5 py-1 rounded-full transition-colors",
                    growthView === opt.key
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="h-48 sm:h-56">
              <ResponsiveContainer width="100%" height="100%">
                {growthView === 'weekly' ? (
                  <BarChart data={stats.timelineData} margin={{ left: 0, right: 4, top: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="week" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} width={40} tickFormatter={formatAxisNumber} />
                    <Tooltip content={<ChartTooltip formatter={(e) => `${e.name}: ${e.value.toLocaleString()}`} />} />
                    <Bar dataKey="added" name="Added this week" fill={COLORS.accent} radius={[3, 3, 0, 0]} barSize={12} />
                  </BarChart>
                ) : growthView === 'cumulative' ? (
                  <AreaChart data={stats.timelineData} margin={{ left: 0, right: 4, top: 8, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradientArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="week" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} width={40} tickFormatter={formatAxisNumber} />
                    <Tooltip content={<ChartTooltip formatter={(e) => `${e.name}: ${e.value.toLocaleString()}`} />} />
                    <Area type="monotone" dataKey="total" name="Total ideas" stroke={COLORS.primary} fill="url(#gradientArea)" strokeWidth={2.5} dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: COLORS.primary, fill: 'hsl(var(--background))' }} />
                  </AreaChart>
                ) : (
                  <ComposedChart data={stats.timelineData} margin={{ left: 0, right: 0, top: 8, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradientAreaCombo" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.15} />
                        <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="week" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} interval="preserveStartEnd" />
                    <YAxis yAxisId="left" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} width={40} tickFormatter={formatAxisNumber} label={{ value: 'Weekly', angle: -90, position: 'insideLeft', style: { fontSize: 9, fill: 'hsl(var(--muted-foreground))' } }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} width={40} tickFormatter={formatAxisNumber} label={{ value: 'Total', angle: 90, position: 'insideRight', style: { fontSize: 9, fill: 'hsl(var(--muted-foreground))' } }} />
                    <Tooltip content={<ChartTooltip formatter={(e) => `${e.name}: ${e.value.toLocaleString()}`} />} />
                    <Bar yAxisId="left" dataKey="added" name="Added this week" fill={COLORS.accent} radius={[3, 3, 0, 0]} barSize={10} opacity={0.7} />
                    <Area yAxisId="right" type="monotone" dataKey="total" name="Total ideas" stroke={COLORS.primary} fill="url(#gradientAreaCombo)" strokeWidth={2} dot={false} />
                  </ComposedChart>
                )}
              </ResponsiveContainer>
            </div>
          </ChartCard>

          {/* Source x Verdict Heatmap */}
          <ChartCard
            title="Source quality map"
            subtitle="BUILD rate by source. Green = gold mine."
            className="md:col-span-2"
            doodle={StarDoodle}
            doodleClass="top-3 right-3"
          >
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    <th className="text-left font-medium text-muted-foreground py-2 px-2 w-24 sm:w-28">Source</th>
                    <th className="text-center font-medium text-muted-foreground py-2 px-1 sm:px-2">BUILD</th>
                    <th className="text-center font-medium text-muted-foreground py-2 px-1 sm:px-2">VALIDATE</th>
                    <th className="text-center font-medium text-muted-foreground py-2 px-1 sm:px-2">SKIP</th>
                    <th className="text-right font-medium text-muted-foreground py-2 px-2">BUILD rate</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.sourceVerdictData.map((row) => (
                    <tr key={row.source} className="border-t border-border/50">
                      <td className="py-2 px-2 font-medium text-foreground">
                        <span className="hidden sm:inline">{row.source}</span>
                        <span className="sm:hidden">{row.shortSource}</span>
                      </td>
                      <td className="py-2 px-1 sm:px-2 text-center">
                        <span
                          className="inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-md text-[11px] font-bold"
                          style={{
                            background: row.BUILD > 0 ? `hsla(142, 70%, 40%, ${Math.min(0.15 + (row.BUILD / Math.max(...stats.sourceVerdictData.map(r => r.BUILD || 1))) * 0.6, 0.75)})` : 'transparent',
                            color: row.BUILD > 0 ? 'hsl(142, 70%, 35%)' : 'hsl(var(--muted-foreground))',
                          }}
                        >
                          {row.BUILD || '-'}
                        </span>
                      </td>
                      <td className="py-2 px-1 sm:px-2 text-center">
                        <span
                          className="inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-md text-[11px] font-bold"
                          style={{
                            background: row.VALIDATE_FIRST > 0 ? `hsla(38, 92%, 50%, ${Math.min(0.15 + (row.VALIDATE_FIRST / Math.max(...stats.sourceVerdictData.map(r => r.VALIDATE_FIRST || 1))) * 0.5, 0.65)})` : 'transparent',
                            color: row.VALIDATE_FIRST > 0 ? 'hsl(38, 80%, 40%)' : 'hsl(var(--muted-foreground))',
                          }}
                        >
                          {row.VALIDATE_FIRST || '-'}
                        </span>
                      </td>
                      <td className="py-2 px-1 sm:px-2 text-center">
                        <span
                          className="inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-md text-[11px] font-bold"
                          style={{
                            background: row.SKIP > 0 ? `hsla(0, 72%, 51%, ${Math.min(0.15 + (row.SKIP / Math.max(...stats.sourceVerdictData.map(r => r.SKIP || 1))) * 0.5, 0.65)})` : 'transparent',
                            color: row.SKIP > 0 ? 'hsl(0, 60%, 45%)' : 'hsl(var(--muted-foreground))',
                          }}
                        >
                          {row.SKIP || '-'}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-12 sm:w-16 h-1.5 rounded-full bg-muted/50 overflow-hidden hidden sm:block">
                            <div className="h-full rounded-full bg-primary" style={{ width: `${row.buildRate}%` }} />
                          </div>
                          <span className="font-bold text-foreground tabular-nums">{row.buildRate}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ChartCard>

          {/* Top Industries */}
          <ChartCard
            title="Top industries"
            subtitle="Where the problems cluster"
          >
            <div className="space-y-2.5">
              {stats.industryData.map((ind, i) => {
                const maxVal = stats.industryData[0]?.value || 1;
                const pct = Math.round((ind.value / maxVal) * 100);
                return (
                  <div key={ind.name} className="flex items-center gap-2 sm:gap-3">
                    <span className="text-[11px] text-muted-foreground w-4 text-right tabular-nums shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-medium text-foreground truncate">{ind.name}</span>
                        <span className="text-[11px] text-muted-foreground tabular-nums ml-2 shrink-0">{ind.value}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ChartCard>

          {/* Source Quality */}
          <ChartCard
            title="Source quality"
            subtitle="Average composite score by source"
          >
            <div className="space-y-2.5">
              {stats.sourceQualityData.map((src) => (
                <div key={src.name} className="flex items-center gap-2 sm:gap-3">
                  <span className="text-xs font-medium text-foreground w-20 sm:w-24 truncate shrink-0">{src.name}</span>
                  <div className="flex-1 min-w-0">
                    <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${src.avg}%`, background: src.fill }}
                      />
                    </div>
                  </div>
                  <span className="text-[11px] text-muted-foreground tabular-nums w-7 text-right shrink-0">{src.avg}</span>
                </div>
              ))}
            </div>
          </ChartCard>

          {/* Industry Intelligence Matrix */}
          {stats.industryIntelData?.length > 0 && (
            <ChartCard title="Industry intelligence" subtitle="Ranked by opportunity score (avg quality + BUILD rate + momentum)" className="md:col-span-2" doodle={LightbulbDoodle}>
              <div className="overflow-x-auto -mx-1">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left font-medium text-muted-foreground py-2 px-2">Industry</th>
                      <th className="text-center font-medium text-muted-foreground py-2 px-2 w-14">Ideas</th>
                      <th className="text-center font-medium text-muted-foreground py-2 px-2 w-14">Avg</th>
                      <th className="text-center font-medium text-muted-foreground py-2 px-2 w-16">BUILD%</th>
                      <th className="text-left font-medium text-muted-foreground py-2 px-2 hidden sm:table-cell">Top source</th>
                      <th className="text-right font-medium text-muted-foreground py-2 px-2 w-16">Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.industryIntelData.slice(0, 12).map(ind => (
                      <tr key={ind.name} className="border-b border-border/30 last:border-0">
                        <td className="py-2 px-2 font-medium text-foreground text-[11px] sm:text-xs">{ind.name}</td>
                        <td className="py-2 px-2 text-center text-muted-foreground tabular-nums">{ind.count}</td>
                        <td className="py-2 px-2 text-center font-bold text-foreground tabular-nums">{ind.avgScore}</td>
                        <td className="py-2 px-2 text-center">
                          <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded", ind.buildRate >= 30 ? 'bg-primary/10 text-primary' : ind.buildRate >= 15 ? 'bg-amber-500/10 text-amber-600' : 'bg-muted text-muted-foreground')}>
                            {ind.buildRate}%
                          </span>
                        </td>
                        <td className="py-2 px-2 text-[11px] text-muted-foreground hidden sm:table-cell">{ind.bestSource}</td>
                        <td className="py-2 px-2 text-right"><DeltaBadge value={ind.wowDelta} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ChartCard>
          )}

          {/* Opportunity Map */}
          {stats.opportunityMapData?.length > 3 && (
            <ChartCard title="Opportunity map" subtitle="Industry volume vs BUILD rate. Top-right = stars. Top-left = niche gold." className="md:col-span-2" doodle={StarDoodle}>
              <div className="h-56 sm:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" dataKey="volume" name="Ideas" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} label={{ value: 'Idea volume', position: 'insideBottom', offset: -2, style: { fontSize: 10, fill: 'hsl(var(--muted-foreground))' } }} />
                    <YAxis type="number" dataKey="buildRate" name="BUILD %" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} label={{ value: 'BUILD rate %', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: 'hsl(var(--muted-foreground))' } }} width={40} />
                    <ZAxis type="number" dataKey="avgScore" range={[40, 400]} name="Avg score" />
                    <Tooltip content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0].payload;
                      return (
                        <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg text-sm">
                          <p className="font-medium text-foreground">{d.name}</p>
                          <p className="text-muted-foreground text-xs">{d.volume} ideas · {d.buildRate}% BUILD · avg {d.avgScore}</p>
                          <p className="text-[10px] text-muted-foreground/60 mt-0.5">{d.quadrant}</p>
                        </div>
                      );
                    }} />
                    <Scatter data={stats.opportunityMapData} fill={COLORS.primary}>
                      {stats.opportunityMapData.map((entry, i) => {
                        const qColors = { Stars: COLORS.primary, 'Niche Gold': COLORS.accent, Crowded: COLORS.amber, Frontier: COLORS.secondary };
                        return <Cell key={i} fill={qColors[entry.quadrant] || COLORS.primary} fillOpacity={0.7} />;
                      })}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-3 mt-3 justify-center">
                {[
                  { label: 'Stars (high vol + high BUILD)', color: COLORS.primary },
                  { label: 'Niche Gold (low vol + high BUILD)', color: COLORS.accent },
                  { label: 'Crowded (high vol + low BUILD)', color: COLORS.amber },
                  { label: 'Frontier (low vol + low BUILD)', color: COLORS.secondary },
                ].map(q => (
                  <span key={q.label} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <span className="w-2 h-2 rounded-full" style={{ background: q.color }} /> {q.label}
                  </span>
                ))}
              </div>
            </ChartCard>
          )}

          {/* Verdict Over Time (last 12 weeks) */}
          {stats.verdictTimeData && stats.verdictTimeData.length > 1 && (
            <ChartCard
              title="Verdicts over time"
              subtitle="How the pipeline judges ideas, last 12 weeks"
              className="md:col-span-2"
              doodle={LightbulbDoodle}
              doodleClass="top-3 right-3"
            >
              <div className="h-48 sm:h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.verdictTimeData} margin={{ left: -8, right: 4, top: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis
                      dataKey="week"
                      tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                      interval={0}
                      angle={-30}
                      textAnchor="end"
                      height={40}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      allowDecimals={false}
                      width={40}
                      tickFormatter={formatAxisNumber}
                    />
                    <Tooltip content={<ChartTooltip formatter={(e) => `${e.name}: ${e.value} ideas`} />} />
                    <Bar dataKey="BUILD" name="BUILD" stackId="verdict" fill={VERDICT_COLORS.BUILD} radius={[0, 0, 0, 0]} />
                    <Bar dataKey="VALIDATE" name="VALIDATE" stackId="verdict" fill={VERDICT_COLORS.VALIDATE_FIRST} radius={[0, 0, 0, 0]} />
                    <Bar dataKey="SKIP" name="SKIP" stackId="verdict" fill={VERDICT_COLORS.SKIP} radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 mt-2">
                <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ background: VERDICT_COLORS.BUILD }} /> BUILD
                </span>
                <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ background: VERDICT_COLORS.VALIDATE_FIRST }} /> VALIDATE
                </span>
                <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ background: VERDICT_COLORS.SKIP }} /> SKIP
                </span>
              </div>
            </ChartCard>
          )}

        </motion.div>

        {/* ── Recently Scored ── */}
        {stats.recentlyScored && stats.recentlyScored.length > 0 && (
          <motion.div className="mb-8 sm:mb-10" {...fadeUp}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-primary flex items-center gap-2">
                <Clock className="w-4 h-4" /> Recently scored
              </h2>
              <Link to="/ideas" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                View all
              </Link>
            </div>
            <div className="card-glow p-4 sm:p-5">
              {stats.recentlyScored.map((idea) => (
                <RecentIdeaRow key={idea.id} idea={idea} />
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Footer CTA ── */}
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.5 }}
          className="relative text-center py-6 sm:py-8"
        >
          <LightbulbDoodle className="absolute left-1/2 -translate-x-1/2 -top-6 w-10 h-12 text-muted-foreground/10 geo-float-2" />
          <p className="text-xs sm:text-sm text-muted-foreground mb-4">
            Data updates every time an idea gets scored. All open source.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/ideas"
              className="btn-playful btn-playful-primary px-6 py-3 text-sm w-full sm:w-auto"
            >
              Explore the Idea Lab
            </Link>
            <Link
              to="/scoring"
              className="btn-playful btn-playful-outline px-6 py-3 text-sm w-full sm:w-auto"
            >
              How scoring works
            </Link>
          </div>
        </motion.div>

      </div>
    </PageLayout>
  );
};

export default IdeasAnalyticsPage;
