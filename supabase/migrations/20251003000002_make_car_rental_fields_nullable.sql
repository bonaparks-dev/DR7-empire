-- Make all car rental specific fields nullable
-- Car wash bookings don't use these fields, only appointment_date

-- Check and make nullable if NOT NULL
DO $$
BEGIN
    -- pickup_date (snake_case version)
    BEGIN
        ALTER TABLE public.bookings ALTER COLUMN pickup_date DROP NOT NULL;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'pickup_date: %', SQLERRM;
    END;

    -- dropoff_date (snake_case version)
    BEGIN
        ALTER TABLE public.bookings ALTER COLUMN dropoff_date DROP NOT NULL;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'dropoff_date: %', SQLERRM;
    END;

    -- pickupDate (camelCase version if exists)
    BEGIN
        ALTER TABLE public.bookings ALTER COLUMN "pickupDate" DROP NOT NULL;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'pickupDate: %', SQLERRM;
    END;

    -- pickupTime (camelCase version if exists)
    BEGIN
        ALTER TABLE public.bookings ALTER COLUMN "pickupTime" DROP NOT NULL;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'pickupTime: %', SQLERRM;
    END;

    -- returnDate (camelCase version if exists)
    BEGIN
        ALTER TABLE public.bookings ALTER COLUMN "returnDate" DROP NOT NULL;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'returnDate: %', SQLERRM;
    END;

    -- returnTime (camelCase version if exists)
    BEGIN
        ALTER TABLE public.bookings ALTER COLUMN "returnTime" DROP NOT NULL;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'returnTime: %', SQLERRM;
    END;

    -- vehicle_name should be nullable too (car wash uses placeholder)
    BEGIN
        ALTER TABLE public.bookings ALTER COLUMN vehicle_name DROP NOT NULL;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'vehicle_name: %', SQLERRM;
    END;

END $$;

-- Add comment explaining the nullable fields
COMMENT ON COLUMN public.bookings.pickup_date IS 'Required for car rentals, NULL for car wash bookings';
COMMENT ON COLUMN public.bookings.dropoff_date IS 'Required for car rentals, NULL for car wash bookings';
COMMENT ON COLUMN public.bookings.appointment_date IS 'Required for car wash, NULL for car rentals';
