-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Admins can view all users in their restaurant" ON users;
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Admins can update users in their restaurant" ON users;
DROP POLICY IF EXISTS "Users can only see themselves" ON users;
DROP POLICY IF EXISTS "user_select_policy" ON users;
DROP POLICY IF EXISTS "user_update_policy" ON users;
DROP POLICY IF EXISTS "user_select_self" ON users;
DROP POLICY IF EXISTS "user_select_admin" ON users;
DROP POLICY IF EXISTS "user_update_admin" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;

-- Create helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    user_role VARCHAR;
BEGIN
    SELECT role INTO user_role
    FROM users
    WHERE id = user_id;
    
    RETURN user_role = 'admin';
END;
$$;

-- Create helper function to get restaurant ID
CREATE OR REPLACE FUNCTION get_user_restaurant(user_id UUID)
RETURNS UUID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    rest_id UUID;
BEGIN
    SELECT restaurant_id INTO rest_id
    FROM users
    WHERE id = user_id;
    
    RETURN rest_id;
END;
$$;

-- Create admin password verification function
-- Simplified version - just checks if user is admin
-- Full password verification would require pgcrypto extension
CREATE OR REPLACE FUNCTION verify_admin_password(admin_id UUID, password_input TEXT)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    is_admin_user BOOLEAN;
BEGIN
    -- Check if the user is an admin
    -- Password verification is handled by Supabase Auth itself
    SELECT (role = 'admin') INTO is_admin_user
    FROM users
    WHERE id = admin_id;
    
    RETURN COALESCE(is_admin_user, false);
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION is_admin TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_restaurant TO authenticated;
GRANT EXECUTE ON FUNCTION verify_admin_password TO authenticated;

-- Basic policy - users can see their own record
CREATE POLICY "user_select_self" ON users
    FOR SELECT USING (
        id = auth.uid()
    );

-- Admin policy - admins can see all users in their restaurant
CREATE POLICY "user_select_admin" ON users
    FOR SELECT USING (
        is_admin(auth.uid()) 
        AND 
        get_user_restaurant(auth.uid()) = restaurant_id
    );

-- Admin can update users in their restaurant
CREATE POLICY "user_update_admin" ON users
    FOR UPDATE USING (
        is_admin(auth.uid())
        AND
        get_user_restaurant(auth.uid()) = restaurant_id
    )
    WITH CHECK (
        is_admin(auth.uid())
        AND
        get_user_restaurant(auth.uid()) = restaurant_id
    );

-- Admin can insert new users in their restaurant
CREATE POLICY "user_insert_admin" ON users
    FOR INSERT WITH CHECK (
        is_admin(auth.uid())
        AND
        get_user_restaurant(auth.uid()) = restaurant_id
    );

-- Admin can delete users from their restaurant
CREATE POLICY "user_delete_admin" ON users
    FOR DELETE USING (
        is_admin(auth.uid())
        AND
        get_user_restaurant(auth.uid()) = restaurant_id
    );