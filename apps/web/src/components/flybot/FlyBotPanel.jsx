import React, { useCallback, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Maximize2, X, AlertCircle, RotateCcw, LogIn, Info } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useChatContext } from '@/contexts/ChatContext.jsx';
import { ChatMessages } from '@/components/chat/ChatMessages.jsx';
import { ChatInput } from '@/components/chat/ChatInput.jsx';
import { ChatEmpty } from '@/components/chat/ChatEmpty.jsx';
import { ChatLimitReached } from '@/components/chat/ChatLimitReached.jsx';
import { trackEvent } from '@/lib/analytics.js';

const ADMIN_EMAIL = 'alvesluiz7@icloud.com';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 767px)').matches : false
  );
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 767px)');
    const handler = (e) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);
  return isMobile;
}

function AuthGate() {
  const navigate = useNavigate();
  const { closeWidget } = useChatContext();

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="text-center max-w-xs">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
          <Bot className="w-6 h-6 text-primary" />
        </div>
        <h3 className="font-semibold mb-1.5 text-sm">Sign in to chat with FlyBot</h3>
        <p className="text-xs text-muted-foreground/70 mb-4 leading-relaxed">
          Score business ideas, get help writing content, think through building decisions. 5 free messages.
        </p>
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => { closeWidget(); navigate('/login'); }}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:brightness-110 transition-colors flex items-center gap-1.5"
          >
            <LogIn className="w-3.5 h-3.5" />
            Sign in
          </button>
          <button
            onClick={() => { closeWidget(); navigate('/signup'); }}
            className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted/50 transition-colors"
          >
            Sign up
          </button>
        </div>
      </div>
    </div>
  );
}

export function FlyBotPanel({ isOpen, onClose }) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isAuthenticated = !!currentUser;
  const isAdmin = currentUser?.email === ADMIN_EMAIL;

  const {
    messages,
    activeConversationId,
    isStreaming,
    error,
    lastFailedMessage,
    messageCount,
    messageLimit,
    limitReached,
    sendMessage,
    stopStreaming,
    retryLastMessage,
    clearError,
    currentPageContext,
  } = useChatContext();

  const handleSend = useCallback((text) => {
    trackEvent('flybot_message_sent', {
      conversation_id: activeConversationId,
      message_length: text.length,
      source: 'widget',
    });
    sendMessage(text, currentPageContext);
  }, [sendMessage, activeConversationId, currentPageContext]);

  const handlePromptClick = useCallback((prompt) => {
    trackEvent('flybot_prompt_clicked', { prompt, source: 'widget' });
    handleSend(prompt);
  }, [handleSend]);

  const handleExpand = useCallback(() => {
    onClose();
    const params = activeConversationId ? `?c=${activeConversationId}` : '';
    navigate(`/flybot/chat${params}`);
  }, [onClose, navigate, activeConversationId]);

  const hasMessages = messages.length > 0;

  const panelAnimation = isMobile
    ? { initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' } }
    : { initial: { x: '100%' }, animate: { x: 0 }, exit: { x: '100%' } };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Mobile backdrop */}
          <motion.div
            key="flybot-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-[2px] z-[58] md:hidden"
          />

          {/* Panel */}
          <motion.div
            key="flybot-panel"
            {...panelAnimation}
            transition={{ type: 'spring', damping: 30, stiffness: 350 }}
            className={
              isMobile
                ? 'fixed left-0 right-0 bottom-0 h-[85dvh] rounded-t-2xl bg-card border-t border-border z-[60] flex flex-col'
                : 'fixed top-0 right-0 bottom-0 w-[400px] bg-card border-l border-border z-[60] flex flex-col'
            }
          >
            {/* Drag handle (mobile only) */}
            {isMobile && (
              <div className="flex justify-center pt-2 pb-1">
                <div className="w-10 h-1 rounded-full bg-muted-foreground/20" />
              </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm font-semibold">FlyBot</span>
                <span className="text-[10px] text-muted-foreground/50 bg-muted/50 px-1.5 py-0.5 rounded">beta</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleExpand}
                  className="p-2 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
                  aria-label="Open full page"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
                  aria-label="Close panel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content */}
            {!isAuthenticated ? (
              <AuthGate />
            ) : limitReached ? (
              <ChatLimitReached messageCount={messageCount} compact />
            ) : hasMessages ? (
              <ChatMessages messages={messages} isStreaming={isStreaming} compact />
            ) : (
              <ChatEmpty onPromptClick={handlePromptClick} compact />
            )}

            {/* Error banner */}
            {isAuthenticated && error && (
              <div className="mx-3 mb-2">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs">
                  <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                  <span className="flex-1 text-red-400">{error}</span>
                  {lastFailedMessage && (
                    <button
                      onClick={retryLastMessage}
                      className="flex items-center gap-1 text-red-400 hover:text-red-300 font-medium transition-colors p-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  )}
                  <button
                    onClick={clearError}
                    className="text-red-400/50 hover:text-red-400 transition-colors p-1"
                    aria-label="Dismiss"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            {/* Input */}
            {isAuthenticated && !limitReached && (
              <ChatInput
                onSend={handleSend}
                onStop={stopStreaming}
                isStreaming={isStreaming}
                disabled={limitReached}
                messageCount={messageCount}
                messageLimit={isAdmin ? null : messageLimit}
                compact
              />
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
