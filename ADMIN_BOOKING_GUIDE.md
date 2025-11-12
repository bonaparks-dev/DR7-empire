# Admin Booking Guide

## How to Create Bookings in Supabase Admin Panel

### Important Fields

When creating bookings directly in the Supabase database, follow these guidelines to ensure proper functionality:

## Car Wash Bookings

### Required Fields:
- **service_type**: `'car_wash'`
- **service_name**: Name of the service (e.g., "LAVAGGIO COMPLETO", "LAVAGGIO TOP", etc.)
- **service_id**: ID of the service (e.g., "full-clean", "top-shine", "vip", "dr7-luxury")
- **price_total**: Price in cents (e.g., 2500 for €25, 4900 for €49, 7500 for €75, 9900 for €99)
- **currency**: `'EUR'`
- **payment_status**: `'succeeded'` (for confirmed bookings)
- **status**: `'pending'` or `'confirmed'`
- **appointment_date**: Date and time as ISO string (e.g., `'2025-01-15T10:00:00+01:00'`)
- **appointment_time**: Time in HH:MM format (e.g., `'10:00'`, `'15:30'`)
  - ⚠️ **IMPORTANT**: This should be just the time as a string, NOT a timestamp
  - Valid times: Morning slots (09:00-12:00), Afternoon slots (15:00-18:00)
- **customer_name**: Full name of the customer
- **customer_email**: Email address
- **customer_phone**: Phone number
- **vehicle_type**: `'car'`
- **vehicle_name**: `'Car Wash Service'`
- **booked_at**: Timestamp when booking was created

### Validation Rules:
1. **Time slot conflicts**: The database will automatically prevent double-booking the same time slot
2. **Service duration** (calculated from price):
   - €1-25: 1 hour
   - €26-50: 2 hours
   - €51-75: 3 hours
   - €76-100: 4 hours
3. **Working hours**: Monday-Saturday, closed on Sundays
4. **Time slots**: 30-minute intervals between 09:00-12:00 and 15:00-18:00

### Example Car Wash Booking:
```sql
INSERT INTO bookings (
  service_type,
  service_name,
  service_id,
  price_total,
  currency,
  payment_status,
  status,
  appointment_date,
  appointment_time,
  customer_name,
  customer_email,
  customer_phone,
  vehicle_type,
  vehicle_name,
  booked_at
) VALUES (
  'car_wash',
  'LAVAGGIO COMPLETO',
  'full-clean',
  2500,
  'EUR',
  'succeeded',
  'confirmed',
  '2025-01-15T10:00:00+01:00',
  '10:00',
  'Mario Rossi',
  'mario@example.com',
  '+393451234567',
  'car',
  'Car Wash Service',
  NOW()
);
```

## Car Rental Bookings

### Required Fields:
- **vehicle_type**: `'car'` or `'jet'`
- **vehicle_name**: Name of the specific vehicle (e.g., "Lamborghini Urus", "Ferrari F8")
- **vehicle_image_url**: URL to vehicle image
- **pickup_date**: Pickup date/time as ISO string
- **dropoff_date**: Return date/time as ISO string
- **pickup_location**: Pickup location
- **dropoff_location**: Return location
- **price_total**: Total price in cents
- **currency**: Currency code
- **payment_status**: `'succeeded'` for confirmed bookings
- **status**: `'pending'` or `'confirmed'`
- **customer_name**, **customer_email**, **customer_phone**: Customer details
- **user_id**: UUID of the user (if registered)

### Validation Rules:
1. **Vehicle conflicts**: The database will automatically prevent double-booking the same vehicle for overlapping dates
2. **Date overlap check**: Compares pickup and dropoff dates to ensure no conflicts

### Example Car Rental Booking:
```sql
INSERT INTO bookings (
  vehicle_type,
  vehicle_name,
  vehicle_image_url,
  pickup_date,
  dropoff_date,
  pickup_location,
  dropoff_location,
  price_total,
  currency,
  payment_status,
  status,
  customer_name,
  customer_email,
  customer_phone,
  user_id,
  booked_at
) VALUES (
  'car',
  'Lamborghini Urus',
  'https://example.com/urus.jpg',
  '2025-01-15T10:00:00+01:00',
  '2025-01-20T10:00:00+01:00',
  'rome_fiumicino',
  'rome_fiumicino',
  150000,
  'EUR',
  'succeeded',
  'confirmed',
  'Mario Rossi',
  'mario@example.com',
  '+393451234567',
  NULL,
  NOW()
);
```

## Common Issues & Solutions

### Issue: Time shows wrong in admin panel (e.g., 16:30 shows as 1 AM)
**Solution**: Make sure `appointment_time` is stored as a string in HH:MM format (e.g., `'16:30'`), not as a timestamp. The `appointment_date` contains the full date and time, while `appointment_time` is just used for time slot calculations.

### Issue: Booking created but conflicts with existing booking
**Solution**: This should now be prevented by database triggers. If you see an error like "Car wash time slot conflict" or "Vehicle availability conflict", choose a different time/date or vehicle.

### Issue: Booking not showing on website
**Solution**: Ensure `payment_status` is set to `'succeeded'` and `status` is either `'pending'` or `'confirmed'`.

## Testing

After applying the migrations, test the validation:

1. Create a car wash booking for a specific time slot
2. Try to create another car wash booking for an overlapping time - should fail
3. Create a car rental booking for a specific vehicle and dates
4. Try to create another rental for the same vehicle with overlapping dates - should fail
