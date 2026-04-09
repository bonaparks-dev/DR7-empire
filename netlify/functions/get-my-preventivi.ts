import { Handler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'
import { getCorsOrigin } from './utils/cors'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const handler: Handler = async (event) => {
  const origin = getCorsOrigin(event.headers.origin || event.headers.Origin)
  const headers = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' }
  }

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
    // Match preventivi by customer phone (last 9 digits) — admin creates them, not the customer
    const userPhone = user.phone?.replace(/[\s\-\+()]/g, '') || ''
    const userEmail = user.email?.toLowerCase().trim() || ''
    const phoneSuffix = userPhone.slice(-9)

    // Also get the customer's phone from customers_extended
    let dbPhone = ''
    if (user.id) {
      const { data: custData } = await supabase
        .from('customers_extended')
        .select('telefono')
        .eq('user_id', user.id)
        .maybeSingle()
      if (custData?.telefono) {
        dbPhone = custData.telefono.replace(/[\s\-\+()]/g, '')
      }
    }

    const searchPhone = dbPhone || phoneSuffix

    if (!searchPhone && !userEmail) {
      return { statusCode: 200, headers, body: JSON.stringify({ preventivi: [] }) }
    }

    // Query: match by phone suffix (most reliable) or by customer_name containing email
    let data: any[] = []
    if (searchPhone) {
      const { data: results, error } = await supabase
        .from('preventivi')
        .select('*')
        .ilike('customer_phone', `%${searchPhone.slice(-9)}%`)
        .order('created_at', { ascending: false })
        .limit(20)
      if (error) throw error
      data = results || []
    }

    // Fallback: if no phone match, try email in customer_name (some preventivi store email there)
    if (data.length === 0 && userEmail) {
      const { data: results } = await supabase
        .from('preventivi')
        .select('*')
        .ilike('customer_name', `%${userEmail}%`)
        .order('created_at', { ascending: false })
        .limit(20)
      data = results || []
    }

    // Auto-expire old preventivi
    const now = new Date()
    const updated = data.map(p => {
      if ((p.status === 'bozza' || p.status === 'inviato') && p.expires_at && new Date(p.expires_at) < now) {
        return { ...p, status: 'scaduto' }
      }
      return p
    })

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ preventivi: updated }),
    }
  } catch (err: any) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message || 'Errore' }) }
  }
}

export { handler }
