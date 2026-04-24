// Converts a location slug (as stored on booking.pickup_location /
// booking.dropoff_location) to a human-readable label for customer-facing
// messages (WhatsApp, email, calendar). Without this, the raw slug like
// "dr7_cagliari" leaks into the confirmation message.
//
// Kept in sync by hand with data/sardegnaLocations.ts — the Netlify bundler
// doesn't reliably reach that file, so we inline the lookup here. Add new
// slugs here when they're added to that file.

const LOCATION_LABELS: Record<string, string> = {
  // Legacy DR7 office slug
  dr7_office: 'DR7 Cagliari - Viale Marconi 229, 09131 Cagliari (CA)',

  // Current DR7 office slug
  dr7_cagliari: 'DR7 Cagliari - Viale Marconi 229, 09131 Cagliari (CA)',

  // Airports
  'cagliari-aeroporto': 'Cagliari - Aeroporto Elmas',
  'olbia-aeroporto': 'Olbia - Aeroporto Costa Smeralda',
  'alghero-aeroporto': 'Alghero - Aeroporto Fertilia',

  // Ports
  'cagliari-porto': 'Cagliari - Porto',
  'olbia-porto': 'Olbia - Porto',
  'porto-torres-porto': 'Porto Torres - Porto',
  'arbatax-porto': 'Arbatax - Porto',
  'golfo-aranci-porto': 'Golfo Aranci - Porto',
  'santa-teresa-gallura-porto': 'Santa Teresa Gallura - Porto',
  'palau-porto': 'Palau - Porto',
  'la-maddalena-porto': 'La Maddalena - Porto',
  'carloforte-porto': 'Carloforte - Porto',
}

export function formatLocation(raw: string | null | undefined): string {
  if (!raw) return ''
  const trimmed = String(raw).trim()
  if (!trimmed) return ''
  if (LOCATION_LABELS[trimmed]) return LOCATION_LABELS[trimmed]
  // Unknown slug — convert snake/kebab case back to a readable fallback
  // ("porto-cervo" → "Porto Cervo") rather than leaking the raw identifier.
  if (/^[a-z0-9]+([_-][a-z0-9]+)+$/.test(trimmed)) {
    return trimmed
      .split(/[_-]/)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
  }
  return trimmed
}
