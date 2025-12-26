-- Add Nexi payment tracking fields to bookings table
-- This migration adds fields needed for Nexi X-Pay payment integration

-- Add Nexi payment fields to bookings table
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS nexi_payment_id TEXT,
ADD COLUMN IF NOT EXISTS nexi_authorization_code TEXT,
ADD COLUMN IF NOT EXISTS nexi_error_message TEXT;

-- Add index for faster lookups by Nexi payment ID
CREATE INDEX IF NOT EXISTS idx_bookings_nexi_payment_id ON bookings(nexi_payment_id);

-- Add comment for documentation
COMMENT ON COLUMN bookings.nexi_payment_id IS 'Transaction code (codTrans) from Nexi X-Pay';
COMMENT ON COLUMN bookings.nexi_authorization_code IS 'Authorization code (codAut) from Nexi for successful payments';
COMMENT ON COLUMN bookings.nexi_error_message IS 'Error message from Nexi if payment failed';
