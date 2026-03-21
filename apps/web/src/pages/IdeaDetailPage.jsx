
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronUp, ChevronLeft, ChevronDown, Zap, Loader2, ArrowRight, Info, Archive, ExternalLink, Share2, AlertTriangle, Sparkles, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast.js';
import { PageLayout } from '@/components/PageLayout.jsx';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useChatContext } from '@/contexts/ChatContext.jsx';
import supabase from '@/lib/supabaseClient.js';
import { timeAgo } from '@/lib/utils.js';
import { trackEvent, trackScrollDepth } from '@/lib/analytics.js';
import { industries, statusConfig } from '@/lib/data/ideas.js';
import SourceBadge from '@/components/ideas/SourceBadge.jsx';
import { getScoreTier, ScoreBar, verdictStyles, confidenceColors, FL_PILLARS, EXPERT_CONFIG } from '@/components/ideas/ScoreUtils.jsx';
import { GatedOverlay } from '@/components/GatedOverlay.jsx';

const IdeaDetailPage = () => {
  const { id } = useParams();
  const { t } = useTranslation('ideas');
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const { openWidget, setPageDetail } = useChatContext();
  const [idea, setIdea] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [votedIds, setVotedIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('voted_ideas') || '[]'); } catch { return []; }
  });
  const [expanded, setExpanded] = useState({});

  useEffect(() => trackScrollDepth('idea_detail'), []);

  // Enrich FlyBot page context with current idea
  useEffect(() => {
    if (idea) {
      setPageDetail({
        ideaTitle: idea.idea_title,
        verdict: idea.verdict,
        score: idea.flylabs_score,
        industry: idea.industry,
        source: idea.source,
      });
    }
  }, [idea, setPageDetail]);

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
      toast({ title: t('detail.linkCopied'), description: t('detail.linkCopiedDesc') });
      trackEvent('idea_shared', { idea_id: idea?.id, idea_title: idea?.idea_title });
    } catch {
      toast({ title: t('detail.copyFailed'), description: t('detail.copyFailedDesc'), variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <PageLayout seo={{ title: t('detail.loading'), noindex: true }}>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </PageLayout>
    );
  }

  if (notFound || !idea) {
    return (
      <PageLayout seo={{ title: t('detail.notFoundTitle'), noindex: true }}>
        <div className="container mx-auto px-6 pt-32 pb-20">
          <div className="max-w-3xl mx-auto text-center py-20">
            <Zap className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-lg font-medium text-muted-foreground mb-4">{t('detail.notFoundMessage')}</p>
            <Link to="/ideas" className="inline-flex items-center gap-2 text-primary font-medium hover:underline">
              <ChevronLeft className="w-4 h-4" /> {t('detail.backToIdeas')}
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
  // Use materialized verdict column (source of truth, enforced by scoring script)
  const rec = idea.verdict || synthesis?.verdict;
  const vs = verdictStyles[rec] || verdictStyles.VALIDATE_FIRST;

  const flData = idea.score_breakdown?.flylabs;
  const flTier = flData ? getScoreTier(flData.total) : null;

  const toggleExpanded = (key) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <PageLayout
      seo={{
        title: `${idea.idea_title} - ${t('detail.ideasLabSuffix')}`,
        description: synthesis?.one_liner || idea.idea_description || t('detail.seoFallback'),
        url: `https://flylabs.fun/ideas/${idea.id}`,
        image: `/api/og?title=${encodeURIComponent(idea.idea_title)}${idea.flylabs_score != null ? `&score=${idea.flylabs_score}` : ''}${idea.verdict ? `&verdict=${idea.verdict}` : ''}`,
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
            <ChevronLeft className="w-4 h-4" /> {t('detail.backToIdeas')}
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
              {hasVoted ? t('detail.voted') : t('detail.vote')}
              <span className="tabular-nums">{idea.votes || 0}</span>
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
            >
              <Share2 className="w-4 h-4" /> {t('detail.share')}
            </button>
            {idea.source !== 'community' && idea.source_url && (
              <a
                href={idea.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
                onClick={() => trackEvent('outbound_click', { link_url: idea.source_url, link_label: `${idea.source} source`, location: 'idea_detail' })}
              >
                {t('detail.viewSource')} <ArrowRight className="w-3.5 h-3.5" />
              </a>
            )}
            <button
              onClick={() => {
                openWidget();
                trackEvent('cta_click', { cta: 'flybot_from_idea_detail', location: 'idea_detail' });
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-primary/30 bg-primary/5 text-sm font-medium text-primary hover:bg-primary/10 transition-colors ml-auto"
            >
              <Bot className="w-4 h-4" /> {t('detail.askFlyBot')}
            </button>
          </div>

          {isAuthenticated ? (
          <>
          {/* ─── Quick Read ─── */}
          {(() => {
            const thePain = synthesis?.the_pain || synthesis?.one_liner || idea.idea_description || flData?.problem_clarity?.reasoning;
            const theGap = synthesis?.the_gap || flData?.solution_gap?.reasoning;
            const buildAngle = synthesis?.build_angle || synthesis?.next_steps?.[0] || flData?.buildability?.reasoning;
            const hasQuickRead = thePain || theGap || buildAngle;

            if (!hasQuickRead) return null;

            return (
              <section className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">{t('detail.quickRead')}</span>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  {thePain && (
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-red-500">{t('detail.thePain')}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">{thePain}</p>
                    </div>
                  )}
                  {theGap && (
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-amber-500">{t('detail.theGap')}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">{theGap}</p>
                    </div>
                  )}
                  {buildAngle && (
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-primary">{t('detail.whatToBuild')}</p>
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
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">{t('detail.theScore')}</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            {!flData && !synthesis ? (
              <div className="text-center py-8">
                <Zap className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground font-medium">{t('detail.scorePending')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Verdict box */}
                <div className={`rounded-xl border ${vs.border} ${vs.bg} p-5 space-y-3`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className={`text-xl font-black ${vs.text}`}>{vs.label}</span>
                      {idea.confidence && (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${confidenceColors[idea.confidence] || confidenceColors.medium}`}>
                          {idea.confidence} {t('detail.confidence')}
                        </span>
                      )}
                      {synthesis?.market_potential && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-secondary/10 text-secondary">
                          {synthesis.market_potential} market
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
                  {synthesis?.reasoning && (
                    <p className="text-sm text-muted-foreground">{synthesis?.reasoning}</p>
                  )}
                  {/* Competitor warning badge */}
                  {(() => {
                    const compCount = idea.meta?.research?.x_competitors?.competitor_count;
                    if (compCount == null) return null;
                    if (compCount >= 5) {
                      return (
                        <div className="flex items-center gap-2 text-xs font-medium text-amber-500">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          {t('detail.crowdedMarket', { count: compCount })}
                        </div>
                      );
                    }
                    if (compCount <= 1) {
                      return (
                        <div className="flex items-center gap-2 text-xs font-medium text-primary">
                          <Sparkles className="w-3.5 h-3.5" />
                          {t('detail.underservedMarket')}
                        </div>
                      );
                    }
                    return null;
                  })()}
                  {synthesis?.saturation_capped && (
                    <p className="text-xs text-amber-500/80">{t('detail.scoreCapped')}</p>
                  )}
                  {idea.meta?.research?.x_competitors && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="px-1.5 py-0.5 rounded bg-muted/50 font-medium capitalize">{idea.meta.research.x_competitors.market_maturity}</span>
                      {idea.meta.research.x_competitors.has_big_tech && <span className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-500 font-medium">Big Tech</span>}
                      {idea.meta.research.x_competitors.has_funded_players && !idea.meta.research.x_competitors.has_big_tech && <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 font-medium">Funded</span>}
                    </div>
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
                          <span className="text-sm font-bold text-indigo-500">{t('detail.flyLabsMethod')}</span>
                          <span className="text-[10px] font-medium text-muted-foreground/50">{t('detail.fourQuestions')}</span>
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
                        <p className="text-xs font-medium text-muted-foreground/60">{t('detail.strengths')}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {synthesis.strengths.map((s, i) => (
                            <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {synthesis?.risks?.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-xs font-medium text-muted-foreground/60">{t('detail.risks')}</p>
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
                    <p className="text-xs font-medium text-muted-foreground/60 mb-1.5">{t('detail.nextSteps')}</p>
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
                    {t('detail.disclaimer')}
                    {' '}<Link to="/scoring" className="text-accent hover:underline font-medium">{t('detail.howScoringWorks')}</Link>
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
                    <h4 className="font-bold text-amber-500 text-sm">{t('detail.ycGraveyard')}</h4>
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
                        <span>{fa.team_size} {t('detail.people')}</span>
                      </>
                    )}
                  </div>
                  <div className="space-y-2">
                    {fa.failure_reason && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground/60 mb-0.5">{t('detail.whyItFailed')}</p>
                        <p className="text-sm text-muted-foreground">{fa.failure_reason}</p>
                      </div>
                    )}
                    {fa.what_changed && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground/60 mb-0.5">{t('detail.whatsDifferent')}</p>
                        <p className="text-sm text-muted-foreground">{fa.what_changed}</p>
                      </div>
                    )}
                    {fa.rebuild_angle && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground/60 mb-0.5">{t('detail.rebuildAngle')}</p>
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
                      {t('detail.readPostmortem')} <ExternalLink className="w-3 h-3" />
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
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">{t('detail.expertPerspectives')}</span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <p className="text-xs text-muted-foreground/50 mb-3">
                {t('detail.expertDescription', { count: EXPERT_CONFIG.length })}
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

          {/* ── What People Are Saying ── */}
          {idea.meta?.research && (
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">{t('detail.whatPeopleAreSaying')}</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              {(() => {
                const xEv = idea.meta.research.x_evidence;
                const reddit = idea.meta.research.reddit;
                const hasX = xEv?.highlights?.length > 0;
                const hasReddit = reddit?.highlights?.length > 0;

                if (!hasX && !hasReddit) {
                  return (
                    <p className="text-sm text-muted-foreground text-center py-4">{t('detail.noConversationsFound')}</p>
                  );
                }

                return (
                  <div className="space-y-4">
                    {hasX && (
                      <div className="space-y-2">
                        {xEv.highlights.slice(0, 5).map((h, i) => (
                          <div key={i} className="p-3 rounded-lg border border-border/40 bg-card/50">
                            <p className="text-sm text-muted-foreground">"{h.text}"</p>
                            <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground/60">
                              <span className="font-medium">{h.author}</span>
                              {h.engagement > 0 && <span>{h.engagement} engagement</span>}
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                h.sentiment === 'frustration' ? 'bg-red-500/10 text-red-500' :
                                h.sentiment === 'need' ? 'bg-amber-500/10 text-amber-500' :
                                h.sentiment === 'complaint' ? 'bg-orange-500/10 text-orange-500' :
                                'bg-muted text-muted-foreground'
                              }`}>{h.sentiment}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {hasReddit && (
                      <div className="space-y-2">
                        {reddit.highlights.slice(0, 4).map((p, i) => (
                          <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-border/40 bg-card/50">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{p.title}</p>
                              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground/60">
                                <span className="font-medium text-orange-500">r/{p.subreddit}</span>
                                <span>{p.upvotes} upvotes</span>
                                <span>{p.comments} comments</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground/50">
                      {t('detail.relevantConversations', { xCount: xEv?.total_found || 0, redditCount: reddit?.total_found || 0 })}
                    </p>
                  </div>
                );
              })()}
            </section>
          )}

          {/* ── Who Else Is Doing This ── */}
          {idea.meta?.research?.x_competitors?.competitors?.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">{t('detail.competitors')}</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <div className="space-y-3">
                {idea.meta.research.x_competitors.competitors.slice(0, 6).map((c, i) => (
                  <div key={i} className="border-l-2 border-amber-500 pl-3 space-y-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm font-bold truncate">{c.name}</span>
                        {c.funded && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-500">Funded</span>
                        )}
                      </div>
                      {c.pricing && c.pricing !== 'unknown' && (
                        <span className="text-xs text-muted-foreground shrink-0">{c.pricing}</span>
                      )}
                    </div>
                    {c.description && <p className="text-xs text-muted-foreground">{c.description}</p>}
                    {c.complaints?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {c.complaints.slice(0, 3).map((complaint, j) => (
                          <span key={j} className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-500">{complaint}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {/* Market badges */}
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  <span className="px-1.5 py-0.5 rounded bg-muted/50 text-xs font-medium capitalize">{idea.meta.research.x_competitors.market_maturity}</span>
                  {idea.meta.research.x_competitors.has_big_tech && <span className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-500 text-xs font-medium">Big Tech</span>}
                  {idea.meta.research.x_competitors.has_funded_players && !idea.meta.research.x_competitors.has_big_tech && <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 text-xs font-medium">Funded</span>}
                </div>

                {idea.meta.research.x_competitors.feature_gaps?.length > 0 && (
                  <div className="pt-1">
                    <p className="text-xs font-medium text-muted-foreground/60 mb-1">Feature gaps</p>
                    <div className="flex flex-wrap gap-1.5">
                      {idea.meta.research.x_competitors.feature_gaps.map((gap, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{gap}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}
          {/* ── Web Intelligence ── */}
          {idea.meta?.research?.web && (idea.meta.research.web.product_hunt_launches > 0 || idea.meta.research.web.recent_news?.length > 0) && (
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">{t('detail.webIntelligence')}</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <div className="space-y-3">
                {idea.meta.research.web.product_hunt_launches > 0 && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="px-2 py-0.5 rounded bg-orange-500/10 text-orange-500 text-xs font-bold">PH</span>
                    <span>{idea.meta.research.web.product_hunt_launches} {t('detail.productHuntLaunches')}</span>
                  </div>
                )}

                {idea.meta.research.web.recent_news?.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground/60">{t('detail.recentNews')}</p>
                    {idea.meta.research.web.recent_news.slice(0, 3).map((n, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-secondary mt-1.5 shrink-0" />
                        <div>
                          <span className="text-muted-foreground">{n.title}</span>
                          <span className="text-xs text-muted-foreground/50 ml-2">{n.source}{n.date ? `, ${n.date}` : ''}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {idea.meta.research.web.market_signals && (
                  <p className="text-xs text-muted-foreground/60 italic">{idea.meta.research.web.market_signals}</p>
                )}
              </div>
            </section>
          )}
          {/* ─── Build From Here ─── */}
          {rec && synthesis && (
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">{t('detail.buildFromHere')}</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              {rec === 'BUILD' && (
                <div className="space-y-4">
                  {synthesis.the_pain && (
                    <div className="p-4 rounded-xl border border-primary/20 bg-primary/5">
                      <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">{t('detail.painToSolve')}</p>
                      <p className="text-sm text-muted-foreground">{synthesis.the_pain}</p>
                    </div>
                  )}
                  {synthesis.the_gap && (
                    <div className="p-4 rounded-xl border border-primary/20 bg-primary/5">
                      <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">{t('detail.gapToFill')}</p>
                      <p className="text-sm text-muted-foreground">{synthesis.the_gap}</p>
                    </div>
                  )}
                  {synthesis.build_angle && (
                    <div className="p-4 rounded-xl border border-primary/20 bg-primary/5">
                      <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">{t('detail.yourAngle')}</p>
                      <p className="text-sm text-muted-foreground">{synthesis.build_angle}</p>
                    </div>
                  )}
                  <button
                    onClick={() => {
                      openWidget();
                      trackEvent('cta_click', { cta: 'build_from_here_flybot', location: 'idea_detail' });
                    }}
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                  >
                    <Bot className="w-4 h-4" /> {t('detail.scopeMvp')}
                  </button>
                </div>
              )}

              {rec === 'VALIDATE_FIRST' && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {t('detail.needsValidation')} {synthesis.reasoning || t('detail.talkToRealPeople')}
                  </p>
                  {/* Show weakest YC lens questions as things to test */}
                  {idea.score_breakdown?.yc && (() => {
                    const yc = idea.score_breakdown.yc;
                    const pillars = [
                      { key: 'demand_reality', label: 'Would someone be upset if this disappeared?', score: yc.demand_reality?.score },
                      { key: 'status_quo', label: 'What are users doing today to solve this badly?', score: yc.status_quo?.score },
                      { key: 'desperate_specificity', label: 'Can you name the actual human who needs this most?', score: yc.desperate_specificity?.score },
                      { key: 'narrowest_wedge', label: "What's the smallest version someone pays for THIS WEEK?", score: yc.narrowest_wedge?.score },
                      { key: 'observation_surprise', label: 'Is there evidence of real usage?', score: yc.observation_surprise?.score },
                      { key: 'future_fit', label: 'In 3 years, more essential or less?', score: yc.future_fit?.score },
                    ].filter(p => p.score != null).sort((a, b) => a.score - b.score).slice(0, 3);

                    if (pillars.length === 0) return null;
                    return (
                      <div>
                        <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-2">{t('detail.testTheseFirst')}</p>
                        <div className="space-y-2">
                          {pillars.map(p => (
                            <div key={p.key} className="flex items-start gap-2 p-3 rounded-lg border border-amber-500/20 bg-amber-500/5">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                              <p className="text-sm text-muted-foreground">{p.label}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                  <button
                    onClick={() => {
                      openWidget();
                      trackEvent('cta_click', { cta: 'validate_from_here_flybot', location: 'idea_detail' });
                    }}
                    className="inline-flex items-center gap-2 text-sm font-medium text-amber-600 hover:underline"
                  >
                    <Bot className="w-4 h-4" /> {t('detail.askWhatToValidate')}
                  </button>
                </div>
              )}

              {rec === 'SKIP' && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {t('detail.numbersSaySkip')} {synthesis.reasoning || t('detail.betterIdeas')}
                  </p>
                  <Link
                    to={`/ideas?verdict=BUILD${idea.industry ? `&industry=${idea.industry}` : ''}&sort=flylabs`}
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                    onClick={() => trackEvent('cta_click', { cta: 'skip_browse_build', location: 'idea_detail' })}
                  >
                    <ArrowRight className="w-4 h-4" /> {t('detail.browseBuildIdeas')}{idea.industry ? t('detail.inIndustry', { industry: industries.find(i => i.value === idea.industry)?.label || idea.industry }) : ''}
                  </Link>
                </div>
              )}
            </section>
          )}

          </>
          ) : (
          <GatedOverlay
            title={t('detail.guestTitle')}
            description={t('detail.guestDescription')}
            location="idea_detail"
          >
            <div className="space-y-8">
              <section className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">{t('detail.quickRead')}</span>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-red-500">{t('detail.thePain')}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{t('detail.guestPainPlaceholder')}</p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-amber-500">{t('detail.theGap')}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{t('detail.guestGapPlaceholder')}</p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-primary">{t('detail.whatToBuild')}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{t('detail.guestBuildPlaceholder')}</p>
                  </div>
                </div>
              </section>
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">{t('detail.theScore')}</span>
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
                  <p className="text-sm text-muted-foreground">{t('detail.guestScoreMessage')}</p>
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
            {hasVoted ? t('detail.voted') : t('detail.vote')}
            <span className="tabular-nums">{idea.votes || 0}</span>
          </button>
          <button
            onClick={handleShare}
            className="flex items-center justify-center gap-2 h-11 px-4 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
          >
            <Share2 className="w-4 h-4" /> {t('detail.share')}
          </button>
        </div>
      </div>
    </PageLayout>
  );
};

export default IdeaDetailPage;
