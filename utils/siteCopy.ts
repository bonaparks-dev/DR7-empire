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

/**
 * Full FAQ page copy. Page title + eyebrow + subtitle live alongside
 * the entries so the operator can re-brand the /faq page from admin.
 */
export interface FaqCopy {
  eyebrow_it: string;
  eyebrow_en: string;
  page_title_it: string;
  page_title_en: string;
  subtitle_it: string;
  subtitle_en: string;
  entries: FaqEntry[];
}

interface SiteCopySnapshot {
  // Stored as either the new FaqCopy object or — for back-compat with the
  // first migration — a raw FaqEntry[]. The getter normalizes both shapes.
  faq?: FaqCopy | FaqEntry[];
  cancellazione?: CancellazioneCopy;
  membership?: MembershipCopy;
  home?: HomeCopy;
  about?: AboutCopy;
  footer?: FooterCopy;
  legal?: LegalCopy;
  careers?: CareersCopy;
  press?: PressCopy;
  contact?: ContactCopy;
  mechanical?: MechanicalCopy;
  carwash?: CarWashCopy;
  investitori?: InvestitoriCopy;
  franchising?: FranchisingCopy;
  aviationQuote?: AviationQuoteCopy;
  checkEmail?: CheckEmailCopy;
  jetSearchResults?: JetSearchResultsCopy;
  confirmationSuccess?: ConfirmationSuccessCopy;
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

// ─── Mechanical Services ────────────────────────────────────────────────────
//
// IMPORTANT: the actual service catalog (prices, names, categories) lives
// in the `car_wash_services` Supabase table — managed from admin > Catalogo
// Prime Wash with the LAVAGGIO/MECCANICA filter. siteCopy.mechanical only
// holds the page CHROME (hero band, "Come Funziona" steps, opening hours,
// button labels). DO NOT recreate the catalog here.
export interface MechanicalServiceItem {
  id: string;
  name_it: string; name_en: string;
  category: string;
  description_it: string; description_en: string;
  duration: string;
  price: number;
}

export interface MechanicalHowStep {
  title_it: string; title_en: string;
  text_it: string; text_en: string;
}

export interface MechanicalCopy {
  hero_title: string;
  hero_subtitle_it: string; hero_subtitle_en: string;
  hero_intro_it: string; hero_intro_en: string;
  book_now_label_it: string; book_now_label_en: string;
  how_heading_it: string; how_heading_en: string;
  how_steps: MechanicalHowStep[];
  hours_heading_it: string; hours_heading_en: string;
  hours_main_it: string; hours_main_en: string;
  hours_sub_it: string; hours_sub_en: string;
}

// ─── Confirmation Success page (booking + email fallback) ─────────────────
// `{total}` placeholder in rental_agency_footnote is replaced with the
// formatted total price at render time.
export interface ConfirmationSuccessCopy {
  // Booking branch
  booking_title_it: string; booking_title_en: string;
  booking_subtitle_it: string; booking_subtitle_en: string;
  booking_summary_heading_it: string; booking_summary_heading_en: string;
  booking_cta_account_it: string; booking_cta_account_en: string;
  // Car wash variant
  carwash_row_servizio_it: string; carwash_row_servizio_en: string;
  carwash_row_data_it: string; carwash_row_data_en: string;
  carwash_row_orario_it: string; carwash_row_orario_en: string;
  carwash_row_cliente_it: string; carwash_row_cliente_en: string;
  carwash_row_pagamento_it: string; carwash_row_pagamento_en: string;
  carwash_payment_online_it: string; carwash_payment_online_en: string;
  carwash_default_customer_it: string; carwash_default_customer_en: string;
  carwash_totale_pagato_it: string; carwash_totale_pagato_en: string;
  carwash_whatsapp_note_it: string; carwash_whatsapp_note_en: string;
  // Rental variant
  rental_row_veicolo_it: string; rental_row_veicolo_en: string;
  rental_row_ritiro_it: string; rental_row_ritiro_en: string;
  rental_row_riconsegna_it: string; rental_row_riconsegna_en: string;
  rental_row_luogo_it: string; rental_row_luogo_en: string;
  rental_row_pagamento_it: string; rental_row_pagamento_en: string;
  rental_time_connector_it: string; rental_time_connector_en: string;
  rental_payment_in_sede_it: string; rental_payment_in_sede_en: string;
  rental_payment_online_it: string; rental_payment_online_en: string;
  rental_totale_pagato_it: string; rental_totale_pagato_en: string;
  rental_totale_da_pagare_it: string; rental_totale_da_pagare_en: string;
  rental_agency_footnote_it: string; rental_agency_footnote_en: string;     // {total}
  // Email-confirmed fallback
  email_title_it: string; email_title_en: string;
  email_body_logged_in_it: string; email_body_logged_in_en: string;
  email_body_logged_out_it: string; email_body_logged_out_en: string;
  email_cta_logged_in_it: string; email_cta_logged_in_en: string;
  email_cta_logged_out_it: string; email_cta_logged_out_en: string;
}

// ─── Jet Search Results page (chrome only) ────────────────────────────────
export interface JetSearchResultsCopy {
  title_it: string; title_en: string;
  subtitle_connector_it: string; subtitle_connector_en: string;     // "to"
  passengers_suffix_it: string; passengers_suffix_en: string;       // "Passengers"
  modify_search_cta_it: string; modify_search_cta_en: string;
  airport_fallback: string;                                         // "N/A"
  empty_title_it: string; empty_title_en: string;
  empty_body_it: string; empty_body_en: string;
}

// ─── Check Email page (post-signup) ────────────────────────────────────────
export interface CheckEmailCopy {
  title_it: string; title_en: string;
  body_it: string; body_en: string;
  back_link_it: string; back_link_en: string;
}

// ─── Aviation Quote Request page (bilingual chrome only) ──────────────────
//
// IMPORTANT: the WhatsApp message TEMPLATE lives in admin > Messaggi di
// Sistema Pro under key `pro_aviation_quote_request` (NOT here). siteCopy
// holds only the page chrome (form labels, buttons, alerts, gate). The
// template body is loaded by the page via `getMessageTemplateBody()`.
export interface AviationQuoteCopy {
  // Loading + auth gate
  loading_it: string; loading_en: string;
  auth_title_it: string; auth_title_en: string;
  auth_body_it: string; auth_body_en: string;
  auth_login_cta_it: string; auth_login_cta_en: string;
  auth_signup_cta_it: string; auth_signup_cta_en: string;
  // Header (with {service} token)
  service_label_jet: string;          // "Jet Privato"
  service_label_helicopter: string;   // "Elicottero"
  header_title_template_it: string; header_title_template_en: string;
  header_subtitle_it: string; header_subtitle_en: string;
  // Form sections + fields
  section_customer_it: string; section_customer_en: string;
  section_flight_it: string; section_flight_en: string;
  field_name_label_it: string; field_name_label_en: string;
  field_name_placeholder_it: string; field_name_placeholder_en: string;
  field_email_label_it: string; field_email_label_en: string;
  field_email_placeholder_it: string; field_email_placeholder_en: string;
  field_phone_label_it: string; field_phone_label_en: string;
  field_phone_placeholder_it: string; field_phone_placeholder_en: string;
  field_departure_label_it: string; field_departure_label_en: string;
  field_departure_placeholder_it: string; field_departure_placeholder_en: string;
  field_arrival_label_it: string; field_arrival_label_en: string;
  field_arrival_placeholder_it: string; field_arrival_placeholder_en: string;
  field_departure_date_label_it: string; field_departure_date_label_en: string;
  field_return_date_label_it: string; field_return_date_label_en: string;
  field_passengers_label_it: string; field_passengers_label_en: string;
  field_notes_label_it: string; field_notes_label_en: string;
  field_notes_placeholder_it: string; field_notes_placeholder_en: string;
  // Submit + footer
  submit_idle_it: string; submit_idle_en: string;
  submit_submitting_it: string; submit_submitting_en: string;
  disclaimer_it: string; disclaimer_en: string;
  alert_success_it: string; alert_success_en: string;
  alert_error_it: string; alert_error_en: string;
  // WhatsApp recipient phone (template body now in system_messages).
  whatsapp_phone: string;
}

// ─── Franchising (IT-only sales page) ──────────────────────────────────────
//
// `{reviewCount}` placeholder in stats_lines is replaced at render time with
// the live Google reviews count.
export type FranchisingExpansionIcon = 'square' | 'diamond' | 'lines';
export type FranchisingBenefitIcon = 'check' | 'shield' | 'star';

export interface FranchisingExpansionLocation {
  id: string;
  icon: FranchisingExpansionIcon;
  name: string;
  description: string;
}

export interface FranchisingBenefit {
  id: string;
  icon: FranchisingBenefitIcon;
  title: string;
  description: string;
}

export interface FranchisingCopy {
  hero_h2: string;
  hero_p1: string;
  hero_p2: string;
  stats_heading: string;
  stats_lines: string[];               // supports {reviewCount}
  stats_footer_main: string;
  stats_footer_sub: string;
  expansion_heading: string;
  expansion_locations: FranchisingExpansionLocation[];
  about_heading: string;
  about_paragraphs: string[];
  benefits: FranchisingBenefit[];
  cta_heading: string;
  cta_intro: string;
  cta_box_main: string;
  cta_box_sub: string;
  contact_heading: string;
  contact_intro: string;
  contact_email: string;
  footer_statement: string;
}

// ─── Investitori (IT-only sales page) ──────────────────────────────────────
//
// The whole /investitori page is currently IT-only. Schema reflects that —
// single-string fields. Add EN siblings later if/when the page gets a
// language switcher.
export interface InvestitoriStrength {
  id: string;
  title: string;
  description: string;
}

export interface InvestitoriInfoItem {
  label: string;
  value: string;
}

export interface InvestitoriCopy {
  hero_title: string;
  hero_subtitle: string;
  intro_paragraphs: string[];
  opportunity_heading: string;
  opportunity_paragraphs: string[];
  strength_heading: string;
  strength_points: InvestitoriStrength[];
  cta_heading: string;
  cta_paragraphs: string[];
  cta_button_label: string;
  cta_whatsapp_url: string;
  cta_email: string;
  info_heading: string;
  info_items: InvestitoriInfoItem[];
  info_footnote: string;
  legal_heading: string;
  legal_paragraphs: string[];
}

// ─── Car Wash chrome (catalog stays in car_wash_services table) ────────────
//
// Same rule as Mechanical: the actual SERVICE catalog lives in
// `car_wash_services` (managed from admin > Catalogo Prime Wash, filter
// LAVAGGIO). siteCopy.carwash holds only the page CHROME — UI labels for
// plate entry, cart drawer, upsell overlay, etc.
export interface CarWashCopy {
  // Plate entry section
  plate_label_it: string; plate_label_en: string;
  plate_helper_it: string; plate_helper_en: string;
  plate_placeholder_it: string; plate_placeholder_en: string;
  plate_search_it: string; plate_search_en: string;
  plate_searching_it: string; plate_searching_en: string;
  plate_manual_prompt_it: string; plate_manual_prompt_en: string;
  plate_change_it: string; plate_change_en: string;
  // Service card
  add_to_cart_it: string; add_to_cart_en: string;
  // Cart drawer
  cart_title_it: string; cart_title_en: string;
  cart_empty_it: string; cart_empty_en: string;
  cart_remove_it: string; cart_remove_en: string;
  cart_total_it: string; cart_total_en: string;
  cart_checkout_it: string; cart_checkout_en: string;
  // Upsell overlay
  upsell_review_cart_it: string; upsell_review_cart_en: string;
  upsell_step1_title_it: string; upsell_step1_title_en: string;
  upsell_step1_text_it: string; upsell_step1_text_en: string;
  upsell_step2_title_it: string; upsell_step2_title_en: string;
  upsell_step2_text_it: string; upsell_step2_text_en: string;
  upsell_added_it: string; upsell_added_en: string;
  upsell_add_it: string; upsell_add_en: string;
}

// ─── Careers ────────────────────────────────────────────────────────────────
export interface CareersJob {
  id: string;
  title_it: string; title_en: string;
  location_it: string; location_en: string;
  type_it: string; type_en: string;
  description_it: string; description_en: string;
}

export interface CareersCopy {
  page_title_it: string; page_title_en: string;
  intro_it: string; intro_en: string;
  jobs_heading_it: string; jobs_heading_en: string;
  jobs: CareersJob[];
  apply_heading_it: string; apply_heading_en: string;
  apply_text_it: string; apply_text_en: string;     // supports inline markdown ([label](url))
  apply_email: string;
}

// ─── Press ──────────────────────────────────────────────────────────────────
export interface PressArticle {
  id: string;
  title: string;            // article titles usually stay in source language
  publication: string;
  date: string;
  summary_it: string; summary_en: string;
  link: string;
}

export interface PressCopy {
  page_title_it: string; page_title_en: string;
  subtitle_it: string; subtitle_en: string;
  inquiries_heading_it: string; inquiries_heading_en: string;
  inquiries_text_it: string; inquiries_text_en: string;
  inquiries_email_label_it: string; inquiries_email_label_en: string;
  inquiries_email: string;
  news_heading_it: string; news_heading_en: string;
  read_more_label_it: string; read_more_label_en: string;
  articles: PressArticle[];
  releases_heading_it: string; releases_heading_en: string;
  releases_text_it: string; releases_text_en: string;
}

// ─── Contact ────────────────────────────────────────────────────────────────
export interface ContactCopy {
  page_title_it: string; page_title_en: string;
  subtitle_it: string; subtitle_en: string;
  phone_label_it: string; phone_label_en: string;
  phone_display: string;
  phone_tel_url: string;
  whatsapp_label_it: string; whatsapp_label_en: string;
  whatsapp_button_it: string; whatsapp_button_en: string;
  whatsapp_url: string;
  email_label_it: string; email_label_en: string;
  email_address: string;
  hours_label_it: string; hours_label_en: string;
  hours_lines_it: string[]; hours_lines_en: string[];
  office_heading_it: string; office_heading_en: string;
  office_company_name: string;
  office_address_it: string; office_address_en: string;
  office_piva: string;
  map_title: string;
  map_iframe_url: string;
}

// ─── Legal pages (Privacy, Cookie, Rental Agreement, Terms) ────────────────
//
// Pages share one rich-content schema: an optional intro band + an
// ordered list of headed sections + an optional outro band. Each
// "block" inside a section / band uses the same shape as Cancellazione
// (paragraph variants + bullet lists). Inline emphasis + links are
// supported via a tiny markdown subset:
//   **bold**          →  <strong>bold</strong>
//   [label](url)      →  <a href="url" target="_blank">label</a>  (or mailto:)
// Anything else is rendered as plain text.
export type LegalPageId = 'privacy' | 'cookie' | 'rental_agreement' | 'terms';

export interface LegalSection {
  id: string;
  heading_it: string;
  heading_en: string;
  blocks: CancellazioneBlock[];
}

export interface LegalPageCopy {
  id: LegalPageId;
  enabled: boolean;             // false → page falls back to hardcoded JSX (used for Terms today)
  title_it: string;
  title_en: string;
  /** When true, the rendered "last updated" string prepends today's local date. */
  last_updated_dynamic: boolean;
  last_updated_label_it: string;   // e.g. "Ultimo aggiornamento" — used as prefix
  last_updated_label_en: string;
  intro_blocks: CancellazioneBlock[];
  sections: LegalSection[];
  outro_blocks: CancellazioneBlock[];
}

export interface LegalCopy {
  pages: LegalPageCopy[];
}

// ─── Footer ─────────────────────────────────────────────────────────────────
export type FooterSocialIcon = 'instagram' | 'tiktok' | 'facebook' | 'linkedin' | 'youtube' | 'x';

export interface FooterSocialLink {
  id: string;
  label: string;     // aria-label
  href: string;
  icon: FooterSocialIcon;
}

export interface FooterLink {
  id: string;
  label_it: string;
  label_en: string;
  to: string;        // internal route ("/about") OR full URL
  external?: boolean;
}

export interface FooterCopy {
  // Network band
  network_title: string;
  network_text_it: string;
  network_text_en: string;
  social_links: FooterSocialLink[];
  // Reviews band header
  reviews_title: string;
  reviews_text_it: string;
  reviews_text_en: string;
  // Contact band
  contact_title: string;
  contact_whatsapp_number: string;     // displayed text, e.g. "+39 345 790 5205"
  contact_whatsapp_url: string;        // wa.me URL
  contact_company_name: string;
  contact_legal_address_it: string;
  contact_legal_address_en: string;
  contact_capitale_sociale_it: string;
  contact_capitale_sociale_en: string;
  contact_piva: string;
  contact_disclaimer_it: string;       // "Società soggetta a..."
  contact_disclaimer_en: string;
  // Link rows (Division + Corporate + Legal)
  division_links: FooterLink[];
  corporate_links: FooterLink[];
  legal_links: FooterLink[];
  // Bottom band
  bottom_brand_line: string;           // "DR7 Cagliari – Global Mobility..."
  bottom_copyright: string;            // "© 2024 - 2026 DR7 Cagliari. All Rights Reserved."
}

// ─── Defaults ────────────────────────────────────────────────────────────────
const DEFAULT_FAQ_ENTRIES: FaqEntry[] = [
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

const DEFAULT_FAQ: FaqCopy = {
  eyebrow_it: 'DR7 · Supporto',
  eyebrow_en: 'DR7 · Support',
  page_title_it: 'Domande Frequenti',
  page_title_en: 'Frequently Asked Questions',
  subtitle_it: 'Le risposte alle domande piu’ frequenti su noleggio, membership e pagamenti.',
  subtitle_en: 'Answers to the most common questions on rentals, membership, and payments.',
  entries: DEFAULT_FAQ_ENTRIES,
};

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
 * Normalize whatever's stored in `snap.faq` (legacy raw array or new
 * FaqCopy object) into the canonical FaqCopy shape. Falls back to the
 * hardcoded default when nothing is stored.
 */
export async function getFaqCopy(): Promise<FaqCopy> {
  const snap = await loadOnce();
  if (!snap.faq) return DEFAULT_FAQ;
  if (Array.isArray(snap.faq)) {
    // Legacy shape: just an array of entries — wrap with default chrome.
    if (snap.faq.length === 0) return DEFAULT_FAQ;
    return { ...DEFAULT_FAQ, entries: snap.faq };
  }
  // New shape: object. Fall back per-field if anything's missing.
  const obj = snap.faq;
  return {
    eyebrow_it: obj.eyebrow_it || DEFAULT_FAQ.eyebrow_it,
    eyebrow_en: obj.eyebrow_en || DEFAULT_FAQ.eyebrow_en,
    page_title_it: obj.page_title_it || DEFAULT_FAQ.page_title_it,
    page_title_en: obj.page_title_en || DEFAULT_FAQ.page_title_en,
    subtitle_it: obj.subtitle_it || DEFAULT_FAQ.subtitle_it,
    subtitle_en: obj.subtitle_en || DEFAULT_FAQ.subtitle_en,
    entries: Array.isArray(obj.entries) && obj.entries.length > 0 ? obj.entries : DEFAULT_FAQ.entries,
  };
}

/** Backwards-compat: just the entries array. */
export async function getFaqEntries(): Promise<FaqEntry[]> {
  return (await getFaqCopy()).entries;
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

/**
 * Footer copy — falls back to legacy hardcoded text when admin hasn't
 * customized.
 */
export async function getFooterCopy(): Promise<FooterCopy> {
  const snap = await loadOnce();
  if (snap.footer && Array.isArray(snap.footer.social_links) && Array.isArray(snap.footer.division_links)) {
    return snap.footer;
  }
  return DEFAULT_FOOTER;
}

/**
 * Legal page copy by id (privacy / cookie / rental_agreement / terms).
 * Returns the configured page if enabled + has sections, otherwise null —
 * the page component should fall back to its hardcoded JSX.
 */
export async function getLegalPage(id: LegalPageId): Promise<LegalPageCopy | null> {
  const snap = await loadOnce();
  const all = snap.legal?.pages || DEFAULT_LEGAL.pages;
  const found = all.find((p) => p.id === id);
  if (!found || !found.enabled) return null;
  if (!Array.isArray(found.sections) || found.sections.length === 0) return null;
  return found;
}

/** Confirmation Success page (booking summary + email fallback). */
export async function getConfirmationSuccessCopy(): Promise<ConfirmationSuccessCopy> {
  const snap = await loadOnce();
  if (snap.confirmationSuccess && snap.confirmationSuccess.booking_title_it) return snap.confirmationSuccess;
  return DEFAULT_CONFIRMATION_SUCCESS;
}

/** Jet Search Results page chrome (catalog stays in RENTAL_CATEGORIES). */
export async function getJetSearchResultsCopy(): Promise<JetSearchResultsCopy> {
  const snap = await loadOnce();
  if (snap.jetSearchResults && snap.jetSearchResults.title_it) return snap.jetSearchResults;
  return DEFAULT_JET_SEARCH_RESULTS;
}

/** Check Email page (post-signup confirmation prompt). */
export async function getCheckEmailCopy(): Promise<CheckEmailCopy> {
  const snap = await loadOnce();
  if (snap.checkEmail && snap.checkEmail.title_it) return snap.checkEmail;
  return DEFAULT_CHECK_EMAIL;
}

/** Aviation quote request page (bilingual). */
export async function getAviationQuoteCopy(): Promise<AviationQuoteCopy> {
  const snap = await loadOnce();
  if (snap.aviationQuote && snap.aviationQuote.header_title_template_it) return snap.aviationQuote;
  return DEFAULT_AVIATION_QUOTE;
}

/** Franchising sales page — IT-only copy. */
export async function getFranchisingCopy(): Promise<FranchisingCopy> {
  const snap = await loadOnce();
  if (snap.franchising && snap.franchising.hero_h2) return snap.franchising;
  return DEFAULT_FRANCHISING;
}

/** Investitori (investor page) — IT-only copy. */
export async function getInvestitoriCopy(): Promise<InvestitoriCopy> {
  const snap = await loadOnce();
  if (snap.investitori && snap.investitori.hero_title) return snap.investitori;
  return DEFAULT_INVESTITORI;
}

/** Car wash page chrome (UI labels — catalog stays in car_wash_services). */
export async function getCarWashCopy(): Promise<CarWashCopy> {
  const snap = await loadOnce();
  if (snap.carwash && snap.carwash.cart_title_it) return snap.carwash;
  return DEFAULT_CARWASH;
}

/** Mechanical services page chrome (hero / steps / hours / button labels). */
export async function getMechanicalCopy(): Promise<MechanicalCopy> {
  const snap = await loadOnce();
  if (snap.mechanical && snap.mechanical.hero_title) {
    return snap.mechanical;
  }
  return DEFAULT_MECHANICAL;
}

/**
 * Mechanical service catalog. Reads from the `car_wash_services` Supabase
 * table — the SAME source the admin > Catalogo Prime Wash tab manages.
 * Filters main_tab='meccanica', is_active=true, ordered by display_order.
 */
export async function getMechanicalServices(): Promise<MechanicalServiceItem[]> {
  try {
    const { data, error } = await supabase
      .from('car_wash_services')
      .select('id, name, name_en, category, description, description_en, duration, price, display_order, is_active, main_tab')
      .eq('main_tab', 'meccanica')
      .eq('is_active', true)
      .order('display_order', { ascending: true });
    if (error || !data) return [];
    type Row = {
      id: string;
      name: string;
      name_en: string | null;
      category: string;
      description: string | null;
      description_en: string | null;
      duration: string | null;
      price: number;
    };
    return (data as Row[]).map((r) => ({
      id: r.id,
      name_it: r.name || '',
      name_en: r.name_en || r.name || '',
      category: r.category || '',
      description_it: r.description || '',
      description_en: r.description_en || r.description || '',
      duration: r.duration || '',
      price: Number(r.price) || 0,
    }));
  } catch {
    return [];
  }
}

/** Careers page copy. */
export async function getCareersCopy(): Promise<CareersCopy> {
  const snap = await loadOnce();
  if (snap.careers && Array.isArray(snap.careers.jobs)) return snap.careers;
  return DEFAULT_CAREERS;
}

/** Press page copy. */
export async function getPressCopy(): Promise<PressCopy> {
  const snap = await loadOnce();
  if (snap.press && Array.isArray(snap.press.articles)) return snap.press;
  return DEFAULT_PRESS;
}

/** Contact page copy. */
export async function getContactCopy(): Promise<ContactCopy> {
  const snap = await loadOnce();
  if (snap.contact && snap.contact.email_address) return snap.contact;
  return DEFAULT_CONTACT;
}

/** Force a re-fetch (useful after admin edits in dev). */
export function invalidateSiteCopyCache(): void {
  CACHE = null;
  pending = null;
}

// ─── Default Confirmation Success seed ────────────────────────────────────
const DEFAULT_CONFIRMATION_SUCCESS: ConfirmationSuccessCopy = {
  booking_title_it: 'Prenotazione Confermata', booking_title_en: 'Booking Confirmed',
  booking_subtitle_it: 'Ti abbiamo inviato una conferma via email.', booking_subtitle_en: 'We\'ve sent you a confirmation email.',
  booking_summary_heading_it: 'Riepilogo Prenotazione', booking_summary_heading_en: 'Booking Summary',
  booking_cta_account_it: 'Vai al Mio Account', booking_cta_account_en: 'Proceed to My Account',
  carwash_row_servizio_it: 'Servizio:', carwash_row_servizio_en: 'Service:',
  carwash_row_data_it: 'Data:', carwash_row_data_en: 'Date:',
  carwash_row_orario_it: 'Orario:', carwash_row_orario_en: 'Time:',
  carwash_row_cliente_it: 'Cliente:', carwash_row_cliente_en: 'Customer:',
  carwash_row_pagamento_it: 'Pagamento:', carwash_row_pagamento_en: 'Payment:',
  carwash_payment_online_it: 'Online', carwash_payment_online_en: 'Online',
  carwash_default_customer_it: 'Cliente', carwash_default_customer_en: 'Customer',
  carwash_totale_pagato_it: 'TOTALE PAGATO:', carwash_totale_pagato_en: 'TOTAL PAID:',
  carwash_whatsapp_note_it: 'Riceverai una conferma via WhatsApp', carwash_whatsapp_note_en: 'You\'ll receive a WhatsApp confirmation',
  rental_row_veicolo_it: 'Veicolo:', rental_row_veicolo_en: 'Vehicle:',
  rental_row_ritiro_it: 'Ritiro:', rental_row_ritiro_en: 'Pickup:',
  rental_row_riconsegna_it: 'Riconsegna:', rental_row_riconsegna_en: 'Return:',
  rental_row_luogo_it: 'Luogo:', rental_row_luogo_en: 'Location:',
  rental_row_pagamento_it: 'Pagamento:', rental_row_pagamento_en: 'Payment:',
  rental_time_connector_it: 'alle', rental_time_connector_en: 'at',
  rental_payment_in_sede_it: 'In Sede', rental_payment_in_sede_en: 'In Office',
  rental_payment_online_it: 'Online', rental_payment_online_en: 'Online',
  rental_totale_pagato_it: 'TOTALE PAGATO:', rental_totale_pagato_en: 'TOTAL PAID:',
  rental_totale_da_pagare_it: 'TOTALE DA PAGARE:', rental_totale_da_pagare_en: 'TOTAL TO PAY:',
  rental_agency_footnote_it: 'L\'importo totale di {total} sarà dovuto al momento del ritiro.',
  rental_agency_footnote_en: 'The total of {total} will be due upon pickup.',
  email_title_it: 'Email Confermata', email_title_en: 'Email Confirmed',
  email_body_logged_in_it: 'Account creato con successo. Ora puoi accedere a tutti i servizi DR7.',
  email_body_logged_in_en: 'Account successfully created. You can now access all DR7 services.',
  email_body_logged_out_it: 'Il tuo indirizzo email è stato verificato con successo. Accedi per entrare nel tuo account.',
  email_body_logged_out_en: 'Your email address has been verified successfully. Sign in to access your account.',
  email_cta_logged_in_it: 'Vai al Mio Account', email_cta_logged_in_en: 'Proceed to My Account',
  email_cta_logged_out_it: 'Accedi', email_cta_logged_out_en: 'Sign In',
};

// ─── Default Jet Search Results seed ──────────────────────────────────────
const DEFAULT_JET_SEARCH_RESULTS: JetSearchResultsCopy = {
  title_it: 'Risultati di Ricerca', title_en: 'Search Results',
  subtitle_connector_it: 'a', subtitle_connector_en: 'to',
  passengers_suffix_it: 'Passeggeri', passengers_suffix_en: 'Passengers',
  modify_search_cta_it: 'Modifica Ricerca', modify_search_cta_en: 'Modify Search',
  airport_fallback: 'N/A',
  empty_title_it: 'Nessun jet trovato', empty_title_en: 'No jets found',
  empty_body_it: 'Prova a modificare i criteri di ricerca o contatta il nostro concierge per assistenza.',
  empty_body_en: 'Try adjusting your search criteria or contact our concierge for assistance.',
};

// ─── Default Check Email seed ──────────────────────────────────────────────
const DEFAULT_CHECK_EMAIL: CheckEmailCopy = {
  title_it: 'Controlla la tua email', title_en: 'Check Your Email',
  body_it: 'Ti abbiamo inviato un link di verifica all\'indirizzo email che hai indicato. Clicca sul link per attivare il tuo account.',
  body_en: 'We\'ve sent a verification link to your email. Click the link to activate your account.',
  back_link_it: 'Torna al Login', back_link_en: 'Back to Sign In',
};

// ─── Default Aviation Quote seed ───────────────────────────────────────────
const DEFAULT_AVIATION_QUOTE: AviationQuoteCopy = {
  loading_it: 'Caricamento...', loading_en: 'Loading...',
  auth_title_it: 'Accesso Richiesto', auth_title_en: 'Login Required',
  auth_body_it: 'Devi essere registrato e aver effettuato l\'accesso per richiedere un preventivo.',
  auth_body_en: 'You must be registered and logged in to request a quote.',
  auth_login_cta_it: 'Accedi', auth_login_cta_en: 'Login',
  auth_signup_cta_it: 'Registrati', auth_signup_cta_en: 'Sign Up',
  service_label_jet: 'Jet Privato', service_label_helicopter: 'Elicottero',
  header_title_template_it: 'Richiedi Preventivo {service}',
  header_title_template_en: 'Request Quote {service}',
  header_subtitle_it: 'Compila il form e ti contatteremo con un preventivo personalizzato',
  header_subtitle_en: 'Fill in the form and we\'ll get back to you with a personalized quote',
  section_customer_it: 'Dati Cliente', section_customer_en: 'Customer Details',
  section_flight_it: 'Dettagli Viaggio', section_flight_en: 'Trip Details',
  field_name_label_it: 'Nome Completo *', field_name_label_en: 'Full Name *',
  field_name_placeholder_it: 'Mario Rossi', field_name_placeholder_en: 'John Smith',
  field_email_label_it: 'Email *', field_email_label_en: 'Email *',
  field_email_placeholder_it: 'mario@email.com', field_email_placeholder_en: 'john@email.com',
  field_phone_label_it: 'Telefono *', field_phone_label_en: 'Phone *',
  field_phone_placeholder_it: '+39 333 123 4567', field_phone_placeholder_en: '+39 333 123 4567',
  field_departure_label_it: 'Partenza da *', field_departure_label_en: 'Departure from *',
  field_departure_placeholder_it: 'Milano, Roma, Cagliari...', field_departure_placeholder_en: 'Milan, Rome, Cagliari...',
  field_arrival_label_it: 'Arrivo a *', field_arrival_label_en: 'Arrival at *',
  field_arrival_placeholder_it: 'Parigi, Londra, Ibiza...', field_arrival_placeholder_en: 'Paris, London, Ibiza...',
  field_departure_date_label_it: 'Data Partenza *', field_departure_date_label_en: 'Departure Date *',
  field_return_date_label_it: 'Data Ritorno (opzionale)', field_return_date_label_en: 'Return Date (optional)',
  field_passengers_label_it: 'Numero Passeggeri *', field_passengers_label_en: 'Number of Passengers *',
  field_notes_label_it: 'Note Aggiuntive', field_notes_label_en: 'Additional Notes',
  field_notes_placeholder_it: 'Richieste speciali, bagagli, preferenze...',
  field_notes_placeholder_en: 'Special requests, luggage, preferences...',
  submit_idle_it: 'Richiedi Preventivo', submit_idle_en: 'Request Quote',
  submit_submitting_it: 'Invio in corso...', submit_submitting_en: 'Submitting...',
  disclaimer_it: 'Verrai reindirizzato su WhatsApp. Ti contatteremo entro 24 ore con un preventivo personalizzato.',
  disclaimer_en: 'You\'ll be redirected to WhatsApp. We\'ll contact you within 24 hours with a personalized quote.',
  alert_success_it: 'Richiesta inviata! Ti contatteremo presto.',
  alert_success_en: 'Request sent! We\'ll be in touch soon.',
  alert_error_it: 'Errore durante l\'invio della richiesta. Riprova.',
  alert_error_en: 'Error submitting your request. Please try again.',
  whatsapp_phone: '393457905205',
};

// Hardcoded fallback template — used when system_messages is missing the row
// or the row is empty/disabled. Mirrors the legacy inline template.
const AVIATION_FALLBACK_TEMPLATE_IT = `Ciao DR7 Empire
Vorrei richiedere un preventivo per {service}.

DATI CLIENTE
Nome: {nome}
Email: {email}
Telefono: {telefono}

DETTAGLI RICHIESTA
Partenza: {partenza}
Arrivo: {arrivo}
Data partenza: {data_partenza}
{return_line}Passeggeri: {passeggeri}
{notes_line}
Potete fornirmi un preventivo? Grazie!`;

/**
 * Load a system_messages template body by key. Returns null when the row
 * is missing, empty, or disabled — caller should fall back. Read-only:
 * client-side fetch, no service-role access.
 */
export async function getMessageTemplateBody(messageKey: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('system_messages')
      .select('message_body, is_enabled')
      .eq('message_key', messageKey)
      .maybeSingle();
    if (error) return null;
    if (!data || data.is_enabled === false) return null;
    const body = (data.message_body as string | null) || '';
    return body.trim().length > 0 ? body : null;
  } catch {
    return null;
  }
}

/** Aviation Quote WhatsApp template — falls back to legacy IT body. */
export async function getAviationQuoteTemplate(): Promise<string> {
  const remote = await getMessageTemplateBody('pro_aviation_quote_request');
  return remote || AVIATION_FALLBACK_TEMPLATE_IT;
}

// ─── Default Franchising seed ──────────────────────────────────────────────
const DEFAULT_FRANCHISING: FranchisingCopy = {
  hero_h2: 'Vuoi aprire la tua sede DR7 nella tua città?',
  hero_p1: 'Diventa partner del gruppo che sta rivoluzionando il concetto di lusso in Italia.',
  hero_p2: 'Nessun investimento impossibile, supporto totale della casa madre\ne un brand che cresce ogni singolo giorno.',
  stats_heading: 'In soli 18 mesi di attività',
  stats_lines: [
    '* oltre 1.800 contratti firmati',
    '* più di €1.500.000 di fatturato netto',
    '* oltre €1.500.000 in parco auto',
    '* più di 900 clienti attivi',
    '* {reviewCount} recensioni a 5 stelle reali',
    '* Valutazione aziendale: €15.000.000',
    '* Valutazione brand: oltre €4.000.000',
    '* Da S.R.L. a S.P.A. in un solo anno.',
  ],
  stats_footer_main: 'Il brand di lusso più riconosciuto d\'Italia.',
  stats_footer_sub: 'Italia • Dubai Rent 7.0 S.p.A.',
  expansion_heading: 'Il Nostro Piano di Espansione',
  expansion_locations: [
    { id: 'cagliari', icon: 'square',  name: 'Cagliari', description: 'Sede Principale' },
    { id: 'iglesias', icon: 'diamond', name: 'Iglesias', description: 'Franchising Operativo' },
    { id: 'target',   icon: 'lines',   name: '300 Sedi',  description: 'Obiettivo Italia' },
  ],
  about_heading: 'L\'Impero DR7',
  about_paragraphs: [
    'Nata come Dubai Rent 7.0 S.p.A., oggi DR7 è un impero del lusso e della mobilità. Non un marchio. Non un esperimento. Ma una macchina che funziona, cresce e domina.',
    'Abbiamo costruito un modello che integra mobilità, lusso ed esperienza in un solo ecosistema: auto, supercar, yacht, elicotteri, jet privati e ville di lusso. Un sistema già operativo, già profittevole, già riconosciuto.',
  ],
  benefits: [
    { id: 'brand', icon: 'check', title: 'Più di un Brand', description: 'Un metodo, una struttura, una reputazione. Un nome sinonimo di dominio.' },
  ],
  cta_heading: 'Cerchiamo Dominatori di Mercato',
  cta_intro: 'Non affiliati. Imprenditori pronti a portare il nome DR7 Luxury Empire nel proprio territorio.',
  cta_box_main: 'Se vuoi entrare in un impero destinato a durare, il momento è ora.',
  cta_box_sub: 'I posti sono limitati. Le sedi non si conquistano due volte.',
  contact_heading: 'Invia la tua candidatura',
  contact_intro: 'e scopri come aprire la tua sede ufficiale DR7.',
  contact_email: 'franchising@dr7.app',
  footer_statement: '-\n> "Solo per veri imprenditori. Posti limitati per le nuove aperture 2025."',
};

// ─── Default Investitori seed ──────────────────────────────────────────────
const DEFAULT_INVESTITORI: InvestitoriCopy = {
  hero_title: 'SEZIONE INVESTITORI',
  hero_subtitle: 'Partecipa alla crescita del gruppo DR7',
  intro_paragraphs: [
    'Dubai Rent 7.0 S.p.A. rappresenta il cuore del progetto DR7 Luxury Empire, una realtà italiana in espansione internazionale nel settore Luxury Mobility & Lifestyle.',
    'Fondata da Valerio Saia, la società persegue l\'obiettivo di costruire entro il 2030 un gruppo di riferimento nel panorama del lusso globale, integrando noleggio supercar, yacht, elicotteri, ville di pregio e servizi di concierge in un\'unica piattaforma.',
  ],
  opportunity_heading: 'Opportunità di partecipazione al capitale',
  opportunity_paragraphs: [
    'Il Consiglio di Amministrazione di Dubai Rent 7.0 S.p.A. ha deliberato l\'apertura selettiva del capitale sociale a investitori privati e partner strategici, con l\'intento di favorire la crescita e l\'espansione del brand a livello internazionale.',
    'L\'ingresso nel capitale è riservato a soggetti qualificati, selezionati direttamente dalla Direzione Generale, nel rispetto delle normative vigenti e delle procedure interne di valutazione.',
    'L\'obiettivo è consolidare la struttura patrimoniale della società e accelerare il piano Vision 2030, che prevede il rafforzamento delle attività operative, lo sviluppo di nuove divisioni e, in prospettiva, la quotazione in mercati regolamentati.',
  ],
  strength_heading: 'Punti di forza',
  strength_points: [
    { id: 'crescita',         title: 'Crescita documentata',          description: 'Fatturato in costante incremento con proiezione di sviluppo superiore al +100% annuo.' },
    { id: 'posizionamento',   title: 'Posizionamento strategico',     description: 'Brand di riferimento nel comparto luxury mobility in Italia e in Europa.' },
    { id: 'espansione',       title: 'Espansione internazionale',     description: 'Apertura verso mercati ad alto potenziale, tra cui Emirati Arabi Uniti e Francia.' },
    { id: 'integrazione',     title: 'Integrazione verticale',        description: 'Un unico ecosistema che combina mobilità di lusso, hospitality e servizi esperienziali.' },
    { id: 'visione',          title: 'Visione a lungo termine',       description: 'Programma industriale orientato alla creazione di valore e alla sostenibilità economica del gruppo.' },
  ],
  cta_heading: 'Modalità di adesione',
  cta_paragraphs: [
    'Gli interessati possono inoltrare richiesta di ammissione al Club Azionisti DR7, compilando il modulo dedicato e avviando la fase di verifica da parte dell\'Ufficio Investor Relations.',
    'Ogni proposta di partecipazione viene valutata singolarmente in base ai requisiti dell\'investitore, alla compatibilità strategica e alle disponibilità di quote.',
  ],
  cta_button_label: 'RICHIEDI ACCESSO INVESTITORI',
  cta_whatsapp_url: 'https://wa.me/393457905205?text=Buongiorno%2C%20sono%20interessato%20ad%20entrare%20nel%20Club%20Azionisti%20DR7.%20Vorrei%20ricevere%20maggiori%20informazioni%20sulle%20opportunit%C3%A0%20di%20investimento%20e%20partecipazione%20al%20capitale.',
  cta_email: 'investor@dr7.app',
  info_heading: 'Informazioni sintetiche',
  info_items: [
    { label: 'Denominazione',                 value: 'Dubai Rent 7.0 S.p.A.' },
    { label: 'Sede legale',                   value: 'Cagliari, Italia' },
    { label: 'Settore',                       value: 'Luxury Mobility & Lifestyle' },
    { label: 'Forma giuridica',               value: 'Società per Azioni' },
    { label: 'Capitale sociale',              value: 'In aumento progressivo secondo piano Vision 2030' },
    { label: 'Tipologia quote',               value: 'Azioni ordinarie nominative' },
    { label: 'Investimento minimo indicativo', value: 'Da €25.000' },
    { label: 'Distribuzione utili',           value: 'Secondo deliberazioni dell\'Assemblea e risultati di bilancio' },
  ],
  info_footnote: 'I dettagli economico-finanziari completi, nonché la documentazione ufficiale, sono forniti esclusivamente su richiesta riservata e previa verifica dei requisiti soggettivi dell\'investitore.',
  legal_heading: 'Avvertenza legale',
  legal_paragraphs: [
    'Le informazioni contenute in questa sezione hanno finalità esclusivamente informative e non costituiscono, in alcun modo, un\'offerta pubblica di sottoscrizione o una sollecitazione all\'investimento ai sensi dell\'art. 94 del D.Lgs. 58/1998 (TUF) e della normativa europea vigente.',
    'L\'adesione a operazioni di partecipazione al capitale è riservata a soggetti selezionati, previa valutazione da parte di Dubai Rent 7.0 S.p.A. e nel pieno rispetto delle procedure legali e regolamentari applicabili.',
  ],
};

// ─── Default Car Wash chrome ───────────────────────────────────────────────
const DEFAULT_CARWASH: CarWashCopy = {
  plate_label_it: 'Inserisci la targa del tuo veicolo',
  plate_label_en: 'Enter your vehicle plate',
  plate_helper_it: 'Per continuare, inserisci la targa per scoprire i servizi disponibili e il prezzo.',
  plate_helper_en: 'To continue, enter your plate to see available services and pricing.',
  plate_placeholder_it: 'es. EX117YA',
  plate_placeholder_en: 'e.g. EX117YA',
  plate_search_it: 'Cerca', plate_search_en: 'Search',
  plate_searching_it: 'Cercando...', plate_searching_en: 'Searching...',
  plate_manual_prompt_it: 'Seleziona manualmente la categoria del tuo veicolo:',
  plate_manual_prompt_en: 'Manually select your vehicle category:',
  plate_change_it: 'Cambia veicolo', plate_change_en: 'Change vehicle',
  add_to_cart_it: 'AGGIUNGI AL CARRELLO', add_to_cart_en: 'ADD TO CART',
  cart_title_it: 'Il tuo carrello', cart_title_en: 'Your cart',
  cart_empty_it: 'Il carrello è vuoto', cart_empty_en: 'Your cart is empty',
  cart_remove_it: 'Rimuovi', cart_remove_en: 'Remove',
  cart_total_it: 'Totale', cart_total_en: 'Total',
  cart_checkout_it: 'PROCEDI', cart_checkout_en: 'CHECKOUT',
  upsell_review_cart_it: 'Rivedi carrello', upsell_review_cart_en: 'Review Cart',
  upsell_step1_title_it: 'Completa il tuo lavaggio', upsell_step1_title_en: 'Complete your wash',
  upsell_step1_text_it: 'Aggiungi un servizio Extra Care per ottenere il massimo dal tuo lavaggio.',
  upsell_step1_text_en: 'Add an Extra Care service to get the most out of your wash.',
  upsell_step2_title_it: "Vivi l'attesa in grande stile", upsell_step2_title_en: 'Experience the wait in style',
  upsell_step2_text_it: "Guida un'auto di cortesia o una supercar mentre il tuo veicolo viene trattato.",
  upsell_step2_text_en: 'Drive a courtesy car or supercar while your vehicle is being treated.',
  upsell_added_it: 'Aggiunto ✓', upsell_added_en: 'Added ✓',
  upsell_add_it: 'Aggiungi', upsell_add_en: 'Add',
};

// ─── Default Mechanical Services chrome ────────────────────────────────────
// Catalog source of truth: `car_wash_services` Supabase table (managed from
// admin > Catalogo Prime Wash). NO services list lives here.
const DEFAULT_MECHANICAL: MechanicalCopy = {
  hero_title: 'DR7 RAPID SERVICE',
  hero_subtitle_it: 'Meccanica rapida senza appuntamenti lunghi',
  hero_subtitle_en: 'Fast mechanical service without long appointments',
  hero_intro_it: 'Solo lavori rapidi — Prenota online e vieni quando vuoi',
  hero_intro_en: 'Quick jobs only — Book online and come when you want',
  book_now_label_it: 'PRENOTA ORA',
  book_now_label_en: 'BOOK NOW',
  how_heading_it: 'Come Funziona',
  how_heading_en: 'How It Works',
  how_steps: [
    { title_it: '1. Prenota Online', title_en: '1. Book Online', text_it: 'Scegli il servizio e prenota in pochi click', text_en: 'Choose your service and book in a few clicks' },
    { title_it: '2. Vieni da Noi', title_en: '2. Come to Us', text_it: 'Arrivi all\'orario prenotato, niente attese', text_en: 'Arrive at your booked time, no waiting' },
    { title_it: '3. Lavoro Rapido', title_en: '3. Quick Service', text_it: 'Completiamo il lavoro velocemente e torni in strada', text_en: 'We complete the job quickly and you\'re back on the road' },
  ],
  hours_heading_it: 'Orari di Apertura',
  hours_heading_en: 'Opening Hours',
  hours_main_it: 'Lunedì - Sabato: 9:00 - 19:00',
  hours_main_en: 'Monday - Saturday: 9:00 AM - 7:00 PM',
  hours_sub_it: 'Chiusi la domenica',
  hours_sub_en: 'Closed on Sundays',
};

// ─── Default Careers seed ──────────────────────────────────────────────────
const DEFAULT_CAREERS: CareersCopy = {
  page_title_it: 'Careers',
  page_title_en: 'Careers',
  intro_it: 'Unisciti a un team appassionato di lusso e dedicato a fornire esperienze senza pari. In DR7 Empire, siamo sempre alla ricerca di talenti eccezionali per aiutarci a superare i confini dell\'eccellenza.',
  intro_en: 'Join a team passionate about luxury and dedicated to delivering unparalleled experiences. At DR7 Empire we are always looking for exceptional talent to help us push the boundaries of excellence.',
  jobs_heading_it: 'Posizioni Aperte',
  jobs_heading_en: 'Open Positions',
  jobs: [
    {
      id: 'curatore-esperienze',
      title_it: 'Curatore di Esperienze di Lusso', title_en: 'Luxury Experience Curator',
      location_it: 'Sede: Cagliari, Italia', location_en: 'Location: Cagliari, Italy',
      type_it: 'Tempo pieno', type_en: 'Full-time',
      description_it: 'Cerchiamo una persona creativa e attenta ai dettagli per progettare e gestire esperienze di lusso su misura per la nostra clientela d\'élite.',
      description_en: 'We are looking for a creative, detail-oriented person to design and manage tailored luxury experiences for our elite clientele.',
    },
    {
      id: 'specialista-relazioni',
      title_it: 'Specialista Relazioni Clienti', title_en: 'Client Relations Specialist',
      location_it: 'Sede: Remoto', location_en: 'Location: Remote',
      type_it: 'Tempo pieno', type_en: 'Full-time',
      description_it: 'Come Specialista Relazioni Clienti, sarai il punto di contatto principale per i nostri membri, assicurando che le loro esigenze siano soddisfatte con il massimo livello di servizio.',
      description_en: 'As a Client Relations Specialist you will be the main point of contact for our members, ensuring their needs are met with the highest level of service.',
    },
  ],
  apply_heading_it: 'Come Candidarsi',
  apply_heading_en: 'How to Apply',
  apply_text_it: 'Se pensi di avere ciò che serve per far parte di DR7 Empire, invia il tuo curriculum vitae e una lettera di presentazione a [candidatura@dr7.app](mailto:candidatura@dr7.app).',
  apply_text_en: 'If you think you have what it takes to join DR7 Empire, send your CV and cover letter to [candidatura@dr7.app](mailto:candidatura@dr7.app).',
  apply_email: 'candidatura@dr7.app',
};

// ─── Default Press seed ────────────────────────────────────────────────────
const DEFAULT_PRESS: PressCopy = {
  page_title_it: 'Press',
  page_title_en: 'Press',
  subtitle_it: 'Scopri le ultime notizie, articoli e comunicati stampa su DR7 Empire',
  subtitle_en: 'Discover the latest news, features, and press releases about DR7 Empire',
  inquiries_heading_it: 'Richieste Stampa',
  inquiries_heading_en: 'Media Inquiries',
  inquiries_text_it: 'Per richieste stampa, interviste o altre questioni relative ai media, contatta il nostro team di relazioni con i media. Saremo lieti di fornire informazioni sulla nostra azienda, i servizi e la nostra visione del futuro del lusso.',
  inquiries_text_en: 'For all media inquiries, interviews, or other press-related matters, please contact our media relations team. We are happy to provide information about our company, services, and vision for the future of luxury.',
  inquiries_email_label_it: 'Email:',
  inquiries_email_label_en: 'Email:',
  inquiries_email: 'info@dr7.app',
  news_heading_it: 'Sui Media',
  news_heading_en: 'In the News',
  read_more_label_it: 'Leggi l\'articolo',
  read_more_label_en: 'Read full article',
  articles: [
    {
      id: 'art-1',
      title: 'Dubai Rent, la prima startup al mondo nel noleggio auto di lusso, a diventare Società per Azioni con €100.000 di capitale sociale',
      publication: 'Casteddu Online',
      date: '28 Maggio 2025',
      summary_it: 'Dubai Rent è diventata la prima startup mondiale nel settore del noleggio auto di lusso a trasformarsi in una Società per Azioni, con un capitale sociale di 100.000 euro, segnando un importante punto di svolta nel proprio sviluppo imprenditoriale.',
      summary_en: 'Dubai Rent became the world\'s first luxury car rental startup to transform into a joint-stock company with €100,000 in share capital, marking a significant turning point in its entrepreneurial development.',
      link: 'https://www.castedduonline.it/dubai-rent-la-prima-startup-al-mondo-nel-noleggio-auto-di-lusso-a-diventare-societa-per-azioni-con-e100-000-di-capitale-sociale/',
    },
    {
      id: 'art-2',
      title: 'DR7: nasce la prima piattaforma al mondo dedicata al lusso integrato',
      publication: 'Casteddu Online',
      date: '18 Settembre 2025',
      summary_it: 'DR7 è la prima piattaforma globale che riunisce in un unico ecosistema integrato supercar, yacht, jet, elicotteri, ville, B&B, SPA ed esperienze esclusive. Il progetto rappresenta un punto di svolta innovativo nel settore del lusso.',
      summary_en: 'DR7 is the first global platform bringing together supercars, yachts, jets, helicopters, villas, B&Bs, spas and exclusive experiences in a single integrated ecosystem — a turning point in the luxury sector.',
      link: 'https://www.castedduonline.it/dr7-nasce-la-prima-piattaforma-al-mondo-dedicata-al-lusso-integrato/',
    },
    {
      id: 'art-3',
      title: 'DR7: Saia Valerio, l\'uomo che sta costruendo il nuovo impero del lusso globale entro il 2030',
      publication: 'Casteddu Online',
      date: '31 Luglio 2025',
      summary_it: 'Valerio Saia ha un obiettivo chiaro: raggiungere un traguardo miliardario entro il 2030 attraverso la costruzione di un nuovo impero nel settore del lusso globale con una strategia di espansione ambiziosa.',
      summary_en: 'Valerio Saia has a clear goal: reaching a billion-euro milestone by 2030 by building a new global luxury empire with an ambitious expansion strategy.',
      link: 'https://www.castedduonline.it/dr7-saia-valerio-luomo-che-sta-costruendo-il-nuovo-impero-del-lusso-globale-entro-il-2030/',
    },
    {
      id: 'art-4',
      title: 'DR7 Exotic Cars e Luxury - Servizi di lusso a Cagliari',
      publication: 'Estate in Sardegna',
      date: '2025',
      summary_it: 'Fondata da Valerio Saia, DR7 è cresciuta rapidamente a oltre 1.500 clienti certificati. Offre noleggio auto di lusso, yacht, elicotteri e servizi premium, con l\'obiettivo di raggiungere €1 miliardo di fatturato entro il 2030.',
      summary_en: 'Founded by Valerio Saia, DR7 has rapidly grown to over 1,500 certified clients. It offers luxury car rentals, yachts, helicopters and premium services, aiming for €1 billion in revenue by 2030.',
      link: 'https://www.estateinsardegna.it/fr/servizi-turistici/cagliari/dr7-exotic-cars-e-luxury/',
    },
    {
      id: 'art-5',
      title: 'DR7, la nuova struttura del lusso operativo',
      publication: 'Casteddu Online',
      date: '24 Luglio 2025',
      summary_it: 'DR7 (ex Dubai Rent 7.0 S.p.A.) si è trasformata da startup locale a società per azioni operativa e scalabile in poco più di un anno, sviluppando margini attivi e asset reali.',
      summary_en: 'DR7 (formerly Dubai Rent 7.0 S.p.A.) transformed from a local startup into an operational, scalable joint-stock company in just over a year, developing real margins and assets.',
      link: 'https://www.castedduonline.it/dr7-la-nuova-struttura-del-lusso-operativo/',
    },
    {
      id: 'art-6',
      title: 'DR7 (Dubai Rent 7.0) – La piattaforma mondiale del lusso',
      publication: 'Casteddu Online',
      date: '2 Settembre 2025',
      summary_it: 'Il futuro del lusso non può più essere frammentato: va reso accessibile in un\'unica infrastruttura globale. DR7 si presenta come piattaforma mondiale per rendere il lusso più accessibile.',
      summary_en: 'The future of luxury can no longer be fragmented: it must be accessible through a single global infrastructure. DR7 positions itself as a world platform to make luxury more accessible.',
      link: 'https://www.castedduonline.it/dr7-dubai-rent-7-0-la-piattaforma-mondiale-del-lusso/',
    },
  ],
  releases_heading_it: 'Comunicati Stampa',
  releases_heading_en: 'Press Releases',
  releases_text_it: 'Per maggiori informazioni sui nostri ultimi annunci e traguardi, contatta il nostro team di relazioni con i media.',
  releases_text_en: 'For more information about our latest announcements and achievements, please contact our media relations team.',
};

// ─── Default Contact seed ──────────────────────────────────────────────────
const DEFAULT_CONTACT: ContactCopy = {
  page_title_it: 'Contattaci',
  page_title_en: 'Contact Us',
  subtitle_it: 'Il nostro team è a disposizione per prenotazioni, informazioni e assistenza personalizzata.',
  subtitle_en: 'Our team is available for bookings, information, and personalized support.',
  phone_label_it: 'Telefono', phone_label_en: 'Phone',
  phone_display: '+39 345 790 5205',
  phone_tel_url: 'tel:+393457905205',
  whatsapp_label_it: 'WhatsApp', whatsapp_label_en: 'WhatsApp',
  whatsapp_button_it: 'Scrivici su WhatsApp', whatsapp_button_en: 'Message us on WhatsApp',
  whatsapp_url: 'https://wa.me/393457905205',
  email_label_it: 'Email', email_label_en: 'Email',
  email_address: 'info@dr7.app',
  hours_label_it: 'Orari', hours_label_en: 'Hours',
  hours_lines_it: ['Lun–Ven: 9:00–13:00 / 15:00–19:00', 'Sabato: 9:00–17:00', 'Domenica: Chiuso'],
  hours_lines_en: ['Mon–Fri: 9:00–13:00 / 15:00–19:00', 'Saturday: 9:00–17:00', 'Sunday: Closed'],
  office_heading_it: 'Sede Operativa', office_heading_en: 'Operating Office',
  office_company_name: 'Dubai Rent 7.0 S.p.A.',
  office_address_it: 'Viale Marconi, 229 – 09131 Cagliari (CA), Italia',
  office_address_en: 'Viale Marconi, 229 – 09131 Cagliari (CA), Italy',
  office_piva: 'P.IVA / C.F.: 04104640927',
  map_title: 'DR7 Empire – Sede Operativa Cagliari',
  map_iframe_url: 'https://www.openstreetmap.org/export/embed.html?bbox=9.1000%2C39.2200%2C9.1300%2C39.2300&layer=mapnik&marker=39.2253%2C9.1150',
};

// ─── Default Footer seed ────────────────────────────────────────────────────
const DEFAULT_FOOTER: FooterCopy = {
  network_title: 'Join the DR7 Network',
  network_text_it: 'Entra nel nostro ecosistema globale e segui i nostri canali social per contenuti esclusivi e aggiornamenti dal mondo DR7 Cagliari.',
  network_text_en: 'Join our global ecosystem and follow our social channels for exclusive content and updates from the DR7 Cagliari world.',
  social_links: [
    { id: 'ig', label: 'Instagram', href: 'https://www.instagram.com/dubai_rent_7.0_s_p_a_', icon: 'instagram' },
    { id: 'tt', label: 'Tiktok',    href: 'https://www.tiktok.com/@dr7luxuryempire',           icon: 'tiktok' },
  ],
  reviews_title: 'A Global Standard of Excellence',
  reviews_text_it: 'DR7 Cagliari mantiene un rating impeccabile di 5.0/5.0 su quasi 300 recensioni verificate, confermandosi un punto di riferimento nel settore della luxury mobility.',
  reviews_text_en: 'DR7 Cagliari maintains a flawless 5.0/5.0 rating across nearly 300 verified reviews, confirming itself as a benchmark in the luxury mobility sector.',
  contact_title: 'Contact',
  contact_whatsapp_number: '+39 345 790 5205',
  contact_whatsapp_url: 'https://wa.me/393457905205',
  contact_company_name: 'Dubai Rent 7.0 S.p.A.',
  contact_legal_address_it: 'Sede Legale: Via del Fangario 25, 09122 Cagliari (CA) – Italia',
  contact_legal_address_en: 'Registered Office: Via del Fangario 25, 09122 Cagliari (CA) – Italy',
  contact_capitale_sociale_it: 'Capitale Sociale: € 50.000 i.v. (in aumento)',
  contact_capitale_sociale_en: 'Share Capital: € 50,000 fully paid (increasing)',
  contact_piva: 'P.IVA / C.F.: 04104640927',
  contact_disclaimer_it: 'Società soggetta a direzione e coordinamento della\nDR7 Group S.p.A.',
  contact_disclaimer_en: 'Company subject to the management and coordination of\nDR7 Group S.p.A.',
  division_links: [
    { id: 'div-1', label_it: 'Supercar & Luxury Division', label_en: 'Supercar & Luxury Division', to: '/supercar-luxury' },
    { id: 'div-2', label_it: 'Prime Wash',                  label_en: 'Prime Wash',                  to: '/prime-wash' },
    { id: 'div-3', label_it: 'Contattaci',                  label_en: 'Contact us',                  to: '/contact' },
  ],
  corporate_links: [
    { id: 'corp-1', label_it: 'Corporate Overview',         label_en: 'Corporate Overview',         to: '/about' },
    { id: 'corp-2', label_it: 'Press & Media',              label_en: 'Press & Media',              to: '/press' },
    { id: 'corp-3', label_it: 'Careers & Opportunities',    label_en: 'Careers & Opportunities',    to: '/careers' },
  ],
  legal_links: [
    { id: 'leg-1', label_it: 'Termini di Servizio',         label_en: 'Terms of Service',           to: '/terms' },
    { id: 'leg-2', label_it: 'Cookie Policy',               label_en: 'Cookie Policy',              to: '/cookie-policy' },
    { id: 'leg-3', label_it: 'Privacy Policy',              label_en: 'Privacy Policy',             to: '/privacy' },
    { id: 'leg-4', label_it: 'Cancellation Policy',         label_en: 'Cancellation Policy',        to: '/cancellation-policy' },
  ],
  bottom_brand_line: 'DR7 Cagliari – Global Mobility & Luxury Lifestyle Group',
  bottom_copyright: '© 2024 - 2026 DR7 Cagliari. All Rights Reserved.',
};

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

// ─── Default Legal seed (Privacy + Cookie + Rental Agreement) ──────────────
// Terms ships with `enabled: false` for now — the legacy hardcoded page
// keeps rendering. Admin can enable it later and paste the content.
const DEFAULT_LEGAL: LegalCopy = {
  pages: [
    {
      id: 'privacy',
      enabled: true,
      title_it: 'Informativa sulla Privacy',
      title_en: 'Privacy Policy',
      last_updated_dynamic: true,
      last_updated_label_it: 'Ultimo aggiornamento',
      last_updated_label_en: 'Last updated',
      intro_blocks: [],
      sections: [
        { id: 'introduzione', heading_it: '1. Introduzione e Titolare del Trattamento', heading_en: '1. Introduction and Data Controller',
          blocks: [
            { type: 'p',
              text_it: 'Dubai Rent 7.0 S.p.A. – DR7 Empire ("noi", "nostro" o "ci") si impegna a proteggere la tua privacy. Questa Informativa sulla Privacy spiega come raccogliamo, utilizziamo, divulghiamo e proteggiamo i tuoi dati personali quando utilizzi i nostri servizi. Questa informativa è fornita in conformità con il Regolamento Generale sulla Protezione dei Dati (GDPR) dell\'UE.',
              text_en: 'Dubai Rent 7.0 S.p.A. – DR7 Empire ("we", "our" or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your personal data when you use our services. This notice is provided in compliance with the EU General Data Protection Regulation (GDPR).' },
            { type: 'p',
              text_it: 'DR7 Empire è il Titolare del Trattamento dei dati personali raccolti attraverso la nostra piattaforma ed è responsabile dei tuoi dati personali.',
              text_en: 'DR7 Empire is the Data Controller for personal data collected via our platform and is responsible for your personal data.' },
          ] },
        { id: 'dati-raccolti', heading_it: '2. Dati Personali che Raccogliamo', heading_en: '2. Personal Data We Collect',
          blocks: [
            { type: 'p',
              text_it: 'Possiamo raccogliere, utilizzare, archiviare e trasferire diversi tipi di dati personali su di te, che abbiamo raggruppato come segue:',
              text_en: 'We may collect, use, store and transfer different kinds of personal data about you, which we have grouped as follows:' },
            { type: 'ul',
              items_it: [
                '**Dati di Identità:** Include nome, cognome, nome utente, data di nascita e copie di documenti d\'identità rilasciati dal governo (es. patente di guida, passaporto) per la verifica.',
                '**Dati di Contatto:** Include indirizzo di fatturazione, indirizzo email e numeri di telefono.',
                '**Dati Finanziari:** Include dettagli della carta di pagamento o informazioni sul portafoglio di criptovalute.',
                '**Dati Transazionali:** Include dettagli sui pagamenti da e verso di te e altri dettagli dei servizi che hai acquistato tramite noi.',
                '**Dati Tecnici:** Include indirizzo IP (Internet Protocol), i tuoi dati di accesso, tipo e versione del browser e altre tecnologie sui dispositivi che utilizzi per accedere alla nostra piattaforma.',
              ],
              items_en: [
                '**Identity Data:** Includes first name, last name, username, date of birth, and copies of government-issued ID (e.g. driver\'s license, passport) for verification.',
                '**Contact Data:** Includes billing address, email address, and phone numbers.',
                '**Financial Data:** Includes payment card details or cryptocurrency wallet information.',
                '**Transaction Data:** Includes details about payments to and from you and other details of services you have purchased through us.',
                '**Technical Data:** Includes IP address, your login data, browser type and version, and other technologies on the devices you use to access our platform.',
              ] },
          ] },
        { id: 'come-utilizzo', heading_it: '3. Come Utilizziamo i Tuoi Dati Personali', heading_en: '3. How We Use Your Personal Data',
          blocks: [
            { type: 'p',
              text_it: 'Utilizzeremo i tuoi dati personali solo quando la legge ce lo consente. Più comunemente, utilizzeremo i tuoi dati personali nelle seguenti circostanze:',
              text_en: 'We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:' },
            { type: 'ul',
              items_it: [
                'Per eseguire il contratto di intermediazione che stiamo per stipulare o abbiamo stipulato con te.',
                'Per facilitare la prenotazione e il contratto di noleggio tra te e il proprietario dell\'asset di terze parti.',
                'Per rispettare un obbligo legale o normativo (come la verifica dell\'identità).',
                'Dove è necessario per i nostri legittimi interessi (o quelli di terzi) e i tuoi interessi e diritti fondamentali non prevalgono su tali interessi.',
              ],
              items_en: [
                'To perform the brokerage contract we are about to enter into or have entered into with you.',
                'To facilitate the booking and rental contract between you and the third-party asset owner.',
                'To comply with a legal or regulatory obligation (such as identity verification).',
                'Where it is necessary for our legitimate interests (or those of third parties) and your interests and fundamental rights do not override those interests.',
              ] },
          ] },
        { id: 'divulgazione', heading_it: '4. Divulgazione dei Tuoi Dati Personali', heading_en: '4. Disclosure of Your Personal Data',
          blocks: [
            { type: 'p',
              text_it: 'Potremmo dover condividere i tuoi dati personali con le parti indicate di seguito per gli scopi indicati nella Sezione 3:',
              text_en: 'We may have to share your personal data with the parties set out below for the purposes set out in Section 3:' },
            { type: 'ul',
              items_it: [
                '**Proprietari di Asset di Terze Parti:** Condivideremo i dati di Identità, Contatto e Transazione necessari con i proprietari degli asset che desideri prenotare per facilitare il Contratto di Noleggio tra te e loro.',
                '**Fornitori di Servizi:** Impieghiamo società di terze parti per l\'elaborazione dei pagamenti e la verifica dell\'identità.',
                '**Consulenti Professionali:** Inclusi avvocati, banchieri, revisori e assicuratori che forniscono servizi di consulenza, bancari, legali, assicurativi e contabili.',
                '**Autorità di Regolamentazione:** Potremmo essere tenuti a condividere i tuoi dati personali con le forze dell\'ordine o altre autorità in Italia se richiesto dalla legge.',
              ],
              items_en: [
                '**Third-Party Asset Owners:** We will share necessary Identity, Contact and Transaction data with the asset owners you wish to book in order to facilitate the Rental Agreement between you and them.',
                '**Service Providers:** We employ third-party companies for payment processing and identity verification.',
                '**Professional Advisers:** Including lawyers, bankers, auditors and insurers who provide consultancy, banking, legal, insurance and accounting services.',
                '**Regulatory Authorities:** We may be required to share your personal data with law enforcement or other authorities in Italy if required by law.',
              ] },
            { type: 'p',
              text_it: 'Richiediamo a tutte le terze parti di rispettare la sicurezza dei tuoi dati personali e di trattarli in conformità con la legge. Non consentiamo ai nostri fornitori di servizi di terze parti di utilizzare i tuoi dati personali per i propri scopi.',
              text_en: 'We require all third parties to respect the security of your personal data and to treat it in accordance with the law. We do not allow our third-party service providers to use your personal data for their own purposes.' },
          ] },
        { id: 'sicurezza', heading_it: '5. Sicurezza dei Dati', heading_en: '5. Data Security',
          blocks: [
            { type: 'p',
              text_it: 'Abbiamo messo in atto misure di sicurezza tecniche e organizzative appropriate per prevenire che i tuoi dati personali vengano accidentalmente persi, utilizzati o accessibili in modo non autorizzato. Limitiamo l\'accesso ai tuoi dati personali a quei dipendenti e terze parti che hanno una necessità aziendale di conoscerli.',
              text_en: 'We have put in place appropriate technical and organizational security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorized way. We limit access to your personal data to those employees and third parties who have a business need to know.' },
          ] },
        { id: 'diritti-gdpr', heading_it: '6. I Tuoi Diritti Legali ai sensi del GDPR', heading_en: '6. Your Legal Rights under GDPR',
          blocks: [
            { type: 'p',
              text_it: 'In determinate circostanze, hai diritti ai sensi delle leggi sulla protezione dei dati in relazione ai tuoi dati personali. Questi includono:',
              text_en: 'Under certain circumstances, you have rights under data protection laws in relation to your personal data. These include:' },
            { type: 'ul',
              items_it: [
                '**Richiedere l\'accesso** ai tuoi dati personali.',
                '**Richiedere la correzione** dei dati personali che deteniamo su di te.',
                '**Richiedere la cancellazione** dei tuoi dati personali.',
                '**Opporsi al trattamento** dei tuoi dati personali.',
                '**Richiedere la limitazione del trattamento** dei tuoi dati personali.',
                '**Richiedere il trasferimento** dei tuoi dati personali a te o a terzi.',
                '**Revocare il consenso in qualsiasi momento** quando ci affidiamo al consenso per trattare i tuoi dati personali.',
              ],
              items_en: [
                '**Request access** to your personal data.',
                '**Request correction** of the personal data we hold about you.',
                '**Request erasure** of your personal data.',
                '**Object to processing** of your personal data.',
                '**Request restriction of processing** of your personal data.',
                '**Request transfer** of your personal data to you or to a third party.',
                '**Withdraw consent at any time** where we are relying on consent to process your personal data.',
              ] },
            { type: 'p',
              text_it: 'Se desideri esercitare uno di questi diritti, ti preghiamo di contattarci. Hai anche il diritto di presentare un reclamo in qualsiasi momento presso l\'autorità italiana per la protezione dei dati, il Garante per la protezione dei dati personali.',
              text_en: 'If you wish to exercise any of these rights, please contact us. You also have the right to lodge a complaint at any time with the Italian data protection authority, the Garante per la protezione dei dati personali.' },
          ] },
        { id: 'contatti', heading_it: '7. Contattaci', heading_en: '7. Contact Us',
          blocks: [
            { type: 'p',
              text_it: 'Se hai domande su questa Informativa sulla Privacy o sulle nostre pratiche di privacy, contatta il nostro Responsabile della Privacy dei Dati all\'indirizzo: [info@dr7.app](mailto:info@dr7.app).',
              text_en: 'If you have questions about this Privacy Policy or our privacy practices, please contact our Data Privacy Officer at: [info@dr7.app](mailto:info@dr7.app).' },
          ] },
      ],
      outro_blocks: [
        { type: 'p-italic',
          text_it: 'Dubai Rent 7.0 S.p.A.\nViale Marconi, 229, 09131 Cagliari CA\nEmail: info@dr7.app',
          text_en: 'Dubai Rent 7.0 S.p.A.\nViale Marconi, 229, 09131 Cagliari CA\nEmail: info@dr7.app' },
      ],
    },
    {
      id: 'cookie',
      enabled: true,
      title_it: 'Cookie Policy',
      title_en: 'Cookie Policy',
      last_updated_dynamic: true,
      last_updated_label_it: 'Ultimo Aggiornamento',
      last_updated_label_en: 'Last Updated',
      intro_blocks: [],
      sections: [
        { id: 'cosa-sono', heading_it: '1. Cosa Sono i Cookie?', heading_en: '1. What Are Cookies?',
          blocks: [
            { type: 'p',
              text_it: 'I cookie sono piccoli file di testo che vengono memorizzati sul tuo computer, smartphone o altro dispositivo quando visiti un sito web. Sono ampiamente utilizzati per far funzionare i siti web, o farli funzionare in modo più efficiente, nonché per fornire informazioni ai proprietari del sito. I cookie ci aiutano a ricordare le tue preferenze e a capire come utilizzi il nostro sito, il che ci permette di migliorare la tua esperienza.',
              text_en: 'Cookies are small text files stored on your computer, smartphone or other device when you visit a website. They are widely used to make websites work, or to work more efficiently, as well as to provide information to site owners. Cookies help us remember your preferences and understand how you use our site, which allows us to improve your experience.' },
          ] },
        { id: 'come-utilizziamo', heading_it: '2. Come Utilizziamo i Cookie', heading_en: '2. How We Use Cookies',
          blocks: [
            { type: 'p',
              text_it: 'Utilizziamo i cookie per diversi scopi importanti. Possono essere classificati come segue:',
              text_en: 'We use cookies for several important purposes. They can be classified as follows:' },
            { type: 'ul',
              items_it: [
                '**Cookie Strettamente Necessari:** Questi cookie sono essenziali per navigare nel sito web e utilizzare le sue funzionalità, come l\'accesso ad aree protette del sito. Senza questi cookie, servizi come il login utente e il processo di prenotazione non possono essere forniti.',
                '**Cookie di Prestazioni e Analisi:** Questi cookie raccolgono informazioni su come utilizzi il nostro sito web, ad esempio quali pagine visiti più spesso. Questi dati ci aiutano a ottimizzare il nostro sito web e renderlo più facile da navigare. Tutte le informazioni raccolte da questi cookie sono aggregate e quindi anonime.',
                '**Cookie Funzionali:** Questi cookie permettono al nostro sito web di ricordare le scelte che fai durante la navigazione. Ad esempio, possiamo memorizzare la tua posizione geografica in un cookie per assicurarci di mostrarti il sito web localizzato per la tua area, oppure possiamo ricordare preferenze come lingua e valuta. Questo ci consente di fornirti un\'esperienza più personalizzata e conveniente.',
                '**Cookie di Targeting o Pubblicitari:** Questi cookie vengono utilizzati per fornire pubblicità più pertinenti a te e ai tuoi interessi. Vengono utilizzati anche per limitare il numero di volte in cui vedi una pubblicità e per misurare l\'efficacia delle campagne pubblicitarie. Di solito vengono inseriti da reti pubblicitarie con il permesso del gestore del sito web.',
              ],
              items_en: [
                '**Strictly Necessary Cookies:** These cookies are essential for browsing the website and using its features, such as accessing secure areas of the site. Without these cookies, services such as user login and the booking process cannot be provided.',
                '**Performance and Analytics Cookies:** These cookies collect information about how you use our website, for example which pages you visit most often. This data helps us optimize our website and make it easier to navigate. All information these cookies collect is aggregated and therefore anonymous.',
                '**Functional Cookies:** These cookies allow our website to remember choices you make while browsing. For example, we may store your geographical location in a cookie to make sure we show you the website localized for your area, or we may remember preferences such as language and currency. This enables us to provide a more personalized and convenient experience.',
                '**Targeting or Advertising Cookies:** These cookies are used to deliver advertising more relevant to you and your interests. They are also used to limit the number of times you see an advertisement and to measure the effectiveness of advertising campaigns. They are usually placed by advertising networks with the website operator\'s permission.',
              ] },
          ] },
        { id: 'terze-parti', heading_it: '3. Cookie di Terze Parti', heading_en: '3. Third-Party Cookies',
          blocks: [
            { type: 'p',
              text_it: 'Oltre ai nostri cookie, possiamo anche utilizzare vari cookie di terze parti per segnalare statistiche di utilizzo del Servizio, fornire pubblicità sul e attraverso il Servizio, e così via. Ad esempio, utilizziamo Google Analytics per aiutarci a comprendere il traffico del nostro sito web.',
              text_en: 'In addition to our own cookies, we may also use various third-party cookies to report usage statistics of the Service, deliver advertisements on and through the Service, and so on. For example, we use Google Analytics to help us understand the traffic on our website.' },
          ] },
        { id: 'scelte', heading_it: '4. Le Tue Scelte e Gestione dei Cookie', heading_en: '4. Your Choices and Cookie Management',
          blocks: [
            { type: 'p',
              text_it: 'Hai il diritto di decidere se accettare o rifiutare i cookie. Puoi esercitare le tue preferenze sui cookie utilizzando le impostazioni del tuo browser web. La maggior parte dei browser ti consente di controllare i cookie attraverso le loro impostazioni di preferenza. Tuttavia, se limiti la capacità dei siti web di impostare cookie, potresti peggiorare la tua esperienza utente complessiva, poiché non sarà più personalizzata per te. Potrebbe anche impedirti di salvare impostazioni personalizzate come le informazioni di login.',
              text_en: 'You have the right to decide whether to accept or refuse cookies. You can exercise your cookie preferences using your web browser settings. Most browsers allow you to control cookies through their preference settings. However, if you limit the ability of websites to set cookies, you may worsen your overall user experience, since it will no longer be personalized for you. It may also prevent you from saving customized settings such as login information.' },
            { type: 'p',
              text_it: 'Per saperne di più sui cookie, incluso come vedere quali cookie sono stati impostati e come gestirli ed eliminarli, visita [www.allaboutcookies.org](https://www.allaboutcookies.org).',
              text_en: 'To learn more about cookies, including how to see which cookies have been set and how to manage and delete them, visit [www.allaboutcookies.org](https://www.allaboutcookies.org).' },
          ] },
        { id: 'modifiche', heading_it: '5. Modifiche a Questa Politica sui Cookie', heading_en: '5. Changes to This Cookie Policy',
          blocks: [
            { type: 'p',
              text_it: 'Possiamo aggiornare questa Politica sui Cookie di tanto in tanto per riflettere, ad esempio, modifiche ai cookie che utilizziamo o per altri motivi operativi, legali o normativi. Ti invitiamo quindi a rivisitare regolarmente questa Politica sui Cookie per rimanere informato sul nostro utilizzo dei cookie e delle tecnologie correlate.',
              text_en: 'We may update this Cookie Policy from time to time to reflect, for example, changes to the cookies we use or for other operational, legal or regulatory reasons. We therefore encourage you to revisit this Cookie Policy regularly to stay informed about our use of cookies and related technologies.' },
          ] },
      ],
      outro_blocks: [],
    },
    {
      id: 'rental_agreement',
      enabled: true,
      title_it: 'Contratto di Noleggio (Riassunto)',
      title_en: 'Rental Agreement (Overview)',
      last_updated_dynamic: false,
      last_updated_label_it: '',
      last_updated_label_en: '',
      intro_blocks: [
        { type: 'p-bold',
          text_it: 'Avviso Importante: Questo documento fornisce una panoramica generale dei termini e delle condizioni tipici che disciplinano il noleggio di asset di lusso attraverso la piattaforma DR7 Empire. DR7 agisce come intermediario e non è parte del contratto di noleggio finale. L\'accordo legalmente vincolante ("Contratto di Noleggio") sarà tra te ("il Noleggiatore") e il proprietario di terze parti ("il Proprietario"), e i suoi termini specifici possono variare.',
          text_en: '**Important Notice:** This document provides a general overview of the typical terms and conditions governing the rental of luxury assets through the DR7 Empire platform. DR7 acts as a broker and is not a party to the final rental contract. The legally binding agreement ("Rental Agreement") will be between you ("the Renter") and the third-party asset owner ("the Owner"), and its specific terms may vary.' },
      ],
      sections: [
        { id: 'brokerage', heading_it: '1. Il Ruolo di Intermediazione di DR7', heading_en: '1. The Brokerage Role of DR7',
          blocks: [
            { type: 'p',
              text_it: 'DR7 facilita la connessione tra il Noleggiatore e il Proprietario. Non siamo proprietari né operatori degli asset elencati. Questo documento ha lo scopo di fornire un riassunto dei termini comuni che ci si può aspettare nel Contratto di Noleggio finale del Proprietario.',
              text_en: 'DR7 facilitates the connection between the Renter and the Owner. We are not the owner or operator of the assets listed. This document is intended to provide a summary of common terms to expect in the Owner\'s final Rental Agreement.' },
          ] },
        { id: 'parties', heading_it: '2. Parti Principali', heading_en: '2. Key Parties',
          blocks: [
            { type: 'ul',
              items_it: [
                '**Il Noleggiatore ("tu"):** Il cliente che prenota l\'asset.',
                '**Il Proprietario:** La società o persona di terze parti che possiede e fornisce l\'asset in noleggio.',
                '**DR7 Empire ("l\'Intermediario"):** L\'intermediario che facilita la transazione.',
              ],
              items_en: [
                '**The Renter ("you"):** The client booking the asset.',
                '**The Owner:** The third-party company or individual who owns and provides the asset for rent.',
                '**DR7 Empire ("the Broker"):** The intermediary facilitating the transaction.',
              ] },
          ] },
        { id: 'obligations', heading_it: '3. Obblighi Generali del Noleggiatore', heading_en: '3. General Renter Obligations',
          blocks: [
            { type: 'p',
              text_it: 'Il Contratto di Noleggio finale con il Proprietario richiederà tipicamente al Noleggiatore di:',
              text_en: 'The final Rental Agreement with the Owner will typically require the Renter to:' },
            { type: 'ul',
              items_it: [
                'Soddisfare i requisiti minimi di età e di patente (es. 25+ con patente di guida valida per le auto).',
                'Fornire una cauzione contro potenziali danni, multe o altre spese accessorie.',
                'Operare l\'asset in sicurezza e conformemente a tutte le leggi applicabili e alle regole specifiche del Proprietario.',
                'Restituire l\'asset all\'orario e nel luogo concordati, nelle stesse condizioni in cui è stato ricevuto, salvo normale usura.',
              ],
              items_en: [
                'Meet minimum age and licensing requirements (e.g. 25+ with a valid driver\'s license for cars).',
                'Provide a security deposit against potential damages, fines, or other incidental charges.',
                'Operate the asset safely and in accordance with all applicable laws and the Owner\'s specific rules.',
                'Return the asset at the agreed time and location, in the same condition it was received, allowing for normal wear and tear.',
              ] },
          ] },
        { id: 'insurance', heading_it: '4. Assicurazione e Responsabilità', heading_en: '4. Insurance and Liability',
          blocks: [
            { type: 'p',
              text_it: 'L\'assicurazione per l\'asset è fornita dal Proprietario, non da DR7. Le specifiche della copertura, inclusa la franchigia di cui sei responsabile in caso di danno, saranno dettagliate nel Contratto di Noleggio del Proprietario. Il Noleggiatore è tipicamente responsabile per tutti i danni, le perdite e le violazioni di legge non coperte dalla polizza assicurativa del Proprietario. DR7 non è responsabile per alcun incidente relativo all\'asset.',
              text_en: 'Insurance for the asset is provided by the Owner, not by DR7. The specifics of the coverage, including the deductible (excess) amount for which you are responsible in case of damage, will be detailed in the Owner\'s Rental Agreement. The Renter is typically liable for all damages, losses, and legal violations that are not covered by the Owner\'s insurance policy. DR7 is not liable for any incidents related to the asset.' },
          ] },
        { id: 'prohibited', heading_it: '5. Usi Vietati', heading_en: '5. Prohibited Uses',
          blocks: [
            { type: 'p',
              text_it: 'Ogni Contratto di Noleggio conterrà una lista di usi vietati. Questi includono quasi universalmente, ma non sono limitati a:',
              text_en: 'Every Rental Agreement will contain a list of prohibited uses. These almost universally include, but are not limited to:' },
            { type: 'ul',
              items_it: [
                'Uso per qualsiasi scopo illegale.',
                'Partecipazione a gare, competizioni o test di prestazione.',
                'Operazione da parte di qualsiasi persona non esplicitamente autorizzata nel Contratto di Noleggio.',
                'Uso sotto l\'effetto di alcol, narcotici o altre sostanze che alterano le facoltà.',
                'Uso al di fuori dell\'area geografica contrattualmente consentita.',
              ],
              items_en: [
                'Use for any illegal purpose.',
                'Participation in races, competitions, or performance tests.',
                'Operation by any person not explicitly authorized in the Rental Agreement.',
                'Use while under the influence of alcohol, narcotics, or other impairing substances.',
                'Use outside of the contractually permitted geographical area.',
              ] },
          ] },
        { id: 'final', heading_it: '6. Accordo Finale', heading_en: '6. Final Agreement',
          blocks: [
            { type: 'p',
              text_it: 'Alla conferma della tua richiesta di prenotazione, ti verrà presentato il Contratto di Noleggio finale del Proprietario. Devi leggerlo, comprenderlo e accettarne i termini prima che il noleggio possa iniziare. Procedendo con la prenotazione, riconosci che DR7 è esclusivamente un intermediario e che il tuo rapporto legale per il noleggio è con il Proprietario dell\'asset.',
              text_en: 'Upon confirmation of your booking request, you will be presented with the Owner\'s final Rental Agreement. You must read, understand, and agree to its terms before the rental can commence. By proceeding with the booking, you acknowledge that DR7 is solely a broker and that your legal relationship for the rental is with the Owner of the asset.' },
          ] },
      ],
      outro_blocks: [],
    },
    {
      id: 'terms',
      enabled: true,
      title_it: 'Termini di Servizio',
      title_en: 'Terms of Service',
      last_updated_dynamic: true,
      last_updated_label_it: 'Ultimo aggiornamento',
      last_updated_label_en: 'Last updated',
      intro_blocks: [],
      sections: [
        { id: 'accettazione', heading_it: 'Accettazione dei Termini', heading_en: 'Acceptance of Terms', blocks: [
          { type: 'p',
            text_it: 'Benvenuto su DR7 Empire ("DR7", "noi", "nostro"). Le presenti Condizioni Generali del Servizio di Intermediazione ("Termini") disciplinano l\'utilizzo della nostra piattaforma e dei nostri servizi (collettivamente, i "Servizi").',
            text_en: 'Welcome to DR7 Empire ("DR7", "we", "our"). These General Terms of the Brokerage Service ("Terms") govern the use of our platform and services (collectively, the "Services").' },
          { type: 'p',
            text_it: 'Accedendo o utilizzando i nostri Servizi, l\'utente accetta di essere vincolato dai presenti Termini e dalla nostra Informativa sulla Privacy. In caso di disaccordo, è vietato utilizzare i Servizi.',
            text_en: 'By accessing or using our Services, you agree to be bound by these Terms and by our Privacy Policy. If you do not agree, you must not use the Services.' },
          { type: 'p',
            text_it: 'I presenti Termini costituiscono un accordo legalmente vincolante tra l\'utente ("Cliente", "tu") e DR7 Empire, relativo all\'accesso e all\'utilizzo della piattaforma DR7.',
            text_en: 'These Terms constitute a legally binding agreement between you ("Customer", "you") and DR7 Empire regarding access to and use of the DR7 platform.' },
        ]},
        { id: 'intermediario', heading_it: 'Il Nostro Ruolo di Intermediario', heading_en: 'Our Role as Broker', blocks: [
          { type: 'p',
            text_it: 'DR7 fornisce un servizio esclusivo di intermediazione, agendo come tramite per mettere in contatto l\'utente con una rete selezionata di proprietari e operatori terzi ("Proprietari") di beni di lusso, inclusi ma non limitati a automobili, yacht, ville e jet privati ("Beni").',
            text_en: 'DR7 provides an exclusive brokerage service, acting as the intermediary that connects you with a selected network of third-party owners and operators ("Owners") of luxury goods, including but not limited to cars, yachts, villas and private jets ("Goods").' },
          { type: 'p-bold', text_it: 'Importante', text_en: 'Important' },
          { type: 'p',
            text_it: 'DR7 non è il proprietario, l\'operatore o l\'assicuratore dei Beni. Il nostro ruolo è strettamente limitato a facilitare il processo di prenotazione tra l\'utente e il Proprietario. La fornitura del Bene è di esclusiva responsabilità del Proprietario.',
            text_en: 'DR7 is not the owner, operator or insurer of the Goods. Our role is strictly limited to facilitating the booking process between you and the Owner. Provision of the Good is the sole responsibility of the Owner.' },
          { type: 'p',
            text_it: 'Il noleggio o il charter di un Bene sarà soggetto a un accordo separato e legalmente vincolante tra l\'utente e il rispettivo Proprietario ("Contratto di Noleggio").',
            text_en: 'The rental or charter of a Good will be subject to a separate, legally binding agreement between you and the respective Owner ("Rental Agreement").' },
        ]},
        { id: 'account', heading_it: 'Account Utente e Verifica del Cliente', heading_en: 'User Account and Customer Verification', blocks: [
          { type: 'p',
            text_it: 'Per accedere ai nostri Servizi, è necessario avere almeno 25 anni e la capacità giuridica di stipulare contratti vincolanti.',
            text_en: 'To access our Services you must be at least 25 years old and have the legal capacity to enter into binding contracts.' },
          { type: 'p',
            text_it: 'È richiesta la registrazione di un account con informazioni accurate e complete. Per conformità alle normative italiane e internazionali, incluse le leggi antiriciclaggio (AML), potremmo richiedere la verifica dell\'identità, incluso un documento di identità rilasciato dal governo, prima di confermare prenotazioni di alto valore.',
            text_en: 'Registration of an account with accurate and complete information is required. For compliance with Italian and international regulations, including anti-money laundering (AML) laws, we may require identity verification, including a government-issued ID, before confirming high-value bookings.' },
        ]},
        { id: 'pagamenti', heading_it: 'Prenotazioni, Pagamenti e Condizioni Finanziarie', heading_en: 'Bookings, Payments and Financial Terms', blocks: [
          { type: 'p-bold', text_it: 'Prenotazione', text_en: 'Booking' },
          { type: 'p',
            text_it: 'Una richiesta di prenotazione inoltrata tramite la nostra piattaforma costituisce un\'offerta di noleggio di un Bene. La prenotazione è confermata solo al ricevimento di una conferma formale da parte nostra e all\'accettazione del Contratto di Noleggio del Proprietario.',
            text_en: 'A booking request submitted via our platform constitutes an offer to rent a Good. The booking is confirmed only upon receipt of a formal confirmation from us and acceptance of the Owner\'s Rental Agreement.' },
          { type: 'p-bold', text_it: 'Pagamenti', text_en: 'Payments' },
          { type: 'p',
            text_it: 'In qualità di intermediario, DR7 facilita i pagamenti dall\'utente al Proprietario. L\'utente ci autorizza ad addebitare il metodo di pagamento prescelto per l\'importo totale della prenotazione, inclusi canone di noleggio, tasse e deposito cauzionale.',
            text_en: 'As broker, DR7 facilitates payments from you to the Owner. You authorize us to charge your chosen payment method for the total booking amount, including rental fee, taxes and security deposit.' },
        ]},
        { id: 'assegnazione-veicolo', heading_it: 'Assegnazione e Sostituzione Veicolo', heading_en: 'Vehicle Assignment and Substitution', blocks: [
          { type: 'p',
            text_it: 'Il veicolo prenotato dal Cliente corrisponde al modello selezionato in fase di prenotazione. Tuttavia, per cause operative non imputabili a DR7 (quali, a titolo esemplificativo, sinistri, guasti, ritardi nella riconsegna o esigenze tecniche), il veicolo potrebbe non essere disponibile al momento del ritiro. In tali circostanze, DR7 si riserva il diritto di fornire un veicolo sostitutivo appartenente alla stessa categoria o a categoria superiore.',
            text_en: 'The vehicle booked by the Customer corresponds to the model selected at booking. However, for operational reasons not attributable to DR7 (such as, by way of example, accidents, breakdowns, late returns or technical requirements), the vehicle may not be available at pickup. In such circumstances, DR7 reserves the right to provide a substitute vehicle of the same or higher category.' },
          { type: 'p',
            text_it: 'Il Cliente accetta che tale sostituzione costituisce regolare esecuzione del contratto, senza diritto a rimborso o riduzione del corrispettivo.',
            text_en: 'The Customer accepts that such substitution constitutes proper execution of the contract, without entitlement to refund or fee reduction.' },
        ]},
        { id: 'proprietari', heading_it: 'Ruolo dei Proprietari Terzi', heading_en: 'Role of Third-Party Owners', blocks: [
          { type: 'p',
            text_it: 'I Proprietari sono entità indipendenti e non sono dipendenti o agenti di DR7. I Proprietari sono gli unici responsabili di:',
            text_en: 'Owners are independent entities and are not employees or agents of DR7. Owners are solely responsible for:' },
          { type: 'ul',
            items_it: [
              'Garantire che il Bene sia in condizioni sicure, legali e operative.',
              'Fornire un\'assicurazione completa per il Bene.',
              'Eseguire il Contratto di Noleggio finale con l\'utente.',
              'La consegna, la gestione e il ritiro del Bene.',
            ],
            items_en: [
              'Ensuring the Good is in safe, legal and operational condition.',
              'Providing full insurance for the Good.',
              'Executing the final Rental Agreement with you.',
              'Delivery, handling and pickup of the Good.',
            ] },
          { type: 'p',
            text_it: 'Sebbene DR7 selezioni attentamente tutti i Proprietari della propria rete, non garantiamo le prestazioni o la qualità di alcun Bene o Proprietario.',
            text_en: 'Although DR7 carefully selects all Owners in its network, we do not guarantee the performance or quality of any Good or Owner.' },
        ]},
        { id: 'responsabilita', heading_it: 'Limitazione di Responsabilità', heading_en: 'Limitation of Liability', blocks: [
          { type: 'p',
            text_it: 'Nella misura massima consentita dalla legge italiana, la responsabilità di DR7 Empire è limitata al suo ruolo di servizio di intermediazione. Non saremo responsabili per danni diretti, indiretti, incidentali, speciali o consequenziali, derivanti da:',
            text_en: 'To the maximum extent permitted by Italian law, DR7 Empire\'s liability is limited to its role as a brokerage service. We will not be liable for direct, indirect, incidental, special or consequential damages arising from:' },
          { type: 'ul',
            items_it: [
              'Le condizioni, le prestazioni o la legalità di qualsiasi Bene.',
              'Qualsiasi atto o omissione da parte di un Proprietario o del suo personale.',
              'I termini del, o la violazione da parte dell\'utente del, Contratto di Noleggio.',
              'Qualsiasi controversia tra l\'utente e un Proprietario.',
            ],
            items_en: [
              'The condition, performance or legality of any Good.',
              'Any act or omission by an Owner or its staff.',
              'The terms of, or your breach of, the Rental Agreement.',
              'Any dispute between you and an Owner.',
            ] },
          { type: 'p',
            text_it: 'La nostra responsabilità totale per qualsiasi questione derivante dai presenti Termini non supererà la commissione di intermediazione da noi ricevuta per la specifica prenotazione in questione.',
            text_en: 'Our total liability for any matter arising from these Terms shall not exceed the brokerage fee we received for the specific booking in question.' },
        ]},
        { id: 'assistente-ai', heading_it: 'Assistente Virtuale (AI)', heading_en: 'AI Virtual Assistant', blocks: [
          { type: 'p',
            text_it: 'Il sito web di DR7 Empire mette a disposizione un assistente virtuale basato su intelligenza artificiale (di seguito "Assistente AI") a scopo puramente informativo e orientativo.',
            text_en: 'The DR7 Empire website provides an AI-based virtual assistant ("AI Assistant") for purely informational and orientation purposes.' },
          { type: 'p-bold', text_it: 'L\'utente prende atto e accetta che:', text_en: 'You acknowledge and accept that:' },
          { type: 'ul',
            items_it: [
              'L\'Assistente AI è un sistema automatizzato che può generare risposte imprecise, incomplete o errate, inclusi prezzi, disponibilità e specifiche tecniche dei veicoli.',
              '**Le informazioni fornite dall\'Assistente AI, inclusi prezzi e preventivi, non sono in alcun modo vincolanti** e non costituiscono un\'offerta contrattuale ai sensi degli artt. 1326 e seguenti del Codice Civile italiano.',
              '**L\'unico prezzo vincolante è quello visualizzato e confermato nella pagina di prenotazione** al momento della finalizzazione dell\'ordine.',
              'DR7 Empire declina ogni responsabilità per decisioni prese dall\'utente sulla base delle informazioni fornite dall\'Assistente AI.',
              'L\'utente è invitato a verificare sempre le informazioni attraverso la pagina di prenotazione ufficiale o contattando direttamente il servizio clienti.',
            ],
            items_en: [
              'The AI Assistant is an automated system that may generate imprecise, incomplete or incorrect answers, including prices, availability and vehicle specs.',
              '**Information provided by the AI Assistant, including prices and quotes, is in no way binding** and does not constitute a contractual offer under Articles 1326 et seq. of the Italian Civil Code.',
              '**The only binding price is the one displayed and confirmed on the booking page** at order finalization.',
              'DR7 Empire disclaims all liability for decisions made based on information provided by the AI Assistant.',
              'You are invited to always verify information through the official booking page or by contacting customer service directly.',
            ] },
        ]},
        { id: 'legge', heading_it: 'Legge Applicabile e Foro Competente', heading_en: 'Governing Law and Jurisdiction', blocks: [
          { type: 'p',
            text_it: 'I presenti Termini e l\'utilizzo dei Servizi sono regolati e interpretati in conformità con le leggi italiane. L\'utente accetta irrevocabilmente che il Tribunale di Cagliari, Italia, avrà giurisdizione esclusiva per risolvere qualsiasi controversia o reclamo derivante da o in connessione con il presente accordo o il suo oggetto.',
            text_en: 'These Terms and use of the Services are governed by and interpreted in accordance with Italian law. You irrevocably agree that the Court of Cagliari, Italy, shall have exclusive jurisdiction to resolve any dispute or claim arising out of or in connection with this agreement or its subject matter.' },
        ]},
        { id: 'modifiche', heading_it: 'Modifiche ai Termini e ai Servizi', heading_en: 'Changes to the Terms and Services', blocks: [
          { type: 'p',
            text_it: 'Ci riserviamo il diritto di modificare i presenti Termini in qualsiasi momento. Forniremo avviso di eventuali modifiche sostanziali pubblicando i nuovi Termini sulla nostra piattaforma. L\'uso continuato dei Servizi dopo tali modifiche costituisce accettazione dei nuovi Termini.',
            text_en: 'We reserve the right to modify these Terms at any time. We will provide notice of any material changes by publishing the new Terms on our platform. Continued use of the Services after such changes constitutes acceptance of the new Terms.' },
        ]},
        { id: 'policy-operativa', heading_it: 'Policy Operativa – Tempi di Servizio e Consegna', heading_en: 'Operational Policy – Service Times and Delivery', blocks: [
          { type: 'p',
            text_it: 'I tempi indicati per i servizi (lavaggio, trattamenti, check-in, check-out e consegne veicoli) sono da intendersi come tempi stimati e indicativi, calcolati su condizioni operative standard.',
            text_en: 'Times indicated for services (washing, treatments, check-in, check-out and vehicle deliveries) are estimated and indicative, calculated on standard operational conditions.' },
          { type: 'p', text_it: 'La durata effettiva del servizio può variare in base a:', text_en: 'Actual service duration may vary based on:' },
          { type: 'ul',
            items_it: ['Stato del veicolo', 'Livello di sporco o complessità dell\'intervento', 'Verifiche tecniche e controlli qualitativi', 'Flussi operativi interni', 'Eventuali ritardi logistici non prevedibili'],
            items_en: ['Vehicle condition', 'Dirt level or intervention complexity', 'Technical checks and quality controls', 'Internal operational flows', 'Any unforeseeable logistical delays'] },
          { type: 'p-bold',
            text_it: 'L\'orario di prenotazione o consegna rappresenta una fascia operativa programmata e non un orario tassativo di inizio o rilascio immediato del veicolo. Eventuali variazioni contenute entro una normale tolleranza tecnica e organizzativa non costituiscono inadempimento contrattuale né danno diritto a riduzioni o rimborsi.',
            text_en: 'The booking or delivery time represents a scheduled operational window and not a strict start or immediate release time for the vehicle. Variations within normal technical and organizational tolerance do not constitute a contractual breach and do not entitle the customer to reductions or refunds.' },
          { type: 'p',
            text_it: 'L\'azienda si impegna comunque a garantire la massima puntualità compatibilmente con gli standard qualitativi e di sicurezza previsti.',
            text_en: 'The company nonetheless undertakes to ensure maximum punctuality compatible with the quality and safety standards required.' },
        ]},
        { id: 'contatto', heading_it: 'Informazioni di Contatto', heading_en: 'Contact Information', blocks: [
          { type: 'p',
            text_it: 'Per qualsiasi domanda o comunicazione legale riguardante i presenti Termini, si prega di contattare il nostro ufficio legale all\'indirizzo: [info@dr7.app](mailto:info@dr7.app).',
            text_en: 'For any questions or legal communications regarding these Terms, please contact our legal office at: [info@dr7.app](mailto:info@dr7.app).' },
        ]},
      ],
      outro_blocks: [],
    },
  ],
};
