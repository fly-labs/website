import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Menu, Bot } from 'lucide-react';
import { SEO } from '@/components/SEO.jsx';
import Header from '@/components/Header.jsx';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useChat } from '@/hooks/useChat.js';
import { ChatMessages } from '@/components/chat/ChatMessages.jsx';
import { ChatInput } from '@/components/chat/ChatInput.jsx';
import { ChatSidebar } from '@/components/chat/ChatSidebar.jsx';
import { ChatEmpty } from '@/components/chat/ChatEmpty.jsx';
import { ChatLimitReached } from '@/components/chat/ChatLimitReached.jsx';
import { trackEvent } from '@/lib/analytics.js';

const ADMIN_EMAIL = 'alvesluiz7@icloud.com';

export default function CoachPage() {
  const { currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isAdmin = currentUser?.email === ADMIN_EMAIL;

  const {
    messages,
    conversations,
    activeConversationId,
    isStreaming,
    error,
    messageCount,
    messageLimit,
    limitReached,
    sendMessage,
    loadConversation,
    startNewChat,
    fetchConversations,
    removeConversation,
    stopStreaming,
  } = useChat();

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    const convId = searchParams.get('c');
    if (convId && convId !== activeConversationId) {
      loadConversation(convId);
    }
  }, [searchParams, activeConversationId, loadConversation]);

  useEffect(() => {
    if (activeConversationId) {
      setSearchParams({ c: activeConversationId }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  }, [activeConversationId, setSearchParams]);

  const handleSend = useCallback((text) => {
    trackEvent('flybot_message_sent', {
      conversation_id: activeConversationId,
      message_length: text.length,
    });
    sendMessage(text);
  }, [sendMessage, activeConversationId]);

  const handlePromptClick = useCallback((prompt) => {
    trackEvent('flybot_prompt_clicked', { prompt });
    handleSend(prompt);
  }, [handleSend]);

  const handleSelectConversation = useCallback((id) => {
    loadConversation(id);
  }, [loadConversation]);

  const hasMessages = messages.length > 0;

  return (
    <>
      <SEO
        title="FlyBot - Vibe Building Coach | Fly Labs"
        description="Your AI coach for vibe building. Idea scoring, content strategy, copywriting, marketing, and the finance brain. Built by Fly Labs."
        noindex
      />

      <div className="h-screen flex flex-col bg-background">
        <Header />

        <div className="flex-1 flex overflow-hidden relative">
          {/* Sidebar */}
          <ChatSidebar
            conversations={conversations}
            activeConversationId={activeConversationId}
            onSelect={handleSelectConversation}
            onNew={startNewChat}
            onDelete={removeConversation}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            isAdmin={isAdmin}
            messageCount={messageCount}
            messageLimit={isAdmin ? null : messageLimit}
          />

          {/* Chat area */}
          <div className="flex-1 flex flex-col min-w-0 bg-background">
            {/* Mobile header bar */}
            <div className="sm:hidden flex items-center gap-3 px-4 py-3 border-b bg-card/50 backdrop-blur-sm">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 -ml-1 rounded-lg hover:bg-muted/50 transition-colors"
                aria-label="Open sidebar"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-3.5 h-3.5 text-primary" />
                </div>
                <span className="text-sm font-medium truncate">
                  {activeConversationId
                    ? conversations.find(c => c.id === activeConversationId)?.title || 'FlyBot'
                    : 'FlyBot'
                  }
                </span>
              </div>
            </div>

            {/* Content */}
            {limitReached ? (
              <ChatLimitReached messageCount={messageCount} />
            ) : hasMessages ? (
              <ChatMessages messages={messages} isStreaming={isStreaming} />
            ) : (
              <ChatEmpty onPromptClick={handlePromptClick} />
            )}

            {/* Error */}
            {error && (
              <div className="px-4 py-2 text-xs text-red-500 text-center bg-red-500/5">
                {error}
              </div>
            )}

            {/* Input */}
            {!limitReached && (
              <ChatInput
                onSend={handleSend}
                onStop={stopStreaming}
                isStreaming={isStreaming}
                disabled={limitReached}
                messageCount={messageCount}
                messageLimit={isAdmin ? null : messageLimit}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
