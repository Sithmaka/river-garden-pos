-- Migration 007: Create Settings Table
-- Description: Create settings table for restaurant-wide configuration (service charge, currency)
-- Story: 2.6 - Service Charge and Currency Configuration

-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  service_charge_percentage DECIMAL(5,2) DEFAULT 10.00 CHECK (service_charge_percentage >= 0 AND service_charge_percentage <= 20),
  currency_code VARCHAR(3) DEFAULT 'LKR' CHECK (currency_code IN ('LKR', 'USD')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(restaurant_id)
);

-- Add RLS policies for settings table
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Admin can view settings
CREATE POLICY "Admin can view settings"
  ON settings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Admin can insert settings
CREATE POLICY "Admin can insert settings"
  ON settings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Admin can update settings
CREATE POLICY "Admin can update settings"
  ON settings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Cashier can view settings (read-only, needed for order calculations)
CREATE POLICY "Cashier can view settings"
  ON settings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'cashier'
    )
  );

-- Insert default settings for existing restaurant
INSERT INTO settings (restaurant_id, service_charge_percentage, currency_code)
SELECT id, 10.00, 'LKR'
FROM restaurants
WHERE NOT EXISTS (
  SELECT 1 FROM settings WHERE settings.restaurant_id = restaurants.id
)
LIMIT 1;

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to auto-update updated_at timestamp
DROP TRIGGER IF EXISTS update_settings_updated_at ON settings;
CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
