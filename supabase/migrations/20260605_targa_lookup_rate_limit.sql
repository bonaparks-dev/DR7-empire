-- 2026-06-05: rate-limit delle ricerche targa sul sito (netlify/functions/lookupTarga.ts).
-- Ogni ricerca chiama l'API OpenAPI a pagamento → un singolo visitatore che prova
-- molte targhe diverse genera costi alti. Registriamo (ip, targa) per contare le
-- targhe DISTINTE per IP nella finestra e bloccare oltre il limite (env
-- TARGA_LOOKUP_MAX, default 5; finestra TARGA_LOOKUP_WINDOW_H, default 24h).
create table if not exists public.targa_lookup_log (
  id uuid primary key default gen_random_uuid(),
  ip text not null,
  plate text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_targa_lookup_ip_time on public.targa_lookup_log (ip, created_at desc);

-- Solo service-role (Netlify function). RLS on, nessuna policy → anon non accede.
alter table public.targa_lookup_log enable row level security;

comment on table public.targa_lookup_log is 'Rate limiting ricerche targa sito (lookupTarga). Service-role only.';
