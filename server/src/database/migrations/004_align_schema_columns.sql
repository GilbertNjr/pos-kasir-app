-- =============================================================================
-- MIGRATION 004: SKEMA LENGKAP STOK GUDANG/ETALASE & AUDIT LOGS ALIGNMENT
-- App: POS Kasir Usaha Campuran
-- =============================================================================

-- 1. PENAMBAHAN KOLOM STOK GUDANG DAN ETALASE PADA TABEL STOCKS
ALTER TABLE stocks ADD COLUMN IF NOT EXISTS stock_gudang NUMERIC(12,3) DEFAULT 0.000;
ALTER TABLE stocks ADD COLUMN IF NOT EXISTS stock_etalase NUMERIC(12,3) DEFAULT 0.000;

-- 2. PENAMBAHAN KOLOM COMPATIBILITY PADA TABEL AUDIT_LOGS
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS log_id VARCHAR(36);
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_id VARCHAR(36);
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS affected_entity VARCHAR(100);
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS details TEXT;
