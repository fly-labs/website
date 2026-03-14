import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X } from 'lucide-react';
import { cn } from '@/lib/utils.js';

export function FlyBotTrigger({ isOpen, onToggle, limitReached }) {
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

  return (
    <button
      onClick={onToggle}
      className={cn(
        'fixed z-[55] w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-colors',
        'bottom-[max(1.5rem,env(safe-area-inset-bottom))] right-4 sm:right-6',
        isOpen
          ? 'bg-muted text-muted-foreground hover:bg-muted/80'
          : limitReached
            ? 'bg-amber-500 text-white flybot-trigger-amber'
            : 'bg-primary text-primary-foreground flybot-trigger-pulse'
      )}
      aria-label={isOpen ? 'Close FlyBot' : 'Open FlyBot'}
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
    </button>
  );
}
