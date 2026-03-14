import React from 'react';

// Chalkboard doodle background inspired by school blackboards
// Paper planes, rockets, stars, equations, arrows, scribbles
// Visible but not distracting, works in both light and dark mode

const L = 'opacity-[0.06] dark:opacity-[0.08]'; // light doodles
const M = 'opacity-[0.04] dark:opacity-[0.06]'; // medium doodles (larger ones)

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

      {/* ── Paper plane 1 (large, top-left) ── */}
      <svg
        className={`absolute top-[4%] left-[5%] w-14 h-14 md:w-18 md:h-18 text-foreground ${M} geo-drift`}
        viewBox="0 0 60 60" fill="none"
        style={{ rotate: '-20deg' }}
      >
        <path d="M8 52 L52 30 L8 8 L18 30 Z" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M18 30 L52 30" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeDasharray="3 3" />
      </svg>

      {/* ── Paper plane 2 (small, mid-right) ── */}
      <svg
        className={`absolute top-[38%] right-[4%] w-10 h-10 md:w-12 md:h-12 text-foreground ${L} geo-float-1`}
        viewBox="0 0 40 40" fill="none"
        style={{ rotate: '15deg' }}
      >
        <path d="M6 34 L34 20 L6 6 L12 20 Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 20 L34 20" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
      </svg>

      {/* ── Paper plane 3 (tiny, bottom-left) ── */}
      <svg
        className={`absolute bottom-[15%] left-[12%] w-8 h-8 md:w-10 md:h-10 text-foreground ${L} geo-float-3`}
        viewBox="0 0 32 32" fill="none"
        style={{ rotate: '-35deg' }}
      >
        <path d="M4 28 L28 16 L4 4 L10 16 Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>

      {/* ── Rocket (Bart would draw this) ── */}
      <svg
        className={`absolute top-[10%] right-[12%] w-12 h-16 md:w-14 md:h-18 text-foreground ${L} geo-drift`}
        viewBox="0 0 36 48" fill="none"
        style={{ rotate: '-10deg' }}
      >
        <path d="M18 4 C18 4 10 14 10 28 L14 32 L18 28 L22 32 L26 28 C26 14 18 4 18 4 Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="18" cy="17" r="2.5" stroke="currentColor" strokeWidth="1" />
        <path d="M14 36 L18 42 L22 36" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M15 40 L18 46 L21 40" stroke="currentColor" strokeWidth="0.7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>

      {/* ── Star 1 (hand-drawn, wobbly) ── */}
      <svg
        className={`absolute top-[22%] left-[25%] w-8 h-8 md:w-10 md:h-10 text-foreground ${L} geo-float-2`}
        viewBox="0 0 32 32" fill="none"
      >
        <path d="M16 3 L19 12 L28 12 L21 18 L24 27 L16 22 L8 27 L11 18 L4 12 L13 12 Z" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
      </svg>

      {/* ── Star 2 (small) ── */}
      <svg
        className={`absolute bottom-[30%] right-[20%] w-6 h-6 md:w-8 md:h-8 text-foreground ${L} geo-float-1`}
        viewBox="0 0 24 24" fill="none"
      >
        <path d="M12 2 L14 9 L21 9 L16 13 L18 20 L12 16 L6 20 L8 13 L3 9 L10 9 Z" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
      </svg>

      {/* ── Star 3 (tiny sparkle) ── */}
      <svg
        className={`absolute top-[65%] left-[42%] w-5 h-5 md:w-6 md:h-6 text-foreground ${L} geo-float-3 hidden md:block`}
        viewBox="0 0 20 20" fill="none"
      >
        <path d="M10 2 L12 8 L18 8 L13 12 L15 18 L10 14 L5 18 L7 12 L2 8 L8 8 Z" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
      </svg>

      {/* ── Light bulb (idea!) ── */}
      <svg
        className={`absolute bottom-[8%] right-[10%] w-10 h-13 md:w-12 md:h-15 text-foreground ${L} geo-float-2`}
        viewBox="0 0 32 42" fill="none"
      >
        <path d="M16 4 C10 4 5 9 5 15 C5 20 8 23 10 26 L10 30 L22 30 L22 26 C24 23 27 20 27 15 C27 9 22 4 16 4 Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 30 L12 33 C12 35 14 36 16 36 C18 36 20 35 20 33 L20 30" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 14 C12 11 14 9 16 9" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
        {/* Rays */}
        <path d="M16 0 L16 2" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
        <path d="M28 7 L26 9" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
        <path d="M4 7 L6 9" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
      </svg>

      {/* ── E=mc² scribble ── */}
      <svg
        className={`absolute top-[48%] left-[3%] w-16 h-8 md:w-20 md:h-10 text-foreground ${M} geo-float-1 hidden md:block`}
        viewBox="0 0 64 24" fill="none"
      >
        <text x="4" y="18" fontFamily="serif" fontSize="14" fontStyle="italic" stroke="currentColor" fill="none" strokeWidth="0.8">E=mc²</text>
      </svg>

      {/* ── Squiggly arrow (chalk doodle) ── */}
      <svg
        className={`absolute top-[15%] right-[35%] w-14 h-8 md:w-16 md:h-10 text-foreground ${L} geo-float-3 hidden md:block`}
        viewBox="0 0 56 28" fill="none"
      >
        <path d="M4 20 C10 8 18 24 26 12 C34 0 42 20 50 10" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M46 6 L50 10 L46 14" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
      </svg>

      {/* ── Exclamation marks (!!!) ── */}
      <svg
        className={`absolute bottom-[40%] left-[30%] w-8 h-10 md:w-10 md:h-12 text-foreground ${L} geo-float-2 hidden md:block`}
        viewBox="0 0 32 36" fill="none"
      >
        <path d="M8 4 L8 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="8" cy="26" r="1.5" stroke="currentColor" strokeWidth="1" />
        <path d="M18 6 L18 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="18" cy="28" r="1.5" stroke="currentColor" strokeWidth="1" />
        <path d="M28 4 L28 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="28" cy="26" r="1.5" stroke="currentColor" strokeWidth="1" />
      </svg>

      {/* ── Tic-tac-toe (Bart's boredom) ── */}
      <svg
        className={`absolute top-[72%] right-[8%] w-12 h-12 md:w-14 md:h-14 text-foreground ${M} geo-float-1 hidden md:block`}
        viewBox="0 0 36 36" fill="none"
      >
        {/* Grid */}
        <path d="M12 4 L12 32" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" />
        <path d="M24 4 L24 32" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" />
        <path d="M4 12 L32 12" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" />
        <path d="M4 24 L32 24" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" />
        {/* X marks */}
        <path d="M6 6 L10 10 M10 6 L6 10" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        <path d="M18 18 L22 22 M22 18 L18 22" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        {/* O mark */}
        <circle cx="28" cy="8" r="3" stroke="currentColor" strokeWidth="1" />
      </svg>

      {/* ── Spiral / spring ── */}
      <svg
        className={`absolute top-[55%] left-[18%] w-8 h-16 md:w-10 md:h-20 text-foreground ${L} geo-float-3 hidden md:block`}
        viewBox="0 0 24 48" fill="none"
      >
        <path d="M12 4 C20 4 20 12 12 12 C4 12 4 20 12 20 C20 20 20 28 12 28 C4 28 4 36 12 36 C20 36 20 44 12 44" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      </svg>

      {/* ── Code brackets </> ── */}
      <svg
        className={`absolute top-[30%] left-[45%] w-10 h-8 md:w-12 md:h-10 text-foreground ${L} geo-float-2`}
        viewBox="0 0 44 32" fill="none"
      >
        <path d="M12 4 L4 16 L12 28" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M32 4 L40 16 L32 28" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M26 2 L18 30" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      </svg>

      {/* ── Checkbox (done!) ── */}
      <svg
        className={`absolute bottom-[22%] right-[30%] w-8 h-8 md:w-10 md:h-10 text-foreground ${L} geo-float-1`}
        viewBox="0 0 28 28" fill="none"
      >
        <rect x="3" y="3" width="22" height="22" rx="3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 14 L12 18 L20 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>

      {/* ── Bar chart ── */}
      <svg
        className={`absolute top-[42%] right-[18%] w-10 h-10 md:w-12 md:h-12 text-foreground ${M} geo-float-3 hidden md:block`}
        viewBox="0 0 36 36" fill="none"
      >
        <path d="M4 32 L4 4" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" />
        <path d="M4 32 L34 32" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" />
        <path d="M10 32 L10 22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M17 32 L17 14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M24 32 L24 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M31 32 L31 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>

      {/* ── Lightning bolt ── */}
      <svg
        className={`absolute top-[5%] left-[55%] w-8 h-12 md:w-10 md:h-14 text-foreground ${L} geo-float-1`}
        viewBox="0 0 24 36" fill="none"
      >
        <path d="M14 2 L6 16 L12 16 L10 34 L20 18 L14 18 Z" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
      </svg>

      {/* ── Smiley face ── */}
      <svg
        className={`absolute bottom-[5%] left-[38%] w-10 h-10 md:w-12 md:h-12 text-foreground ${M} geo-float-2 hidden md:block`}
        viewBox="0 0 32 32" fill="none"
      >
        <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="1.1" />
        <circle cx="11" cy="13" r="1.5" fill="currentColor" />
        <circle cx="21" cy="13" r="1.5" fill="currentColor" />
        <path d="M10 20 C12 24 20 24 22 20" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      </svg>

      {/* ── Paper plane trail (dotted path) ── */}
      <svg
        className={`absolute top-[85%] left-[5%] w-24 h-6 md:w-32 md:h-8 text-foreground ${M} geo-drift hidden md:block`}
        viewBox="0 0 100 20" fill="none"
      >
        <path d="M4 16 C20 4 40 18 60 8 C80 -2 90 12 96 6" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" strokeDasharray="4 4" />
      </svg>

      {/* ── Planet with ring ── */}
      <svg
        className={`absolute top-[78%] left-[60%] w-10 h-10 md:w-12 md:h-12 text-foreground ${L} geo-spin hidden md:block`}
        viewBox="0 0 36 36" fill="none"
      >
        <circle cx="18" cy="18" r="8" stroke="currentColor" strokeWidth="1.1" />
        <ellipse cx="18" cy="18" rx="16" ry="5" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" transform="rotate(-20 18 18)" />
      </svg>

      {/* ── Arrow pointing up ── */}
      <svg
        className={`absolute top-[60%] right-[40%] w-6 h-10 md:w-8 md:h-12 text-foreground ${L} geo-float-2 hidden md:block`}
        viewBox="0 0 20 32" fill="none"
      >
        <path d="M10 28 L10 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M4 10 L10 4 L16 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>

    </div>
  );
};
