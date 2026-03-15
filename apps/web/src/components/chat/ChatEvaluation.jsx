import React from 'react';
import { motion } from 'framer-motion';
import { ScoreBar, getScoreTier, verdictStyles, EXPERT_CONFIG } from '@/components/ideas/ScoreUtils.jsx';
import { AlertTriangle, TrendingUp, Info } from 'lucide-react';

export function ChatEvaluation({ evaluation }) {
  if (!evaluation) return null;

  const {
    idea_title,
    flylabs_score,
    hormozi_score,
    koe_score,
    okamoto_score,
    verdict,
    reasoning,
    the_pain,
    the_gap,
    build_angle,
    strongest_dimension,
    biggest_risk,
  } = evaluation;

  const vs = verdictStyles[verdict] || verdictStyles.VALIDATE_FIRST;
  const tier = getScoreTier(flylabs_score);

  const expertScores = [
    { key: 'hormozi', score: hormozi_score, config: EXPERT_CONFIG[0] },
    { key: 'koe', score: koe_score, config: EXPERT_CONFIG[1] },
    { key: 'okamoto', score: okamoto_score, config: EXPERT_CONFIG[2] },
  ].filter(e => e.score != null);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25 }}
      className="rounded-xl border border-border/60 bg-card p-4 sm:p-5 max-w-full sm:max-w-sm shadow-sm"
    >
      {/* Header: Title + FL Score + Verdict */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h4 className="font-semibold text-sm leading-snug">{idea_title}</h4>
          <div className="flex items-baseline gap-1.5 mt-1.5">
            <span className={`text-4xl font-black tabular-nums tracking-tight ${tier.color}`}>
              {flylabs_score}
            </span>
            <span className="text-xs text-muted-foreground/50">/100</span>
          </div>
        </div>
        <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide border ${vs.bg} ${vs.border} ${vs.text}`}>
          {vs.label}
        </span>
      </div>

      {/* Quick Read */}
      {(the_pain || the_gap || build_angle) && (
        <div className="space-y-1.5 mb-3 pb-3 border-b border-border/40">
          {the_pain && (
            <p className="text-[11px] text-muted-foreground"><span className="font-bold text-red-500">Pain:</span> {the_pain}</p>
          )}
          {the_gap && (
            <p className="text-[11px] text-muted-foreground"><span className="font-bold text-amber-500">Gap:</span> {the_gap}</p>
          )}
          {build_angle && (
            <p className="text-[11px] text-muted-foreground"><span className="font-bold text-primary">Build:</span> {build_angle}</p>
          )}
        </div>
      )}

      {/* Divider */}
      <div className="space-y-2">
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

        {/* Expert Perspectives: small, secondary */}
        {expertScores.length > 0 && (
          <div className="pt-2 mt-2 border-t border-border/30">
            <p className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider mb-1.5">Expert Perspectives</p>
            <div className="flex items-center gap-3">
              {expertScores.map(({ key, score, config }) => (
                <div key={key} className="flex items-center gap-1">
                  <span className="text-[10px] text-muted-foreground/60">{config.name}</span>
                  <span className="text-[11px] font-bold tabular-nums text-muted-foreground">{score}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DYOR footer */}
        <div className="flex items-start gap-1.5 pt-2 mt-1 border-t border-border/30">
          <Info className="w-3 h-3 text-muted-foreground/40 mt-0.5 flex-shrink-0" />
          <p className="text-[10px] text-muted-foreground/40 leading-relaxed">
            AI-generated analysis. Do your own research before building.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
