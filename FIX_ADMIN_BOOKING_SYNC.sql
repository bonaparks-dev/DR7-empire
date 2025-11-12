-- ========================================
-- FIX: Admin Panel Bookings Not Blocking Website Slots
-- ========================================
-- This script verifies and fixes the issue where bookings created
-- in the admin panel don't block slots on the main website
-- ========================================

-- Step 1: Check if migration 20251112000000 was applied
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc
        WHERE proname = 'check_car_wash_availability'
    ) THEN
        RAISE NOTICE '✅ check_car_wash_availability function exists';
    ELSE
        RAISE WARNING '❌ check_car_wash_availability function MISSING - migration not applied!';
    END IF;

    IF EXISTS (
        SELECT 1 FROM pg_proc
        WHERE proname = 'check_vehicle_availability'
    ) THEN
        RAISE NOTICE '✅ check_vehicle_availability function exists';
    ELSE
        RAISE WARNING '❌ check_vehicle_availability function MISSING - migration not applied!';
    END IF;
END $$;

-- Step 2: Check if triggers are active
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'validate_car_wash_booking'
    ) THEN
        RAISE NOTICE '✅ validate_car_wash_booking trigger exists';
    ELSE
        RAISE WARNING '❌ validate_car_wash_booking trigger MISSING!';
    END IF;

    IF EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'validate_vehicle_booking'
    ) THEN
        RAISE NOTICE '✅ validate_vehicle_booking trigger exists';
    ELSE
        RAISE WARNING '❌ validate_vehicle_booking trigger MISSING!';
    END IF;
END $$;

-- Step 3: Check if unified bookings migration was applied
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'bookings'
        AND column_name = 'booking_source'
    ) THEN
        RAISE NOTICE '✅ booking_source column exists';
    ELSE
        RAISE WARNING '❌ booking_source column MISSING - unified migration not applied!';
    END IF;

    IF EXISTS (
        SELECT 1 FROM pg_proc
        WHERE proname = 'check_unified_vehicle_availability'
    ) THEN
        RAISE NOTICE '✅ check_unified_vehicle_availability function exists';
    ELSE
        RAISE WARNING '❌ check_unified_vehicle_availability function MISSING!';
    END IF;

    IF EXISTS (
        SELECT 1 FROM pg_proc
        WHERE proname = 'check_unified_carwash_availability'
    ) THEN
        RAISE NOTICE '✅ check_unified_carwash_availability function exists';
    ELSE
        RAISE WARNING '❌ check_unified_carwash_availability function MISSING!';
    END IF;
END $$;

-- Step 4: Check realtime replication
SELECT
    CASE
        WHEN EXISTS (
            SELECT 1 FROM pg_publication_tables
            WHERE pubname = 'supabase_realtime'
            AND tablename = 'bookings'
        )
        THEN '✅ Realtime replication is ENABLED for bookings table'
        ELSE '❌ Realtime replication is DISABLED for bookings table'
    END as realtime_status;

-- Step 5: Test query - Show recent bookings with source
SELECT
    id,
    customer_name,
    service_type,
    COALESCE(vehicle_name, service_name) as service,
    COALESCE(
        appointment_date::text || ' ' || appointment_time,
        pickup_date::text
    ) as booking_time,
    status,
    payment_status,
    booking_source,
    created_at
FROM bookings
WHERE created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC
LIMIT 20;

-- Step 6: Check for any conflicting bookings that weren't caught
WITH car_wash_conflicts AS (
    SELECT
        b1.id as booking1_id,
        b1.customer_name as customer1,
        b1.appointment_time as time1,
        b2.id as booking2_id,
        b2.customer_name as customer2,
        b2.appointment_time as time2,
        b1.booking_source as source1,
        b2.booking_source as source2,
        DATE(b1.appointment_date) as conflict_date
    FROM bookings b1
    INNER JOIN bookings b2 ON
        b1.id != b2.id
        AND b1.service_type = 'car_wash'
        AND b2.service_type = 'car_wash'
        AND DATE(b1.appointment_date) = DATE(b2.appointment_date)
        AND b1.status IN ('confirmed', 'pending')
        AND b2.status IN ('confirmed', 'pending')
        AND b1.payment_status IN ('succeeded', 'completed', 'paid')
        AND b2.payment_status IN ('succeeded', 'completed', 'paid')
    WHERE
        -- Check for time overlap
        (EXTRACT(HOUR FROM b1.appointment_time::TIME) * 60 + EXTRACT(MINUTE FROM b1.appointment_time::TIME)) <
        (EXTRACT(HOUR FROM b2.appointment_time::TIME) * 60 + EXTRACT(MINUTE FROM b2.appointment_time::TIME) + (CEIL((b2.price_total / 100.0) / 25.0) * 60))
        AND
        (EXTRACT(HOUR FROM b1.appointment_time::TIME) * 60 + EXTRACT(MINUTE FROM b1.appointment_time::TIME) + (CEIL((b1.price_total / 100.0) / 25.0) * 60)) >
        (EXTRACT(HOUR FROM b2.appointment_time::TIME) * 60 + EXTRACT(MINUTE FROM b2.appointment_time::TIME))
)
SELECT
    CASE
        WHEN COUNT(*) = 0 THEN '✅ No car wash conflicts found'
        ELSE '❌ Found ' || COUNT(*) || ' car wash conflicts!'
    END as car_wash_status
FROM car_wash_conflicts;

-- Step 7: Show conflicts if any
SELECT
    booking1_id,
    customer1,
    time1,
    source1,
    booking2_id,
    customer2,
    time2,
    source2,
    conflict_date
FROM (
    SELECT
        b1.id as booking1_id,
        b1.customer_name as customer1,
        b1.appointment_time as time1,
        b2.id as booking2_id,
        b2.customer_name as customer2,
        b2.appointment_time as time2,
        b1.booking_source as source1,
        b2.booking_source as source2,
        DATE(b1.appointment_date) as conflict_date
    FROM bookings b1
    INNER JOIN bookings b2 ON
        b1.id < b2.id -- Avoid duplicates
        AND b1.service_type = 'car_wash'
        AND b2.service_type = 'car_wash'
        AND DATE(b1.appointment_date) = DATE(b2.appointment_date)
        AND b1.status IN ('confirmed', 'pending')
        AND b2.status IN ('confirmed', 'pending')
        AND b1.payment_status IN ('succeeded', 'completed', 'paid')
        AND b2.payment_status IN ('succeeded', 'completed', 'paid')
    WHERE
        -- Check for time overlap
        (EXTRACT(HOUR FROM b1.appointment_time::TIME) * 60 + EXTRACT(MINUTE FROM b1.appointment_time::TIME)) <
        (EXTRACT(HOUR FROM b2.appointment_time::TIME) * 60 + EXTRACT(MINUTE FROM b2.appointment_time::TIME) + (CEIL((b2.price_total / 100.0) / 25.0) * 60))
        AND
        (EXTRACT(HOUR FROM b1.appointment_time::TIME) * 60 + EXTRACT(MINUTE FROM b1.appointment_time::TIME) + (CEIL((b1.price_total / 100.0) / 25.0) * 60)) >
        (EXTRACT(HOUR FROM b2.appointment_time::TIME) * 60 + EXTRACT(MINUTE FROM b2.appointment_time::TIME))
) conflicts;

-- Step 8: If migrations are missing, show instructions
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc
        WHERE proname = 'check_unified_vehicle_availability'
    ) THEN
        RAISE WARNING '
========================================
MIGRATIONS MISSING - APPLY THESE FILES:
========================================
1. supabase/migrations/20251112000000_add_booking_validation_triggers.sql
2. supabase/migrations/20251112000003_unified_bookings_only.sql

Run in Supabase SQL Editor or via Supabase CLI:
supabase db push
========================================
';
    END IF;
END $$;
