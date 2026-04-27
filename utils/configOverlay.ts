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
    non_resident?: Record<string, number>
  }
  urban: { flat: Record<string, number>; extrapolation: string }
  furgone: { flat: Record<string, number> }
}

export interface KmIncludedConfig {
  table: Record<string, number>
  extra_per_day: number
}

export interface KmPackagePrices {
  supercar50kmPerDay: number
  unlimitedSupercarT1PerDay: number
  unlimitedSupercarT2PerDay: number
  unlimitedFurgonePerDay: number
  unlimitedNccPerDay: number
  unlimitedUrbanPerDay: number
}

export interface WebsiteConfigOverlay {
  insuranceTier1: InsuranceTierOption[]
  insuranceTier2: InsuranceTierOption[]
  urbanInsurance: InsuranceTierOption[]
  utilitaireInsurance: InsuranceTierOption[]
  furgoneInsurance: InsuranceTierOption[]
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
    /** Per-vehicle-category overrides. Key = vehicle DB category
     *  ('exotic' / 'urban' / 'aziendali'). Falls back to top-level
     *  TIER_*_RESIDENT keys above when category is missing. */
    byCategory?: Record<string, {
      TIER_1_RESIDENT: DepositOption[]
      TIER_2_RESIDENT: DepositOption[]
      TIER_1_NON_RESIDENT: DepositOption[]
      TIER_2_NON_RESIDENT: DepositOption[]
    }>
  }
  // Dynamic rental day rates from admin Centralina
  rentalDayRates: RentalDayRates | null
  // Dynamic km included config from admin Centralina (legacy global default).
  // Supercars values traditionally lived here; per-category overrides below.
  kmIncluded: KmIncludedConfig | null
  // Per-category km tables. Keys are DB categories (exotic / urban / aziendali).
  // The wizard picks these based on the booked vehicle's category and falls
  // back to `kmIncluded` only when the category-specific table is missing.
  kmIncludedSupercars: KmIncludedConfig | null
  kmIncludedUrban: KmIncludedConfig | null
  kmIncludedAziendali: KmIncludedConfig | null
  // KM package prices from admin Revenue management
  kmPackagePrices: KmPackagePrices
  // Sforo (overage) per km — from Centralina Pro km[supercars].sforo
  sforoPerKm: number
}

/** Build overlay from Centralina config. Returns null if config is not loaded yet. */
export function buildWebsiteConfigOverlay(config: RentalConfig | null): WebsiteConfigOverlay | null {
  if (!config || !config.insurance) return null

  type InsRaw = { id: string; name: string; daily_price: number; deductible?: string; mandatory_deposit?: number; coverage?: string }
  const exoticT1 = (config.insurance?.exotic as Record<string, InsRaw[]>)?.TIER_1
  const exoticT2 = (config.insurance?.exotic as Record<string, InsRaw[]>)?.TIER_2
  const urbanIns = (config.insurance?.urban as Record<string, InsRaw[]>)?._all_tiers
  const utilitaireIns = (config.insurance?.utilitaire as Record<string, InsRaw[]>)?._all_tiers
  const furgoneIns = (config.insurance?.furgone as Record<string, InsRaw[]>)?._all_tiers

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

  // Build km included config from admin — both the legacy _global default
  // AND each per-category table (exotic / urban / aziendali) so the wizard
  // can pick the right one for the booked vehicle.
  type KmCfgRaw = Record<string, { table?: Record<string, number>; extra_per_day?: number; unlimited?: boolean }>
  const kmRoot = (config.km_included as KmCfgRaw | undefined)
  let kmIncluded: KmIncludedConfig | null = null
  const globalKm = kmRoot?._global
  if (globalKm?.table && typeof globalKm.extra_per_day === 'number') {
    kmIncluded = { table: globalKm.table, extra_per_day: globalKm.extra_per_day }
  }
  const buildPerCat = (key: string): KmIncludedConfig | null => {
    const c = kmRoot?.[key]
    if (!c) return null
    if (c.table && typeof c.extra_per_day === 'number') {
      return { table: c.table, extra_per_day: c.extra_per_day }
    }
    return null
  }
  const kmIncludedSupercars = buildPerCat('exotic')
  const kmIncludedUrban = buildPerCat('urban')
  const kmIncludedAziendali = buildPerCat('aziendali')

  // Build km package prices — reads from BOTH sources:
  // 1. km_packages array (RevenuePricingTab) — flat list with ids
  // 2. unlimited_km nested config (Centralina) — structured by category/tier
  // Whichever source has a value wins; Centralina takes priority for unlimited km
  const kmPkgs = (config as Record<string, unknown>).km_packages as { id: string; price: number; is_active?: boolean }[] | undefined
  const findKmPrice = (id: string, fallback: number): number => {
    const item = kmPkgs?.find(p => p.id === id && p.is_active !== false)
    return item?.price ?? fallback
  }

  // Centralina unlimited_km values (source of truth when present).
  // Centralina Pro uses 'aziendali' as the key for furgone/V_class vehicles;
  // we ALSO read the legacy 'furgone' key for any callers that still write it.
  const centralinaT1 = config.unlimited_km?.exotic?.TIER_1?.per_day
  const centralinaT2 = config.unlimited_km?.exotic?.TIER_2?.per_day
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const aziendaliRaw = (config.unlimited_km as any)?.aziendali ?? (config.unlimited_km as any)?.furgone
  const centralinaAziendali = aziendaliRaw?._all_tiers?.flat
    ?? aziendaliRaw?._all_tiers?.per_day
    ?? aziendaliRaw?.TIER_2?.per_day
    ?? aziendaliRaw?.TIER_1?.per_day
  const centralinaNcc = aziendaliRaw?.TIER_2?.per_day ?? aziendaliRaw?._all_tiers?.per_day

  const kmPackagePrices: KmPackagePrices = {
    supercar50kmPerDay: findKmPrice('supercar_50km', 199),
    unlimitedSupercarT1PerDay: centralinaT1 ?? findKmPrice('unlimited_km_supercar_t1', 289),
    unlimitedSupercarT2PerDay: centralinaT2 ?? findKmPrice('unlimited_km_supercar_t2', 189),
    unlimitedFurgonePerDay: centralinaAziendali ?? findKmPrice('unlimited_km_furgone', 94.50),
    unlimitedNccPerDay: centralinaNcc ?? findKmPrice('unlimited_km_ncc', 189),
    unlimitedUrbanPerDay: config.unlimited_km?.urban?._all_tiers?.per_day ?? findKmPrice('unlimited_km_urban', 0),
  }

  return {
    insuranceTier1: toInsOpts(exoticT1) || [],
    insuranceTier2: toInsOpts(exoticT2) || [],
    urbanInsurance: toInsOpts(urbanIns) || [],
    utilitaireInsurance: toInsOpts(utilitaireIns) || [],
    furgoneInsurance: toInsOpts(furgoneIns) || [],
    tierPricing: {
      TIER_1: {
        unlimitedKmPerDay: kmPackagePrices.unlimitedSupercarT1PerDay,
        secondDriverPerDay: config.second_driver?.TIER_1 ?? 20,
        lavaggio: config.lavaggio?.fee ?? 9.90,
      },
      TIER_2: {
        unlimitedKmPerDay: kmPackagePrices.unlimitedSupercarT2PerDay,
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
      byCategory: (() => {
        const raw = (config.deposits as Record<string, unknown> | undefined)?.by_category as
          Record<string, Record<string, { id: string; label: string; amount: number; surcharge_per_day?: number }[]>> | undefined
        if (!raw || typeof raw !== 'object') return undefined
        const out: WebsiteConfigOverlay['depositOptions']['byCategory'] = {}
        for (const [cat, tiers] of Object.entries(raw)) {
          out![cat] = {
            TIER_1_RESIDENT: toDepositOpts(tiers?.TIER_1_RESIDENT),
            TIER_2_RESIDENT: toDepositOpts(tiers?.TIER_2_RESIDENT),
            TIER_1_NON_RESIDENT: toDepositOpts(tiers?.TIER_1_NON_RESIDENT),
            TIER_2_NON_RESIDENT: toDepositOpts(tiers?.TIER_2_NON_RESIDENT),
          }
        }
        return out
      })(),
    },
    rentalDayRates,
    kmIncluded,
    kmIncludedSupercars,
    kmIncludedUrban,
    kmIncludedAziendali,
    kmPackagePrices,
    sforoPerKm: 0,
  }
}
