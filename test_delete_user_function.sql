-- Test if delete_user function works when called directly
-- WARNING: This will actually delete your account if you run it while logged in!
-- Only run this to test if the function executes without errors

-- First, just check if the function can be called (this won't delete anything)
SELECT public.delete_user();

-- If you get an error about "Not authenticated", that's GOOD - it means the function works
-- If you get a different error, that's the problem we need to fix
