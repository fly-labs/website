import React from 'react';
import { motion } from 'framer-motion';
import { Bot, Sparkles } from 'lucide-react';

const SUGGESTED_PROMPTS = [
  'Evaluate my business idea',
  'Help me write a Substack Note',
  'What makes a good vibe building project?',
  'Help me craft a title for my article',
  'Apply the finance brain to my decision',
  'Compare ideas in your database',
];

export function ChatEmpty({ onPromptClick }) {
  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="max-w-md text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4"
        >
          <Bot className="w-8 h-8 text-primary" />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-xl font-semibold mb-2"
        >
          FlyBot
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-sm text-muted-foreground mb-6 leading-relaxed"
        >
          Your vibe building coach. Idea scoring, content strategy, copywriting, marketing, finance brain. Throw something at me.
        </motion.p>

        <div className="flex flex-wrap justify-center gap-2">
          {SUGGESTED_PROMPTS.map((prompt, i) => (
            <motion.button
              key={prompt}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.05 }}
              onClick={() => onPromptClick(prompt)}
              className="px-3 py-2 rounded-full border text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/5 transition-colors"
            >
              <Sparkles className="w-3 h-3 inline-block mr-1.5 opacity-50" />
              {prompt}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
