/**
 * Shared CORS utility for Netlify Functions.
 * Supports both www and non-www origins to prevent cross-origin redirect issues.
 */

const ALLOWED_ORIGINS = [
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
