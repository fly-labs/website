import Anthropic from '@anthropic-ai/sdk';
import { verifyAuth, ADMIN_EMAIL } from './lib/auth.js';
import { buildSystemPrompt, findSimilarIdeas } from './lib/coach-prompt.js';
import { prompts as promptLibrary } from '../src/lib/data/prompts.js';

export const config = {
  maxDuration: 60,
};

// Simple in-memory rate limiter (resets on cold start, which is fine)
const rateLimits = new Map();

function checkRateLimit(userId) {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 10;

  const userRates = rateLimits.get(userId) || [];
  const recent = userRates.filter(t => now - t < windowMs);

  if (recent.length >= maxRequests) {
    return false;
  }

  recent.push(now);
  rateLimits.set(userId, recent);
  return true;
}

function stripHtml(str) {
  return str.replace(/<[^>]*>/g, '').trim();
}

/**
 * Find prompts relevant to the user's message
 * Returns up to 3 full prompts for deep context, plus the catalog summary
 */
function findRelevantPrompts(message) {
  const lower = message.toLowerCase();
  const words = lower.replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 3);

  // Score each prompt by keyword relevance
  const scored = promptLibrary.map(p => {
    const titleLower = p.title.toLowerCase();
    const descLower = p.description.toLowerCase();
    const catLower = p.category.toLowerCase();
    let score = 0;

    for (const w of words) {
      if (titleLower.includes(w)) score += 3;
      if (descLower.includes(w)) score += 2;
      if (catLower.includes(w)) score += 2;
    }

    // Boost if user mentions the exact category
    if (lower.includes(catLower)) score += 5;
    // Boost if user mentions "prompt" related terms
    if (lower.includes('prompt') || lower.includes('template')) score += 1;

    return { ...p, relevance: score };
  })
    .filter(p => p.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 3);

  return scored;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let auth;
  try {
    auth = await verifyAuth(req);
  } catch (err) {
    return res.status(err.status || 401).json({ error: err.message });
  }

  const { user, isAdmin, supabase } = auth;

  // Rate limit
  if (!checkRateLimit(user.id)) {
    return res.status(429).json({ error: 'Too many requests. Wait a minute.' });
  }

  const { message, conversation_id } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message is required' });
  }

  // Max message length
  const cleanMessage = stripHtml(message).slice(0, 2000);
  if (cleanMessage.length === 0) {
    return res.status(400).json({ error: 'Message is empty' });
  }

  // Check message count
  const messageLimit = isAdmin ? Infinity : 5;
  const { data: msgCount } = await supabase.rpc('get_user_message_count', { p_user_id: user.id });
  const currentCount = msgCount || 0;

  if (currentCount >= messageLimit) {
    return res.status(403).json({
      error: 'limit_reached',
      message_count: currentCount,
      limit: messageLimit,
    });
  }

  // Ensure conversation exists
  let convId = conversation_id;
  if (!convId) {
    const { data: conv, error: convError } = await supabase
      .from('conversations')
      .insert({ user_id: user.id, title: cleanMessage.slice(0, 100) })
      .select('id')
      .single();

    if (convError) {
      return res.status(500).json({ error: 'Failed to create conversation' });
    }
    convId = conv.id;
  }

  // Save user message (keep ID for rollback on error)
  const { data: userMsg } = await supabase.from('messages').insert({
    conversation_id: convId,
    role: 'user',
    content: cleanMessage,
  }).select('id').single();

  // Load conversation history (last 20 messages)
  const { data: history } = await supabase
    .from('messages')
    .select('role, content')
    .eq('conversation_id', convId)
    .order('created_at', { ascending: true })
    .limit(20);

  // Find similar ideas if user might be describing one
  const ideaKeywords = ['idea', 'build', 'tool', 'app', 'project', 'product', 'saas', 'problem', 'solve', 'evaluate', 'score'];
  const mightBeIdea = ideaKeywords.some(k => cleanMessage.toLowerCase().includes(k));
  let similarIdeas = [];
  if (mightBeIdea) {
    try {
      similarIdeas = await findSimilarIdeas(supabase, cleanMessage);
    } catch (e) {
      // Non-critical, continue without similar ideas
    }
  }

  // Find relevant prompts from our library
  const relevantPrompts = findRelevantPrompts(cleanMessage);

  // Build system prompt with full knowledge base
  const systemPrompt = buildSystemPrompt({
    similarIdeas,
    relevantPrompts,
    promptCatalog: promptLibrary,
  });

  // Build messages array
  const messages = (history || []).map(m => ({
    role: m.role,
    content: m.content,
  }));

  // Stream response
  const model = isAdmin ? 'claude-opus-4-6' : 'claude-haiku-4-5-20251001';

  const anthropic = new Anthropic();

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Conversation-Id', convId);

  let fullResponse = '';
  let metadata = null;

  try {
    const stream = anthropic.messages.stream({
      model,
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        const text = event.delta.text;
        fullResponse += text;
        res.write(`data: ${JSON.stringify({ type: 'chunk', content: text })}\n\n`);
      }
    }

    // Parse evaluation metadata if present
    const evalMatch = fullResponse.match(/<evaluation>([\s\S]*?)<\/evaluation>/);
    if (evalMatch) {
      try {
        metadata = { evaluation: JSON.parse(evalMatch[1].trim()) };
      } catch (e) {
        // Failed to parse evaluation JSON, skip metadata
      }
    }

    // Save assistant message
    await supabase.from('messages').insert({
      conversation_id: convId,
      role: 'assistant',
      content: fullResponse,
      metadata,
    });

    // Update conversation timestamp
    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', convId);

    // Send done event
    const newCount = currentCount + 1;
    res.write(`data: ${JSON.stringify({
      type: 'done',
      conversation_id: convId,
      message_count: newCount,
      limit: messageLimit === Infinity ? null : messageLimit,
      metadata,
    })}\n\n`);

  } catch (err) {
    console.error('FlyBot API error:', err?.status, err?.error?.type, err?.message);

    // Always clean up the orphan user message on error
    if (userMsg?.id) {
      await supabase.from('messages').delete().eq('id', userMsg.id);
    }

    // Send specific error with conversation_id so client can track it
    let errorMessage = 'Connection hiccup. Try again.';
    if (err?.error?.type === 'invalid_request_error') {
      errorMessage = "I couldn't process that. Try rephrasing.";
    } else if (err?.status === 529 || err?.error?.type === 'overloaded_error') {
      errorMessage = "I'm a bit overloaded right now. Give me a sec and try again.";
    }

    res.write(`data: ${JSON.stringify({
      type: 'error',
      message: errorMessage,
      conversation_id: convId,
    })}\n\n`);
  }

  res.end();
}
