import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { verifyAuth, ADMIN_EMAIL } from './lib/auth.js';
import { buildSystemPrompt, findSimilarIdeas, fetchIdeaAnalytics, searchIdeas } from './lib/coach-prompt.js';
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

function sanitizeMessage(str) {
  return str
    .replace(/<[^>]*>/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/g, '')
    .replace(/(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '')
    .trim();
}

// Whitelist valid page names for page_context sanitization
const VALID_PAGES = new Set([
  'Home', 'Explore', 'Ideas Lab', 'Idea Detail', 'Ideas Lab Analytics',
  'Newsletter', 'About', 'Scoring Frameworks', 'Library', 'Prompt Library',
  'Templates', 'Website Blueprint', 'Garmin to Notion', 'Launch Checklist',
  'One-Page Business Plan', 'Micro Tools', 'User Profile', 'FlyBot',
  'FlyBoard',
]);

/**
 * Parse search intent from user message
 */
function parseSearchIntent(message) {
  const lower = message.toLowerCase();
  const filters = {};

  // Source detection
  if (lower.includes('reddit')) filters.source = 'reddit';
  if (lower.includes('product hunt')) filters.source = 'producthunt';
  if (lower.includes('hacker news') || lower.includes('hackernews')) filters.source = 'hackernews';
  if (lower.includes('github')) filters.source = 'github';
  if (lower.includes('yc') || lower.includes('graveyard')) filters.source = 'yc';
  if (lower.includes('problemhunt')) filters.source = 'problemhunt';

  // Verdict detection
  if (/\bbuild\b/.test(lower) && !/building/.test(lower)) filters.verdict = 'BUILD';
  if (/\bskip\b/.test(lower)) filters.verdict = 'SKIP';
  if (/\bvalidate\b/.test(lower)) filters.verdict = 'VALIDATE_FIRST';

  // Score threshold
  const scoreMatch = lower.match(/(?:score|above|over)\s*(\d+)/);
  if (scoreMatch) filters.min_score = parseInt(scoreMatch[1]);

  // Industry detection
  const industryPatterns = {
    'developer tools': 'Developer Tools', 'dev tools': 'Developer Tools',
    'ai ml': 'AI ML', 'artificial intelligence': 'AI ML', 'machine learning': 'AI ML',
    'marketing': 'Marketing Sales', 'sales': 'Marketing Sales',
    'health': 'Health Fitness', 'fitness': 'Health Fitness',
    'education': 'Education', 'finance': 'Finance',
    'productivity': 'Productivity', 'e-commerce': 'E-Commerce', 'ecommerce': 'E-Commerce',
  };
  for (const [pattern, industry] of Object.entries(industryPatterns)) {
    if (lower.includes(pattern)) { filters.industry = industry; break; }
  }

  // Confidence detection
  if (/high confidence/.test(lower)) filters.confidence = 'high';

  const hasFilters = Object.keys(filters).length > 0;
  const isSearch = hasFilters || /show me|find|search|list|what.*ideas|best ideas|top ideas|highest.scoring|trending|hot ideas|underrated|hidden gem/.test(lower);

  return isSearch ? filters : null;
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

  // Try auth - fall through to guest mode on failure
  let auth = null;
  let isGuest = false;
  try {
    auth = await verifyAuth(req);
  } catch (err) {
    // No valid auth - check if this is a guest request
    const guestHeader = req.headers['x-guest'];
    if (guestHeader === 'true') {
      isGuest = true;
    } else {
      return res.status(err.status || 401).json({ error: err.message });
    }
  }

  const user = auth ? auth.user : null;
  const isAdmin = auth ? auth.isAdmin : false;
  const supabase = auth ? auth.supabase : null;

  // Guest rate limit: 1 message per IP per 24h
  if (isGuest) {
    const clientIP = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
    const guestKey = `guest-${clientIP}`;
    const now = Date.now();
    const windowMs = 24 * 60 * 60 * 1000; // 24 hours
    const guestRates = rateLimits.get(guestKey) || [];
    const recent = guestRates.filter(t => now - t < windowMs);

    if (recent.length >= 1) {
      return res.status(429).json({ error: 'Guest trial used. Sign up for 10 free messages.' });
    }

    recent.push(now);
    rateLimits.set(guestKey, recent);
  }

  // Authenticated user rate limit
  if (!isGuest && !checkRateLimit(user.id)) {
    return res.status(429).json({ error: 'Too many requests. Wait a minute.' });
  }

  const { message, conversation_id, page_context, language } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message is required' });
  }

  // Max message length
  const cleanMessage = sanitizeMessage(message).slice(0, 2000);
  if (cleanMessage.length === 0) {
    return res.status(400).json({ error: 'Message is empty' });
  }

  let convId = null;
  let currentCount = 0;
  let messageLimit = 10;
  let userMsg = null;
  let history = null;

  if (!isGuest) {
    // Check message count
    // NOTE: get_user_message_count RPC must count ALL messages including from deleted conversations
    // to prevent users from bypassing limits by deleting conversations.
    messageLimit = isAdmin ? Infinity : 10;
    const { data: msgCount } = await supabase.rpc('get_user_message_count', { p_user_id: user.id });
    currentCount = msgCount || 0;

    if (currentCount >= messageLimit) {
      return res.status(403).json({
        error: 'limit_reached',
        message_count: currentCount,
        limit: messageLimit,
      });
    }

    // Conversation cap (spam protection)
    if (!isAdmin) {
      const { count: convCount } = await supabase
        .from('conversations')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);
      if (convCount >= 10) {
        return res.status(403).json({
          error: 'conversation_limit',
          message: 'Maximum conversations reached. Contact support for more access.',
        });
      }
    }

    // Validate conversation ownership
    convId = conversation_id;
    if (convId) {
      const { data: conv } = await supabase
        .from('conversations')
        .select('id')
        .eq('id', convId)
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .single();
      if (!conv) {
        return res.status(403).json({ error: 'Conversation not found' });
      }
    }

    // Ensure conversation exists
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
    const { data: savedMsg } = await supabase.from('messages').insert({
      conversation_id: convId,
      role: 'user',
      content: cleanMessage,
    }).select('id').single();
    userMsg = savedMsg;

    // Load conversation history (last 20 messages)
    const { data: historyData } = await supabase
      .from('messages')
      .select('role, content')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })
      .limit(20);
    history = historyData;
  }

  // Sanitize page_context: only allow whitelisted page names
  let sanitizedPageContext = null;
  if (page_context && page_context.name && VALID_PAGES.has(page_context.name)) {
    sanitizedPageContext = {
      name: page_context.name,
      path: String(page_context.path || '').replace(/[<>{}]/g, '').slice(0, 100),
    };
    // Board content for FlyBoard context (max 2000 chars, plain text only)
    if (page_context.board_content && typeof page_context.board_content === 'string') {
      sanitizedPageContext.board_content = page_context.board_content.replace(/[<>{}]/g, '').slice(0, 2000);
    }
    // Page detail (structured context from the active page, max 500 chars)
    if (page_context.detail && typeof page_context.detail === 'object') {
      const detailStr = JSON.stringify(page_context.detail).replace(/[<>{}]/g, '').slice(0, 500);
      try {
        sanitizedPageContext.detail = JSON.parse(detailStr.replace(/[<>]/g, ''));
      } catch {
        // detail fields may break after slicing JSON, fall back to safe extraction
        const d = page_context.detail;
        sanitizedPageContext.detail = {};
        for (const [k, v] of Object.entries(d)) {
          if (typeof v === 'string') sanitizedPageContext.detail[k] = v.replace(/[<>{}]/g, '').slice(0, 100);
          else if (typeof v === 'number') sanitizedPageContext.detail[k] = v;
          else if (typeof v === 'object' && v) {
            sanitizedPageContext.detail[k] = {};
            for (const [k2, v2] of Object.entries(v)) {
              if (typeof v2 === 'string') sanitizedPageContext.detail[k][k2] = v2.replace(/[<>{}]/g, '').slice(0, 100);
            }
          }
        }
      }
    }
  }

  // Find similar ideas if user might be describing one
  const ideaKeywords = ['idea', 'build', 'tool', 'app', 'project', 'product', 'saas', 'problem', 'solve', 'evaluate', 'score', 'trending', 'industry', 'opportunity', 'underrated', 'hidden gem'];
  const mightBeIdea = ideaKeywords.some(k => cleanMessage.toLowerCase().includes(k));

  // Detect search intent
  const searchFilters = parseSearchIntent(cleanMessage);

  // For guests, use service-role supabase for read-only queries (similar ideas, analytics)
  // For authenticated users, use their scoped client
  const queryClient = supabase || createClient(
    process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Run parallel: similar ideas + analytics + search results
  const [similarIdeas, analytics, searchResults] = await Promise.all([
    mightBeIdea
      ? findSimilarIdeas(queryClient, cleanMessage).catch(() => [])
      : Promise.resolve([]),
    fetchIdeaAnalytics(queryClient).catch(() => null),
    searchFilters
      ? searchIdeas(queryClient, searchFilters).catch(() => [])
      : Promise.resolve([]),
  ]);

  // Find relevant prompts from our library
  const relevantPrompts = findRelevantPrompts(cleanMessage);

  // Load user memories for cross-session context (skip for guests)
  let userMemories = [];
  if (!isGuest) {
    const { data: memories } = await supabase
      .from('flybot_memory')
      .select('key, value')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(10);
    userMemories = memories || [];
  }

  // Sanitize language (only allow known values)
  const sanitizedLanguage = language === 'pt-BR' ? 'pt-BR' : 'en';

  // Build system prompt with full knowledge base + live analytics
  const systemPrompt = buildSystemPrompt({
    similarIdeas,
    relevantPrompts,
    promptCatalog: promptLibrary,
    pageContext: sanitizedPageContext,
    analytics,
    searchResults,
    userMemories,
    language: sanitizedLanguage,
  });

  // Build messages array (empty for guests - single stateless exchange)
  const messages = isGuest
    ? [{ role: 'user', content: cleanMessage }]
    : (history || []).map(m => ({ role: m.role, content: m.content }));

  // Stream response (Sonnet for admin, Haiku for free/guest users)
  const model = isAdmin ? 'claude-sonnet-4-20250514' : 'claude-haiku-4-5-20251001';

  const anthropic = new Anthropic();

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  if (convId) {
    res.setHeader('X-Conversation-Id', convId);
  }

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

    // Fallback if model returned empty response (can happen with off-topic refusals)
    if (!fullResponse.trim()) {
      fullResponse = "That's outside my zone. I'm tuned for business ideas, content strategy, and building decisions. But if there's a building angle in there, I'm game.";
      res.write(`data: ${JSON.stringify({ type: 'chunk', content: fullResponse })}\n\n`);
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

    // Parse music action metadata if present
    const musicMatch = fullResponse.match(/<music_action>([\s\S]*?)<\/music_action>/);
    if (musicMatch) {
      try {
        if (!metadata) metadata = {};
        metadata.music_action = JSON.parse(musicMatch[1].trim());
      } catch (e) {
        // Failed to parse music action JSON, skip
      }
    }

    // Parse board action metadata if present
    const boardMatch = fullResponse.match(/<board_action>([\s\S]*?)<\/board_action>/);
    if (boardMatch) {
      try {
        if (!metadata) metadata = {};
        metadata.board_action = JSON.parse(boardMatch[1].trim());
      } catch (e) {
        // Failed to parse board action JSON, skip
      }
    }

    // Skip memory parsing and DB writes for guests
    let assistantMsg = null;
    if (!isGuest) {
      // Parse memory tags before saving (strip from stored content)
      const memoryMatches = [...fullResponse.matchAll(/<memory>([\s\S]*?)<\/memory>/g)];
      if (memoryMatches.length > 0) {
        const VALID_KEYS = new Set(['building', 'role', 'tools', 'goal', 'preference', 'background', 'industry', 'stage', 'audience', 'challenge']);
        for (const match of memoryMatches) {
          try {
            const mem = JSON.parse(match[1].trim());
            if (mem.key && mem.value && VALID_KEYS.has(mem.key) && typeof mem.value === 'string') {
              const safeValue = mem.value.replace(/[<>{}\n\r]/g, ' ').trim().slice(0, 200);
              // Check if key already exists (upsert is always safe for existing keys)
              const { data: existing } = await supabase
                .from('flybot_memory')
                .select('id')
                .eq('user_id', user.id)
                .eq('key', mem.key)
                .maybeSingle();

              if (existing) {
                // Update existing key
                await supabase
                  .from('flybot_memory')
                  .update({ value: safeValue, updated_at: new Date().toISOString() })
                  .eq('id', existing.id);
              } else {
                // Only insert new key if under 10 total
                const { count } = await supabase
                  .from('flybot_memory')
                  .select('id', { count: 'exact', head: true })
                  .eq('user_id', user.id);
                if ((count || 0) < 10) {
                  await supabase
                    .from('flybot_memory')
                    .insert({
                      user_id: user.id,
                      key: mem.key,
                      value: safeValue,
                    });
                }
              }
            }
          } catch {
            // Skip malformed memory tags
          }
        }
      }

      // Strip all special tags from stored content (keeps history clean for future context)
      const cleanResponse = fullResponse
        .replace(/<evaluation>[\s\S]*?<\/evaluation>/g, '')
        .replace(/<memory>[\s\S]*?<\/memory>/g, '')
        .replace(/<music_action>[\s\S]*?<\/music_action>/g, '')
        .replace(/<board_action>[\s\S]*?<\/board_action>/g, '')
        .trim();

      // Save assistant message
      const { data: savedAssistant } = await supabase.from('messages').insert({
        conversation_id: convId,
        role: 'assistant',
        content: cleanResponse || fullResponse,
        metadata,
      }).select('id').single();
      assistantMsg = savedAssistant;

      // Update conversation timestamp
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', convId);
    }

    // Send done event
    if (isGuest) {
      res.write(`data: ${JSON.stringify({
        type: 'done',
        is_guest: true,
        metadata,
      })}\n\n`);
    } else {
      const newCount = currentCount + 1;
      res.write(`data: ${JSON.stringify({
        type: 'done',
        conversation_id: convId,
        message_id: assistantMsg?.id || null,
        message_count: newCount,
        limit: messageLimit === Infinity ? null : messageLimit,
        metadata,
      })}\n\n`);
    }

  } catch (err) {
    console.error('FlyBot API error:', err?.status, err?.error?.type, err?.message);

    // Always clean up the orphan user message on error (skip for guests)
    if (!isGuest && userMsg?.id) {
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
