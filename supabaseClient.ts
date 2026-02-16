import { createClient } from '@supabase/supabase-js';

// CRITICAL: Keep hardcoded fallbacks — VITE_* env vars are baked at BUILD TIME by Vite.
// If Netlify doesn't have them set, the app gets `undefined` and crashes entirely.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ahpmzjgkfxrrgxyirasa.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFocG16amdrZnhycmd4eWlyYXNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzEzNDQ1NzcsImV4cCI6MjA0NjkyMDU3N30.AtBeKfIMJYLH46hVTqJAADQPmWJAmiGsel0JEiX27Gc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  db: {
    schema: 'public',
  }
});
