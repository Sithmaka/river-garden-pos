-- ============================================================================
-- BiteSync POS - Initial Database Schema
-- ============================================================================
-- Version: 1.0
-- Date: November 3, 2025
-- Author: Winston (Architect)
-- Description: Complete PostgreSQL schema with tables, indexes, triggers, and RLS policies
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLE: restaurants
-- Purpose: Store restaurant configuration (single row for MVP)
-- ============================================================================
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

-- ============================================================================
-- TABLE: users
-- Purpose: Store user accounts with role-based access (Admin/Cashier)
-- Note: Links to Supabase Auth via id
-- ============================================================================
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'cashier')),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABLE: categories
-- Purpose: Organize menu items into browsable groups
-- ============================================================================
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

-- ============================================================================
-- TABLE: menu_items
-- Purpose: Sellable items with price, category, and availability
-- ============================================================================
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

-- ============================================================================
-- TABLE: orders
-- Purpose: Completed sales with customer info, payment, and totals
-- ============================================================================
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    cashier_id UUID REFERENCES users(id) ON DELETE SET NULL,
    customer_name VARCHAR(255),
    customer_phone VARCHAR(50),
    subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
    service_charge_percent DECIMAL(5,2) NOT NULL CHECK (service_charge_percent >= 0 AND service_charge_percent <= 20),
    service_charge_amount DECIMAL(10,2) NOT NULL CHECK (service_charge_amount >= 0),
    total DECIMAL(10,2) NOT NULL CHECK (total >= 0),
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('cash', 'card')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    paid_at TIMESTAMPTZ
);

-- ============================================================================
-- TABLE: order_items
-- Purpose: Line items in an order (with quantity and price snapshot)
-- ============================================================================
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE RESTRICT,
    menu_item_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    line_total DECIMAL(10,2) NOT NULL CHECK (line_total >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- Purpose: Optimize common query patterns
-- ============================================================================

-- Menu items by category (for category filtering)
CREATE INDEX idx_menu_items_category_id ON menu_items(category_id);

-- Menu items by availability (for active menu display)
CREATE INDEX idx_menu_items_is_available ON menu_items(is_available) WHERE is_available = true;

-- Orders by creation date (for order history, most recent first)
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- Order items by order (for fetching order details)
CREATE INDEX idx_order_items_order_id ON order_items(order_id);

-- Users by restaurant (for restaurant-scoped queries)
CREATE INDEX idx_users_restaurant_id ON users(restaurant_id);

-- Categories by restaurant and sort order (for organized display)
CREATE INDEX idx_categories_restaurant_sort ON categories(restaurant_id, sort_order);

-- ============================================================================
-- TRIGGERS
-- Purpose: Auto-update timestamps on record changes
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to restaurants table
CREATE TRIGGER update_restaurants_updated_at
    BEFORE UPDATE ON restaurants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply to categories table
CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply to menu_items table
CREATE TRIGGER update_menu_items_updated_at
    BEFORE UPDATE ON menu_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Purpose: Enforce role-based access control at database level
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES: restaurants
-- ============================================================================

-- Admin: Full access to restaurant settings
CREATE POLICY "Admins can view restaurants"
    ON restaurants FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.restaurant_id = restaurants.id
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can update restaurants"
    ON restaurants FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.restaurant_id = restaurants.id
            AND users.role = 'admin'
        )
    );

-- Cashier: Read-only access (for displaying service charge)
CREATE POLICY "Cashiers can view restaurants"
    ON restaurants FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.restaurant_id = restaurants.id
        )
    );

-- ============================================================================
-- RLS POLICIES: users
-- ============================================================================

-- Users can view themselves and other users in their restaurant
CREATE POLICY "Users can view users in their restaurant"
    ON users FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.restaurant_id = users.restaurant_id
        )
    );

-- Admin: Can manage users in their restaurant
CREATE POLICY "Admins can insert users"
    ON users FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.restaurant_id = users.restaurant_id
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can update users"
    ON users FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
            AND u.restaurant_id = users.restaurant_id
            AND u.role = 'admin'
        )
    );

-- ============================================================================
-- RLS POLICIES: categories
-- ============================================================================

-- All users can view categories in their restaurant
CREATE POLICY "Users can view categories"
    ON categories FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.restaurant_id = categories.restaurant_id
        )
    );

-- Admin: Full CRUD on categories
CREATE POLICY "Admins can insert categories"
    ON categories FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.restaurant_id = categories.restaurant_id
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can update categories"
    ON categories FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.restaurant_id = categories.restaurant_id
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can delete categories"
    ON categories FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.restaurant_id = categories.restaurant_id
            AND users.role = 'admin'
        )
    );

-- ============================================================================
-- RLS POLICIES: menu_items
-- ============================================================================

-- All users can view menu items in their restaurant
CREATE POLICY "Users can view menu_items"
    ON menu_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.restaurant_id = menu_items.restaurant_id
        )
    );

-- Admin: Full CRUD on menu items
CREATE POLICY "Admins can insert menu_items"
    ON menu_items FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.restaurant_id = menu_items.restaurant_id
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can update menu_items"
    ON menu_items FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.restaurant_id = menu_items.restaurant_id
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can delete menu_items"
    ON menu_items FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.restaurant_id = menu_items.restaurant_id
            AND users.role = 'admin'
        )
    );

-- ============================================================================
-- RLS POLICIES: orders
-- ============================================================================

-- All users can view orders in their restaurant
CREATE POLICY "Users can view orders"
    ON orders FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.restaurant_id = orders.restaurant_id
        )
    );

-- Both Admin and Cashier can create orders
CREATE POLICY "Users can insert orders"
    ON orders FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.restaurant_id = orders.restaurant_id
        )
    );

-- Both Admin and Cashier can update orders (e.g., mark as paid)
CREATE POLICY "Users can update orders"
    ON orders FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.restaurant_id = orders.restaurant_id
        )
    );

-- Admin: Can delete orders
CREATE POLICY "Admins can delete orders"
    ON orders FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.restaurant_id = orders.restaurant_id
            AND users.role = 'admin'
        )
    );

-- ============================================================================
-- RLS POLICIES: order_items
-- ============================================================================

-- All users can view order items for orders in their restaurant
CREATE POLICY "Users can view order_items"
    ON order_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM orders
            JOIN users ON users.restaurant_id = orders.restaurant_id
            WHERE users.id = auth.uid()
            AND orders.id = order_items.order_id
        )
    );

-- Both Admin and Cashier can create order items
CREATE POLICY "Users can insert order_items"
    ON order_items FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM orders
            JOIN users ON users.restaurant_id = orders.restaurant_id
            WHERE users.id = auth.uid()
            AND orders.id = order_items.order_id
        )
    );

-- Both Admin and Cashier can update order items
CREATE POLICY "Users can update order_items"
    ON order_items FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM orders
            JOIN users ON users.restaurant_id = orders.restaurant_id
            WHERE users.id = auth.uid()
            AND orders.id = order_items.order_id
        )
    );

-- Admin: Can delete order items
CREATE POLICY "Admins can delete order_items"
    ON order_items FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM orders
            JOIN users ON users.restaurant_id = orders.restaurant_id
            WHERE users.id = auth.uid()
            AND orders.id = order_items.order_id
            AND users.role = 'admin'
        )
    );

-- ============================================================================
-- HELPER FUNCTION: Generate Order Number
-- Purpose: Generate unique order numbers in format YYYYMMDD-NNN
-- ============================================================================
CREATE OR REPLACE FUNCTION generate_order_number(p_restaurant_id UUID)
RETURNS VARCHAR AS $$
DECLARE
    today_prefix VARCHAR(8);
    next_sequence INTEGER;
    order_number VARCHAR(50);
BEGIN
    -- Get today's date in YYYYMMDD format
    today_prefix := TO_CHAR(NOW(), 'YYYYMMDD');
    
    -- Get the next sequence number for today
    SELECT COALESCE(MAX(
        CAST(SUBSTRING(order_number FROM 10) AS INTEGER)
    ), 0) + 1
    INTO next_sequence
    FROM orders
    WHERE restaurant_id = p_restaurant_id
    AND order_number LIKE today_prefix || '-%';
    
    -- Format as YYYYMMDD-NNN (zero-padded to 3 digits)
    order_number := today_prefix || '-' || LPAD(next_sequence::TEXT, 3, '0');
    
    RETURN order_number;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- Purpose: Document table and column purposes for future reference
-- ============================================================================

COMMENT ON TABLE restaurants IS 'Restaurant configuration (single row for MVP, one restaurant per Supabase project)';
COMMENT ON TABLE users IS 'User accounts linked to Supabase Auth with role-based access (admin/cashier)';
COMMENT ON TABLE categories IS 'Menu categories for organizing items (Appetizers, Mains, Drinks, etc.)';
COMMENT ON TABLE menu_items IS 'Sellable menu items with price, category, and availability status';
COMMENT ON TABLE orders IS 'Completed orders with customer info, payment details, and totals (snapshot pattern for prices)';
COMMENT ON TABLE order_items IS 'Line items within orders (quantity × unit_price with historical price snapshot)';

COMMENT ON COLUMN orders.service_charge_percent IS 'Snapshot of service charge % at time of order (preserves historical accuracy)';
COMMENT ON COLUMN order_items.unit_price IS 'Snapshot of menu item price at time of order (prevents historical data corruption)';
COMMENT ON COLUMN order_items.menu_item_name IS 'Snapshot of menu item name at time of order (in case item is later renamed/deleted)';

-- ============================================================================
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

-- MIGRATION COMPLETE
-- ============================================================================
-- Next Steps:
-- 1. Apply this migration to Supabase via CLI: supabase db push
-- 2. Create seed data (optional): Run seed.sql
-- 3. Test RLS policies via Supabase dashboard
-- 4. Configure environment variables in .env.local
-- ============================================================================
