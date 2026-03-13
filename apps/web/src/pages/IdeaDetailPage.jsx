
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronUp, ChevronLeft, ChevronDown, Zap, Loader2, ArrowRight, Info, Archive, ExternalLink, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast.js';
import { PageLayout } from '@/components/PageLayout.jsx';
import supabase from '@/lib/supabaseClient.js';
import { timeAgo } from '@/lib/utils.js';
import { trackEvent } from '@/lib/analytics.js';
import { industries, statusConfig } from '@/lib/data/ideas.js';
import { FRAMEWORK_COUNT } from '@/lib/data/siteStats.js';
import SourceBadge from '@/components/ideas/SourceBadge.jsx';
import { getScoreTier, ScoreBar, verdictStyles, confidenceColors, FRAMEWORK_CONFIG } from '@/components/ideas/ScoreUtils.jsx';

const IdeaDetailPage = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const [idea, setIdea] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [votedIds, setVotedIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('voted_ideas') || '[]'); } catch { return []; }
  });
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    let cancelled = false;
    const fetchIdea = async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const { data, error } = await supabase
          .from('ideas')
          .select('*')
          .eq('id', id)
          .single();
        if (cancelled) return;
        if (error || !data) {
          setNotFound(true);
        } else {
          setIdea(data);
        }
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchIdea();
    return () => { cancelled = true; };
  }, [id]);

  const handleVote = async (ideaId) => {
    const alreadyVoted = votedIds.includes(ideaId);

    if (alreadyVoted) {
      // Unvote: optimistic removal
      const newVotedIds = votedIds.filter(v => v !== ideaId);
      setVotedIds(newVotedIds);
      localStorage.setItem('voted_ideas', JSON.stringify(newVotedIds));
      setIdea(prev => prev ? { ...prev, votes: Math.max((prev.votes || 0) - 1, 0) } : prev);
      trackEvent('idea_unvoted', { idea_id: ideaId, idea_title: idea?.idea_title, category: idea?.category });
      const { error } = await supabase.rpc('decrement_vote', { idea_id: ideaId });
      if (error) {
        setVotedIds(prev => [...prev, ideaId]);
        localStorage.setItem('voted_ideas', JSON.stringify(votedIds));
        setIdea(prev => prev ? { ...prev, votes: (prev.votes || 0) + 1 } : prev);
      }
    } else {
      // Vote: optimistic add
      const newVotedIds = [...votedIds, ideaId];
      setVotedIds(newVotedIds);
      localStorage.setItem('voted_ideas', JSON.stringify(newVotedIds));
      setIdea(prev => prev ? { ...prev, votes: (prev.votes || 0) + 1 } : prev);
      trackEvent('idea_voted', { idea_id: ideaId, idea_title: idea?.idea_title, category: idea?.category });
      const { error } = await supabase.rpc('increment_vote', { idea_id: ideaId });
      if (error) {
        setVotedIds(prev => prev.filter(v => v !== ideaId));
        localStorage.setItem('voted_ideas', JSON.stringify(votedIds));
        setIdea(prev => prev ? { ...prev, votes: (prev.votes || 0) - 1 } : prev);
      }
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({ title: 'Link copied', description: 'Share this idea with anyone.' });
    trackEvent('idea_shared', { idea_id: idea?.id, idea_title: idea?.idea_title });
  };

  if (loading) {
    return (
      <PageLayout seo={{ title: 'Loading - Idea Lab', noindex: true }}>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </PageLayout>
    );
  }

  if (notFound || !idea) {
    return (
      <PageLayout seo={{ title: 'Idea not found - Idea Lab', noindex: true }}>
        <div className="container mx-auto px-6 pt-32 pb-20">
          <div className="max-w-3xl mx-auto text-center py-20">
            <Zap className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-lg font-medium text-muted-foreground mb-4">This idea doesn't exist or has been removed.</p>
            <Link to="/ideas" className="inline-flex items-center gap-2 text-primary font-medium hover:underline">
              <ChevronLeft className="w-4 h-4" /> Back to Idea Lab
            </Link>
          </div>
        </div>
      </PageLayout>
    );
  }

  const hasVoted = votedIds.includes(idea.id);
  const showStatus = idea.source === 'reddit' ? false : idea.status === 'building' || idea.status === 'shipped';
  const status = statusConfig[idea.status] || statusConfig.open;
  const synthesis = idea.score_breakdown?.synthesis;
  const enrichVerdict = idea.enrichment?.verdict;
  const scoreVerdict = synthesis;
  const activeVerdict = enrichVerdict || scoreVerdict;
  const rec = enrichVerdict?.recommendation || scoreVerdict?.verdict;
  const vs = verdictStyles[rec] || verdictStyles.VALIDATE_FIRST;

  const frameworks = FRAMEWORK_CONFIG
    .map((cfg) => {
      const data = idea.score_breakdown?.[cfg.key];
      if (!data) return null;
      const tier = getScoreTier(data.total);
      return { ...cfg, data, tier };
    })
    .filter(Boolean);

  const validation = idea.enrichment?.validation;
  const competitors = idea.enrichment?.competitors;
  const relevanceDot = { high: 'bg-primary', medium: 'bg-yellow-500', low: 'bg-muted-foreground/40' };

  const toggleExpanded = (key) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <PageLayout
      seo={{
        title: `${idea.idea_title} - Idea Lab`,
        description: synthesis?.one_liner || idea.idea_description || 'AI-scored idea analysis on Fly Labs',
        url: `https://flylabs.fun/ideas/${idea.id}`,
        schema: [
          {
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://flylabs.fun" },
              { "@type": "ListItem", position: 2, name: "Idea Lab", item: "https://flylabs.fun/ideas" },
              { "@type": "ListItem", position: 3, name: idea.idea_title },
            ],
          },
          {
            "@type": "Article",
            headline: idea.idea_title,
            description: synthesis?.one_liner || idea.idea_description,
            datePublished: idea.published_at || idea.created_at,
          },
        ],
      }}
      className="pt-32 pb-28 sm:pb-20"
    >
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto space-y-8">

          {/* Back link */}
          <Link to="/ideas" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back to Idea Lab
          </Link>

          {/* Hero */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-black leading-tight mb-3">{idea.idea_title}</h1>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70 flex-wrap">
              <span>
                <SourceBadge source={idea.source} sourceUrl={idea.source_url} tags={idea.tags} name={idea.name} location="idea_detail" />
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
            {idea.idea_description && idea.idea_description !== idea.idea_title && (
              <p className="text-sm text-muted-foreground leading-relaxed mt-3 whitespace-pre-wrap">{idea.idea_description}</p>
            )}
          </div>

          {/* Action bar - desktop */}
          <div className="hidden sm:flex items-center gap-3">
            <button
              onClick={() => handleVote(idea.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                hasVoted
                  ? 'bg-primary/10 text-primary'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
              }`}
            >
              <ChevronUp className="w-4 h-4" />
              {hasVoted ? 'Voted' : 'Vote'}
              <span className="tabular-nums">{idea.votes || 0}</span>
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
            >
              <Share2 className="w-4 h-4" /> Share
            </button>
            {idea.source !== 'community' && idea.source_url && (
              <a
                href={idea.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
                onClick={() => trackEvent('outbound_click', { link_url: idea.source_url, link_label: `${idea.source} source`, location: 'idea_detail' })}
              >
                View source <ArrowRight className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          {/* ─── Verdict ─── */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">Verdict</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            {!activeVerdict && !idea.score_breakdown ? (
              <div className="text-center py-8">
                <Zap className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground font-medium">Scores and verdict pending. New ideas are scored daily.</p>
              </div>
            ) : (
              <div className={`rounded-xl border ${vs.border} ${vs.bg} p-5 space-y-3`}>
                <p className="text-[11px] text-muted-foreground/60 font-medium">Based on {FRAMEWORK_COUNT} AI frameworks + real market evidence</p>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className={`text-xl font-black ${vs.text}`}>{vs.label}</span>
                  {synthesis?.composite_score != null && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground/60">Composite</span>
                      <span className={`text-lg font-black tabular-nums ${vs.text}`}>{synthesis.composite_score}</span>
                      <span className="text-xs text-muted-foreground/60">/100</span>
                    </div>
                  )}
                </div>
                {synthesis?.one_liner && <p className="text-sm text-foreground font-medium">{synthesis.one_liner}</p>}
                {(enrichVerdict?.reasoning || synthesis?.reasoning) && (
                  <p className="text-sm text-muted-foreground italic">{enrichVerdict?.reasoning || synthesis?.reasoning}</p>
                )}
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
                {enrichVerdict?.confidence && (
                  <span className={`text-xs font-medium ${confidenceColors[enrichVerdict.confidence] || confidenceColors.medium}`}>
                    {enrichVerdict.confidence} confidence (market-validated)
                  </span>
                )}
                {synthesis?.strengths?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {synthesis.strengths.map((s, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{s}</span>
                    ))}
                  </div>
                )}
                {synthesis?.risks?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {synthesis.risks.map((r, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-500">{r}</span>
                    ))}
                  </div>
                )}
                {synthesis?.next_steps?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground/60 mb-1.5">Next Steps</p>
                    <ol className="space-y-1">
                      {synthesis.next_steps.map((step, i) => (
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
          </section>

          {/* ─── YC Graveyard ─── */}
          {idea.source === 'yc' && idea.meta?.failure_analysis && (() => {
            const fa = idea.meta.failure_analysis;
            return (
              <section>
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
                      onClick={() => trackEvent('outbound_click', { link_url: 'startups.rip', link_label: `${fa.company_name} post-mortem`, location: 'idea_detail' })}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 hover:underline transition-colors pt-1"
                    >
                      Read full post-mortem on startups.rip <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </section>
            );
          })()}

          {/* ─── Scoring Breakdown ─── */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">Scoring Breakdown</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            {frameworks.length === 0 ? (
              <div className="text-center py-8">
                <Zap className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground font-medium">Scores pending. New ideas are scored daily.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {frameworks.map((fw) => {
                  const isOpen = expanded[fw.key];
                  const barColor = fw.barColor || fw.tier.bar;

                  return (
                    <div key={fw.key} className="border border-border/60 rounded-xl overflow-hidden">
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

                <details className="group mt-4">
                  <summary className="flex items-center gap-2 cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                    <Info className="w-4 h-4" />
                    How are these scores calculated?
                  </summary>
                  <div className="mt-3 space-y-3 text-sm text-muted-foreground leading-relaxed">
                    <p>
                      Each idea is scored by <strong className="text-foreground">{FRAMEWORK_COUNT} AI frameworks</strong> that weigh problem quality,
                      monetization potential, audience fit, and solo-builder viability. The composite score synthesizes into a
                      BUILD / VALIDATE / SKIP verdict.
                    </p>
                    <p className="text-muted-foreground/60">
                      All scores and reasoning are generated by Claude AI analyzing the problem description,
                      industry context, and market signals.
                    </p>
                    <Link to="/scoring" className="inline-flex items-center gap-1 text-accent hover:underline font-medium">
                      Full framework breakdown <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </details>
              </div>
            )}
          </section>

          {/* ─── Market Evidence ─── */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">Market Evidence</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            {!validation && !competitors ? (
              <div className="text-center py-8">
                <Zap className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground font-medium mb-2">Market validation pending.</p>
                <p className="text-xs text-muted-foreground/60">Top-scoring ideas are validated daily against real conversations on X and Reddit.</p>
              </div>
            ) : (
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
            )}
          </section>

        </div>
      </div>

      {/* Mobile sticky action bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 sm:hidden border-t border-border bg-background/80 backdrop-blur-md px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleVote(idea.id)}
            className={`flex-1 flex items-center justify-center gap-2 h-11 rounded-lg text-sm font-medium transition-colors ${
              hasVoted
                ? 'bg-primary/10 text-primary'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            }`}
          >
            <ChevronUp className="w-4 h-4" />
            {hasVoted ? 'Voted' : 'Vote'}
            <span className="tabular-nums">{idea.votes || 0}</span>
          </button>
          <button
            onClick={handleShare}
            className="flex items-center justify-center gap-2 h-11 px-4 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
          >
            <Share2 className="w-4 h-4" /> Share
          </button>
        </div>
      </div>
    </PageLayout>
  );
};

export default IdeaDetailPage;
