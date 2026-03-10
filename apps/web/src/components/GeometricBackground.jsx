import React from 'react';

const O = 'opacity-[0.03] dark:opacity-[0.04]';

export const GeometricBackground = () => {
  const prefersReducedMotion = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    return (
      <div className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none z-0" />
    );
  }

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none z-0">

      {/* Code brackets */}
      <svg
        className={`absolute top-[12%] right-[8%] w-16 h-10 md:w-20 md:h-12 text-foreground ${O} geo-float-1`}
        viewBox="0 0 120 60" fill="none"
      >
        <path d="M20 8 C14 8 10 12 10 18 L10 24 C10 28 6 30 4 30 C6 30 10 32 10 36 L10 42 C10 48 14 52 20 52" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M100 8 C106 8 110 12 110 18 L110 24 C110 28 114 30 116 30 C114 30 110 32 110 36 L110 42 C110 48 106 52 100 52" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>

      {/* Terminal prompt */}
      <div
        className={`absolute bottom-[22%] left-[8%] text-foreground ${O} font-mono text-base md:text-lg select-none geo-float-2`}
      >{'> _'}</div>

      {/* Sparkle / star */}
      <svg
        className={`absolute bottom-[12%] right-[16%] w-10 h-10 md:w-12 md:h-12 text-foreground ${O} geo-spin`}
        viewBox="0 0 60 60" fill="none"
      >
        <path d="M30 6 L30 54" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        <path d="M6 30 L54 30" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        <path d="M14 14 L46 46" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
        <path d="M46 14 L14 46" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
      </svg>

      {/* Paper plane */}
      <svg
        className={`absolute top-[5%] left-[6%] w-12 h-12 md:w-14 md:h-14 text-foreground ${O} geo-drift`}
        viewBox="0 0 60 60" fill="none"
        style={{ rotate: '-25deg' }}
      >
        <path d="M30 6 L6 48 L30 36 L54 48 Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M30 6 L30 36" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      </svg>

      {/* Squiggly line */}
      <svg
        className={`absolute top-[65%] left-[30%] w-28 h-4 md:w-36 md:h-5 text-foreground ${O} geo-float-3 hidden md:block`}
        viewBox="0 0 180 24" fill="none"
      >
        <path d="M4 12 Q18 4 32 12 Q46 20 60 12 Q74 4 88 12 Q102 20 116 12 Q130 4 144 12 Q158 20 172 12" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeDasharray="4 3" />
      </svg>

    </div>
  );
};
