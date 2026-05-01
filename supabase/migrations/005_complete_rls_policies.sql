-- ============================================================================
-- BiteSync POS - Complete Role-Based RLS Policies (Story 1.3)
-- ============================================================================
-- This migration creates a complete set of role-based RLS policies
-- Run this AFTER dropping all existing policies
-- ============================================================================

-- ============================================================================
-- STEP 1: Drop ALL existing policies
-- ============================================================================

-- Restaurants
DROP POLICY IF EXISTS "Allow anonymous read restaurants" ON restaurants;
DROP POLICY IF EXISTS "Allow authenticated update restaurants" ON restaurants;

-- Users
DROP POLICY IF EXISTS "Users can read own record" ON users;
DROP POLICY IF EXISTS "Allow user insert" ON users;

-- Categories
DROP POLICY IF EXISTS "Authenticated users can read categories" ON categories;
DROP POLICY IF EXISTS "Authenticated users can manage categories" ON categories;
DROP POLICY IF EXISTS "Admins can insert categories" ON categories;
DROP POLICY IF EXISTS "Admins can update categories" ON categories;
DROP POLICY IF EXISTS "Admins can delete categories" ON categories;

-- Menu Items
DROP POLICY IF EXISTS "Authenticated users can read menu_items" ON menu_items;
DROP POLICY IF EXISTS "Authenticated users can manage menu_items" ON menu_items;
DROP POLICY IF EXISTS "Admins can insert menu_items" ON menu_items;
DROP POLICY IF EXISTS "Admins can update menu_items" ON menu_items;
DROP POLICY IF EXISTS "Admins can delete menu_items" ON menu_items;

-- Orders
DROP POLICY IF EXISTS "Authenticated users can read orders" ON orders;
DROP POLICY IF EXISTS "Authenticated users can create orders" ON orders;
DROP POLICY IF EXISTS "Authenticated users can update orders" ON orders;
DROP POLICY IF EXISTS "Admins can delete orders" ON orders;

-- Order Items
DROP POLICY IF EXISTS "Authenticated users can read order_items" ON order_items;
DROP POLICY IF EXISTS "Authenticated users can manage order_items" ON order_items;
DROP POLICY IF EXISTS "Authenticated users can insert order_items" ON order_items;
DROP POLICY IF EXISTS "Authenticated users can update order_items" ON order_items;
DROP POLICY IF EXISTS "Admins can delete order_items" ON order_items;

-- ============================================================================
-- STEP 2: Create new role-based policies
-- ============================================================================

-- ============================================================================
-- RESTAURANTS TABLE
-- Everyone can read, only admins can update
-- ============================================================================

CREATE POLICY "Anyone can read restaurants"
    ON restaurants FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can update restaurants"
    ON restaurants FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- ============================================================================
-- USERS TABLE
-- Users can read their own record, admins can manage all
-- ============================================================================

CREATE POLICY "Users can read own record"
    ON users FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Allow user insert"
    ON users FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- ============================================================================
-- CATEGORIES TABLE
-- Everyone can read, only admins can INSERT/UPDATE/DELETE
-- ============================================================================

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

-- ============================================================================
-- MENU_ITEMS TABLE
-- Everyone can read, only admins can INSERT/UPDATE/DELETE
-- ============================================================================

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

-- ============================================================================
-- ORDERS TABLE
-- Everyone can read/create/update, only admins can delete
-- ============================================================================

CREATE POLICY "Everyone can read orders"
    ON orders FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Everyone can create orders"
    ON orders FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Everyone can update orders"
    ON orders FOR UPDATE
    TO authenticated
    USING (true);

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

-- ============================================================================
-- ORDER_ITEMS TABLE
-- Everyone can read/create/update, only admins can delete
-- ============================================================================

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
