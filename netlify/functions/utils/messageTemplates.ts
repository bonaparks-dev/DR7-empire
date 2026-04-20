/**
 * Shared utility: loads message templates from system_messages Supabase table.
 *
 * IMPORTANT: NO HARDCODED FALLBACKS.
 * - If a template does not exist in system_messages → returns null.
 * - If a template is disabled → returns null.
 * - Callers MUST check for null and skip sending.
 *
 * Variables in templates use {variable_name} syntax.
 *
 * Kept in sync with the admin repo's version.
 */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

interface MessageTemplate {
  message_key: string
  message_body: string
  is_enabled: boolean
  include_header: boolean
}

/**
 * Old-key → Pro-key router. Messaggi di Sistema Pro is the single source.
 * Admin variants map to the SAME pro_* slot as the customer variant.
 */
const OLD_TO_PRO: Record<string, string> = {
  rental_new_customer: 'pro_conferma_noleggio',
  rental_new: 'pro_conferma_noleggio',
  rental_new_admin: 'pro_conferma_noleggio',
  rental_modified: 'pro_promemoria_appuntamento',
  rental_da_saldare_customer: 'pro_conferma_pagamento',
  deposit_return_iban: 'pro_richiesta_iban',

  carwash_new_customer: 'pro_conferma_lavaggio',
  carwash_new: 'pro_conferma_lavaggio',
  carwash_new_admin: 'pro_conferma_lavaggio',
  carwash_modified: 'pro_promemoria_pagamento',

  signature_request_link: 'pro_conferma_contratto_firmato',
  signature_reminder_whatsapp: 'pro_conferma_preventivo',
  signature_otp_whatsapp: 'pro_promemoria_pickup',

  payment_link_customer: 'pro_promemoria_dropoff',
  booking_cancelled_whatsapp: 'pro_richiesta_pagamento',

  preventivo_whatsapp: 'pro_promemoria_checkin',
  admin_new_website_quote: 'pro_richiesta_otp',
  admin_no_cauzione_request: 'pro_richiesta_firma',

  review_request_whatsapp: 'pro_promemoria_firma',
  birthday_message: 'pro_marketing_compleanno',
  wallet_bonus_credit: 'pro_richiesta_documenti',

  // Cancellation initiated by the customer from the website "My Bookings" page.
  // Body lives in a pro_custom_* row created by the admin via "+ Nuovo Messaggio".
  website_booking_cancelled_customer: 'pro_custom_prenotazione_annullata_da_sito_1776503923221',
}

export interface RenderContext {
  vehiclePlate?: string | null
}

export async function resolveKeyForContext(key: string, _context?: RenderContext): Promise<string | null> {
  void _context
  if (key.startsWith('pro_')) return key
  if (key === 'message_wrapper_header' || key === 'message_wrapper_footer') return key

  const proKey = OLD_TO_PRO[key]
  if (!proKey) return null

  const templates = await loadAllTemplates()
  const pro = templates.find(t => t.message_key === proKey)
  if (!pro || !pro.is_enabled || !pro.message_body) return null
  return proKey
}

// No cache — admin edits to Pro templates must take effect on the very next
// message send. Kept in sync with the admin repo's version.
async function loadAllTemplates(): Promise<MessageTemplate[]> {
  try {
    if (!supabaseUrl || !supabaseKey) return []
    const supabase = createClient(supabaseUrl, supabaseKey)
    const { data, error } = await supabase
      .from('system_messages')
      .select('message_key, message_body, is_enabled, include_header')
    if (error) throw error
    return data || []
  } catch {
    return []
  }
}

export async function getMessageTemplate(
  key: string,
  variables: Record<string, string> = {},
  _fallback?: string,
  context?: RenderContext
): Promise<string | null> {
  void _fallback
  const effectiveKey = await resolveKeyForContext(key, context)
  if (effectiveKey === null) return null
  const templates = await loadAllTemplates()
  const tpl = templates.find(t => t.message_key === effectiveKey)

  if (!tpl) return null
  if (!tpl.is_enabled) return null
  if (!tpl.message_body) return null

  let body = tpl.message_body

  for (const [k, v] of Object.entries(variables)) {
    body = body.replace(new RegExp(`\\{${k}\\}`, 'g'), v ?? '')
  }

  // Pro wrappers only — NO hardcoded fallback text
  if (tpl.include_header !== false) {
    const headerTpl = templates.find(t => t.message_key === 'pro_wrapper_header' && t.is_enabled !== false)
    const footerTpl = templates.find(t => t.message_key === 'pro_wrapper_footer' && t.is_enabled !== false)
    if (headerTpl?.message_body) body = headerTpl.message_body + '\n\n' + body
    if (footerTpl?.message_body) body = body + '\n\n' + footerTpl.message_body
  }

  return body
}

export function invalidateTemplateCache() {
  cache = null
}

export async function renderTemplate(
  key: string,
  variables: Record<string, string>,
  _fallback?: string,
  context?: RenderContext
): Promise<string | null> {
  void _fallback
  return getMessageTemplate(key, variables, undefined, context)
}
