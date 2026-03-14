import React from 'react';
import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';
import { cn } from '@/lib/utils.js';
import { ChatEvaluation } from '@/components/chat/ChatEvaluation.jsx';

/**
 * Escape HTML entities to prevent XSS when using dangerouslySetInnerHTML
 */
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Validate URL - only allow http/https protocols
 */
function isSafeUrl(url) {
  try {
    const parsed = new URL(url, 'https://flylabs.fun');
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

/**
 * Render markdown for assistant messages only.
 * HTML is escaped BEFORE markdown patterns are applied to prevent XSS.
 */
function renderMarkdown(text) {
  const clean = text.replace(/<evaluation>[\s\S]*?<\/evaluation>/g, '').trim();
  if (!clean) return null;

  const parts = clean.split(/(```[\s\S]*?```|`[^`]+`)/g);

  return parts.map((part, i) => {
    if (part.startsWith('```')) {
      const content = part.replace(/^```\w*\n?/, '').replace(/\n?```$/, '');
      return (
        <pre key={i} className="bg-background/60 rounded-lg p-3 my-3 overflow-x-auto text-[13px] leading-relaxed border border-border/50">
          <code>{content}</code>
        </pre>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className="bg-background/60 border border-border/40 rounded px-1.5 py-0.5 text-[13px] font-mono">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part.split('\n').map((line, j) => {
      // Escape HTML FIRST to prevent injection
      let processed = escapeHtml(line);
      // Then apply markdown patterns on the escaped text
      processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>');
      processed = processed.replace(/\*(.*?)\*/g, '<em>$1</em>');
      // Links: validate URL before creating anchor
      processed = processed.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, label, url) => {
        if (isSafeUrl(url)) {
          return `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline underline-offset-2">${label}</a>`;
        }
        return label;
      });

      return (
        <React.Fragment key={`${i}-${j}`}>
          {j > 0 && <br />}
          <span dangerouslySetInnerHTML={{ __html: processed }} />
        </React.Fragment>
      );
    });
  });
}

/**
 * Render user message as plain text (no markdown, no innerHTML)
 */
function renderUserText(text) {
  return text.split('\n').map((line, i) => (
    <React.Fragment key={i}>
      {i > 0 && <br />}
      {line}
    </React.Fragment>
  ));
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 py-1 px-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-2 h-2 bg-muted-foreground/40 rounded-full"
          style={{
            animation: 'flybot-typing 1.4s ease-in-out infinite',
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
    </div>
  );
}

export function ChatMessage({ message, isStreaming, compact = false }) {
  const isUser = message.role === 'user';
  const hasEvaluation = message.metadata?.evaluation;
  const isEmpty = !message.content && isStreaming;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className={cn(
        'group',
        compact ? 'px-3 py-2.5' : 'px-4 sm:px-6 py-4',
        isUser ? 'bg-transparent' : 'bg-muted/30'
      )}
    >
      <div className={cn(
        'flex',
        compact ? 'gap-2' : 'max-w-2xl mx-auto gap-3 sm:gap-4'
      )}>
        {/* Avatar (hidden in compact) */}
        {!compact && (
          <div className="flex-shrink-0 pt-0.5">
            {isUser ? (
              <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
                U
              </div>
            ) : (
              <div className="w-7 h-7 rounded-full bg-card border border-border flex items-center justify-center">
                <Bot className="w-4 h-4 text-primary" />
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1">
          {/* Name */}
          <p className={cn(
            'font-semibold',
            compact ? 'text-[10px]' : 'text-xs',
            isUser ? 'text-foreground' : 'text-primary'
          )}>
            {isUser ? 'You' : 'FlyBot'}
          </p>

          {/* Message body */}
          <div className={cn(
            'text-foreground/90 break-words',
            compact ? 'text-[13px] leading-[1.6]' : 'text-[14px] leading-[1.7]'
          )}>
            {isEmpty ? (
              <TypingIndicator />
            ) : isUser ? (
              renderUserText(message.content)
            ) : (
              renderMarkdown(message.content)
            )}
          </div>

          {/* Evaluation card */}
          {hasEvaluation && (
            <div className="pt-2">
              <ChatEvaluation evaluation={message.metadata.evaluation} />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
