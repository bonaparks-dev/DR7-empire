-- Add vehicle_type and vehicle_name columns to bookings table
-- These fields are used by CarBookingWizard to store vehicle information

ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS "vehicle_type" character varying,
ADD COLUMN IF NOT EXISTS "vehicle_name" character varying;
