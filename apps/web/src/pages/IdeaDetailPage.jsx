
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronUp, ChevronLeft, ChevronDown, Zap, Loader2, ArrowRight, Info, Archive, ExternalLink, Share2, AlertTriangle, Sparkles, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast.js';
import { PageLayout } from '@/components/PageLayout.jsx';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useChatContext } from '@/contexts/ChatContext.jsx';
import supabase from '@/lib/supabaseClient.js';
import { timeAgo } from '@/lib/utils.js';
import { trackEvent } from '@/lib/analytics.js';
import { industries, statusConfig } from '@/lib/data/ideas.js';
import SourceBadge from '@/components/ideas/SourceBadge.jsx';
import { getScoreTier, ScoreBar, verdictStyles, confidenceColors, FL_PILLARS, EXPERT_CONFIG } from '@/components/ideas/ScoreUtils.jsx';
import { GatedOverlay } from '@/components/GatedOverlay.jsx';

const IdeaDetailPage = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const { openWidget } = useChatContext();
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

  const handleShare = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(window.location.href);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = window.location.href;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      toast({ title: 'Link copied', description: 'Share this idea with anyone.' });
      trackEvent('idea_shared', { idea_id: idea?.id, idea_title: idea?.idea_title });
    } catch {
      toast({ title: 'Copy failed', description: 'Could not copy to clipboard.', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <PageLayout seo={{ title: 'Loading - Ideas Lab', noindex: true }}>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </PageLayout>
    );
  }

  if (notFound || !idea) {
    return (
      <PageLayout seo={{ title: 'Idea not found - Ideas Lab', noindex: true }}>
        <div className="container mx-auto px-6 pt-32 pb-20">
          <div className="max-w-3xl mx-auto text-center py-20">
            <Zap className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-lg font-medium text-muted-foreground mb-4">This idea doesn't exist or has been removed.</p>
            <Link to="/ideas" className="inline-flex items-center gap-2 text-primary font-medium hover:underline">
              <ChevronLeft className="w-4 h-4" /> Back to Ideas Lab
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
  const rec = enrichVerdict?.recommendation || scoreVerdict?.verdict;
  const vs = verdictStyles[rec] || verdictStyles.VALIDATE_FIRST;

  const flData = idea.score_breakdown?.flylabs;
  const flTier = flData ? getScoreTier(flData.total) : null;

  const validation = idea.enrichment?.validation;
  const competitors = idea.enrichment?.competitors;
  const relevanceDot = { high: 'bg-primary', medium: 'bg-amber-500', low: 'bg-muted-foreground/40' };

  const toggleExpanded = (key) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <PageLayout
      seo={{
        title: `${idea.idea_title} - Ideas Lab`,
        description: synthesis?.one_liner || idea.idea_description || 'AI-scored idea analysis on Fly Labs',
        url: `https://flylabs.fun/ideas/${idea.id}`,
        schema: [
          {
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://flylabs.fun" },
              { "@type": "ListItem", position: 2, name: "Ideas Lab", item: "https://flylabs.fun/ideas" },
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
            <ChevronLeft className="w-4 h-4" /> Back to Ideas Lab
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
            <button
              onClick={() => {
                openWidget();
                trackEvent('cta_click', { cta: 'flybot_from_idea_detail', location: 'idea_detail' });
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-primary/30 bg-primary/5 text-sm font-medium text-primary hover:bg-primary/10 transition-colors ml-auto"
            >
              <Bot className="w-4 h-4" /> Ask FlyBot
            </button>
          </div>

          {isAuthenticated ? (
          <>
          {/* ─── Quick Read ─── */}
          {(() => {
            const thePain = synthesis?.the_pain || synthesis?.one_liner || idea.idea_description || flData?.problem_clarity?.reasoning;
            const theGap = synthesis?.the_gap || flData?.solution_gap?.reasoning || competitors?.market_gap;
            const buildAngle = synthesis?.build_angle || competitors?.differentiation_angle || synthesis?.next_steps?.[0] || flData?.buildability?.reasoning;
            const hasQuickRead = thePain || theGap || buildAngle;

            if (!hasQuickRead) return null;

            return (
              <section className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">Quick Read</span>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  {thePain && (
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-red-500">The Pain</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">{thePain}</p>
                    </div>
                  )}
                  {theGap && (
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-amber-500">The Gap</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">{theGap}</p>
                    </div>
                  )}
                  {buildAngle && (
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-primary">What to Build</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">{buildAngle}</p>
                    </div>
                  )}
                </div>
              </section>
            );
          })()}

          {/* ─── The Score ─── */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">The Score</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            {!flData && !synthesis ? (
              <div className="text-center py-8">
                <Zap className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground font-medium">Score pending. New ideas are scored daily.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Verdict box */}
                <div className={`rounded-xl border ${vs.border} ${vs.bg} p-5 space-y-3`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className={`text-xl font-black ${vs.text}`}>{vs.label}</span>
                      {(enrichVerdict?.confidence || idea.confidence) && (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${confidenceColors[enrichVerdict?.confidence || idea.confidence] || confidenceColors.medium}`}>
                          {enrichVerdict?.confidence || idea.confidence} confidence
                        </span>
                      )}
                    </div>
                    {flData && (
                      <div className="flex items-center gap-2">
                        <span className={`text-3xl font-black tabular-nums ${flTier?.color || 'text-foreground'}`}>{flData.total}</span>
                        <span className="text-xs text-muted-foreground/60">/100</span>
                      </div>
                    )}
                  </div>
                  {(enrichVerdict?.reasoning || synthesis?.reasoning) && (
                    <p className="text-sm text-muted-foreground">{enrichVerdict?.reasoning || synthesis?.reasoning}</p>
                  )}
                  {/* Competitor warning badge */}
                  {(() => {
                    const compCount = idea.enrichment?.competitors?.competitor_count || idea.enrichment?.competitors?.products?.length;
                    if (compCount == null) return null;
                    if (compCount >= 5) {
                      return (
                        <div className="flex items-center gap-2 text-xs font-medium text-amber-500">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Crowded market: {compCount} known competitors
                        </div>
                      );
                    }
                    if (compCount <= 1) {
                      return (
                        <div className="flex items-center gap-2 text-xs font-medium text-primary">
                          <Sparkles className="w-3.5 h-3.5" />
                          Underserved market
                        </div>
                      );
                    }
                    return null;
                  })()}
                  {synthesis?.saturation_capped && (
                    <p className="text-xs text-amber-500/80">Score capped due to market saturation. Real problem, crowded space.</p>
                  )}
                </div>

                {/* FL Method pillars */}
                {flData && (
                  <div className="border border-border/60 rounded-xl overflow-hidden">
                    <button
                      onClick={() => toggleExpanded('flylabs')}
                      className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-indigo-500">Fly Labs Method</span>
                          <span className="text-[10px] font-medium text-muted-foreground/50">4 questions, one score</span>
                        </div>
                        {flData.summary && (
                          <p className="text-xs text-muted-foreground line-clamp-1">{flData.summary}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xl font-black tabular-nums text-indigo-500">{flData.total}</span>
                        <span className="text-xs text-muted-foreground/60">/100</span>
                        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${expanded.flylabs ? 'rotate-180' : ''}`} />
                      </div>
                    </button>

                    <AnimatePresence>
                      {expanded.flylabs && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 space-y-3 border-t border-border/40 pt-3">
                            {flData.reasoning && (
                              <p className="text-xs text-muted-foreground">{flData.reasoning}</p>
                            )}
                            {FL_PILLARS.map((pillar) => {
                              const p = flData[pillar.key];
                              if (!p) return null;
                              return (
                                <div key={pillar.key}>
                                  <span className="text-sm font-medium">{pillar.label}</span>
                                  <ScoreBar score={p.score || 0} max={p.max || 100} color="bg-indigo-500" />
                                  {p.reasoning && <p className="text-xs text-muted-foreground mt-1">{p.reasoning}</p>}
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Strengths & Risks */}
                {(synthesis?.strengths?.length > 0 || synthesis?.risks?.length > 0) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {synthesis?.strengths?.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-xs font-medium text-muted-foreground/60">Strengths</p>
                        <div className="flex flex-wrap gap-1.5">
                          {synthesis.strengths.map((s, i) => (
                            <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {synthesis?.risks?.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-xs font-medium text-muted-foreground/60">Risks</p>
                        <div className="flex flex-wrap gap-1.5">
                          {synthesis.risks.map((r, i) => (
                            <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-500">{r}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Next Steps */}
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

                {/* DYOR note */}
                <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30 border border-border/40">
                  <Info className="w-4 h-4 text-muted-foreground/40 mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground/60 leading-relaxed">
                    AI-generated scores and analysis. Always do your own research before building.
                    {' '}<Link to="/scoring" className="text-accent hover:underline font-medium">How scoring works</Link>
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* ─── YC Graveyard ─── */}
          {idea.source === 'yc' && idea.meta?.failure_analysis && (() => {
            const fa = idea.meta.failure_analysis;
            return (
              <section>
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <Archive className="w-4 h-4 text-amber-500" />
                    <h4 className="font-bold text-amber-500 text-sm">YC Graveyard</h4>
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
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-500 hover:underline transition-colors pt-1"
                    >
                      Read full post-mortem on startups.rip <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </section>
            );
          })()}

          {/* ─── Expert Perspectives ─── */}
          {EXPERT_CONFIG.some(e => idea.score_breakdown?.[e.key]) && (
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">Expert Perspectives</span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <p className="text-xs text-muted-foreground/50 mb-3">
                Three AI perspectives inspired by different business thinkers. These scores are for context only and do not affect the verdict.
              </p>

              <div className="space-y-3">
                {EXPERT_CONFIG.map((expert) => {
                  const data = idea.score_breakdown?.[expert.key];
                  if (!data) return null;
                  const tier = getScoreTier(data.total);
                  const isOpen = expanded[expert.key];

                  return (
                    <div key={expert.key} className="border border-border/40 rounded-xl overflow-hidden opacity-80 hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => toggleExpanded(expert.key)}
                        className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-bold text-foreground">{expert.name}</span>
                            <span className="text-[10px] text-muted-foreground/50 italic">{expert.question}</span>
                          </div>
                          {data.summary && (
                            <p className="text-xs text-muted-foreground line-clamp-1">{data.summary}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-lg font-black tabular-nums ${tier.color}`}>{data.total}</span>
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
                              {data.reasoning && (
                                <p className="text-xs text-muted-foreground">{data.reasoning}</p>
                              )}
                              {expert.pillars.map((pillar) => {
                                const p = data[pillar.key];
                                if (!p) return null;
                                return (
                                  <div key={pillar.key}>
                                    <span className="text-sm font-medium">{pillar.label}</span>
                                    <ScoreBar score={p.score || 0} max={p.max || 100} color="bg-foreground/30" />
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
              </div>
            </section>
          )}

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
                        <h4 className="font-bold">Real-World Signals</h4>
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
                          <p className="text-xs font-medium text-muted-foreground/60 mb-2">What people are saying</p>
                          <div className="flex flex-wrap gap-1.5">
                            {v.frustration_language.map((phrase, i) => (
                              <span key={i} className="bg-amber-500/10 text-amber-500 text-xs rounded-full px-2 py-0.5">{phrase}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {v.communities?.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground/60 mb-2">Where they talk about it</p>
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
                          <p className="text-xs font-medium text-muted-foreground/60 mb-2">What people want</p>
                          <ul className="space-y-1">
                            {v.unmet_needs.map((n, i) => (
                              <li key={i} className="text-sm text-muted-foreground flex items-center gap-1.5">
                                <span className="w-1 h-1 rounded-full bg-amber-500 shrink-0" />
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
                      <h4 className="font-bold">Who else is doing this</h4>
                      <p className="text-xs text-muted-foreground">Competitors found from real conversations on X and Reddit.</p>

                      {c.products?.length > 0 && (
                        <div className="space-y-3">
                          {c.products.map((p, i) => (
                            <div key={i} className="border-l-2 border-amber-500 pl-3 space-y-1 min-w-0">
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
                              {p.gap && <p className="text-xs text-amber-500 font-medium">Gap: {p.gap}</p>}
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
                  <p className="text-sm text-muted-foreground italic border-l-2 border-amber-500 pl-3">
                    {idea.enrichment.summary}
                  </p>
                )}
              </div>
            )}
          </section>
          </>
          ) : (
          <GatedOverlay
            title="Sign up free to see the full analysis"
            description="AI scoring, expert perspectives, and market evidence for every idea."
            location="idea_detail"
          >
            <div className="space-y-8">
              <section className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">Quick Read</span>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-red-500">The Pain</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">People are frustrated with existing solutions in this space.</p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-amber-500">The Gap</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">Current tools miss key needs that users keep asking for.</p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-primary">What to Build</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">A focused solution targeting the underserved segment.</p>
                  </div>
                </div>
              </section>
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">The Score</span>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-black text-primary">BUILD</span>
                    <div className="flex items-center gap-2">
                      <span className="text-3xl font-black tabular-nums text-indigo-500">72</span>
                      <span className="text-xs text-muted-foreground/60">/100</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">Score breakdown and expert analysis available after sign up.</p>
                </div>
              </section>
            </div>
          </GatedOverlay>
          )}

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
