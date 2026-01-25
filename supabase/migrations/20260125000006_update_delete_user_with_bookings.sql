-- Updated delete_user function to manually delete bookings (since userId is TEXT, not UUID)
CREATE OR REPLACE FUNCTION public.delete_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Manually delete bookings (userId is TEXT, can't use CASCADE)
  DELETE FROM public.bookings WHERE "userId" = current_user_id::text;

  -- Delete from auth.users (this will CASCADE to customers_extended, credit_transactions, membership_purchases)
  DELETE FROM auth.users WHERE id = current_user_id;
  
  -- Note: All related data will be deleted:
  -- - customers_extended (CASCADE)
  -- - credit_transactions (CASCADE)
  -- - membership_purchases (CASCADE)
  -- - bookings (manual delete above)
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_user() TO authenticated;
