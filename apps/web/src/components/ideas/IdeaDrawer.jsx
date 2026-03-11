
import { useState, useEffect } from 'react';
import { ChevronUp, X, Zap, ArrowRight, Info, Archive, ExternalLink, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { timeAgo } from '@/lib/utils.js';
import { trackEvent } from '@/lib/analytics.js';
import { industries, statusConfig, verdictColors as sharedVerdictColors } from '@/lib/data/ideas.js';
import SourceBadge from '@/components/ideas/SourceBadge.jsx';

const TABS = [
  { id: 'verdict', label: 'Verdict' },
  { id: 'scores', label: 'Scores' },
  { id: 'market', label: 'Market' },
];

const getScoreTier = (score) => {
  if (score >= 75) return { label: 'Exceptional', color: 'text-primary', bg: 'bg-primary/10', bar: 'bg-primary' };
  if (score >= 60) return { label: 'Strong', color: 'text-secondary', bg: 'bg-secondary/10', bar: 'bg-secondary' };
  if (score >= 45) return { label: 'Moderate', color: 'text-amber-500', bg: 'bg-amber-500/10', bar: 'bg-amber-500' };
  if (score >= 30) return { label: 'Weak', color: 'text-orange-500', bg: 'bg-orange-500/10', bar: 'bg-orange-500' };
  return { label: 'Risky', color: 'text-red-500', bg: 'bg-red-500/10', bar: 'bg-red-500' };
};

const ScoreBar = ({ score, max, color }) => {
  const pct = max > 0 ? (score / max) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full bg-muted/50 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-medium tabular-nums text-muted-foreground w-10 text-right">{score}/{max}</span>
    </div>
  );
};

const verdictStyles = {
  BUILD: { bg: 'bg-primary/10', border: 'border-primary/30', text: 'text-primary', label: 'BUILD' },
  VALIDATE_FIRST: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-600', label: 'VALIDATE FIRST' },
  SKIP: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-500', label: 'SKIP' },
};

const confidenceColors = { high: 'text-primary', medium: 'text-amber-500', low: 'text-muted-foreground' };

// --- Tab Content Components ---

const VerdictTab = ({ idea, onVote, hasVoted, onClose }) => {
  const enrichVerdict = idea.enrichment?.verdict;
  const scoreVerdict = idea.score_breakdown?.synthesis;
  const verdict = enrichVerdict || scoreVerdict;

  if (!verdict && !idea.score_breakdown) {
    return (
      <div className="text-center py-8">
        <Zap className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground font-medium">Scores and verdict pending. New ideas are scored daily.</p>
      </div>
    );
  }

  const rec = enrichVerdict?.recommendation || scoreVerdict?.verdict;
  const oneLiner = scoreVerdict?.one_liner;
  const compositeScore = scoreVerdict?.composite_score;
  const strengths = scoreVerdict?.strengths;
  const risks = scoreVerdict?.risks;
  const nextSteps = scoreVerdict?.next_steps;
  const reasoning = enrichVerdict?.reasoning || scoreVerdict?.reasoning;
  const confidence = enrichVerdict?.confidence;
  const vs = verdictStyles[rec] || verdictStyles.VALIDATE_FIRST;

  return (
    <div className="space-y-6">
      {/* Description */}
      {idea.idea_description && idea.idea_description !== idea.idea_title && (
        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{idea.idea_description}</p>
      )}

      {/* Verdict Hero */}
      {verdict && (
        <div className={`rounded-xl border ${vs.border} ${vs.bg} p-5 space-y-3`}>
          <p className="text-[11px] text-muted-foreground/60 font-medium">Based on 4 AI frameworks + real market evidence</p>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className={`text-xl font-black ${vs.text}`}>{vs.label}</span>
            {compositeScore != null && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground/60">Composite</span>
                <span className={`text-lg font-black tabular-nums ${vs.text}`}>{compositeScore}</span>
                <span className="text-xs text-muted-foreground/60">/100</span>
              </div>
            )}
          </div>
          {oneLiner && <p className="text-sm text-foreground font-medium">{oneLiner}</p>}
          {reasoning && <p className="text-sm text-muted-foreground italic">{reasoning}</p>}
          {/* Distribution insight from Okamoto */}
          {(() => {
            const distChannel = idea.score_breakdown?.okamoto?.distribution_channel;
            if (!distChannel?.reasoning) return null;
            const distScore = distChannel.score || 0;
            const distColor = distScore >= 15 ? 'text-primary' : distScore >= 8 ? 'text-amber-500' : 'text-red-500';
            return (
              <p className={`text-xs ${distColor}`}>
                <span className="font-medium">Distribution:</span> {distChannel.reasoning}
              </p>
            );
          })()}
          {confidence && (
            <span className={`text-xs font-medium ${confidenceColors[confidence] || confidenceColors.medium}`}>
              {confidence} confidence{enrichVerdict ? ' (market-validated)' : ''}
            </span>
          )}
          {strengths?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {strengths.map((s, i) => (
                <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{s}</span>
              ))}
            </div>
          )}
          {risks?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {risks.map((r, i) => (
                <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-500">{r}</span>
              ))}
            </div>
          )}
          {nextSteps?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground/60 mb-1.5">Next Steps</p>
              <ol className="space-y-1">
                {nextSteps.map((step, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-xs font-bold text-foreground/50 mt-0.5 shrink-0">{i + 1}.</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}

      {/* YC Graveyard Context */}
      {idea.source === 'yc' && idea.meta?.failure_analysis && (() => {
        const fa = idea.meta.failure_analysis;
        return (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Archive className="w-4 h-4 text-amber-600" />
              <h4 className="font-bold text-amber-600 text-sm">YC Graveyard</h4>
            </div>
            {fa.original_one_liner && (
              <p className="text-sm text-muted-foreground italic">"{fa.original_one_liner}"</p>
            )}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70 flex-wrap">
              {fa.company_name && <span className="font-medium text-foreground">{fa.company_name}</span>}
              {fa.batch && (
                <>
                  <span className="text-muted-foreground/40">&middot;</span>
                  <span>{fa.batch}</span>
                </>
              )}
              {fa.team_size && (
                <>
                  <span className="text-muted-foreground/40">&middot;</span>
                  <span>{fa.team_size} people</span>
                </>
              )}
            </div>
            <div className="space-y-2">
              {fa.failure_reason && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground/60 mb-0.5">Why it failed</p>
                  <p className="text-sm text-muted-foreground">{fa.failure_reason}</p>
                </div>
              )}
              {fa.what_changed && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground/60 mb-0.5">What's different now</p>
                  <p className="text-sm text-muted-foreground">{fa.what_changed}</p>
                </div>
              )}
              {fa.rebuild_angle && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground/60 mb-0.5">Rebuild angle</p>
                  <p className="text-sm text-muted-foreground">{fa.rebuild_angle}</p>
                </div>
              )}
            </div>
            {fa.company_name && (
              <a
                href={`https://startups.rip/company/${fa.company_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackEvent('outbound_click', { link_url: 'startups.rip', link_label: `${fa.company_name} post-mortem`, location: 'idea_drawer_yc' })}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 hover:underline transition-colors pt-1"
              >
                Read full post-mortem on startups.rip <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        );
      })()}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2 border-t border-border">
        <button
          onClick={() => onVote(idea.id)}
          disabled={hasVoted}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            hasVoted
              ? 'bg-primary/10 text-primary cursor-default'
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          }`}
        >
          <ChevronUp className="w-4 h-4" />
          {hasVoted ? 'Voted' : 'Vote'}
          <span className="tabular-nums">{idea.votes || 0}</span>
        </button>
        {idea.source !== 'community' && idea.source_url && (
          <a
            href={idea.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
            onClick={() => trackEvent('outbound_click', { link_url: idea.source_url, link_label: `${idea.source} Detail`, location: 'ideas_drawer' })}
          >
            <SourceBadge source={idea.source} sourceUrl={idea.source_url} tags={idea.tags} name={idea.name} location="ideas_drawer" />
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  );
};

const FRAMEWORK_CONFIG = [
  {
    key: 'flylabs',
    name: 'Fly Labs Method',
    color: 'text-indigo-500',
    barColor: 'bg-indigo-500',
    pillars: [
      { key: 'problem_clarity', label: 'Problem Clarity' },
      { key: 'solution_gap', label: 'Solution Gap' },
      { key: 'willingness', label: 'Willingness to Act' },
      { key: 'buildability', label: 'Buildability' },
    ],
  },
  {
    key: 'hormozi',
    name: 'Hormozi Score',
    color: 'text-foreground',
    pillars: [
      { key: 'market_viability', label: 'Market Viability' },
      { key: 'value_equation', label: 'Value Equation' },
      { key: 'market_growth', label: 'Market Growth & Timing' },
      { key: 'differentiation', label: 'Offer Differentiation' },
      { key: 'feasibility', label: 'Execution Feasibility' },
    ],
  },
  {
    key: 'koe',
    name: 'Dan Koe Score',
    color: 'text-foreground',
    pillars: [
      { key: 'problem_clarity', label: 'Problem Clarity' },
      { key: 'creator_fit', label: 'Creator Fit' },
      { key: 'audience_reach', label: 'Audience Reach' },
      { key: 'simplicity', label: 'Simplicity' },
      { key: 'monetization', label: 'Monetization' },
      { key: 'anti_niche', label: 'Anti-Niche POV' },
      { key: 'leverage', label: 'Leverage Potential' },
    ],
  },
  {
    key: 'okamoto',
    name: 'Okamoto Score',
    color: 'text-foreground',
    pillars: [
      { key: 'target_audience', label: 'Target Audience' },
      { key: 'value_proposition', label: 'Value Proposition' },
      { key: 'distribution_channel', label: 'Distribution Channel' },
      { key: 'business_model', label: 'Business Model' },
      { key: 'assumption_risk', label: 'Assumption Risk' },
      { key: 'validation_readiness', label: 'Validation Readiness' },
    ],
  },
];

const ScoresTab = ({ idea, onClose }) => {
  const [expanded, setExpanded] = useState({});

  const frameworks = FRAMEWORK_CONFIG
    .map((cfg) => {
      const data = idea.score_breakdown?.[cfg.key];
      if (!data) return null;
      const tier = getScoreTier(data.total);
      return { ...cfg, data, tier };
    })
    .filter(Boolean);

  if (frameworks.length === 0) {
    return (
      <div className="text-center py-8">
        <Zap className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground font-medium">Scores pending. New ideas are scored daily.</p>
      </div>
    );
  }

  const toggleExpanded = (key) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-3">
      {frameworks.map((fw) => {
        const isOpen = expanded[fw.key];
        const barColor = fw.barColor || fw.tier.bar;

        return (
          <div key={fw.key} className="border border-border/60 rounded-xl overflow-hidden">
            {/* Clickable row */}
            <button
              onClick={() => toggleExpanded(fw.key)}
              className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/30 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-sm font-bold ${fw.color}`}>{fw.name}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${fw.tier.bg} ${fw.tier.color}`}>{fw.tier.label}</span>
                </div>
                {fw.data.summary && (
                  <p className="text-xs text-muted-foreground line-clamp-1">{fw.data.summary}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-xl font-black tabular-nums ${fw.key === 'flylabs' ? 'text-indigo-500' : fw.tier.color}`}>{fw.data.total}</span>
                <span className="text-xs text-muted-foreground/60">/100</span>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {/* Expandable detail */}
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 space-y-3 border-t border-border/40 pt-3">
                    {fw.data.reasoning && (
                      <p className="text-xs text-muted-foreground">{fw.data.reasoning}</p>
                    )}
                    {fw.pillars.map((pillar) => {
                      const p = fw.data[pillar.key];
                      if (!p) return null;
                      return (
                        <div key={pillar.key}>
                          <span className="text-sm font-medium">{pillar.label}</span>
                          <ScoreBar score={p.score || 0} max={p.max || 100} color={barColor} />
                          {p.reasoning && <p className="text-xs text-muted-foreground mt-1">{p.reasoning}</p>}
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      {/* How scoring works */}
      <details className="group mt-4">
        <summary className="flex items-center gap-2 cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          <Info className="w-4 h-4" />
          How are these scores calculated?
        </summary>
        <div className="mt-3 space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>
            Each idea is scored by <strong className="text-foreground">4 AI frameworks</strong>: Fly Labs Method (40% weight),
            Hormozi (20%), Dan Koe (20%), and Okamoto (20%). The composite score synthesizes all four into a
            BUILD / VALIDATE FIRST / SKIP verdict.
          </p>
          <p className="text-muted-foreground/60">
            All scores and reasoning are generated by Claude AI analyzing the problem description,
            industry context, and market signals.
          </p>
          <Link to="/scoring" className="inline-flex items-center gap-1 text-accent hover:underline font-medium" onClick={onClose}>
            Full framework breakdown <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </details>
    </div>
  );
};

const MarketTab = ({ idea }) => {
  const validation = idea.enrichment?.validation;
  const competitors = idea.enrichment?.competitors;

  if (!validation && !competitors) {
    return (
      <div className="text-center py-8">
        <Zap className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground font-medium mb-2">Market validation pending.</p>
        <p className="text-xs text-muted-foreground/60">Top-scoring ideas are validated daily against real conversations on X and Reddit.</p>
      </div>
    );
  }

  const relevanceDot = { high: 'bg-primary', medium: 'bg-yellow-500', low: 'bg-muted-foreground/40' };

  return (
    <div className="space-y-6">
      {/* Market Validation */}
      {validation && (() => {
        const v = validation;
        const tier = getScoreTier(v.strength);
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold">Market Validation</h4>
              <div className="flex items-center gap-2">
                <span className={`text-2xl font-black tabular-nums ${tier.color}`}>{v.strength}</span>
                <span className="text-xs text-muted-foreground/60">/100</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${tier.bg} ${tier.color}`}>{tier.label}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {v.confidence && (
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  v.confidence === 'high' ? 'bg-primary/10 text-primary' :
                  v.confidence === 'medium' ? 'bg-amber-500/10 text-amber-500' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {v.confidence} confidence
                </span>
              )}
              {v.evidence_count && (
                <span className="text-xs text-muted-foreground/60">
                  ({v.evidence_count.total} sources: {v.evidence_count.x_tweets} tweets, {v.evidence_count.reddit_posts} posts)
                </span>
              )}
            </div>

            {v.evidence_summary && (
              <p className="text-sm text-muted-foreground italic">"{v.evidence_summary}"</p>
            )}

            {v.frustration_language?.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground/60 mb-2">Frustration Language</p>
                <div className="flex flex-wrap gap-1.5">
                  {v.frustration_language.map((phrase, i) => (
                    <span key={i} className="bg-yellow-500/10 text-yellow-600 text-xs rounded-full px-2 py-0.5">{phrase}</span>
                  ))}
                </div>
              </div>
            )}

            {v.communities?.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground/60 mb-2">Active Communities</p>
                <div className="space-y-1.5">
                  {v.communities.map((c, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className={`w-2 h-2 rounded-full ${relevanceDot[c.relevance] || relevanceDot.low}`} />
                      <span className="font-medium">{c.subreddit}</span>
                      <span className="text-muted-foreground/60 text-xs">{c.post_count} posts</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {v.recurring_themes?.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground/60 mb-2">Recurring Themes</p>
                <ul className="space-y-1">
                  {v.recurring_themes.map((t, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-muted-foreground/40 shrink-0" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {v.unmet_needs?.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground/60 mb-2">Unmet Needs</p>
                <ul className="space-y-1">
                  {v.unmet_needs.map((n, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-yellow-500 shrink-0" />
                      {n}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      })()}

      {/* Competitive Landscape */}
      {competitors && (() => {
        const c = competitors;
        return (
          <div className="space-y-4">
            <h4 className="font-bold">Competitive Landscape</h4>
            <p className="text-xs text-muted-foreground">Competitors identified from real conversations on X and Reddit.</p>

            {c.products?.length > 0 && (
              <div className="space-y-3">
                {c.products.map((p, i) => (
                  <div key={i} className="border-l-2 border-yellow-500 pl-3 space-y-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 min-w-0">
                      <span className="text-sm font-bold truncate">{p.name}</span>
                      {p.pricing && <span className="text-xs text-muted-foreground">{p.pricing}</span>}
                    </div>
                    {p.positioning && <p className="text-xs text-muted-foreground">{p.positioning}</p>}
                    {p.top_complaints?.length > 0 && (
                      <ul className="space-y-0.5">
                        {p.top_complaints.map((complaint, j) => (
                          <li key={j} className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-red-500 shrink-0" />
                            {complaint}
                          </li>
                        ))}
                      </ul>
                    )}
                    {p.gap && <p className="text-xs text-yellow-600 font-medium">Gap: {p.gap}</p>}
                  </div>
                ))}
              </div>
            )}

            {c.market_gap && <p className="text-sm font-bold text-foreground">{c.market_gap}</p>}
            {c.pricing_opportunity && <p className="text-sm text-muted-foreground">{c.pricing_opportunity}</p>}
            {c.differentiation_angle && <p className="text-sm text-muted-foreground">{c.differentiation_angle}</p>}
          </div>
        );
      })()}

      {/* Validation summary */}
      {idea.enrichment?.summary && (
        <p className="text-sm text-muted-foreground italic border-l-2 border-yellow-500 pl-3">
          {idea.enrichment.summary}
        </p>
      )}
    </div>
  );
};

// --- Shared header + tabs ---

const DrawerHeader = ({ idea, activeTab, setActiveTab, onClose }) => {
  const showStatus = idea.source === 'reddit'
    ? false
    : idea.status === 'building' || idea.status === 'shipped';
  const status = statusConfig[idea.status] || statusConfig.open;

  return (
    <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b border-border">
      <div className="flex items-start justify-between p-4 pb-2">
        <h2 className="text-lg font-bold leading-snug pr-2">{idea.idea_title}</h2>
        <button
          onClick={onClose}
          className="p-3 rounded-lg hover:bg-muted text-muted-foreground transition-colors shrink-0 -mt-1 -mr-1"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="px-4 pb-2">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70 flex-wrap">
          <span>
            <SourceBadge source={idea.source} sourceUrl={idea.source_url} tags={idea.tags} name={idea.name} location="ideas_drawer" />
          </span>
          <span className="text-muted-foreground/40">&middot;</span>
          <span>{timeAgo(idea.published_at || idea.created_at)}</span>
          {idea.industry && (
            <>
              <span className="text-muted-foreground/40">&middot;</span>
              <span>{industries.find(i => i.value === idea.industry)?.label || idea.industry}</span>
            </>
          )}
          {idea.country && (
            <>
              <span className="text-muted-foreground/40">&middot;</span>
              <span>{idea.country}</span>
            </>
          )}
          {showStatus && (
            <>
              <span className="text-muted-foreground/40">&middot;</span>
              <span>{status.label}</span>
            </>
          )}
        </div>
      </div>
      {/* Tabs */}
      <div className="flex px-4 gap-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              trackEvent('idea_drawer_tab', { tab: tab.id, idea_id: idea.id });
            }}
            className="relative px-4 py-2 text-sm font-medium transition-colors"
          >
            {activeTab === tab.id && (
              <motion.span
                layoutId="drawerTab"
                className="absolute inset-x-0 bottom-0 h-0.5 bg-primary rounded-full"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className={activeTab === tab.id ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}>
              {tab.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

// --- Main Component ---

const IdeaDrawer = ({ idea, onClose, onVote, hasVoted }) => {
  const [activeTab, setActiveTab] = useState('verdict');

  // Reset tab when idea changes
  useEffect(() => {
    setActiveTab('verdict');
  }, [idea?.id]);

  useEffect(() => {
    if (!idea) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [idea, onClose]);

  if (!idea) return null;

  const tabContent = (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.15 }}
      >
        {activeTab === 'verdict' && <VerdictTab idea={idea} onVote={onVote} hasVoted={hasVoted} onClose={onClose} />}
        {activeTab === 'scores' && <ScoresTab idea={idea} onClose={onClose} />}
        {activeTab === 'market' && <MarketTab idea={idea} />}
      </motion.div>
    </AnimatePresence>
  );

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm"
        aria-hidden="true"
      />

      {/* Mobile: bottom sheet */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border rounded-t-2xl max-h-[90vh] flex flex-col sm:hidden"
      >
        <div className="w-10 h-1 rounded-full bg-muted-foreground/20 mx-auto mt-3 mb-1 shrink-0" />
        <DrawerHeader idea={idea} activeTab={activeTab} setActiveTab={setActiveTab} onClose={onClose} />
        <div className="flex-1 overflow-y-auto p-5">
          {tabContent}
        </div>
      </motion.div>

      {/* Desktop: right-side drawer */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed top-0 right-0 bottom-0 z-50 w-full sm:max-w-xl bg-card border-l border-border shadow-2xl hidden sm:flex flex-col"
      >
        <DrawerHeader idea={idea} activeTab={activeTab} setActiveTab={setActiveTab} onClose={onClose} />
        <div className="flex-1 overflow-y-auto p-6">
          {tabContent}
        </div>
      </motion.div>
    </>
  );
};

export default IdeaDrawer;
