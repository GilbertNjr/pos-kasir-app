-- Migration 009: Add dynamic modifiers support to products and transaction_items
ALTER TABLE products ADD COLUMN IF NOT EXISTS modifiers JSONB DEFAULT '[]'::jsonb;
ALTER TABLE transaction_items ADD COLUMN IF NOT EXISTS selected_modifiers JSONB DEFAULT '[]'::jsonb;
CREATE INDEX IF NOT EXISTS idx_products_modifiers ON products USING gin(modifiers);
