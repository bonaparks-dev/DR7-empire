/**
 * Config Overlay — Reads pricing from Centralina config and builds
 * override values for CarBookingWizard constants.
 * Falls back to hardcoded defaults from constants.ts if config is missing.
 */

import type { RentalConfig } from '../types/rentalConfig'
import type { InsuranceTierOption, DepositOption, ExperienceService } from '../types'

export interface RentalDayRates {
  exotic: {
    resident: Record<string, number>
    non_resident: Record<string, number>
  }
  urban: { flat: Record<string, number>; extrapolation: string }
  furgone: { flat: Record<string, number> }
}

export interface KmIncludedConfig {
  table: Record<string, number>
  extra_per_day: number
}

export interface WebsiteConfigOverlay {
  insuranceTier1: InsuranceTierOption[]
  insuranceTier2: InsuranceTierOption[]
  tierPricing: {
    TIER_1: { unlimitedKmPerDay: number; secondDriverPerDay: number; lavaggio: number }
    TIER_2: { unlimitedKmPerDay: number; secondDriverPerDay: number; lavaggio: number }
  }
  noDepositSurchargePerDay: number
  deliveryPricePerKm: number
  experienceServices: ExperienceService[]
  dr7Flex: { dailyPrice: number; refundPercent: number; tierRestriction: string }
  depositOptions: {
    TIER_1_RESIDENT: DepositOption[]
    TIER_2_RESIDENT: DepositOption[]
    TIER_1_NON_RESIDENT: DepositOption[]
    TIER_2_NON_RESIDENT: DepositOption[]
  }
  // Dynamic rental day rates from admin Centralina
  rentalDayRates: RentalDayRates | null
  // Dynamic km included config from admin Centralina
  kmIncluded: KmIncludedConfig | null
}

/** Build overlay from Centralina config. Returns null if config is not loaded yet. */
export function buildWebsiteConfigOverlay(config: RentalConfig | null): WebsiteConfigOverlay | null {
  if (!config || !config.insurance) return null

  const exoticT1 = (config.insurance?.exotic as Record<string, { id: string; name: string; daily_price: number; deductible?: string; mandatory_deposit?: number; coverage?: string }[]>)?.TIER_1
  const exoticT2 = (config.insurance?.exotic as Record<string, { id: string; name: string; daily_price: number; deductible?: string; mandatory_deposit?: number; coverage?: string }[]>)?.TIER_2

  const COVERAGE = 'RCA - Furto (solo in caso di restituzione chiave, altrimenti 100% del valore del veicolo) - Atti vandalici - Agenti atmosferici - Incendio - Danni & distruzione totale'

  const toInsOpts = (arr: { id: string; name: string; daily_price: number; deductible?: string; mandatory_deposit?: number; coverage?: string }[] | undefined): InsuranceTierOption[] | null => {
    if (!arr || arr.length === 0) return null
    return arr.map(o => ({
      id: o.id,
      name: o.name,
      dailyPrice: o.daily_price,
      deductible: o.deductible || '',
      mandatoryDeposit: o.mandatory_deposit,
      coverage: o.coverage || COVERAGE,
    }))
  }

  const toDepositOpts = (arr: { id: string; label: string; amount: number; surcharge_per_day?: number; requires_vehicle_2020?: boolean; description?: string }[] | undefined): DepositOption[] => {
    if (!arr) return []
    return arr.map(o => ({
      id: o.id,
      label: o.label,
      amount: o.amount,
      surchargePerDay: o.surcharge_per_day,
      requiresVehicle2020: o.requires_vehicle_2020,
      description: o.description || '',
    }))
  }

  // Build dynamic rental day rates from config
  let rentalDayRates: RentalDayRates | null = null
  if (config.rental_day_rates) {
    const exotic = config.rental_day_rates.exotic
    const urban = config.rental_day_rates.urban
    const furgone = config.rental_day_rates.furgone
    if (exotic?.resident && exotic?.non_resident) {
      rentalDayRates = {
        exotic: {
          resident: exotic.resident,
          non_resident: exotic.non_resident,
        },
        urban: {
          flat: urban?.flat || {},
          extrapolation: urban?.extrapolation || 'interpolate_7_30',
        },
        furgone: {
          flat: furgone?.flat || {},
        },
      }
    }
  }

  // Build km included config from admin
  let kmIncluded: KmIncludedConfig | null = null
  const globalKm = (config.km_included as Record<string, { table?: Record<string, number>; extra_per_day?: number }>)?._global
  if (globalKm?.table && typeof globalKm.extra_per_day === 'number') {
    kmIncluded = {
      table: globalKm.table,
      extra_per_day: globalKm.extra_per_day,
    }
  }

  return {
    insuranceTier1: toInsOpts(exoticT1) || [],
    insuranceTier2: toInsOpts(exoticT2) || [],
    tierPricing: {
      TIER_1: {
        unlimitedKmPerDay: config.unlimited_km?.exotic?.TIER_1?.per_day ?? 289,
        secondDriverPerDay: config.second_driver?.TIER_1 ?? 20,
        lavaggio: config.lavaggio?.fee ?? 9.90,
      },
      TIER_2: {
        unlimitedKmPerDay: config.unlimited_km?.exotic?.TIER_2?.per_day ?? 189,
        secondDriverPerDay: config.second_driver?.TIER_2 ?? 10,
        lavaggio: config.lavaggio?.fee ?? 9.90,
      },
    },
    noDepositSurchargePerDay: config.no_cauzione_surcharge?.per_day ?? 49,
    deliveryPricePerKm: config.delivery?.price_per_km ?? 3,
    experienceServices: (config.experience_services || [])
      .filter(s => s.is_active)
      .map(s => ({
        id: s.id,
        name: s.name,
        price: s.price,
        unit: s.unit as 'per_day' | 'per_hour' | 'per_item' | 'flat',
        tierOnly: (s.tier_only as 'TIER_1' | 'TIER_2' | undefined) || undefined,
        description: s.description || '',
      })),
    dr7Flex: {
      dailyPrice: config.dr7_flex?.daily_price ?? 19.90,
      refundPercent: config.dr7_flex?.refund_percent ?? 90,
      tierRestriction: config.dr7_flex?.tier_restriction || 'TIER_2',
    },
    depositOptions: {
      TIER_1_RESIDENT: toDepositOpts(config.deposits?.TIER_1_RESIDENT),
      TIER_2_RESIDENT: toDepositOpts(config.deposits?.TIER_2_RESIDENT),
      TIER_1_NON_RESIDENT: toDepositOpts(config.deposits?.TIER_1_NON_RESIDENT),
      TIER_2_NON_RESIDENT: toDepositOpts(config.deposits?.TIER_2_NON_RESIDENT),
    },
    rentalDayRates,
    kmIncluded,
  }
}
