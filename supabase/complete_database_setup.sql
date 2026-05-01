-- ============================================================================
-- BiteSync POS - Complete Database Setup Script
-- ============================================================================
-- Version: 1.0
-- Date: November 10, 2025
-- Description: Single file to recreate entire database from scratch
-- Usage: Run this file in Supabase SQL Editor or psql
-- ============================================================================

-- ============================================================================
-- STEP 1: Enable Required Extensions
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- STEP 2: Drop All Existing Tables (Clean Slate)
-- ============================================================================

DROP TABLE IF EXISTS user_audit_log CASCADE;
DROP TABLE IF EXISTS printer_configuration CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS settings CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS restaurants CASCADE;

-- ============================================================================
-- STEP 3: Create Tables
-- ============================================================================

-- Table: restaurants
-- Purpose: Store restaurant configuration (single row for MVP)
CREATE TABLE restaurants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(50),
    service_charge_percent DECIMAL(5,2) NOT NULL DEFAULT 10.00 CHECK (service_charge_percent >= 0 AND service_charge_percent <= 20),
    currency VARCHAR(3) NOT NULL DEFAULT 'LKR' CHECK (currency IN ('LKR', 'USD')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: users
-- Purpose: Store user accounts with role-based access (Admin/Cashier)
-- Note: Links to Supabase Auth via id
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'cashier', 'waiter')),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: categories
-- Purpose: Organize menu items into browsable groups
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    emoji VARCHAR(10),
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(restaurant_id, name)
);

-- Table: menu_items
-- Purpose: Sellable items with price, category, and availability
CREATE TABLE menu_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    description TEXT,
    image_url TEXT,
    is_available BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: orders
-- Purpose: Completed sales with customer info, payment, and totals
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    cashier_id UUID REFERENCES users(id) ON DELETE SET NULL,
    customer_name VARCHAR(255),
    customer_phone VARCHAR(50),
    special_instructions TEXT,
    subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
    service_charge_percent DECIMAL(5,2) NOT NULL CHECK (service_charge_percent >= 0 AND service_charge_percent <= 20),
    service_charge_amount DECIMAL(10,2) NOT NULL CHECK (service_charge_amount >= 0),
    total DECIMAL(10,2) NOT NULL CHECK (total >= 0),
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('cash', 'card')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
    order_type VARCHAR(20) NOT NULL DEFAULT 'take-away' CHECK (order_type IN ('take-away', 'dine-in')),
    table_number INTEGER CHECK (table_number >= 1),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    paid_at TIMESTAMPTZ
);

-- Table: order_items
-- Purpose: Line items in an order (with quantity and price snapshot)
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
    menu_item_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    line_total DECIMAL(10,2) NOT NULL CHECK (line_total >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: settings
-- Purpose: Restaurant-wide configuration (service charge, currency, receipt info)
CREATE TABLE settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    service_charge_percentage DECIMAL(5,2) DEFAULT 10.00 CHECK (service_charge_percentage >= 0 AND service_charge_percentage <= 20),
    currency_code VARCHAR(3) DEFAULT 'LKR' CHECK (currency_code IN ('LKR', 'USD')),
    receipt_header TEXT DEFAULT 'BiteSync POS',
    receipt_footer TEXT DEFAULT 'Thank you for your order!',
    restaurant_address TEXT,
    restaurant_phone TEXT,
    table_count INTEGER DEFAULT 10 CHECK (table_count >= 1 AND table_count <= 100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(restaurant_id)
);

-- Table: printer_configuration
-- Purpose: Store printer assignments per restaurant for synchronization across dashboards
CREATE TABLE printer_configuration (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    customer_receipt_printer VARCHAR(255),
    kitchen_order_printer VARCHAR(255),
    is_qz_tray BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(restaurant_id)
);

-- Table: user_audit_log
-- Purpose: Track all user management changes (password resets, role changes, user deletions, etc.)
CREATE TABLE user_audit_log (
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

-- ============================================================================
-- STEP 4: Create Indexes for Performance
-- ============================================================================

CREATE INDEX idx_users_restaurant ON users(restaurant_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_categories_restaurant ON categories(restaurant_id);
CREATE INDEX idx_categories_sort_order ON categories(sort_order);
CREATE INDEX idx_menu_items_restaurant ON menu_items(restaurant_id);
CREATE INDEX idx_menu_items_category ON menu_items(category_id);
CREATE INDEX idx_menu_items_available ON menu_items(is_available);
CREATE INDEX idx_orders_restaurant ON orders(restaurant_id);
CREATE INDEX idx_orders_cashier ON orders(cashier_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_menu_item ON order_items(menu_item_id);
CREATE INDEX idx_audit_log_restaurant ON user_audit_log(restaurant_id);
CREATE INDEX idx_audit_log_admin ON user_audit_log(admin_id);
CREATE INDEX idx_audit_log_target_user ON user_audit_log(target_user_id);
CREATE INDEX idx_audit_log_action_type ON user_audit_log(action_type);
CREATE INDEX idx_audit_log_created_at ON user_audit_log(created_at);
CREATE INDEX idx_printer_config_restaurant ON printer_configuration(restaurant_id);

-- ============================================================================
-- STEP 5: Create Triggers for updated_at Timestamps
-- ============================================================================

-- Create trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables
CREATE TRIGGER update_restaurants_updated_at
    BEFORE UPDATE ON restaurants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menu_items_updated_at
    BEFORE UPDATE ON menu_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at
    BEFORE UPDATE ON settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_printer_configuration_updated_at
    BEFORE UPDATE ON printer_configuration
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STEP 6: Enable Row Level Security (RLS)
-- ============================================================================

ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE printer_configuration ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 7: Create Helper Functions
-- ============================================================================

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
CREATE OR REPLACE FUNCTION verify_admin_password(admin_id UUID, password_input TEXT)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    is_valid BOOLEAN;
BEGIN
    -- Use Supabase Auth's built-in password verification
    SELECT COUNT(*) > 0 INTO is_valid
    FROM auth.users
    WHERE id = admin_id
    AND encrypted_password = crypt(password_input, encrypted_password)
    AND is_admin(id) = true;

    RETURN is_valid;
END;
$$;

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

GRANT EXECUTE ON FUNCTION is_admin TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_restaurant TO authenticated;
GRANT EXECUTE ON FUNCTION verify_admin_password TO authenticated;
GRANT EXECUTE ON FUNCTION log_user_action TO authenticated;

-- ============================================================================
-- STEP 8: Create RLS Policies
-- ============================================================================

-- RESTAURANTS Policies
CREATE POLICY "Anyone can read restaurants"
    ON restaurants FOR SELECT
    USING (true);

CREATE POLICY "Admins can update restaurants"
    ON restaurants FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- USERS Policies
-- Basic policy - users can see their own record
CREATE POLICY "user_select_self" ON users
    FOR SELECT USING (
        id = auth.uid()
    );

-- Admin policy - admins can see users in their restaurant
CREATE POLICY "user_select_admin" ON users
    FOR SELECT USING (
        is_admin(auth.uid()) 
        AND 
        get_user_restaurant(auth.uid()) = restaurant_id
    );

-- Admin update policy
CREATE POLICY "user_update_admin" ON users
    FOR UPDATE USING (
        is_admin(auth.uid())
        AND
        get_user_restaurant(auth.uid()) = restaurant_id
    );

-- AUDIT LOG Policies
CREATE POLICY "audit_log_select_admin" ON user_audit_log
    FOR SELECT USING (
        is_admin(auth.uid())
        AND
        get_user_restaurant(auth.uid()) = restaurant_id
    );

CREATE POLICY "audit_log_insert_admin" ON user_audit_log
    FOR INSERT WITH CHECK (
        is_admin(auth.uid())
        AND
        get_user_restaurant(auth.uid()) = restaurant_id
    );

-- CATEGORIES Policies
CREATE POLICY "Everyone can read categories"
    ON categories FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can insert categories"
    ON categories FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can update categories"
    ON categories FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can delete categories"
    ON categories FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- MENU_ITEMS Policies
CREATE POLICY "Everyone can read menu_items"
    ON menu_items FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can insert menu_items"
    ON menu_items FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can update menu_items"
    ON menu_items FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can delete menu_items"
    ON menu_items FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Everyone can read orders"
    ON orders FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Everyone can create orders"
    ON orders FOR INSERT
    TO authenticated
    WITH CHECK (
        -- Take-away: no table required
        (order_type = 'take-away' AND table_number IS NULL)
        OR
        -- Dine-in: table required and must be valid
        (order_type = 'dine-in' AND table_number >= 1 AND table_number <= (
            SELECT table_count FROM settings WHERE restaurant_id = orders.restaurant_id LIMIT 1
        ))
    );

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Orders: Allow staff to insert new orders (dine-in or take-away)
CREATE POLICY "Allow staff to insert orders"
    ON orders FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('cashier', 'waiter', 'admin')));

-- Orders: Allow staff to select/view orders
CREATE POLICY "Allow staff to select orders"
    ON orders FOR SELECT
    USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('cashier', 'waiter', 'admin')));

-- Orders: Allow cashier/admin to close open orders (mark paid)
CREATE POLICY "Allow cashier/admin to close open orders"
    ON orders FOR UPDATE
    USING (
        EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('cashier', 'admin'))
        AND status = 'open'
    );

-- Orders: Allow staff to update open orders (add items, change instructions)
CREATE POLICY "Allow staff to update open orders"
    ON orders FOR UPDATE
    USING (
        EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('cashier', 'waiter', 'admin'))
        AND status = 'open'
    );

-- Order Items: Allow staff to insert items for open orders
CREATE POLICY "Allow staff to insert items for open orders"
    ON order_items FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM orders o
            WHERE o.id = order_items.order_id
            AND o.status = 'open'
            AND EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('cashier', 'waiter', 'admin'))
        )
    );

-- Order Items: Allow staff to select/view items
CREATE POLICY "Allow staff to select order items"
    ON order_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM orders o
            WHERE o.id = order_items.order_id
            AND EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('cashier', 'waiter', 'admin'))
        )
    );

-- Settings: Allow all staff to read settings
CREATE POLICY "Allow staff to select settings"
    ON settings FOR SELECT
    USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('cashier', 'waiter', 'admin')));

-- Settings: Allow admin to update settings (including table_count)
CREATE POLICY "Allow admin to update settings"
    ON settings FOR UPDATE
    USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));

CREATE POLICY "Admins can delete orders"
    ON orders FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- ORDER_ITEMS Policies
CREATE POLICY "Everyone can read order_items"
    ON order_items FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Everyone can insert order_items"
    ON order_items FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Everyone can update order_items"
    ON order_items FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Admins can delete order_items"
    ON order_items FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- SETTINGS Policies
CREATE POLICY "Admin can view settings"
    ON settings FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admin can insert settings"
    ON settings FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admin can update settings"
    ON settings FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Cashier can view settings"
    ON settings FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'cashier'
        )
    );

-- PRINTER_CONFIGURATION Policies
-- Allow authenticated users (cashier/admin) to view printer config
CREATE POLICY "Allow authenticated users to read printer config"
    ON printer_configuration FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.restaurant_id = printer_configuration.restaurant_id
        )
    );

-- Allow admin to update printer config
CREATE POLICY "Allow admin to update printer config"
    ON printer_configuration FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
            AND users.restaurant_id = printer_configuration.restaurant_id
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
            AND users.restaurant_id = printer_configuration.restaurant_id
        )
    );

-- Allow admin to insert printer config
CREATE POLICY "Allow admin to insert printer config"
    ON printer_configuration FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
            AND users.restaurant_id = printer_configuration.restaurant_id
        )
    );

-- ============================================================================
-- STEP 9: Insert Default Data
-- ============================================================================

-- Insert default restaurant
INSERT INTO restaurants (name, address, phone, service_charge_percent, currency)
VALUES (
    'River Garden Restaurant',
    'Akkara Paha, Waduruppa, Road, Ambalantota 82100',
    '0472268282',
    10.00,
    'LKR'
);

-- Insert default settings (linked to restaurant)
INSERT INTO settings (
    restaurant_id, 
    service_charge_percentage, 
    currency_code,
    receipt_header,
    receipt_footer,
    restaurant_address,
    restaurant_phone
)
SELECT 
    id, 
    10.00, 
    'LKR',
    'River Garden Restaurant',
    'Thank you for dining with us! 🌿',
    'Akkara Paha, Waduruppa, Road, Ambalantota 82100',
    '0472268282'
FROM restaurants
WHERE name = 'River Garden Restaurant'
LIMIT 1;

-- Insert default printer configuration (linked to restaurant)
INSERT INTO printer_configuration (
    restaurant_id,
    customer_receipt_printer,
    kitchen_order_printer,
    is_qz_tray
)
SELECT 
    id,
    NULL,
    NULL,
    true
FROM restaurants
WHERE name = 'River Garden Restaurant'
LIMIT 1;

-- ============================================================================
-- STEP 10: Enable Real-Time Replication
-- ============================================================================

-- Enable realtime for menu_items table (for cashier real-time sync)
ALTER PUBLICATION supabase_realtime ADD TABLE menu_items;

-- Enable realtime for printer_configuration table (for printer sync across dashboards)
ALTER PUBLICATION supabase_realtime ADD TABLE printer_configuration;

-- ============================================================================
-- SETUP COMPLETE
-- ============================================================================

-- Verification Queries (Optional - Run these to verify setup)
-- SELECT 'Restaurants' as table_name, COUNT(*) as count FROM restaurants
-- UNION ALL
-- SELECT 'Users', COUNT(*) FROM users
-- UNION ALL
-- SELECT 'Categories', COUNT(*) FROM categories
-- UNION ALL
-- SELECT 'Menu Items', COUNT(*) FROM menu_items
-- UNION ALL
-- SELECT 'Orders', COUNT(*) FROM orders
-- UNION ALL
-- SELECT 'Settings', COUNT(*) FROM settings
-- UNION ALL
-- SELECT 'Printer Configuration', COUNT(*) FROM printer_configuration;

-- ============================================================================
-- RPC FUNCTIONS: Transaction Control
-- Purpose: Provide transaction control for multi-step operations
-- ============================================================================

-- Begin transaction (placeholder - actual work is done in subsequent operations)
CREATE OR REPLACE FUNCTION begin_transaction()
RETURNS void AS $$
BEGIN
  -- Transaction begins automatically when this function is called
  -- No explicit action needed in Supabase
  NULL;
END;
$$ LANGUAGE plpgsql;

-- Commit transaction (placeholder - commit happens automatically)
CREATE OR REPLACE FUNCTION commit_transaction()
RETURNS void AS $$
BEGIN
  -- Transaction commits automatically after successful operations
  -- No explicit action needed in Supabase
  NULL;
END;
$$ LANGUAGE plpgsql;

-- Rollback transaction (placeholder - rollback happens on error)
CREATE OR REPLACE FUNCTION rollback_transaction()
RETURNS void AS $$
BEGIN
  -- Transaction rolls back automatically on error
  -- No explicit action needed in Supabase
  NULL;
END;
$$ LANGUAGE plpgsql;
-- ============================================================================
-- RPC FUNCTION: Auto-confirm User Email
-- Purpose: Allow admins to auto-confirm newly created users without email verification
-- ============================================================================

CREATE OR REPLACE FUNCTION confirm_user_email(user_email VARCHAR)
RETURNS boolean AS $$
DECLARE
  user_id UUID;
BEGIN
  -- Find the user in auth.users by email
  SELECT id INTO user_id FROM auth.users WHERE email = user_email LIMIT 1;
  
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'User not found with email: %', user_email;
  END IF;
  
  -- Update the user's email_confirmed_at to mark as confirmed
  UPDATE auth.users 
  SET email_confirmed_at = NOW() 
  WHERE id = user_id;
  
  RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- RPC FUNCTION: Create and Confirm User (Admin Only)
-- Purpose: Create a new auth user and automatically confirm them
-- Requires: Caller must be an admin
-- ============================================================================

CREATE OR REPLACE FUNCTION create_user_for_restaurant(
  p_email VARCHAR,
  p_password VARCHAR,
  p_role VARCHAR,
  p_restaurant_id UUID
)
RETURNS TABLE(
  user_id UUID,
  success BOOLEAN,
  message VARCHAR
) AS $$
DECLARE
  v_user_id UUID;
  v_admin_check BOOLEAN;
BEGIN
  -- Check if caller is admin
  v_admin_check := (
    SELECT EXISTS(
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
  
  IF NOT v_admin_check THEN
    RETURN QUERY SELECT NULL::UUID, FALSE, 'Only admins can create users'::VARCHAR;
    RETURN;
  END IF;
  
  -- Create user in auth.users table via admin function (will be called server-side)
  -- For now, just insert into users table with placeholder ID
  -- The admin must create the auth user first via signUp, then we confirm it
  
  -- Try to find existing unconfirmed user
  SELECT id INTO v_user_id FROM auth.users 
  WHERE email = p_email 
  LIMIT 1;
  
  IF v_user_id IS NOT NULL THEN
    -- Confirm the email
    UPDATE auth.users 
    SET email_confirmed_at = NOW() 
    WHERE id = v_user_id;
    
    -- Insert into users table if not already there
    INSERT INTO users (id, email, role, restaurant_id)
    VALUES (v_user_id, p_email, p_role, p_restaurant_id)
    ON CONFLICT (id) DO NOTHING;
    
    RETURN QUERY SELECT v_user_id, TRUE, 'User created and confirmed successfully'::VARCHAR;
  ELSE
    RETURN QUERY SELECT NULL::UUID, FALSE, 'Auth user does not exist. Create auth user first.'::VARCHAR;
  END IF;
  
EXCEPTION WHEN OTHERS THEN
  RETURN QUERY SELECT NULL::UUID, FALSE, SQLERRM::VARCHAR;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- GRANT PERMISSIONS FOR RPC FUNCTIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION confirm_user_email(VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION create_user_for_restaurant(VARCHAR, VARCHAR, VARCHAR, UUID) TO authenticated;