
import { ChevronUp, Flame } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { timeAgo } from '@/lib/utils.js';
import { trackEvent } from '@/lib/analytics.js';
import { industries, statusConfig, verdictColors, verdictLabels } from '@/lib/data/ideas.js';
import SourceBadge from '@/components/ideas/SourceBadge.jsx';

const TRENDING_THRESHOLD = 5;

const IdeaCard = ({ idea, hasVoted, onVote, index }) => {
  const navigate = useNavigate();
  const status = statusConfig[idea.status] || statusConfig.open;
  const dotColor = idea.status === 'building'
    ? 'bg-blue-500'
    : idea.status === 'shipped'
      ? 'bg-primary'
      : 'bg-orange-500';

  // Only show status for non-default (building/shipped)
  const showStatus = idea.source === 'reddit'
    ? false // Reddit ideas show subreddit instead
    : idea.status === 'building' || idea.status === 'shipped';

  const handleClick = () => {
    trackEvent('idea_detail_opened', { idea_id: idea.id, idea_title: idea.idea_title, source: idea.source });
    navigate(`/ideas/${idea.id}`);
  };

  return (
    <motion.div
      key={idea.id}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      onClick={handleClick}
      className={`group px-5 py-4 rounded-xl border border-border/60 bg-card/50 hover:bg-card hover:border-border transition-colors duration-200 cursor-pointer ${
        hasVoted ? 'border-l-2 border-l-primary/40' : ''
      }`}
    >
      <div className="flex gap-3.5">
        {/* Vote button */}
        <button
          onClick={(e) => { e.stopPropagation(); e.preventDefault(); onVote(idea.id); }}
          aria-label={`${hasVoted ? 'Remove vote from' : 'Vote for'} ${idea.idea_title}`}
          className={`flex flex-col items-center gap-0.5 pt-0.5 shrink-0 transition-colors duration-200 ${
            hasVoted
              ? 'text-primary hover:text-primary/60 cursor-pointer'
              : 'text-muted-foreground hover:text-primary cursor-pointer'
          }`}
        >
          <motion.div
            whileTap={{ scale: 1.3 }}
            transition={{ type: 'spring', stiffness: 500, damping: 15 }}
          >
            <ChevronUp className={`w-5 h-5 ${hasVoted ? 'stroke-[2.5]' : ''}`} />
          </motion.div>
          <AnimatePresence mode="wait">
            <motion.span
              key={idea.votes || 0}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="text-xs font-semibold tabular-nums"
            >
              {idea.votes || 0}
            </motion.span>
          </AnimatePresence>
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-2 mb-1">
            <div className="flex items-center gap-2 min-w-0">
              <h3 className="font-semibold text-foreground leading-snug group-hover:text-primary transition-colors">
                {(idea.source === 'problemhunt' || idea.source === 'reddit' || idea.source === 'producthunt' || idea.source === 'x' || idea.source === 'hackernews' || idea.source === 'github' || idea.source === 'yc') && idea.source_url ? (
                  <a
                    href={idea.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      e.stopPropagation();
                      trackEvent('outbound_click', {
                        link_url: idea.source_url,
                        link_label: idea.idea_title,
                        location: 'ideas',
                      });
                    }}
                    className="hover:underline"
                  >
                    {idea.idea_title}
                  </a>
                ) : (
                  idea.idea_title
                )}
              </h3>
              {(idea.votes || 0) >= TRENDING_THRESHOLD && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-500 bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20 shrink-0">
                  <Flame className="w-3 h-3" /> Trending
                </span>
              )}
            </div>

            {/* Score badges - verdict + FL score only, full breakdown in detail page */}
            <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
              {(() => {
                const verdict = idea.enrichment?.verdict?.recommendation || idea.score_breakdown?.synthesis?.verdict;
                if (!verdict) return null;
                return (
                  <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${verdictColors[verdict] || verdictColors.VALIDATE_FIRST}`}>
                    {verdictLabels[verdict] || verdict}
                  </span>
                );
              })()}
              {idea.flylabs_score != null && (
                <span
                  className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-500 text-[11px] font-bold tabular-nums"
                  title="Fly Labs Score"
                >
                  FL {idea.flylabs_score}
                </span>
              )}
              {idea.enrichment?.competitors?.products?.length > 0 && (
                <span className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-[11px] font-medium">
                  {idea.enrichment.competitors.products.length} competitor{idea.enrichment.competitors.products.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
          {idea.idea_description && idea.idea_description !== idea.idea_title && (
            <p className="text-sm text-muted-foreground leading-relaxed mb-2 line-clamp-3 sm:line-clamp-2 whitespace-pre-wrap">
              {idea.idea_description}
            </p>
          )}
          {idea.score_breakdown?.synthesis?.one_liner && (
            <p className="text-xs text-muted-foreground/60 italic line-clamp-1 mb-2">{idea.score_breakdown.synthesis.one_liner}</p>
          )}
          {idea.score_breakdown?.synthesis?.strengths?.length > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 mb-2">
              {idea.score_breakdown.synthesis.strengths.slice(0, 2).map((s, i) => (
                <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-primary/8 text-primary/70">{s}</span>
              ))}
            </div>
          )}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70 flex-wrap">
            <span>
              <SourceBadge source={idea.source} sourceUrl={idea.source_url} tags={idea.tags} name={idea.name} />
            </span>
            <span className="text-muted-foreground/40">&middot;</span>
            <span>{timeAgo(idea.published_at || idea.created_at)}</span>
            <span className="text-muted-foreground/40">&middot;</span>
            <span>{idea.category || 'Other'}</span>
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
                <span className="inline-flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                  {status.label}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default IdeaCard;
