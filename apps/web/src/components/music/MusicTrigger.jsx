import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils.js';

// Organic equalizer: 4 bars with staggered durations for natural feel
const BAR_CONFIG = [
  { delay: '0s', duration: '0.8s' },
  { delay: '0.15s', duration: '0.65s' },
  { delay: '0.05s', duration: '0.9s' },
  { delay: '0.25s', duration: '0.7s' },
];

function EqualizerIcon({ isPlaying }) {
  return (
    <div className="flex items-end gap-[2.5px] h-[14px]">
      {BAR_CONFIG.map((cfg, i) => (
        <div
          key={i}
          className={cn(
            'w-[2.5px] rounded-full bg-current',
            isPlaying ? 'music-eq-bar' : 'h-[5px] opacity-70'
          )}
          style={isPlaying ? {
            animationDelay: cfg.delay,
            animationDuration: cfg.duration,
          } : undefined}
        />
      ))}
    </div>
  );
}

export function MusicTrigger({ isOpen, isPlaying, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'fixed z-[55] w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-colors',
        'bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-4 sm:left-6',
        isOpen
          ? 'bg-muted text-muted-foreground hover:bg-muted/80'
          : isPlaying
            ? 'bg-accent/90 text-accent-foreground music-trigger-pulse'
            : 'bg-accent/90 text-accent-foreground hover:bg-accent'
      )}
      aria-label={isOpen ? 'Close music player' : 'Open music player'}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isOpen ? (
          <motion.div
            key="close"
            initial={{ opacity: 0, rotate: -90, scale: 0.8 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 90, scale: 0.8 }}
            transition={{ duration: 0.15 }}
          >
            <X className="w-5 h-5" />
          </motion.div>
        ) : (
          <motion.div
            key="eq"
            initial={{ opacity: 0, rotate: 90, scale: 0.8 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: -90, scale: 0.8 }}
            transition={{ duration: 0.15 }}
          >
            <EqualizerIcon isPlaying={isPlaying} />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}
