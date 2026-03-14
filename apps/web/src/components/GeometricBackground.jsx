import React from 'react';

// Simpsons-chalkboard-quality doodles: thick wobbly lines, imperfect shapes, personality.
// Visible but not competing with content. Color-tinted for warmth.

// Opacity tiers (visible, not distracting)
const HI = 'opacity-[0.14] dark:opacity-[0.18]';  // hero doodles
const MD = 'opacity-[0.10] dark:opacity-[0.14]';  // supporting doodles
const LO = 'opacity-[0.07] dark:opacity-[0.10]';  // background texture

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

      {/* ── Erlenmeyer flask (big, top-left hero) ── */}
      <svg
        className={`absolute top-[3%] left-[4%] w-16 h-20 md:w-20 md:h-24 text-primary ${HI} geo-drift`}
        viewBox="0 0 48 60" fill="none"
        style={{ rotate: '-8deg' }}
      >
        <path d="M18 4 L18 22 C18 22 6 36 7 46 C8 54 16 56 24 56 C32 56 40 54 41 46 C42 36 30 22 30 22 L30 4" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14 4 L34 4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M12 42 C16 38 20 44 24 40 C28 36 32 42 36 40" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        {/* Bubbles */}
        <circle cx="20" cy="46" r="2" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="28" cy="42" r="1.5" stroke="currentColor" strokeWidth="1.2" />
        <circle cx="24" cy="36" r="1" stroke="currentColor" strokeWidth="1" />
      </svg>

      {/* ── Paper plane (mid-right, classic Bart) ── */}
      <svg
        className={`absolute top-[12%] right-[6%] w-14 h-14 md:w-18 md:h-18 text-foreground ${HI} geo-float-1`}
        viewBox="0 0 56 56" fill="none"
        style={{ rotate: '18deg' }}
      >
        <path d="M6 46 L48 28 L6 8 L16 28 Z" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16 28 L48 28" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeDasharray="4 4" />
        {/* Motion lines */}
        <path d="M2 20 L8 22" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M0 28 L6 28" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M2 36 L8 34" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>

      {/* ── Beaker with liquid (left side) ── */}
      <svg
        className={`absolute top-[28%] left-[7%] w-12 h-16 md:w-14 md:h-18 text-secondary ${MD} geo-float-2`}
        viewBox="0 0 36 48" fill="none"
        style={{ rotate: '5deg' }}
      >
        <path d="M8 4 L8 32 C8 40 12 44 18 44 C24 44 28 40 28 32 L28 4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 4 L31 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M10 28 L26 28" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeDasharray="3 2" />
        {/* Measurement lines */}
        <path d="M26 14 L30 14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M26 20 L30 20" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M26 26 L30 26" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>

      {/* ── Light bulb with rays (right side, idea moment) ── */}
      <svg
        className={`absolute top-[35%] right-[12%] w-14 h-18 md:w-16 md:h-20 text-accent ${HI} geo-float-3`}
        viewBox="0 0 44 56" fill="none"
      >
        <path d="M22 10 C14 10 8 16 8 24 C8 30 12 34 14 38 L14 42 L30 42 L30 38 C32 34 36 30 36 24 C36 16 30 10 22 10 Z" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16 42 L16 46 C16 48 18 50 22 50 C26 50 28 48 28 46 L28 42" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M18 46 L26 46" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        {/* Filament */}
        <path d="M18 24 C18 20 22 18 22 22 C22 26 26 24 26 20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        {/* Rays */}
        <path d="M22 2 L22 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M38 10 L35 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M6 10 L9 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M42 24 L38 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M2 24 L6 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>

      {/* ── Rocket (big, bottom-right) ── */}
      <svg
        className={`absolute bottom-[8%] right-[5%] w-14 h-20 md:w-16 md:h-24 text-primary ${HI} geo-drift`}
        viewBox="0 0 40 60" fill="none"
        style={{ rotate: '-15deg' }}
      >
        <path d="M20 4 C20 4 10 16 10 34 L14 38 L20 34 L26 38 L30 34 C30 16 20 4 20 4 Z" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="20" cy="20" r="4" stroke="currentColor" strokeWidth="2" />
        <circle cx="20" cy="20" r="1.5" fill="currentColor" />
        {/* Fins */}
        <path d="M10 30 L4 36 L10 34" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M30 30 L36 36 L30 34" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        {/* Exhaust */}
        <path d="M16 42 L20 52 L24 42" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M18 46 L20 56 L22 46" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M19 50 L20 58 L21 50" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      </svg>

      {/* ── Atom (center-left area) ── */}
      <svg
        className={`absolute top-[52%] left-[3%] w-14 h-14 md:w-18 md:h-18 text-accent ${MD} geo-spin`}
        viewBox="0 0 48 48" fill="none"
      >
        <circle cx="24" cy="24" r="3.5" fill="currentColor" />
        <ellipse cx="24" cy="24" rx="20" ry="8" stroke="currentColor" strokeWidth="1.8" />
        <ellipse cx="24" cy="24" rx="20" ry="8" stroke="currentColor" strokeWidth="1.8" transform="rotate(60 24 24)" />
        <ellipse cx="24" cy="24" rx="20" ry="8" stroke="currentColor" strokeWidth="1.8" transform="rotate(120 24 24)" />
      </svg>

      {/* ── DNA helix (tall, right side) ── */}
      <svg
        className={`absolute top-[55%] right-[25%] w-10 h-24 md:w-12 md:h-28 text-secondary ${MD} geo-float-1 hidden md:block`}
        viewBox="0 0 28 72" fill="none"
      >
        <path d="M6 4 C6 4 22 12 22 18 C22 24 6 30 6 36 C6 42 22 48 22 54 C22 60 6 66 6 68" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M22 4 C22 4 6 12 6 18 C6 24 22 30 22 36 C22 42 6 48 6 54 C6 60 22 66 22 68" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        {/* Rungs */}
        <path d="M10 11 L18 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M8 25 L20 25" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M10 39 L18 39" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M8 53 L20 53" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>

      {/* ── Test tube (tilted, top area) ── */}
      <svg
        className={`absolute top-[18%] left-[30%] w-8 h-18 md:w-10 md:h-22 text-foreground ${MD} geo-float-3 hidden md:block`}
        viewBox="0 0 20 52" fill="none"
        style={{ rotate: '25deg' }}
      >
        <path d="M6 6 L6 38 C6 44 10 48 14 44 L14 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3 6 L17 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M8 30 L12 30" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        {/* Bubbles */}
        <circle cx="10" cy="36" r="1.5" stroke="currentColor" strokeWidth="1" />
        <circle cx="8" cy="26" r="1" stroke="currentColor" strokeWidth="1" />
      </svg>

      {/* ── Stars cluster (hand-drawn, wobbly) ── */}
      <svg
        className={`absolute top-[8%] left-[48%] w-10 h-10 md:w-12 md:h-12 text-foreground ${MD} geo-float-2`}
        viewBox="0 0 40 40" fill="none"
      >
        {/* Big star */}
        <path d="M20 4 L23 14 L34 14 L26 21 L28 32 L20 26 L12 32 L14 21 L6 14 L17 14 Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>

      {/* ── Small star (sparkle) ── */}
      <svg
        className={`absolute bottom-[28%] left-[22%] w-8 h-8 md:w-10 md:h-10 text-primary ${LO} geo-float-1`}
        viewBox="0 0 28 28" fill="none"
      >
        <path d="M14 2 L16 10 L24 10 L18 15 L20 24 L14 19 L8 24 L10 15 L4 10 L12 10 Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>

      {/* ── Code brackets </> (builder symbol) ── */}
      <svg
        className={`absolute top-[40%] left-[42%] w-12 h-10 md:w-14 md:h-12 text-foreground ${MD} geo-float-2`}
        viewBox="0 0 48 36" fill="none"
      >
        <path d="M14 4 L4 18 L14 32" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M34 4 L44 18 L34 32" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M28 2 L20 34" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>

      {/* ── Gear / cog (engineering) ── */}
      <svg
        className={`absolute bottom-[18%] left-[48%] w-12 h-12 md:w-14 md:h-14 text-foreground ${LO} geo-spin hidden md:block`}
        viewBox="0 0 40 40" fill="none"
      >
        <circle cx="20" cy="20" r="7" stroke="currentColor" strokeWidth="2" />
        <circle cx="20" cy="20" r="3" fill="currentColor" />
        {/* Teeth */}
        <path d="M18 2 L22 2 L22 8 L18 8 Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M18 32 L22 32 L22 38 L18 38 Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M2 18 L2 22 L8 22 L8 18 Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M32 18 L32 22 L38 22 L38 18 Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M7 7 L10 10 L14 6 L11 3 Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
        <path d="M26 30 L29 33 L33 29 L30 26 Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
        <path d="M30 7 L33 10 L29 14 L26 11 Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
        <path d="M7 26 L10 29 L14 33 L11 30 Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      </svg>

      {/* ── Bar chart (growing, finance brain) ── */}
      <svg
        className={`absolute top-[68%] right-[15%] w-12 h-12 md:w-14 md:h-14 text-primary ${MD} geo-float-3 hidden md:block`}
        viewBox="0 0 40 40" fill="none"
      >
        <path d="M4 36 L4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M4 36 L38 36" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <rect x="8" y="24" width="5" height="12" rx="1" stroke="currentColor" strokeWidth="1.6" fill="currentColor" fillOpacity="0.15" />
        <rect x="16" y="16" width="5" height="20" rx="1" stroke="currentColor" strokeWidth="1.6" fill="currentColor" fillOpacity="0.2" />
        <rect x="24" y="20" width="5" height="16" rx="1" stroke="currentColor" strokeWidth="1.6" fill="currentColor" fillOpacity="0.15" />
        <rect x="32" y="8" width="5" height="28" rx="1" stroke="currentColor" strokeWidth="1.6" fill="currentColor" fillOpacity="0.25" />
        {/* Trend arrow */}
        <path d="M10 22 L18 14 L26 18 L34 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="3 2" />
      </svg>

      {/* ── Squiggly arrow (chalk doodle) ── */}
      <svg
        className={`absolute top-[22%] right-[32%] w-16 h-10 md:w-20 md:h-12 text-foreground ${LO} geo-float-3 hidden md:block`}
        viewBox="0 0 64 32" fill="none"
      >
        <path d="M4 24 C12 8 22 28 32 14 C42 0 52 22 58 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M54 8 L58 12 L54 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>

      {/* ── Tic-tac-toe (Bart's boredom) ── */}
      <svg
        className={`absolute top-[75%] left-[8%] w-14 h-14 md:w-16 md:h-16 text-foreground ${MD} geo-float-1 hidden md:block`}
        viewBox="0 0 40 40" fill="none"
      >
        {/* Grid */}
        <path d="M14 4 L14 36" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M26 4 L26 36" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M4 14 L36 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M4 26 L36 26" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        {/* X */}
        <path d="M6 6 L12 12 M12 6 L6 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        {/* O */}
        <circle cx="32" cy="9" r="4" stroke="currentColor" strokeWidth="1.8" />
        {/* X */}
        <path d="M18 18 L24 24 M24 18 L18 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>

      {/* ── Smiley face (personality) ── */}
      <svg
        className={`absolute bottom-[4%] left-[32%] w-12 h-12 md:w-14 md:h-14 text-accent ${MD} geo-float-2 hidden md:block`}
        viewBox="0 0 36 36" fill="none"
      >
        <circle cx="18" cy="18" r="15" stroke="currentColor" strokeWidth="2.2" />
        <circle cx="12" cy="14" r="2" fill="currentColor" />
        <circle cx="24" cy="14" r="2" fill="currentColor" />
        <path d="M11 22 C13 27 23 27 25 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>

      {/* ── Lightning bolt (energy) ── */}
      <svg
        className={`absolute top-[5%] left-[70%] w-10 h-14 md:w-12 md:h-16 text-foreground ${LO} geo-float-1`}
        viewBox="0 0 28 42" fill="none"
      >
        <path d="M16 2 L6 18 L14 18 L12 40 L24 20 L16 20 Z" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>

      {/* ── E=mc² (chalk scribble) ── */}
      <svg
        className={`absolute bottom-[38%] right-[6%] w-18 h-8 md:w-22 md:h-10 text-foreground ${LO} geo-float-2 hidden md:block`}
        viewBox="0 0 72 28" fill="none"
      >
        <text x="4" y="22" fontFamily="serif" fontSize="18" fontStyle="italic" stroke="currentColor" fill="none" strokeWidth="1.2">E=mc²</text>
      </svg>

      {/* ── Dotted trail (connecting element) ── */}
      <svg
        className={`absolute top-[88%] left-[5%] w-28 h-6 md:w-36 md:h-8 text-foreground ${LO} geo-drift hidden md:block`}
        viewBox="0 0 120 20" fill="none"
      >
        <path d="M4 16 C24 2 44 18 64 8 C84 -2 100 14 116 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeDasharray="5 5" />
      </svg>

      {/* ── Planet with ring ── */}
      <svg
        className={`absolute top-[82%] right-[38%] w-12 h-12 md:w-14 md:h-14 text-secondary ${LO} geo-spin hidden md:block`}
        viewBox="0 0 40 40" fill="none"
      >
        <circle cx="20" cy="20" r="9" stroke="currentColor" strokeWidth="2" />
        <circle cx="20" cy="20" r="3" fill="currentColor" fillOpacity="0.3" />
        <ellipse cx="20" cy="20" rx="18" ry="6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" transform="rotate(-25 20 20)" />
      </svg>

      {/* ── Exclamation marks (!!!) ── */}
      <svg
        className={`absolute bottom-[50%] left-[18%] w-10 h-12 md:w-12 md:h-14 text-foreground ${LO} geo-float-2 hidden md:block`}
        viewBox="0 0 36 40" fill="none"
      >
        <path d="M10 4 L10 22" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="10" cy="30" r="2.5" fill="currentColor" />
        <path d="M22 6 L22 24" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="22" cy="32" r="2.5" fill="currentColor" />
      </svg>

      {/* ── Checkbox (done!) ── */}
      <svg
        className={`absolute bottom-[22%] right-[42%] w-10 h-10 md:w-12 md:h-12 text-primary ${LO} geo-float-1`}
        viewBox="0 0 32 32" fill="none"
      >
        <rect x="3" y="3" width="26" height="26" rx="4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 16 L14 21 L23 11" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>

    </div>
  );
};
