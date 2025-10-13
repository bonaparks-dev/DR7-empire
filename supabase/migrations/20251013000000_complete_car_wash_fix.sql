-- ========================================
-- COMPLETE CAR WASH BOOKING FIX
-- This adds ALL missing columns for car wash bookings
-- Safe to run multiple times (uses IF NOT EXISTS)
-- ========================================

-- 1. Add user_id (snake_case version for new code)
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS user_id uuid;

-- 2. Add status column
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS status character varying DEFAULT 'pending';

-- 3. Add appointment_time column
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS appointment_time character varying;

-- 4. Add booking_details column
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS booking_details jsonb;

-- 5. Add price_total (snake_case version)
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS price_total numeric;

-- 6. Add customer fields
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS customer_name character varying;

ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS customer_email character varying;

ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS customer_phone character varying;

-- 7. Add booked_at (snake_case version)
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS booked_at timestamp with time zone DEFAULT now();

-- 8. Add service fields (in case they're missing)
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS service_type character varying;

ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS service_name character varying;

ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS service_id character varying;

-- 9. Add vehicle fields (in case they're missing)
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS vehicle_type character varying;

ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS vehicle_name character varying;

-- 10. Add payment fields (in case they're missing)
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS payment_status character varying DEFAULT 'pending';

ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id character varying;

-- 11. Add appointment_date (in case it's missing)
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS appointment_date timestamp with time zone;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_appointment_time ON public.bookings(appointment_time);
CREATE INDEX IF NOT EXISTS idx_bookings_appointment_date ON public.bookings(appointment_date);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON public.bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_service_type ON public.bookings(service_type);

-- Add helpful comments
COMMENT ON COLUMN public.bookings.status IS 'Booking status: pending, confirmed, completed, cancelled';
COMMENT ON COLUMN public.bookings.appointment_time IS 'Scheduled appointment time (HH:MM format)';
COMMENT ON COLUMN public.bookings.booking_details IS 'Additional booking information as JSON';
COMMENT ON COLUMN public.bookings.service_type IS 'Type of service: car_rental, car_wash, etc.';

-- ========================================
-- UPDATE RLS POLICIES
-- ========================================

-- Drop existing policies
DROP POLICY IF EXISTS "Allow users to view their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Allow authenticated users to insert their own bookings" ON public.bookings;

-- Create new policies that work with BOTH userId and user_id
CREATE POLICY "Allow users to view their own bookings"
ON public.bookings
FOR SELECT TO authenticated
USING (
  -- Support both camelCase userId (old) and snake_case user_id (new)
  "userId"::text = auth.uid()::text OR
  user_id = auth.uid()
);

CREATE POLICY "Allow authenticated users to insert their own bookings"
ON public.bookings
FOR INSERT TO authenticated
WITH CHECK (
  -- Allow insert with either userId or user_id
  "userId"::text = auth.uid()::text OR
  user_id = auth.uid()
);

-- Also add UPDATE policy in case it's needed
DROP POLICY IF EXISTS "Allow users to update their own bookings" ON public.bookings;
CREATE POLICY "Allow users to update their own bookings"
ON public.bookings
FOR UPDATE TO authenticated
USING (
  "userId"::text = auth.uid()::text OR
  user_id = auth.uid()
);

-- ========================================
-- DONE!
-- ========================================
