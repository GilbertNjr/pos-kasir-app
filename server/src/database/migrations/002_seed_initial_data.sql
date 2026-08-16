-- =============================================================================
-- MIGRATION 002: SEED DATA AWAL SYSTEM & MASTER DATA POS KASIR
-- =============================================================================

BEGIN;

-- 1. SEED ROLES
INSERT INTO roles (role_id, role_name, description) VALUES
  ('role-owner', 'OWNER', 'Hak akses penuh pemilik usaha'),
  ('role-pj', 'PENANGGUNG_JAWAB', 'Hak akses supervisor / penanggung jawab shift'),
  ('role-kasir', 'KARYAWAN', 'Hak akses kasir operasional transaksi')
ON CONFLICT (role_id) DO NOTHING;

-- 2. SEED SATUAN UNIT (PRODUCT UNITS)
INSERT INTO product_units (unit_id, unit_code, unit_name) VALUES
  ('unit-pcs', 'PCS', 'Pieces / Pcs'),
  ('unit-lembar', 'LEMBAR', 'Lembar Kertas'),
  ('unit-pack', 'PACK', 'Pack / Bungkus'),
  ('unit-porsi', 'PORSI', 'Porsi Makanan/Minuman'),
  ('unit-desain', 'DESAIN', 'Jasa Desain / Ketik'),
  ('unit-dus', 'DUS', 'Dus / Karton')
ON CONFLICT (unit_id) DO NOTHING;

-- 3. SEED KATEGORI UTAMA (FC/PRINTING & FNB)
INSERT INTO categories (category_id, category_name, business_unit, is_active) VALUES
  ('cat-atk', 'ATK & Perlengkapan', 'FC_PRINT', true),
  ('cat-fotokopi', 'Fotokopi', 'FC_PRINT', true),
  ('cat-printing', 'Printing & Cetak', 'FC_PRINT', true),
  ('cat-jasa', 'Jasa Ketik & Desain', 'FC_PRINT', true),
  ('cat-snack', 'Snack & Camilan', 'FNB', true),
  ('cat-minuman', 'Minuman & Kopi', 'FNB', true),
  ('cat-makanan', 'Makanan Utama', 'FNB', true),
  ('cat-gorengan', 'Gorengan', 'FNB', true),
  ('cat-eskrim', 'Es Krim', 'FNB', true)
ON CONFLICT (category_id) DO NOTHING;

-- 4. SEED PROFIL TOKO & PENGATURAN SYSTEM
INSERT INTO system_settings (setting_id, store_name, store_phone, store_address, tax_ppn_percent, service_charge_percent, cash_active, qris_active, debit_card_active) VALUES
  ('GLOBAL_SETTING', 'Kedai Kopi Senja & Printing', '0812-3456-7890', 'Jl. Sudirman No. 123, Jakarta Selatan', 11.00, 5.00, true, true, false)
ON CONFLICT (setting_id) DO NOTHING;

-- 5. SEED USERS DEFAULT (PASSWORD: owner123 / kasir123 via bcrypt hash)
-- owner123 -> $2b$10$vgC/B9W4rKjJ5L...
INSERT INTO users (user_id, username, email, password_hash, full_name, role, status) VALUES
  ('usr-owner-001', 'owner', 'owner@tokopos.id', '$2b$10$eQ2K08Z9M8G1gq.X9h2P3.7qR7wW4o9k1V8v5Z2z5w4y3x2w1v0u', 'Pemilik Toko', 'OWNER', 'ACTIVE'),
  ('usr-kasir-001', 'budi', 'budi@tokopos.id', '$2b$10$eQ2K08Z9M8G1gq.X9h2P3.7qR7wW4o9k1V8v5Z2z5w4y3x2w1v0u', 'Budi Kasir', 'KARYAWAN', 'ACTIVE')
ON CONFLICT (user_id) DO NOTHING;

COMMIT;
