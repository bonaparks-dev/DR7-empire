import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ahpmzjgkfxrrgxyirasa.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFocG16amdrZnhycmd4eWlyYXNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4Mjc3OTgsImV4cCI6MjA2OTQwMzc5OH0.XkjoVheKCqmgL0Ce-OqNAbItnW7L3GlXIxb8_R7f_FU';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('CRITICAL: Supabase credentials are missing. Please check your .env file.');
  console.error('Required: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

// ⚠️ Aggressive Fix for Chrome ERR_HTTP2_PROTOCOL_ERROR / ERR_CONNECTION_RESET
// Forces HTTP/1.1-like behavior by disabling connection reuse and caching
const customFetch: typeof fetch = (input, init?) => {
  const headers = new Headers(init?.headers);

  // Force connection close to prevent sticky HTTP/2 pooling
  headers.set('Connection', 'close');

  return fetch(input, {
    ...init,
    headers,
    keepalive: false,
    cache: 'no-store', // Prevent browser-side connection caching
    credentials: 'same-origin', // Limit credential-pooling interference
  });
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  db: {
    schema: 'public',
  },
  global: {
    fetch: customFetch
  }
});