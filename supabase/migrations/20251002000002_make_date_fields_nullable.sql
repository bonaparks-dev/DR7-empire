-- Make pickup and return date/time fields nullable
-- These fields might be empty when booking is in draft state

ALTER TABLE public.bookings
ALTER COLUMN "pickupDate" DROP NOT NULL,
ALTER COLUMN "pickupTime" DROP NOT NULL,
ALTER COLUMN "returnDate" DROP NOT NULL,
ALTER COLUMN "returnTime" DROP NOT NULL;
