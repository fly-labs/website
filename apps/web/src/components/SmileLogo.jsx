
import React from 'react';
import { motion } from 'framer-motion';

export const SmileLogo = ({ className = "w-10 h-10" }) => {
  return (
    <motion.div 
      className={`relative flex items-center justify-center ${className}`}
      whileHover={{ scale: 1.05, rotate: -5 }}
      whileTap={{ scale: 0.95 }}
    >
      <svg
        viewBox="0 0 110 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-md overflow-visible"
      >
        {/* Face Outline - clean centered circle */}
        <circle
          cx="45"
          cy="50"
          r="38"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-foreground"
          fill="none"
        />

        {/* Eyes */}
        <circle cx="34" cy="42" r="5" fill="currentColor" className="text-foreground" />
        <circle cx="56" cy="42" r="5" fill="currentColor" className="text-foreground" />

        {/* Smile - slightly asymmetrical */}
        <path
          d="M 29 60 Q 42 72 62 58"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          className="text-foreground"
          fill="none"
        />

        {/* Lateral Bubblegum (coming out of the side of the mouth) */}
        <motion.g
          animate={{ scale: [1, 1.08, 1], x: [0, 2, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          style={{ originX: "82px", originY: "62px" }}
        >
          <circle
            cx="82"
            cy="62"
            r="22"
            fill="#FF69B4"
            stroke="currentColor"
            strokeWidth="3"
            className="text-foreground"
          />
          {/* Bubblegum highlight */}
          <path
            d="M 72 52 Q 78 47 88 49"
            stroke="#FFB6C1"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
        </motion.g>
      </svg>
    </motion.div>
  );
};
