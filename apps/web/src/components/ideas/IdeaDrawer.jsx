
import { ChevronUp, X, Zap, ArrowRight, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { timeAgo } from '@/lib/utils.js';
import { trackEvent } from '@/lib/analytics.js';
import { industries, statusConfig } from '@/lib/data/ideas.js';

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

const IdeaDrawer = ({ idea, onClose, onVote, hasVoted }) => {
  if (!idea) return null;

  const status = statusConfig[idea.status] || statusConfig.open;
  const subreddit = idea.source === 'reddit' && idea.tags
    ? idea.tags.split(',')[0]?.trim()
    : null;
  const showStatus = idea.source === 'reddit'
    ? false
    : idea.status === 'building' || idea.status === 'shipped';

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-lg bg-card border-l border-border shadow-2xl overflow-y-auto"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-border bg-card/95 backdrop-blur-sm">
          <h2 className="text-lg font-bold truncate">Idea Analysis</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Idea info */}
          <div>
            <h3 className="text-xl font-bold mb-2">{idea.idea_title}</h3>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70 flex-wrap mb-3">
              <span>
                {idea.source === 'problemhunt' ? (
                  <span className="text-accent font-medium">via ProblemHunt</span>
                ) : idea.source === 'reddit' ? (
                  <span className="text-red-500 font-medium">{subreddit ? `r/${subreddit}` : 'via Reddit'}</span>
                ) : (
                  `by ${idea.name || 'Anonymous'}`
                )}
              </span>
              <span className="text-muted-foreground/40">&middot;</span>
              <span>{timeAgo(idea.created_at)}</span>
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
            {idea.idea_description && idea.idea_description !== idea.idea_title && (
              <p className="text-sm text-muted-foreground leading-relaxed">{idea.idea_description}</p>
            )}
          </div>

          {/* Hormozi Score */}
          {idea.score_breakdown?.hormozi && (() => {
            const h = idea.score_breakdown.hormozi;
            const tier = getScoreTier(h.total);
            return (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold">Hormozi Score</h4>
                  <div className="flex items-center gap-2">
                    <span className={`text-2xl font-black tabular-nums ${tier.color}`}>{h.total}</span>
                    <span className="text-xs text-muted-foreground/60">/100</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${tier.bg} ${tier.color}`}>{tier.label}</span>
                  </div>
                </div>

                {h.summary && (
                  <p className="text-sm text-muted-foreground italic">"{h.summary}"</p>
                )}

                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">Market Viability</span>
                    </div>
                    <ScoreBar score={h.market_viability?.score || 0} max={h.market_viability?.max || 20} color={tier.bar} />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">Value Equation</span>
                    </div>
                    <ScoreBar score={h.value_equation?.score || 0} max={h.value_equation?.max || 25} color={tier.bar} />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">Market Growth</span>
                    </div>
                    <ScoreBar score={h.market_growth?.score || 0} max={h.market_growth?.max || 15} color={tier.bar} />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">Differentiation</span>
                    </div>
                    <ScoreBar score={h.differentiation?.score || 0} max={h.differentiation?.max || 20} color={tier.bar} />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">Feasibility</span>
                    </div>
                    <ScoreBar score={h.feasibility?.score || 0} max={h.feasibility?.max || 20} color={tier.bar} />
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Dan Koe Score */}
          {idea.score_breakdown?.koe && (() => {
            const k = idea.score_breakdown.koe;
            const tier = getScoreTier(k.total);
            return (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold">Dan Koe Score</h4>
                  <div className="flex items-center gap-2">
                    <span className={`text-2xl font-black tabular-nums ${tier.color}`}>{k.total}</span>
                    <span className="text-xs text-muted-foreground/60">/100</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${tier.bg} ${tier.color}`}>{tier.label}</span>
                  </div>
                </div>

                {k.summary && (
                  <p className="text-sm text-muted-foreground italic">"{k.summary}"</p>
                )}

                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium">Problem Clarity</span>
                    <ScoreBar score={k.problem_clarity?.score || 0} max={k.problem_clarity?.max || 25} color={tier.bar} />
                  </div>
                  <div>
                    <span className="text-sm font-medium">Creator Fit</span>
                    <ScoreBar score={k.creator_fit?.score || 0} max={k.creator_fit?.max || 20} color={tier.bar} />
                  </div>
                  <div>
                    <span className="text-sm font-medium">Audience Reach</span>
                    <ScoreBar score={k.audience_reach?.score || 0} max={k.audience_reach?.max || 15} color={tier.bar} />
                  </div>
                  <div>
                    <span className="text-sm font-medium">Simplicity</span>
                    <ScoreBar score={k.simplicity?.score || 0} max={k.simplicity?.max || 15} color={tier.bar} />
                  </div>
                  <div>
                    <span className="text-sm font-medium">Monetization</span>
                    <ScoreBar score={k.monetization?.score || 0} max={k.monetization?.max || 15} color={tier.bar} />
                  </div>
                  <div>
                    <span className="text-sm font-medium">Anti-Niche POV</span>
                    <ScoreBar score={k.anti_niche?.score || 0} max={k.anti_niche?.max || 5} color={tier.bar} />
                  </div>
                  <div>
                    <span className="text-sm font-medium">Leverage</span>
                    <ScoreBar score={k.leverage?.score || 0} max={k.leverage?.max || 5} color={tier.bar} />
                  </div>
                </div>
              </div>
            );
          })()}

          {/* No scores yet */}
          {!idea.score_breakdown && (
            <div className="text-center py-8">
              <Zap className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground font-medium">Scores pending. New ideas are scored daily.</p>
            </div>
          )}

          {/* How scoring works - collapsible */}
          <details className="group">
            <summary className="flex items-center gap-2 cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              <Info className="w-4 h-4" />
              How are these scores calculated?
            </summary>
            <div className="mt-3 space-y-3 text-sm text-muted-foreground leading-relaxed">
              <p>
                <strong className="text-foreground">Hormozi Score</strong> evaluates ideas through Alex Hormozi's $100M framework:
                market pain, value equation (dream outcome vs. effort), growth timing,
                differentiation, and execution feasibility. Great for assessing commercial viability.
              </p>
              <p>
                <strong className="text-foreground">Dan Koe Score</strong> evaluates through the one-person business lens:
                problem clarity, solo creator fit, audience reach, simplicity,
                monetization path, unique angle, and leverage potential. Great for
                assessing if a solo builder should tackle this.
              </p>
              <p className="text-muted-foreground/60">
                Both scores are generated by Claude AI analyzing the problem description,
                industry context, and market signals.
              </p>
              <Link to="/scoring" className="inline-flex items-center gap-1 text-accent hover:underline font-medium" onClick={onClose}>
                Full framework breakdown <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </details>

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
            {idea.source === 'problemhunt' && (
              <a
                href={idea.source_url || 'https://problemhunt.pro'}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-accent/20 text-sm font-medium text-accent hover:bg-accent/10 transition-colors"
                onClick={() => trackEvent('outbound_click', { link_url: idea.source_url || 'https://problemhunt.pro', link_label: 'ProblemHunt Detail', location: 'ideas_drawer' })}
              >
                via ProblemHunt <ArrowRight className="w-3.5 h-3.5" />
              </a>
            )}
            {idea.source === 'reddit' && idea.source_url && (
              <a
                href={idea.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-500/20 text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors"
                onClick={() => trackEvent('outbound_click', { link_url: idea.source_url, link_label: subreddit ? `r/${subreddit}` : 'Reddit Detail', location: 'ideas_drawer' })}
              >
                {subreddit ? `r/${subreddit}` : 'via Reddit'} <ArrowRight className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default IdeaDrawer;
