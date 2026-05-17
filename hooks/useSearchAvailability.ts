/**
 * useSearchAvailability — Batch check availability + calculate prices
 * for all vehicles matching search criteria.
 */
import { useState, useCallback } from 'react'
import type { RentalItem } from '../types'
import { calculateMultiDayPrice } from '../utils/multiDayPricing'
import { fetchWithTimeout } from '../utils/fetchWithTimeout'
import type { SearchParams } from '../components/ui/RentalSearchBar'
import { useCentralinaProOverlay } from './useCentralinaProConfig'

export interface VehicleSearchResult {
  vehicleId: string
  available: boolean
  totalPrice: number
  dailyRate: number
  days: number
  vehicleType: string
  // Categoria DB grezza (es. 'hypercar', 'supercar_elite', ecc.). Usata
  // dai chip filtro nei risultati per raggruppare per categoria reale,
  // indipendentemente dal vehicleType (che invece guida la pricing).
  categoryId: string
}

// Classify vehicle type from item name/id (same logic as CarBookingWizard)
function classifyVehicle(item: RentalItem, categoryContext?: string): string {
  if (categoryContext === 'urban-cars') return 'UTILITARIA'
  if (categoryContext === 'corporate-fleet') {
    const name = (item.name || '').toLowerCase()
    if (name.includes('ducato') || name.includes('furgone')) return 'FURGONE'
    if (name.includes('vito') || name.includes('v class') || name.includes('v-class') || name.includes('classe v')) return 'V_CLASS'
    return 'UTILITARIA'
  }
  const name = (item.name || '').toLowerCase()
  if (name.includes('ducato') || name.includes('furgone')) return 'FURGONE'
  if (name.includes('vito') || name.includes('v class') || name.includes('v-class')) return 'V_CLASS'
  if (name.includes('panda') || name.includes('clio') || name.includes('500') || name.includes('polo') || name.includes('208')) return 'UTILITARIA'
  return 'SUPERCAR'
}

export function useSearchAvailability(categoryContext?: string) {
  const [results, setResults] = useState<Map<string, VehicleSearchResult>>(new Map())
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const { overlay: proOverlay, snapshot: proSnapshot } = useCentralinaProOverlay()

  const search = useCallback(async (vehicles: RentalItem[], params: SearchParams) => {
    setIsSearching(true)
    setHasSearched(true)

    const pickupISO = `${params.pickupDate}T${params.pickupTime}:00`
    const returnISO = `${params.returnDate}T${params.returnTime}:00`

    // Calculate rental days
    const pickupDate = new Date(pickupISO)
    const returnDate = new Date(returnISO)
    const diffMs = returnDate.getTime() - pickupDate.getTime()
    const daysDiff = (new Date(params.returnDate).getTime() - new Date(params.pickupDate).getTime()) / (1000 * 60 * 60 * 24)
    const days = isNaN(daysDiff) ? 1 : Math.max(1, Math.round(daysDiff))

    const newResults = new Map<string, VehicleSearchResult>()

    // Batch check availability for all vehicles in parallel
    const checks = vehicles.map(async (item) => {
      const vehicleType = classifyVehicle(item, categoryContext)
      const dailyRate = item.pricePerDay?.eur || 0
      // Check Centralina Pro per-vehicle override first — if set, it wins over any multi-day table.
      const rawVehicleId = (item as any).vehicleIds?.[0] || (item.id ? item.id.replace('car-', '') : '')
      const perVehiclePrices = (proSnapshot as any)?.prezzoDinamico?.dynamic?.base_prices || {}
      const rawOverride = perVehiclePrices[rawVehicleId]
      const overridePrice = typeof rawOverride === 'number' ? rawOverride
        : typeof rawOverride === 'string' ? parseFloat(rawOverride) : NaN
      const totalPrice = (!isNaN(overridePrice) && overridePrice > 0)
        ? days * overridePrice
        : calculateMultiDayPrice(vehicleType, days, dailyRate, undefined, proOverlay?.rentalDayRates ?? null)

      // Get vehicle IDs for availability check
      const vehicleIds = (item as any).vehicleIds || (item.id ? [item.id.replace('car-', '')] : [])
      const vehicleName = item.name

      // 2026-05-17 BUG FIX: failed-CLOSED. Prima `available = true` per
      // default e il catch block lasciava `available = true` su errore.
      // Risultato: function 500 / timeout / network → auto disponibili
      // tutte. Ora: failed-CLOSED. Se la check non e' riuscita o ha
      // restituito errore, l'auto NON e' mostrata.
      let available = false
      let checkFailed = false

      try {
        // Use checkVehicleAvailability Netlify function
        const res = await fetchWithTimeout('/.netlify/functions/checkVehicleAvailability', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vehicleName,
            pickupDate: pickupISO,
            dropoffDate: returnISO,
            vehicleIds,
          }),
        }, 8000)

        if (res.ok) {
          const data = await res.json()
          // If conflicts array is non-empty, vehicle is NOT available
          available = !data.conflicts || data.conflicts.length === 0
          // 2026-05-17: NON facciamo piu' available=true quando arriva
          // availableFrom. Se c'e' un conflict, l'auto e' OCCUPATA per la
          // finestra che il cliente sta cercando — il fatto che diventi
          // libera lo stesso giorno alle 15:00 non significa che sia
          // bookabile per 14:00-11:00-del-giorno-dopo. Conservavamo solo
          // availableFrom come metadato per il wizard, NON per riabilitare.
          if (!available && data.availableFrom) {
            ;(item as any)._availableFrom = data.availableFrom
            console.log(`[availability] ${vehicleName}: conflict (availableFrom=${data.availableFrom}, ${data.conflicts?.length} conflicts) — HIDDEN`)
          } else if (!available) {
            console.log(`[availability] ${vehicleName}: conflict (${data.conflicts?.length} conflicts) — HIDDEN`)
          } else {
            console.log(`[availability] ${vehicleName}: OK`)
          }
        } else {
          console.warn(`[availability] ${vehicleName}: HTTP ${res.status} — failed-CLOSED, HIDDEN`)
          checkFailed = true
        }
      } catch (e) {
        console.warn(`[availability] ${vehicleName}: fetch failed — failed-CLOSED, HIDDEN`, e)
        checkFailed = true
      }

      // Card shows BASE price only (per-vehicle Centralina Pro × days).
      // Coefficients and min/max clamping are applied later in CarBookingWizard.
      const availableFrom = (item as any)._availableFrom || null
      // categoryId per i chip filtro: usa la categoria DB del veicolo
      // (qualunque id Centralina Pro). Fallback al vehicleType se la
      // categoria DB e' assente, cosi' i chip continuano a funzionare
      // anche per veicoli legacy senza category.
      const categoryId = (item.category as string | null | undefined) || vehicleType
      newResults.set(item.id, {
        vehicleId: item.id,
        // Failed-CLOSED: se la check e' fallita, ritorniamo false. Altrimenti
        // solo true se il server ha confermato available=true E senza conflicts.
        available: !checkFailed && available,
        availableFrom,
        totalPrice: Math.round(totalPrice * 100) / 100,
        dailyRate: Math.round((totalPrice / days) * 100) / 100,
        days,
        vehicleType,
        categoryId,
      })
    })

    await Promise.allSettled(checks)
    setResults(newResults)
    setIsSearching(false)
  }, [categoryContext])

  return { results, isSearching, hasSearched, search }
}
