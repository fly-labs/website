import { createClient } from '@supabase/supabase-js';

const ADMIN_EMAIL = 'alvesluiz7@icloud.com';

let supabaseAdmin;

function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    const url = process.env.VITE_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      throw new Error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    }
    supabaseAdmin = createClient(url, serviceKey);
  }
  return supabaseAdmin;
}

export async function verifyAuth(req) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw { status: 401, message: 'Missing authorization token' };
  }

  const token = authHeader.replace('Bearer ', '');
  const supabase = getSupabaseAdmin();

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    throw { status: 401, message: 'Invalid or expired token' };
  }

  return {
    user,
    isAdmin: user.email === ADMIN_EMAIL,
    supabase,
  };
}

export { getSupabaseAdmin, ADMIN_EMAIL };
