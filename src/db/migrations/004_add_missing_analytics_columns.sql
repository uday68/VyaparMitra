-- Add missing columns for analytics services
-- Migration 004

-- Add missing columns to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS reorder_level INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS lead_time_days INTEGER DEFAULT 7;

-- Update existing products with default values
UPDATE products 
SET 
  cost_price = price * 0.7,  -- Assume 30% margin as default
  reorder_level = GREATEST(stock_quantity * 0.1, 5),  -- 10% of current stock or minimum 5
  lead_time_days = 7
WHERE cost_price = 0 OR cost_price IS NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_cost_price ON products(cost_price);
CREATE INDEX IF NOT EXISTS idx_products_reorder_level ON products(reorder_level);
CREATE INDEX IF NOT EXISTS idx_products_lead_time ON products(lead_time_days);

COMMIT;