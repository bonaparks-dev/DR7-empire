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
  membership?: MembershipCopy;
  home?: HomeCopy;
  about?: AboutCopy;
  // Future: footer, legali
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

// ─── Membership / DR7 Club ──────────────────────────────────────────────────
//
// Pricing numbers (€39 / €/month / annual savings) come from
// MEMBERSHIP_TIERS at runtime — they're not editable here. What IS editable:
// hero copy, pricing-card surround text, the entire "DR7 Elite Rewards"
// section (header + sub-sections with rich blocks), and the reward-system
// grid items. Use the same `{monthlyPrice}` / `{annualPrice}` /
// `{annualMonthly}` placeholders if you want admin to inline live numbers.
export interface MembershipRewardItem {
  label_it: string;
  label_en: string;
  reward: string;       // "2%", "1%", "3%", ... — free-form badge text
  note_it: string | null;
  note_en: string | null;
}

export interface MembershipCopy {
  // Hero band
  hero_eyebrow_it: string; hero_eyebrow_en: string;
  hero_title: string;
  hero_subtitle_it: string; hero_subtitle_en: string;
  hero_opener_it: string; hero_opener_en: string;     // "...starting from just {monthlyPrice}/mese"
  // Pricing card surround
  pricing_card_title: string;
  pricing_billing_monthly_it: string; pricing_billing_monthly_en: string;
  pricing_billing_annual_it: string; pricing_billing_annual_en: string;
  pricing_billing_save_badge: string;                  // e.g. "-33%"
  pricing_cycle_month_it: string; pricing_cycle_month_en: string;
  pricing_cycle_year_it: string; pricing_cycle_year_en: string;
  pricing_savings_it: string; pricing_savings_en: string;  // template w/ {annualMonthly},{annualSavings}
  pricing_cta_it: string; pricing_cta_en: string;
  pricing_cta_footnote_it: string; pricing_cta_footnote_en: string;
  // DR7 Elite Rewards block
  elite_title: string;
  elite_subtitle_it: string; elite_subtitle_en: string;
  elite_intro_it: string; elite_intro_en: string;
  elite_sections: CancellazioneSection[];              // reuse rich-block schema
  elite_cta_title_it: string; elite_cta_title_en: string;
  elite_cta_text_it: string; elite_cta_text_en: string;
  elite_cta_logged_out_it: string; elite_cta_logged_out_en: string;
  elite_cta_logged_in_it: string; elite_cta_logged_in_en: string;
  // Reward-system grid
  reward_title_it: string; reward_title_en: string;
  reward_intro_it: string; reward_intro_en: string;
  reward_items: MembershipRewardItem[];
  reward_footnote_it: string; reward_footnote_en: string;
}

export interface MembershipPlaceholderValues {
  monthlyPrice: string;     // formatted e.g. "39,00"
  annualPrice: string;      // formatted e.g. "390"
  annualMonthly: string;    // formatted e.g. "32,50"
  annualSavings: string;    // formatted savings
}

export function applyMembershipPlaceholders(s: string, vals: MembershipPlaceholderValues): string {
  return s
    .split('{monthlyPrice}').join(vals.monthlyPrice)
    .split('{annualPrice}').join(vals.annualPrice)
    .split('{annualMonthly}').join(vals.annualMonthly)
    .split('{annualSavings}').join(vals.annualSavings);
}

// ─── Home / Hero ────────────────────────────────────────────────────────────
export interface HomeSlide {
  id: string;
  video_src: string;       // path under /public, e.g. "/main.mp4"
}

/**
 * Override for a single category card on the homepage. Only the categories
 * with a matching `id` get overridden; the others keep the hardcoded
 * DISPLAY_TITLE / CATEGORY_IMAGE values from HomePage.tsx.
 */
export interface HomeCategoryOverride {
  id: string;              // must match a RENTAL_CATEGORIES id
  display_title_it: string;
  display_title_en: string;
  image_src: string;       // path under /public, e.g. "/car.jpeg"
}

export interface HomeCopy {
  seo_h1_it: string;
  seo_h1_en: string;
  hero_autoplay_seconds: number;     // default 8
  hero_slides: HomeSlide[];
  categories: HomeCategoryOverride[];
}

// ─── Chi Siamo (About) ──────────────────────────────────────────────────────
export interface AboutFounder {
  id: string;
  name: string;
  role_it: string; role_en: string;
  photo_src: string;          // path under /public, e.g. "/Valerio.jpg"
  alt_it: string; alt_en: string;
}

export interface BilingualParagraph {
  text_it: string;
  text_en: string;
}

export interface AboutCopy {
  founders: AboutFounder[];
  story_title_it: string; story_title_en: string;
  story_paragraphs: BilingualParagraph[];
  story_outro_main_it: string; story_outro_main_en: string;
  story_outro_sub_it: string; story_outro_sub_en: string;
  story_signature: string;    // "— Valerio & Ilenia"
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

/**
 * Membership / DR7 Club page copy — falls back to the legacy hardcoded
 * strings when admin hasn't customized.
 */
export async function getMembershipCopy(): Promise<MembershipCopy> {
  const snap = await loadOnce();
  if (snap.membership && Array.isArray(snap.membership.elite_sections)) {
    return snap.membership;
  }
  return DEFAULT_MEMBERSHIP;
}

/**
 * Home page copy + hero slides + category overrides. Falls back to
 * hardcoded defaults so the page never goes blank if config is missing.
 */
export async function getHomeCopy(): Promise<HomeCopy> {
  const snap = await loadOnce();
  if (snap.home && Array.isArray(snap.home.hero_slides) && snap.home.hero_slides.length > 0) {
    return snap.home;
  }
  return DEFAULT_HOME;
}

/**
 * Chi Siamo (About) page copy. Falls back to legacy hardcoded text when
 * admin hasn't customized.
 */
export async function getAboutCopy(): Promise<AboutCopy> {
  const snap = await loadOnce();
  if (snap.about && Array.isArray(snap.about.founders) && Array.isArray(snap.about.story_paragraphs)) {
    return snap.about;
  }
  return DEFAULT_ABOUT;
}

/** Force a re-fetch (useful after admin edits in dev). */
export function invalidateSiteCopyCache(): void {
  CACHE = null;
  pending = null;
}

// ─── Default About seed ─────────────────────────────────────────────────────
const DEFAULT_ABOUT: AboutCopy = {
  founders: [
    {
      id: 'valerio',
      name: 'Valerio',
      role_it: 'Co-fondatore',
      role_en: 'Co-founder',
      photo_src: '/Valerio.jpg',
      alt_it: 'Valerio - Co-fondatore DR7 Empire',
      alt_en: 'Valerio - Co-founder DR7 Empire',
    },
    {
      id: 'ilenia',
      name: 'Ilenia',
      role_it: 'Co-fondatrice',
      role_en: 'Co-founder',
      photo_src: '/Ilenia.jpg',
      alt_it: 'Ilenia - Co-fondatrice DR7 Empire',
      alt_en: 'Ilenia - Co-founder DR7 Empire',
    },
  ],
  story_title_it: 'DR7 Empire non è un nome. È una misura.',
  story_title_en: 'DR7 Empire is not a name. It’s a standard.',
  story_paragraphs: [
    {
      text_it: 'Nasce da un’idea semplice: il lusso va organizzato, non esibito. Per questo l’abbiamo costruito come un impero del lusso: supercar pronte quando arrivate, ville che respirano ordine, yacht che aspettano la rotta giusta, elicotteri e jet privati che accorciano le distanze, una membership che apre porte con discrezione.',
      text_en: 'Born from a simple idea: luxury must be organized, not flaunted. That’s why we built it as an empire of luxury: supercars ready when you arrive, villas that breathe order, yachts waiting for the right course, helicopters and private jets that shorten distances, a membership that opens doors with discretion.',
    },
    {
      text_it: 'Siamo Valerio e Ilenia, co-leader e creatori del brand. Camminiamo allo stesso passo: uniamo la calma delle cose fatte bene alla precisione dei tempi rispettati. La Sardegna ci ha insegnato l’essenziale: il mare all’alba, il vento che cambia, il valore del silenzio. DR7 Empire prende da qui la sua regola: meno rumore, più certezza.',
      text_en: 'We are Valerio and Ilenia, co-leaders and creators of the brand. We walk in step: combining the calm of things done well with the precision of times respected. Sardinia taught us the essentials: the sea at dawn, the changing wind, the value of silence. DR7 Empire takes its rule from here: less noise, more certainty.',
    },
    {
      text_it: 'Non promettiamo scintille; promettiamo cura. Una chiave consegnata a mano, un itinerario che scorre senza attriti, un arrivo dove è già tutto pronto. Ogni esperienza porta la nostra firma: supercar, ville, yacht, elicotteri, jet, membership — diverse forme, lo stesso standard.',
      text_en: 'We don’t promise sparks; we promise care. A key handed over personally, an itinerary that flows without friction, an arrival where everything is already prepared. Every experience carries our signature: supercars, villas, yachts, helicopters, jets, membership — different forms, the same standard.',
    },
    {
      text_it: 'La nostra promessa è semplice: tempo guadagnato, bellezza preservata, serenità garantita. Se cercate un effetto speciale, troverete invece una costanza rara: quella delle cose organizzate con intelligenza e rispetto.',
      text_en: 'Our promise is simple: time gained, beauty preserved, serenity guaranteed. If you’re looking for a special effect, you’ll find instead a rare consistency: that of things organized with intelligence and respect.',
    },
  ],
  story_outro_main_it: 'Benvenuti in DR7 Empire',
  story_outro_main_en: 'Welcome to DR7 Empire',
  story_outro_sub_it: 'L’impero del lusso che vi accompagna, con discrezione, ovunque scegliate di andare.',
  story_outro_sub_en: 'The empire of luxury that accompanies you, with discretion, wherever you choose to go.',
  story_signature: '— Valerio & Ilenia',
};

// ─── Default Home seed ──────────────────────────────────────────────────────
// Mirrors the legacy hardcoded HomePage values (HERO_SLIDES + DISPLAY_TITLE
// + CATEGORY_IMAGE) so swapping to admin-managed copy is a no-op until edited.
const DEFAULT_HOME: HomeCopy = {
  seo_h1_it: 'DR7 Empire — Noleggio Auto di Lusso, Supercar e Servizi Premium in Sardegna',
  seo_h1_en: 'DR7 Empire — Luxury Car Rental, Supercars & Premium Services in Sardinia',
  hero_autoplay_seconds: 8,
  hero_slides: [
    { id: 'slide-1', video_src: '/main.mp4' },
    { id: 'slide-2', video_src: '/video2.mp4' },
    { id: 'slide-3', video_src: '/video3.mp4' },
    { id: 'slide-4', video_src: '/video4.mp4' },
    { id: 'slide-5', video_src: '/video5.mp4' },
    { id: 'slide-6', video_src: '/video6.mp4' },
  ],
  categories: [
    { id: 'cars',                 display_title_it: 'DR7 Supercar & Luxury Division',         display_title_en: 'DR7 Supercar & Luxury Division',         image_src: '/car.jpeg' },
    { id: 'urban-cars',           display_title_it: 'DR7 Urban Mobility Division',            display_title_en: 'DR7 Urban Mobility Division',            image_src: '/urbanc.jpeg' },
    { id: 'corporate-fleet',      display_title_it: 'DR7 Corporate & Utility Fleet Division', display_title_en: 'DR7 Corporate & Utility Fleet Division', image_src: '/utili.jpeg' },
    { id: 'yachts',               display_title_it: 'DR7 Yachting Division',                  display_title_en: 'DR7 Yachting Division',                  image_src: '/yacht.jpeg' },
    { id: 'jets',                 display_title_it: 'DR7 Aviation Division',                  display_title_en: 'DR7 Aviation Division',                  image_src: '/privatejet.jpeg' },
    { id: 'car-wash-services',    display_title_it: 'Prime Car Wash',                         display_title_en: 'Prime Car Wash',                         image_src: '/luxurywash.jpeg' },
    { id: 'mechanical-services',  display_title_it: 'DR7 Rapid Response Services',            display_title_en: 'DR7 Rapid Response Services',            image_src: '/rapids.jpeg' },
    { id: 'membership',           display_title_it: 'DR7 Exclusive Members Club',             display_title_en: 'DR7 Exclusive Members Club',             image_src: '/exclusivemc.jpeg' },
    { id: 'credit-wallet',        display_title_it: 'DR7 Credit Wallet',                      display_title_en: 'DR7 Credit Wallet',                      image_src: '/cwallet.jpeg' },
  ],
};

// ─── Default Membership seed ────────────────────────────────────────────────
const DEFAULT_MEMBERSHIP: MembershipCopy = {
  hero_eyebrow_it: 'Exclusive',
  hero_eyebrow_en: 'Exclusive',
  hero_title: 'DR7 CLUB',
  hero_subtitle_it: 'Ogni prenotazione ti premia. Ogni servizio ti ripaga.',
  hero_subtitle_en: 'Every booking rewards you. Every service pays you back.',
  hero_opener_it: 'Attiva il tuo wallet reward a partire da soli €{monthlyPrice}/mese',
  hero_opener_en: 'Activate your reward wallet starting from just €{monthlyPrice}/month',

  pricing_card_title: 'DR7 CLUB',
  pricing_billing_monthly_it: 'Mensile',
  pricing_billing_monthly_en: 'Monthly',
  pricing_billing_annual_it: 'Annuale',
  pricing_billing_annual_en: 'Annual',
  pricing_billing_save_badge: '-33%',
  pricing_cycle_month_it: 'mese',
  pricing_cycle_month_en: 'month',
  pricing_cycle_year_it: 'anno',
  pricing_cycle_year_en: 'year',
  pricing_savings_it: 'Solo €{annualMonthly} al mese — risparmi €{annualSavings} all’anno',
  pricing_savings_en: 'Just €{annualMonthly}/month — save €{annualSavings}/year',
  pricing_cta_it: 'Iscriviti ora',
  pricing_cta_en: 'Subscribe now',
  pricing_cta_footnote_it: 'Puoi annullare in qualsiasi momento dal tuo account.',
  pricing_cta_footnote_en: 'Cancel anytime from your account.',

  elite_title: 'DR7 Elite Rewards',
  elite_subtitle_it: 'Accumula credito e utilizzalo sui servizi DR7',
  elite_subtitle_en: 'Earn credit and spend it on DR7 services',
  elite_intro_it: 'Con DR7 puoi ottenere vantaggi concreti fin da subito e aumentare il tuo credito semplicemente utilizzando la piattaforma e invitando i tuoi contatti.',
  elite_intro_en: 'With DR7 you get concrete benefits from day one and grow your credit simply by using the platform and inviting your contacts.',

  elite_sections: [
    {
      id: 'vantaggi-immediati',
      variant: 'standard',
      title_it: 'Vantaggi immediati',
      title_en: 'Immediate benefits',
      blocks: [
        { type: 'p', text_it: 'Alla registrazione ricevi:', text_en: 'On registration you receive:' },
        { type: 'ul',
          items_it: ['10€ nel tuo Wallet DR7', '50€ di vantaggio utilizzabile su prenotazioni da almeno 250€'],
          items_en: ['€10 in your DR7 Wallet', '€50 benefit usable on bookings of at least €250'] },
        { type: 'p-italic',
          text_it: 'Il credito è utilizzabile direttamente sui servizi DR7 disponibili in piattaforma.',
          text_en: 'The credit can be used directly on DR7 services available on the platform.' },
      ],
    },
    {
      id: 'invita-e-guadagna',
      variant: 'standard',
      title_it: 'Invita e guadagna',
      title_en: 'Invite and earn',
      blocks: [
        { type: 'p',
          text_it: 'Condividi DR7 con i tuoi contatti e accumula credito in modo illimitato.',
          text_en: 'Share DR7 with your contacts and accumulate credit without limits.' },
        { type: 'p', text_it: 'Per ogni amico che:', text_en: 'For each friend who:' },
        { type: 'ul',
          items_it: ['si registra tramite il tuo invito', 'effettua una ricarica minima di 100€'],
          items_en: ['signs up via your invitation', 'tops up at least €100'] },
        { type: 'p', text_it: 'riceverai:', text_en: 'you receive:' },
        { type: 'ul',
          items_it: ['50€ di credito nel tuo Wallet DR7'],
          items_en: ['€50 credit in your DR7 Wallet'] },
        { type: 'p-italic',
          text_it: 'Non sono previsti limiti al numero di inviti.',
          text_en: 'There is no limit to the number of invitations.' },
      ],
    },
    {
      id: 'come-funziona',
      variant: 'standard',
      title_it: 'Come funziona',
      title_en: 'How it works',
      blocks: [
        { type: 'ul',
          items_it: ['Registrati su DR7', 'Accedi al tuo Wallet personale', 'Condividi il tuo invito', 'Ricevi credito per ogni ricarica valida effettuata dai tuoi amici', 'Utilizza il credito sui servizi disponibili'],
          items_en: ['Sign up on DR7', 'Access your personal Wallet', 'Share your invitation', 'Receive credit for every valid top-up made by your friends', 'Use the credit on available services'] },
      ],
    },
    {
      id: 'condizioni-utilizzo',
      variant: 'standard',
      title_it: 'Condizioni di utilizzo',
      title_en: 'Terms of use',
      blocks: [
        { type: 'ul',
          items_it: [
            'Il credito è utilizzabile esclusivamente all’interno della piattaforma DR7',
            'I bonus vengono accreditati solo a seguito di ricariche effettivamente completate',
            'DR7 si riserva il diritto di verificare e validare ogni operazione',
            'Eventuali abusi o utilizzi non conformi comportano la sospensione dei benefici',
          ],
          items_en: [
            'Credit can only be used within the DR7 platform',
            'Bonuses are credited only after top-ups are actually completed',
            'DR7 reserves the right to verify and validate every transaction',
            'Abuse or non-compliant use results in benefits being suspended',
          ] },
      ],
    },
  ],
  elite_cta_title_it: 'Inizia ora',
  elite_cta_title_en: 'Start now',
  elite_cta_text_it: 'Registrati, attiva il tuo Wallet e inizia ad accumulare credito con DR7.',
  elite_cta_text_en: 'Sign up, activate your Wallet and start earning credit with DR7.',
  elite_cta_logged_out_it: 'Registrati ora',
  elite_cta_logged_out_en: 'Sign up now',
  elite_cta_logged_in_it: 'Vai al tuo Wallet',
  elite_cta_logged_in_en: 'Go to your Wallet',

  reward_title_it: 'Come funziona il Reward',
  reward_title_en: 'How Rewards Work',
  reward_intro_it: 'Accumula credito nel tuo wallet ad ogni prenotazione e servizio. Il reward dipende dal tuo comportamento, non dal metodo di pagamento.',
  reward_intro_en: 'Earn wallet credit on every booking and service. Rewards are based on your behavior, not your payment method.',
  reward_items: [
    { label_it: 'Pagamento anticipato (100%)', label_en: 'Full prepayment (100%)', reward: '2%', note_it: 'fino al 4% per livelli più alti', note_en: 'up to 4% at higher levels' },
    { label_it: 'Pagamento con acconto (30%)', label_en: 'Deposit payment (30%)', reward: '1%', note_it: null, note_en: null },
    { label_it: 'Servizi extra', label_en: 'Extra services', reward: '2%', note_it: null, note_en: null },
    { label_it: 'Prime Wash', label_en: 'Prime Wash', reward: '3%', note_it: null, note_en: null },
  ],
  reward_footnote_it: 'Senza DR7 Club il sistema reward non è attivo.',
  reward_footnote_en: 'Without DR7 Club the reward system is not active.',
};

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
