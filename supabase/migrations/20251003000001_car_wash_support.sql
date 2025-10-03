-- Car Wash Booking Support
-- This migration ensures all necessary columns exist for car wash bookings

-- Add service_type column if it doesn't exist
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS service_type TEXT;

-- Add service_name column if it doesn't exist
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS service_name TEXT;

-- Add service_id column if it doesn't exist
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS service_id TEXT;

-- Add customer fields if they don't exist
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS customer_name TEXT,
ADD COLUMN IF NOT EXISTS customer_email TEXT,
ADD COLUMN IF NOT EXISTS customer_phone TEXT;

-- Add appointment_date if it doesn't exist
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS appointment_date TIMESTAMP WITH TIME ZONE;

-- Create index on service_type for faster queries
CREATE INDEX IF NOT EXISTS idx_bookings_service_type ON public.bookings(service_type);

-- Create index on appointment_date for calendar views
CREATE INDEX IF NOT EXISTS idx_bookings_appointment_date ON public.bookings(appointment_date);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);

-- Add comment to service_type column
COMMENT ON COLUMN public.bookings.service_type IS 'Type of service: car_rental, car_wash, etc.';

-- Add comment to appointment_date column
COMMENT ON COLUMN public.bookings.appointment_date IS 'Scheduled appointment time for services like car wash';
