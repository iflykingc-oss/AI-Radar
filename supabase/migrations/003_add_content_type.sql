-- Migration 003: Add content_type column to products table
-- Distinguishes between 'product' (tools/apps) and 'news' (industry news)

-- Add content_type column
ALTER TABLE products ADD COLUMN IF NOT EXISTS content_type TEXT DEFAULT 'product' CHECK (content_type IN ('product', 'news'));

-- Create index for filtering by content_type
CREATE INDEX IF NOT EXISTS idx_products_content_type ON products(content_type);

-- Update existing products based on their source
-- Product-focused sources default to 'product'
UPDATE products SET content_type = 'product' WHERE content_type IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN products.content_type IS 'Type of content: product (tool/app/service) or news (industry news/analysis)';
