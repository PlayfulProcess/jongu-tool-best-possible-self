-- Supabase RPC Function for User Self-Deletion (not implemented)
-- Run this in your Supabase SQL Editor

CREATE OR REPLACE FUNCTION delete_user()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id uuid;
BEGIN
  -- Get the current user ID
  user_id := auth.uid();
  
  -- Check if user is authenticated
  IF user_id IS NULL THEN
    RETURN json_build_object('error', 'Not authenticated');
  END IF;
  
  -- Delete user data from user_documents table
  DELETE FROM user_documents WHERE user_id = user_id;
  
  -- Delete the auth user (this is the key part)
  -- Note: This requires the function to be SECURITY DEFINER
  DELETE FROM auth.users WHERE id = user_id;
  
  RETURN json_build_object('success', true, 'message', 'User deleted successfully');
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('error', SQLERRM);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_user() TO authenticated;

-- Revoke from public to ensure only authenticated users can call it
REVOKE EXECUTE ON FUNCTION delete_user() FROM public;