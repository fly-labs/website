import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, ThumbsUp, ThumbsDown, Send } from 'lucide-react';
import { cn } from '@/lib/utils.js';
import { trackEvent } from '@/lib/analytics.js';
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
  const clean = text
    .replace(/<evaluation>[\s\S]*?<\/evaluation>/g, '')
    .replace(/<music_action>[\s\S]*?<\/music_action>/g, '')
    .replace(/<board_action>[\s\S]*?<\/board_action>/g, '')
    .replace(/<memory>[\s\S]*?<\/memory>/g, '')
    .trim();
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
          const isInternal = url.startsWith('/');
          if (isInternal) {
            return `<a href="${escapeHtml(url)}" data-internal="true" class="text-primary hover:underline underline-offset-2">${label}</a>`;
          }
          return `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline underline-offset-2">${label}</a>`;
        }
        return label;
      });
      // Auto-detect full flylabs.fun URLs (e.g. flylabs.fun/prompts) and convert to internal links
      processed = processed.replace(/(?<!href="|">)(?:https?:\/\/)?flylabs\.fun(\/[a-z0-9/-]*)/gi, (match, path) => {
        return `<a href="${escapeHtml(path)}" data-internal="true" class="text-primary hover:underline underline-offset-2">flylabs.fun${path}</a>`;
      });
      // Auto-detect bare internal paths (e.g. /prompts, /ideas, /flyboard) not already inside an href
      processed = processed.replace(/(?<!href="|">|flylabs\.fun)(\/(?:prompts|ideas|flybot|flyboard|templates|library|explore|scoring|newsletter|about|microsaas)(?:\/[a-z0-9-]*)?)\b/gi, (match, path) => {
        return `<a href="${escapeHtml(path)}" data-internal="true" class="text-primary hover:underline underline-offset-2">${path}</a>`;
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

function FeedbackButtons({ messageId, currentRating, onFeedback, compact }) {
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState('');

  const handleRating = (rating) => {
    if (rating === 'down' && currentRating !== 'down') {
      setShowComment(true);
    } else {
      setShowComment(false);
      setComment('');
    }
    onFeedback(messageId, rating);
  };

  const handleSubmitComment = () => {
    if (comment.trim()) {
      onFeedback(messageId, 'down', comment.trim());
    }
    setShowComment(false);
    setComment('');
  };

  return (
    <div className="pt-1.5">
      <div className={cn(
        'flex items-center gap-1',
        'opacity-0 group-hover:opacity-100 transition-opacity duration-150',
        'sm:opacity-0 sm:group-hover:opacity-100',
        // Always slightly visible on mobile
        currentRating ? 'opacity-100' : 'opacity-40 sm:opacity-0'
      )}>
        <button
          onClick={() => handleRating('up')}
          className={cn(
            'p-1.5 rounded-md transition-colors',
            currentRating === 'up'
              ? 'text-primary bg-primary/10'
              : 'text-muted-foreground/50 hover:text-primary hover:bg-primary/5'
          )}
          aria-label="Thumbs up"
        >
          <ThumbsUp className={cn(compact ? 'w-3 h-3' : 'w-3.5 h-3.5')} />
        </button>
        <button
          onClick={() => handleRating('down')}
          className={cn(
            'p-1.5 rounded-md transition-colors',
            currentRating === 'down'
              ? 'text-red-500 bg-red-500/10'
              : 'text-muted-foreground/50 hover:text-red-500 hover:bg-red-500/5'
          )}
          aria-label="Thumbs down"
        >
          <ThumbsDown className={cn(compact ? 'w-3 h-3' : 'w-3.5 h-3.5')} />
        </button>
      </div>

      <AnimatePresence>
        {showComment && currentRating === 'down' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="flex items-end gap-2 pt-2">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value.slice(0, 500))}
                placeholder="What went wrong? (optional)"
                rows={2}
                className="flex-1 text-xs bg-background/60 border border-border/50 rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-primary/30 placeholder:text-muted-foreground/40"
              />
              <button
                onClick={handleSubmitComment}
                disabled={!comment.trim()}
                className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Submit comment"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
            <button
              onClick={() => { setShowComment(false); setComment(''); }}
              className="text-[10px] text-muted-foreground/50 hover:text-muted-foreground mt-1 transition-colors"
            >
              dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function ChatMessage({ message, isStreaming, compact = false, onNavigate, feedbackRating, onFeedback }) {
  const isUser = message.role === 'user';
  const hasEvaluation = message.metadata?.evaluation;
  const isEmpty = !message.content && isStreaming;

  const handleClick = (e) => {
    const anchor = e.target.closest('a[data-internal]');
    if (anchor) {
      e.preventDefault();
      const href = anchor.getAttribute('href');
      trackEvent('flybot_link_clicked', {
        link_url: href,
        link_text: anchor.textContent?.slice(0, 100),
      });
      onNavigate?.(href);
    }
  };

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
      onClick={handleClick}
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

          {/* Feedback buttons (assistant messages with real DB IDs only) */}
          {!isUser && !isStreaming && onFeedback && message.id && !String(message.id).startsWith('temp-') && (
            <FeedbackButtons
              messageId={message.id}
              currentRating={feedbackRating}
              onFeedback={onFeedback}
              compact={compact}
            />
          )}
        </div>
      </div>
    </motion.div>
  );
}
