import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ahpmzjgkfxrrgxyirasa.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFocG16amdrZnhycmd4eWlyYXNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4Mjc3OTgsImV4cCI6MjA2OTQwMzc5OH0.XkjoVheKCqmgL0Ce-OqNAbItnW7L3GlXIxb8_R7f_FU';

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('CRITICAL: Supabase credentials are missing. Please check your .env file.');
  console.error('Required: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

// Detect Chrome browser
const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);

// Aggressive retry logic for Chrome HTTP/2 issues
const customFetch: typeof fetch = async (input, init?) => {
  const maxRetries = 3;
  const retryDelays = [500, 1000, 2000]; // Exponential backoff

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const headers = new Headers(init?.headers);

      // Chrome-specific: Force fresh connections
      if (isChrome) {
        headers.set('Connection', 'close');
        headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        headers.set('Pragma', 'no-cache');
      }

      const response = await fetch(input, {
        ...init,
        headers,
        keepalive: false,
        cache: 'no-store',
        credentials: 'same-origin',
      });

      // Success - return response
      return response;
    } catch (error) {
      const isLastAttempt = attempt === maxRetries;

      if (isLastAttempt) {
        // All retries failed - throw error
        console.error(`❌ Fetch failed after ${maxRetries + 1} attempts:`, error);
        throw error;
      }

      // Wait before retry
      const delay = retryDelays[attempt];
      console.warn(`⚠️ Fetch attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // Should never reach here, but TypeScript needs it
  throw new Error('Unexpected error in customFetch');
};

// Create Supabase client with custom fetch
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  db: {
    schema: 'public',
  },
  global: {
    fetch: customFetch,
  },
});