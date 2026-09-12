-- Migration 008: Add dynamic linked stock columns to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS linked_product_id VARCHAR(36) REFERENCES products(product_id) ON DELETE SET NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS linked_qty_multiplier NUMERIC(10,2) DEFAULT 1.0;
CREATE INDEX IF NOT EXISTS idx_products_linked_product_id ON products(linked_product_id);
