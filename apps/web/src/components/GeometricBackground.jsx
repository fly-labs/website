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

      {/* Code brackets </> */}
      <svg
        className={`absolute top-[12%] left-[45%] w-12 h-10 md:w-14 md:h-12 text-foreground ${O} geo-float-3`}
        viewBox="0 0 48 36" fill="none"
      >
        <path d="M14 6 L4 18 L14 30" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M34 6 L44 18 L34 30" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M28 4 L20 32" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      </svg>

      {/* Rocket */}
      <svg
        className={`absolute bottom-[12%] right-[8%] w-12 h-14 md:w-14 md:h-16 text-foreground ${O} geo-drift`}
        viewBox="0 0 40 48" fill="none"
        style={{ rotate: '-15deg' }}
      >
        <path d="M20 4 C20 4 12 14 12 28 L16 32 L20 28 L24 32 L28 28 C28 14 20 4 20 4 Z" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="20" cy="18" r="2.5" stroke="currentColor" strokeWidth="0.9" />
        <path d="M12 28 L8 34 L14 32" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M28 28 L32 34 L26 32" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M17 36 L20 42 L23 36" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>

      {/* Bar chart */}
      <svg
        className={`absolute top-[45%] right-[15%] w-12 h-12 md:w-14 md:h-14 text-foreground ${O} geo-float-1`}
        viewBox="0 0 40 40" fill="none"
      >
        <path d="M6 36 L6 4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        <path d="M4 36 L38 36" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        <path d="M12 36 L12 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M20 36 L20 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M28 36 L28 20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M36 36 L36 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>

      {/* Gear / cog */}
      <svg
        className={`absolute bottom-[25%] left-[18%] w-12 h-12 md:w-14 md:h-14 text-foreground ${O} geo-spin`}
        viewBox="0 0 40 40" fill="none"
      >
        <circle cx="20" cy="20" r="6" stroke="currentColor" strokeWidth="1.1" />
        <path d="M20 2 L18 8 L22 8 Z M20 38 L22 32 L18 32 Z M2 20 L8 22 L8 18 Z M38 20 L32 18 L32 22 Z M7.5 7.5 L12 10.5 L10.5 12 Z M32.5 32.5 L28 29.5 L29.5 28 Z M32.5 7.5 L29.5 12 L28 10.5 Z M7.5 32.5 L10.5 28 L12 29.5 Z" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>

      {/* Terminal prompt >_ */}
      <svg
        className={`absolute top-[18%] left-[15%] w-12 h-10 md:w-14 md:h-12 text-foreground ${O} geo-float-2 hidden md:block`}
        viewBox="0 0 44 32" fill="none"
      >
        <rect x="2" y="2" width="40" height="28" rx="3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10 12 L16 16 L10 20" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M20 20 L30 20" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>

      {/* Dollar sign / coin */}
      <svg
        className={`absolute top-[60%] left-[10%] w-10 h-10 md:w-12 md:h-12 text-foreground ${O} geo-float-3 hidden md:block`}
        viewBox="0 0 36 36" fill="none"
      >
        <circle cx="18" cy="18" r="14" stroke="currentColor" strokeWidth="1.1" />
        <path d="M18 8 L18 28" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" />
        <path d="M14 13 C14 11 16 10 18 10 C20 10 22 11 22 13 C22 15.5 14 15.5 14 19 C14 21 16 22 18 22 C20 22 22 21 22 19" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
      </svg>

      {/* Brain */}
      <svg
        className={`absolute bottom-[8%] left-[45%] w-12 h-12 md:w-14 md:h-14 text-foreground ${O} geo-float-1 hidden md:block`}
        viewBox="0 0 40 40" fill="none"
      >
        <path d="M20 36 L20 20" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" />
        <path d="M12 28 C6 26 4 20 8 16 C4 12 8 6 14 6 C14 2 22 2 24 6 C30 4 36 8 34 14 C38 18 36 24 30 26 C32 30 28 34 24 34 L20 36 L16 34 C12 34 8 30 12 28 Z" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M20 20 C16 18 14 14 16 10" stroke="currentColor" strokeWidth="0.7" strokeLinecap="round" />
        <path d="M20 20 C24 18 26 14 24 10" stroke="currentColor" strokeWidth="0.7" strokeLinecap="round" />
      </svg>

      {/* Compass / target */}
      <svg
        className={`absolute top-[8%] right-[30%] w-10 h-10 md:w-12 md:h-12 text-foreground ${O} geo-drift hidden md:block`}
        viewBox="0 0 36 36" fill="none"
      >
        <circle cx="18" cy="18" r="14" stroke="currentColor" strokeWidth="1" />
        <circle cx="18" cy="18" r="8" stroke="currentColor" strokeWidth="0.8" />
        <circle cx="18" cy="18" r="2" stroke="currentColor" strokeWidth="0.9" />
        <path d="M18 2 L18 6" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" />
        <path d="M18 30 L18 34" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" />
        <path d="M2 18 L6 18" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" />
        <path d="M30 18 L34 18" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" />
      </svg>

    </div>
  );
};
