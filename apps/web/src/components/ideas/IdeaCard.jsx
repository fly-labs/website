
import { ChevronUp, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { timeAgo } from '@/lib/utils.js';
import { trackEvent } from '@/lib/analytics.js';
import { industries, statusConfig } from '@/lib/data/ideas.js';

const TRENDING_THRESHOLD = 5;

const IdeaCard = ({ idea, hasVoted, onVote, onOpenDrawer, index }) => {
  const status = statusConfig[idea.status] || statusConfig.open;
  const dotColor = idea.status === 'building'
    ? 'bg-blue-500'
    : idea.status === 'shipped'
      ? 'bg-primary'
      : 'bg-orange-500';

  // Extract subreddit from tags for Reddit ideas
  const subreddit = idea.source === 'reddit' && idea.tags
    ? idea.tags.split(',')[0]?.trim()
    : null;

  // Only show status for non-default (building/shipped)
  const showStatus = idea.source === 'reddit'
    ? false // Reddit ideas show subreddit instead
    : idea.status === 'building' || idea.status === 'shipped';

  return (
    <motion.div
      key={idea.id}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      onClick={() => onOpenDrawer(idea)}
      className={`group px-5 py-4 rounded-xl border border-border/60 bg-card/50 hover:bg-card hover:border-border transition-colors duration-200 cursor-pointer ${
        hasVoted ? 'border-l-2 border-l-primary/40' : ''
      }`}
    >
      <div className="flex gap-3.5">
        {/* Vote button */}
        <button
          onClick={(e) => { e.stopPropagation(); onVote(idea.id); }}
          disabled={hasVoted}
          aria-label={`Vote for ${idea.idea_title}${hasVoted ? ' (voted)' : ''}`}
          className={`flex flex-col items-center gap-0.5 pt-0.5 shrink-0 transition-colors duration-200 ${
            hasVoted
              ? 'text-primary cursor-default'
              : 'text-muted-foreground hover:text-primary cursor-pointer'
          }`}
        >
          <motion.div
            whileTap={!hasVoted ? { scale: 1.3 } : {}}
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
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 min-w-0">
              <h3 className="font-semibold text-foreground leading-snug group-hover:text-primary transition-colors">
                {(idea.source === 'problemhunt' || idea.source === 'reddit' || idea.source === 'producthunt') && idea.source_url ? (
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

            {/* Score badges */}
            <div className="flex items-center gap-1.5 shrink-0">
              {idea.hormozi_score != null && (
                <button
                  onClick={(e) => { e.stopPropagation(); onOpenDrawer(idea); }}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[11px] font-bold tabular-nums hover:bg-primary/20 transition-colors"
                  title="Hormozi Score"
                >
                  H {idea.hormozi_score}
                </button>
              )}
              {idea.koe_score != null && (
                <button
                  onClick={(e) => { e.stopPropagation(); onOpenDrawer(idea); }}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary/10 text-secondary text-[11px] font-bold tabular-nums hover:bg-secondary/20 transition-colors"
                  title="Koe Score"
                >
                  K {idea.koe_score}
                </button>
              )}
              {idea.okamoto_score != null && (
                <button
                  onClick={(e) => { e.stopPropagation(); onOpenDrawer(idea); }}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-accent/10 text-accent text-[11px] font-bold tabular-nums hover:bg-accent/20 transition-colors"
                  title="Okamoto Score"
                >
                  B {idea.okamoto_score}
                </button>
              )}
            </div>
          </div>
          {idea.idea_description && idea.idea_description !== idea.idea_title && (
            <p className="text-sm text-muted-foreground leading-relaxed mb-2 line-clamp-2">
              {idea.idea_description}
            </p>
          )}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70 flex-wrap">
            <span>
              {idea.source === 'problemhunt' ? (
                <a
                  href={idea.source_url || 'https://problemhunt.pro'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline font-medium"
                  onClick={(e) => {
                    e.stopPropagation();
                    trackEvent('outbound_click', {
                      link_url: idea.source_url || 'https://problemhunt.pro',
                      link_label: 'ProblemHunt',
                      location: 'ideas',
                    });
                  }}
                >
                  via ProblemHunt
                </a>
              ) : idea.source === 'reddit' && idea.source_url ? (
                <a
                  href={idea.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-red-500 hover:underline font-medium"
                  onClick={(e) => {
                    e.stopPropagation();
                    trackEvent('outbound_click', {
                      link_url: idea.source_url,
                      link_label: subreddit ? `r/${subreddit}` : 'Reddit',
                      location: 'ideas',
                    });
                  }}
                >
                  {subreddit ? `r/${subreddit}` : 'via Reddit'}
                </a>
              ) : idea.source === 'producthunt' ? (
                <a
                  href={idea.source_url || 'https://producthunt.com'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-600 hover:underline font-medium"
                  onClick={(e) => {
                    e.stopPropagation();
                    trackEvent('outbound_click', {
                      link_url: idea.source_url || 'https://producthunt.com',
                      link_label: 'Product Hunt',
                      location: 'ideas',
                    });
                  }}
                >
                  via Product Hunt
                </a>
              ) : (
                `by ${idea.name || 'Anonymous'}`
              )}
            </span>
            <span className="text-muted-foreground/40">&middot;</span>
            <span>{timeAgo(idea.created_at)}</span>
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
            {subreddit && (
              <>
                <span className="text-muted-foreground/40">&middot;</span>
                <span className="text-red-500 font-medium">r/{subreddit}</span>
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
