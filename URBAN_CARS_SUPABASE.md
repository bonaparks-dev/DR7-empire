# Urban Cars - Supabase Setup

## What You Need to Do in Supabase

### ✅ Good News!
The existing `bookings` table already supports urban cars. No new tables needed!

### 📋 Existing Database Schema
The `bookings` table handles all vehicle types (exotic supercars, urban cars, etc.) with these fields:
- `vehicle_name` - stores car name (e.g., "VW T-ROC", "Fiat Ducato Maxi")
- `vehicle_type` - stores type ("car" for both exotic and urban)
- `vehicle_image` - stores image path
- `price` - daily rental price
- All other booking details (dates, location, insurance, etc.)

### 🎯 What Urban Cars Are Available

| Car | Daily Price | ID |
|-----|-------------|-----|
| VW T-ROC | €49 | urban-car-201 |
| VW Tiguan | €59 | urban-car-202 |
| Cupra Formentor | €49 | urban-car-203 |
| Citroen C5 Aircross | €29 | urban-car-204 |
| Fiat Ducato Maxi | €79 | urban-car-205 |
| Fiat Panda | €29 | urban-car-206 |
| Fiat 500X | €39 | urban-car-207 |

### 📸 Images Needed
Add these images to `/public` folder:
- `/troc.jpeg`
- `/tiguan.jpeg`
- `/cupra.jpeg`
- `/c5.jpeg`
- `/ducato.jpeg`
- `/panda.jpeg`
- `/500x.jpeg`

### 🚀 How It Works
1. User goes to `/urban-cars` page
2. Sees grid of available urban cars (same layout as exotic supercars)
3. Clicks "Book Now" → opens CarBookingWizard
4. Completes booking → saves to `bookings` table in Supabase
5. Receives confirmation email at dubai.rent7.0srl@gmail.com

### ✅ No Migration Required
The existing database schema already supports urban cars through the `bookings` table. The booking wizard handles both exotic supercars and urban cars identically.

### 📊 Tracking Bookings
To see urban car bookings in Supabase:
```sql
SELECT * FROM bookings
WHERE vehicle_name IN ('VW T-ROC', 'VW Tiguan', 'Cupra Formentor', 'Citroen C5 Aircross', 'Fiat Ducato Maxi', 'Fiat Panda', 'Fiat 500X')
ORDER BY created_at DESC;
```

Or filter by ID prefix:
```sql
SELECT * FROM bookings
WHERE id LIKE 'urban-car-%'
ORDER BY created_at DESC;
```
