import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';
import { ChatMessage } from '@/components/chat/ChatMessage.jsx';

export function ChatMessages({ messages, isStreaming }) {
  const containerRef = useRef(null);
  const [userScrolled, setUserScrolled] = useState(false);

  const scrollToBottom = useCallback((smooth = false) => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'instant',
      });
    }
  }, []);

  // Auto-scroll on new messages (instant during streaming to avoid jank)
  useEffect(() => {
    if (!userScrolled) {
      scrollToBottom(false);
    }
  }, [messages, userScrolled, scrollToBottom]);

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    setUserScrolled(!isAtBottom);
  };

  return (
    <div className="flex-1 relative overflow-hidden">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="absolute inset-0 overflow-y-auto"
      >
        <div className="divide-y divide-border/30">
          {messages.map((msg, i) => (
            <ChatMessage
              key={msg.id || i}
              message={msg}
              isStreaming={isStreaming && i === messages.length - 1 && msg.role === 'assistant'}
            />
          ))}
        </div>

        {/* Bottom padding for last message breathing room */}
        <div className="h-4" />
      </div>

      {/* Scroll to bottom FAB */}
      {userScrolled && (
        <button
          onClick={() => { scrollToBottom(true); setUserScrolled(false); }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-card border border-border shadow-lg flex items-center justify-center hover:bg-muted transition-colors z-10"
          aria-label="Scroll to bottom"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
