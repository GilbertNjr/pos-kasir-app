# SPESIFIKASI DESAIN DATABASE RELASIONAL UTAMA (POSTGRESQL)

> **Status:** Proposal / Draft Arsitektur Core Database  
> **Source of Truth:** PostgreSQL 15+  
> **Versi:** 1.0.0  
> **Tanggal:** 15 Agustus 2026  

Dokumen ini mendefinisikan desain terstruktur database relasional PostgreSQL sebagai **Single Source of Truth** untuk Sistem POS Usaha Campuran (FC/Printing & FNB).

---

## 1. PRINSIP ARSITEKTUR DATABASE

1. **PostgreSQL Sebagai Primary Storage:** Seluruh transaksi, data pengguna, produk, stok, dan audit log disimpan dan dijamin konsistensinya di PostgreSQL menggunakan mekanisme **ACID (Atomicity, Consistency, Isolation, Durability)**.
2. **Google Sheets Sebagai Secondary Export:** Google Sheets hanya berfungsi sebagai media backup sekunder, ekspor laporan, dan analisis manual. Kegagalan koneksi ke Google Sheets tidak membatalkan transaksi di PostgreSQL.
3. **No Floating Point for Currency:** Seluruh kolom uang menggunakan tipe `NUMERIC(15,2)` untuk mencegah kesalahan pembulatan numerik floating-point.
4. **Preservasi Data Historis:** Transaksi yang berstatus `COMPLETED` tidak boleh dihapus secara fisik (`NO HARD DELETE`). Transaksi batal menggunakan status `CANCELLED`.
5. **Snapshot Harga Transaksi:** Harga unit (`unit_price`) pada `transaction_items` disimpan sebagai snapshot harga saat transaksi terjadi.
6. **Integritas Referensial Strict:** Menggunakan Foreign Key constraints dengan penanganan `ON DELETE RESTRICT` pada tabel transaksi dan audit log.

---

## 2. STRUKTUR TABEL & SKEMA PostgreSQL DDL

### 2.1 Tabel `roles` & `permissions` (Manajemen Hak Akses)

```sql
CREATE TYPE user_role_enum AS ENUM ('OWNER', 'PENANGGUNG_JAWAB', 'KARYAWAN');

CREATE TABLE roles (
    role_id VARCHAR(36) PRIMARY KEY,
    role_name user_role_enum UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE permissions (
    permission_id VARCHAR(36) PRIMARY KEY,
    permission_code VARCHAR(100) UNIQUE NOT NULL,
    permission_name VARCHAR(150) NOT NULL,
    module VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE role_permissions (
    role_id VARCHAR(36) REFERENCES roles(role_id) ON DELETE CASCADE,
    permission_id VARCHAR(36) REFERENCES permissions(permission_id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);
```

---

### 2.2 Tabel `users` (Pengguna Sistem Dinamis)

```sql
CREATE TYPE user_status_enum AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

CREATE TABLE users (
    user_id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role user_role_enum NOT NULL DEFAULT 'KARYAWAN',
    status user_status_enum NOT NULL DEFAULT 'ACTIVE',
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

### 2.3 Tabel `categories` & `product_units` (Master Kategori & Satuan Unit)

```sql
CREATE TYPE business_unit_enum AS ENUM ('FC_PRINT', 'FNB');

CREATE TABLE categories (
    category_id VARCHAR(36) PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL,
    business_unit business_unit_enum NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE product_units (
    unit_id VARCHAR(36) PRIMARY KEY,
    unit_code VARCHAR(20) UNIQUE NOT NULL, -- Contoh: PCS, LEMBAR, PACK, PORSI
    unit_name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

### 2.4 Tabel `products` (Master Barang & Jasa)

```sql
CREATE TYPE item_type_enum AS ENUM ('PRODUCT', 'SERVICE');

CREATE TABLE products (
    product_id VARCHAR(36) PRIMARY KEY,
    category_id VARCHAR(36) NOT NULL REFERENCES categories(category_id) ON DELETE RESTRICT,
    unit_id VARCHAR(36) NOT NULL REFERENCES product_units(unit_id) ON DELETE RESTRICT,
    product_name VARCHAR(150) NOT NULL,
    sku VARCHAR(50) UNIQUE,
    type item_type_enum NOT NULL DEFAULT 'PRODUCT',
    business_unit business_unit_enum NOT NULL,
    selling_price NUMERIC(15,2) NOT NULL CHECK (selling_price >= 0),
    cost_price NUMERIC(15,2) NOT NULL DEFAULT 0.00 CHECK (cost_price >= 0),
    manage_stock BOOLEAN NOT NULL DEFAULT FALSE,
    image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

### 2.5 Tabel `stocks` & `stock_movements` (Manajemen Stok & Mutasi)

```sql
CREATE TABLE stocks (
    stock_id VARCHAR(36) PRIMARY KEY,
    product_id VARCHAR(36) UNIQUE NOT NULL REFERENCES products(product_id) ON DELETE RESTRICT,
    current_stock NUMERIC(12,3) NOT NULL DEFAULT 0.000 CHECK (current_stock >= 0.000),
    min_stock_alert NUMERIC(12,3) DEFAULT 5.000,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TYPE movement_type_enum AS ENUM ('IN', 'OUT', 'ADJUSTMENT', 'SALE', 'RETURN', 'CANCEL_SALE');

CREATE TABLE stock_movements (
    movement_id VARCHAR(36) PRIMARY KEY,
    product_id VARCHAR(36) NOT NULL REFERENCES products(product_id) ON DELETE RESTRICT,
    actor_user_id VARCHAR(36) NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    transaction_id VARCHAR(36), -- Nullable jika adjustment manual
    movement_type movement_type_enum NOT NULL,
    quantity NUMERIC(12,3) NOT NULL,
    stock_before NUMERIC(12,3) NOT NULL,
    stock_after NUMERIC(12,3) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

### 2.6 Tabel `shifts`, `shift_members`, & `shift_capital_contributions`

```sql
CREATE TYPE shift_status_enum AS ENUM ('ACTIVE', 'CLOSED');
CREATE TYPE reconciliation_status_enum AS ENUM ('PAS', 'LEBIH', 'KURANG');

CREATE TABLE shifts (
    shift_id VARCHAR(36) PRIMARY KEY,
    opened_by_user_id VARCHAR(36) NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    closed_by_user_id VARCHAR(36) REFERENCES users(user_id) ON DELETE RESTRICT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP WITH TIME ZONE,
    total_initial_cash NUMERIC(15,2) NOT NULL DEFAULT 0.00 CHECK (total_initial_cash >= 0),
    net_cash_sales NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    total_qris_sales NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    total_transfer_sales NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    total_cash_expenses NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    theoretical_cash NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    actual_physical_cash NUMERIC(15,2),
    cash_variance NUMERIC(15,2),
    reconciliation_status reconciliation_status_enum,
    shift_status shift_status_enum NOT NULL DEFAULT 'ACTIVE',
    notes TEXT
);

CREATE TABLE shift_members (
    shift_member_id VARCHAR(36) PRIMARY KEY,
    shift_id VARCHAR(36) NOT NULL REFERENCES shifts(shift_id) ON DELETE CASCADE,
    user_id VARCHAR(36) NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    is_shift_leader BOOLEAN NOT NULL DEFAULT FALSE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (shift_id, user_id)
);

CREATE TYPE capital_status_enum AS ENUM ('HELD', 'RETURNED');

CREATE TABLE shift_capital_contributions (
    contribution_id VARCHAR(36) PRIMARY KEY,
    shift_id VARCHAR(36) NOT NULL REFERENCES shifts(shift_id) ON DELETE CASCADE,
    user_id VARCHAR(36) NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
    contribution_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    returned_amount NUMERIC(15,2),
    returned_at TIMESTAMP WITH TIME ZONE,
    status capital_status_enum NOT NULL DEFAULT 'HELD'
);
```

---

### 2.7 Tabel `transactions` & `transaction_items`

```sql
CREATE TYPE transaction_status_enum AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');

CREATE TABLE transactions (
    transaction_id VARCHAR(36) PRIMARY KEY,
    transaction_number VARCHAR(50) UNIQUE NOT NULL,
    shift_id VARCHAR(36) NOT NULL REFERENCES shifts(shift_id) ON DELETE RESTRICT,
    created_by_user_id VARCHAR(36) NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    cancelled_by_user_id VARCHAR(36) REFERENCES users(user_id) ON DELETE RESTRICT,
    subtotal NUMERIC(15,2) NOT NULL CHECK (subtotal >= 0),
    discount_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
    tax_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00 CHECK (tax_amount >= 0),
    service_charge_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00 CHECK (service_charge_amount >= 0),
    final_total NUMERIC(15,2) NOT NULL CHECK (final_total >= 0),
    status transaction_status_enum NOT NULL DEFAULT 'COMPLETED',
    cancellation_reason TEXT,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE transaction_items (
    item_id VARCHAR(36) PRIMARY KEY,
    transaction_id VARCHAR(36) NOT NULL REFERENCES transactions(transaction_id) ON DELETE RESTRICT,
    product_id VARCHAR(36) NOT NULL REFERENCES products(product_id) ON DELETE RESTRICT,
    product_name_snapshot VARCHAR(150) NOT NULL,
    unit_name_snapshot VARCHAR(50) NOT NULL,
    unit_price NUMERIC(15,2) NOT NULL CHECK (unit_price >= 0),
    cost_price_snapshot NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    quantity NUMERIC(12,3) NOT NULL CHECK (quantity > 0),
    discount_amount NUMERIC(15,2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
    subtotal NUMERIC(15,2) NOT NULL CHECK (subtotal >= 0)
);
```

---

### 2.8 Tabel `payments` (Pembayaran Transaksi)

```sql
CREATE TYPE payment_method_enum AS ENUM ('CASH', 'QRIS', 'TRANSFER', 'DEBIT_CARD', 'CREDIT_CARD');

CREATE TABLE payments (
    payment_id VARCHAR(36) PRIMARY KEY,
    transaction_id VARCHAR(36) NOT NULL REFERENCES transactions(transaction_id) ON DELETE RESTRICT,
    payment_method payment_method_enum NOT NULL,
    amount_paid NUMERIC(15,2) NOT NULL CHECK (amount_paid >= 0),
    cash_received NUMERIC(15,2) DEFAULT 0.00,
    change_due NUMERIC(15,2) DEFAULT 0.00,
    reference_number VARCHAR(100), -- Nomor referensi QRIS / Transfer / EDC
    payment_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

### 2.9 Tabel `expenses` (Pengeluaran Operasional Toko)

```sql
CREATE TABLE expenses (
    expense_id VARCHAR(36) PRIMARY KEY,
    shift_id VARCHAR(36) NOT NULL REFERENCES shifts(shift_id) ON DELETE RESTRICT,
    recorded_by_user_id VARCHAR(36) NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
    expense_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

### 2.10 Tabel `audit_logs` & `backups` (Keamanan & Pemulihan Sistem)

```sql
CREATE TABLE audit_logs (
    audit_id VARCHAR(36) PRIMARY KEY,
    actor_user_id VARCHAR(36) NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(36),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE backups (
    backup_id VARCHAR(36) PRIMARY KEY,
    created_by_user_id VARCHAR(36) NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    backup_type VARCHAR(30) NOT NULL DEFAULT 'MANUAL_SNAPSHOT',
    file_path TEXT,
    size_bytes BIGINT NOT NULL,
    google_sheets_synced BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## 3. INDEKS KINERJA DATABASE (PERFORMANCE INDEXES)

```sql
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_transactions_shift ON transactions(shift_id);
CREATE INDEX idx_transactions_created_by ON transactions(created_by_user_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_transaction_items_transaction ON transaction_items(transaction_id);
CREATE INDEX idx_transaction_items_product ON transaction_items(product_id);
CREATE INDEX idx_payments_transaction ON payments(transaction_id);
CREATE INDEX idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```
