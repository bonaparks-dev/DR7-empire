-- Check for deleted or unconfirmed users with your email
-- Run this in Supabase SQL Editor

SELECT 
  id,
  email,
  created_at,
  deleted_at,
  confirmation_sent_at,
  confirmed_at,
  email_confirmed_at,
  CASE 
    WHEN deleted_at IS NOT NULL THEN '🗑️ DELETED'
    WHEN confirmation_sent_at IS NULL THEN '❌ No confirmation sent'
    WHEN confirmed_at IS NULL THEN '⏳ Waiting for confirmation'
    ELSE '✅ Confirmed'
  END as status
FROM auth.users
WHERE email = 'YOUR_EMAIL_HERE'  -- Replace with your actual email
ORDER BY created_at DESC;

-- If you see a deleted user, you need to permanently remove it:
-- DELETE FROM auth.users WHERE email = 'YOUR_EMAIL_HERE' AND deleted_at IS NOT NULL;
