
export const getScoreTier = (score) => {
  if (score >= 75) return { label: 'Exceptional', color: 'text-primary', bg: 'bg-primary/10', bar: 'bg-primary' };
  if (score >= 60) return { label: 'Strong', color: 'text-secondary', bg: 'bg-secondary/10', bar: 'bg-secondary' };
  if (score >= 45) return { label: 'Moderate', color: 'text-amber-500', bg: 'bg-amber-500/10', bar: 'bg-amber-500' };
  if (score >= 30) return { label: 'Weak', color: 'text-orange-500', bg: 'bg-orange-500/10', bar: 'bg-orange-500' };
  return { label: 'Risky', color: 'text-red-500', bg: 'bg-red-500/10', bar: 'bg-red-500' };
};

export const ScoreBar = ({ score, max, color }) => {
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

export const verdictStyles = {
  BUILD: { bg: 'bg-primary/10', border: 'border-primary/30', text: 'text-primary', label: 'BUILD' },
  VALIDATE_FIRST: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-600', label: 'VALIDATE FIRST' },
  SKIP: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-500', label: 'SKIP' },
};

export const confidenceColors = { high: 'text-primary', medium: 'text-amber-500', low: 'text-muted-foreground' };

export const FRAMEWORK_CONFIG = [
  {
    key: 'flylabs',
    name: 'Fly Labs Method',
    color: 'text-indigo-500',
    barColor: 'bg-indigo-500',
    pillars: [
      { key: 'problem_clarity', label: 'Problem Clarity' },
      { key: 'solution_gap', label: 'Solution Gap' },
      { key: 'willingness', label: 'Willingness to Act' },
      { key: 'buildability', label: 'Buildability' },
    ],
  },
  {
    key: 'hormozi',
    name: 'Hormozi Score',
    color: 'text-foreground',
    pillars: [
      { key: 'market_viability', label: 'Market Viability' },
      { key: 'value_equation', label: 'Value Equation' },
      { key: 'market_growth', label: 'Market Growth & Timing' },
      { key: 'differentiation', label: 'Offer Differentiation' },
      { key: 'feasibility', label: 'Execution Feasibility' },
    ],
  },
  {
    key: 'koe',
    name: 'Dan Koe Score',
    color: 'text-foreground',
    pillars: [
      { key: 'problem_clarity', label: 'Problem Clarity' },
      { key: 'creator_fit', label: 'Creator Fit' },
      { key: 'audience_reach', label: 'Audience Reach' },
      { key: 'simplicity', label: 'Simplicity' },
      { key: 'monetization', label: 'Monetization' },
      { key: 'anti_niche', label: 'Anti-Niche POV' },
      { key: 'leverage', label: 'Leverage Potential' },
    ],
  },
  {
    key: 'okamoto',
    name: 'Okamoto Score',
    color: 'text-foreground',
    pillars: [
      { key: 'target_audience', label: 'Target Audience' },
      { key: 'value_proposition', label: 'Value Proposition' },
      { key: 'distribution_channel', label: 'Distribution Channel' },
      { key: 'business_model', label: 'Business Model' },
      { key: 'assumption_risk', label: 'Assumption Risk' },
      { key: 'validation_readiness', label: 'Validation Readiness' },
    ],
  },
];
