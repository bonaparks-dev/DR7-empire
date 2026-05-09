import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

/**
 * Cancellation policy rules from Centralina Pro Automazioni.
 *
 * Source of truth: `centralina_pro_config.config.automations.cancellation_rules`.
 * The operator manages the list (add/edit/delete/toggle) in admin →
 * Centralina Pro → Automazioni → "Regole di cancellazione".
 *
 * Selection logic: rules are sorted by `min_days_notice` descending; the
 * first ACTIVE rule whose `min_days_notice ≤ daysUntilPickup` wins.
 *
 * DR7 Flex / Prime Flex / Elite override these rules via their own
 * configured refund_percent (handled separately in the wizard).
 */

export type RefundMethod = 'wallet' | 'card';
export type CancellationAppliesTo = 'all' | 'rental' | 'carwash';
export type CancellationRequiresService = 'none' | 'dr7_flex' | 'prime_flex' | 'elite';

export interface CancellationRule {
  id: string;
  label: string;
  /** Booking type the rule applies to. */
  appliesTo: CancellationAppliesTo;
  /** Add-on / membership the booking must have for the rule to apply. */
  requiresService: CancellationRequiresService;
  minDaysNotice: number;
  refundPercent: number;
  /** Where the refund goes:
   *  - 'wallet': auto-credited to the customer's DR7 Wallet on cancel.
   *  - 'card':   manual refund via Nexi terminal — the cancellation
   *              flow does NOT auto-credit; admin processes externally.
   */
  refundMethod: RefundMethod;
  isActive: boolean;
}

const DEFAULT_RULES: CancellationRule[] = [
  { id: 'standard',   label: 'Cancellazione standard',  appliesTo: 'all',     requiresService: 'none',       minDaysNotice: 5, refundPercent: 90, refundMethod: 'wallet', isActive: true },
  { id: 'dr7_flex',   label: 'DR7 Flex (noleggio)',     appliesTo: 'rental',  requiresService: 'dr7_flex',   minDaysNotice: 0, refundPercent: 90, refundMethod: 'wallet', isActive: true },
  { id: 'prime_flex', label: 'Prime Flex (lavaggio)',   appliesTo: 'carwash', requiresService: 'prime_flex', minDaysNotice: 0, refundPercent: 90, refundMethod: 'wallet', isActive: true },
  { id: 'elite',      label: 'Elite Member',            appliesTo: 'all',     requiresService: 'elite',      minDaysNotice: 0, refundPercent: 90, refundMethod: 'wallet', isActive: true },
];

let cache: CancellationRule[] | null = null;
let pending: Promise<CancellationRule[]> | null = null;

interface RawRule {
  id?: unknown;
  label?: unknown;
  applies_to?: unknown;
  requires_service?: unknown;
  min_days_notice?: unknown;
  refund_pct?: unknown;
  refund_method?: unknown;
  is_active?: unknown;
}

async function fetchOnce(): Promise<CancellationRule[]> {
  if (cache) return cache;
  if (pending) return pending;
  pending = (async () => {
    try {
      const { data } = await supabase
        .from('centralina_pro_config')
        .select('config')
        .eq('id', 'main')
        .maybeSingle();
      const cfg = (data?.config ?? null) as Record<string, unknown> | null;
      const automations = cfg?.automations as Record<string, unknown> | undefined;
      const raw = automations?.cancellation_rules as RawRule[] | undefined;
      if (!Array.isArray(raw) || raw.length === 0) {
        cache = DEFAULT_RULES;
        return DEFAULT_RULES;
      }
      const rules: CancellationRule[] = raw
        .map((r) => {
          const appliesTo: CancellationAppliesTo =
            r.applies_to === 'rental' || r.applies_to === 'carwash' ? r.applies_to : 'all';
          const requiresService: CancellationRequiresService =
            r.requires_service === 'dr7_flex' || r.requires_service === 'prime_flex' || r.requires_service === 'elite'
              ? r.requires_service
              : 'none';
          return {
            id: typeof r.id === 'string' ? r.id : String(r.id ?? ''),
            label: typeof r.label === 'string' ? r.label : 'Regola',
            appliesTo,
            requiresService,
            minDaysNotice: typeof r.min_days_notice === 'number' ? r.min_days_notice : Number(r.min_days_notice ?? 0),
            refundPercent: typeof r.refund_pct === 'number' ? r.refund_pct : Number(r.refund_pct ?? 0),
            refundMethod: r.refund_method === 'card' ? 'card' as const : 'wallet' as const,
            isActive: r.is_active !== false,
          };
        })
        .filter((r) => r.id && Number.isFinite(r.minDaysNotice) && Number.isFinite(r.refundPercent));
      cache = rules;
      return rules;
    } catch {
      cache = DEFAULT_RULES;
      return DEFAULT_RULES;
    } finally {
      pending = null;
    }
  })();
  return pending;
}

export interface BookingContext {
  daysUntilPickup: number;
  /** 'rental' for car rental, 'carwash' for car wash. Other types treated as 'rental' fallback. */
  serviceType: 'rental' | 'carwash';
  hasDr7Flex: boolean;
  hasPrimeFlex: boolean;
  isElite: boolean;
}

/**
 * Pick the BEST applicable rule for the booking context.
 *
 * Filtering:
 *   - rule must be active
 *   - rule.appliesTo matches the booking serviceType ('all' matches everything)
 *   - rule.requiresService is satisfied by context (none / dr7_flex / prime_flex / elite)
 *   - context.daysUntilPickup ≥ rule.minDaysNotice
 *
 * Among eligible rules, the one with the HIGHEST refundPercent wins
 * (best deal for the customer). Returns null if no rule matches.
 */
export function pickRule(rules: CancellationRule[], ctx: BookingContext): CancellationRule | null {
  const eligible = rules
    .filter((r) => r.isActive)
    .filter((r) => {
      if (r.appliesTo === 'rental' && ctx.serviceType !== 'rental') return false;
      if (r.appliesTo === 'carwash' && ctx.serviceType !== 'carwash') return false;
      if (r.requiresService === 'dr7_flex' && !ctx.hasDr7Flex) return false;
      if (r.requiresService === 'prime_flex' && !ctx.hasPrimeFlex) return false;
      if (r.requiresService === 'elite' && !ctx.isElite) return false;
      return ctx.daysUntilPickup >= r.minDaysNotice;
    })
    .sort((a, b) => b.refundPercent - a.refundPercent);
  return eligible[0] ?? null;
}

/** React hook returning the current cancellation rules array. */
export function useCancellationRules(): CancellationRule[] {
  const [rules, setRules] = useState<CancellationRule[]>(cache || DEFAULT_RULES);
  useEffect(() => {
    let cancelled = false;
    fetchOnce().then((p) => {
      if (!cancelled) setRules(p);
    });
    return () => { cancelled = true; };
  }, []);
  return rules;
}

/**
 * Backwards-compat: returns the rule with the highest min_days_notice
 * (or the default standard rule). Used for displaying "main" policy text.
 */
export interface CancellationPolicy {
  thresholdDays: number;
  refundPercent: number;
  penaltyPercent: number;
}

export function useCancellationPolicy(): CancellationPolicy {
  const rules = useCancellationRules();
  // For the displayed policy page, use the STANDARD rule (no service
  // requirement) with the highest threshold — that's the public-facing
  // baseline. Flex / Elite are documented separately on the page.
  const main = [...rules]
    .filter((r) => r.isActive && r.requiresService === 'none')
    .sort((a, b) => b.minDaysNotice - a.minDaysNotice)[0];
  if (!main) return { thresholdDays: 0, refundPercent: 0, penaltyPercent: 100 };
  return {
    thresholdDays: main.minDaysNotice,
    refundPercent: main.refundPercent,
    penaltyPercent: Math.max(0, 100 - main.refundPercent),
  };
}

/** Force re-fetch on next read (call after admin edits if needed). */
export function invalidateCancellationPolicyCache(): void {
  cache = null;
  pending = null;
}
