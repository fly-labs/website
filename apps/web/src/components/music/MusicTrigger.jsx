import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Headphones } from 'lucide-react';
import { cn } from '@/lib/utils.js';

const STORAGE_KEY = 'music-trigger-pos';

function loadPosition() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return null;
}

function savePosition(pos) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(pos)); } catch {}
}

// Organic equalizer: 4 bars with staggered durations for natural feel
const BAR_CONFIG = [
  { delay: '0s', duration: '0.8s' },
  { delay: '0.15s', duration: '0.65s' },
  { delay: '0.05s', duration: '0.9s' },
  { delay: '0.25s', duration: '0.7s' },
];

function EqualizerIcon() {
  return (
    <div className="flex items-end gap-[2.5px] h-[16px]">
      {BAR_CONFIG.map((cfg, i) => (
        <div
          key={i}
          className="w-[2.5px] rounded-full bg-current music-eq-bar"
          style={{
            animationDelay: cfg.delay,
            animationDuration: cfg.duration,
          }}
        />
      ))}
    </div>
  );
}

export function MusicTrigger({ isOpen, isPlaying, onToggle }) {
  const constraintsRef = useRef(null);
  const [wasDragged, setWasDragged] = useState(false);
  const [position, setPosition] = useState(loadPosition);

  const handleDragEnd = useCallback((event, info) => {
    if (Math.abs(info.offset.x) > 10 || Math.abs(info.offset.y) > 10) {
      setWasDragged(true);
      const el = event.target.closest('button');
      if (el) {
        const rect = el.getBoundingClientRect();
        const pos = { x: rect.left, y: rect.top };
        setPosition(pos);
        savePosition(pos);
      }
      setTimeout(() => setWasDragged(false), 300);
    }
  }, []);

  const handleClick = useCallback(() => {
    if (!wasDragged) onToggle();
  }, [wasDragged, onToggle]);

  const positionStyle = position
    ? { left: position.x, top: position.y, right: 'auto', bottom: 'auto' }
    : {};

  return (
    <>
      <div ref={constraintsRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: -1 }} />
      <motion.button
        drag
        dragConstraints={constraintsRef}
        dragElastic={0.08}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        onClick={handleClick}
        className={cn(
          'fixed z-[55] w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-colors cursor-grab active:cursor-grabbing',
          !position && 'bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-4 sm:left-6',
          isOpen
            ? 'bg-muted text-muted-foreground hover:bg-muted/80'
            : isPlaying
              ? 'bg-accent/90 text-accent-foreground music-trigger-pulse'
              : 'bg-accent/90 text-accent-foreground hover:bg-accent'
        )}
        style={{ touchAction: 'none', ...positionStyle }}
        aria-label={isOpen ? 'Close music player' : isPlaying ? 'Music playing' : 'Open music player'}
        title="Music Player - drag to reposition"
        whileDrag={{ scale: 1.08, boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}
        whileTap={!wasDragged ? { scale: 0.92 } : undefined}
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
          ) : isPlaying ? (
            <motion.div
              key="eq"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
            >
              <EqualizerIcon />
            </motion.div>
          ) : (
            <motion.div
              key="headphones"
              initial={{ opacity: 0, rotate: 90, scale: 0.8 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: -90, scale: 0.8 }}
              transition={{ duration: 0.15 }}
            >
              <Headphones className="w-6 h-6" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </>
  );
}
