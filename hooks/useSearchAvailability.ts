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

      // 2026-05-17 BUG FIX: failed-CLOSED, MA tolerante a AbortError client-side.
      // Se l'utente naviga via o React fa unmount, fetch viene aborted e
      // non vogliamo nascondere tutte le auto per quello — quello e' un
      // problema di rendering, non un denial del server. Failed-CLOSED
      // resta per veri errori HTTP / network / function-down.
      let available = false
      let checkFailed = false

      try {
        // Use checkVehicleAvailability Netlify function. Timeout 20s — la
        // wide query (±14 giorni) puo' richiedere fino a 15s su Supabase
        // sotto carico; meglio aspettare che fail-CLOSED tutte le auto.
        const res = await fetchWithTimeout('/.netlify/functions/checkVehicleAvailability', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vehicleName,
            pickupDate: pickupISO,
            dropoffDate: returnISO,
            vehicleIds,
          }),
        }, 20000)

        if (res.ok) {
          const data = await res.json()
          // If conflicts array is non-empty, vehicle is NOT available
          available = !data.conflicts || data.conflicts.length === 0
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
        // AbortError = il fetch e' stato cancellato (timeout o unmount component).
        // NON failed-CLOSED in questo caso: assumiamo disponibile cosi'
        // il rendering non sparisce. Il pre-insert check del wizard
        // riprende la verifica al momento della prenotazione effettiva.
        const isAbort = e instanceof Error && (e.name === 'AbortError' || /abort/i.test(e.message))
        if (isAbort) {
          console.warn(`[availability] ${vehicleName}: fetch aborted (client-side, transient) — mostrato comunque, riverifica al checkout`)
          available = true
        } else {
          console.warn(`[availability] ${vehicleName}: fetch failed — failed-CLOSED, HIDDEN`, e)
          checkFailed = true
        }
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
