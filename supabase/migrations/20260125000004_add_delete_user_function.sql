-- Create function to delete user account
-- This will delete the user from auth.users which will cascade to all related tables
CREATE OR REPLACE FUNCTION public.delete_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  -- Get the current authenticated user's ID
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Delete from auth.users (this will cascade to all related tables via foreign keys)
  DELETE FROM auth.users WHERE id = current_user_id;
  
  -- Note: All related data in customers_extended, bookings, etc. will be deleted
  -- automatically via ON DELETE CASCADE foreign key constraints
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.delete_user() TO authenticated;
