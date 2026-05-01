-- ============================================================================
-- DEBUG: Test UPDATE Policy for menu_items
-- ============================================================================
-- This will show us EXACTLY what UPDATE policies exist and why they're passing
-- ============================================================================

-- Step 1: Show ALL policies on menu_items table
SELECT 
    policyname,
    cmd,
    roles,
    permissive,
    qual AS using_clause,
    with_check
FROM pg_policies 
WHERE tablename = 'menu_items'
ORDER BY cmd, policyname;

-- Step 2: Show the ACTUAL policy definitions
SELECT 
    schemaname,
    tablename,
    policyname,
    CASE 
        WHEN cmd = 'r' THEN 'SELECT'
        WHEN cmd = 'a' THEN 'INSERT'
        WHEN cmd = 'w' THEN 'UPDATE'
        WHEN cmd = 'd' THEN 'DELETE'
        WHEN cmd = '*' THEN 'ALL'
        ELSE cmd::text
    END as command_type,
    permissive,
    ARRAY_TO_STRING(roles, ', ') as roles
FROM pg_policies 
WHERE tablename = 'menu_items';
