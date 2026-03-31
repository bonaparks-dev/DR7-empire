/**
 * calculate-delivery-distance
 * ============================
 * Calculates driving distance from DR7 office (Viale Marconi 229, Cagliari)
 * to customer delivery address using Google Distance Matrix API.
 *
 * Returns distance in km and delivery fee (€3/km × round-trip distance).
 * Round-trip = distance × 2 (delivery + return trip for the driver).
 */

import { Handler } from '@netlify/functions'
import { getCorsOrigin } from './utils/cors'

const DR7_OFFICE = 'Viale Marconi 229, 09131 Cagliari CA, Italy'
const DELIVERY_PRICE_PER_KM = 3 // €3/km

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
    const { address } = JSON.parse(event.body || '{}')

    if (!address || typeof address !== 'string' || address.trim().length < 3) {
      return {
        statusCode: 400, headers,
        body: JSON.stringify({ error: 'Indirizzo non valido' }),
      }
    }

    const apiKey = process.env.VITE_GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      return {
        statusCode: 500, headers,
        body: JSON.stringify({ error: 'Google Maps API key not configured' }),
      }
    }

    // Call Google Distance Matrix API
    const origin = encodeURIComponent(DR7_OFFICE)
    const destination = encodeURIComponent(address.trim())
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${destination}&mode=driving&language=it&key=${apiKey}`

    const response = await fetch(url)
    const data = await response.json()

    if (data.status !== 'OK') {
      return {
        statusCode: 400, headers,
        body: JSON.stringify({ error: 'Impossibile calcolare la distanza. Verifica l\'indirizzo.' }),
      }
    }

    const element = data.rows?.[0]?.elements?.[0]
    if (!element || element.status !== 'OK') {
      return {
        statusCode: 400, headers,
        body: JSON.stringify({ error: 'Indirizzo non raggiungibile. Verifica l\'indirizzo inserito.' }),
      }
    }

    const distanceMeters = element.distance.value // meters one-way
    const distanceKm = Math.ceil(distanceMeters / 1000) // round up to nearest km
    const roundTripKm = distanceKm * 2 // delivery + driver return
    const deliveryFee = roundTripKm * DELIVERY_PRICE_PER_KM
    const durationText = element.duration.text // e.g. "1 ora 30 min"

    return {
      statusCode: 200, headers,
      body: JSON.stringify({
        distanceKm,
        roundTripKm,
        deliveryFee,
        durationText,
        destinationAddress: data.destination_addresses?.[0] || address,
        originAddress: data.origin_addresses?.[0] || DR7_OFFICE,
        pricePerKm: DELIVERY_PRICE_PER_KM,
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
