-- Create audit log table to track all user management changes
CREATE TABLE IF NOT EXISTS user_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    admin_email TEXT NOT NULL,
    target_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    target_user_email TEXT NOT NULL,
    action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('user_created', 'password_reset', 'role_changed', 'user_deleted')),
    previous_value TEXT,
    new_value TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_audit_log_restaurant ON user_audit_log(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_admin ON user_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_target_user ON user_audit_log(target_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action_type ON user_audit_log(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON user_audit_log(created_at);

-- Enable RLS on audit log table
ALTER TABLE user_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policy - Users can see audit logs for their restaurant (admins only)
CREATE POLICY "audit_log_select_admin" ON user_audit_log
    FOR SELECT USING (
        is_admin(auth.uid())
        AND
        get_user_restaurant(auth.uid()) = restaurant_id
    );

-- RLS Policy - Only admins can insert audit logs for their restaurant
CREATE POLICY "audit_log_insert_admin" ON user_audit_log
    FOR INSERT WITH CHECK (
        is_admin(auth.uid())
        AND
        get_user_restaurant(auth.uid()) = restaurant_id
    );

-- Function to log user management actions
CREATE OR REPLACE FUNCTION log_user_action(
    p_admin_id UUID,
    p_admin_email TEXT,
    p_target_user_id UUID,
    p_target_user_email TEXT,
    p_restaurant_id UUID,
    p_action_type VARCHAR,
    p_previous_value TEXT DEFAULT NULL,
    p_new_value TEXT DEFAULT NULL,
    p_description TEXT DEFAULT NULL
)
RETURNS UUID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO user_audit_log (
        admin_id,
        admin_email,
        target_user_id,
        target_user_email,
        restaurant_id,
        action_type,
        previous_value,
        new_value,
        description
    )
    VALUES (
        p_admin_id,
        p_admin_email,
        p_target_user_id,
        p_target_user_email,
        p_restaurant_id,
        p_action_type,
        p_previous_value,
        p_new_value,
        p_description
    )
    RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$;

GRANT EXECUTE ON FUNCTION log_user_action TO authenticated;
