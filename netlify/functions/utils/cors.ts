/**
 * Shared CORS utility for Netlify Functions.
 * Supports both www and non-www origins to prevent cross-origin redirect issues.
 */

const ALLOWED_ORIGINS = [
  // 2026-06-05: migrazione dominio. Nuovi domini aggiunti A FIANCO dei vecchi
  // così entrambi funzionano durante la transizione (dr7empire.com -> dr7.app,
  // admin -> platform.dr7.app). I vecchi verranno rimossi a bascula completata.
  'https://dr7.app',
  'https://www.dr7.app',
  'https://platform.dr7.app',
  'https://dr7ai.com',
  'https://www.dr7ai.com',
  'https://dr7empire.com',
  'https://www.dr7empire.com',
];

export function getCorsOrigin(requestOrigin: string | undefined): string {
  const origin = requestOrigin || '';
  const envOrigin = process.env.ALLOWED_ORIGIN;

  if (envOrigin && origin === envOrigin) return origin;
  if (ALLOWED_ORIGINS.includes(origin)) return origin;

  return envOrigin || ALLOWED_ORIGINS[0];
}
