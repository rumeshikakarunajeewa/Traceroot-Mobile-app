import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const rawUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const rawKey = (
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_KEY
)?.trim();

const isConfigured = Boolean(
  rawUrl &&
    rawUrl.startsWith('http') &&
    rawKey &&
    rawKey.length > 0 &&
    rawUrl !== 'https://placeholder.supabase.co'
);

if (!isConfigured) {
  console.warn(
    '⚠️ [Traceroot] Supabase is not configured. Please add valid EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to your .env file.'
  );
}

const supabaseUrl =
  rawUrl && rawUrl.startsWith('http')
    ? rawUrl
    : 'https://placeholder.supabase.co';

const supabaseAnonKey =
  rawKey && rawKey.length > 0
    ? rawKey
    : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
