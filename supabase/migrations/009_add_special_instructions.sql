-- Add special_instructions column to orders table
ALTER TABLE orders 
ADD COLUMN special_instructions TEXT;

-- Add comment for documentation
COMMENT ON COLUMN orders.special_instructions IS 'Optional special instructions from customer for the kitchen';
