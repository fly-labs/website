import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Menu, Bot, AlertCircle, X, RotateCcw } from 'lucide-react';
import { SEO } from '@/components/SEO.jsx';
import Header from '@/components/Header.jsx';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useChatContext } from '@/contexts/ChatContext.jsx';
import { ChatMessages } from '@/components/chat/ChatMessages.jsx';
import { ChatInput } from '@/components/chat/ChatInput.jsx';
import { ChatSidebar } from '@/components/chat/ChatSidebar.jsx';
import { ChatEmpty } from '@/components/chat/ChatEmpty.jsx';
import { ChatLimitReached } from '@/components/chat/ChatLimitReached.jsx';
import { trackEvent } from '@/lib/analytics.js';

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;

export default function FlyBotPage() {
  const { currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isAdmin = currentUser?.email === ADMIN_EMAIL;

  const {
    messages,
    conversations,
    activeConversationId,
    isStreaming,
    error,
    lastFailedMessage,
    messageCount,
    messageLimit,
    limitReached,
    sendMessage,
    loadConversation,
    startNewChat,
    fetchConversations,
    removeConversation,
    stopStreaming,
    retryLastMessage,
    clearError,
    initChat,
    currentPageContext,
    getPageContextWithDetail,
    feedbackMap,
    submitMessageFeedback,
  } = useChatContext();

  useEffect(() => {
    initChat();
  }, [initChat]);

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
      source: 'full_page',
    });
    sendMessage(text, getPageContextWithDetail());
  }, [sendMessage, activeConversationId, getPageContextWithDetail]);

  const handlePromptClick = useCallback((prompt) => {
    trackEvent('flybot_prompt_clicked', { prompt, source: 'full_page' });
    handleSend(prompt);
  }, [handleSend]);

  const handleSelectConversation = useCallback((id) => {
    loadConversation(id);
  }, [loadConversation]);

  const hasMessages = messages.length > 0;

  return (
    <>
      <SEO
        title="FlyBot Chat | Fly Labs"
        description="Your AI-powered vibe building partner. Score ideas, write content, think through decisions. Built by Fly Labs."
        noindex
      />

      <div className="h-dvh flex flex-col bg-background">
        <Header />

        {/* Spacer for fixed header (py-3 + content ~56px) */}
        <div className="shrink-0 h-14 sm:h-[60px]" />

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
                className="p-3 -ml-1 rounded-lg hover:bg-muted/50 transition-colors"
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
              <ChatMessages messages={messages} isStreaming={isStreaming} onNavigate={navigate} feedbackMap={feedbackMap} onFeedback={submitMessageFeedback} onFollowUp={handleSend} />
            ) : (
              <ChatEmpty onPromptClick={handlePromptClick} />
            )}

            {/* Error banner */}
            {error && (
              <div className="mx-4 sm:mx-6 mb-2">
                <div className="max-w-2xl mx-auto flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <span className="flex-1 text-red-400">{error}</span>
                  {lastFailedMessage && (
                    <button
                      onClick={retryLastMessage}
                      className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 font-medium transition-colors p-2 -m-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Retry
                    </button>
                  )}
                  <button
                    onClick={clearError}
                    className="text-red-400/50 hover:text-red-400 transition-colors p-2 -m-1"
                    aria-label="Dismiss error"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
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
