
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
        viewBox="0 0 120 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg" 
        className="w-full h-full drop-shadow-md overflow-visible"
      >
        {/* Face Outline - slightly imperfect circle for handcrafted feel */}
        <path 
          d="M50 10 C25 10 10 30 10 50 C10 75 25 90 50 90 C75 90 90 75 90 50 C90 25 75 10 50 10 Z" 
          stroke="currentColor" 
          strokeWidth="6" 
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-foreground" 
        />
        
        {/* Eyes */}
        <circle cx="35" cy="42" r="5" fill="currentColor" className="text-foreground" />
        <circle cx="60" cy="42" r="5" fill="currentColor" className="text-foreground" />
        
        {/* Smile - slightly asymmetrical */}
        <path 
          d="M 30 60 Q 45 72 65 58" 
          stroke="currentColor" 
          strokeWidth="6" 
          strokeLinecap="round" 
          className="text-foreground"
        />
        
        {/* Lateral Bubblegum (coming out of the side of the mouth) */}
        <motion.g
          animate={{ scale: [1, 1.08, 1], x: [0, 2, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          style={{ originX: "75px", originY: "65px" }}
        >
          <circle 
            cx="82" 
            cy="65" 
            r="24" 
            fill="#FF69B4" 
            stroke="currentColor" 
            strokeWidth="3" 
            className="text-foreground"
          />
          {/* Bubblegum highlight */}
          <path 
            d="M 72 55 Q 78 50 88 52" 
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
