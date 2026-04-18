// Smoke test: Pro snapshot → WebsiteConfigOverlay
// Run: node test-pro-overlay.mjs
//
// No env, no Supabase. Feeds a realistic Pro snapshot into the adapter
// (logic mirrored from hooks/useCentralinaProConfig.ts) and asserts the
// output looks sane.

// ── Replicate the adapter logic locally (Node can't import TSX) ──
const FASCIA_A = 'A'
const FASCIA_B = 'B'

const num = (v, fallback) => {
  if (v === '' || v === null || v === undefined) return fallback
  const n = Number(v)
  return isNaN(n) ? fallback : n
}
const cleanMap = (src) => {
  const out = {}
  if (!src) return out
  for (const [k, v] of Object.entries(src)) {
    if (v !== '' && v !== undefined && v !== null && !isNaN(Number(v))) out[k] = Number(v)
  }
  return out
}

function buildOverlayFromPro(snapshot) {
  if (!snapshot) return null
  const tariffe = snapshot?.prezzoDinamico?.tariffe || []
  let exoticRes, exoticNonRes, urbanFlat, furgoneFlat
  for (const t of tariffe) {
    const resMap = t.mode === 'per_residenza' ? cleanMap(t.residente) : cleanMap(t.unica)
    const nonResMap = t.mode === 'per_residenza' ? cleanMap(t.non_residente) : undefined
    if (t.id === 'supercars' || t.id === 'exotic') { exoticRes = resMap; exoticNonRes = nonResMap }
    else if (t.id === 'urban' || t.id === 'utilitaria') { urbanFlat = resMap }
    else if (t.id === 'furgone' || t.id === 'aziendali') { furgoneFlat = resMap }
  }
  const kmSupercars = snapshot.km?.find(k => k.id === 'supercars' || k.id === 'exotic')
  const kmUrban = snapshot.km?.find(k => k.id === 'urban' || k.id === 'utilitaria')
  const kmFurgone = snapshot.km?.find(k => k.id === 'furgone' || k.id === 'aziendali')
  return {
    rentalDayRates: {
      exotic: { resident: exoticRes || {}, ...(exoticNonRes ? { non_resident: exoticNonRes } : {}) },
      urban: { flat: urbanFlat || {} },
      furgone: { flat: furgoneFlat || {} },
    },
    kmIncluded: kmSupercars ? { table: cleanMap(kmSupercars.table), extra_per_day: num(kmSupercars.extraPerDay, 60) } : null,
    kmPackagePrices: {
      unlimitedSupercarT1PerDay: num(kmSupercars?.unlimitedPerDay, 0),
      unlimitedSupercarT2PerDay: num(kmSupercars?.unlimitedPerDay, 0),
      unlimitedFurgonePerDay: num(kmFurgone?.unlimitedPerDay, 0),
      unlimitedUrbanPerDay: num(kmUrban?.unlimitedPerDay, 0),
    },
    tierPricing: {
      TIER_1: {
        secondDriverPerDay: num(snapshot.servizi?.second_driver?.[FASCIA_B], 10),
        lavaggio: num(snapshot.servizi?.lavaggio?.fee, 9.9),
        unlimitedKmPerDay: num(kmSupercars?.unlimitedPerDay, 0),
      },
      TIER_2: {
        secondDriverPerDay: num(snapshot.servizi?.second_driver?.[FASCIA_A], 20),
        lavaggio: num(snapshot.servizi?.lavaggio?.fee, 9.9),
        unlimitedKmPerDay: num(kmSupercars?.unlimitedPerDay, 0),
      },
    },
    dr7Flex: {
      dailyPrice: num(snapshot.servizi?.dr7_flex?.daily_price, 19.9),
      refundPercent: num(snapshot.servizi?.dr7_flex?.refund_percent, 90),
    },
    deliveryPricePerKm: num(snapshot.servizi?.delivery?.price_per_km, 3),
  }
}

// ── Realistic Pro snapshot (matches admin INITIAL_* defaults) ──
const snapshot = {
  fasce: [
    { id: 'A', label: 'Fascia A', min_age: 26, max_age: 69, min_license_years: 5 },
    { id: 'B', label: 'Fascia B', min_age: 21, max_age: 25, min_license_years: 3 },
  ],
  km: [
    { id: 'supercars', label: 'Supercars', table: { 1: 100, 2: 180, 3: 240, 4: 280, 5: 300 }, extraPerDay: 60, sforo: 0.89, unlimitedPerDay: 189 },
    { id: 'urban', label: 'Urban', table: {}, extraPerDay: 0, sforo: 0.30, unlimitedPerDay: 0 },
    { id: 'furgone', label: 'Furgone', table: { 1: 200, 2: 350, 3: 500, 4: 600, 5: 700 }, extraPerDay: 100, sforo: 0.50, unlimitedPerDay: 94.5 },
  ],
  servizi: {
    dr7_flex: { daily_price: 19.9, refund_percent: 90 },
    lavaggio: { fee: 9.9, mandatory: false },
    delivery: { price_per_km: 3 },
    second_driver: { A: 20, B: 10 },
  },
  prezzoDinamico: {
    tariffe: [
      {
        id: 'supercars',
        mode: 'per_residenza',
        residente: { 1: 349, 2: 698, 3: 980, 4: 1290, 5: 1590, 6: 1890, 7: 2290 },
        non_residente: { 1: 449, 2: 898, 3: 1280, 4: 1690, 5: 2100, 6: 2590, 7: 2890 },
        extraPerDay: 289,
      },
      { id: 'urban', mode: 'unica', unica: { 1: 39, 2: 78, 3: 109, 4: 129, 5: 149, 6: 179, 7: 189 }, extraPerDay: 25 },
      { id: 'furgone', mode: 'unica', unica: { 1: 139, 2: 278, 3: 389, 4: 490, 5: 590, 6: 649, 7: 689 }, extraPerDay: 100 },
    ],
  },
}

// ── Assertions ──
let pass = 0, fail = 0
const eq = (label, got, want) => {
  if (JSON.stringify(got) === JSON.stringify(want)) { pass++; console.log(`  ✓ ${label}`) }
  else { fail++; console.log(`  ✗ ${label}\n     got:  ${JSON.stringify(got)}\n     want: ${JSON.stringify(want)}`) }
}

console.log('\nPro → WebsiteConfigOverlay smoke test\n')
const overlay = buildOverlayFromPro(snapshot)

console.log('[rentalDayRates]')
eq('supercars day 1 resident', overlay.rentalDayRates.exotic.resident[1], 349)
eq('supercars day 7 resident', overlay.rentalDayRates.exotic.resident[7], 2290)
eq('supercars day 1 non-resident', overlay.rentalDayRates.exotic.non_resident[1], 449)
eq('urban day 2 flat', overlay.rentalDayRates.urban.flat[2], 78)
eq('furgone day 5 flat', overlay.rentalDayRates.furgone.flat[5], 590)

console.log('\n[kmIncluded]')
eq('day 1 = 100km', overlay.kmIncluded.table[1], 100)
eq('day 5 = 300km', overlay.kmIncluded.table[5], 300)
eq('extra per day = 60', overlay.kmIncluded.extra_per_day, 60)

console.log('\n[kmPackagePrices]')
eq('unlimited supercar = 189', overlay.kmPackagePrices.unlimitedSupercarT1PerDay, 189)
eq('unlimited furgone = 94.5', overlay.kmPackagePrices.unlimitedFurgonePerDay, 94.5)

console.log('\n[tierPricing]')
eq('TIER_1 (Fascia B) 2nd driver = 10', overlay.tierPricing.TIER_1.secondDriverPerDay, 10)
eq('TIER_2 (Fascia A) 2nd driver = 20', overlay.tierPricing.TIER_2.secondDriverPerDay, 20)
eq('lavaggio = 9.9', overlay.tierPricing.TIER_1.lavaggio, 9.9)

console.log('\n[services]')
eq('dr7Flex daily = 19.9', overlay.dr7Flex.dailyPrice, 19.9)
eq('delivery per km = 3', overlay.deliveryPricePerKm, 3)

console.log(`\n────────\n${pass} passed · ${fail} failed\n`)
process.exit(fail > 0 ? 1 : 0)
