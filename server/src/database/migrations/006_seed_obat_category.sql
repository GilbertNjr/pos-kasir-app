-- =============================================================================
-- MIGRATION 006: SEED KATEGORI OBAT & KESEHATAN
-- App: POS Kasir Usaha Campuran
-- =============================================================================

BEGIN;

INSERT INTO categories (category_id, category_name, business_unit, is_active)
VALUES ('cat-obat', 'Obat & Kesehatan', 'FNB', true)
ON CONFLICT (category_id) DO NOTHING;

COMMIT;
