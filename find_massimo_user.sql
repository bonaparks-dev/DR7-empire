-- Find Massimo's user details
SELECT id, email, raw_user_meta_data 
FROM auth.users 
WHERE email ILIKE '%massimo%' OR raw_user_meta_data->>'full_name' ILIKE '%Massimo%';
