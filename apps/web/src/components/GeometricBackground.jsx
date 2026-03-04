import React from 'react';
import { motion } from 'framer-motion';

const O = 'opacity-[0.08] dark:opacity-[0.15]';

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

      {/* ── Erlenmeyer Flask (tilted, with bubbles) ── */}
      <motion.svg
        className={`absolute top-[8%] right-[10%] w-20 h-20 md:w-28 md:h-28 text-foreground ${O}`}
        viewBox="0 0 100 100" fill="none"
        animate={{ y: [0, -6, 0], rotate: [0, 3, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      >
        <path d="M38 12 L38 42 L18 82 C16 86 19 92 24 92 L76 92 C81 92 84 86 82 82 L62 42 L62 12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <line x1="34" y1="12" x2="66" y2="12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M30 72 Q50 66 70 72" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" strokeDasharray="3 2" />
        <circle cx="45" cy="62" r="2" stroke="currentColor" strokeWidth="0.8" fill="none" />
        <circle cx="55" cy="56" r="1.5" stroke="currentColor" strokeWidth="0.8" fill="none" />
        <circle cx="50" cy="48" r="1" stroke="currentColor" strokeWidth="0.8" fill="none" />
      </motion.svg>

      {/* ── Beaker (with liquid level) ── */}
      <motion.svg
        className={`absolute bottom-[18%] left-[8%] w-16 h-16 md:w-22 md:h-22 text-foreground ${O}`}
        viewBox="0 0 80 100" fill="none"
        animate={{ y: [0, 5, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
      >
        <path d="M15 10 L15 85 C15 90 20 94 25 94 L55 94 C60 94 65 90 65 85 L65 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="15" y1="10" x2="65" y2="10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M18 60 L62 60" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" strokeDasharray="4 3" />
        <line x1="12" y1="30" x2="18" y2="30" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
        <line x1="12" y1="50" x2="18" y2="50" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
        <line x1="12" y1="70" x2="18" y2="70" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
      </motion.svg>

      {/* ── Test Tube (diagonal) ── */}
      <motion.svg
        className={`absolute top-[35%] left-[5%] w-14 h-14 md:w-18 md:h-18 text-foreground ${O}`}
        viewBox="0 0 80 100" fill="none"
        animate={{ rotate: [0, -5, 0], y: [0, 4, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      >
        <path d="M30 8 L30 70 C30 80 40 88 50 78 L50 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="26" y1="8" x2="54" y2="8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M32 55 Q40 50 48 55" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" strokeDasharray="3 2" />
      </motion.svg>

      {/* ── Atom / Orbital Symbol ── */}
      <motion.svg
        className={`absolute top-[55%] right-[7%] w-20 h-20 md:w-24 md:h-24 text-foreground ${O}`}
        viewBox="0 0 100 100" fill="none"
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      >
        <ellipse cx="50" cy="50" rx="40" ry="16" stroke="currentColor" strokeWidth="0.8" strokeDasharray="4 3" />
        <ellipse cx="50" cy="50" rx="40" ry="16" stroke="currentColor" strokeWidth="0.8" strokeDasharray="4 3" transform="rotate(60 50 50)" />
        <ellipse cx="50" cy="50" rx="40" ry="16" stroke="currentColor" strokeWidth="0.8" strokeDasharray="4 3" transform="rotate(120 50 50)" />
        <circle cx="50" cy="50" r="3" stroke="currentColor" strokeWidth="1" fill="none" />
      </motion.svg>

      {/* ── Light Bulb (idea) ── */}
      <motion.svg
        className={`absolute top-[15%] left-[42%] w-14 h-14 md:w-18 md:h-18 text-foreground ${O}`}
        viewBox="0 0 80 100" fill="none"
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      >
        <path d="M40 10 C22 10 12 26 12 38 C12 50 24 56 28 66 L28 74 L52 74 L52 66 C56 56 68 50 68 38 C68 26 58 10 40 10 Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="28" y1="80" x2="52" y2="80" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        <line x1="30" y1="86" x2="50" y2="86" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        <line x1="34" y1="92" x2="46" y2="92" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        {/* Rays */}
        <line x1="40" y1="0" x2="40" y2="5" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
        <line x1="65" y1="14" x2="62" y2="18" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
        <line x1="15" y1="14" x2="18" y2="18" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
      </motion.svg>

      {/* ── Hand-drawn Code Brackets { } ── */}
      <motion.svg
        className={`absolute top-[72%] right-[32%] w-16 h-10 md:w-20 md:h-12 text-foreground ${O}`}
        viewBox="0 0 120 60" fill="none"
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      >
        <path d="M20 8 C14 8 10 12 10 18 L10 24 C10 28 6 30 4 30 C6 30 10 32 10 36 L10 42 C10 48 14 52 20 52" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M100 8 C106 8 110 12 110 18 L110 24 C110 28 114 30 116 30 C114 30 110 32 110 36 L110 42 C110 48 106 52 100 52" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </motion.svg>

      {/* ── Curved Arrow Doodle ── */}
      <motion.svg
        className={`absolute top-[44%] left-[28%] w-20 h-8 md:w-28 md:h-10 text-foreground ${O}`}
        viewBox="0 0 140 40" fill="none"
        animate={{ x: [0, 6, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
      >
        <path d="M8 28 Q35 6 70 20 Q105 34 125 14" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeDasharray="5 3" />
        <path d="M118 8 L126 14 L118 22" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
      </motion.svg>

      {/* ── Hand-drawn Star / Sparkle ── */}
      <motion.svg
        className={`absolute bottom-[10%] right-[18%] w-10 h-10 md:w-14 md:h-14 text-foreground ${O}`}
        viewBox="0 0 60 60" fill="none"
        animate={{ rotate: [0, 90, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      >
        <path d="M30 6 L30 54" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        <path d="M6 30 L54 30" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        <path d="M14 14 L46 46" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
        <path d="M46 14 L14 46" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
      </motion.svg>

      {/* ── Squiggly Underline ── */}
      <motion.svg
        className={`absolute top-[78%] left-[38%] w-28 h-4 md:w-40 md:h-6 text-foreground ${O}`}
        viewBox="0 0 180 24" fill="none"
        animate={{ x: [0, 8, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      >
        <path d="M4 12 Q18 4 32 12 Q46 20 60 12 Q74 4 88 12 Q102 20 116 12 Q130 4 144 12 Q158 20 172 12" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeDasharray="4 3" />
      </motion.svg>

      {/* ── Small "x = y" Equation ── */}
      <motion.div
        className={`absolute bottom-[38%] left-[16%] text-foreground ${O} font-mono text-lg md:text-xl select-none`}
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
      >{'x = y'}</motion.div>

      {/* ── Small Flask Outline (top left area) ── */}
      <motion.svg
        className={`absolute top-[25%] right-[40%] w-10 h-10 md:w-12 md:h-12 text-foreground ${O}`}
        viewBox="0 0 50 60" fill="none"
        animate={{ y: [0, 5, 0], rotate: [0, -4, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      >
        <path d="M18 6 L18 22 L8 48 C6 52 10 56 14 56 L36 56 C40 56 44 52 42 48 L32 22 L32 6" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="15" y1="6" x2="35" y2="6" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      </motion.svg>

      {/* ── DNA-like Double Helix snippet ── */}
      <motion.svg
        className={`absolute bottom-[28%] right-[4%] w-6 h-24 md:w-8 md:h-32 text-foreground ${O}`}
        viewBox="0 0 24 100" fill="none"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      >
        <path d="M4 8 Q12 20 20 28 Q12 36 4 48 Q12 60 20 68 Q12 76 4 88" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" strokeDasharray="3 4" />
        <path d="M20 8 Q12 20 4 28 Q12 36 20 48 Q12 60 4 68 Q12 76 20 88" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" strokeDasharray="3 4" />
      </motion.svg>

      {/* ═══════ NEW DOODLES (13-22) ═══════ */}

      {/* ── "function()" code text ── */}
      <motion.div
        className={`absolute top-[6%] left-[22%] text-foreground ${O} font-mono text-base md:text-lg select-none`}
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 17, repeat: Infinity, ease: 'easeInOut' }}
      >{'function()'}</motion.div>

      {/* ── "if / else" code text (hidden on mobile) ── */}
      <motion.div
        className={`absolute bottom-[14%] left-[35%] text-foreground ${O} font-mono text-base md:text-lg select-none hidden md:block`}
        animate={{ y: [0, 4, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      >{'if / else'}</motion.div>

      {/* ── "<div>" tag text ── */}
      <motion.div
        className={`absolute top-[62%] left-[48%] text-foreground ${O} font-mono text-base md:text-lg select-none`}
        animate={{ rotate: [0, 3, -3, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
      >{'<div>'}</motion.div>

      {/* ── "; ;" semicolons text ── */}
      <motion.div
        className={`absolute top-[20%] right-[28%] text-foreground ${O} font-mono text-base md:text-lg select-none`}
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut' }}
      >{'; ;'}</motion.div>

      {/* ── Rocket SVG ── */}
      <motion.svg
        className={`absolute bottom-[6%] left-[12%] w-14 h-14 md:w-18 md:h-18 text-foreground ${O}`}
        viewBox="0 0 80 100" fill="none"
        animate={{ y: [0, -6, 0], rotate: [0, 2, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
      >
        <path d="M40 10 C32 20 24 36 24 56 L40 68 L56 56 C56 36 48 20 40 10 Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="40" cy="38" r="5" stroke="currentColor" strokeWidth="1" fill="none" />
        <path d="M24 56 L16 68 L28 64" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M56 56 L64 68 L52 64" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M34 68 L34 78 L40 74 L46 78 L46 68" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
      </motion.svg>

      {/* ── Coffee Cup SVG ── */}
      <motion.svg
        className={`absolute top-[48%] right-[22%] w-14 h-14 md:w-18 md:h-18 text-foreground ${O}`}
        viewBox="0 0 80 80" fill="none"
        animate={{ y: [0, 4, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      >
        <path d="M16 28 L16 62 C16 68 22 72 30 72 L50 72 C58 72 64 68 64 62 L64 28" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="12" y1="28" x2="68" y2="28" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M64 36 L70 36 C74 36 76 40 76 44 C76 48 74 52 70 52 L64 52" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
        {/* Steam */}
        <path d="M30 20 Q32 14 30 8" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
        <path d="M40 18 Q42 12 40 6" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
        <path d="M50 20 Q52 14 50 8" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
      </motion.svg>

      {/* ── Game Controller SVG (hidden on mobile) ── */}
      <motion.svg
        className={`absolute bottom-[45%] right-[38%] w-16 h-12 md:w-20 md:h-14 text-foreground ${O} hidden md:block`}
        viewBox="0 0 100 60" fill="none"
        animate={{ rotate: [0, 3, -3, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      >
        <path d="M20 16 C10 16 4 24 4 32 C4 42 8 50 16 50 L28 50 L36 38 L64 38 L72 50 L84 50 C92 50 96 42 96 32 C96 24 90 16 80 16 Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        {/* D-pad */}
        <line x1="28" y1="26" x2="28" y2="38" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        <line x1="22" y1="32" x2="34" y2="32" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        {/* Buttons */}
        <circle cx="70" cy="28" r="3" stroke="currentColor" strokeWidth="0.8" fill="none" />
        <circle cx="78" cy="32" r="3" stroke="currentColor" strokeWidth="0.8" fill="none" />
      </motion.svg>

      {/* ── Microscope SVG ── */}
      <motion.svg
        className={`absolute top-[38%] right-[3%] w-14 h-14 md:w-18 md:h-18 text-foreground ${O}`}
        viewBox="0 0 70 90" fill="none"
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 19, repeat: Infinity, ease: 'easeInOut' }}
      >
        <path d="M30 14 L42 14 L42 52 L30 52 Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M36 52 L36 64" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M20 64 L52 64" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M14 78 L58 78" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M28 64 L28 78" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        <path d="M44 64 L44 78" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        <circle cx="36" cy="8" r="6" stroke="currentColor" strokeWidth="1" fill="none" />
        <path d="M48 40 L56 40" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      </motion.svg>

      {/* ── Benzene Ring SVG (hidden on mobile) ── */}
      <motion.svg
        className={`absolute bottom-[55%] left-[3%] w-14 h-14 md:w-18 md:h-18 text-foreground ${O} hidden md:block`}
        viewBox="0 0 80 80" fill="none"
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
      >
        <polygon points="40,10 68,25 68,55 40,70 12,55 12,25" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <circle cx="40" cy="40" r="14" stroke="currentColor" strokeWidth="0.8" strokeDasharray="4 3" fill="none" />
      </motion.svg>

      {/* ── "# TODO" text (hidden on mobile) ── */}
      <motion.div
        className={`absolute top-[85%] right-[12%] text-foreground ${O} font-mono text-base md:text-lg select-none hidden md:block`}
        animate={{ x: [0, 5, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
      >{'# TODO'}</motion.div>

      {/* ── Paper Plane 1 (top-left, drifting) ── */}
      <motion.svg
        className={`absolute top-[4%] left-[6%] w-12 h-12 md:w-16 md:h-16 text-foreground ${O}`}
        viewBox="0 0 60 60" fill="none"
        style={{ rotate: '-25deg' }}
        animate={{ x: [0, 10, 0], y: [0, -8, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
      >
        <path d="M30 6 L6 48 L30 36 L54 48 Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M30 6 L30 36" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        <path d="M6 48 L30 36 L54 48" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" strokeDasharray="3 2" />
      </motion.svg>

      {/* ── Paper Plane 2 (right side, side-view with trail) ── */}
      <motion.svg
        className={`absolute top-[68%] right-[12%] w-16 h-10 md:w-24 md:h-14 text-foreground ${O}`}
        viewBox="0 0 120 50" fill="none"
        animate={{ x: [0, 12, 0], y: [0, -6, 0], rotate: [0, -3, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      >
        <path d="M12 25 L80 8 L108 25 L80 20 Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M80 8 L80 20" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        {/* Trail */}
        <path d="M4 28 Q8 32 12 25" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" strokeDasharray="2 3" />
      </motion.svg>

      {/* ── Paper Plane 3 (center-left, hidden on mobile) ── */}
      <motion.svg
        className={`absolute bottom-[34%] left-[44%] w-10 h-10 md:w-14 md:h-14 text-foreground ${O} hidden md:block`}
        viewBox="0 0 60 60" fill="none"
        style={{ rotate: '15deg' }}
        animate={{ y: [0, -10, 0], x: [0, 6, 0], rotate: [15, 20, 15] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      >
        <path d="M30 8 L8 52 L30 40 L52 52 Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M30 8 L30 40" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      </motion.svg>

    </div>
  );
};
