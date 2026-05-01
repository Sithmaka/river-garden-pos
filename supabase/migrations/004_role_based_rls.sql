-- ============================================================================
-- BiteSync POS - Role-Based RLS Policies (Story 1.3)
-- ============================================================================
-- This migration implements proper role-based access control
-- - Admin: Full CRUD on categories and menu_items, read-only on orders
-- - Cashier: Read-only on categories and menu_items, full CRUD on orders
-- ============================================================================

-- Drop ALL existing policies to start fresh
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
-- CATEGORIES: Admin full CRUD, Cashier read-only
-- ============================================================================

CREATE POLICY "Authenticated users can read categories"
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
-- MENU_ITEMS: Admin full CRUD, Cashier read-only
-- ============================================================================

CREATE POLICY "Authenticated users can read menu_items"
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
-- ORDERS: All users read, cashiers create/update, admins delete
-- ============================================================================

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
-- ORDER_ITEMS: All users read/insert/update, admins delete
-- ============================================================================

CREATE POLICY "Authenticated users can read order_items"
    ON order_items FOR SELECT
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

CREATE POLICY "Authenticated users can insert order_items"
    ON order_items FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated users can update order_items"
    ON order_items FOR UPDATE
    TO authenticated
    USING (true);
