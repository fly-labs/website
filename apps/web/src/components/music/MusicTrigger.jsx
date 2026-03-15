import React from 'react';
import { X, Headphones } from 'lucide-react';
import { cn } from '@/lib/utils.js';

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
      aria-label={isOpen ? 'Close music player' : isPlaying ? 'Music playing' : 'Open music player'}
      title="Music Player"
    >
      {isOpen ? (
        <X className="w-5 h-5" />
      ) : isPlaying ? (
        <EqualizerIcon />
      ) : (
        <Headphones className="w-6 h-6" />
      )}
    </button>
  );
}
