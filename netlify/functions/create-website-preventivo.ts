import { Handler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'
import { getCorsOrigin } from './utils/cors'
import { getInsuranceNameById } from './utils/centralinaProLookups'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const handler: Handler = async (event) => {
  const origin = getCorsOrigin(event.headers.origin || event.headers.Origin)
  const headers = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  // Auth: extract user from JWT
  const authHeader = event.headers.authorization || event.headers.Authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Non autenticato' }) }
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)

  if (authError || !user) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Sessione non valida' }) }
  }

  try {
    const body = JSON.parse(event.body || '{}')

    // Look up customer in customers_extended by auth user_id
    const { data: customer } = await supabase
      .from('customers_extended')
      .select('id, nome, cognome, email, telefono, tipo_cliente, denominazione')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

    const customerName = customer
      ? (customer.tipo_cliente === 'azienda' ? customer.denominazione : `${customer.nome || ''} ${customer.cognome || ''}`.trim())
      : (body.customer_name || user.email || '')
    const customerPhone = customer?.telefono || body.customer_phone || ''
    const customerId = customer?.id || null

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const isNoCauzione = !!body.no_cauzione_request

    const preventivo = {
      vehicle_id: body.vehicle_id,
      vehicle_name: body.vehicle_name || '',
      vehicle_plate: body.vehicle_plate || '',
      vehicle_category: body.vehicle_category || 'exotic',
      pickup_date: body.pickup_date,
      dropoff_date: body.dropoff_date,
      rental_days: body.rental_days || 1,
      pickup_location: body.pickup_location || 'dr7_office',
      dropoff_location: body.dropoff_location || 'dr7_office',
      base_daily_rate: body.base_daily_rate || 0,
      insurance_option: body.insurance_option || '',
      insurance_daily_price: body.insurance_daily_price || 0,
      insurance_total: body.insurance_total || 0,
      km_limit: body.km_limit || 0,
      unlimited_km: body.unlimited_km || false,
      km_overage_fee: body.km_overage_fee || 1.80,
      unlimited_km_daily: body.unlimited_km_daily || 0,
      unlimited_km_total: body.unlimited_km_total || 0,
      second_driver_daily: body.second_driver_daily || 0,
      second_driver_total: body.second_driver_total || 0,
      no_cauzione_daily: body.no_cauzione_daily || 0,
      no_cauzione_total: body.no_cauzione_total || 0,
      lavaggio_fee: body.lavaggio_fee || 0,
      delivery_fee: body.delivery_fee || 0,
      pickup_fee: body.pickup_fee || 0,
      subtotal: body.subtotal || 0,
      sconto: body.sconto || 0,
      sconto_note: body.sconto_note || '',
      total_final: body.total_final || 0,
      deposit_amount: body.deposit_amount || 0,
      driver_tier: body.driver_tier || 'TIER_2',
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_id: customerId,
      extras_detail: body.extras_detail || {},
      pricing_trace: body.pricing_trace || null,
      notes: body.notes || '',
      status: 'bozza',
      source: isNoCauzione ? 'website_no_cauzione' : 'website',
      created_by: user.id,
      expires_at: expiresAt.toISOString(),
      created_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('preventivi')
      .insert(preventivo)
      .select()
      .single()

    if (error) {
      console.error('[create-website-preventivo] Insert error:', error)
      return { statusCode: 500, headers, body: JSON.stringify({ error: error.message }) }
    }

    // Send WhatsApp notification to admin
    try {
      const pickupDate = new Date(body.pickup_date).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Rome' })
      const dropoffDate = new Date(body.dropoff_date).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Rome' })
      const baseUrl = process.env.URL || 'https://dr7empire.com'

      const title = isNoCauzione ? '*RICHIESTA NO CAUZIONE*' : '*NUOVO PREVENTIVO DAL SITO*'
      const cauzioneLine = isNoCauzione
        ? `*Cauzione:* Senza cauzione (+€${Number(preventivo.no_cauzione_daily).toFixed(2)}/gg = €${Number(preventivo.no_cauzione_total).toFixed(2)})`
        : `*Cauzione:* €${Number(preventivo.deposit_amount).toFixed(2)}`

      // Resolve insurance display name from Centralina Pro (no raw IDs in the message).
      const insuranceLabel = await getInsuranceNameById(preventivo.insurance_option)

      const msg = `${title}\n\n`
        + `*Cliente:* ${preventivo.customer_name}\n`
        + `*Tel:* ${preventivo.customer_phone || 'N/A'}\n`
        + `*Veicolo:* ${preventivo.vehicle_name}\n`
        + `*Date:* ${pickupDate} - ${dropoffDate} (${preventivo.rental_days}gg)\n`
        + `*Totale:* €${Number(preventivo.total_final).toFixed(2)}\n`
        + `*Assicurazione:* ${insuranceLabel}\n`
        + `*KM:* ${preventivo.unlimited_km ? 'Illimitati' : (preventivo.km_limit + ' km')}\n`
        + `${cauzioneLine}\n\n`
        + `Gestisci dal pannello admin > Preventivi`

      // Notify default admin
      await fetch(`${baseUrl}/.netlify/functions/send-whatsapp-notification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customMessage: msg }),
      }).catch(() => {})

      // For no-cauzioni requests, also notify boss directly
      if (isNoCauzione) {
        const bossMsg = `${title}\n\n`
          + `*Cliente:* ${preventivo.customer_name}\n`
          + `*Telefono:* ${preventivo.customer_phone || 'N/A'}\n`
          + `*Veicolo:* ${preventivo.vehicle_name}\n`
          + `*Periodo:* ${pickupDate} → ${dropoffDate}\n`
          + `*Totale:* €${Number(preventivo.total_final).toFixed(2)}\n\n`
          + `Approvare o rifiutare dall'admin > Preventivi.`
        await fetch(`${baseUrl}/.netlify/functions/send-whatsapp-notification`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customPhone: '393472817258', customMessage: bossMsg }),
        }).catch(() => {})
      }

      // Send confirmation WhatsApp to CUSTOMER for no-cauzione requests
      if (isNoCauzione && preventivo.customer_phone) {
        const firstName = (preventivo.customer_name || 'Cliente').split(' ')[0]
        const customerConfirmMsg = `Gentile ${firstName},\n\n`
          + `abbiamo ricevuto la sua richiesta per la formula senza cauzione relativa alla prenotazione appena effettuata.\n\n`
          + `Il nostro team sta effettuando una verifica rapida per confermarne l'idoneità.\n\n`
          + `Riceverà a breve un aggiornamento con l'esito e, in caso di approvazione, il link di pagamento per completare la prenotazione.\n\n`
          + `Restiamo a disposizione.\n\n`
          + `Cordiali Saluti,\nDR7 Empire`
        await fetch(`${baseUrl}/.netlify/functions/send-whatsapp-notification`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customPhone: preventivo.customer_phone, customMessage: customerConfirmMsg }),
        }).catch(() => {})
      }
    } catch (whatsappErr) {
      console.warn('[create-website-preventivo] WhatsApp notification failed:', whatsappErr)
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, preventivo: data }),
    }
  } catch (err: any) {
    console.error('[create-website-preventivo] Error:', err)
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message || 'Errore interno' }) }
  }
}

export { handler }
