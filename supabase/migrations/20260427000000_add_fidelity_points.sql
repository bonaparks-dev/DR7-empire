-- Fidelity Card: 1 € spent on car wash = 1 punto.
-- 250 punti = max line. When reached, auto-generate a €25 voucher and reset
-- the line to (current - 250) so any overflow rolls forward (e.g. 260 → 10/250).
-- Points are accumulated only from CAR WASH bookings on the website.

ALTER TABLE public.customers_extended
  ADD COLUMN IF NOT EXISTS fidelity_points INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fidelity_lifetime_points INTEGER DEFAULT 0;

COMMENT ON COLUMN public.customers_extended.fidelity_points IS
  'Loyalty points balance, 0..250. Resets after a €25 voucher is auto-issued.';

COMMENT ON COLUMN public.customers_extended.fidelity_lifetime_points IS
  'Total points ever earned, never decreases. Useful for stats and tier upgrades.';

-- Track which bookings have already awarded points, so retries / double webhooks
-- never double-count. One row per booking.id.
CREATE TABLE IF NOT EXISTS public.fidelity_point_awards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE CASCADE,
  customer_extended_id UUID REFERENCES public.customers_extended(id) ON DELETE SET NULL,
  points_awarded INTEGER NOT NULL,
  voucher_code TEXT,
  voucher_issued_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fidelity_awards_customer ON public.fidelity_point_awards(customer_extended_id);

ALTER TABLE public.fidelity_point_awards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fidelity_awards_service_role" ON public.fidelity_point_awards;
CREATE POLICY "fidelity_awards_service_role"
  ON public.fidelity_point_awards
  FOR ALL
  USING (true)
  WITH CHECK (true);
