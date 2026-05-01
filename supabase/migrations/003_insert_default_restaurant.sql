-- ============================================================================
-- River Garden POS - Insert Default Restaurant
-- ============================================================================
-- This creates the default restaurant record needed for MVP testing
-- ============================================================================

INSERT INTO restaurants (
    id,
    name,
    address,
    phone,
    service_charge_percent,
    currency
) VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', -- Fixed UUID for consistency
    'River Garden Restaurant',
    'Akkara Paha, Waduruppa, Road, Ambalantota 82100',
    '0472268282',
    10.00,
    'LKR'
)
ON CONFLICT (id) DO NOTHING; -- Prevents duplicate if already exists
