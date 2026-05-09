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

export interface CancellationRule {
  id: string;
  label: string;
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
  { id: 'standard', label: 'Cancellazione standard', minDaysNotice: 5, refundPercent: 90, refundMethod: 'wallet', isActive: true },
];

let cache: CancellationRule[] | null = null;
let pending: Promise<CancellationRule[]> | null = null;

interface RawRule {
  id?: unknown;
  label?: unknown;
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
        .map((r) => ({
          id: typeof r.id === 'string' ? r.id : String(r.id ?? ''),
          label: typeof r.label === 'string' ? r.label : 'Regola',
          minDaysNotice: typeof r.min_days_notice === 'number' ? r.min_days_notice : Number(r.min_days_notice ?? 0),
          refundPercent: typeof r.refund_pct === 'number' ? r.refund_pct : Number(r.refund_pct ?? 0),
          refundMethod: r.refund_method === 'card' ? 'card' as const : 'wallet' as const,
          isActive: r.is_active !== false,
        }))
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

/**
 * Pick the matching active rule for `daysUntilPickup`.
 * Returns null if no active rule matches (cancellation blocked).
 */
export function pickRule(rules: CancellationRule[], daysUntilPickup: number): CancellationRule | null {
  const sorted = [...rules]
    .filter((r) => r.isActive)
    .sort((a, b) => b.minDaysNotice - a.minDaysNotice);
  return sorted.find((r) => daysUntilPickup >= r.minDaysNotice) ?? null;
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
  const main = [...rules]
    .filter((r) => r.isActive)
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
