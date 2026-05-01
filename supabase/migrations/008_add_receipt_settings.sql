-- Migration 008: Add Receipt Customization Settings
-- Description: Add restaurant info fields for receipt printing
-- Date: 2025-11-10

-- Add receipt customization columns to settings table
ALTER TABLE settings
ADD COLUMN IF NOT EXISTS receipt_header TEXT DEFAULT 'BiteSync POS',
ADD COLUMN IF NOT EXISTS receipt_footer TEXT DEFAULT 'Thank you for your order!',
ADD COLUMN IF NOT EXISTS restaurant_address TEXT,
ADD COLUMN IF NOT EXISTS restaurant_phone TEXT;

-- Update existing settings with default values (if any exist)
UPDATE settings
SET 
  receipt_header = 'BiteSync POS',
  receipt_footer = 'Thank you for your order!'
WHERE receipt_header IS NULL;
