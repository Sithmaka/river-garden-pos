-- ============================================================================
-- Migration: Add Printer Configuration Table
-- ============================================================================
-- Purpose: Store printer assignments per restaurant so they sync across all dashboards
-- Date: 2025-12-16

-- Create printer_configuration table
CREATE TABLE IF NOT EXISTS printer_configuration (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    customer_receipt_printer VARCHAR(255),
    kitchen_order_printer VARCHAR(255),
    is_qz_tray BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(restaurant_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_printer_config_restaurant ON printer_configuration(restaurant_id);

-- Create trigger for updated_at
CREATE TRIGGER update_printer_configuration_updated_at
    BEFORE UPDATE ON printer_configuration
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE printer_configuration ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow authenticated users (cashier/admin) to view printer config
CREATE POLICY "Allow authenticated users to read printer config"
    ON printer_configuration FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.restaurant_id = printer_configuration.restaurant_id
        )
    );

-- Allow admin to update printer config
CREATE POLICY "Allow admin to update printer config"
    ON printer_configuration FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
            AND users.restaurant_id = printer_configuration.restaurant_id
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
            AND users.restaurant_id = printer_configuration.restaurant_id
        )
    );

-- Allow admin to insert printer config
CREATE POLICY "Allow admin to insert printer config"
    ON printer_configuration FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
            AND users.restaurant_id = printer_configuration.restaurant_id
        )
    );

-- Insert default printer configuration for existing restaurant
INSERT INTO printer_configuration (restaurant_id, customer_receipt_printer, kitchen_order_printer, is_qz_tray)
SELECT id, NULL, NULL, true
FROM restaurants
WHERE id NOT IN (SELECT restaurant_id FROM printer_configuration)
LIMIT 1;
