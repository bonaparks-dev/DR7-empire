import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

function looksLikeHttps(url?: string) {
  try { return !!url && new URL(url).protocol === 'https:'; } catch { return false; }
}

export function getSupabase(): SupabaseClient | null {
  if (client) return client;
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

  if (!looksLikeHttps(url) || !anon) {
    console.error('[Supabase] Missing/invalid VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY', { url });
    return null; // évite écran blanc si env manquants
  }
  client = createClient(url, anon, { auth: { persistSession: true, autoRefreshToken: true } });
  return client;
}
