import React, { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { PageLayout } from '@/components/PageLayout.jsx';
import { useAuth } from '@/contexts/AuthContext.jsx';
import supabase from '@/lib/supabaseClient.js';
import { cn, timeAgo } from '@/lib/utils.js';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Activity, Search, MessageSquare, CheckCircle2,
  AlertTriangle, RefreshCw, Database, Zap, Globe, Layers,
  TrendingUp, DollarSign, Clock, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell,
  PieChart, Pie, AreaChart, Area, CartesianGrid,
} from 'recharts';

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;
const REFRESH_INTERVAL = 15_000; // 15s for real-time feel

// ── Real API pricing (from official docs, March 2026) ──
const PRICING = {
  gemini: {
    name: 'Gemini 2.5 Flash',
    inputPerMToken: 0.30,        // $0.30/1M tokens (paid tier)
    outputPerMToken: 2.50,       // $2.50/1M tokens (includes thinking)
    googleSearchFreeRPD: 1500,   // Free grounding calls per day
    googleSearchPerPrompt: 0.035, // $35/1000 after free tier
    avgInputTokens: 3000,        // avg per scoring call
    avgOutputTokens: 4000,       // avg per scoring call
    avgSearchInputTokens: 2000,  // avg per google_search call
    avgSearchOutputTokens: 3000, // avg per google_search call
  },
  grok: {
    name: 'Grok 4-1 Fast',
    inputPerMToken: 0.20,
    outputPerMToken: 0.50,
    xSearchPer1000: 5.00,        // $5/1000 invocations
    avgInvocationsPerCall: 10,   // observed average
    avgInputTokens: 20000,
    avgOutputTokens: 3500,
  },
  reddit: { name: 'Reddit API', cost: 0 },
  anthropic: {
    name: 'Claude (Anthropic)',
    haiku: { inputPerMToken: 0.80, outputPerMToken: 4.00 },  // claude-haiku-4-5
    sonnet: { inputPerMToken: 3.00, outputPerMToken: 15.00 }, // claude-sonnet-4
    // Used for: sync filters (Haiku), FlyBot chat (Haiku users, Sonnet admin)
    avgSyncFilterTokens: { input: 2000, output: 200 }, // per idea filtered
    avgChatTokens: { input: 8000, output: 500 },       // per FlyBot message
  },
  openai: {
    name: 'OpenAI',
    gpt4oMini: { inputPerMToken: 0.15, outputPerMToken: 0.60 }, // gpt-4o-mini
    // Used for: standalone scout-competitors.mjs only (not in daily pipeline)
  },
};

function geminiScoringCost() {
  const p = PRICING.gemini;
  const input = (p.avgInputTokens / 1e6) * p.inputPerMToken;
  const output = (p.avgOutputTokens / 1e6) * p.outputPerMToken;
  return input + output;
}

function geminiSearchCost(isOverFreeLimit) {
  const p = PRICING.gemini;
  const input = (p.avgSearchInputTokens / 1e6) * p.inputPerMToken;
  const output = (p.avgSearchOutputTokens / 1e6) * p.outputPerMToken;
  const grounding = isOverFreeLimit ? p.googleSearchPerPrompt : 0;
  return input + output + grounding;
}

function grokCostPerIdea() {
  const p = PRICING.grok;
  const tokenCost = ((p.avgInputTokens / 1e6) * p.inputPerMToken + (p.avgOutputTokens / 1e6) * p.outputPerMToken) * 2;
  const searchCost = p.avgInvocationsPerCall * 2 * (p.xSearchPer1000 / 1000);
  return tokenCost + searchCost;
}

const SCORE_COLORS = [
  { min: 0, max: 39, color: '#ef4444', label: '0-39' },
  { min: 40, max: 49, color: '#f97316', label: '40-49' },
  { min: 50, max: 64, color: '#eab308', label: '50-64' },
  { min: 65, max: 74, color: '#84cc16', label: '65-74' },
  { min: 75, max: 84, color: '#22c55e', label: '75-84' },
  { min: 85, max: 100, color: '#10b981', label: '85-100' },
];

const VERDICT_COLORS = {
  BUILD: '#22c55e',
  VALIDATE_FIRST: '#eab308',
  SKIP: '#ef4444',
};

const VERDICT_LABELS = {
  BUILD: 'BUILD',
  VALIDATE_FIRST: 'VALIDATE',
  SKIP: 'SKIP',
};

// ── Components ──

const Pulse = () => (
  <span className="relative flex h-2 w-2">
    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
  </span>
);

const Metric = ({ label, value, sub, icon: Icon, trend, accent }) => (
  <div className={cn('rounded-lg border p-4 bg-card/80 backdrop-blur-sm', accent && 'border-primary/40 bg-primary/5')}>
    <div className="flex items-center justify-between mb-1">
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60">{label}</span>
      {Icon && <Icon className="w-3.5 h-3.5 text-muted-foreground/40" />}
    </div>
    <div className="flex items-baseline gap-2">
      <span className="text-2xl font-mono tabular-nums font-bold text-foreground">{value}</span>
      {trend !== undefined && trend !== 0 && (
        <span className={cn('flex items-center text-xs font-mono', trend > 0 ? 'text-primary' : 'text-red-400')}>
          {trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {Math.abs(trend)}%
        </span>
      )}
    </div>
    {sub && <p className="text-[10px] text-muted-foreground/50 font-mono mt-0.5">{sub}</p>}
  </div>
);

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border rounded-lg px-3 py-2 shadow-xl">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="text-sm font-mono font-bold">{payload[0].value}</p>
    </div>
  );
};

export default function AdminDashboardPage() {
  const { currentUser, isLoading: authLoading } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState(null);
  const [secondsAgo, setSecondsAgo] = useState(0);
  const [prevResearched, setPrevResearched] = useState(null);

  const isAdmin = currentUser?.email === ADMIN_EMAIL;

  const fetchData = useCallback(async () => {
    try {
      const { data: ideas, error } = await supabase
        .from('ideas')
        .select('id, idea_title, source, flylabs_score, verdict, confidence, meta, industry, created_at, updated_at')
        .eq('approved', true);

      if (error) throw error;

      const total = ideas.length;
      const scored = ideas.filter(i => i.flylabs_score != null).length;
      const researched = ideas.filter(i => i.meta?.research).length;
      const webIntel = ideas.filter(i => i.meta?.research?.web).length;
      const xEvidence = ideas.filter(i => (i.meta?.research?.x_evidence?.total_found || 0) > 0).length;
      const unscored = total - scored;

      // Verdicts
      const verdicts = { BUILD: 0, VALIDATE_FIRST: 0, SKIP: 0 };
      ideas.forEach(i => { if (i.verdict && verdicts[i.verdict] !== undefined) verdicts[i.verdict]++; });

      // Score distribution
      const scoreDist = SCORE_COLORS.map(b => ({
        ...b,
        count: ideas.filter(i => i.flylabs_score != null && i.flylabs_score >= b.min && i.flylabs_score <= b.max).length,
      }));

      // Verdict pie
      const verdictPie = Object.entries(verdicts).filter(([, v]) => v > 0).map(([name, value]) => ({
        name: VERDICT_LABELS[name] || name, value, fill: VERDICT_COLORS[name],
      }));

      // Source stats
      const sourceMap = {};
      ideas.forEach(i => {
        const s = i.source || 'community';
        if (!sourceMap[s]) sourceMap[s] = { count: 0, scores: [], builds: 0, researched: 0 };
        sourceMap[s].count++;
        if (i.flylabs_score != null) sourceMap[s].scores.push(i.flylabs_score);
        if (i.verdict === 'BUILD') sourceMap[s].builds++;
        if (i.meta?.research) sourceMap[s].researched++;
      });
      const sources = Object.entries(sourceMap)
        .map(([name, d]) => ({
          name,
          count: d.count,
          avg: d.scores.length > 0 ? Math.round(d.scores.reduce((a, b) => a + b, 0) / d.scores.length) : 0,
          buildRate: d.count > 0 ? Math.round((d.builds / d.count) * 100) : 0,
          coverage: d.count > 0 ? Math.round((d.researched / d.count) * 100) : 0,
        }))
        .sort((a, b) => b.avg - a.avg);

      // Recent activity (last 15)
      const recent = ideas
        .filter(i => i.flylabs_score != null && i.meta?.research)
        .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
        .slice(0, 15);

      // Research timeline (last 24h, grouped by hour)
      const now = Date.now();
      const timeline = [];
      for (let h = 23; h >= 0; h--) {
        const hourStart = now - (h + 1) * 3600000;
        const hourEnd = now - h * 3600000;
        const count = ideas.filter(i => {
          if (!i.meta?.research?.searched_at) return false;
          const t = new Date(i.meta.research.searched_at).getTime();
          return t >= hourStart && t < hourEnd;
        }).length;
        timeline.push({ hour: `${23 - h}h`, count });
      }

      // Integrity
      const buildUnder65 = ideas.filter(i => i.verdict === 'BUILD' && i.flylabs_score != null && i.flylabs_score < 65).length;
      const orphanVerdicts = ideas.filter(i => i.verdict && i.flylabs_score == null).length;

      // Average score
      const allScores = ideas.filter(i => i.flylabs_score != null).map(i => i.flylabs_score);
      const avgScore = allScores.length > 0 ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : 0;

      // Top industries
      const industryMap = {};
      ideas.forEach(i => {
        if (!i.industry) return;
        if (!industryMap[i.industry]) industryMap[i.industry] = { count: 0, builds: 0 };
        industryMap[i.industry].count++;
        if (i.verdict === 'BUILD') industryMap[i.industry].builds++;
      });
      const topIndustries = Object.entries(industryMap)
        .map(([name, d]) => ({ name: name.length > 18 ? name.slice(0, 16) + '..' : name, count: d.count, builds: d.builds }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);

      setData({
        total, scored, unscored, researched, webIntel, xEvidence,
        verdicts, verdictPie, scoreDist, sources, recent, timeline,
        buildUnder65, orphanVerdicts, avgScore, topIndustries,
      });
      setLastFetch(new Date());
      setLoading(false);
    } catch (err) {
      console.error('[Admin]', err);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    fetchData();
    const iv = setInterval(fetchData, REFRESH_INTERVAL);
    return () => clearInterval(iv);
  }, [isAdmin, fetchData]);

  useEffect(() => {
    if (!lastFetch) return;
    const iv = setInterval(() => setSecondsAgo(Math.floor((Date.now() - lastFetch.getTime()) / 1000)), 1000);
    return () => clearInterval(iv);
  }, [lastFetch]);

  // Track delta
  useEffect(() => {
    if (data?.researched != null && prevResearched == null) setPrevResearched(data.researched);
  }, [data, prevResearched]);

  if (authLoading) return null;
  if (!currentUser || !isAdmin) return <Navigate to="/" replace />;

  const d = data;
  const coveragePct = d ? ((d.researched / d.total) * 100).toFixed(1) : '0';
  const needsResearch = d ? d.total - d.researched : 0;

  // Cost calculations (real pricing)
  const geminiScoreCost = geminiScoringCost();
  const geminiSearchFree = geminiSearchCost(false);
  const geminiSearchPaid = geminiSearchCost(true);
  const grokPerIdea = grokCostPerIdea();
  // For re-scoring, we'll exceed 1500 RPD, so most are paid
  const costPerIdeaRescore = geminiScoreCost + geminiSearchPaid;
  const costPerIdeaDaily = geminiScoreCost + geminiSearchFree; // under 1500 RPD for daily
  const totalSpent = d ? d.researched * costPerIdeaRescore : 0;
  const totalRemaining = needsResearch * costPerIdeaRescore;

  return (
    <PageLayout seo={{ title: 'Command Center', noindex: true }} background={false}>
      <div className="min-h-screen bg-background">
        {/* Header bar */}
        <div className="sticky top-16 z-30 border-b border-border/40 bg-background/80 backdrop-blur-md px-4 sm:px-6 py-3">
          <div className="max-w-[1600px] mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-sm font-mono font-bold tracking-tight">COMMAND CENTER</span>
              {d && <span className="text-xs font-mono text-muted-foreground/50 hidden sm:inline">// {d.total.toLocaleString()} ideas in pipeline</span>}
            </div>
            <div className="flex items-center gap-3">
              {lastFetch && (
                <span className="text-[10px] text-muted-foreground/50 font-mono flex items-center gap-1.5">
                  <Pulse /> LIVE {secondsAgo}s
                </span>
              )}
              <button onClick={fetchData} className="p-1.5 hover:bg-muted rounded transition-colors" title="Refresh">
                <RefreshCw className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-40">
            <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : d ? (
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 space-y-6">

            {/* ── Row 1: Progress + Big Numbers ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Progress ring + coverage */}
              <div className="lg:col-span-1 rounded-lg border bg-card/80 p-5 flex flex-col items-center justify-center">
                <div className="relative w-36 h-36">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
                    <motion.circle
                      cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--primary))" strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 42}`}
                      initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                      animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - d.researched / d.total) }}
                      transition={{ duration: 1.5, ease: 'easeOut' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-mono tabular-nums font-bold text-primary">{coveragePct}%</span>
                    <span className="text-[9px] uppercase tracking-widest text-muted-foreground/50">RESEARCHED</span>
                  </div>
                </div>
                <p className="text-xs font-mono text-muted-foreground mt-3">
                  {d.researched.toLocaleString()} of {d.total.toLocaleString()} ideas
                </p>
                <p className="text-[10px] text-muted-foreground/40 font-mono">
                  {needsResearch.toLocaleString()} remaining
                </p>
              </div>

              {/* Metrics grid */}
              <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Metric label="Total Ideas" value={d.total.toLocaleString()} icon={Database} accent />
                <Metric label="Scored" value={d.scored.toLocaleString()} sub={`${d.unscored} unscored`} icon={Activity} />
                <Metric label="Web Intel" value={d.webIntel.toLocaleString()} sub={`${d.total > 0 ? Math.round(d.webIntel / d.total * 100) : 0}% coverage`} icon={Globe} />
                <Metric label="X Evidence" value={d.xEvidence.toLocaleString()} sub="Grok tweets (preserved)" icon={MessageSquare} />
                <Metric label="Avg FL Score" value={d.avgScore} icon={TrendingUp} />
                <Metric label="BUILD Rate" value={`${d.scored > 0 ? Math.round(d.verdicts.BUILD / d.scored * 100) : 0}%`} sub={`${d.verdicts.BUILD} ideas`} icon={Zap} />
                <Metric label="VALIDATE" value={d.verdicts.VALIDATE_FIRST.toLocaleString()} sub={`${d.scored > 0 ? Math.round(d.verdicts.VALIDATE_FIRST / d.scored * 100) : 0}%`} icon={Search} />
                <Metric label="SKIP" value={d.verdicts.SKIP.toLocaleString()} sub={`${d.scored > 0 ? Math.round(d.verdicts.SKIP / d.scored * 100) : 0}%`} icon={AlertTriangle} />
              </div>
            </div>

            {/* ── Row 2: Charts ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Score Distribution */}
              <div className="rounded-lg border bg-card/80 p-4">
                <h3 className="text-xs uppercase tracking-widest text-muted-foreground/60 mb-3 flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5" /> FL Score Distribution
                </h3>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={d.scoreDist} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                    <XAxis dataKey="label" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                      {d.scoreDist.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Verdict Pie */}
              <div className="rounded-lg border bg-card/80 p-4">
                <h3 className="text-xs uppercase tracking-widest text-muted-foreground/60 mb-3 flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5" /> Verdicts
                </h3>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={d.verdictPie} dataKey="value" cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} strokeWidth={0}>
                      {d.verdictPie.map((e, i) => <Cell key={i} fill={e.fill} />)}
                    </Pie>
                    <Tooltip content={({ active, payload }) => active && payload?.length ? (
                      <div className="bg-card border rounded-lg px-3 py-2 shadow-xl">
                        <p className="text-xs font-mono font-bold">{payload[0].name}: {payload[0].value}</p>
                      </div>
                    ) : null} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 -mt-2">
                  {d.verdictPie.map(v => (
                    <span key={v.name} className="flex items-center gap-1.5 text-[10px] font-mono">
                      <span className="w-2 h-2 rounded-full" style={{ background: v.fill }} />
                      {v.name} {v.value}
                    </span>
                  ))}
                </div>
              </div>

              {/* Research Timeline (24h) */}
              <div className="rounded-lg border bg-card/80 p-4">
                <h3 className="text-xs uppercase tracking-widest text-muted-foreground/60 mb-3 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" /> Research Activity (24h)
                </h3>
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={d.timeline} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis dataKey="hour" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9, fontFamily: 'monospace' }} axisLine={false} tickLine={false} interval={5} />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.15} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* ── Row 3: Source Quality + Cost + Integrity ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Source Table */}
              <div className="lg:col-span-1 rounded-lg border bg-card/80 overflow-hidden">
                <div className="px-4 py-3 border-b">
                  <h3 className="text-xs uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5" /> Source Quality
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground/50">Source</th>
                        <th className="px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground/50 text-right">#</th>
                        <th className="px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground/50 text-right">FL</th>
                        <th className="px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground/50 text-right">BUILD</th>
                        <th className="px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground/50 text-right">Cov</th>
                      </tr>
                    </thead>
                    <tbody>
                      {d.sources.map(s => (
                        <tr key={s.name} className="border-b border-border/30 last:border-0">
                          <td className="px-3 py-2 font-medium text-foreground">{s.name}</td>
                          <td className="px-3 py-2 text-right font-mono tabular-nums text-muted-foreground">{s.count}</td>
                          <td className="px-3 py-2 text-right font-mono tabular-nums text-foreground font-bold">{s.avg || '-'}</td>
                          <td className="px-3 py-2 text-right font-mono tabular-nums text-muted-foreground">{s.buildRate}%</td>
                          <td className="px-3 py-2 text-right font-mono tabular-nums text-muted-foreground">{s.coverage}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Cost Breakdown */}
              <div className="lg:col-span-1 rounded-lg border bg-card/80 p-4">
                <h3 className="text-xs uppercase tracking-widest text-muted-foreground/60 mb-3 flex items-center gap-2">
                  <DollarSign className="w-3.5 h-3.5" /> API Costs (Real Pricing)
                </h3>
                <div className="space-y-3 text-xs">
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-primary/60 mb-1">Per Idea (Re-score)</p>
                    <div className="space-y-1 font-mono">
                      <div className="flex justify-between"><span className="text-muted-foreground">Gemini scoring</span><span>${geminiScoreCost.toFixed(4)}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Google Search</span><span>${geminiSearchPaid.toFixed(4)}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Reddit</span><span>free</span></div>
                      <div className="flex justify-between border-t border-border/30 pt-1 font-bold"><span>Total/idea</span><span>${costPerIdeaRescore.toFixed(4)}</span></div>
                    </div>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-primary/60 mb-1">Re-Score Progress</p>
                    <div className="space-y-1 font-mono">
                      <div className="flex justify-between"><span className="text-muted-foreground">Spent ({d.researched} ideas)</span><span className="text-foreground">${totalSpent.toFixed(2)}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Remaining ({needsResearch})</span><span className="text-foreground">${totalRemaining.toFixed(2)}</span></div>
                      <div className="flex justify-between border-t border-border/30 pt-1 font-bold"><span>Total est.</span><span>${(totalSpent + totalRemaining).toFixed(2)}</span></div>
                    </div>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-primary/60 mb-1">Grok X Evidence (Separate)</p>
                    <div className="space-y-1 font-mono">
                      <div className="flex justify-between"><span className="text-muted-foreground">{d.xEvidence} ideas with X data</span><span>~${(d.xEvidence * grokPerIdea).toFixed(2)}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Cost per idea (Grok)</span><span>${grokPerIdea.toFixed(3)}</span></div>
                    </div>
                  </div>
                  <div className="border-t border-border/30 pt-2">
                    <p className="text-[9px] uppercase tracking-widest text-primary/60 mb-1">Daily Pipeline (~15 ideas)</p>
                    <div className="space-y-1 font-mono">
                      <div className="flex justify-between"><span className="text-muted-foreground">Per day</span><span>${(15 * costPerIdeaDaily).toFixed(2)}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Per month</span><span>${(15 * costPerIdeaDaily * 30).toFixed(2)}</span></div>
                    </div>
                  </div>
                  <div className="border-t border-border/30 pt-2">
                    <p className="text-[9px] uppercase tracking-widest text-primary/60 mb-1">Anthropic (Claude)</p>
                    <div className="space-y-1 font-mono">
                      <div className="flex justify-between"><span className="text-muted-foreground">Sync filters (Haiku)</span><span>~$0.50/day</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">FlyBot chat</span><span>usage-based</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Est. monthly</span><span>~$15-20</span></div>
                    </div>
                  </div>
                  <p className="text-[8px] text-muted-foreground/30 mt-2">Gemini $0.30/$2.50/1M tok. Google Search $35/1K after 1,500 free/day. Grok $0.20/$0.50 + $5/1K x_search. Haiku $0.80/$4.00/1M. Sonnet $3/$15/1M. OpenAI (standalone only).</p>
                </div>
              </div>

              {/* Integrity + Top Industries */}
              <div className="lg:col-span-1 space-y-4">
                <div className="rounded-lg border bg-card/80 p-4">
                  <h3 className="text-xs uppercase tracking-widest text-muted-foreground/60 mb-3 flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5" /> Data Integrity
                  </h3>
                  <div className="space-y-2">
                    {[
                      { label: 'BUILD with FL < 65', value: d.buildUnder65, ok: d.buildUnder65 === 0 },
                      { label: 'Orphan verdicts', value: d.orphanVerdicts, ok: d.orphanVerdicts === 0 },
                    ].map(check => (
                      <div key={check.label} className="flex items-center gap-2">
                        {check.ok
                          ? <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                          : <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />}
                        <span className="text-xs text-foreground">{check.label}</span>
                        <span className={cn('text-xs font-mono ml-auto', check.ok ? 'text-primary' : 'text-red-500')}>
                          {check.ok ? 'CLEAN' : check.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg border bg-card/80 p-4">
                  <h3 className="text-xs uppercase tracking-widest text-muted-foreground/60 mb-3 flex items-center gap-2">
                    <TrendingUp className="w-3.5 h-3.5" /> Top Industries
                  </h3>
                  <div className="space-y-1.5">
                    {d.topIndustries.map(ind => (
                      <div key={ind.name} className="flex items-center gap-2 text-xs">
                        <span className="text-foreground flex-1 truncate">{ind.name}</span>
                        <span className="font-mono tabular-nums text-muted-foreground">{ind.count}</span>
                        <span className="font-mono tabular-nums text-primary text-[10px]">{ind.builds}B</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Row 4: Live Feed ── */}
            <div className="rounded-lg border bg-card/80">
              <div className="px-4 py-3 border-b flex items-center justify-between">
                <h3 className="text-xs uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5" /> Live Scoring Feed
                </h3>
                <span className="text-[10px] font-mono text-muted-foreground/40">Last 15 researched ideas</span>
              </div>
              <div className="divide-y divide-border/30">
                <AnimatePresence mode="popLayout">
                  {d.recent.map(idea => {
                    const vc = VERDICT_COLORS[idea.verdict] || VERDICT_COLORS.SKIP;
                    return (
                      <motion.div
                        key={idea.id}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        className="px-4 py-2.5 flex items-center gap-3 hover:bg-muted/20 transition-colors"
                      >
                        <span className="text-lg font-mono tabular-nums font-bold w-10 text-right" style={{ color: vc }}>
                          {idea.flylabs_score}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground truncate">{idea.idea_title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-muted-foreground/50 font-mono">{idea.source}</span>
                            {idea.industry && <span className="text-[10px] text-muted-foreground/40">{idea.industry}</span>}
                          </div>
                        </div>
                        {idea.verdict && (
                          <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded" style={{ color: vc, background: vc + '15' }}>
                            {VERDICT_LABELS[idea.verdict] || idea.verdict}
                          </span>
                        )}
                        {idea.confidence && (
                          <span className={cn('text-[10px] font-mono hidden sm:inline',
                            idea.confidence === 'high' ? 'text-primary' : idea.confidence === 'medium' ? 'text-amber-500' : 'text-muted-foreground/50'
                          )}>{idea.confidence}</span>
                        )}
                        <span className="text-[10px] text-muted-foreground/40 font-mono w-16 text-right shrink-0">
                          {timeAgo(idea.updated_at)}
                        </span>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>

          </div>
        ) : null}
      </div>
    </PageLayout>
  );
}
