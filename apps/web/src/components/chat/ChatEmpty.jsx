import React from 'react';
import { motion } from 'framer-motion';
import { Bot, ArrowRight, Info } from 'lucide-react';
import { cn } from '@/lib/utils.js';
import { FlyBotDisclosure } from '@/components/chat/FlyBotDisclosure.jsx';

// Default prompts
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

// Page-specific prompts and descriptions
const PAGE_CONFIGS = {
  'FlyBoard': {
    title: 'FlyBot for FlyBoard',
    description: 'I can add sticky notes, shapes, and text to your board. I can load templates and read what\'s on your canvas.',
    compactDescription: 'I can add elements to your board and load templates.',
    prompts: [
      'Set up a lean canvas',
      'Add sticky notes for brainstorming',
      'What\'s on my board?',
      'Clear and start fresh',
      'Add a SWOT analysis layout',
      'Help me plan a mind map',
    ],
    compactPrompts: [
      'Set up a lean canvas',
      'Add sticky notes',
      'What\'s on my board?',
    ],
    capabilities: {
      can: [
        'Add sticky notes, shapes, text, and arrows',
        'Load any of the 12 built-in templates',
        'Read and describe what\'s on your board',
      ],
      cannot: [
        'Move or resize existing elements',
        'Change colors of existing shapes',
        'Undo actions (use Ctrl+Z for that)',
      ],
    },
  },
  'Ideas Lab': {
    title: 'FlyBot for Ideas',
    description: 'Describe a problem or business idea. I\'ll ask 4 questions, score it, find similar ideas, and tell you if it\'s worth building.',
    compactDescription: 'Describe an idea. I\'ll score and analyze it.',
    prompts: [
      'I have a business idea. Score it.',
      'Show me the top BUILD ideas this week',
      'Which industries have the most opportunities?',
      'Find me ideas similar to [your idea]',
      'What are the latest ideas from Product Hunt?',
      'Help me validate my idea before building',
    ],
    compactPrompts: [
      'Score my business idea',
      'Show me BUILD ideas',
      'What\'s trending?',
    ],
  },
  'Prompt Library': {
    title: 'FlyBot for Prompts',
    description: 'I can help you find the right prompt, customize one for your use case, or suggest new ones.',
    compactDescription: 'Need help with prompts? Ask me.',
    prompts: [
      'Find me a prompt for writing LinkedIn posts',
      'I need a coding prompt for React debugging',
      'What\'s the best SEO prompt you have?',
      'Help me customize a prompt for my niche',
      'Suggest a workflow for content creation',
      'What prompts are most popular?',
    ],
    compactPrompts: [
      'Find me a writing prompt',
      'Best prompt for my use case',
      'Help me customize a prompt',
    ],
  },
  'Explore': {
    title: 'FlyBot',
    description: 'I can tell you about any Fly Labs project, help you find what you need, or suggest where to start.',
    compactDescription: 'Ask me about any Fly Labs project.',
    prompts: [
      'What can I do on Fly Labs?',
      'Tell me about the Ideas Lab',
      'What tools are available?',
      'Where should I start?',
    ],
    compactPrompts: [
      'What can I do here?',
      'Tell me about Ideas Lab',
      'Where should I start?',
    ],
  },
};

function getPageConfig(pageContext) {
  if (!pageContext?.name) return null;
  // Match by page name prefix (e.g., "Ideas Lab (idea submissions...)" -> "Ideas Lab")
  for (const [key, config] of Object.entries(PAGE_CONFIGS)) {
    if (pageContext.name.startsWith(key)) return config;
  }
  return null;
}

export function ChatEmpty({ onPromptClick, compact = false, pageContext = null }) {
  const pageConfig = getPageConfig(pageContext);

  const prompts = compact
    ? (pageConfig?.compactPrompts || COMPACT_PROMPTS)
    : (pageConfig?.prompts || SUGGESTED_PROMPTS);

  const title = compact
    ? (pageConfig?.title || 'FlyBot')
    : (pageConfig?.title ? `Hey, I'm ${pageConfig.title.replace('FlyBot for ', '')}'s FlyBot.` : 'Hey, I\'m FlyBot.');

  const description = compact
    ? (pageConfig?.compactDescription || 'Describe an idea. I\'ll score it and show you what I\'ve seen before.')
    : (pageConfig?.description || 'Describe an idea. I\'ll ask 4 questions, pull similar ones I\'ve already analyzed, and tell you if it\'s worth your weekend.');

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
            {compact ? (pageConfig?.title || 'FlyBot') : title}
          </h1>
          <p className={cn(
            'text-muted-foreground/70 leading-relaxed mx-auto',
            compact ? 'text-xs max-w-[240px]' : 'text-sm max-w-sm'
          )}>
            {description}
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

        {/* Capabilities card (board-specific) */}
        {pageConfig?.capabilities && !compact && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.3 }}
            className="mt-4 p-3 rounded-xl border border-border/50 bg-muted/30"
          >
            <div className="flex items-center gap-1.5 mb-2">
              <Info className="w-3.5 h-3.5 text-muted-foreground/60" />
              <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider font-medium">FlyBoard mode (beta)</span>
            </div>
            <div className="text-[11px] text-muted-foreground/70 leading-relaxed space-y-1">
              {pageConfig.capabilities.can.map((item, i) => (
                <p key={`can-${i}`} className="text-muted-foreground/80">{item}.</p>
              ))}
              <p className="pt-1 text-muted-foreground/50">
                {pageConfig.capabilities.cannot.map(c => c.toLowerCase()).join(', ')}.
              </p>
            </div>
          </motion.div>
        )}

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
