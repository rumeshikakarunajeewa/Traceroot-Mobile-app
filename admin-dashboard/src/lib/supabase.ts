import { createClient } from '@supabase/supabase-js';

// Environment variables configured for web administration (e.g., via Vercel)
const supabaseUrl =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  'https://twwuqaxmoiaqmvvcwqqw.supabase.co';

const supabaseKey =
  (typeof import.meta !== 'undefined' &&
    (import.meta.env?.VITE_SUPABASE_ANON_KEY || import.meta.env?.VITE_SUPABASE_KEY)) ||
  'sb_publishable_FKeaopwpGDcV4nG9MkImKw_q-_TPKcQ';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

