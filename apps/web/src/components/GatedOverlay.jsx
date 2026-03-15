import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { trackEvent } from '@/lib/analytics.js';

/**
 * Reusable freemium gating overlay.
 *
 * Two modes:
 * - **Blur overlay**: wraps children with blur + centered CTA card.
 *   Use: <GatedOverlay title="..." description="..."><Charts/></GatedOverlay>
 *
 * - **Inline badge**: compact lock icon + text for card-level gating.
 *   Use: <GatedOverlay variant="inline" title="Sign up to see scores" />
 *
 * Always navigates to /signup on CTA click. Tracks `gated_cta_click` in GA4.
 */
export function GatedOverlay({
  children,
  title = 'Sign up free to unlock',
  description,
  ctaText = 'Sign up free',
  variant = 'overlay',
  location: analyticsLocation = 'unknown',
  className = '',
  teaserCount,
}) {
  const navigate = useNavigate();

  const handleCTA = (e) => {
    e.stopPropagation();
    e.preventDefault();
    trackEvent('gated_cta_click', { location: analyticsLocation, title });
    navigate('/signup');
  };

  // Compact inline variant for cards and rows
  if (variant === 'inline') {
    return (
      <button
        onClick={handleCTA}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-[11px] font-semibold hover:bg-primary/20 transition-colors cursor-pointer ${className}`}
        title={title}
      >
        <Lock className="w-3 h-3" />
        <span>{title}</span>
      </button>
    );
  }

  // Full blur overlay variant
  return (
    <div className={`relative ${className}`}>
      {/* Blurred content */}
      <div className="select-none pointer-events-none" style={{ filter: 'blur(8px)' }}>
        {children}
      </div>

      {/* Overlay card */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-card/95 backdrop-blur-sm border border-border rounded-2xl p-6 sm:p-8 max-w-sm mx-4 text-center shadow-xl"
        >
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground mb-1 leading-relaxed">{description}</p>
          )}
          {teaserCount != null && (
            <p className="text-xs text-muted-foreground/60 mb-4">{teaserCount}</p>
          )}
          {!description && !teaserCount && <div className="mb-4" />}
          <button
            onClick={handleCTA}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:brightness-110 transition-[filter] active:translate-y-0.5"
          >
            {ctaText}
          </button>
          <p className="text-xs text-muted-foreground/50 mt-3">Free forever. No credit card.</p>
        </motion.div>
      </div>
    </div>
  );
}

export default GatedOverlay;
