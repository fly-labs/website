import React from 'react';
import { motion } from 'framer-motion';
import { ScoreBar, getScoreTier, verdictStyles, FRAMEWORK_CONFIG } from '@/components/ideas/ScoreUtils.jsx';

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
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="rounded-xl border bg-card p-4 max-w-md"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h4 className="font-semibold text-sm">{idea_title}</h4>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-2xl font-bold tabular-nums ${tier.color}`}>
              {composite_score}
            </span>
            <span className="text-xs text-muted-foreground">/100</span>
          </div>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${vs.bg} ${vs.border} ${vs.text}`}>
          {vs.label}
        </span>
      </div>

      {/* Framework scores */}
      <div className="space-y-2 mb-3">
        {scores.map(({ key, score, config }) => (
          <div key={key}>
            <div className="flex items-center justify-between mb-0.5">
              <span className={`text-xs font-medium ${config.color || 'text-foreground'}`}>
                {config.name}
              </span>
            </div>
            <ScoreBar score={score} max={100} color={config.barColor || 'bg-foreground/60'} />
          </div>
        ))}
      </div>

      {/* Reasoning */}
      {reasoning && (
        <p className="text-xs text-muted-foreground leading-relaxed mb-2">
          {reasoning}
        </p>
      )}

      {/* Details */}
      <div className="flex flex-col gap-1 text-xs">
        {strongest_dimension && (
          <div className="flex gap-1.5">
            <span className="text-primary font-medium">Strongest:</span>
            <span className="text-muted-foreground">{strongest_dimension}</span>
          </div>
        )}
        {biggest_risk && (
          <div className="flex gap-1.5">
            <span className="text-red-500 font-medium">Risk:</span>
            <span className="text-muted-foreground">{biggest_risk}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
