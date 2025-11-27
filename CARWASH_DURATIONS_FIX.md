# Car Wash Durations - Complete Fix

## Current System Status

The main website (`dr7empire.com`) **already has correct durations**:
- ✅ LAVAGGIO COMPLETO (€25) = 1 hour
- ✅ LAVAGGIO TOP (€49) = 2 hours
- ✅ LAVAGGIO VIP (€75) = 3 hours
- ✅ LAVAGGIO DR7 LUXURY (€99) = 4 hours

**Location:** `pages/CarWashBookingPage.tsx:69-79`

## What Needs to be Fixed

### 1. Database Duration Fields
Run this SQL in Supabase to fix the `car_wash_services` table:

```sql
-- Fix car wash service durations
UPDATE car_wash_services
SET duration = '1 hour'
WHERE price = 25;

UPDATE car_wash_services
SET duration = '2 hours'
WHERE price = 49;

UPDATE car_wash_services
SET duration = '3 hours'
WHERE price = 75;

UPDATE car_wash_services
SET duration = '4 hours'
WHERE price = 99;

-- Verify
SELECT name, name_en, price, duration
FROM car_wash_services
ORDER BY price;
```

### 2. How Duration Blocking Works

**Main Website (`dr7empire.com`):**
- File: `pages/CarWashBookingPage.tsx`
- Function: `getServiceDurationInHours(price)` - Line 69
- Slot blocking: Lines 296-310 (checks if time slots overlap with existing bookings)
- **Status:** ✅ Already correct!

**Admin Panel:**
- Admin creates bookings with price → system calculates duration automatically
- When displaying in calendar, it reads from database
- **Status:** Will be correct after running SQL above

### 3. Email Notifications

Car wash booking emails are sent from:
- Main site: Stripe webhook or booking confirmation
- Admin: Manual booking creation

The duration shown in emails comes from the `car_wash_services` table.

### 4. Google Calendar Integration

When admin creates a car wash booking:
- Start time: `appointment_time`
- End time: Calculated as `appointment_time + duration`
- **Fix needed:** Admin panel must calculate end time based on service price

## Testing Checklist

After running the SQL:

- [ ] Check database: `SELECT * FROM car_wash_services;`
- [ ] Book €25 service on website → verify 1-hour slot blocked
- [ ] Book €49 service on website → verify 2-hour slot blocked
- [ ] Book €75 service on website → verify 3-hour slot blocked
- [ ] Book €99 service on website → verify 4-hour slot blocked
- [ ] Check email shows correct duration
- [ ] Check Google Calendar event has correct end time
- [ ] Verify admin panel displays correct duration

## Files that Use Duration

1. **Main Website:**
   - `pages/CarWashBookingPage.tsx` - Slot calculation ✅
   - `pages/CarWashServicesPage.tsx` - Service display
   - `hooks/useRealtimeBookings.ts` - Real-time availability

2. **Admin Panel:**
   - `src/pages/admin/components/CalendarTab.tsx` - Display only
   - `src/pages/admin/components/CarWashTab.tsx` - Service management

3. **Database:**
   - `car_wash_services` table - Duration field needs update
