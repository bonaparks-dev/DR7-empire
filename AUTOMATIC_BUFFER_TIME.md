# Automatic 1h30 Buffer Between Bookings

## How It Works

The system **automatically** enforces a **1 hour 30 minutes** buffer between all vehicle bookings. No manual configuration needed!

## What Happens

### Scenario: M4 is booked until 9:30 AM on December 6th

1. **Existing booking ends**: December 6th at 9:30 AM
2. **Buffer automatically added**: +1h30
3. **Next booking can start**: December 6th at 11:00 AM

### Customer Experience

**Customer tries to book M4 on December 6th at 10:00 AM:**
- System checks existing bookings
- Finds booking ending at 9:30 AM
- Calculates: 9:30 AM + 1h30 = 11:00 AM
- Shows message: **"Questo veicolo sara disponibile dopo le 11:00 (tempo di preparazione 1h30). Per favore scegli un orario successivo."**

**Customer changes pickup to 11:00 AM or later:**
- No conflicts
- Booking proceeds normally

## Technical Details

### Buffer is Applied to:
✅ All bookings in `bookings` table
✅ All reservations in `reservations` table (admin panel)
✅ Both website bookings and admin manual bookings

### Buffer is NOT Applied to:
❌ Cancelled bookings (status = 'cancelled')

### Conflict Detection
The system blocks a new booking if:
- New pickup time < (Previous dropoff time + 1h30)

### Examples

| Previous Booking Ends | Buffer Added | Next Booking Can Start |
|----------------------|--------------|------------------------|
| 09:30                | +1h30        | 11:00                  |
| 14:00                | +1h30        | 15:30                  |
| 18:30                | +1h30        | 20:00                  |

## Benefits

1. **Automatic**: No manual admin work needed
2. **Consistent**: Same 1h30 buffer for all vehicles
3. **Real-time**: Based on actual bookings in database
4. **Clear**: Customers see exact available time
5. **Prevents double-bookings**: System enforces the rule

## Code Location

- Buffer enforcement: `DR7-empire/utils/bookingValidation.ts` (line 37-38, 81-83)
- Customer messaging: `DR7-empire/components/ui/CarBookingWizard.tsx` (lines 345-374)

## No Setup Required

The system works automatically with your existing bookings. Just make bookings as normal, and the 1h30 buffer is always enforced!
