-- Check the roles of our test users
SELECT 
    id,
    email,
    role,
    created_at
FROM users
WHERE email IN ('admin@bitesync.test', 'cashier@bitesync.test')
ORDER BY email;
