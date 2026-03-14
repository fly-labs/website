import React from 'react';
import { motion } from 'framer-motion';
import { Bot, ArrowRight } from 'lucide-react';

const SUGGESTED_PROMPTS = [
  { text: 'Evaluate my business idea', icon: '/' },
  { text: 'Help me write a Substack Note', icon: '/' },
  { text: 'What makes a good vibe building project?', icon: '/' },
  { text: 'Help me craft a title for my article', icon: '/' },
  { text: 'Apply the finance brain to my decision', icon: '/' },
  { text: 'Compare ideas in your database', icon: '/' },
];

export function ChatEmpty({ onPromptClick }) {
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="max-w-lg w-full">
        {/* Logo + title */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 mb-5">
            <Bot className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2 tracking-tight">How can I help?</h1>
          <p className="text-sm text-muted-foreground/60 leading-relaxed max-w-xs mx-auto">
            Idea scoring, content strategy, copywriting, marketing, the finance brain. Your move.
          </p>
        </motion.div>

        {/* Prompt grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {SUGGESTED_PROMPTS.map((prompt, i) => (
            <motion.button
              key={prompt.text}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.04, duration: 0.3 }}
              onClick={() => onPromptClick(prompt.text)}
              className="group flex items-center gap-3 px-4 py-3 rounded-xl border border-border/50 text-left text-[13px] text-muted-foreground hover:text-foreground hover:border-primary/20 hover:bg-primary/5 transition-colors"
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
