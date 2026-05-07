import type { TierClassification } from '../types';

/**
 * Classify a driver into Tier 1, Tier 2, or Blocked based on age and license years.
 *
 * Tier 1 (Fascia B): Age 21-25 OR license held 3-4 years
 * Tier 2 (Fascia A): Age 26-69 AND license held 5+ years
 * Blocked: All other cases (age <21, age >=70, license <3 years)
 */
export function classifyDriverTier(driverAge: number, licenseYears: number): TierClassification {
  const base = { driverAge, licenseYears };

  // Blocked cases
  if (driverAge < 21) {
    return { ...base, tier: 'BLOCKED', reason: 'Età minima 21 anni per il noleggio.' };
  }
  if (driverAge >= 70) {
    return { ...base, tier: 'BLOCKED', reason: 'Noleggio non disponibile per età superiore a 69 anni. Contattaci per una verifica personalizzata.' };
  }
  if (licenseYears < 3) {
    return { ...base, tier: 'BLOCKED', reason: 'Patente da almeno 3 anni richiesta. Contattaci per una verifica personalizzata.' };
  }

  // Tier 1 (Fascia B): Age 21-25 OR license 3-4 years
  if ((driverAge >= 21 && driverAge <= 25) || (licenseYears >= 3 && licenseYears <= 4)) {
    return { ...base, tier: 'TIER_1', reason: 'Profilo Tier 1 — Conducente giovane o patente recente' };
  }

  // Tier 2: Age 26-69 AND license 5+ years
  if (driverAge >= 26 && driverAge <= 69 && licenseYears >= 5) {
    return { ...base, tier: 'TIER_2', reason: 'Profilo Tier 2 — Conducente esperto' };
  }

  // Fallback blocked (shouldn't reach here but safety net)
  return { ...base, tier: 'BLOCKED', reason: 'Noleggio non disponibile con i requisiti forniti. Contattaci per una verifica personalizzata.' };
}
