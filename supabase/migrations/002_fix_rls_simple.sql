-- ============================================================================
-- BiteSync POS - Simple RLS Fix for MVP Testing
-- ============================================================================
-- This migration removes the circular dependency and allows anonymous
-- access to restaurants table for connection testing before auth is set up.
-- ============================================================================

-- Drop all existing RLS policies (we'll recreate simpler ones)
DROP POLICY IF EXISTS "Admins can view restaurants" ON restaurants;
DROP POLICY IF EXISTS "Admins can update restaurants" ON restaurants;
DROP POLICY IF EXISTS "Cashiers can view restaurants" ON restaurants;
DROP POLICY IF EXISTS "Users can view users in their restaurant" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;
DROP POLICY IF EXISTS "Admins can update users" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;

-- ============================================================================
-- SIMPLIFIED POLICIES FOR MVP
-- ============================================================================

-- RESTAURANTS: Allow everyone to read (for initial testing)
-- In production, you'd want proper auth checks
CREATE POLICY "Allow anonymous read restaurants"
    ON restaurants FOR SELECT
    USING (true);

CREATE POLICY "Allow authenticated update restaurants"
    ON restaurants FOR UPDATE
    TO authenticated
    USING (true);

-- USERS: Simple self-access policy
CREATE POLICY "Users can read own record"
    ON users FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Allow user insert"
    ON users FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- CATEGORIES: Open access for authenticated users
DROP POLICY IF EXISTS "Admins can view categories" ON categories;
DROP POLICY IF EXISTS "Admins can insert categories" ON categories;
DROP POLICY IF EXISTS "Admins can update categories" ON categories;
DROP POLICY IF EXISTS "Admins can delete categories" ON categories;

CREATE POLICY "Authenticated users can read categories"
    ON categories FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can manage categories"
    ON categories FOR ALL
    TO authenticated
    USING (true);

-- MENU_ITEMS: Open access for authenticated users
DROP POLICY IF EXISTS "Admins can view menu_items" ON menu_items;
DROP POLICY IF EXISTS "Admins can insert menu_items" ON menu_items;
DROP POLICY IF EXISTS "Admins can update menu_items" ON menu_items;
DROP POLICY IF EXISTS "Admins can delete menu_items" ON menu_items;
DROP POLICY IF EXISTS "Cashiers can view available menu_items" ON menu_items;

CREATE POLICY "Authenticated users can read menu_items"
    ON menu_items FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can manage menu_items"
    ON menu_items FOR ALL
    TO authenticated
    USING (true);

-- ORDERS: Open access for authenticated users
DROP POLICY IF EXISTS "Admins can view orders" ON orders;
DROP POLICY IF EXISTS "Cashiers can insert orders" ON orders;
DROP POLICY IF EXISTS "Cashiers can update own orders" ON orders;

CREATE POLICY "Authenticated users can read orders"
    ON orders FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can create orders"
    ON orders FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated users can update orders"
    ON orders FOR UPDATE
    TO authenticated
    USING (true);

-- ORDER_ITEMS: Open access for authenticated users
DROP POLICY IF EXISTS "Admins can view order_items" ON order_items;
DROP POLICY IF EXISTS "Cashiers can manage order_items for own orders" ON order_items;

CREATE POLICY "Authenticated users can read order_items"
    ON order_items FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can manage order_items"
    ON order_items FOR ALL
    TO authenticated
    USING (true);
