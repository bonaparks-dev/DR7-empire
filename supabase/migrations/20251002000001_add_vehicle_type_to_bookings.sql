-- Add vehicle_type column to bookings table
-- This field is used by CarBookingWizard to store the type of vehicle booked

ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS "vehicle_type" character varying;
