import React from 'react';

const GridBackground = () => {
  return (
    <>
      {/* Light mode grid */}
      <div
        className="fixed inset-0 pointer-events-none z-0 dark:hidden"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px',
        }}
      />
      {/* Dark mode grid */}
      <div
        className="fixed inset-0 pointer-events-none z-0 hidden dark:block"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px',
        }}
      />
    </>
  );
};

export default GridBackground;
