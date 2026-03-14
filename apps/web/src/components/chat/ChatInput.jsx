import React, { useState, useRef, useEffect } from 'react';
import { Send, Square } from 'lucide-react';
import { cn } from '@/lib/utils.js';

export function ChatInput({ onSend, onStop, isStreaming, disabled, messageCount, messageLimit }) {
  const [text, setText] = useState('');
  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
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

  return (
    <div className="border-t bg-background/80 backdrop-blur-sm px-4 py-3">
      {showCounter && (
        <div className="flex items-center gap-2 mb-2">
          <div className="flex-1 h-1.5 rounded-full bg-muted/50 overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-300',
                messageCount >= messageLimit ? 'bg-red-500' : 'bg-primary'
              )}
              style={{ width: `${Math.min((messageCount / messageLimit) * 100, 100)}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground tabular-nums">
            {messageCount}/{messageLimit}
          </span>
        </div>
      )}

      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? 'Message limit reached' : 'Type a message...'}
          disabled={disabled}
          rows={1}
          className={cn(
            'flex-1 resize-none rounded-xl border bg-muted/30 px-4 py-2.5 text-sm',
            'placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'max-h-[120px]'
          )}
        />

        {isStreaming ? (
          <button
            onClick={onStop}
            className="flex-shrink-0 w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500/20 transition-colors"
            aria-label="Stop generating"
          >
            <Square className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!text.trim() || disabled}
            className={cn(
              'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-colors',
              text.trim() && !disabled
                ? 'bg-primary text-primary-foreground hover:brightness-110'
                : 'bg-muted/50 text-muted-foreground cursor-not-allowed'
            )}
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
