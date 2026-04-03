-- Add 'pending' to dr7_club_subscriptions status constraint
-- Subscriptions start as 'pending' until Nexi payment is confirmed
ALTER TABLE dr7_club_subscriptions DROP CONSTRAINT IF EXISTS dr7_club_subscriptions_status_check;
ALTER TABLE dr7_club_subscriptions ADD CONSTRAINT dr7_club_subscriptions_status_check
  CHECK (status IN ('pending', 'active', 'cancelled', 'expired'));

-- Allow authenticated users to insert their own subscriptions (needed for signup flow)
CREATE POLICY "Users can insert own club subscriptions"
  ON dr7_club_subscriptions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Allow authenticated users to update their own subscriptions (for saving nexi_order_id)
CREATE POLICY "Users can update own club subscriptions"
  ON dr7_club_subscriptions FOR UPDATE TO authenticated
  USING (user_id = auth.uid());
