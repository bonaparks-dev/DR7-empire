import { Handler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'
import { getCorsOrigin } from './utils/cors'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

/**
 * Centralina Unica — Serves rental config to the website.
 * Reads from rental_extras_config Supabase table (same config managed by admin).
 * Cache: 30s CDN + 5min stale-while-revalidate for resilience.
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

    const { data, error } = await supabase
      .from('rental_extras_config')
      .select('config, updated_at')
      .limit(1)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return { statusCode: 200, headers, body: JSON.stringify({ config: null }) }
      }
      throw error
    }

    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Cache-Control': 'public, max-age=30, stale-while-revalidate=300',
      },
      body: JSON.stringify({ config: data.config, updated_at: data.updated_at }),
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
