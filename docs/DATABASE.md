# Database Schema Specification & Data Layer Mapping - Draft

> **Status:** Draft (Tahap D - Dengan Tabel Kontribusi Modal Multi-User)  
> **Versi:** 0.2.0  
> **Tanggal:** 14 Agustus 2026  

Dokumen ini mendefinisikan spesifikasi teknis skema basis data, atribut kolom, tipe data, batasan (*constraints*), dan strategi abstraksi **Data Access Layer (DAL)** untuk Sistem POS Usaha Campuran (FC/Printing & FNB).

---

## 1. SPESIFIKASI SKEMA TABEL / ENTITAS

### 1.1 Tabel `users` (Pengguna Sistem)
| Nama Kolom | Tipe Data | Nullable | Key / Constraint | Keterangan |
| :--- | :--- | :---: | :---: | :--- |
| `user_id` | VARCHAR(36) | NO | PK | UUID V4 Pengguna |
| `username` | VARCHAR(50) | NO | UNIQUE | Username untuk login |
| `password_hash` | VARCHAR(255) | NO | - | Hash kredensial (Bcrypt) |
| `full_name` | VARCHAR(100) | NO | - | Nama lengkap karyawan/owner |
| `role` | ENUM | NO | - | `'OWNER'`, `'KARYAWAN'` |
| `status` | ENUM | NO | DEFAULT `'ACTIVE'` | `'ACTIVE'`, `'INACTIVE'` |
| `created_at` | TIMESTAMP | NO | DEFAULT CURRENT_TIMESTAMP | Waktu pembuatan akun |

### 1.2 Tabel `shifts` (Sesi Shift & Kas Bersama)
| Nama Kolom | Tipe Data | Nullable | Key / Constraint | Keterangan |
| :--- | :--- | :---: | :---: | :--- |
| `shift_id` | VARCHAR(36) | NO | PK | UUID V4 Sesi Shift |
| `opened_by_user_id` | VARCHAR(36) | NO | FK -> `users.user_id` | User yang mengeksekusi Buka Shift |
| `shift_leader_user_id` | VARCHAR(36) | NO | FK -> `users.user_id` | Karyawan penanggung jawab shift |
| `closed_by_user_id` | VARCHAR(36) | YES | FK -> `users.user_id` | PJ/Owner yang me-closing shift |
| `start_time` | TIMESTAMP | NO | - | Jam buka shift |
| `end_time` | TIMESTAMP | YES | - | Jam tutup shift |
| `total_initial_cash` | DECIMAL(12,2) | NO | CHECK >= 0, DEFAULT 0.00 | Sum dari `shift_capital_contributions` |
| `net_cash_sales` | DECIMAL(12,2) | NO | DEFAULT 0.00 | Penjualan Tunai Bersih shift |
| `total_cash_expenses` | DECIMAL(12,2) | NO | DEFAULT 0.00 | Total pengeluaran tunai shift |
| `theoretical_cash` | DECIMAL(12,2) | NO | DEFAULT 0.00 | `total_initial_cash + net_cash_sales - total_cash_expenses` |
| `actual_physical_cash` | DECIMAL(12,2) | YES | - | Uang fisik aktual di laci saat closing |
| `cash_variance` | DECIMAL(12,2) | YES | - | `actual_physical_cash - theoretical_cash` |
| `reconciliation_status`| ENUM | YES | - | `'PAS'`, `'LEBIH'`, `'KURANG'` |
| `shift_status` | ENUM | NO | DEFAULT `'ACTIVE'` | `'ACTIVE'`, `'CLOSED'` |

### 1.3 Tabel `shift_users` (Partisipasi Karyawan Shift)
| Nama Kolom | Tipe Data | Nullable | Key / Constraint | Keterangan |
| :--- | :--- | :---: | :---: | :--- |
| `shift_user_id` | VARCHAR(36) | NO | PK | UUID V4 Partisipasi |
| `shift_id` | VARCHAR(36) | NO | FK -> `shifts.shift_id` | Sesi shift berjalan |
| `user_id` | VARCHAR(36) | NO | FK -> `users.user_id` | Karyawan yang bergabung |
| `is_shift_leader` | BOOLEAN | NO | DEFAULT FALSE | TRUE jika PJ, FALSE jika Anggota |
| `joined_at` | TIMESTAMP | NO | DEFAULT CURRENT_TIMESTAMP | Waktu bergabung |

### 1.4 Tabel `shift_capital_contributions` (Kontribusi Modal Awal) [BARU]
| Nama Kolom | Tipe Data | Nullable | Key / Constraint | Keterangan |
| :--- | :--- | :---: | :---: | :--- |
| `contribution_id` | VARCHAR(36) | NO | PK | UUID V4 Kontribusi Modal |
| `shift_id` | VARCHAR(36) | NO | FK -> `shifts.shift_id` | Sesi shift terkait |
| `user_id` | VARCHAR(36) | NO | FK -> `users.user_id` | Karyawan penyetor modal |
| `amount` | DECIMAL(12,2) | NO | CHECK > 0 | Nominal modal awal disetor |
| `contribution_time` | TIMESTAMP | NO | DEFAULT CURRENT_TIMESTAMP | Waktu penyerahan modal |
| `returned_amount` | DECIMAL(12,2) | YES | - | Nominal modal dikembalikan |
| `returned_at` | TIMESTAMP | YES | - | Waktu modal dikembalikan |
| `status` | ENUM | NO | DEFAULT `'HELD'` | `'HELD'` (di laci), `'RETURNED'` (dikembalikan) |

### 1.5 Tabel `categories` (Kategori Master)
| Nama Kolom | Tipe Data | Nullable | Key / Constraint | Keterangan |
| :--- | :--- | :---: | :---: | :--- |
| `category_id` | VARCHAR(36) | NO | PK | UUID V4 Kategori |
| `category_name` | VARCHAR(100) | NO | - | Nama Kategori |
| `business_unit` | ENUM | NO | - | `'FC_PRINT'`, `'FNB'` |
| `is_active` | BOOLEAN | NO | DEFAULT TRUE | Status aktif kategori |

### 1.6 Tabel `products` (Master Produk & Jasa)
| Nama Kolom | Tipe Data | Nullable | Key / Constraint | Keterangan |
| :--- | :--- | :---: | :---: | :--- |
| `product_id` | VARCHAR(36) | NO | PK | UUID V4 Produk |
| `category_id` | VARCHAR(36) | NO | FK -> `categories.category_id` | Kategori |
| `product_name` | VARCHAR(150) | NO | - | Nama barang / jasa |
| `business_unit` | ENUM | NO | - | `'FC_PRINT'`, `'FNB'` |
| `selling_price` | DECIMAL(12,2) | NO | CHECK >= 0 | Harga jual resmi |
| `manage_stock` | BOOLEAN | NO | DEFAULT FALSE | TRUE = Produk fisik, FALSE = Jasa |
| `is_active` | BOOLEAN | NO | DEFAULT TRUE | Status aktif jual |

### 1.7 Tabel `stocks` (Persediaan Stok Barang)
| Nama Kolom | Tipe Data | Nullable | Key / Constraint | Keterangan |
| :--- | :--- | :---: | :---: | :--- |
| `stock_id` | VARCHAR(36) | NO | PK | UUID V4 Stok |
| `product_id` | VARCHAR(36) | NO | UNIQUE, FK -> `products.product_id` | Produk fisik |
| `current_stock` | INTEGER | NO | DEFAULT 0 | Kuantitas stok tersisa saat ini |
| `last_updated` | TIMESTAMP | NO | DEFAULT CURRENT_TIMESTAMP | Waktu update terakhir |

### 1.8 Tabel `stock_logs` (Histori Pergerakan Stok)
| Nama Kolom | Tipe Data | Nullable | Key / Constraint | Keterangan |
| :--- | :--- | :---: | :---: | :--- |
| `stock_log_id` | VARCHAR(36) | NO | PK | UUID V4 Log Stok |
| `product_id` | VARCHAR(36) | NO | FK -> `products.product_id` | Produk fisik |
| `user_id` | VARCHAR(36) | NO | FK -> `users.user_id` | Pemproses pergerakan stok |
| `transaction_id` | VARCHAR(36) | YES | FK -> `transactions.transaction_id` | Transaksi terkait (jika ada) |
| `change_qty` | INTEGER | NO | - | Perubahan (+/- qty) |
| `final_stock` | INTEGER | NO | - | Stok akhir setelah perubahan |
| `log_type` | ENUM | NO | - | `'SALE'`, `'REFUND'`, `'MANUAL_ADJUSTMENT'` |
| `created_at` | TIMESTAMP | NO | DEFAULT CURRENT_TIMESTAMP | Waktu pencatatan |

### 1.9 Tabel `transactions` (Header Transaksi POS)
| Nama Kolom | Tipe Data | Nullable | Key / Constraint | Keterangan |
| :--- | :--- | :---: | :---: | :--- |
| `transaction_id` | VARCHAR(36) | NO | PK | UUID V4 Transaksi |
| `transaction_number` | VARCHAR(50) | NO | UNIQUE | No. Transaksi (misal: TRX-20260814-001) |
| `shift_id` | VARCHAR(36) | NO | FK -> `shifts.shift_id` | Shift ID penampung kas |
| `created_by_user_id` | VARCHAR(36) | NO | FK -> `users.user_id` | Kasir pemproses |
| `cancelled_by_user_id`| VARCHAR(36) | YES | FK -> `users.user_id` | User pembatal (jika batal) |
| `subtotal` | DECIMAL(12,2) | NO | CHECK >= 0 | Total kotor |
| `discount_amount` | DECIMAL(12,2) | NO | DEFAULT 0.00 | Potongan diskon |
| `total_amount` | DECIMAL(12,2) | NO | CHECK >= 0 | Subtotal - Diskon |
| `cash_received` | DECIMAL(12,2) | NO | CHECK >= 0 | Nominal uang diterima |
| `change_amount` | DECIMAL(12,2) | NO | CHECK >= 0 | Nominal kembalian |
| `payment_method` | ENUM | NO | - | `'CASH'`, `'TRANSFER'`, `'QRIS_MANUAL'` |
| `status` | ENUM | NO | DEFAULT `'COMPLETED'` | `'COMPLETED'`, `'CANCELLED'` |
| `cancellation_reason` | TEXT | YES | - | Alasan jika dibatalkan |
| `non_cash_refund_status`| BOOLEAN | YES | DEFAULT FALSE | True jika refund non-tunai selesai |
| `transaction_time` | TIMESTAMP | NO | DEFAULT CURRENT_TIMESTAMP | Waktu transaksi |

### 1.10 Tabel `transaction_items` (Rincian Item Transaksi)
| Nama Kolom | Tipe Data | Nullable | Key / Constraint | Keterangan |
| :--- | :--- | :---: | :---: | :--- |
| `item_id` | VARCHAR(36) | NO | PK | UUID V4 Item |
| `transaction_id` | VARCHAR(36) | NO | FK -> `transactions.transaction_id` | Transaksi induk |
| `product_id` | VARCHAR(36) | NO | FK -> `products.product_id` | Barang/jasa dibeli |
| `item_name_snapshot` | VARCHAR(150) | NO | - | Snapshot nama produk saat transaksi |
| `unit_price_snapshot`| DECIMAL(12,2) | NO | - | Snapshot harga jual saat transaksi |
| `quantity` | INTEGER | NO | CHECK > 0 | Jumlah unit |
| `item_subtotal` | DECIMAL(12,2) | NO | - | `unit_price_snapshot * quantity` |

### 1.11 Tabel `expenses` (Pengeluaran Operasional Toko)
| Nama Kolom | Tipe Data | Nullable | Key / Constraint | Keterangan |
| :--- | :--- | :---: | :---: | :--- |
| `expense_id` | VARCHAR(36) | NO | PK | UUID V4 Pengeluaran |
| `shift_id` | VARCHAR(36) | NO | FK -> `shifts.shift_id` | Shift ID terkait |
| `recorded_by_user_id`| VARCHAR(36) | NO | FK -> `users.user_id` | Karyawan penginput |
| `expense_category` | VARCHAR(100) | NO | - | Kategori (misal: Bahan FNB, ATK) |
| `description` | TEXT | NO | - | Keterangan pengeluaran |
| `amount` | DECIMAL(12,2) | NO | CHECK > 0 | Nominal tunai pengeluaran |
| `expense_time` | TIMESTAMP | NO | DEFAULT CURRENT_TIMESTAMP | Waktu pencatatan |

### 1.12 Tabel `audit_logs` (Log Keamanan & Aktivitas Sistem)
| Nama Kolom | Tipe Data | Nullable | Key / Constraint | Keterangan |
| :--- | :--- | :---: | :---: | :--- |
| `audit_id` | VARCHAR(36) | NO | PK | UUID V4 Audit Log |
| `user_id` | VARCHAR(36) | NO | FK -> `users.user_id` | Pelaku aksi |
| `action_type` | VARCHAR(50) | NO | - | Misal: `'LOGIN'`, `'CLOSE_SHIFT'`, `'CAPITAL_CONTRIBUTION'` |
| `entity_name` | VARCHAR(50) | NO | - | Tabel terpengaruh |
| `entity_id` | VARCHAR(36) | YES | - | ID data terpengaruh |
| `details` | TEXT | YES | - | Detail keterangan / json perubahan |
| `timestamp` | TIMESTAMP | NO | DEFAULT CURRENT_TIMESTAMP | Waktu kejadian |

---

## 2. ATURAN CONSTRAINTS ATAS ATURAN BISNIS & RBAC

1. **Aturan Single Active Shift:** Maksimal **hanya 1 Shift ID yang berstatus `ACTIVE`** pada satu waktu toko.
2. **Aturan 1 PJ per Shift ID:** Tabel `shift_users` memiliki constraint unik `(shift_id, is_shift_leader)` di mana `is_shift_leader = TRUE` **hanya boleh ada tepat 1 baris per `shift_id`**.
3. **Kalkulasi Total Modal Awal Bersama:** `shifts.total_initial_cash` disinkronkan dari pemjumlahan `SUM(amount)` dari tabel `shift_capital_contributions` di bawah `shift_id` terkait.
4. **Integritas Anti-Hapus Data (No Hard Delete):** Transaksi `COMPLETED` dan `audit_logs` **TIDAK BOLEH DIHAPUS** (RESTRICT ON DELETE).

---

## 3. STRATEGI ABSTRAKSI DATA LAYER (DATA ACCESS LAYER - DAL)

Pemetaan Google Sheets Worksheets (Tahap Awal MVP):
1. `Sheet_Users`
2. `Sheet_Shifts`
3. `Sheet_ShiftUsers`
4. `Sheet_ShiftCapitalContributions` [BARU]
5. `Sheet_Categories`
6. `Sheet_Products`
7. `Sheet_Stocks`
8. `Sheet_StockLogs`
9. `Sheet_Transactions`
10. `Sheet_TransactionItems`
11. `Sheet_Expenses`
12. `Sheet_AuditLogs`
