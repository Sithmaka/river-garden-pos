-- ============================================================================
-- DIAGNOSTIC: Check Current RLS Policies
-- ============================================================================
-- Run this in Supabase SQL Editor to see ALL current policies
-- ============================================================================

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('restaurants', 'users', 'categories', 'menu_items', 'orders', 'order_items')
ORDER BY tablename, policyname;
