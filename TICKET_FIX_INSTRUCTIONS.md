# Ticket Number Fix Instructions

## Problem
The lottery ticket system was previously generating ticket numbers outside the valid range (1-2000), and wasn't checking if numbers were already assigned, potentially creating duplicates.

## Solution Applied

### 1. Code Fix (Already Applied)
The ticket generation function now:
- Queries the database for all assigned ticket numbers
- Only assigns available numbers from 1-2000
- Validates that enough tickets are available before purchase
- Uses deterministic random selection from available tickets

### 2. Database Migration (Needs to be Applied)
Location: `supabase/migrations/20251126000000_fix_ticket_numbers_add_unique_constraint.sql`

This migration:
- Adds a UNIQUE constraint on `ticket_number` to prevent duplicates
- Adds a CHECK constraint to ensure numbers are between 1-2000
- Creates an index for faster lookups

**⚠️ IMPORTANT**: This migration will FAIL if there are already:
- Duplicate ticket numbers in the database
- Ticket numbers outside the 1-2000 range

### 3. Check Existing Data First

Run this query in Supabase SQL Editor:
```sql
-- Check for invalid ticket numbers
SELECT
    id, uuid, ticket_number, email, full_name, purchase_date
FROM commercial_operation_tickets
WHERE ticket_number < 1 OR ticket_number > 2000
ORDER BY purchase_date DESC;

-- Check for duplicates
SELECT
    ticket_number, COUNT(*) as count, array_agg(email) as emails
FROM commercial_operation_tickets
GROUP BY ticket_number
HAVING COUNT(*) > 1;
```

### 4. If There Are Invalid Tickets

You need to decide how to handle them:

#### Option A: Reassign Invalid Tickets to Available Numbers
1. Contact affected customers
2. Reassign their tickets to available numbers in the 1-2000 range
3. Regenerate and resend their PDFs with new ticket numbers

#### Option B: Delete and Refund (if very few tickets sold)
1. Refund affected customers
2. Delete invalid ticket records
3. Have them repurchase

### 5. Apply the Migration

Once the data is clean:
```bash
# Push the migration to Supabase
npx supabase db push
```

Or apply it manually in the Supabase SQL Editor.

### 6. Verify the Fix

After deploying the code fix and running the migration:
```bash
# Deploy the updated function
netlify deploy --prod
```

Test with a purchase to ensure:
- Ticket numbers are between 1-2000
- No duplicates are created
- The system correctly tracks which numbers are taken

## Monitoring

Use the script at `scripts/check-and-fix-tickets.sql` to:
- Check ticket distribution
- See how many tickets remain available
- Identify any issues

## Support

If customers report issues with their ticket numbers, use the SQL script to:
1. Verify their ticket number is valid and unique
2. Check the purchase_date to see when it was assigned
3. Regenerate their PDF if needed
