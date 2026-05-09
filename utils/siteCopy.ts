/**
 * Site copy helper (website browser side).
 *
 * Reads admin-editable website text from
 * `centralina_pro_config.config.site_copy.*` once on module load.
 * Each consumer falls back to the hardcoded legacy string when the
 * config row is missing — so unconfigured pages never break.
 *
 * Operators edit the copy in admin > Sito. Changes take effect on
 * next page reload.
 */

import { supabase } from '../supabaseClient';

// ─── Schemas ────────────────────────────────────────────────────────────────
export interface FaqEntry {
  id: string;
  question: string;
  answer: string;
}

interface SiteCopySnapshot {
  faq?: FaqEntry[];
  // Future: cancellazione, membership, hero, chi_siamo, footer, legali
}

// ─── Defaults ────────────────────────────────────────────────────────────────
const DEFAULT_FAQ: FaqEntry[] = [
  {
    id: 'requisiti-noleggio',
    question: 'Quali sono i requisiti per noleggiare un\'auto?',
    answer: 'Il conducente deve avere almeno 25 anni, essere in possesso di una patente di guida valida e fornire prova di copertura assicurativa completa. Per tutti i noleggi e\' richiesta una cauzione.',
  },
  {
    id: 'come-funziona-dr7-club',
    question: 'Come funziona la membership DR7 Club?',
    answer: 'La nostra membership esclusiva offre accesso a tariffe preferenziali, prenotazione prioritaria, servizio concierge 24/7 e inviti a eventi privati. Puoi scegliere fra fatturazione mensile o annuale su tre tier diversi.',
  },
  {
    id: 'politica-cancellazione',
    question: 'Qual e\' la politica di cancellazione?',
    answer: 'Le politiche di cancellazione variano in base al servizio prenotato. Per i dettagli specifici, consulta il Contratto di Noleggio fornito al momento della conferma o contatta il nostro supporto.',
  },
  {
    id: 'metodi-pagamento',
    question: 'Quali metodi di pagamento accettate?',
    answer: 'Accettiamo le principali carte di credito (Visa, MasterCard, American Express) e una selezione di criptovalute. Le opzioni di pagamento vengono presentate in fase di checkout.',
  },
];

// ─── Cache ───────────────────────────────────────────────────────────────────
let CACHE: SiteCopySnapshot | null = null;
let pending: Promise<SiteCopySnapshot> | null = null;

async function loadOnce(): Promise<SiteCopySnapshot> {
  if (CACHE) return CACHE;
  if (pending) return pending;
  pending = (async () => {
    try {
      const { data } = await supabase
        .from('centralina_pro_config')
        .select('config')
        .eq('id', 'main')
        .maybeSingle();
      const cfg = (data?.config ?? null) as Record<string, unknown> | null;
      const sc = cfg?.site_copy as SiteCopySnapshot | undefined;
      CACHE = sc ?? {};
      return CACHE;
    } catch {
      CACHE = {};
      return CACHE;
    } finally {
      pending = null;
    }
  })();
  return pending;
}

// Pre-warm at module load (no await — consumers will await their own getter).
void loadOnce();

// ─── Getters ─────────────────────────────────────────────────────────────────
/**
 * FAQ entries to render on the /faq page.
 * Returns the admin-configured list when present + non-empty,
 * otherwise the hardcoded fallback.
 */
export async function getFaqEntries(): Promise<FaqEntry[]> {
  const snap = await loadOnce();
  if (snap.faq && Array.isArray(snap.faq) && snap.faq.length > 0) {
    return snap.faq;
  }
  return DEFAULT_FAQ;
}

/** Force a re-fetch (useful after admin edits in dev). */
export function invalidateSiteCopyCache(): void {
  CACHE = null;
  pending = null;
}
