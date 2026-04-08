/**
 * calculate-delivery-distance
 * ============================
 * Calculates driving distance from DR7 office (Viale Marconi 229, Cagliari)
 * to customer delivery address using Nominatim (geocoding) + OSRM (routing).
 * Free, no API key required.
 *
 * Reads price_per_km from Centralina (rental_extras_config in Supabase).
 * Fallback: €3/km if Centralina unavailable.
 *
 * Accepts either { address } (string) or { lat, lon } (coordinates).
 */

import { Handler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'
import { getCorsOrigin } from './utils/cors'

const DR7_OFFICE_LAT = 39.2238
const DR7_OFFICE_LON = 9.1217
const DEFAULT_PRICE_PER_KM = 3

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': getCorsOrigin(event.headers['origin']),
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  try {
    const { address, lat, lon } = JSON.parse(event.body || '{}')

    // Read price_per_km from Centralina
    let pricePerKm = DEFAULT_PRICE_PER_KM
    try {
      const supabaseUrl = process.env.VITE_SUPABASE_URL || ''
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey)
        const { data } = await supabase
          .from('rental_extras_config')
          .select('config')
          .limit(1)
          .single()
        if (data?.config?.delivery?.price_per_km != null) {
          pricePerKm = data.config.delivery.price_per_km
        }
      }
    } catch {
      // Fallback to default
    }

    let destLat: number
    let destLon: number

    if (typeof lat === 'number' && typeof lon === 'number') {
      destLat = lat
      destLon = lon
    } else if (address && typeof address === 'string' && address.trim().length >= 3) {
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address.trim())}&format=json&limit=1&countrycodes=it`,
        { headers: { 'User-Agent': 'DR7Empire/1.0', 'Accept-Language': 'it' } }
      )
      const geoData = await geoRes.json()
      if (!geoData || geoData.length === 0) {
        return {
          statusCode: 400, headers,
          body: JSON.stringify({ error: 'Indirizzo non trovato. Verifica l\'indirizzo inserito.' }),
        }
      }
      destLat = parseFloat(geoData[0].lat)
      destLon = parseFloat(geoData[0].lon)
    } else {
      return {
        statusCode: 400, headers,
        body: JSON.stringify({ error: 'Indirizzo o coordinate non validi' }),
      }
    }

    // Calculate driving distance via OSRM
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${DR7_OFFICE_LON},${DR7_OFFICE_LAT};${destLon},${destLat}?overview=false`
    const routeRes = await fetch(osrmUrl)
    const routeData = await routeRes.json()

    if (routeData.code !== 'Ok' || !routeData.routes || routeData.routes.length === 0) {
      return {
        statusCode: 400, headers,
        body: JSON.stringify({ error: 'Impossibile calcolare il percorso. Verifica l\'indirizzo.' }),
      }
    }

    const route = routeData.routes[0]
    const distanceMeters = route.distance
    const durationSeconds = route.duration

    const distanceKm = Math.ceil(distanceMeters / 1000)
    const roundTripKm = distanceKm // one-way per direction (no ×2)
    const deliveryFee = distanceKm * pricePerKm

    const hours = Math.floor(durationSeconds / 3600)
    const minutes = Math.round((durationSeconds % 3600) / 60)
    const durationText = hours > 0 ? `${hours} ora${hours > 1 ? 'e' : ''} ${minutes} min` : `${minutes} min`

    return {
      statusCode: 200, headers,
      body: JSON.stringify({
        distanceKm,
        roundTripKm,
        deliveryFee,
        durationText,
        pricePerKm,
      }),
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return {
      statusCode: 500, headers,
      body: JSON.stringify({ error: message }),
    }
  }
}
