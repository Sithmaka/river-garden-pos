-- ============================================================================
-- BiteSync POS - Fix RLS Policies (Remove Circular Dependencies)
-- ============================================================================
-- Version: 1.1
-- Date: November 4, 2025
-- Description: Fix infinite recursion in RLS policies for MVP setup
-- ============================================================================

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can view restaurants" ON restaurants;
DROP POLICY IF EXISTS "Admins can update restaurants" ON restaurants;
DROP POLICY IF EXISTS "Cashiers can view restaurants" ON restaurants;

-- Drop problematic users policies
DROP POLICY IF EXISTS "Users can view users in their restaurant" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;
DROP POLICY IF EXISTS "Admins can update users" ON users;

-- ============================================================================
-- SIMPLIFIED RLS POLICIES FOR MVP
-- ============================================================================

-- RESTAURANTS: Allow authenticated users to read (needed for service charge)
-- Single restaurant setup - no multi-tenancy concerns for MVP
CREATE POLICY "Authenticated users can view restaurants"
    ON restaurants FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can update restaurants"
    ON restaurants FOR UPDATE
    TO authenticated
    USING (true);

-- USERS: Allow users to view themselves
CREATE POLICY "Users can view own record"
    ON users FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- CATEGORIES: Restaurant-scoped access
CREATE POLICY "Authenticated users can view categories"
    ON categories FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can manage categories"
    ON categories FOR ALL
    TO authenticated
    USING (true);

-- MENU_ITEMS: Full access for authenticated users (role checks will be in app layer for MVP)
CREATE POLICY "Authenticated users can view menu items"
    ON menu_items FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can manage menu items"
    ON menu_items FOR ALL
    TO authenticated
    USING (true);

-- ORDERS: Full access for authenticated users
CREATE POLICY "Authenticated users can view orders"
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

-- ORDER_ITEMS: Full access for authenticated users
CREATE POLICY "Authenticated users can view order items"
    ON order_items FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can manage order items"
    ON order_items FOR ALL
    TO authenticated
    USING (true);

-- ============================================================================
-- NOTES FOR POST-MVP
-- ============================================================================
-- These simplified policies allow all authenticated users full access.
-- Role-based restrictions (Admin vs Cashier) are enforced in the application layer.
-- Post-MVP: Implement proper RLS with role checks after user management is in place.
-- ============================================================================
