# Booking Extras - Supabase Setup

## ✅ Good News!
The existing `bookings` table already supports extras. **No migration needed!**

## 📋 Current Database Schema
The `bookings` table has an `extras` column (JSONB type) that stores all selected extras as a JSON array.

Example stored data:
```json
{
  "extras": ["additional_driver", "mobility_service", "infant_seat"]
}
```

## 🎯 New Extras Added (8 new options)

| ID | Name | Price/Day | Type |
|-----|------|-----------|------|
| `mobility_service` | Servizio Mobilità | €7.00/day | Per day |
| `accident_insurance` | Assicurazione Infortuni | €9.00/day | Per day |
| `navigation_system` | Sistema di Navigazione | €18.00/day | Per day |
| `refueling_service` | Servizio Rifornimento | €22.00 | One-time |
| `international_coverage` | Copertura Internazionale | €20.00 | One-time |
| `infant_seat` | Seggiolino Neonato | €24.00/day | Per day |
| `child_seat` | Seggiolino Bambino | €24.00/day | Per day |
| `booster_seat` | Rialzo | €9.00/day | Per day |

### Previously Existing Extras:
- `additional_driver` - Guidatore Aggiuntivo - €10/day
- `young_driver_fee` - Supplemento Giovane Conducente - €10/day (auto-applied)

## 🚀 How It Works

### 1. Booking Flow
- User selects car (exotic or urban)
- Opens CarBookingWizard
- In Step 3 (Extras & Insurance), sees all 10 options
- Selects desired extras
- Booking saved to `bookings` table with extras array

### 2. Data Storage
Extras are stored in `bookings.extras` column as:
```json
["mobility_service", "infant_seat", "navigation_system"]
```

### 3. Price Calculation
- **Per day extras**: Multiplied by number of rental days
- **One-time extras**: Charged once (refueling_service, international_coverage)
- Total calculated in booking wizard automatically

## 📊 Querying Bookings with Extras

### Find bookings with specific extra:
```sql
SELECT * FROM bookings
WHERE extras @> '["mobility_service"]'::jsonb
ORDER BY created_at DESC;
```

### Count most popular extras:
```sql
SELECT
  jsonb_array_elements_text(extras) as extra_id,
  COUNT(*) as usage_count
FROM bookings
WHERE extras IS NOT NULL
GROUP BY extra_id
ORDER BY usage_count DESC;
```

### Calculate total extras revenue:
```sql
-- This requires joining with pricing data from your constants
-- Example for a specific extra:
SELECT
  COUNT(*) as bookings_with_mobility,
  SUM(
    CASE
      WHEN extras @> '["mobility_service"]'::jsonb
      THEN 6.49 * EXTRACT(day FROM (return_date - pickup_date))
      ELSE 0
    END
  ) as total_mobility_revenue
FROM bookings;
```

## ✅ No Action Required in Supabase
The `bookings` table already has:
- ✅ `extras` column (JSONB) - stores array of extra IDs
- ✅ All necessary booking fields
- ✅ RLS policies configured

The new extras will automatically:
- ✅ Appear in CarBookingWizard Step 3
- ✅ Be saved to bookings.extras array
- ✅ Be included in booking confirmation emails
- ✅ Be tracked in admin notifications

## 🎨 UI Display
Each extra shows:
- Name in Italian/English
- Price per day (or one-time)
- Description explaining the service
- Checkbox to add to booking

One-time fees (refueling, international coverage) are clearly marked and only charged once regardless of rental duration.
