-- Migration 008: Enable Real-Time for Menu Items
-- Description: Enable real-time replication for menu_items table
-- Story: 2.7 - Real-Time Menu Sync for Cashier View

-- Enable realtime for menu_items table
ALTER PUBLICATION supabase_realtime ADD TABLE menu_items;

-- Note: This enables real-time subscriptions for INSERT, UPDATE, DELETE events
-- The RLS policies already in place will ensure users only see data they're authorized to see
