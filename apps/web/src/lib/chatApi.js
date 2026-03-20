import supabase from '@/lib/supabaseClient.js';

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    // No session - return guest headers
    return {
      'Content-Type': 'application/json',
      'X-Guest': 'true',
    };
  }
  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Stream a chat message via SSE
 * @param {string} message
 * @param {string|null} conversationId
 * @param {function} onChunk - Called with each text chunk
 * @param {function} onDone - Called with done payload
 * @param {function} onError - Called on error
 * @returns {function} abort function
 */
export function streamChat(message, conversationId, pageContext, { onChunk, onDone, onError }) {
  const controller = new AbortController();

  (async () => {
    try {
      const headers = await getAuthHeaders();

      // Detect user's UI language for FlyBot response language
      const uiLanguage = (typeof localStorage !== 'undefined' && localStorage.getItem('language')) || 'en';

      const body = {
        message,
        conversation_id: conversationId,
        language: uiLanguage,
      };
      if (pageContext) {
        body.page_context = pageContext;
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        const data = await response.json();
        onError(data);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'chunk') {
              onChunk(data.content);
            } else if (data.type === 'done') {
              onDone(data);
            } else if (data.type === 'error') {
              onError(data);
            }
          } catch (e) {
            // Skip malformed SSE lines
          }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        onError({ message: 'Connection failed. Try again.' });
      }
    }
  })();

  return () => controller.abort();
}

/**
 * List user's conversations
 */
export async function listConversations() {
  const headers = await getAuthHeaders();
  const response = await fetch('/api/conversations', { headers });
  if (!response.ok) throw new Error('Failed to load conversations');
  const data = await response.json();
  return data.conversations;
}

/**
 * Create a new conversation
 */
export async function createConversation(title) {
  const headers = await getAuthHeaders();
  const response = await fetch('/api/conversations', {
    method: 'POST',
    headers,
    body: JSON.stringify({ title }),
  });
  if (!response.ok) throw new Error('Failed to create conversation');
  return response.json();
}

/**
 * Delete (soft) a conversation
 */
export async function deleteConversation(id) {
  const headers = await getAuthHeaders();
  const response = await fetch('/api/conversations', {
    method: 'DELETE',
    headers,
    body: JSON.stringify({ id }),
  });
  if (!response.ok) throw new Error('Failed to delete conversation');
  return response.json();
}

/**
 * Load messages for a conversation (via Supabase RLS)
 */
export async function loadMessages(conversationId) {
  const { data, error } = await supabase
    .from('messages')
    .select('id, role, content, metadata, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) throw new Error('Failed to load messages');
  return data;
}

/**
 * Submit feedback on a FlyBot message
 */
export async function submitFeedback(messageId, rating, comment = null) {
  const headers = await getAuthHeaders();
  const response = await fetch('/api/feedback', {
    method: 'POST',
    headers,
    body: JSON.stringify({ message_id: messageId, rating, comment }),
  });
  if (!response.ok) throw new Error('Failed to submit feedback');
  return response.json();
}

/**
 * Remove feedback from a FlyBot message
 */
export async function deleteFeedback(messageId) {
  const headers = await getAuthHeaders();
  const response = await fetch('/api/feedback', {
    method: 'DELETE',
    headers,
    body: JSON.stringify({ message_id: messageId }),
  });
  if (!response.ok) throw new Error('Failed to delete feedback');
  return response.json();
}

/**
 * Join FlyBot waitlist
 */
export async function joinFlyBotWaitlist(email, userId, messageCount) {
  const { error } = await supabase
    .from('flybot_waitlist')
    .upsert({
      email,
      user_id: userId,
      message_count: messageCount,
    }, { onConflict: 'email' });

  if (error) throw new Error('Failed to join waitlist');
  return true;
}
