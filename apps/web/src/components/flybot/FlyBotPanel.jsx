import React, { useCallback, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Maximize2, X, AlertCircle, RotateCcw, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useChatContext } from '@/contexts/ChatContext.jsx';
import { useBoardContext } from '@/contexts/BoardContext.jsx';
import { extractBoardContent } from '@/lib/boardBridge.js';
import { GoogleIcon } from '@/components/GoogleIcon.jsx';
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

// Inline auth form that lives inside the panel - no navigation away
function InlineAuth({ variant = 'compact', title, subtitle }) {
  const { login, signup, loginWithGoogle } = useAuth();
  const { t } = useTranslation('flybot');
  const [mode, setMode] = useState('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (mode === 'signup') {
      if (password.length < 8) {
        setError(t('guest.authPasswordShort'));
        return;
      }
      if (password !== confirmPassword) {
        setError(t('guest.authPasswordMismatch'));
        return;
      }
      setIsLoading(true);
      const result = await signup(email, password);
      setIsLoading(false);
      if (!result.success) {
        setError(result.error || t('guest.authError'));
      }
    } else {
      setIsLoading(true);
      const result = await login(email, password);
      setIsLoading(false);
      if (!result.success) {
        setError(result.error || t('guest.authError'));
      }
    }
    // On success, AuthContext updates isAuthenticated -> this component unmounts
  };

  const handleGoogle = () => {
    setIsGoogleLoading(true);
    loginWithGoogle().catch(() => {
      setIsGoogleLoading(false);
      setError(t('guest.authError'));
    });
  };

  const isCompact = variant === 'compact';

  return (
    <div className={isCompact
      ? 'border-t border-border/50 bg-background px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]'
      : 'flex-1 flex items-center justify-center p-6'
    }>
      <div className={isCompact ? 'max-w-xs mx-auto' : 'max-w-xs w-full'}>
        {/* Header */}
        <div className="text-center mb-4">
          {!isCompact && (
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
              <Bot className="w-6 h-6 text-primary" />
            </div>
          )}
          {isCompact && (
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 mb-3">
              <Bot className="w-5 h-5 text-primary" />
            </div>
          )}
          <h3 className={isCompact ? 'font-semibold mb-1 text-sm' : 'font-semibold mb-1.5 text-sm'}>
            {title}
          </h3>
          <p className="text-xs text-muted-foreground/70 leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-2.5">
          <input
            type="email"
            placeholder={t('guest.authEmail')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/30 transition-[border-color,box-shadow]"
          />
          <input
            type="password"
            placeholder={t('guest.authPassword')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            required
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/30 transition-[border-color,box-shadow]"
          />
          {mode === 'signup' && (
            <input
              type="password"
              placeholder={t('guest.authConfirmPassword')}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/30 transition-[border-color,box-shadow]"
            />
          )}

          {error && (
            <p className="text-xs text-red-500 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:brightness-110 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {mode === 'signup' ? t('guest.authSignUp') : t('guest.authLogIn')}
          </button>
        </form>

        {/* Google divider + button */}
        <div className="relative my-3">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border/50" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase">
            <span className="bg-background px-2 text-muted-foreground/50">{t('guest.authOrGoogle')}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogle}
          disabled={isGoogleLoading}
          className="w-full py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted/50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isGoogleLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <GoogleIcon className="w-3.5 h-3.5" />
          )}
          {t('guest.authGoogle')}
        </button>

        {/* Toggle login/signup */}
        <p className="text-center mt-3 text-xs text-muted-foreground/60">
          {mode === 'signup' ? t('guest.authSwitchToLogin') : t('guest.authSwitchToSignup')}{' '}
          <button
            type="button"
            onClick={() => { setMode(mode === 'signup' ? 'login' : 'signup'); setError(null); }}
            className="text-primary hover:underline font-medium"
          >
            {mode === 'signup' ? t('guest.authLogIn') : t('guest.authSignUp')}
          </button>
        </p>
      </div>
    </div>
  );
}

export function FlyBotPanel({ isOpen, onClose }) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const { t } = useTranslation('flybot');
  const isAuthenticated = !!currentUser;
  const isAdmin = currentUser?.email === ADMIN_EMAIL;
  const isOnFlyBoard = location.pathname === '/flyboard';
  const { getCanvasRef } = useBoardContext();

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
    getPageContextWithDetail,
    feedbackMap,
    submitMessageFeedback,
    guestTrialUsed,
  } = useChatContext();

  const handleSend = useCallback((text) => {
    trackEvent('flybot_message_sent', {
      conversation_id: activeConversationId,
      message_length: text.length,
      source: 'widget',
    });
    // Start with page context enriched with detail from the active page
    let enrichedContext = getPageContextWithDetail();
    // Add board content when on FlyBoard (needs canvas ref at send-time)
    if (isOnFlyBoard) {
      try {
        const canvas = getCanvasRef();
        if (canvas) {
          const elements = canvas.getSceneElements?.() || [];
          const boardContent = extractBoardContent(elements);
          enrichedContext = { ...enrichedContext, board_content: boardContent };
        }
      } catch {
        // Fallback: no board content enrichment
      }
    }
    sendMessage(text, enrichedContext);
  }, [sendMessage, activeConversationId, getPageContextWithDetail, isOnFlyBoard, getCanvasRef]);

  const handlePromptClick = useCallback((prompt) => {
    trackEvent('flybot_prompt_clicked', { prompt, source: 'widget' });
    handleSend(prompt);
  }, [handleSend]);

  const handleNavigate = useCallback((path) => {
    onClose();
    navigate(path);
  }, [onClose, navigate]);

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
                <span className="text-[10px] text-muted-foreground/50 bg-muted/50 px-1.5 py-0.5 rounded">{t('panel.beta')}</span>
              </div>
              <div className="flex items-center gap-1">
                {isAuthenticated && (
                  <button
                    onClick={handleExpand}
                    className="p-2 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
                    aria-label="Open full page"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                )}
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
            {!isAuthenticated && !hasMessages && guestTrialUsed ? (
              <InlineAuth variant="full" title={t('panel.signInTitle')} subtitle={t('panel.signInDesc')} />
            ) : limitReached ? (
              <ChatLimitReached messageCount={messageCount} compact />
            ) : hasMessages ? (
              <ChatMessages messages={messages} isStreaming={isStreaming} compact onNavigate={handleNavigate} feedbackMap={isAuthenticated ? feedbackMap : {}} onFeedback={isAuthenticated ? submitMessageFeedback : undefined} onFollowUp={isAuthenticated ? handleSend : undefined} />
            ) : (
              <ChatEmpty onPromptClick={handlePromptClick} compact pageContext={currentPageContext} isGuest={!isAuthenticated} />
            )}

            {/* Error banner */}
            {error && (
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

            {/* Post-trial inline auth (replaces input after response) */}
            {!isAuthenticated && hasMessages && guestTrialUsed && !isStreaming && (
              <InlineAuth variant="compact" title={t('guest.gateTitle')} subtitle={t('guest.gateSubtext')} />
            )}

            {/* Input: show for authenticated users OR guests who haven't used their trial */}
            {((isAuthenticated && !limitReached) || (!isAuthenticated && !guestTrialUsed)) && (
              <ChatInput
                onSend={handleSend}
                onStop={stopStreaming}
                isStreaming={isStreaming}
                disabled={isAuthenticated ? limitReached : guestTrialUsed}
                messageCount={isAuthenticated ? messageCount : undefined}
                messageLimit={isAuthenticated && !isAdmin ? messageLimit : null}
                compact
                isGuest={!isAuthenticated}
              />
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
