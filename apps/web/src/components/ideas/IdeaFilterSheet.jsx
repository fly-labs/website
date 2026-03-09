import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { categories, scoreThresholds, confidenceOptions, perPageOptions } from '@/lib/data/ideas.js';

const IdeaFilterSheet = ({
  show,
  onClose,
  filters,
}) => {
  const {
    activeType,
    setActiveType,
    activeIndustry,
    setActiveIndustry,
    minScore,
    setMinScore,
    confidence,
    setConfidence,
    perPage,
    setPerPage,
    typeCounts,
    industryCounts,
    activeIndustries,
    confidenceCounts,
    sorted,
  } = filters;

  const resultCount = sorted.length;

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Mobile: bottom sheet overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm sm:hidden"
          />

          {/* Mobile: bottom sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border rounded-t-2xl max-h-[70vh] overflow-y-auto sm:hidden"
          >
            <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border px-4 pt-3 pb-2 z-10">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/20 mx-auto mb-3" />
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm">Filters</h3>
                <button onClick={onClose} className="p-3 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-5">
              <FilterSections
                activeType={activeType}
                setActiveType={setActiveType}
                activeIndustry={activeIndustry}
                setActiveIndustry={setActiveIndustry}
                minScore={minScore}
                setMinScore={setMinScore}
                confidence={confidence}
                setConfidence={setConfidence}
                perPage={perPage}
                setPerPage={setPerPage}
                typeCounts={typeCounts}
                industryCounts={industryCounts}
                activeIndustries={activeIndustries}
                confidenceCounts={confidenceCounts}
              />
            </div>

            <div className="sticky bottom-0 bg-card border-t border-border p-4">
              <button
                onClick={onClose}
                className="w-full h-11 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                Show {resultCount} result{resultCount !== 1 ? 's' : ''}
              </button>
            </div>
          </motion.div>

          {/* Desktop: inline expandable panel */}
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden hidden sm:block"
          >
            <div className="space-y-4 pt-1 pb-2">
              <FilterSections
                activeType={activeType}
                setActiveType={setActiveType}
                activeIndustry={activeIndustry}
                setActiveIndustry={setActiveIndustry}
                minScore={minScore}
                setMinScore={setMinScore}
                confidence={confidence}
                setConfidence={setConfidence}
                perPage={perPage}
                setPerPage={setPerPage}
                typeCounts={typeCounts}
                industryCounts={industryCounts}
                activeIndustries={activeIndustries}
                confidenceCounts={confidenceCounts}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const FilterSections = ({
  activeType,
  setActiveType,
  activeIndustry,
  setActiveIndustry,
  minScore,
  setMinScore,
  confidence,
  setConfidence,
  perPage,
  setPerPage,
  typeCounts,
  industryCounts,
  activeIndustries,
  confidenceCounts,
}) => (
  <>
    {/* Type filter */}
    <div>
      <span className="text-xs font-medium text-muted-foreground/60 mb-2 block">Type</span>
      <div className="flex gap-1.5 flex-wrap">
        {['All', ...categories.map((c) => c.value)].map((type) => (
          <button
            key={type}
            onClick={() => setActiveType(type)}
            className={`px-3 py-2 rounded-full text-xs font-medium transition-colors ${
              activeType === type
                ? 'bg-primary/10 text-primary border border-primary/30'
                : 'text-muted-foreground hover:text-foreground bg-muted/50 border border-transparent'
            }`}
          >
            {type}
            {typeCounts[type] != null && (
              <span className="ml-1 text-muted-foreground/40">{typeCounts[type]}</span>
            )}
          </button>
        ))}
      </div>
    </div>

    {/* Industry filter */}
    {activeIndustries.length > 0 && (
      <div>
        <span className="text-xs font-medium text-muted-foreground/60 mb-2 block">Industry</span>
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setActiveIndustry('All')}
            className={`px-3 py-2 rounded-full text-xs font-medium transition-colors ${
              activeIndustry === 'All'
                ? 'bg-primary/10 text-primary border border-primary/30'
                : 'text-muted-foreground hover:text-foreground bg-muted/50 border border-transparent'
            }`}
          >
            All
            {industryCounts.All != null && (
              <span className="ml-1 text-muted-foreground/40">{industryCounts.All}</span>
            )}
          </button>
          {activeIndustries.map((ind) => (
            <button
              key={ind.value}
              onClick={() => setActiveIndustry(ind.value)}
              className={`px-3 py-2 rounded-full text-xs font-medium transition-colors ${
                activeIndustry === ind.value
                  ? 'bg-primary/10 text-primary border border-primary/30'
                  : 'text-muted-foreground hover:text-foreground bg-muted/50 border border-transparent'
              }`}
            >
              {ind.label}
              {industryCounts[ind.value] != null && (
                <span className="ml-1 text-muted-foreground/40">{industryCounts[ind.value]}</span>
              )}
            </button>
          ))}
        </div>
      </div>
    )}

    {/* Score threshold */}
    <div>
      <span className="text-xs font-medium text-muted-foreground/60 mb-2 block">Min Score</span>
      <div className="flex gap-1.5">
        {scoreThresholds.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setMinScore(opt.value)}
            className={`px-3 py-2 rounded-full text-xs font-medium transition-colors ${
              minScore === opt.value
                ? 'bg-primary/10 text-primary border border-primary/30'
                : 'text-muted-foreground hover:text-foreground bg-muted/50 border border-transparent'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>

    {/* Confidence */}
    <div>
      <span className="text-xs font-medium text-muted-foreground/60 mb-2 block">Confidence</span>
      <div className="flex gap-1.5">
        {confidenceOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setConfidence(opt.value)}
            className={`px-3 py-2 rounded-full text-xs font-medium transition-colors ${
              confidence === opt.value
                ? 'bg-primary/10 text-primary border border-primary/30'
                : 'text-muted-foreground hover:text-foreground bg-muted/50 border border-transparent'
            }`}
          >
            {opt.label}
            {confidenceCounts[opt.value] != null && opt.value !== 'all' && (
              <span className="ml-1 text-muted-foreground/40">{confidenceCounts[opt.value]}</span>
            )}
          </button>
        ))}
      </div>
    </div>

    {/* Per page */}
    <div>
      <span className="text-xs font-medium text-muted-foreground/60 mb-2 block">Per Page</span>
      <div className="flex gap-1.5">
        {perPageOptions.map((n) => (
          <button
            key={n}
            onClick={() => setPerPage(n)}
            className={`px-3 py-2 rounded-full text-xs font-medium transition-colors ${
              perPage === n
                ? 'bg-primary/10 text-primary border border-primary/30'
                : 'text-muted-foreground hover:text-foreground bg-muted/50 border border-transparent'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  </>
);

export default IdeaFilterSheet;
