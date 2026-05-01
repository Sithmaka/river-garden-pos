-- Show the EXACT USING clause for the UPDATE policy
SELECT 
    policyname,
    cmd,
    qual as using_clause_expression
FROM pg_policies 
WHERE tablename = 'menu_items' 
  AND policyname = 'Admins can update menu_items';
