# 🚨 CRITICAL ISSUE - Website Broken

## Problem
- **Chrome**: Urban cars not showing
- **Safari**: Black page when clicking "Prenota Ora"
- **Console**: Supabase connection errors (`ERR_CONNECTION_RESET`)

## Root Cause
The Supabase database is refusing connections, likely due to:
1. Table locks from recent SQL commands
2. RLS policy issues
3. Too many concurrent requests

## Immediate Fix Required

### Step 1: Check Supabase Database Status
1. Go to https://supabase.com/dashboard
2. Select your DR7 project
3. Check "Database" → "Logs" for errors

### Step 2: Fix RLS Policies
Run this SQL in Supabase SQL Editor:

```sql
-- Check if vehicles table exists
SELECT COUNT(*) FROM vehicles;

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'vehicles';

-- If no policies exist, create them
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_all_vehicles" ON public.vehicles;

CREATE POLICY "public_read_all_vehicles"
  ON public.vehicles
  FOR SELECT
  TO anon, authenticated
  USING (true);
```

### Step 3: Clear Any Table Locks
```sql
-- Check for locks
SELECT * FROM pg_locks WHERE relation = 'vehicles'::regclass;

-- If there are locks, terminate them
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE pid IN (
  SELECT pid 
  FROM pg_locks 
  WHERE relation = 'vehicles'::regclass
);
```

### Step 4: Verify Data
```sql
-- Check if vehicles exist
SELECT id, display_name, daily_rate, category, status 
FROM vehicles 
WHERE category = 'urban'
LIMIT 5;
```

## If Still Not Working

### Option 1: Disable RLS Temporarily
```sql
ALTER TABLE public.vehicles DISABLE ROW LEVEL SECURITY;
```

### Option 2: Check Supabase API Keys
Verify in Supabase Dashboard → Settings → API that:
- `anon` key is valid
- API URL is correct

### Option 3: Restart Supabase Project
In Supabase Dashboard → Settings → General → "Restart project"

## Expected Result
After fixing:
- Chrome: Urban cars should load
- Safari: Booking wizard should open (not black page)
- Console: No connection errors

## DO THIS NOW
The website is completely broken for customers. This is the highest priority!
