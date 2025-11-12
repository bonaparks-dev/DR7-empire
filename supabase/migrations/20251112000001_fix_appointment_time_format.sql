-- Ensure appointment_time is stored as plain text in HH:MM format
-- This prevents timezone conversion issues

-- Make sure the column is TEXT type, not TIME
ALTER TABLE public.bookings
ALTER COLUMN appointment_time TYPE TEXT;

-- Add a check constraint to ensure proper HH:MM format
ALTER TABLE public.bookings
DROP CONSTRAINT IF EXISTS appointment_time_format_check;

ALTER TABLE public.bookings
ADD CONSTRAINT appointment_time_format_check
CHECK (
  appointment_time IS NULL OR
  appointment_time ~ '^([0-1][0-9]|2[0-3]):[0-5][0-9]$'
);

-- Update the comment
COMMENT ON COLUMN public.bookings.appointment_time IS 'Scheduled appointment time in HH:MM format (24-hour, e.g., 16:30). Stored as plain text to avoid timezone conversion.';

-- Update any existing times that might have been corrupted
-- This will attempt to extract the time portion if it was stored as a timestamp
UPDATE public.bookings
SET appointment_time = TO_CHAR(appointment_time::TIMESTAMP, 'HH24:MI')
WHERE service_type = 'car_wash'
  AND appointment_time IS NOT NULL
  AND appointment_time !~ '^([0-1][0-9]|2[0-3]):[0-5][0-9]$';
