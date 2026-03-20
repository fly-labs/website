import { useState, useCallback, useRef } from 'react';
import { streamChat, loadMessages, listConversations, createConversation, deleteConversation, submitFeedback, deleteFeedback } from '@/lib/chatApi.js';
import { trackEvent } from '@/lib/analytics.js';

export function useChat() {
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);
  const [lastFailedMessage, setLastFailedMessage] = useState(null);
  const [messageCount, setMessageCount] = useState(0);
  const [messageLimit, setMessageLimit] = useState(5);
  const [limitReached, setLimitReached] = useState(false);
  const [feedbackMap, setFeedbackMap] = useState({});
  const [guestTrialUsed, setGuestTrialUsed] = useState(() => {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('flybot_guest_used') === 'true';
    }
    return false;
  });
  const abortRef = useRef(null);

  const clearError = useCallback(() => {
    setError(null);
    setLastFailedMessage(null);
  }, []);

  const fetchConversations = useCallback(async () => {
    try {
      const convs = await listConversations();
      setConversations(convs);
    } catch (e) {
      // Silent fail for conversation list
    }
  }, []);

  const loadConversation = useCallback(async (conversationId) => {
    try {
      setError(null);
      setLastFailedMessage(null);
      const msgs = await loadMessages(conversationId);
      setMessages(msgs);
      setActiveConversationId(conversationId);
    } catch (e) {
      setError('Failed to load conversation');
    }
  }, []);

  const startNewChat = useCallback(() => {
    setMessages([]);
    setActiveConversationId(null);
    setError(null);
    setLastFailedMessage(null);
  }, []);

  const sendMessage = useCallback(async (text, pageContext) => {
    if (isStreaming || !text.trim()) return;

    setError(null);
    setLastFailedMessage(null);
    setIsStreaming(true);

    // Optimistically add user message
    const userMsg = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);

    // Add placeholder for assistant
    const assistantId = `temp-assistant-${Date.now()}`;
    setMessages(prev => [
      ...prev,
      { id: assistantId, role: 'assistant', content: '', created_at: new Date().toISOString() },
    ]);

    const abort = streamChat(text, activeConversationId, pageContext, {
      onChunk: (chunk) => {
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantId
              ? { ...m, content: m.content + chunk }
              : m
          )
        );
      },
      onDone: (data) => {
        setIsStreaming(false);
        // Guest trial: mark as used so the gate appears
        if (data.is_guest) {
          setGuestTrialUsed(true);
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('flybot_guest_used', 'true');
          }
          // Attach metadata (evaluation cards) to the assistant message
          if (data.metadata) {
            setMessages(prev =>
              prev.map(m =>
                m.id === assistantId
                  ? { ...m, metadata: data.metadata }
                  : m
              )
            );
            if (data.metadata.music_action) {
              window.dispatchEvent(new CustomEvent('flybot-music-action', {
                detail: data.metadata.music_action,
              }));
            }
          }
          // Keep the messages visible but don't track conversation
          return;
        }
        if (data.conversation_id && !activeConversationId) {
          setActiveConversationId(data.conversation_id);
          trackEvent('flybot_conversation_created', { conversation_id: data.conversation_id });
        }
        if (data.message_count !== undefined) {
          setMessageCount(data.message_count);
        }
        if (data.limit !== undefined && data.limit !== null) {
          setMessageLimit(data.limit);
        }
        if (data.metadata?.music_action) {
          window.dispatchEvent(new CustomEvent('flybot-music-action', {
            detail: data.metadata.music_action,
          }));
          trackEvent('music_flybot_control', { action: data.metadata.music_action.action });
        }
        if (data.metadata?.board_action) {
          window.dispatchEvent(new CustomEvent('flybot-board-action', {
            detail: data.metadata.board_action,
          }));
          trackEvent('flybot_board_action', { action: data.metadata.board_action.action });
        }
        // Replace temp assistant ID with real DB ID + attach metadata
        const realId = data.message_id || assistantId;
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantId
              ? { ...m, id: realId, metadata: data.metadata || m.metadata }
              : m
          )
        );
        if (data.metadata?.evaluation) {
          trackEvent('flybot_evaluation_displayed', {
            idea_title: data.metadata.evaluation.idea_title,
            verdict: data.metadata.evaluation.verdict,
            flylabs_score: data.metadata.evaluation.flylabs_score,
          });
        }
        // Refresh conversations list
        fetchConversations();
      },
      onError: (data) => {
        setIsStreaming(false);

        if (data.error === 'limit_reached') {
          setLimitReached(true);
          setMessageCount(data.message_count || 5);
          // Remove both placeholder messages in a single filter
          setMessages(prev => prev.filter(m => m.id !== assistantId && m.id !== userMsg.id));
        } else {
          // Remove both optimistic messages (server cleaned up orphan DB records)
          setMessages(prev => prev.filter(m => m.id !== assistantId && m.id !== userMsg.id));
          // Set error state separately for the error banner
          setError(data.message || data.error || 'Something went wrong');
          // Save the failed message text for retry
          setLastFailedMessage(text);

          // Track conversation_id from error event so retries go to the right conversation
          if (data.conversation_id && !activeConversationId) {
            setActiveConversationId(data.conversation_id);
          }

          // Refresh conversations so the new conversation appears in sidebar
          fetchConversations();
        }
      },
    });

    abortRef.current = abort;
  }, [isStreaming, activeConversationId, fetchConversations]);

  const retryLastMessage = useCallback(() => {
    if (lastFailedMessage) {
      sendMessage(lastFailedMessage);
    }
  }, [lastFailedMessage, sendMessage]);

  const removeConversation = useCallback(async (id) => {
    try {
      await deleteConversation(id);
      trackEvent('flybot_conversation_deleted', { conversation_id: id });
      setConversations(prev => prev.filter(c => c.id !== id));
      if (activeConversationId === id) {
        startNewChat();
      }
    } catch (e) {
      setError('Failed to delete conversation');
    }
  }, [activeConversationId, startNewChat]);

  const submitMessageFeedback = useCallback(async (messageId, rating, comment = null) => {
    // If same rating already exists, remove feedback (toggle off)
    if (feedbackMap[messageId] === rating) {
      setFeedbackMap(prev => {
        const next = { ...prev };
        delete next[messageId];
        return next;
      });
      try { await deleteFeedback(messageId); } catch { /* silent */ }
      return;
    }

    // Set new rating
    setFeedbackMap(prev => ({ ...prev, [messageId]: rating }));
    try {
      await submitFeedback(messageId, rating, comment);
      trackEvent('flybot_feedback_submitted', {
        rating,
        has_comment: !!comment,
        message_id: messageId,
      });
    } catch {
      // Revert on failure
      setFeedbackMap(prev => {
        const next = { ...prev };
        delete next[messageId];
        return next;
      });
    }
  }, [feedbackMap]);

  const stopStreaming = useCallback(() => {
    if (abortRef.current) {
      abortRef.current();
      setIsStreaming(false);
    }
  }, []);

  return {
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
    feedbackMap,
    submitMessageFeedback,
    guestTrialUsed,
  };
}
