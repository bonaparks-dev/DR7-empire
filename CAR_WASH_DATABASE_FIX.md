# Car Wash Booking - Database Fix

## Problem
Car wash bookings were failing with error: `null value in column "pickup_date" violates not-null constraint`

**Root Cause**: The `bookings` table was designed for car rentals and has NOT NULL constraints on rental-specific fields like `pickup_date`, `dropoff_date`, etc. Car wash bookings don't use these fields - they only use `appointment_date`.

## Solution
Run the migration that makes all car rental fields nullable, so car wash bookings can work without them.

## 🔧 Steps to Fix

### 1. Run the Migration in Supabase

1. Go to your **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Copy the contents of `/supabase/migrations/20251003000002_make_car_rental_fields_nullable.sql`
4. Paste into SQL Editor
5. Click **Run**

### 2. Verify the Migration

Run this query to check that fields are now nullable:

```sql
SELECT
    column_name,
    is_nullable,
    data_type
FROM information_schema.columns
WHERE table_name = 'bookings'
  AND column_name IN (
    'pickup_date',
    'dropoff_date',
    'pickupDate',
    'returnDate',
    'vehicle_name'
  );
```

You should see `is_nullable = 'YES'` for all these columns.

### 3. Test Car Wash Booking

1. Go to `/car-wash-services`
2. Select any service (e.g., "LAVAGGIO COMPLETO")
3. Fill in the booking form:
   - Customer info (name, email, phone)
   - Date: **Select today or future date** (past dates blocked)
   - Time: Between 9:00 - 20:00
   - Additional service (optional)
4. Submit the booking
5. Should succeed without errors!

## 📋 What Changed

### Database Schema
**Before**: All these fields were `NOT NULL`
- `pickup_date`
- `dropoff_date`
- `pickupDate` (camelCase version)
- `returnDate` (camelCase version)
- `vehicle_name`

**After**: All these fields are now **nullable**
- Car rental bookings: Fill in pickup/dropoff dates
- Car wash bookings: Fill in appointment_date only
- Both service types can coexist in the same table

### Car Wash Booking Data
When a car wash booking is created, it now sends:
```javascript
{
  user_id: 'uuid-or-null',
  vehicle_type: 'car',                    // Placeholder
  vehicle_name: 'Car Wash Service',        // Placeholder
  service_type: 'car_wash',                // Identifies as car wash
  service_name: 'LAVAGGIO COMPLETO',
  service_id: 'full-clean',
  appointment_date: '2025-10-15T10:00:00Z', // Car wash appointment
  pickup_date: null,                       // Not needed for car wash
  dropoff_date: null,                      // Not needed for car wash
  // ... other fields
}
```

### Date Picker Fix
- **Before**: Users could select past dates from the calendar
- **After**:
  - Date picker `min` attribute set to today
  - Validation checks if date is in past
  - Clear error message: "La data non può essere nel passato" / "Date cannot be in the past"

## 🎯 Field Usage by Service Type

| Field | Car Rental | Car Wash |
|-------|-----------|----------|
| `pickup_date` / `dropoff_date` | ✅ Required | ❌ NULL |
| `appointment_date` | ❌ NULL | ✅ Required |
| `vehicle_name` | ✅ Actual car name | ✅ Placeholder "Car Wash Service" |
| `vehicle_type` | ✅ car/yacht/jet | ✅ Always "car" |
| `service_type` | ❌ NULL | ✅ "car_wash" |
| `service_name` | ✅ Car model | ✅ Wash package name |

## ✅ After Running the Migration

Your car wash booking system will:
- ✅ Accept bookings without `pickup_date` error
- ✅ Only allow future dates (no past dates)
- ✅ Validate working hours (Mon-Sat, 9AM-8PM)
- ✅ Block Sundays
- ✅ Work alongside car rental bookings in same table

## 🔍 Troubleshooting

### Still Getting "pickup_date" Error?
1. Verify migration ran successfully in Supabase SQL Editor
2. Check for any errors in the migration output
3. Try running the verification query above

### Date Picker Still Showing Past Dates?
- Clear browser cache and reload
- The frontend code has been updated to block past dates
- Validation will catch past dates even if picker allows them

### "vehicle_name" Still Required?
- Run the migration - it makes `vehicle_name` nullable too
- Car wash bookings now use placeholder value "Car Wash Service"

---

✅ **Ready to go!** Run the migration and car wash bookings will work perfectly.
