# Fix: Registration Data Not Saved to customers_extended

## ✅ Problem Identified

The trigger function `sync_auth_user_to_customers` was **only extracting 3 fields** from `raw_user_meta_data`:
- nome/cognome (or fullName)
- telefono (or phone)

It was **missing ALL other registration fields**:
- codice_fiscale ❌
- indirizzo ❌
- citta_residenza, provincia_residenza, codice_postale ❌
- sesso, data_nascita, citta_nascita ❌

## 🛠️ Solution

### 1. Updated Trigger Function
**File**: `supabase/migrations/20260110000000_fix_auth_user_sync_trigger.sql`

The trigger now extracts **ALL fields** from `raw_user_meta_data`:
- ✅ codice_fiscale
- ✅ indirizzo + numero_civico
- ✅ citta_residenza + provincia_residenza + codice_postale
- ✅ sesso + data_nascita + citta_nascita + provincia_nascita

### 2. How It Works

When a user registers via `SignUpPage.tsx`:
1. Frontend calls `register-customer.js`
2. Backend creates `auth.users` record
3. Backend inserts into `customers_extended` with full data
4. **Trigger is NOT needed** (data already saved by backend)

When a user registers via simplified flow:
1. Only `auth.users` is created
2. **Trigger fires** and extracts data from `raw_user_meta_data`
3. Creates `customers_extended` record with all available fields

## 📋 Next Steps

### Step 1: Apply the Migration
Run this in your Supabase SQL Editor:
```bash
# Copy the contents of:
supabase/migrations/20260110000000_fix_auth_user_sync_trigger.sql
```

### Step 2: Verify It Works
Create a test user and check if data is populated:
```sql
-- After creating a test user, check:
SELECT 
  au.email,
  ce.nome,
  ce.cognome,
  ce.codice_fiscale,
  ce.indirizzo,
  ce.citta_residenza
FROM auth.users au
JOIN customers_extended ce ON au.id = ce.user_id
WHERE au.email = 'test@example.com';
```

### Step 3: Backfill Existing Users (Optional)
If you want to populate data for existing users who already registered, you'll need a separate migration to extract data from their `raw_user_meta_data`.

## ⚠️ Important Note

The trigger can **only extract data that exists in `raw_user_meta_data`**. 

If users registered with ONLY email/password (no additional fields), then `raw_user_meta_data` will be empty, and the trigger cannot populate CF, address, etc.

Those users will need to **complete their profile manually** via the account page.
