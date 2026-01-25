-- Fixed query to check email confirmations
SELECT 
  created_at,
  email,
  raw_user_meta_data->>'full_name' as full_name,
  confirmation_sent_at,
  confirmed_at,
  email_confirmed_at,
  CASE 
    WHEN confirmation_sent_at IS NULL THEN '❌ Email NOT sent'
    WHEN confirmed_at IS NULL THEN '⏳ Email sent, waiting for confirmation'
    ELSE '✅ Email confirmed'
  END as status
FROM auth.users
WHERE created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC
LIMIT 20;
