declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

type GtagParams = Record<string, string | number | boolean | undefined | null>;

export function trackEvent(name: string, params: GtagParams = {}): void {
  if (typeof window === 'undefined') return;
  const gtag = window.gtag;
  if (typeof gtag !== 'function') return;
  try {
    gtag('event', name, params);
  } catch {
    // GA4 unavailable; never let analytics break UI flow.
  }
}

const FIRED_BOOKINGS = new Set<string>();

export function trackBookingCompleted(booking: {
  id: string | number;
  price_total?: number | null;
  service_type?: string | null;
  vehicle_name?: string | null;
  service_name?: string | null;
}): void {
  const id = String(booking.id);
  if (FIRED_BOOKINGS.has(id)) return;
  FIRED_BOOKINGS.add(id);

  const valueEuro = typeof booking.price_total === 'number'
    ? Math.round(booking.price_total) / 100
    : 0;

  trackEvent('booking_completed', {
    transaction_id: id,
    value: valueEuro,
    currency: 'EUR',
    service_type: booking.service_type || 'rental',
    item_name: booking.vehicle_name || booking.service_name || '',
  });

  trackEvent('purchase', {
    transaction_id: id,
    value: valueEuro,
    currency: 'EUR',
  });
}

export function trackPhoneCall(source: string): void {
  trackEvent('phone_call', { source });
  trackEvent('click_to_call', { source });
}
