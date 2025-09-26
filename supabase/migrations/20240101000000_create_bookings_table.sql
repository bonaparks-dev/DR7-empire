CREATE TABLE bookings (
    "bookingId" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" uuid REFERENCES auth.users(id),
    "itemId" character varying,
    "itemName" character varying,
    "image" text,
    "itemCategory" character varying,
    "pickupDate" date,
    "pickupTime" time without time zone,
    "returnDate" date,
    "returnTime" time without time zone,
    "duration" character varying,
    "totalPrice" numeric,
    "currency" character varying,
    "customer" jsonb,
    "driverLicenseImage" text,
    "paymentMethod" character varying,
    "bookedAt" timestamp with time zone DEFAULT now(),
    "pickupLocation" character varying,
    "insuranceOption" character varying,
    "extras" jsonb
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to insert their own bookings"
ON public.bookings
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = "userId");

CREATE POLICY "Allow users to view their own bookings"
ON public.bookings
FOR SELECT TO authenticated
USING (auth.uid() = "userId");