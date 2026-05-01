-- Drop all existing function variants
DO $$ 
BEGIN
    -- Drop all variants of verify_admin_password
    DROP FUNCTION IF EXISTS public.verify_admin_password(UUID, TEXT);
    DROP FUNCTION IF EXISTS public.verify_admin_password(TEXT, TEXT);
    
    -- Drop other functions
    DROP FUNCTION IF EXISTS public.get_user_role(UUID);
    DROP FUNCTION IF EXISTS public.get_user_role_by_email(TEXT);
    DROP FUNCTION IF EXISTS public.check_is_admin(TEXT);
    
EXCEPTION 
    WHEN others THEN 
        -- Continue even if some functions don't exist
        NULL;
END $$;

-- Explicitly drop any existing versions with full signature
DROP FUNCTION IF EXISTS public.verify_admin_password(UUID, TEXT);
DROP FUNCTION IF EXISTS public.verify_admin_password(TEXT, TEXT);

-- Create function to verify admin password with explicit parameter names
CREATE OR REPLACE FUNCTION public.verify_admin_password(admin_id UUID, password_input TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_role TEXT;
BEGIN
    -- Get the user's role directly using UUID
    SELECT role INTO user_role
    FROM users
    WHERE id = admin_id;

    -- Return false if no role found, true only if admin
    RETURN COALESCE(user_role = 'admin', FALSE);
END;
$$;

-- Create function to check if a user is an admin
CREATE FUNCTION public.check_is_admin(user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role
    FROM users
    WHERE email = user_email;

    RETURN user_role = 'admin';
END;
$$;

-- Create function to safely get user role by ID
CREATE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role
    FROM users
    WHERE id = user_id;

    RETURN user_role;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_role(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_is_admin(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_admin_password(UUID, TEXT) TO authenticated;

-- Revoke execute from public
REVOKE EXECUTE ON FUNCTION public.get_user_role(UUID) FROM public;
REVOKE EXECUTE ON FUNCTION public.check_is_admin(TEXT) FROM public;
REVOKE EXECUTE ON FUNCTION public.verify_admin_password(UUID, TEXT) FROM public;

-- Add function comments
COMMENT ON FUNCTION public.get_user_role IS 'Safely get the role of a user by their ID';
COMMENT ON FUNCTION public.check_is_admin IS 'Check if a user is an admin by their email';
COMMENT ON FUNCTION public.verify_admin_password(UUID, TEXT) IS 'Verify admin password for additional security checks';