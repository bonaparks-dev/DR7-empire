import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ahpmzjgkfxrrgxyirasa.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFocG16amdrZnhycmd4eWlyYXNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4Mjc3OTgsImV4cCI6MjA2OTQwMzc5OH0.XkjoVheKCqmgL0Ce-OqNAbItnW7L3GlXIxb8_R7f_FU';

// Custom fetch with retry logic for HTTP/2 protocol errors
const customFetch = async (url: RequestInfo | URL, options?: RequestInit): Promise<Response> => {
  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      return response;
    } catch (error: any) {
      lastError = error;
      console.warn(`Fetch attempt ${attempt + 1} failed:`, error.message);

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  throw lastError || new Error('Fetch failed after retries');
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    headers: {
      'x-client-info': 'dr7empire-web',
    },
    fetch: customFetch, // Use custom fetch with retry logic
  },
  db: {
    schema: 'public',
  },
  // Add retry logic for network issues
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});