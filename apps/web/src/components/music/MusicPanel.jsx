import React, { useRef, useEffect, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Volume1, X } from 'lucide-react';
import { cn } from '@/lib/utils.js';
import { useMusic } from '@/contexts/MusicContext.jsx';

function formatTime(seconds, showDash = false) {
  if (!seconds || !isFinite(seconds)) return showDash ? '--:--' : '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// Canvas-based frequency visualizer with DPR scaling and color caching
function Visualizer({ analyserRef, isPlaying }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const colorRef = useRef(null);
  const barsRef = useRef(Array(16).fill(0));
  const prefersReducedMotion = useRef(
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  );

  // Cache accent color, update on theme change
  useEffect(() => {
    const updateColor = () => {
      const style = getComputedStyle(document.documentElement);
      const accent = style.getPropertyValue('--accent').trim();
      colorRef.current = accent ? `hsl(${accent})` : '#8b5cf6';
    };
    updateColor();
    const observer = new MutationObserver(updateColor);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Handle DPR + resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  const hasDrawnIdleRef = useRef(false);

  const drawBars = useCallback((ctx, width, height, barWidth, color, idle) => {
    const barCount = 16;
    const idleHeights = [0.15, 0.22, 0.18, 0.25, 0.20, 0.28, 0.16, 0.23, 0.19, 0.26, 0.17, 0.24, 0.21, 0.27, 0.14, 0.22];

    for (let i = 0; i < barCount; i++) {
      let barHeight, alpha;
      if (idle) {
        barHeight = height * (idleHeights[i] || 0.2);
        alpha = 0.2;
      } else {
        const value = barsRef.current[i];
        barHeight = Math.max(height * 0.06, value * height * 0.95);
        alpha = 0.4 + value * 0.6;
      }

      const x = i * (barWidth + 2);
      const y = height - barHeight;
      const radius = Math.min(barWidth / 2, 3);

      ctx.fillStyle = color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(x, y, barWidth, barHeight, radius);
      } else {
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + barWidth - radius, y);
        ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
        ctx.lineTo(x + barWidth, y + barHeight - radius);
        ctx.quadraticCurveTo(x + barWidth, y + barHeight, x + barWidth - radius, y + barHeight);
        ctx.lineTo(x + radius, y + barHeight);
        ctx.quadraticCurveTo(x, y + barHeight, x, y + barHeight - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
      }
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef?.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;
    ctx.clearRect(0, 0, width, height);

    const barCount = 16;
    const totalGap = (barCount - 1) * 2;
    const barWidth = (width - totalGap) / barCount;
    const color = colorRef.current || '#8b5cf6';

    if (analyser && isPlaying && !prefersReducedMotion.current) {
      hasDrawnIdleRef.current = false;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(dataArray);

      for (let i = 0; i < barCount; i++) {
        const startBin = Math.floor(i * dataArray.length / barCount);
        const endBin = Math.floor((i + 1) * dataArray.length / barCount);
        let sum = 0;
        for (let b = startBin; b < endBin; b++) sum += dataArray[b];
        const avg = sum / (endBin - startBin) / 255;
        barsRef.current[i] = barsRef.current[i] * 0.7 + avg * 0.3;
      }

      // Check if bars still need to lerp down to idle
      const needsLerp = barsRef.current.some(v => v > 0.01);
      drawBars(ctx, width, height, barWidth, color, false);
      rafRef.current = requestAnimationFrame(draw);
    } else {
      // Lerp bars down to zero before drawing idle
      let stillAnimating = false;
      for (let i = 0; i < barCount; i++) {
        if (barsRef.current[i] > 0.01) {
          barsRef.current[i] *= 0.85;
          stillAnimating = true;
        } else {
          barsRef.current[i] = 0;
        }
      }

      if (stillAnimating) {
        drawBars(ctx, width, height, barWidth, color, false);
        rafRef.current = requestAnimationFrame(draw);
      } else if (!hasDrawnIdleRef.current) {
        drawBars(ctx, width, height, barWidth, color, true);
        hasDrawnIdleRef.current = true;
        // No more RAF needed, idle bars are static
      }
    }
  }, [analyserRef, isPlaying, drawBars]);

  useEffect(() => {
    if (prefersReducedMotion.current) return;
    hasDrawnIdleRef.current = false;
    rafRef.current = requestAnimationFrame(draw);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [draw]);

  if (prefersReducedMotion.current) return null;

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-10 rounded"
    />
  );
}

// Progress bar with drag-to-seek, touch support, and scrubber thumb
function ProgressBar({ progress, duration, currentTime, onSeek }) {
  const barRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragProgress, setDragProgress] = useState(0);

  const getProgressFromEvent = useCallback((e) => {
    const rect = barRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  }, []);

  const handlePointerDown = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
    const p = getProgressFromEvent(e);
    setDragProgress(p);
    onSeek(p);
  }, [getProgressFromEvent, onSeek]);

  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e) => {
      const p = getProgressFromEvent(e);
      setDragProgress(p);
      onSeek(p);
    };
    const handleUp = () => setIsDragging(false);

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleMove, { passive: true });
    window.addEventListener('touchend', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };
  }, [isDragging, getProgressFromEvent, onSeek]);

  const displayProgress = isDragging ? dragProgress : progress;
  const remaining = duration - currentTime;

  return (
    <div className="mb-2">
      <div
        ref={barRef}
        onMouseDown={handlePointerDown}
        onTouchStart={handlePointerDown}
        className="relative py-3 cursor-pointer group select-none touch-none"
        role="slider"
        aria-label="Track progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(displayProgress * 100)}
      >
        {/* Track */}
        <div className="h-1 bg-muted rounded-full relative group-hover:h-1.5 transition-[height] duration-150">
          {/* Fill */}
          <div
            className="absolute inset-y-0 left-0 bg-accent rounded-full"
            style={{ width: `${displayProgress * 100}%` }}
          />
          {/* Scrubber thumb */}
          <div
            className={cn(
              'absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-accent shadow-sm',
              'opacity-60 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-150',
              isDragging && 'opacity-100 scale-110'
            )}
            style={{ left: `calc(${displayProgress * 100}% - 6px)` }}
          />
        </div>
      </div>
      <div className="flex justify-between -mt-1.5">
        <span className="text-[10px] text-muted-foreground tabular-nums">{duration === 0 ? '--:--' : formatTime(currentTime)}</span>
        <span className="text-[10px] text-muted-foreground tabular-nums">{duration === 0 ? '--:--' : `-${formatTime(remaining)}`}</span>
      </div>
    </div>
  );
}

export function MusicPanel({ isOpen, onClose }) {
  const {
    isPlaying,
    currentTrack,
    volume,
    progress,
    duration,
    currentTime,
    pendingPlay,
    trackTransition,
    trackError,
    isIOSDevice,
    analyserRef,
    trackCount,
    currentTrackIndex,
    togglePlay,
    next,
    prev,
    setVolume,
    seekTo,
  } = useMusic();

  const panelRef = useRef(null);
  const previousVolumeRef = useRef(volume);

  // Escape key to close, spacebar to toggle play/pause
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === ' ' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose, togglePlay]);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        // Don't close if clicking the trigger button
        const trigger = e.target.closest('[aria-label*="music player"]');
        if (trigger) return;
        onClose();
      }
    };
    // Delay to avoid closing on the same click that opened
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClick);
    }, 100);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [isOpen, onClose]);

  const handleVolumeChange = useCallback((e) => {
    setVolume(parseFloat(e.target.value));
  }, [setVolume]);

  const toggleMute = useCallback(() => {
    if (volume > 0) {
      previousVolumeRef.current = volume;
      setVolume(0);
    } else {
      setVolume(previousVolumeRef.current || 0.5);
    }
  }, [volume, setVolume]);

  const VolumeIcon = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={panelRef}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className={cn(
            'fixed z-[60] left-4 sm:left-6',
            'bottom-[calc(max(1.5rem,env(safe-area-inset-bottom))+3.5rem)]',
            'w-[calc(100vw-2rem)] sm:w-80',
            'bg-background/80 backdrop-blur-xl border border-border/50 rounded-2xl',
            'shadow-[0_8px_32px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)]',
            'dark:shadow-[0_8px_32px_rgba(0,0,0,0.3),0_2px_8px_rgba(0,0,0,0.2)]',
            'p-4'
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-medium text-muted-foreground tracking-wide uppercase">Vibe Coding</span>
            <button
              onClick={onClose}
              className="p-2.5 -m-2.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close music player"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {!currentTrack ? (
            <p className="text-xs text-muted-foreground text-center py-4">
              No tracks loaded.
            </p>
          ) : (
            <>
              {/* Track error feedback */}
              <AnimatePresence>
                {trackError && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-[10px] text-red-400 mb-1"
                  >
                    Couldn't load {trackError}, skipping...
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Track info with transition */}
              <div className={cn(
                'mb-3 transition-opacity duration-200',
                trackTransition ? 'opacity-0' : 'opacity-100'
              )}>
                <p className="text-sm font-semibold truncate">{currentTrack.title}</p>
                <p className="text-xs text-muted-foreground truncate">{currentTrack.artist}</p>
              </div>

              {/* Visualizer */}
              <div className="mb-3">
                <Visualizer analyserRef={analyserRef} isPlaying={isPlaying} />
              </div>

              {/* Progress bar with drag-to-seek */}
              <ProgressBar
                progress={progress}
                duration={duration}
                currentTime={currentTime}
                onSeek={seekTo}
              />

              {/* Controls */}
              <div className="flex justify-center items-center gap-1 mb-3">
                <button
                  onClick={prev}
                  className="p-3 rounded-lg text-foreground/60 hover:text-foreground transition-colors"
                  aria-label="Previous track"
                >
                  <SkipBack className="w-[18px] h-[18px]" />
                </button>

                <motion.button
                  onClick={togglePlay}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className={cn(
                    'w-11 h-11 rounded-full flex items-center justify-center',
                    'bg-accent text-accent-foreground',
                    'shadow-sm hover:shadow-md transition-shadow',
                    pendingPlay && 'animate-pulse'
                  )}
                  aria-label={pendingPlay ? 'Tap to start' : isPlaying ? 'Pause' : 'Play'}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {isPlaying ? (
                      <motion.div
                        key="pause"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ duration: 0.1 }}
                      >
                        <Pause className="w-5 h-5" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="play"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ duration: 0.1 }}
                      >
                        <Play className="w-5 h-5 ml-0.5" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>

                <button
                  onClick={next}
                  className="p-3 rounded-lg text-foreground/60 hover:text-foreground transition-colors"
                  aria-label="Next track"
                >
                  <SkipForward className="w-[18px] h-[18px]" />
                </button>
              </div>

              {/* Volume */}
              {isIOSDevice ? (
                <div className="flex items-center gap-2 justify-center py-1">
                  <VolumeIcon className="w-4 h-4 text-muted-foreground/50" />
                  <span className="text-[10px] text-muted-foreground/50">Use device volume</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleMute}
                    className="p-3 -m-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                    aria-label={volume === 0 ? 'Unmute' : 'Mute'}
                  >
                    <VolumeIcon className="w-4 h-4" />
                  </button>
                  <div className="flex-1 relative">
                    {/* Volume fill track (behind the input) */}
                    <div className="absolute inset-y-0 left-0 right-0 flex items-center pointer-events-none">
                      <div className="w-full h-1.5 rounded-full bg-muted relative overflow-hidden">
                        <div
                          className="absolute inset-y-0 left-0 bg-accent/50 rounded-full"
                          style={{ width: `${volume * 100}%` }}
                        />
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={volume}
                      onChange={handleVolumeChange}
                      className="relative w-full h-1.5 appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:relative [&::-webkit-slider-thumb]:z-10 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-accent [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-sm [&::-moz-range-track]:bg-transparent"
                      aria-label="Volume"
                    />
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="flex justify-between mt-3 pt-2 border-t border-border/20">
                <span className="text-[10px] text-muted-foreground/50 tabular-nums">
                  {currentTrackIndex + 1} / {trackCount}
                </span>
                <span className="text-[10px] text-muted-foreground/50">
                  lofi beats
                </span>
              </div>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
