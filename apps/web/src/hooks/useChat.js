import { useState, useCallback, useRef } from 'react';
import { streamChat, loadMessages, listConversations, createConversation, deleteConversation } from '@/lib/chatApi.js';
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
        if (data.metadata?.evaluation) {
          setMessages(prev =>
            prev.map(m =>
              m.id === assistantId
                ? { ...m, metadata: data.metadata }
                : m
            )
          );
          trackEvent('flybot_evaluation_displayed', {
            idea_title: data.metadata.evaluation.idea_title,
            verdict: data.metadata.evaluation.verdict,
            composite_score: data.metadata.evaluation.composite_score,
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
  };
}
