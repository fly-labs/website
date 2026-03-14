
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Loader2, TrendingUp, Target, Zap, Layers, FlaskConical } from 'lucide-react';
import { PageLayout } from '@/components/PageLayout.jsx';
import { motion } from 'framer-motion';
import { fadeUp, staggerContainer, staggerItem } from '@/lib/animations.js';
import supabase from '@/lib/supabaseClient.js';
import { sourceOptions } from '@/lib/data/ideas.js';
import { cn } from '@/lib/utils.js';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area,
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
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
  pink: 'hsl(330, 65%, 55%)',
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

// ── Custom tooltip ──
const ChartTooltip = ({ active, payload, label, formatter }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg text-sm">
      {label && <p className="font-medium text-foreground mb-1">{label}</p>}
      {payload.map((entry, i) => (
        <p key={i} className="text-muted-foreground">
          <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ background: entry.color || entry.fill }} />
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
    <div className="glass-card p-5 sm:p-6 text-center border border-border rounded-xl">
      <Icon className={cn("w-5 h-5 mx-auto mb-2", color)} />
      <div className="text-3xl sm:text-4xl font-black tabular-nums text-foreground">
        {value != null ? <>{display.toLocaleString()}{suffix}</> : '...'}
      </div>
      <p className="text-xs text-muted-foreground font-medium mt-1">{label}</p>
    </div>
  );
};

// ── Chart wrapper with doodle ──
const ChartCard = ({ title, subtitle, children, className, doodle: Doodle, doodleClass }) => (
  <motion.div {...staggerItem} className={cn("card-glow p-5 sm:p-6 relative overflow-hidden", className)}>
    {Doodle && (
      <Doodle className={cn("absolute w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground/10 pointer-events-none", doodleClass || "top-3 right-3")} />
    )}
    <div className="relative z-10">
      <h3 className="font-bold text-foreground mb-1">{title}</h3>
      {subtitle && <p className="text-xs text-muted-foreground mb-4">{subtitle}</p>}
      {children}
    </div>
  </motion.div>
);

const IdeasAnalyticsPage = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const { data: ideas } = await supabase
          .from('ideas')
          .select('id, source, category, industry, verdict, confidence, composite_score, flylabs_score, hormozi_score, koe_score, okamoto_score, validation_score, votes, created_at, published_at')
          .eq('approved', true);

        if (!ideas || ideas.length === 0) {
          setLoading(false);
          return;
        }

        // ── Compute all stats ──
        const total = ideas.length;

        // Verdicts
        const verdictCounts = { BUILD: 0, VALIDATE_FIRST: 0, SKIP: 0 };
        ideas.forEach(i => { if (i.verdict && verdictCounts[i.verdict] !== undefined) verdictCounts[i.verdict]++; });
        const withVerdict = Object.values(verdictCounts).reduce((a, b) => a + b, 0);
        const noVerdict = total - withVerdict;

        const verdictData = Object.entries(verdictCounts)
          .filter(([, v]) => v > 0)
          .map(([name, value]) => ({
            name: name === 'VALIDATE_FIRST' ? 'VALIDATE' : name,
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
          .map(([name, value]) => ({
            name: sourceOptions.find(s => s.value === name)?.label || name,
            value,
            fill: SOURCE_COLORS[name] || COLORS.primary,
          }))
          .sort((a, b) => b.value - a.value);

        // Source quality (avg composite score by source)
        const sourceScores = {};
        ideas.forEach(i => {
          const s = i.source || 'community';
          if (i.composite_score != null) {
            if (!sourceScores[s]) sourceScores[s] = { sum: 0, count: 0 };
            sourceScores[s].sum += i.composite_score;
            sourceScores[s].count++;
          }
        });
        const sourceQualityData = Object.entries(sourceScores)
          .map(([name, { sum, count }]) => ({
            name: sourceOptions.find(s => s.value === name)?.label || name,
            avg: Math.round(sum / count),
            fill: SOURCE_COLORS[name] || COLORS.primary,
          }))
          .sort((a, b) => b.avg - a.avg);

        // Score distribution (histogram buckets)
        const scoreBuckets = [
          { range: '0-19', min: 0, max: 19, count: 0 },
          { range: '20-39', min: 20, max: 39, count: 0 },
          { range: '40-59', min: 40, max: 59, count: 0 },
          { range: '60-79', min: 60, max: 79, count: 0 },
          { range: '80-100', min: 80, max: 100, count: 0 },
        ];
        ideas.forEach(i => {
          if (i.composite_score != null) {
            const bucket = scoreBuckets.find(b => i.composite_score >= b.min && i.composite_score <= b.max);
            if (bucket) bucket.count++;
          }
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

        // Ideas over time (weekly buckets)
        const weeklyMap = {};
        ideas.forEach(i => {
          const d = new Date(i.published_at || i.created_at);
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

        // Framework radar (avg scores)
        const fwSums = { flylabs: 0, hormozi: 0, koe: 0, okamoto: 0 };
        const fwCounts = { flylabs: 0, hormozi: 0, koe: 0, okamoto: 0 };
        ideas.forEach(i => {
          if (i.flylabs_score != null) { fwSums.flylabs += i.flylabs_score; fwCounts.flylabs++; }
          if (i.hormozi_score != null) { fwSums.hormozi += i.hormozi_score; fwCounts.hormozi++; }
          if (i.koe_score != null) { fwSums.koe += i.koe_score; fwCounts.koe++; }
          if (i.okamoto_score != null) { fwSums.okamoto += i.okamoto_score; fwCounts.okamoto++; }
        });
        const radarData = [
          { framework: 'Fly Labs', score: fwCounts.flylabs > 0 ? Math.round(fwSums.flylabs / fwCounts.flylabs) : 0 },
          { framework: 'Hormozi', score: fwCounts.hormozi > 0 ? Math.round(fwSums.hormozi / fwCounts.hormozi) : 0 },
          { framework: 'Dan Koe', score: fwCounts.koe > 0 ? Math.round(fwSums.koe / fwCounts.koe) : 0 },
          { framework: 'Okamoto', score: fwCounts.okamoto > 0 ? Math.round(fwSums.okamoto / fwCounts.okamoto) : 0 },
        ];

        // Confidence
        const confidenceCounts = { high: 0, medium: 0, low: 0 };
        ideas.forEach(i => { if (i.confidence && confidenceCounts[i.confidence] !== undefined) confidenceCounts[i.confidence]++; });

        // Category
        const categoryCounts = {};
        ideas.forEach(i => {
          const c = i.category || 'Other';
          categoryCounts[c] = (categoryCounts[c] || 0) + 1;
        });
        const categoryData = Object.entries(categoryCounts)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value);

        // Avg scores
        const scored = ideas.filter(i => i.composite_score != null);
        const avgComposite = scored.length > 0 ? Math.round(scored.reduce((a, i) => a + i.composite_score, 0) / scored.length) : 0;
        const totalVotes = ideas.reduce((a, i) => a + (i.votes || 0), 0);
        const activeSources = Object.keys(sourceCounts).length;

        setStats({
          total, avgComposite, totalVotes, activeSources,
          buildCount: verdictCounts.BUILD,
          verdictData, noVerdict,
          sourceData, sourceQualityData,
          scoreBuckets, industryData, timelineData,
          radarData, confidenceCounts, categoryData,
        });
      } catch (err) {
        console.error('Analytics load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

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
        <div className="min-h-screen flex flex-col items-center justify-center text-muted-foreground">
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
        description: "Live analytics from the Idea Lab. Score distributions, source breakdown, verdict analysis, and framework comparison across all scored ideas.",
        url: "https://flylabs.fun/ideas/analytics",
        noindex: true,
      }}
      className="pt-28 sm:pt-32 pb-24"
    >
      <div className="container mx-auto px-4 sm:px-6 max-w-6xl">

        {/* Back link */}
        <motion.div {...fadeUp} className="mb-8">
          <Link
            to="/ideas"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Idea Lab
          </Link>
        </motion.div>

        {/* ── Hero ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative mb-12"
        >
          {/* Doodles */}
          <PaperPlaneDoodle className="absolute -top-2 right-0 sm:right-8 w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground/15 rotate-12 geo-float-1 hidden sm:block" />
          <FlaskDoodle className="absolute -top-4 right-24 sm:right-32 w-8 h-10 sm:w-10 sm:h-12 text-primary/15 -rotate-6 geo-float-2 hidden md:block" />

          <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-4">
            Lab Report
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground mb-3">
            Idea Lab Analytics
          </h1>
          <p className="text-muted-foreground font-medium max-w-xl">
            The full picture. Every idea scored, sliced, and charted. Pick your favorite insight and screenshot it.
          </p>
        </motion.div>

        {/* ── Stats Row ── */}
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-10"
          {...staggerContainer}
        >
          <motion.div {...staggerItem}>
            <AnimatedStat value={stats.total} label="Ideas scored" icon={Zap} color="text-primary" />
          </motion.div>
          <motion.div {...staggerItem}>
            <AnimatedStat value={stats.buildCount} label="Verdict: BUILD" icon={Target} color="text-primary" />
          </motion.div>
          <motion.div {...staggerItem}>
            <AnimatedStat value={stats.avgComposite} suffix="/100" label="Avg composite" icon={TrendingUp} color="text-secondary" />
          </motion.div>
          <motion.div {...staggerItem}>
            <AnimatedStat value={stats.activeSources} label="Active sources" icon={Layers} color="text-accent" />
          </motion.div>
        </motion.div>

        {/* ── Charts Grid ── */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 mb-10"
          {...staggerContainer}
        >

          {/* Verdict Distribution */}
          <ChartCard
            title="Verdict distribution"
            subtitle="What AI thinks you should do with these ideas"
            doodle={StarDoodle}
            doodleClass="top-4 right-4"
          >
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-48 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.verdictData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {stats.verdictData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip formatter={(e) => `${e.name}: ${e.value} (${stats.verdictData.find(v => v.name === e.name)?.pct}%)`} />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col gap-2">
                {stats.verdictData.map((v) => (
                  <div key={v.name} className="flex items-center gap-2 text-sm">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ background: v.color }} />
                    <span className="font-medium text-foreground">{v.name}</span>
                    <span className="text-muted-foreground">{v.value} ({v.pct}%)</span>
                  </div>
                ))}
                {stats.noVerdict > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">{stats.noVerdict} unscored</p>
                )}
              </div>
            </div>
          </ChartCard>

          {/* Source Breakdown */}
          <ChartCard
            title="Where ideas come from"
            subtitle={`${stats.activeSources} sources feeding the pipeline`}
            doodle={PaperPlaneDoodle}
            doodleClass="top-4 right-4 rotate-[-20deg]"
          >
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.sourceData} layout="vertical" margin={{ left: 0, right: 16, top: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip content={<ChartTooltip formatter={(e) => `${e.value} ideas`} />} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={18}>
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
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.scoreBuckets} margin={{ left: -10, right: 8, top: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="range" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip formatter={(e) => `${e.value} ideas`} />} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={36}>
                    {stats.scoreBuckets.map((entry, i) => {
                      const colors = [COLORS.red, COLORS.orange, COLORS.amber, COLORS.secondary, COLORS.primary];
                      return <Cell key={i} fill={colors[i]} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          {/* Framework Radar */}
          <ChartCard
            title="Framework averages"
            subtitle="How the four scoring brains compare"
            doodle={FlaskDoodle}
            doodleClass="top-3 right-3"
          >
            <div className="h-52 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={stats.radarData} cx="50%" cy="50%" outerRadius="70%">
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="framework" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <Radar
                    name="Avg Score"
                    dataKey="score"
                    stroke={COLORS.indigo}
                    fill={COLORS.indigo}
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                  <Tooltip content={<ChartTooltip formatter={(e) => `Avg: ${e.value}/100`} />} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          {/* Ideas Timeline */}
          <ChartCard
            title="Growth over time"
            subtitle="Cumulative ideas added to the lab"
            className="md:col-span-2"
          >
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.timelineData} margin={{ left: -10, right: 8, top: 8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradientArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="week" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip formatter={(e) => `${e.name}: ${e.value}`} />} />
                  <Area
                    type="monotone"
                    dataKey="total"
                    name="Total ideas"
                    stroke={COLORS.primary}
                    fill="url(#gradientArea)"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 2, stroke: COLORS.primary, fill: 'hsl(var(--background))' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          {/* Top Industries */}
          <ChartCard
            title="Top industries"
            subtitle="Where the problems cluster"
          >
            <div className="space-y-2">
              {stats.industryData.map((ind, i) => {
                const maxVal = stats.industryData[0]?.value || 1;
                const pct = Math.round((ind.value / maxVal) * 100);
                return (
                  <div key={ind.name} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-5 text-right tabular-nums">{i + 1}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-foreground truncate">{ind.name}</span>
                        <span className="text-xs text-muted-foreground tabular-nums ml-2">{ind.value}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
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
            <div className="space-y-2">
              {stats.sourceQualityData.map((src) => (
                <div key={src.name} className="flex items-center gap-3">
                  <span className="text-xs font-medium text-foreground w-24 truncate">{src.name}</span>
                  <div className="flex-1">
                    <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${src.avg}%`, background: src.fill }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums w-8 text-right">{src.avg}</span>
                </div>
              ))}
            </div>
          </ChartCard>

        </motion.div>

        {/* ── Footer doodle + CTA ── */}
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.5 }}
          className="relative text-center py-8"
        >
          <LightbulbDoodle className="absolute left-1/2 -translate-x-1/2 -top-6 w-10 h-12 text-muted-foreground/10 geo-float-2" />
          <p className="text-sm text-muted-foreground mb-4">
            Data updates every time an idea gets scored. All open source.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/ideas"
              className="btn-playful btn-playful-primary px-6 py-3 text-sm"
            >
              Explore the Idea Lab
            </Link>
            <Link
              to="/scoring"
              className="btn-playful btn-playful-outline px-6 py-3 text-sm"
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
