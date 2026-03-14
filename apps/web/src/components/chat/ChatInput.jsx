import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, Square } from 'lucide-react';
import { cn } from '@/lib/utils.js';

export function ChatInput({ onSend, onStop, isStreaming, disabled, messageCount, messageLimit, compact = false }) {
  const [text, setText] = useState('');
  const textareaRef = useRef(null);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 160) + 'px';
  }, [text]);

  const handleSubmit = () => {
    if (!text.trim() || disabled) return;
    onSend(text.trim());
    setText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (isStreaming) return;
      handleSubmit();
    }
  };

  const showCounter = messageLimit && messageLimit !== Infinity;
  const hasText = text.trim().length > 0;

  return (
    <div className={cn(
      'border-t border-border/50 bg-background',
      compact ? 'px-3 py-2' : 'px-4 sm:px-6 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]'
    )}>
      <div className={cn(compact ? 'space-y-1.5' : 'max-w-2xl mx-auto space-y-2')}>
        {/* Message counter */}
        {showCounter && (
          <div className="flex items-center justify-center gap-2">
            <div className="w-24 h-1 rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  messageCount >= messageLimit ? 'bg-red-500' : 'bg-primary/70'
                )}
                style={{ width: `${Math.min((messageCount / messageLimit) * 100, 100)}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground/60 tabular-nums">
              {messageCount}/{messageLimit}
            </span>
          </div>
        )}

        {/* Input row */}
        <div className="relative flex items-end gap-2 rounded-2xl border border-border/60 bg-card/50 focus-within:border-primary/30 focus-within:ring-1 focus-within:ring-primary/10 transition-[border-color,box-shadow]">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? 'Message limit reached' : 'Message FlyBot...'}
            disabled={disabled}
            rows={1}
            className={cn(
              'flex-1 resize-none bg-transparent px-4 py-3 text-sm leading-relaxed',
              'placeholder:text-muted-foreground/40 focus:outline-none',
              'disabled:opacity-40 disabled:cursor-not-allowed',
              'max-h-[160px] scrollbar-none'
            )}
            style={{ scrollbarWidth: 'none' }}
          />

          <div className="flex-shrink-0 p-1.5">
            {isStreaming ? (
              <button
                onClick={onStop}
                className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
                aria-label="Stop generating"
              >
                <Square className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!hasText || disabled}
                className={cn(
                  'w-9 h-9 rounded-lg flex items-center justify-center transition-colors',
                  hasText && !disabled
                    ? 'bg-primary text-primary-foreground hover:brightness-110'
                    : 'bg-muted/60 text-muted-foreground/40 cursor-default'
                )}
                aria-label="Send message"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Footer text */}
        {!compact && (
          <p className="text-[10px] text-muted-foreground/30 text-center">
            FlyBot can make mistakes. Verify important information.
          </p>
        )}
      </div>
    </div>
  );
}
