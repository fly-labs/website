import React from 'react';
import { motion } from 'framer-motion';
import { ScoreBar, getScoreTier, verdictStyles, FRAMEWORK_CONFIG } from '@/components/ideas/ScoreUtils.jsx';
import { AlertTriangle, TrendingUp } from 'lucide-react';

export function ChatEvaluation({ evaluation }) {
  if (!evaluation) return null;

  const {
    idea_title,
    flylabs_score,
    hormozi_score,
    koe_score,
    okamoto_score,
    composite_score,
    verdict,
    reasoning,
    strongest_dimension,
    biggest_risk,
  } = evaluation;

  const vs = verdictStyles[verdict] || verdictStyles.VALIDATE_FIRST;
  const tier = getScoreTier(composite_score);

  const scores = [
    { key: 'flylabs', score: flylabs_score, config: FRAMEWORK_CONFIG[0] },
    { key: 'hormozi', score: hormozi_score, config: FRAMEWORK_CONFIG[1] },
    { key: 'koe', score: koe_score, config: FRAMEWORK_CONFIG[2] },
    { key: 'okamoto', score: okamoto_score, config: FRAMEWORK_CONFIG[3] },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25 }}
      className="rounded-xl border border-border/60 bg-card p-5 max-w-sm shadow-sm"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h4 className="font-semibold text-sm leading-snug">{idea_title}</h4>
          <div className="flex items-baseline gap-1.5 mt-1.5">
            <span className={`text-3xl font-bold tabular-nums tracking-tight ${tier.color}`}>
              {composite_score}
            </span>
            <span className="text-xs text-muted-foreground/50">/100</span>
          </div>
        </div>
        <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide border ${vs.bg} ${vs.border} ${vs.text}`}>
          {vs.label}
        </span>
      </div>

      {/* Framework scores */}
      <div className="space-y-2.5 mb-4">
        {scores.map(({ key, score, config }) => (
          <div key={key}>
            <div className="flex items-center justify-between mb-1">
              <span className={`text-[11px] font-medium ${config.color || 'text-muted-foreground'}`}>
                {config.name}
              </span>
              <span className="text-[11px] text-muted-foreground/50 tabular-nums">{score}</span>
            </div>
            <ScoreBar score={score} max={100} color={config.barColor || 'bg-foreground/40'} />
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="border-t border-border/40 pt-3 space-y-2">
        {/* Reasoning */}
        {reasoning && (
          <p className="text-[12px] text-muted-foreground leading-relaxed">
            {reasoning}
          </p>
        )}

        {/* Details */}
        {strongest_dimension && (
          <div className="flex items-start gap-2 text-[12px]">
            <TrendingUp className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
            <span className="text-muted-foreground"><span className="text-foreground/80 font-medium">Strongest:</span> {strongest_dimension}</span>
          </div>
        )}
        {biggest_risk && (
          <div className="flex items-start gap-2 text-[12px]">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
            <span className="text-muted-foreground"><span className="text-foreground/80 font-medium">Risk:</span> {biggest_risk}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
