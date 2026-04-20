/**
 * useCentralinaProConfig — single source of truth for website pricing.
 *
 * Reads the singleton `centralina_pro_config` row (managed by admin
 * Centralina Pro tab) and exposes it in the shape the rest of the
 * website already knows (WebsiteConfigOverlay from configOverlay.ts).
 *
 * Shapes mirror the admin's CentralinaProTab PersistedSnapshot exactly
 * (camelCase where admin uses camelCase). Missing fields surface as
 * undefined/empty — the CarBookingWizard keeps its existing fallback
 * behavior for fields Pro hasn't populated.
 */
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabaseClient'
import type { DynamicRentalDayRates } from '../utils/multiDayPricing'
import type { InsuranceTierOption, DepositOption, ExperienceService } from '../types'

// ── Types inlined here so the website no longer depends on utils/configOverlay.ts
// (which can be safely deleted along with hooks/useRentalConfig.ts once
// rental_config is removed from Supabase).
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
  }
  rentalDayRates: RentalDayRates | null
  kmIncluded: KmIncludedConfig | null
  kmIncludedAziendali: KmIncludedConfig | null
  kmPackagePrices: KmPackagePrices
  sforoPerKm: number
}

// ── Pro snapshot types (match CentralinaProTab PersistedSnapshot) ──

export interface ProTariffaGiornaliera {
  id: string // 'supercars' | 'urban' | 'furgone' | custom category id
  label?: string
  mode?: 'unica' | 'per_residenza'
  days?: string[]
  unica?: Record<string, number | ''>
  residente?: Record<string, number | ''>
  non_residente?: Record<string, number | ''>
  extraPerDay?: number | ''
}

export interface ProKmEntry {
  id: string // category id
  label?: string
  table?: Record<string, number | ''>
  extraPerDay?: number | ''
  sforo?: number | ''
  unlimitedPerDay?: number | ''
}

export interface ProInsuranceOption {
  id?: string
  name: string
  daily_price: number | ''
  mandatory_deposit?: number | ''
  deductible_fixed?: number | ''
  deductible_percent?: number | ''
}

export interface ProInsuranceCategory {
  id: string // category id
  label?: string
  mode?: 'per_fascia' | 'all_tiers'
  byFascia?: Record<string, ProInsuranceOption[]> // fascia id → options
  all?: ProInsuranceOption[]
}

export interface ProDepositOption {
  id?: string
  label: string
  amount: number | ''
  surcharge_per_day?: number | ''
}

export interface ProDepositsByFascia {
  residente?: ProDepositOption[]
  non_residente?: ProDepositOption[]
}
export type ProDepositsConfig = Record<string, ProDepositsByFascia> // keyed by fascia id

export interface ProExperienceService {
  id?: string
  name: string
  price: number | ''
  unit: 'per_day' | 'per_hour' | 'per_item' | 'flat'
  is_active?: boolean
  tier_only?: string // fascia id
  description?: string
}

export interface ProServiziConfig {
  experience?: ProExperienceService[]
  dr7_flex?: {
    daily_price?: number | ''
    refund_percent?: number | ''
    tier_restriction?: string
    description?: string
  }
  lavaggio?: { fee?: number | ''; mandatory?: boolean }
  delivery?: { price_per_km?: number | '' }
  second_driver?: Record<string, number | ''> // keyed by fascia id
}

export interface ProFascia {
  id: string
  label?: string
  description?: string
  min_age?: number | ''
  max_age?: number | ''
  min_license_years?: number | ''
}

export interface ProCentralinaSnapshot {
  categories?: Array<{ id: string; label: string }>
  fasce?: ProFascia[]
  insurance?: ProInsuranceCategory[]
  km?: ProKmEntry[]
  deposits?: ProDepositsConfig
  servizi?: ProServiziConfig
  prezzoDinamico?: {
    tariffe?: ProTariffaGiornaliera[]
    dynamic?: Record<string, unknown>
  }
  preventivi?: Record<string, unknown>
}

// ────────────────────────────────────────────────────────────────────

interface UseProConfigResult {
  snapshot: ProCentralinaSnapshot | null
  loading: boolean
  error: string | null
}

const ROW_ID = 'main'

export function useCentralinaProConfig(): UseProConfigResult {
  const [snapshot, setSnapshot] = useState<ProCentralinaSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { data, error: err } = await supabase
          .from('centralina_pro_config')
          .select('config')
          .eq('id', ROW_ID)
          .maybeSingle()
        if (cancelled) return
        if (err) throw err
        const cfg = (data?.config ?? null) as ProCentralinaSnapshot | null
        setSnapshot(cfg)
      } catch (e) {
        if (cancelled) return
        console.error('[CentralinaPro] load failed:', e)
        setError(e instanceof Error ? e.message : String(e))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  return { snapshot, loading, error }
}

// ── Helpers ────────────────────────────────────────────────────────

function num(v: number | '' | null | undefined, fallback: number): number {
  if (v === '' || v === null || v === undefined) return fallback
  const n = Number(v)
  return isNaN(n) ? fallback : n
}

function cleanNumMap(src: Record<string, number | ''> | undefined): Record<string, number> {
  const out: Record<string, number> = {}
  if (!src) return out
  for (const [k, v] of Object.entries(src)) {
    if (v !== '' && v !== undefined && v !== null && !isNaN(Number(v))) {
      out[k] = Number(v)
    }
  }
  return out
}

// Project rule: Fascia A = TIER_2 (experienced), Fascia B = TIER_1 (young/new licence)
const FASCIA_A_ID = 'A'
const FASCIA_B_ID = 'B'

const DEFAULT_COVERAGE = 'RCA - Furto (solo in caso di restituzione chiave, altrimenti 100% del valore del veicolo) - Atti vandalici - Agenti atmosferici - Incendio - Danni & distruzione totale'

function toInsuranceOpts(arr: ProInsuranceOption[] | undefined): InsuranceTierOption[] {
  if (!arr) return []
  return arr.map(o => {
    const fixed = num(o.deductible_fixed, 0)
    const percent = num(o.deductible_percent, 0)
    const deductibleParts: string[] = []
    if (fixed > 0) deductibleParts.push(`€${fixed}`)
    if (percent > 0) deductibleParts.push(`${percent}% del danno`)
    const deductible = deductibleParts.length > 0 ? deductibleParts.join(' + ') : 'Nessuna franchigia'
    return {
      id: o.id || o.name,
      name: o.name,
      dailyPrice: num(o.daily_price, 0),
      deductible,
      mandatoryDeposit: num(o.mandatory_deposit, 0) || undefined,
      coverage: DEFAULT_COVERAGE,
    }
  })
}

function pickInsuranceForFascia(cat: ProInsuranceCategory | undefined, fasciaId: string): InsuranceTierOption[] {
  if (!cat) return []
  if (cat.mode === 'all_tiers' && cat.all && cat.all.length > 0) return toInsuranceOpts(cat.all)
  const arr = cat.byFascia?.[fasciaId]
  return toInsuranceOpts(arr)
}

function toDepositOpts(arr: ProDepositOption[] | undefined): DepositOption[] {
  if (!arr) return []
  return arr.map(o => ({
    id: o.id || o.label,
    label: o.label,
    amount: num(o.amount, 0),
    surchargePerDay: num(o.surcharge_per_day, 0) || undefined,
  }))
}

// ── Adapters ───────────────────────────────────────────────────────

/**
 * Adapt Pro.prezzoDinamico.tariffe[] → DynamicRentalDayRates
 * (the shape calculateMultiDayPrice expects).
 */
export function adaptPrezzoDinamicoToRates(
  snapshot: ProCentralinaSnapshot | null
): DynamicRentalDayRates | null {
  const tariffe = snapshot?.prezzoDinamico?.tariffe
  if (!tariffe || tariffe.length === 0) return null

  let exoticResident: Record<string, number> | undefined
  let exoticNonResident: Record<string, number> | undefined
  let urbanFlat: Record<string, number> | undefined
  let furgoneFlat: Record<string, number> | undefined

  for (const t of tariffe) {
    const resMap = t.mode === 'per_residenza' ? cleanNumMap(t.residente) : cleanNumMap(t.unica)
    const nonResMap = t.mode === 'per_residenza' ? cleanNumMap(t.non_residente) : undefined
    if (t.id === 'supercars' || t.id === 'exotic') {
      exoticResident = resMap
      exoticNonResident = nonResMap
    } else if (t.id === 'urban' || t.id === 'utilitaria') {
      urbanFlat = resMap
    } else if (t.id === 'furgone' || t.id === 'aziendali') {
      furgoneFlat = resMap
    }
  }

  if (
    (!exoticResident || Object.keys(exoticResident).length === 0) &&
    (!urbanFlat || Object.keys(urbanFlat).length === 0) &&
    (!furgoneFlat || Object.keys(furgoneFlat).length === 0)
  ) {
    return null
  }

  return {
    exotic: {
      resident: exoticResident ?? {},
      ...(exoticNonResident && Object.keys(exoticNonResident).length > 0
        ? { non_resident: exoticNonResident }
        : {}),
    },
    urban: { flat: urbanFlat ?? {} },
    furgone: { flat: furgoneFlat ?? {} },
  }
}

/**
 * Adapt Pro.km[] → KmIncludedConfig for a given category.
 */
export function adaptKmForCategory(
  snapshot: ProCentralinaSnapshot | null,
  categoryId: string
): { table: Record<string, number>; extra_per_day: number } | null {
  const entry = snapshot?.km?.find(k => k.id === categoryId)
  if (!entry) return null
  const table = cleanNumMap(entry.table)
  const extra = num(entry.extraPerDay, 60)
  if (Object.keys(table).length === 0 && extra === 60) return null
  return { table, extra_per_day: extra }
}

/**
 * MAIN ADAPTER: Pro snapshot → WebsiteConfigOverlay.
 *
 * Returns the same shape as buildWebsiteConfigOverlay(rentalConfig), so
 * callers can drop this in as a replacement without touching pricing logic.
 */
export function buildWebsiteConfigOverlayFromPro(snapshot: ProCentralinaSnapshot | null): WebsiteConfigOverlay | null {
  if (!snapshot) return null

  const insuranceByCatId = new Map<string, ProInsuranceCategory>()
  for (const c of snapshot.insurance || []) insuranceByCatId.set(c.id, c)

  const supercarsIns = insuranceByCatId.get('supercars') ?? insuranceByCatId.get('exotic')
  const urbanIns = insuranceByCatId.get('urban') ?? insuranceByCatId.get('utilitaria')
  const furgoneIns = insuranceByCatId.get('furgone') ?? insuranceByCatId.get('aziendali')

  const insuranceTier1 = pickInsuranceForFascia(supercarsIns, FASCIA_B_ID) // Fascia B = TIER_1
  const insuranceTier2 = pickInsuranceForFascia(supercarsIns, FASCIA_A_ID) // Fascia A = TIER_2
  const urbanInsurance = pickInsuranceForFascia(urbanIns, FASCIA_A_ID)
    .concat(pickInsuranceForFascia(urbanIns, FASCIA_B_ID).filter(o => !pickInsuranceForFascia(urbanIns, FASCIA_A_ID).some(a => a.id === o.id)))
  const furgoneInsurance = pickInsuranceForFascia(furgoneIns, FASCIA_A_ID)
    .concat(pickInsuranceForFascia(furgoneIns, FASCIA_B_ID).filter(o => !pickInsuranceForFascia(furgoneIns, FASCIA_A_ID).some(a => a.id === o.id)))

  // km per category
  const kmSupercars = snapshot.km?.find(k => k.id === 'supercars' || k.id === 'exotic')
  const kmUrban = snapshot.km?.find(k => k.id === 'urban' || k.id === 'utilitaria')
  const kmFurgone = snapshot.km?.find(k => k.id === 'furgone' || k.id === 'aziendali')

  // No hardcoded fallbacks — if Pro has nothing, price is 0 and the gap is visible.
  // Aziendali category drives BOTH Furgone (Ducato) and NCC (V_CLASS) unlimited prices.
  const unlimitedSupercar = num(kmSupercars?.unlimitedPerDay, 0)
  const unlimitedAziendali = num(kmFurgone?.unlimitedPerDay, 0)
  const unlimitedUrban = num(kmUrban?.unlimitedPerDay, 0)
  const sforoSupercar = num(kmSupercars?.sforo, 0)

  // No hardcoded fallbacks
  const secondDriverFasciaA = num(snapshot.servizi?.second_driver?.[FASCIA_A_ID], 0)
  const secondDriverFasciaB = num(snapshot.servizi?.second_driver?.[FASCIA_B_ID], 0)
  const lavaggioFee = num(snapshot.servizi?.lavaggio?.fee, 0)

  // Deposits by fascia → TIER label
  const depFasciaA = snapshot.deposits?.[FASCIA_A_ID] ?? {}
  const depFasciaB = snapshot.deposits?.[FASCIA_B_ID] ?? {}

  const experienceServices: ExperienceService[] = (snapshot.servizi?.experience || [])
    .filter(s => s.is_active !== false)
    .map(s => ({
      id: s.id || s.name,
      name: s.name,
      price: num(s.price, 0),
      unit: s.unit,
      tierOnly: s.tier_only === FASCIA_A_ID ? 'TIER_2' : s.tier_only === FASCIA_B_ID ? 'TIER_1' : undefined,
      description: s.description || '',
    }))

  // rentalDayRates: reuse the adapter
  const dynamicRates = adaptPrezzoDinamicoToRates(snapshot)
  const rentalDayRates: RentalDayRates | null = dynamicRates
    ? {
        exotic: dynamicRates.exotic,
        urban: {
          flat: dynamicRates.urban.flat,
          extrapolation: dynamicRates.urban.extrapolation || 'interpolate_7_30',
        },
        furgone: dynamicRates.furgone,
      }
    : null

  // kmIncluded per category — supercars is the default, aziendali for furgone/ncc
  const kmIncluded: KmIncludedConfig | null = kmSupercars
    ? {
        table: cleanNumMap(kmSupercars.table),
        extra_per_day: num(kmSupercars.extraPerDay, 60),
      }
    : null

  const kmAziendaliEntry = (snapshot.km || []).find(k => k.id === 'aziendali')
  const kmIncludedAziendali: KmIncludedConfig | null = kmAziendaliEntry
    ? {
        table: cleanNumMap(kmAziendaliEntry.table),
        extra_per_day: num(kmAziendaliEntry.extraPerDay, 0),
      }
    : null

  // NCC (V_CLASS) reads from the Aziendali category, same as Furgone (Ducato).
  const kmPackagePrices: KmPackagePrices = {
    supercar50kmPerDay: 0, // Not yet in Pro — keep at 0 until admin adds a field
    unlimitedSupercarT1PerDay: unlimitedSupercar,
    unlimitedSupercarT2PerDay: unlimitedSupercar,
    unlimitedFurgonePerDay: unlimitedAziendali,
    unlimitedNccPerDay: unlimitedAziendali,
    unlimitedUrbanPerDay: unlimitedUrban,
  }

  return {
    insuranceTier1,
    insuranceTier2,
    urbanInsurance,
    utilitaireInsurance: urbanInsurance, // Pro has 'urban' covering both
    furgoneInsurance,
    tierPricing: {
      TIER_1: {
        unlimitedKmPerDay: unlimitedSupercar,
        secondDriverPerDay: secondDriverFasciaB,
        lavaggio: lavaggioFee,
      },
      TIER_2: {
        unlimitedKmPerDay: unlimitedSupercar,
        secondDriverPerDay: secondDriverFasciaA,
        lavaggio: lavaggioFee,
      },
    },
    noDepositSurchargePerDay: 0, // Pro stores surcharge per deposit option, not a global
    deliveryPricePerKm: num(snapshot.servizi?.delivery?.price_per_km, 0),
    experienceServices,
    dr7Flex: {
      dailyPrice: num(snapshot.servizi?.dr7_flex?.daily_price, 0),
      refundPercent: num(snapshot.servizi?.dr7_flex?.refund_percent, 0),
      tierRestriction: snapshot.servizi?.dr7_flex?.tier_restriction === FASCIA_A_ID
        ? 'TIER_2'
        : snapshot.servizi?.dr7_flex?.tier_restriction === FASCIA_B_ID
          ? 'TIER_1'
          : (snapshot.servizi?.dr7_flex?.tier_restriction || 'TIER_2'),
    },
    depositOptions: {
      TIER_1_RESIDENT: toDepositOpts(depFasciaB.residente),
      TIER_2_RESIDENT: toDepositOpts(depFasciaA.residente),
      TIER_1_NON_RESIDENT: toDepositOpts(depFasciaB.non_residente),
      TIER_2_NON_RESIDENT: toDepositOpts(depFasciaA.non_residente),
    },
    rentalDayRates,
    kmIncluded,
    kmIncludedAziendali,
    kmPackagePrices,
    sforoPerKm: sforoSupercar,
  }
}

/**
 * Composite hook: returns the Pro-derived WebsiteConfigOverlay ready to use.
 * Drop-in replacement for useRentalConfig + buildWebsiteConfigOverlay.
 */
export function useCentralinaProOverlay(): { overlay: WebsiteConfigOverlay | null; loading: boolean; snapshot: ProCentralinaSnapshot | null } {
  const { snapshot, loading } = useCentralinaProConfig()
  const overlay = useMemo(() => buildWebsiteConfigOverlayFromPro(snapshot), [snapshot])
  return { overlay, loading, snapshot }
}
