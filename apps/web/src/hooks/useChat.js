import { useState, useCallback, useRef } from 'react';
import { streamChat, loadMessages, listConversations, createConversation, deleteConversation } from '@/lib/chatApi.js';

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

  const sendMessage = useCallback(async (text) => {
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

    const abort = streamChat(text, activeConversationId, {
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
        }
        if (data.message_count !== undefined) {
          setMessageCount(data.message_count);
        }
        if (data.limit !== undefined && data.limit !== null) {
          setMessageLimit(data.limit);
        }
        if (data.metadata?.evaluation) {
          setMessages(prev =>
            prev.map(m =>
              m.id === assistantId
                ? { ...m, metadata: data.metadata }
                : m
            )
          );
        }
        // Refresh conversations list
        fetchConversations();
      },
      onError: (data) => {
        setIsStreaming(false);
        if (data.error === 'limit_reached') {
          setLimitReached(true);
          setMessageCount(data.message_count || 5);
          // Remove both placeholder messages
          setMessages(prev => prev.filter(m => m.id !== assistantId && m.id !== userMsg.id));
        } else {
          // Remove the empty assistant placeholder (don't show error as a message)
          setMessages(prev => prev.filter(m => m.id !== assistantId));
          // Also remove the optimistic user message (server cleaned up the orphan)
          setMessages(prev => prev.filter(m => m.id !== userMsg.id));
          // Set error state separately
          setError(data.message || data.error || 'Something went wrong');
          // Save the failed message text for retry
          setLastFailedMessage(text);
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
