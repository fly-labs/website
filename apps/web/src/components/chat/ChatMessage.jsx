import React from 'react';
import { motion } from 'framer-motion';
import { User, Bot } from 'lucide-react';
import { cn } from '@/lib/utils.js';
import { ChatEvaluation } from '@/components/chat/ChatEvaluation.jsx';

function renderMarkdown(text) {
  // Strip evaluation tags from display
  const clean = text.replace(/<evaluation>[\s\S]*?<\/evaluation>/g, '').trim();

  // Split by code blocks first
  const parts = clean.split(/(```[\s\S]*?```|`[^`]+`)/g);

  return parts.map((part, i) => {
    if (part.startsWith('```')) {
      const content = part.replace(/^```\w*\n?/, '').replace(/\n?```$/, '');
      return (
        <pre key={i} className="bg-muted/50 rounded-lg p-3 my-2 overflow-x-auto text-sm">
          <code>{content}</code>
        </pre>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className="bg-muted/50 rounded px-1.5 py-0.5 text-sm">
          {part.slice(1, -1)}
        </code>
      );
    }
    // Process inline markdown
    return part.split('\n').map((line, j) => {
      let processed = line;
      // Bold
      processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // Italic
      processed = processed.replace(/\*(.*?)\*/g, '<em>$1</em>');
      // Links
      processed = processed.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary underline underline-offset-2">$1</a>');

      return (
        <React.Fragment key={`${i}-${j}`}>
          {j > 0 && <br />}
          <span dangerouslySetInnerHTML={{ __html: processed }} />
        </React.Fragment>
      );
    });
  });
}

export function ChatMessage({ message, isStreaming }) {
  const isUser = message.role === 'user';
  const hasEvaluation = message.metadata?.evaluation;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn('flex gap-3 px-4 py-3', isUser && 'flex-row-reverse')}
    >
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          isUser
            ? 'bg-primary/10 text-primary'
            : 'bg-accent/10 text-accent-foreground'
        )}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      <div className={cn('flex-1 min-w-0', isUser ? 'text-right' : '')}>
        <div
          className={cn(
            'inline-block rounded-2xl px-4 py-2.5 max-w-[85%] text-sm leading-relaxed',
            isUser
              ? 'bg-primary text-primary-foreground rounded-br-md'
              : 'bg-muted/50 text-foreground rounded-bl-md'
          )}
        >
          <div className={cn('prose prose-sm max-w-none', isUser ? 'text-primary-foreground' : '')}>
            {renderMarkdown(message.content)}
            {isStreaming && !message.content && (
              <span className="inline-flex gap-1 py-1">
                <span className="w-1.5 h-1.5 bg-current rounded-full animate-pulse" />
                <span className="w-1.5 h-1.5 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                <span className="w-1.5 h-1.5 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
              </span>
            )}
          </div>
        </div>

        {hasEvaluation && (
          <div className="mt-3">
            <ChatEvaluation evaluation={message.metadata.evaluation} />
          </div>
        )}
      </div>
    </motion.div>
  );
}
