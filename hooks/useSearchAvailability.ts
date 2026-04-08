/**
 * useSearchAvailability — Batch check availability + calculate prices
 * for all vehicles matching search criteria.
 */
import { useState, useCallback } from 'react'
import type { RentalItem } from '../types'
import { calculateMultiDayPrice } from '../utils/multiDayPricing'
import { fetchWithTimeout } from '../utils/fetchWithTimeout'
import type { SearchParams } from '../components/ui/RentalSearchBar'

export interface VehicleSearchResult {
  vehicleId: string
  available: boolean
  totalPrice: number
  dailyRate: number
  days: number
  vehicleType: string
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
      const totalPrice = calculateMultiDayPrice(vehicleType, days, dailyRate)

      // Get vehicle IDs for availability check
      const vehicleIds = (item as any).vehicleIds || (item.id ? [item.id.replace('car-', '')] : [])
      const vehicleName = item.name

      let available = true

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
        }
      } catch {
        // If availability check fails, assume available (don't block)
        available = true
      }

      // Try dynamic pricing if available
      let dynamicTotal = totalPrice
      if (vehicleIds.length > 0) {
        try {
          const priceRes = await fetchWithTimeout('/.netlify/functions/calculate-dynamic-price', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              vehicle_id: vehicleIds[0],
              pickup_date: pickupISO,
              dropoff_date: returnISO,
            }),
          }, 5000)

          if (priceRes.ok) {
            const priceData = await priceRes.json()
            if (priceData.enabled && priceData.mode === 'auto_apply' && priceData.finalTotalEur) {
              dynamicTotal = priceData.finalTotalEur
            }
          }
        } catch {
          // Fall back to static pricing
        }
      }

      newResults.set(item.id, {
        vehicleId: item.id,
        available,
        totalPrice: Math.round(dynamicTotal),
        dailyRate: Math.round(dynamicTotal / days),
        days,
        vehicleType,
      })
    })

    await Promise.allSettled(checks)
    setResults(newResults)
    setIsSearching(false)
  }, [categoryContext])

  return { results, isSearching, hasSearched, search }
}
