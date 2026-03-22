import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { PageLayout } from '@/components/PageLayout.jsx';
import { useAuth } from '@/contexts/AuthContext.jsx';
import supabase from '@/lib/supabaseClient.js';
import { cn, timeAgo } from '@/lib/utils.js';
import { motion } from 'framer-motion';
import { fadeUp } from '@/lib/animations.js';
import {
  Shield, Activity, Search, MessageSquare, CheckCircle2,
  AlertTriangle, RefreshCw, Database, Zap, Globe, Layers,
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell,
} from 'recharts';

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;
const REFRESH_INTERVAL = 30_000;

const SCORE_BUCKETS = [
  { label: '0-39', min: 0, max: 39, color: 'hsl(0, 72%, 51%)' },
  { label: '40-49', min: 40, max: 49, color: 'hsl(25, 85%, 55%)' },
  { label: '50-64', min: 50, max: 64, color: 'hsl(38, 92%, 50%)' },
  { label: '65-74', min: 65, max: 74, color: 'hsl(80, 60%, 45%)' },
  { label: '75-84', min: 75, max: 84, color: 'hsl(120, 50%, 45%)' },
  { label: '85-100', min: 85, max: 100, color: 'hsl(142, 70%, 40%)' },
];

const VERDICT_CONFIG = {
  BUILD: { color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/30' },
  VALIDATE_FIRST: { color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' },
  SKIP: { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30' },
};

const StatCard = ({ icon: Icon, label, value, sub, accent = false }) => (
  <motion.div
    variants={fadeUp}
    className={cn(
      'rounded-lg border p-5 bg-card',
      accent && 'border-primary/30'
    )}
  >
    <div className="flex items-center gap-2 mb-2">
      <Icon className="w-4 h-4 text-muted-foreground" />
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
    </div>
    <p className="text-3xl font-mono tabular-nums font-bold text-foreground">{value}</p>
    {sub && <p className="text-xs text-muted-foreground mt-1 font-mono">{sub}</p>}
  </motion.div>
);

const VerdictCard = ({ verdict, count, total }) => {
  const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0.0';
  const config = VERDICT_CONFIG[verdict] || VERDICT_CONFIG.SKIP;
  return (
    <div className={cn('rounded-lg border p-4', config.bg)}>
      <p className={cn('text-sm font-medium', config.color)}>{verdict.replace('_', ' ')}</p>
      <p className="text-2xl font-mono tabular-nums font-bold text-foreground mt-1">{count}</p>
      <p className="text-xs text-muted-foreground font-mono">{pct}%</p>
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border rounded-lg p-3 shadow-lg">
      <p className="text-xs text-muted-foreground mb-1">Score range: {label}</p>
      <p className="text-sm font-mono font-bold text-foreground">{payload[0].value} ideas</p>
    </div>
  );
};

export default function AdminDashboardPage() {
  const { currentUser, isLoading: authLoading } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState(null);
  const [secondsAgo, setSecondsAgo] = useState(0);

  const isAdmin = currentUser?.email === ADMIN_EMAIL;

  const fetchData = useCallback(async () => {
    try {
      // Fetch all ideas with needed columns
      const { data: ideas, error } = await supabase
        .from('ideas')
        .select('id, idea_title, source, flylabs_score, verdict, confidence, meta, created_at, updated_at')
        .eq('approved', true);

      if (error) throw error;

      const total = ideas.length;
      const researched = ideas.filter(i => i.meta?.research).length;
      const webIntel = ideas.filter(i => i.meta?.research?.web).length;
      const xEvidence = ideas.filter(i => (i.meta?.research?.x_evidence?.total_found || 0) > 0).length;

      // Verdict distribution
      const verdicts = { BUILD: 0, VALIDATE_FIRST: 0, SKIP: 0 };
      ideas.forEach(i => {
        if (i.verdict && verdicts[i.verdict] !== undefined) verdicts[i.verdict]++;
      });

      // Score distribution
      const scoreDist = SCORE_BUCKETS.map(b => ({
        ...b,
        count: ideas.filter(i =>
          i.flylabs_score !== null &&
          i.flylabs_score >= b.min &&
          i.flylabs_score <= b.max
        ).length,
      }));

      // Source quality
      const sourceMap = {};
      ideas.forEach(i => {
        const s = i.source || 'community';
        if (!sourceMap[s]) sourceMap[s] = { count: 0, scores: [], builds: 0 };
        sourceMap[s].count++;
        if (i.flylabs_score !== null) sourceMap[s].scores.push(i.flylabs_score);
        if (i.verdict === 'BUILD') sourceMap[s].builds++;
      });
      const sourceQuality = Object.entries(sourceMap)
        .map(([name, d]) => ({
          name,
          count: d.count,
          avgScore: d.scores.length > 0
            ? (d.scores.reduce((a, b) => a + b, 0) / d.scores.length).toFixed(1)
            : '-',
          avgScoreNum: d.scores.length > 0
            ? d.scores.reduce((a, b) => a + b, 0) / d.scores.length
            : 0,
          buildRate: d.count > 0
            ? ((d.builds / d.count) * 100).toFixed(1)
            : '0.0',
        }))
        .sort((a, b) => b.avgScoreNum - a.avgScoreNum);

      // Recent activity (last 10 scored)
      const recent = ideas
        .filter(i => i.flylabs_score !== null)
        .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))
        .slice(0, 10);

      // Data integrity
      const buildUnderFL65 = ideas.filter(
        i => i.verdict === 'BUILD' && i.flylabs_score !== null && i.flylabs_score < 65
      ).length;
      const orphanVerdicts = ideas.filter(
        i => i.verdict && i.flylabs_score === null
      ).length;

      setData({
        total,
        researched,
        webIntel,
        xEvidence,
        verdicts,
        scoreDist,
        sourceQuality,
        recent,
        buildUnderFL65,
        orphanVerdicts,
      });
      setLastFetch(new Date());
      setLoading(false);
    } catch (err) {
      console.error('[Admin] Fetch error:', err);
      setLoading(false);
    }
  }, []);

  // Initial fetch + interval
  useEffect(() => {
    if (!isAdmin) return;
    fetchData();
    const interval = setInterval(fetchData, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [isAdmin, fetchData]);

  // Seconds-ago ticker
  useEffect(() => {
    if (!lastFetch) return;
    const tick = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastFetch.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(tick);
  }, [lastFetch]);

  // Auth guard
  if (authLoading) return null;
  if (!currentUser || !isAdmin) return <Navigate to="/" replace />;

  const costPerIdea = 0.003;
  const researchedCount = data?.researched || 0;
  const totalCount = data?.total || 0;
  const costSoFar = (researchedCount * costPerIdea).toFixed(2);
  const costRemaining = ((totalCount - researchedCount) * costPerIdea).toFixed(2);
  const coveragePct = totalCount > 0 ? ((researchedCount / totalCount) * 100).toFixed(1) : '0.0';

  return (
    <PageLayout
      seo={{
        title: 'Command Center',
        description: 'Admin dashboard',
        noindex: true,
      }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-5 h-5 text-primary" />
            <span className="text-xs uppercase tracking-widest text-primary font-mono">Admin Only</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold font-mono tracking-tight text-foreground">
            Command Center
          </h1>
          <div className="flex items-center gap-3 mt-3">
            {lastFetch && (
              <span className="text-xs text-muted-foreground font-mono flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Updated {secondsAgo}s ago
              </span>
            )}
            <button
              onClick={fetchData}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              title="Refresh now"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
          {totalCount > 0 && (
            <p className="text-6xl sm:text-7xl font-mono tabular-nums font-bold text-primary mt-6">
              {totalCount.toLocaleString()}
            </p>
          )}
          <p className="text-sm text-muted-foreground mt-1">total ideas in the pipeline</p>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : data ? (
          <div className="space-y-10">
            {/* Research Coverage Progress */}
            <motion.div variants={fadeUp} initial="hidden" animate="visible" className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Research Coverage</span>
                <span className="font-mono tabular-nums text-foreground">
                  {researchedCount} of {totalCount} researched ({coveragePct}%)
                </span>
              </div>
              <div className="w-full h-4 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${coveragePct}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
            </motion.div>

            {/* Stat Cards */}
            <motion.div
              variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-2 lg:grid-cols-4 gap-4"
            >
              <StatCard icon={Database} label="Total Ideas" value={totalCount.toLocaleString()} accent />
              <StatCard
                icon={Search}
                label="Researched"
                value={researchedCount.toLocaleString()}
                sub={`${coveragePct}% coverage`}
              />
              <StatCard
                icon={Globe}
                label="Web Intelligence"
                value={data.webIntel.toLocaleString()}
                sub={`${totalCount > 0 ? ((data.webIntel / totalCount) * 100).toFixed(1) : 0}%`}
              />
              <StatCard
                icon={MessageSquare}
                label="X Evidence"
                value={data.xEvidence.toLocaleString()}
                sub={`${totalCount > 0 ? ((data.xEvidence / totalCount) * 100).toFixed(1) : 0}%`}
              />
            </motion.div>

            {/* Verdict Distribution */}
            <motion.div variants={fadeUp} initial="hidden" animate="visible">
              <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" /> Verdict Distribution
              </h2>
              <div className="grid grid-cols-3 gap-3">
                {(['BUILD', 'VALIDATE_FIRST', 'SKIP']).map(v => (
                  <VerdictCard key={v} verdict={v} count={data.verdicts[v]} total={totalCount} />
                ))}
              </div>
            </motion.div>

            {/* Score Distribution Chart */}
            <motion.div variants={fadeUp} initial="hidden" animate="visible">
              <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" /> FL Score Distribution
              </h2>
              <div className="bg-card border rounded-lg p-4">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={data.scoreDist} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                    <XAxis
                      dataKey="label"
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontFamily: 'monospace' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontFamily: 'monospace' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {data.scoreDist.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Source Quality Table */}
            <motion.div variants={fadeUp} initial="hidden" animate="visible">
              <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" /> Source Quality
              </h2>
              <div className="bg-card border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground">Source</th>
                        <th className="px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground text-right">Count</th>
                        <th className="px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground text-right">Avg FL</th>
                        <th className="px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground text-right">BUILD %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.sourceQuality.map((s, i) => (
                        <tr key={s.name} className={cn('border-b last:border-0', i % 2 === 0 && 'bg-muted/30')}>
                          <td className="px-4 py-2.5 font-medium text-foreground">{s.name}</td>
                          <td className="px-4 py-2.5 text-right font-mono tabular-nums text-muted-foreground">{s.count}</td>
                          <td className="px-4 py-2.5 text-right font-mono tabular-nums text-foreground">{s.avgScore}</td>
                          <td className="px-4 py-2.5 text-right font-mono tabular-nums text-muted-foreground">{s.buildRate}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>

            {/* Recent Activity */}
            <motion.div variants={fadeUp} initial="hidden" animate="visible">
              <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-primary" /> Recent Activity
              </h2>
              <div className="bg-card border rounded-lg divide-y">
                {data.recent.map(idea => {
                  const vc = VERDICT_CONFIG[idea.verdict] || VERDICT_CONFIG.SKIP;
                  return (
                    <div key={idea.id} className="px-4 py-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">{idea.idea_title}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {timeAgo(idea.updated_at || idea.created_at)}
                        </p>
                      </div>
                      <span className="font-mono tabular-nums text-sm font-bold text-foreground">
                        {idea.flylabs_score}
                      </span>
                      {idea.verdict && (
                        <span className={cn('text-xs font-medium px-2 py-0.5 rounded border', vc.bg, vc.color)}>
                          {idea.verdict.replace('_', ' ')}
                        </span>
                      )}
                      {idea.confidence && (
                        <span className="text-xs text-muted-foreground capitalize hidden sm:inline">
                          {idea.confidence}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Cost Tracker + Data Integrity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Cost */}
              <motion.div variants={fadeUp} initial="hidden" animate="visible" className="bg-card border rounded-lg p-5">
                <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" /> Cost Tracker
                </h2>
                <div className="space-y-2 text-sm">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 mb-1">Re-score (Gemini + Google Search)</p>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Researched</span>
                    <span className="font-mono tabular-nums text-foreground">${costSoFar} ({researchedCount} ideas)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Remaining</span>
                    <span className="font-mono tabular-nums text-foreground">${costRemaining} ({totalCount - researchedCount} ideas)</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 mt-2">
                    <span className="text-muted-foreground font-medium">Total re-score</span>
                    <span className="font-mono tabular-nums font-bold text-foreground">
                      ${(totalCount * costPerIdea).toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t pt-2 mt-3 space-y-1.5">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60">Grok X evidence (paid separately)</p>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ideas with X data</span>
                      <span className="font-mono tabular-nums text-foreground">{data.xEvidence} ideas</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Est. XAI spend</span>
                      <span className="font-mono tabular-nums text-foreground">~${(data.xEvidence * 0.10).toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="border-t pt-2 mt-3 space-y-1.5">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60">Daily pipeline</p>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">~15 ideas/day</span>
                      <span className="font-mono tabular-nums text-foreground">~$0.05/day</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Monthly estimate</span>
                      <span className="font-mono tabular-nums text-foreground">~$1.50/mo</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground/50 mt-2">Gemini scoring $0.0015/idea + Google Search $0.001/idea + Reddit free</p>
                </div>
              </motion.div>

              {/* Data Integrity */}
              <motion.div variants={fadeUp} initial="hidden" animate="visible" className="bg-card border rounded-lg p-5">
                <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" /> Data Integrity
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    {data.buildUnderFL65 === 0 ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    )}
                    <div>
                      <p className="text-sm text-foreground">BUILD with FL &lt; 65</p>
                      <p className={cn(
                        'text-xs font-mono',
                        data.buildUnderFL65 === 0 ? 'text-green-500' : 'text-red-500'
                      )}>
                        {data.buildUnderFL65 === 0 ? 'Clean' : `${data.buildUnderFL65} issues found`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {data.orphanVerdicts === 0 ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    )}
                    <div>
                      <p className="text-sm text-foreground">Orphan verdicts (no FL score)</p>
                      <p className={cn(
                        'text-xs font-mono',
                        data.orphanVerdicts === 0 ? 'text-green-500' : 'text-red-500'
                      )}>
                        {data.orphanVerdicts === 0 ? 'Clean' : `${data.orphanVerdicts} issues found`}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        ) : null}
      </div>
    </PageLayout>
  );
}
