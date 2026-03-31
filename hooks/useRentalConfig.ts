/**
 * Centralina Unica — Website hook to load rental config.
 * Fetches from get-rental-config Netlify function (30s CDN cache).
 * Falls back to hardcoded defaults if fetch fails.
 */

import { useState, useEffect } from 'react'
import type { RentalConfig } from '../types/rentalConfig'
import { DEFAULT_RENTAL_CONFIG } from './rentalConfigDefaults'

interface UseRentalConfigResult {
  config: RentalConfig
  loading: boolean
  error: string | null
}

export function useRentalConfig(): UseRentalConfigResult {
  const [config, setConfig] = useState<RentalConfig>(DEFAULT_RENTAL_CONFIG)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchConfig() {
      try {
        const res = await fetch('/.netlify/functions/get-rental-config')
        if (!res.ok) throw new Error(`HTTP ${res.status}`)

        const data = await res.json()
        if (!cancelled && data.config && typeof data.config === 'object') {
          setConfig({ ...DEFAULT_RENTAL_CONFIG, ...data.config } as RentalConfig)
        }
      } catch (err) {
        if (!cancelled) {
          console.warn('[useRentalConfig] Fetch failed, using defaults:', err)
          setError(String(err))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchConfig()
    return () => { cancelled = true }
  }, [])

  return { config, loading, error }
}
