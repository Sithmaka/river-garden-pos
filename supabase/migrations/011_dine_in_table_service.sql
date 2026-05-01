-- Migration: Dine-In Table Service & Deferred Payment
-- Adds support for dine-in orders, table numbers, and table count configuration

-- Add order_type and table_number to orders table
ALTER TABLE orders
    ADD COLUMN order_type VARCHAR(20) NOT NULL DEFAULT 'take-away' CHECK (order_type IN ('take-away', 'dine-in')),
    ADD COLUMN table_number INTEGER CHECK (table_number >= 1),
    ADD COLUMN payment_method VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (payment_method IN ('pending', 'cash', 'card'));

-- Add table_count to settings table
ALTER TABLE settings
    ADD COLUMN table_count INTEGER DEFAULT 10 CHECK (table_count >= 1 AND table_count <= 100);
