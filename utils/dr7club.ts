/**
 * DR7 Club — Membership tiers, reward engine, wallet rules
 *
 * Tiers based on annual spend:
 *   Access: €0–€2,999 → 2% reward
 *   Black:  €3,000–€9,999 → 3% reward
 *   Signature: €10,000+ → 4% reward
 *
 * Wallet rules:
 *   - Max 30% of order
 *   - Not usable for: cauzioni, penali, danni, franchigie
 *   - Credits expire after 12 months
 *   - Credits added ONLY after rental completion
 *   - Rewards only for active DR7 Club subscribers
 */

import { supabase } from '../supabaseClient'

// ─── Types ───────────────────────────────────────────────────────────

export type ClubTier = 'access' | 'black' | 'signature'

export interface ClubSubscription {
  id: string
  user_id: string
  plan: 'monthly' | 'annual'
  status: 'pending' | 'active' | 'cancelled' | 'expired'
  price: number
  started_at: string
  expires_at: string
  created_at: string
}

export interface ClubTierInfo {
  tier: ClubTier
  label: string
  rewardPercent: number
  annualSpend: number
  nextTier: ClubTier | null
  nextTierThreshold: number
  progress: number // 0-100%
}

// ─── Constants ───────────────────────────────────────────────────────

export const CLUB_PLANS = {
  monthly: { price: 4.90, label: 'Mensile', period: '/ mese' },
  annual: { price: 39, label: 'Annuale', period: '/ anno' },
} as const

export const TIER_THRESHOLDS: { tier: ClubTier; min: number; max: number; rewardPercent: number; label: string }[] = [
  { tier: 'access', min: 0, max: 2999, rewardPercent: 2, label: 'Access' },
  { tier: 'black', min: 3000, max: 9999, rewardPercent: 3, label: 'Black' },
  { tier: 'signature', min: 10000, max: Infinity, rewardPercent: 4, label: 'Signature' },
]

export const WALLET_MAX_ORDER_PERCENT = 30
export const SIGNUP_BONUS = 10 // €10 signup bonus
export const ANNUAL_RENEWAL_BONUS = 20 // €20 annual renewal bonus

// ─── Tier Calculation ────────────────────────────────────────────────

export function calculateTier(annualSpend: number): ClubTierInfo {
  const tierDef = TIER_THRESHOLDS.find(t => annualSpend >= t.min && annualSpend <= t.max)
    || TIER_THRESHOLDS[0]

  const tierIdx = TIER_THRESHOLDS.indexOf(tierDef)
  const nextTierDef = tierIdx < TIER_THRESHOLDS.length - 1 ? TIER_THRESHOLDS[tierIdx + 1] : null

  let progress = 100
  if (nextTierDef) {
    const rangeSize = nextTierDef.min - tierDef.min
    const spent = annualSpend - tierDef.min
    progress = Math.min(100, Math.round((spent / rangeSize) * 100))
  }

  return {
    tier: tierDef.tier,
    label: tierDef.label,
    rewardPercent: tierDef.rewardPercent,
    annualSpend,
    nextTier: nextTierDef?.tier || null,
    nextTierThreshold: nextTierDef?.min || 0,
    progress,
  }
}

// ─── Reward Calculation ──────────────────────────────────────────────

export interface RewardPreview {
  baseReward: number
  rewardPercent: number
  tier: ClubTier
  message: string
}

/**
 * Calculate reward for a booking.
 * @param totalCents Total in cents
 * @param paymentType 'full' = 100% paid upfront, 'deposit' = 30% deposit
 * @param tierInfo Club tier info
 * @param serviceType 'car_rental' | 'car_wash' | 'extra'
 */
export function calculateReward(
  totalCents: number,
  paymentType: 'full' | 'deposit',
  tierInfo: ClubTierInfo,
  serviceType: 'car_rental' | 'car_wash' | 'extra' = 'car_rental'
): RewardPreview {
  let rewardPercent = tierInfo.rewardPercent

  // Payment type adjustments
  if (paymentType === 'deposit') {
    rewardPercent = Math.max(1, Math.floor(rewardPercent / 2)) // halved, min 1%
  }

  // Service type bonuses
  if (serviceType === 'car_wash') {
    rewardPercent = 3 // Prime Wash always 3%
  } else if (serviceType === 'extra') {
    rewardPercent = 2 // Extras always 2%
  }

  const totalEuros = totalCents / 100
  const baseReward = Math.round(totalEuros * rewardPercent) / 100

  return {
    baseReward: Math.round(baseReward * 100), // in cents
    rewardPercent,
    tier: tierInfo.tier,
    message: `Riceverai €${baseReward.toFixed(2)} di credito wallet dopo il noleggio`,
  }
}

/**
 * Max wallet amount usable for an order (30% rule).
 * Excludes cauzioni, penali, danni.
 */
export function maxWalletUsable(orderTotalCents: number): number {
  return Math.floor(orderTotalCents * WALLET_MAX_ORDER_PERCENT / 100)
}

// ─── Supabase Queries ────────────────────────────────────────────────

/** Get active DR7 Club subscription for a user */
export async function getClubSubscription(userId: string): Promise<ClubSubscription | null> {
  const { data, error } = await supabase
    .from('dr7_club_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('Error fetching club subscription:', error)
    return null
  }
  return data
}

/** Get annual spend (last 12 months) from completed bookings */
export async function getAnnualSpend(userId: string): Promise<number> {
  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

  const { data, error } = await supabase
    .from('bookings')
    .select('price_total')
    .eq('user_id', userId)
    .in('status', ['completed', 'completata', 'confirmed', 'active'])
    .in('payment_status', ['paid', 'completed', 'succeeded'])
    .gte('booked_at', oneYearAgo.toISOString())

  if (error) {
    console.error('Error fetching annual spend:', error)
    return 0
  }

  // price_total is in cents
  const totalCents = (data || []).reduce((sum, b) => sum + (b.price_total || 0), 0)
  return totalCents / 100 // return in euros
}

/** Get full club status for a user */
export async function getClubStatus(userId: string): Promise<{
  subscription: ClubSubscription | null
  tierInfo: ClubTierInfo
  isActive: boolean
}> {
  const [subscription, annualSpend] = await Promise.all([
    getClubSubscription(userId),
    getAnnualSpend(userId),
  ])

  const tierInfo = calculateTier(annualSpend)

  return {
    subscription,
    tierInfo,
    isActive: !!subscription,
  }
}
