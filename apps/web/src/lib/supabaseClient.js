import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  if (import.meta.env.PROD) {
    throw new Error('[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Cannot start in production without these.');
  }
  console.warn('[Supabase] Missing environment variables. Auth and database features will not work.');
}

const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
export default supabase;
