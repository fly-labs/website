import React from 'react';
import { motion } from 'framer-motion';
import { Bot, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils.js';
import { FlyBotDisclosure } from '@/components/chat/FlyBotDisclosure.jsx';

const SUGGESTED_PROMPTS = [
  'I have a business idea. Score it.',
  'I\'m stuck between two ideas. Help me decide.',
  'What are the highest-scoring ideas right now?',
  'Which industries are trending this week?',
  'Am I falling for sunk cost on this project?',
  'Set the vibe and let\'s build.',
];

const COMPACT_PROMPTS = [
  'Score my business idea',
  'Show me BUILD ideas from Reddit',
  'Set the vibe',
];

export function ChatEmpty({ onPromptClick, compact = false }) {
  const prompts = compact ? COMPACT_PROMPTS : SUGGESTED_PROMPTS;

  return (
    <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
      <div className={compact ? 'max-w-sm w-full' : 'max-w-lg w-full'}>
        {/* Logo + title */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className={compact ? 'text-center mb-5' : 'text-center mb-8'}
        >
          <div className={cn(
            'inline-flex items-center justify-center rounded-2xl bg-primary/10 border border-primary/20',
            compact ? 'w-10 h-10 mb-3' : 'w-14 h-14 mb-4'
          )}>
            <Bot className={compact ? 'w-5 h-5 text-primary' : 'w-7 h-7 text-primary'} />
          </div>
          <h1 className={cn(
            'font-bold tracking-tight',
            compact ? 'text-lg mb-1.5' : 'text-2xl mb-2'
          )}>
            {compact ? 'FlyBot' : 'Hey, I\'m FlyBot.'}
          </h1>
          <p className={cn(
            'text-muted-foreground/70 leading-relaxed mx-auto',
            compact ? 'text-xs max-w-[240px]' : 'text-sm max-w-sm'
          )}>
            {compact
              ? 'Describe an idea. I\'ll score it and show you what I\'ve seen before.'
              : 'Describe an idea and I\'ll score it against 4 frameworks, pull similar ones I\'ve already analyzed, and tell you if it\'s worth your weekend.'
            }
          </p>
          {!compact && (
            <p className="text-xs text-muted-foreground/40 mt-2 max-w-sm mx-auto">
              Built for builders. Won't do investment advice or homework.
            </p>
          )}
        </motion.div>

        {/* Try asking label */}
        {!compact && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.12, duration: 0.3 }}
            className="text-[11px] text-muted-foreground/40 uppercase tracking-wider font-medium mb-2"
          >
            Try asking
          </motion.p>
        )}

        {/* Prompt grid */}
        <div className={compact ? 'grid grid-cols-1 gap-1.5' : 'grid grid-cols-1 sm:grid-cols-2 gap-2'}>
          {prompts.map((prompt, i) => (
            <motion.button
              key={prompt}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.04, duration: 0.3 }}
              onClick={() => onPromptClick(prompt)}
              className={cn(
                'group flex items-center gap-3 rounded-xl border border-border/50 text-left text-muted-foreground hover:text-foreground hover:border-primary/20 hover:bg-primary/5 transition-colors',
                compact ? 'px-3 py-2.5 text-xs' : 'px-4 py-3 text-[13px]'
              )}
            >
              <span className="flex-1">{prompt}</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-40 group-hover:translate-x-0 transition-[opacity,transform]" />
            </motion.button>
          ))}
        </div>

        {/* Disclosure */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.3 }}
          className="text-center"
        >
          <FlyBotDisclosure compact={compact} />
        </motion.div>
      </div>
    </div>
  );
}
