import { createClient } from '@supabase/supabase-js';

// SECURE VERSION - NO HARDCODED CREDENTIALS
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validation obligatoire
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('CRITICAL: Supabase credentials are missing. Please check your .env file.');
  console.error('Required: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  throw new Error('Missing Supabase configuration');
}

// Additional URL validation
if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
  throw new Error('Invalid Supabase URL format');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  db: {
    schema: 'public',
  },
  // Enhanced error handling
  global: {
    headers: {
      'x-client-info': 'dr7-empire-web'
    }
  }
});