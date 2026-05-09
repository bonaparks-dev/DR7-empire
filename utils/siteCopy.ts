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
  cancellazione?: CancellazioneCopy;
  // Future: membership, hero, chi_siamo, footer, legali
}

// ─── Cancellazione ──────────────────────────────────────────────────────────
//
// Page schema: admin can edit page title, every section heading, every
// paragraph + bullet item, and the footer (contact, address, last-updated
// date). Placeholders (`{thresholdDays}` / `{refundPercent}` /
// `{penaltyPercent}` / `{daysWord}`) are kept as raw text in the DB and
// resolved by `applyCancellazionePlaceholders()` at render time so the
// numbers always match Centralina Pro > Automazioni rules.
export type CancellazioneBlock =
  | { type: 'p'; text_it: string; text_en: string }
  | { type: 'p-bold'; text_it: string; text_en: string }
  | { type: 'p-italic'; text_it: string; text_en: string }
  | { type: 'ul'; items_it: string[]; items_en: string[]; tone?: 'default' | 'green' };

export interface CancellazioneSection {
  id: string;
  variant: 'standard' | 'flex';
  title_it: string;
  title_en: string;
  blocks: CancellazioneBlock[];
}

export interface CancellazioneCopy {
  page_title_it: string;
  page_title_en: string;
  sections: CancellazioneSection[];
  contact_label_it: string;
  contact_label_en: string;
  contact_email: string;
  contact_address: string;
  last_updated_it: string;
  last_updated_en: string;
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

/**
 * Cancellation policy copy — falls back to legacy hardcoded text when no
 * admin override exists. Use `applyCancellazionePlaceholders()` to resolve
 * `{thresholdDays}` etc. against the live useCancellationPolicy() values.
 */
export async function getCancellazioneCopy(): Promise<CancellazioneCopy> {
  const snap = await loadOnce();
  if (snap.cancellazione && Array.isArray(snap.cancellazione.sections) && snap.cancellazione.sections.length > 0) {
    return snap.cancellazione;
  }
  return DEFAULT_CANCELLAZIONE;
}

export interface CancellazionePlaceholderValues {
  thresholdDays: number;
  refundPercent: number;
  penaltyPercent: number;
  /** Pre-formatted day word per language, e.g. "5 (cinque) giorni" or
   *  "5 (five) days". Computed by the page from thresholdDays + lang. */
  daysWord: string;
}

const PH_KEYS = ['thresholdDays', 'refundPercent', 'penaltyPercent', 'daysWord'] as const;

export function applyCancellazionePlaceholders(s: string, vals: CancellazionePlaceholderValues): string {
  let out = s;
  for (const key of PH_KEYS) {
    out = out.split(`{${key}}`).join(String(vals[key]));
  }
  return out;
}

/** Force a re-fetch (useful after admin edits in dev). */
export function invalidateSiteCopyCache(): void {
  CACHE = null;
  pending = null;
}

// ─── Default Cancellazione seed ─────────────────────────────────────────────
// Mirrors the legacy hardcoded /cancellation page word-for-word so swapping
// to admin-managed copy is a no-op until someone edits.
const DEFAULT_CANCELLAZIONE: CancellazioneCopy = {
  page_title_it: 'Policy di Cancellazione e Modifica Prenotazioni',
  page_title_en: 'Cancellation and Booking Modification Policy',
  contact_label_it: 'Per assistenza o informazioni:',
  contact_label_en: 'For assistance or information:',
  contact_email: 'info@dr7.app',
  contact_address: 'Dubai Rent 7.0 S.p.A. - Viale Marconi, 229, 09131 Cagliari CA',
  last_updated_it: 'Ultimo aggiornamento: 10 aprile 2026',
  last_updated_en: 'Last updated: April 10, 2026',
  sections: [
    {
      id: 'ambito',
      variant: 'standard',
      title_it: '1. Ambito di applicazione',
      title_en: '1. Scope of application',
      blocks: [
        { type: 'p',
          text_it: 'La presente policy disciplina le condizioni di cancellazione e gestione delle prenotazioni relative a tutti i servizi erogati da Dubai Rent 7.0 S.p.A. (DR7), inclusi – a titolo esemplificativo e non esaustivo – noleggio veicoli, servizi accessori, esperienze e qualsiasi altra prestazione disponibile.',
          text_en: 'This policy governs the cancellation and management conditions for bookings related to all services provided by Dubai Rent 7.0 S.p.A. (DR7), including – but not limited to – vehicle rental, ancillary services, experiences, and any other available service.' },
        { type: 'p',
          text_it: 'La policy si applica a tutte le prenotazioni effettuate tramite:',
          text_en: 'The policy applies to all bookings made via:' },
        { type: 'ul',
          items_it: ['sito web ufficiale DR7', 'sedi operative DR7', 'canali digitali (WhatsApp, e-mail, piattaforme online)', 'contatto telefonico'],
          items_en: ['official DR7 website', 'DR7 operational offices', 'digital channels (WhatsApp, email, online platforms)', 'telephone contact'] },
        { type: 'p',
          text_it: 'Le presenti condizioni sono valide indipendentemente dalla modalità di prenotazione e dal metodo di pagamento utilizzato, inclusi carta di credito/debito, bonifico bancario, wallet DR7 o altri sistemi accettati.',
          text_en: 'These conditions are valid regardless of the booking method and payment method used, including credit/debit card, bank transfer, DR7 wallet, or other accepted systems.' },
      ],
    },
    {
      id: 'entro-soglia',
      variant: 'standard',
      title_it: '2. Cancellazione entro {thresholdDays} giorni dalla data del servizio',
      title_en: '2. Cancellation up to {thresholdDays} days before service date',
      blocks: [
        { type: 'p',
          text_it: 'Il Cliente può cancellare la prenotazione fino a {daysWord} prima della data e ora previste per l’erogazione del servizio.',
          text_en: 'The Customer may cancel the booking up to {daysWord} before the scheduled service date and time.' },
        { type: 'p', text_it: 'In tal caso:', text_en: 'In such case:' },
        { type: 'ul',
          items_it: [
            'DR7 tratterrà una quota pari al {penaltyPercent}% dell’importo complessivo, a copertura dei costi organizzativi e gestionali',
            'il restante {refundPercent}% sarà riconosciuto esclusivamente sotto forma di credit wallet DR7',
          ],
          items_en: [
            'DR7 will retain {penaltyPercent}% of the total amount to cover organizational and management costs',
            'the remaining {refundPercent}% will be credited exclusively as DR7 credit wallet',
          ] },
        { type: 'p-bold', text_it: 'Caratteristiche del credit wallet:', text_en: 'Credit wallet features:' },
        { type: 'ul',
          items_it: ['validità: 12 (dodici) mesi dalla data di emissione', 'utilizzabile per qualsiasi servizio DR7', 'non cedibile a terzi', 'non convertibile in denaro'],
          items_en: ['validity: 12 (twelve) months from date of issue', 'usable for any DR7 service', 'not transferable to third parties', 'not convertible into cash'] },
      ],
    },
    {
      id: 'oltre-soglia',
      variant: 'standard',
      title_it: '3. Cancellazione oltre i {thresholdDays} giorni dalla data del servizio',
      title_en: '3. Cancellation within {thresholdDays} days of service date',
      blocks: [
        { type: 'p',
          text_it: 'In caso di cancellazione comunicata oltre il termine di {daysWord} dalla data prevista per il servizio:',
          text_en: 'In case of cancellation communicated within {daysWord} of the scheduled service date:' },
        { type: 'ul',
          items_it: ['non è previsto alcun rimborso', 'non è prevista emissione di credit wallet'],
          items_en: ['no refund will be granted', 'no credit wallet will be issued'] },
        { type: 'p',
          text_it: 'La prenotazione si intende definitivamente confermata e non rimborsabile, ai sensi degli artt. 1453 e seguenti del Codice Civile, anche in considerazione dell’organizzazione e allocazione delle risorse operative.',
          text_en: 'The booking is considered definitively confirmed and non-refundable, pursuant to Articles 1453 et seq. of the Italian Civil Code, also considering the organization and allocation of operational resources.' },
      ],
    },
    {
      id: 'no-show',
      variant: 'standard',
      title_it: '4. Mancata presentazione (No Show)',
      title_en: '4. No Show',
      blocks: [
        { type: 'p',
          text_it: 'In caso di mancata presentazione del Cliente nel giorno e all’orario concordati, senza preventiva comunicazione nei termini indicati:',
          text_en: 'In case of the Customer’s failure to appear on the agreed day and time, without prior notice within the specified deadlines:' },
        { type: 'ul',
          items_it: ['l’intero importo versato sarà trattenuto a titolo di penale, ai sensi dell’art. 1382 c.c.'],
          items_en: ['the entire amount paid will be retained as a penalty, pursuant to Article 1382 of the Italian Civil Code'] },
        { type: 'p', text_it: 'Rientrano nella fattispecie di No Show anche:', text_en: 'No Show also includes:' },
        { type: 'ul',
          items_it: ['ritardi significativi tali da compromettere l’erogazione del servizio', 'impossibilità di fruire del servizio per cause non comunicate nei termini previsti'],
          items_en: ['significant delays that compromise service delivery', 'inability to use the service due to reasons not communicated within the specified deadlines'] },
        { type: 'p', text_it: 'In tali casi:', text_en: 'In such cases:' },
        { type: 'ul',
          items_it: ['non è previsto alcun rimborso', 'non è prevista emissione di voucher o credito'],
          items_en: ['no refund will be granted', 'no voucher or credit will be issued'] },
      ],
    },
    {
      id: 'modalita',
      variant: 'standard',
      title_it: '5. Modalità di comunicazione delle cancellazioni',
      title_en: '5. Cancellation communication methods',
      blocks: [
        { type: 'p',
          text_it: 'Le richieste di cancellazione devono essere effettuate esclusivamente attraverso i canali ufficiali DR7:',
          text_en: 'Cancellation requests must be made exclusively through official DR7 channels:' },
        { type: 'ul',
          items_it: ['e-mail all’indirizzo: info@dr7.app', 'messaggistica WhatsApp ai numeri ufficiali pubblicati da DR7', 'area riservata del sito web DR7, ove il Cliente può procedere in autonomia alla cancellazione'],
          items_en: ['email to: info@dr7.app', 'WhatsApp messaging to official DR7 numbers', 'DR7 website reserved area, where the Customer can independently proceed with cancellation'] },
        { type: 'p', text_it: 'Ai fini della validità della richiesta:', text_en: 'For the validity of the request:' },
        { type: 'ul',
          items_it: ['farà fede la data e ora di invio della comunicazione tramite i canali sopra indicati', 'per le cancellazioni effettuate tramite sito, farà fede il timestamp registrato dai sistemi DR7'],
          items_en: ['the date and time of sending the communication through the above channels will be authoritative', 'for cancellations made via the website, the timestamp recorded by DR7 systems will be authoritative'] },
        { type: 'p',
          text_it: 'Non saranno ritenute valide richieste di cancellazione effettuate tramite canali non ufficiali o diversi da quelli sopra indicati.',
          text_en: 'Cancellation requests made through unofficial or different channels than those indicated above will not be considered valid.' },
      ],
    },
    {
      id: 'trasparenza',
      variant: 'standard',
      title_it: '6. Trasparenza e accettazione della policy',
      title_en: '6. Transparency and policy acceptance',
      blocks: [
        { type: 'p', text_it: 'La presente policy è:', text_en: 'This policy is:' },
        { type: 'ul',
          items_it: ['pubblicata sul sito ufficiale DR7', 'consultabile durante il processo di prenotazione', 'accessibile tramite link diretto anche nei sistemi di prenotazione via WhatsApp e altri canali digitali'],
          items_en: ['published on the official DR7 website', 'accessible during the booking process', 'accessible via direct link also in WhatsApp booking systems and other digital channels'] },
        { type: 'p-bold',
          text_it: 'La conferma della prenotazione comporta la piena accettazione delle presenti condizioni.',
          text_en: 'Confirmation of the booking implies full acceptance of these conditions.' },
      ],
    },
    {
      id: 'dr7-flex',
      variant: 'flex',
      title_it: '7. Servizio opzionale "DR7 FLEX" (solo noleggio)',
      title_en: '7. Optional "DR7 FLEX" service (rentals only)',
      blocks: [
        { type: 'p',
          text_it: 'DR7 FLEX è un servizio opzionale acquistabile in fase di prenotazione del noleggio. Non è applicabile ad altri servizi.',
          text_en: 'DR7 FLEX is an optional service purchasable when booking a rental. It does not apply to other services.' },
        { type: 'p', text_it: 'Condizioni:', text_en: 'Terms:' },
        { type: 'ul', tone: 'green',
          items_it: ['Cancellazione consentita fino al giorno stesso del noleggio.', 'Rimborso del 90% in credito DR7 Wallet per utilizzi futuri.', 'È possibile 1 solo spostamento gratuito, salvo eventuale differenza di prezzo.', 'Nessuna perdita totale dell’importo, salvo promozioni non rimborsabili o mancata presentazione.'],
          items_en: ['Cancellation allowed up to the same day of the rental.', '90% refund as DR7 Wallet credit for future use.', 'One free reschedule allowed, subject to any price difference.', 'No total loss of the amount, except for non-refundable promotions or no-show.'] },
        { type: 'p-italic',
          text_it: 'In assenza dell’acquisto del servizio DR7 FLEX, si applica integralmente la presente policy standard per il noleggio.',
          text_en: 'In the absence of purchasing the DR7 FLEX service, this standard policy applies in full for the rental.' },
      ],
    },
    {
      id: 'prime-flex',
      variant: 'flex',
      title_it: '8. Servizio opzionale "PRIME FLEX" (solo lavaggio)',
      title_en: '8. Optional "PRIME FLEX" service (car wash only)',
      blocks: [
        { type: 'p',
          text_it: 'PRIME FLEX è un servizio opzionale acquistabile in fase di prenotazione del lavaggio. Non è applicabile ad altri servizi.',
          text_en: 'PRIME FLEX is an optional service purchasable when booking a car wash. It does not apply to other services.' },
        { type: 'p', text_it: 'Condizioni:', text_en: 'Terms:' },
        { type: 'ul', tone: 'green',
          items_it: ['Cancellazione consentita fino al giorno stesso del lavaggio.', 'Rimborso del 90% in credito DR7 Wallet per utilizzi futuri.', 'È possibile 1 solo spostamento gratuito, salvo eventuale differenza di prezzo.', 'Nessuna perdita totale dell’importo, salvo promozioni non rimborsabili o mancata presentazione.'],
          items_en: ['Cancellation allowed up to the same day of the car wash.', '90% refund as DR7 Wallet credit for future use.', 'One free reschedule allowed, subject to any price difference.', 'No total loss of the amount, except for non-refundable promotions or no-show.'] },
        { type: 'p-italic',
          text_it: 'In assenza dell’acquisto del servizio PRIME FLEX, si applica integralmente la presente policy standard per il lavaggio.',
          text_en: 'In the absence of purchasing the PRIME FLEX service, this standard policy applies in full for the car wash.' },
      ],
    },
  ],
};
