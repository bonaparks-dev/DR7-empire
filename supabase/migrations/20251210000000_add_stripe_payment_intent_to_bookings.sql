-- Add stripe_payment_intent_id and payment_status columns to bookings table
-- These fields are used to track Stripe payment information

ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id character varying,
ADD COLUMN IF NOT EXISTS payment_status character varying DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_method character varying;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_bookings_stripe_payment_intent ON public.bookings(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON public.bookings(payment_status);
