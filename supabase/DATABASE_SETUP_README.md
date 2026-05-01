# BiteSync POS - Database Setup Guide

## Complete Database Setup File

File: `complete_database_setup.sql`

This file contains everything needed to recreate the entire BiteSync POS database from scratch.

## What's Included

### 1. **Tables**

- `restaurants` - Restaurant configuration
- `users` - User accounts (Admin/Cashier)
- `user_audit_log` - Tracks all user management actions (role changes, password resets, user deletions, etc.)
- `categories` - Menu categories
- `menu_items` - Menu items with pricing
- `orders` - Sales orders
- `order_items` - Order line items
- `settings` - Restaurant settings (service charge, currency)

### 2. **Security**

- Row Level Security (RLS) enabled on all tables
- Role-based policies for Admin and Cashier access
- Proper authentication checks

### 3. **Performance**

- Indexes on frequently queried columns
- Optimized for read/write operations

### 4. **Features**

- Auto-updating timestamps (`updated_at`)
- Real-time replication for menu items
- Data validation with CHECK constraints
- Cascade deletes and restrictions

### 5. **Default Data**

- Default restaurant entry
- Default settings (10% service charge, LKR currency)

### 6. **Audit Logging**

- Every user management action (role change, password reset, user deletion, user creation) is recorded in `user_audit_log`.
- Tracks: who made the change, what was changed, previous and new values, timestamp, and description.
- Only admins can view or insert audit log entries for their restaurant.

## How to Use

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the entire contents of `complete_database_setup.sql`
5. Paste into the SQL Editor
6. Click **Run** (or press Ctrl/Cmd + Enter)
7. Wait for completion (should take 5-10 seconds)

### Option 2: Supabase CLI

```bash
# Make sure you're in the project directory
cd codebell_pos

# Run the SQL file
supabase db reset --db-url "your-database-url"

# Or apply directly
psql "your-database-url" -f supabase/complete_database_setup.sql
```

### Option 3: psql Command Line

```bash
psql -h db.your-project.supabase.co \
     -p 5432 \
     -d postgres \
     -U postgres \
     -f complete_database_setup.sql
```

## What Happens When You Run This

1. **Drops existing tables** (if any) - Clean slate
2. **Creates all tables** with proper relationships
3. **Adds indexes** for performance
4. **Sets up triggers** for auto-updating timestamps
5. **Enables RLS** on all tables
6. **Creates policies** for Admin and Cashier roles
7. **Inserts default data** (restaurant and settings)
8. **Enables real-time** for menu items table

## After Running the Setup

### 1. Create Test Users in Supabase Auth

Go to **Authentication > Users** in Supabase dashboard:

**Admin User:**

- Email: `admin@bitesync.test`
- Password: `admin123`

**Cashier User:**

- Email: `cashier@bitesync.test`
- Password: `cashier123`

### 2. Link Users to Database

After creating auth users, run this SQL to link them:

```sql
-- Get the restaurant ID
SELECT id FROM restaurants LIMIT 1;

-- Insert admin user (replace UUID with actual user ID from Auth)
INSERT INTO users (id, email, role, restaurant_id)
VALUES (
    'REPLACE_WITH_ADMIN_AUTH_UUID',
    'admin@bitesync.test',
    'admin',
    'REPLACE_WITH_RESTAURANT_ID'
);

-- Insert cashier user (replace UUID with actual user ID from Auth)
INSERT INTO users (id, email, role, restaurant_id)
VALUES (
    'REPLACE_WITH_CASHIER_AUTH_UUID',
    'cashier@bitesync.test',
    'cashier',
    'REPLACE_WITH_RESTAURANT_ID'
);
```

### 3. Verify Setup

Run this verification query:

```sql
SELECT
    'Restaurants' as table_name,
    COUNT(*) as count
FROM restaurants
UNION ALL
SELECT 'Users', COUNT(*) FROM users
UNION ALL
SELECT 'Categories', COUNT(*) FROM categories
UNION ALL
SELECT 'Menu Items', COUNT(*) FROM menu_items
UNION ALL
SELECT 'Orders', COUNT(*) FROM orders
UNION ALL
SELECT 'Settings', COUNT(*) FROM settings;
```

Expected results:

- Restaurants: 1
- Users: 2 (after adding test users)
- Categories: 0 (add via app)
- Menu Items: 0 (add via app)
- Orders: 0 (created via app)
- Settings: 1

## Troubleshooting

### Error: "relation already exists"

- The script drops tables first, but if there are dependent objects, you may need to drop them manually
- Solution: Run `DROP SCHEMA public CASCADE; CREATE SCHEMA public;` first

### Error: "permission denied"

- Make sure you're using the `postgres` user or a user with sufficient privileges
- Check your database connection string

### Real-time not working

- Verify real-time is enabled in Supabase project settings
- Check that `supabase_realtime` publication exists
- Restart your application

### RLS policies not working

- Verify users exist in both `auth.users` and `users` tables
- Check that user IDs match between tables
- Test with: `SELECT auth.uid(), * FROM users WHERE id = auth.uid();`

## Schema Diagram

```
restaurants (1)
    ├── users (N)
    ├── user_audit_log (N)
    ├── categories (N)
    │   └── menu_items (N)
    ├── orders (N)
    │   └── order_items (N)
    └── settings (1)
```

## Notes

- This is a **destructive operation** - it drops existing tables
- Always backup your data before running
- Default service charge: 10%
- Default currency: LKR (Sri Lankan Rupees)
- Real-time enabled for `menu_items` only

## Support

If you encounter issues:

1. Check Supabase logs in the dashboard
2. Verify your database connection
3. Ensure you have the latest schema version
4. Check the migration files in `supabase/migrations/` for reference
