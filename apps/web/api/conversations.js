import { verifyAuth } from './lib/auth.js';

export default async function handler(req, res) {
  let auth;
  try {
    auth = await verifyAuth(req);
  } catch (err) {
    return res.status(err.status || 401).json({ error: err.message });
  }

  const { user, supabase } = auth;

  if (req.method === 'GET') {
    // List user's conversations
    const { data, error } = await supabase
      .from('conversations')
      .select('id, title, last_message_at, created_at')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('last_message_at', { ascending: false })
      .limit(50);

    if (error) {
      return res.status(500).json({ error: 'Failed to load conversations' });
    }

    return res.status(200).json({ conversations: data });

  } else if (req.method === 'POST') {
    // Create new conversation
    const { title } = req.body || {};
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        user_id: user.id,
        title: (title || 'New conversation').slice(0, 200),
      })
      .select('id, title, created_at')
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to create conversation' });
    }

    return res.status(201).json(data);

  } else if (req.method === 'DELETE') {
    // Soft-delete conversation
    const { id } = req.body || {};
    if (!id) {
      return res.status(400).json({ error: 'Conversation ID required' });
    }

    const { error } = await supabase
      .from('conversations')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      return res.status(500).json({ error: 'Failed to delete conversation' });
    }

    return res.status(200).json({ success: true });

  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}
