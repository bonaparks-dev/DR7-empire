-- Simple approach: drop and recreate columns without NOT NULL
-- This ensures the constraints are removed

DO $$
BEGIN
    -- Try to alter each column individually
    BEGIN
        ALTER TABLE public.bookings ALTER COLUMN "pickupDate" DROP NOT NULL;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'pickupDate: %', SQLERRM;
    END;

    BEGIN
        ALTER TABLE public.bookings ALTER COLUMN "pickupTime" DROP NOT NULL;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'pickupTime: %', SQLERRM;
    END;

    BEGIN
        ALTER TABLE public.bookings ALTER COLUMN "returnDate" DROP NOT NULL;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'returnDate: %', SQLERRM;
    END;

    BEGIN
        ALTER TABLE public.bookings ALTER COLUMN "returnTime" DROP NOT NULL;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'returnTime: %', SQLERRM;
    END;
END $$;
