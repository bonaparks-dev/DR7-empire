import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ahpmzjgkfxrrgxyirasa.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFocG16amdrZnhycmd4eWlyYXNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4Mjc3OTgsImV4cCI6MjA2OTQwMzc5OH0.XkjoVheKCqmgL0Ce-OqNAbItnW7L3GlXIxb8_R7f_FU';

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('CRITICAL: Supabase credentials are missing. Please check your .env file.');
  console.error('Required: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

// Custom fetch wrapper with retry logic and timeout
const customFetch = async (url: RequestInfo | URL, options?: RequestInit): Promise<Response> => {
  const maxRetries = 3;
  const timeout = 8000; // 8 seconds
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      // Merge abort signal with existing options
      const fetchOptions = {
        ...options,
        signal: controller.signal,
      };

      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);

      // Log successful request
      if (attempt > 0) {
        console.log(`✅ Supabase request succeeded on attempt ${attempt + 1}:`, url.toString());
      }

      return response;
    } catch (error: any) {
      lastError = error;
      const isLastAttempt = attempt === maxRetries - 1;

      // Log detailed error information
      console.warn(`⚠️ Supabase fetch attempt ${attempt + 1}/${maxRetries} failed:`, {
        url: url.toString(),
        error: error.message,
        name: error.name,
        online: navigator.onLine,
        attempt: attempt + 1,
      });

      // Don't retry on abort (timeout) for the last attempt
      if (isLastAttempt) {
        console.error('❌ All Supabase retry attempts exhausted:', {
          url: url.toString(),
          finalError: error.message,
          networkOnline: navigator.onLine,
          totalAttempts: maxRetries,
        });
        throw error;
      }

      // Exponential backoff: 1s, 2s, 4s
      const backoffDelay = Math.pow(2, attempt) * 1000;
      console.log(`⏳ Retrying in ${backoffDelay}ms...`);
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
    }
  }

  throw lastError || new Error('Fetch failed after retries');
};

// Create Supabase client with custom fetch and configuration
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