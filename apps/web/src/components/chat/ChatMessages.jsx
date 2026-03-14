import React, { useRef, useEffect, useState } from 'react';
import { ChatMessage } from '@/components/chat/ChatMessage.jsx';

export function ChatMessages({ messages, isStreaming }) {
  const containerRef = useRef(null);
  const [userScrolled, setUserScrolled] = useState(false);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (!userScrolled && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, userScrolled]);

  // Detect user scroll
  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setUserScrolled(!isAtBottom);
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto py-4 space-y-1"
    >
      {messages.map((msg, i) => (
        <ChatMessage
          key={msg.id || i}
          message={msg}
          isStreaming={isStreaming && i === messages.length - 1 && msg.role === 'assistant'}
        />
      ))}
    </div>
  );
}
