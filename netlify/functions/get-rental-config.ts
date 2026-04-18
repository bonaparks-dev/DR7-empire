import { Handler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'
import { getCorsOrigin } from './utils/cors'
import { convertProToLegacy } from './utils/convertProConfig'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

/**
 * Centralina Pro — Serves rental config to the website.
 * Reads from centralina_pro_config and converts to legacy format.
 */
const handler: Handler = async (event) => {
  const origin = getCorsOrigin(event.headers.origin || event.headers.Origin)
  const headers = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' }
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Read from Centralina Pro
    const { data: proData } = await supabase
      .from('centralina_pro_config')
      .select('config, updated_at')
      .eq('id', 'main')
      .maybeSingle()

    if (!proData?.config || typeof proData.config !== 'object') {
      return { statusCode: 200, headers, body: JSON.stringify({ config: null }) }
    }

    const converted = convertProToLegacy(proData.config)

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Cache-Control': 'public, max-age=10, stale-while-revalidate=30',
      },
      body: JSON.stringify({ config: converted, updated_at: proData.updated_at }),
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('get-rental-config error:', message)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: message }),
    }
  }
}

export { handler }
