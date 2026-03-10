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

      {/* Erlenmeyer flask */}
      <svg
        className={`absolute top-[8%] right-[10%] w-12 h-14 md:w-14 md:h-16 text-foreground ${O} geo-float-1`}
        viewBox="0 0 40 48" fill="none"
      >
        <path d="M16 4 L16 18 L6 40 C5 42 6.5 44 9 44 L31 44 C33.5 44 35 42 34 40 L24 18 L24 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M13 4 L27 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M10 34 L30 34" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" strokeDasharray="2 2" />
      </svg>

      {/* Beaker */}
      <svg
        className={`absolute bottom-[20%] left-[7%] w-10 h-14 md:w-12 md:h-16 text-foreground ${O} geo-float-2`}
        viewBox="0 0 36 48" fill="none"
      >
        <path d="M6 4 L6 38 C6 41 8 43 11 43 L25 43 C28 43 30 41 30 38 L30 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 4 L32 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M10 16 L26 16" stroke="currentColor" strokeWidth="0.6" strokeLinecap="round" />
        <path d="M10 24 L26 24" stroke="currentColor" strokeWidth="0.6" strokeLinecap="round" />
        <path d="M10 32 L26 32" stroke="currentColor" strokeWidth="0.6" strokeLinecap="round" />
        <circle cx="14" cy="36" r="1.5" stroke="currentColor" strokeWidth="0.8" />
        <circle cx="22" cy="38" r="1" stroke="currentColor" strokeWidth="0.8" />
        <circle cx="18" cy="34" r="1.2" stroke="currentColor" strokeWidth="0.8" />
      </svg>

      {/* Atom / Bohr model */}
      <svg
        className={`absolute top-[55%] right-[6%] w-14 h-14 md:w-16 md:h-16 text-foreground ${O} geo-spin`}
        viewBox="0 0 48 48" fill="none"
      >
        <circle cx="24" cy="24" r="2.5" stroke="currentColor" strokeWidth="1.2" />
        <ellipse cx="24" cy="24" rx="18" ry="7" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" />
        <ellipse cx="24" cy="24" rx="18" ry="7" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" transform="rotate(60 24 24)" />
        <ellipse cx="24" cy="24" rx="18" ry="7" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" transform="rotate(120 24 24)" />
      </svg>

      {/* Paper plane (kept from original) */}
      <svg
        className={`absolute top-[5%] left-[6%] w-12 h-12 md:w-14 md:h-14 text-foreground ${O} geo-drift`}
        viewBox="0 0 60 60" fill="none"
        style={{ rotate: '-25deg' }}
      >
        <path d="M30 6 L6 48 L30 36 L54 48 Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M30 6 L30 36" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      </svg>

      {/* Light bulb */}
      <svg
        className={`absolute bottom-[10%] right-[18%] w-10 h-12 md:w-12 md:h-14 text-foreground ${O} geo-float-3`}
        viewBox="0 0 32 40" fill="none"
      >
        <path d="M16 4 C10 4 5 9 5 15 C5 20 8 23 10 26 L10 30 L22 30 L22 26 C24 23 27 20 27 15 C27 9 22 4 16 4 Z" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 30 L12 33 C12 35 14 36 16 36 C18 36 20 35 20 33 L20 30" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 14 C12 11 14 9 16 9" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
      </svg>

      {/* DNA helix */}
      <svg
        className={`absolute top-[35%] left-[4%] w-8 h-20 md:w-10 md:h-24 text-foreground ${O} geo-float-1 hidden md:block`}
        viewBox="0 0 24 60" fill="none"
      >
        <path d="M4 4 C4 12 20 12 20 20 C20 28 4 28 4 36 C4 44 20 44 20 52" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        <path d="M20 4 C20 12 4 12 4 20 C4 28 20 28 20 36 C20 44 4 44 4 52" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        <path d="M7 12 L17 12" stroke="currentColor" strokeWidth="0.7" strokeLinecap="round" />
        <path d="M7 28 L17 28" stroke="currentColor" strokeWidth="0.7" strokeLinecap="round" />
        <path d="M7 44 L17 44" stroke="currentColor" strokeWidth="0.7" strokeLinecap="round" />
      </svg>

      {/* Test tube (angled) */}
      <svg
        className={`absolute top-[70%] left-[35%] w-10 h-14 md:w-12 md:h-16 text-foreground ${O} geo-float-2 hidden md:block`}
        viewBox="0 0 32 48" fill="none"
        style={{ rotate: '25deg' }}
      >
        <path d="M12 6 L12 34 C12 38 14 42 18 42 C22 42 24 38 24 34 L24 6" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 6 L27 6" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
        <circle cx="16" cy="34" r="1.2" stroke="currentColor" strokeWidth="0.7" />
        <circle cx="20" cy="30" r="0.9" stroke="currentColor" strokeWidth="0.7" />
        <circle cx="17" cy="28" r="0.7" stroke="currentColor" strokeWidth="0.7" />
      </svg>

    </div>
  );
};
