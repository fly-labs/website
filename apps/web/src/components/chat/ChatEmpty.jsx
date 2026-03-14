import React from 'react';
import { motion } from 'framer-motion';
import { Bot, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils.js';

const SUGGESTED_PROMPTS = [
  { text: 'Evaluate my business idea', icon: '/' },
  { text: 'Help me write a Substack Note', icon: '/' },
  { text: 'What makes a good vibe building project?', icon: '/' },
  { text: 'Help me craft a title for my article', icon: '/' },
  { text: 'Apply the finance brain to my decision', icon: '/' },
  { text: 'Compare ideas in your database', icon: '/' },
];

export function ChatEmpty({ onPromptClick, compact = false }) {
  const prompts = compact ? SUGGESTED_PROMPTS.slice(0, 3) : SUGGESTED_PROMPTS;

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className={compact ? 'max-w-sm w-full' : 'max-w-lg w-full'}>
        {/* Logo + title */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className={compact ? 'text-center mb-6' : 'text-center mb-10'}
        >
          <div className={cn(
            'inline-flex items-center justify-center rounded-2xl bg-primary/10 border border-primary/20',
            compact ? 'w-10 h-10 mb-3' : 'w-14 h-14 mb-5'
          )}>
            <Bot className={compact ? 'w-5 h-5 text-primary' : 'w-7 h-7 text-primary'} />
          </div>
          <h1 className={cn(
            'font-bold tracking-tight',
            compact ? 'text-lg mb-1' : 'text-2xl mb-2'
          )}>How can I help?</h1>
          <p className={cn(
            'text-muted-foreground/60 leading-relaxed mx-auto',
            compact ? 'text-xs max-w-[220px]' : 'text-sm max-w-xs'
          )}>
            Idea scoring, content strategy, copywriting, marketing, the finance brain. Your move.
          </p>
        </motion.div>

        {/* Prompt grid */}
        <div className={compact ? 'grid grid-cols-1 gap-1.5' : 'grid grid-cols-1 sm:grid-cols-2 gap-2'}>
          {prompts.map((prompt, i) => (
            <motion.button
              key={prompt.text}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.04, duration: 0.3 }}
              onClick={() => onPromptClick(prompt.text)}
              className={cn(
                'group flex items-center gap-3 rounded-xl border border-border/50 text-left text-muted-foreground hover:text-foreground hover:border-primary/20 hover:bg-primary/5 transition-colors',
                compact ? 'px-3 py-2.5 text-xs' : 'px-4 py-3 text-[13px]'
              )}
            >
              <span className="flex-1">{prompt.text}</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-40 group-hover:translate-x-0 transition-all" />
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
