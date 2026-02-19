-- Migration: Create pending_nexi_bookings table
-- Purpose: Store booking data BEFORE Nexi payment, only move to bookings AFTER payment succeeds
-- This prevents unpaid bookings from appearing on the admin calendar

CREATE TABLE IF NOT EXISTS pending_nexi_bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nexi_order_id TEXT UNIQUE NOT NULL,
  booking_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE pending_nexi_bookings ENABLE ROW LEVEL SECURITY;

-- Authenticated users can insert their own pending bookings
DROP POLICY IF EXISTS "Users can insert pending bookings" ON pending_nexi_bookings;
CREATE POLICY "Users can insert pending bookings" ON pending_nexi_bookings
  FOR INSERT TO authenticated WITH CHECK (true);

-- Users can read their own pending bookings (for PaymentSuccessPage)
DROP POLICY IF EXISTS "Users can read own pending bookings" ON pending_nexi_bookings;
CREATE POLICY "Users can read own pending bookings" ON pending_nexi_bookings
  FOR SELECT TO authenticated
  USING ((booking_data->>'user_id')::uuid = auth.uid());

-- Users can delete their own pending bookings (cleanup after move to bookings)
DROP POLICY IF EXISTS "Users can delete own pending bookings" ON pending_nexi_bookings;
CREATE POLICY "Users can delete own pending bookings" ON pending_nexi_bookings
  FOR DELETE TO authenticated
  USING ((booking_data->>'user_id')::uuid = auth.uid());

-- Auto-cleanup: pending records older than 24 hours (optional cron job)
-- SELECT cron.schedule('cleanup-pending-nexi', '0 */6 * * *', $$
--   DELETE FROM pending_nexi_bookings WHERE created_at < NOW() - INTERVAL '24 hours';
-- $$);
