import { verifyAuth } from './lib/auth.js';

export default async function handler(req, res) {
  let auth;
  try {
    auth = await verifyAuth(req);
  } catch (err) {
    return res.status(err.status || 401).json({ error: err.message });
  }

  const { user, supabase } = auth;

  if (req.method === 'POST') {
    const { message_id, rating, comment } = req.body;

    if (!message_id || typeof message_id !== 'string') {
      return res.status(400).json({ error: 'message_id is required' });
    }
    if (!rating || !['up', 'down'].includes(rating)) {
      return res.status(400).json({ error: 'rating must be "up" or "down"' });
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(message_id)) {
      return res.status(400).json({ error: 'Invalid message_id format' });
    }

    // Verify the message belongs to a conversation the user owns
    const { data: msg } = await supabase
      .from('messages')
      .select('id, conversation_id')
      .eq('id', message_id)
      .single();

    if (!msg) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const { data: conv } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', msg.conversation_id)
      .eq('user_id', user.id)
      .single();

    if (!conv) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Sanitize comment
    const safeComment = comment
      ? String(comment).replace(/<[^>]*>/g, '').slice(0, 500).trim() || null
      : null;

    // Upsert feedback (one per user per message)
    const { error: upsertError } = await supabase
      .from('flybot_feedback')
      .upsert({
        message_id,
        user_id: user.id,
        rating,
        comment: safeComment,
      }, { onConflict: 'message_id,user_id' });

    if (upsertError) {
      console.error('Feedback upsert error:', upsertError);
      return res.status(500).json({ error: 'Failed to save feedback' });
    }

    return res.status(200).json({ ok: true, rating });
  }

  if (req.method === 'DELETE') {
    const { message_id } = req.body;

    if (!message_id || typeof message_id !== 'string') {
      return res.status(400).json({ error: 'message_id is required' });
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(message_id)) {
      return res.status(400).json({ error: 'Invalid message_id format' });
    }

    await supabase
      .from('flybot_feedback')
      .delete()
      .eq('message_id', message_id)
      .eq('user_id', user.id);

    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
