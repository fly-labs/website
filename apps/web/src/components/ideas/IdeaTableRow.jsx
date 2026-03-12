
import { ChevronUp, Flame } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { timeAgo } from '@/lib/utils.js';
import { trackEvent } from '@/lib/analytics.js';
import { verdictColors, verdictLabels } from '@/lib/data/ideas.js';
import SourceBadge from '@/components/ideas/SourceBadge.jsx';

const TRENDING_THRESHOLD = 5;

const IdeaTableRow = ({ idea, hasVoted, onVote, index }) => {
  const navigate = useNavigate();
  const verdict = idea.enrichment?.verdict?.recommendation || idea.score_breakdown?.synthesis?.verdict;

  const handleClick = () => {
    trackEvent('idea_detail_opened', { idea_id: idea.id, idea_title: idea.idea_title, source: idea.source });
    navigate(`/ideas/${idea.id}`);
  };

  return (
    <motion.tr
      key={idea.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, delay: index * 0.02 }}
      onClick={handleClick}
      className="group border-b border-border/40 hover:bg-card/80 cursor-pointer transition-colors"
    >
      {/* Vote */}
      <td className="py-2.5 px-2 w-12 text-center align-middle">
        <button
          onClick={(e) => { e.stopPropagation(); e.preventDefault(); onVote(idea.id); }}
          aria-label={`${hasVoted ? 'Remove vote from' : 'Vote for'} ${idea.idea_title}`}
          className={`inline-flex flex-col items-center gap-0 transition-colors ${
            hasVoted ? 'text-primary' : 'text-muted-foreground hover:text-primary'
          }`}
        >
          <ChevronUp className={`w-4 h-4 ${hasVoted ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[11px] font-semibold tabular-nums leading-none">{idea.votes || 0}</span>
        </button>
      </td>

      {/* Title */}
      <td className="py-2.5 px-2 align-middle">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-medium text-sm text-foreground group-hover:text-primary transition-colors truncate">
            {idea.idea_title}
          </span>
          {(idea.votes || 0) >= TRENDING_THRESHOLD && (
            <Flame className="w-3 h-3 text-orange-500 shrink-0" />
          )}
        </div>
      </td>

      {/* Verdict */}
      <td className="py-2.5 px-2 w-24 align-middle hidden sm:table-cell">
        {verdict && (
          <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${verdictColors[verdict] || verdictColors.VALIDATE_FIRST}`}>
            {verdictLabels[verdict] || verdict}
          </span>
        )}
      </td>

      {/* FL Score */}
      <td className="py-2.5 px-2 w-16 align-middle text-center hidden sm:table-cell">
        {idea.flylabs_score != null && (
          <span className="text-[11px] font-bold tabular-nums text-indigo-500">
            {idea.flylabs_score}
          </span>
        )}
      </td>

      {/* Source */}
      <td className="py-2.5 px-2 w-28 align-middle hidden md:table-cell">
        <span className="text-xs text-muted-foreground/70">
          <SourceBadge source={idea.source} sourceUrl={idea.source_url} tags={idea.tags} name={idea.name} />
        </span>
      </td>

      {/* Time */}
      <td className="py-2.5 px-2 w-20 align-middle text-right">
        <span className="text-xs text-muted-foreground/60 tabular-nums">
          {timeAgo(idea.published_at || idea.created_at)}
        </span>
      </td>
    </motion.tr>
  );
};

export default IdeaTableRow;
