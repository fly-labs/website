import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X } from 'lucide-react';
import { cn } from '@/lib/utils.js';

const STORAGE_KEY = 'flybot-trigger-pos';

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

export function FlyBotTrigger({ isOpen, onToggle, limitReached }) {
  const constraintsRef = useRef(null);
  const [wasDragged, setWasDragged] = useState(false);
  const [position, setPosition] = useState(loadPosition);

  // Cmd+K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        const tag = document.activeElement?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable) return;
        e.preventDefault();
        onToggle();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onToggle]);

  const handleDragEnd = useCallback((event, info) => {
    // Higher threshold to avoid accidental drags
    if (Math.abs(info.offset.x) > 10 || Math.abs(info.offset.y) > 10) {
      setWasDragged(true);
      // Save the final position
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

  // If we have a saved position, use x/y style; otherwise use CSS classes for default position
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
          'fixed z-[55] w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-colors cursor-grab active:cursor-grabbing',
          !position && 'bottom-[max(1.5rem,env(safe-area-inset-bottom))] right-4 sm:right-6',
          isOpen
            ? 'bg-muted text-muted-foreground hover:bg-muted/80'
            : limitReached
              ? 'bg-amber-500 text-white flybot-trigger-amber'
              : 'bg-primary text-primary-foreground flybot-trigger-pulse'
        )}
        style={{ touchAction: 'none', ...positionStyle }}
        aria-label={isOpen ? 'Close FlyBot' : 'Open FlyBot'}
        title="FlyBot AI Assistant (Ctrl+K) - drag to reposition"
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
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="bot"
              initial={{ opacity: 0, rotate: 90, scale: 0.8 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: -90, scale: 0.8 }}
              transition={{ duration: 0.15 }}
            >
              <Bot className="w-6 h-6" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </>
  );
}
