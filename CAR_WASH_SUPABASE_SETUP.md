# Car Wash Booking - Supabase Setup Guide

## Database Configuration for Car Wash Bookings

The car wash booking system uses the existing `bookings` table in your Supabase database. No new tables are needed - we're reusing the same structure!

## ✅ Current Database Structure

Your existing `bookings` table already has all the required columns:

### Required Columns (Already Exist):
- `id` (uuid, primary key)
- `user_id` (uuid, nullable - allows guest bookings)
- `service_type` (text) - Will be set to `'car_wash'`
- `service_name` (text) - Wash package name
- `service_id` (text) - Package ID (full-clean, top-shine, vip, dr7-luxury)
- `price_total` (integer) - Price in cents
- `currency` (text) - EUR
- `customer_name` (text)
- `customer_email` (text)
- `customer_phone` (text)
- `appointment_date` (timestamp)
- `booking_details` (jsonb) - Contains:
  - `carMake` (string)
  - `carModel` (string)
  - `carYear` (string)
  - `licensePlate` (string)
  - `additionalService` (string)
  - `additionalServiceHours` (number)
  - `notes` (string)
- `status` (text) - pending, confirmed, completed, cancelled
- `payment_status` (text) - pending, paid, refunded
- `booked_at` (timestamp)
- `created_at` (timestamp, auto)
- `updated_at` (timestamp, auto)

## 🔧 No Changes Needed!

The good news: **Your existing `bookings` table already supports car wash bookings!**

The structure was designed to handle multiple service types, so car wash bookings will automatically integrate with your existing system.

## 📊 How It Works

### Car Wash Booking Example:
```json
{
  "user_id": "uuid-or-null",
  "service_type": "car_wash",
  "service_name": "LAVAGGIO VIP",
  "service_id": "vip",
  "price_total": 7500,
  "currency": "EUR",
  "customer_name": "Mario Rossi",
  "customer_email": "mario@example.com",
  "customer_phone": "+39 123 456 789",
  "appointment_date": "2025-10-15T10:00:00Z",
  "booking_details": {
    "carMake": "Mercedes",
    "carModel": "GLE 63s AMG",
    "carYear": "2023",
    "licensePlate": "AB123CD",
    "additionalService": "supercar",
    "additionalServiceHours": 2,
    "notes": "Please pay extra attention to the wheels"
  },
  "status": "pending",
  "payment_status": "pending",
  "booked_at": "2025-10-03T14:30:00Z"
}
```

### Car Rental Booking Example (for comparison):
```json
{
  "user_id": "uuid",
  "vehicle_type": "car",
  "vehicle_name": "Mercedes GLE 63s AMG",
  "pickup_date": "2025-10-15T10:00:00Z",
  "dropoff_date": "2025-10-18T10:00:00Z",
  "price_total": 35000,
  "currency": "EUR",
  "booking_details": {
    "customer": { ... },
    "insuranceOption": "KASKO_BLACK",
    "extras": ["gps", "child_seat"]
  },
  "status": "pending",
  "payment_status": "pending"
}
```

## 🔍 Querying Car Wash Bookings

### Get All Car Wash Bookings:
```sql
SELECT * FROM bookings
WHERE service_type = 'car_wash'
ORDER BY appointment_date DESC;
```

### Get Pending Car Wash Bookings:
```sql
SELECT * FROM bookings
WHERE service_type = 'car_wash'
  AND status = 'pending'
ORDER BY appointment_date ASC;
```

### Get Today's Car Wash Appointments:
```sql
SELECT * FROM bookings
WHERE service_type = 'car_wash'
  AND DATE(appointment_date) = CURRENT_DATE
ORDER BY appointment_date ASC;
```

### Get User's Car Wash History:
```sql
SELECT * FROM bookings
WHERE user_id = 'user-uuid-here'
  AND service_type = 'car_wash'
ORDER BY booked_at DESC;
```

## 🔐 Row Level Security (RLS)

Your existing RLS policies should already cover car wash bookings. If you need to verify:

### Check Current Policies:
```sql
SELECT * FROM pg_policies
WHERE tablename = 'bookings';
```

### Typical Policies Needed:
1. **Users can view their own bookings:**
```sql
CREATE POLICY "Users can view own bookings" ON bookings
  FOR SELECT USING (auth.uid() = user_id);
```

2. **Users can create bookings:**
```sql
CREATE POLICY "Users can create bookings" ON bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
```

3. **Admin can view all bookings:**
```sql
CREATE POLICY "Admin can view all bookings" ON bookings
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'admin' OR
    auth.jwt() ->> 'role' = 'service_account'
  );
```

## 📧 Email Notifications (Optional)

To send confirmation emails for car wash bookings, you can use your existing `send-booking-confirmation` Netlify function. Just update it to handle `service_type = 'car_wash'`:

```typescript
// In netlify/functions/send-booking-confirmation.ts
if (booking.service_type === 'car_wash') {
  // Send car wash confirmation email
  mailOptions.subject = `Car Wash Appointment Confirmed - ${booking.service_name}`;
  mailOptions.html = `
    <h1>Appointment Confirmed!</h1>
    <p>Service: ${booking.service_name}</p>
    <p>Date: ${new Date(booking.appointment_date).toLocaleString()}</p>
    <p>Vehicle: ${booking.booking_details.carMake} ${booking.booking_details.carModel}</p>
    <p>Total: €${booking.price_total / 100}</p>
  `;
}
```

## 🎯 Admin Dashboard View

To add car wash bookings to your admin dashboard, filter by `service_type`:

```typescript
// Fetch car wash bookings
const { data: carWashBookings } = await supabase
  .from('bookings')
  .select('*')
  .eq('service_type', 'car_wash')
  .order('appointment_date', { ascending: true });
```

## ✅ Checklist

- [x] Database table exists (`bookings`)
- [x] All required columns present
- [x] RLS policies configured
- [ ] Test creating a car wash booking via the UI
- [ ] Verify booking appears in Supabase dashboard
- [ ] (Optional) Update email notifications
- [ ] (Optional) Add car wash bookings to admin dashboard

## 🚀 Testing

1. Go to `/car-wash-services` on your website
2. Click "PRENOTA ORA" on any service
3. Fill out the booking form
4. Submit the booking
5. Check Supabase → Table Editor → bookings
6. Look for the new row with `service_type = 'car_wash'`

## 📝 Notes

- **Guest Bookings**: Users don't need to be logged in. `user_id` can be `NULL` for guest bookings.
- **Price Format**: Always stored as cents (e.g., €75.00 = 7500)
- **Appointment Times**: Stored in UTC, display in local timezone
- **Additional Services**: Stored in `booking_details.additionalService` and `additionalServiceHours`

## 🆘 Troubleshooting

### "Permission denied for table bookings"
**Solution:** Check RLS policies. Either disable RLS temporarily or add proper policies.

### "null value in column violates not-null constraint"
**Solution:** Check which column is required. Most fields should be nullable except:
- `price_total`
- `currency`
- `status`
- `payment_status`

### Booking appears but no data in booking_details
**Solution:** Check the JSONB column. The data should be a valid JSON object.

---

**You're all set! No database changes needed. Just start using the car wash booking system! 🎉**
