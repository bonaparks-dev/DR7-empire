# 🔄 Backfill Customer Data from Previous Registrations

## Purpose
This script recovers customer data for users who registered **before the fix** was applied. It extracts data from `auth.users.raw_user_meta_data` and populates the missing fields in `customers_extended`.

## ⚠️ Important: Check Data Availability First!

**Before running the backfill**, check if data actually exists in `raw_user_meta_data`:

### Step 1: Run Diagnostic Query
**File**: `check_backfill_data_availability.sql`

This will show you:
- Which users have data in `raw_user_meta_data`
- Which users can be backfilled
- Which users have no data to recover

Expected results:
```
✅ Already complete - User has full data, no action needed
🔄 Can backfill CF - User has CF in metadata but not in customers_extended
🔄 Can backfill address - User has address in metadata but not in customers_extended
⚠️ No data to backfill - User has no data in metadata (registered with email only)
❌ No customer record - User has no customers_extended record at all
```

## 📋 Backfill Process

### Step 2: Run Backfill Migration
**File**: `supabase/migrations/20260110000001_backfill_customer_data.sql`

This script will:
1. **Update existing customers_extended records** with missing data from metadata
2. **Create new customers_extended records** for users who don't have one
3. **Show summary** of what was updated
4. **List users** who still have incomplete data

### What Gets Backfilled:

| Field | Source in raw_user_meta_data |
|-------|------------------------------|
| nome | `nome` or split from `fullName` |
| cognome | `cognome` or split from `fullName` |
| telefono | `telefono` or `phone` |
| codice_fiscale | `codiceFiscale` |
| indirizzo | `indirizzo` |
| numero_civico | `numeroCivico` |
| citta_residenza | `cittaResidenza` |
| provincia_residenza | `provinciaResidenza` |
| codice_postale | `codicePostale` |
| sesso | `sesso` |
| data_nascita | `dataNascita` |
| citta_nascita | `cittaNascita` |
| provincia_nascita | `provinciaNascita` |

## 🎯 Expected Results

### Scenario 1: User Registered via SignUpPage.tsx (AFTER backend fix)
- ✅ **Already has complete data** in `customers_extended`
- ✅ **Already has complete data** in `raw_user_meta_data`
- 🔄 Backfill will **skip** (data already exists)

### Scenario 2: User Registered via SignUpPage.tsx (BEFORE backend fix)
- ⚠️ **Has complete data** in `raw_user_meta_data`
- ❌ **Missing data** in `customers_extended` (only email, nome, telefono)
- 🔄 Backfill will **populate** CF, address, birth info

### Scenario 3: User Registered with Email Only
- ❌ **No data** in `raw_user_meta_data` (only `{ source: 'website_registration' }`)
- ❌ **Minimal data** in `customers_extended` (only email)
- ⚠️ Backfill **cannot help** - user must complete profile manually

## 📊 Verification

After running the backfill, check the results:

```sql
-- Count users by data completeness
SELECT 
  CASE 
    WHEN codice_fiscale IS NOT NULL AND indirizzo IS NOT NULL THEN '✅ Complete'
    WHEN codice_fiscale IS NOT NULL THEN '⚠️ Has CF, missing address'
    WHEN indirizzo IS NOT NULL THEN '⚠️ Has address, missing CF'
    ELSE '❌ Incomplete'
  END as status,
  COUNT(*) as user_count
FROM customers_extended
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY status;
```

## ⚠️ Limitations

1. **Can only recover data that exists in `raw_user_meta_data`**
2. **Cannot create data that was never captured**
3. **Users who registered with email-only will still be incomplete**

For users with incomplete profiles after backfill:
- They can complete their profile via `/account` page
- Admin can manually update via the Clienti tab
- Future registrations will have complete data (after fix is deployed)

## 🚀 Deployment Order

1. ✅ Apply trigger fix: `20260110000000_fix_auth_user_sync_trigger.sql`
2. ✅ Deploy backend: `register-customer.js`
3. 🔍 Run diagnostic: `check_backfill_data_availability.sql`
4. 🔄 Run backfill: `20260110000001_backfill_customer_data.sql`
5. ✅ Verify results
