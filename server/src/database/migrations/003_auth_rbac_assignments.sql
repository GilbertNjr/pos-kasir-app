-- =============================================================================
-- MIGRATION 003: MIGRASI SEAMLESS AUTHENTICATION, RBAC, ACTIVATION TOKENS, & EMPLOYEE ASSIGNMENTS
-- App: POS Kasir Usaha Campuran
-- =============================================================================

BEGIN;

-- 1. TAMBAHKAN STATUS 'PENDING_ACTIVATION' PADA USER_STATUS_ENUM JIKA BELUM ADA
DO $$ BEGIN
    ALTER TYPE user_status_enum ADD VALUE IF NOT EXISTS 'PENDING_ACTIVATION';
EXCEPTION WHEN OTHERS THEN null; END $$;

-- 2. PENAMBAHAN KOLOM METADATA PADA TABEL USERS
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_pj BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS shift VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS invited_by_user_id VARCHAR(36) REFERENCES users(user_id);

-- 3. TABEL KODE AKTIVASI AKUN SEMENTARA (ACTIVATION TOKENS)
CREATE TABLE IF NOT EXISTS activation_tokens (
    token_id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    activation_code_display VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, USED, EXPIRED
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_activation_tokens_user ON activation_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_activation_tokens_code ON activation_tokens(activation_code_display);

-- 4. TABEL RELASI HIRARKI PJ & KARYAWAN (EMPLOYEE ASSIGNMENTS)
CREATE TABLE IF NOT EXISTS employee_assignments (
    assignment_id VARCHAR(36) PRIMARY KEY,
    supervisor_user_id VARCHAR(36) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    employee_user_id VARCHAR(36) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_active_assignment UNIQUE (employee_user_id)
);

CREATE INDEX IF NOT EXISTS idx_assignments_supervisor ON employee_assignments(supervisor_user_id);
CREATE INDEX IF NOT EXISTS idx_assignments_employee ON employee_assignments(employee_user_id);

-- 5. SEED PERMISSIONS DINAMIS
INSERT INTO permissions (permission_id, permission_code, permission_name, module) VALUES
  ('perm-001', 'dashboard.owner.view', 'Melihat Dashboard Executive Owner', 'Dashboard'),
  ('perm-002', 'dashboard.pj.view', 'Melihat Dashboard Operasional PJ', 'Dashboard'),
  ('perm-003', 'dashboard.cashier.view', 'Melihat Register POS Kasir', 'Dashboard'),
  ('perm-004', 'employee.manage_all', 'Mengelola Seluruh Akun Pegawai (Owner)', 'Employee'),
  ('perm-005', 'employee.view_assigned', 'Melihat Karyawan yang Ditugaskan (PJ Scope)', 'Employee'),
  ('perm-006', 'product.create_update', 'Mengelola Master Produk & Harga', 'Product'),
  ('perm-007', 'product.view', 'Melihat Daftar Produk & Stok', 'Product'),
  ('perm-008', 'stock.adjust_manual', 'Melakukan Penyesuaian Stok Manual', 'Stock'),
  ('perm-009', 'stock.view_logs', 'Melihat Log Mutasi Stok', 'Stock'),
  ('perm-010', 'transaction.create', 'Melakukan Transaksi POS', 'Transaction'),
  ('perm-011', 'transaction.cancel', 'Pembatalan Transaksi Nota', 'Transaction'),
  ('perm-012', 'expense.create', 'Mencatat Pengeluaran Operasional', 'Expense'),
  ('perm-013', 'report.financial_all', 'Melihat Laporan Keuangan Lengkap', 'Report'),
  ('perm-014', 'report.operational', 'Melihat Laporan Shift Operasional', 'Report'),
  ('perm-015', 'audit.view_logs', 'Melihat Audit Log Sistem', 'Audit'),
  ('perm-016', 'backup.manage', 'Mengelola Backup & Restore System', 'Backup')
ON CONFLICT (permission_code) DO NOTHING;

-- 6. MAPPING PERMISSION KE ROLES (OWNER, PENANGGUNG_JAWAB, KARYAWAN)

-- A. OWNER (Mendapatkan Seluruh Permission)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'role-owner', permission_id FROM permissions
ON CONFLICT DO NOTHING;

-- B. PENANGGUNG_JAWAB / PJ (Akses Operasional & Employee Scope)
INSERT INTO role_permissions (role_id, permission_id) VALUES
  ('role-pj', 'perm-002'), -- dashboard.pj.view
  ('role-pj', 'perm-003'), -- dashboard.cashier.view
  ('role-pj', 'perm-005'), -- employee.view_assigned
  ('role-pj', 'perm-007'), -- product.view
  ('role-pj', 'perm-009'), -- stock.view_logs
  ('role-pj', 'perm-010'), -- transaction.create
  ('role-pj', 'perm-011'), -- transaction.cancel
  ('role-pj', 'perm-012'), -- expense.create
  ('role-pj', 'perm-014')  -- report.operational
ON CONFLICT DO NOTHING;

-- C. KARYAWAN / CASHIER (Akses Transaksi POS & Shift Operasional)
INSERT INTO role_permissions (role_id, permission_id) VALUES
  ('role-kasir', 'perm-003'), -- dashboard.cashier.view
  ('role-kasir', 'perm-007'), -- product.view
  ('role-kasir', 'perm-009'), -- stock.view_logs
  ('role-kasir', 'perm-010'), -- transaction.create
  ('role-kasir', 'perm-012')  -- expense.create
ON CONFLICT DO NOTHING;

COMMIT;
