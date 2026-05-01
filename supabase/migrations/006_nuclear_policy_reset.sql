-- ============================================================================
-- BiteSync POS - Nuclear RLS Policy Reset (Story 1.3)
-- ============================================================================
-- This migration uses a nuclear approach to drop ALL policies
-- by querying the system catalog, then recreates them properly
-- ============================================================================

-- ============================================================================
-- STEP 1: Nuclear drop - drop ALL policies from our tables
-- ============================================================================

DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies from restaurants
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'restaurants') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON restaurants';
    END LOOP;
    
    -- Drop all policies from users
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'users') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON users';
    END LOOP;
    
    -- Drop all policies from categories
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'categories') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON categories';
    END LOOP;
    
    -- Drop all policies from menu_items
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'menu_items') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON menu_items';
    END LOOP;
    
    -- Drop all policies from orders
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'orders') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON orders';
    END LOOP;
    
    -- Drop all policies from order_items
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'order_items') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON order_items';
    END LOOP;
END $$;

-- ============================================================================
-- STEP 2: Create new role-based policies
-- ============================================================================

-- RESTAURANTS
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

-- USERS
CREATE POLICY "Users can read own record"
    ON users FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Allow user insert"
    ON users FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- CATEGORIES
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

-- MENU_ITEMS
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

-- ORDERS
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

-- ORDER_ITEMS
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
