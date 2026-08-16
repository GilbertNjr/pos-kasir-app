# LAPORAN REVISI AUDIT & SPESIFIKASI ARSITEKTUR REPEROMBAKAN SISTEM POS
> **Proyek:** POS Kasir Usaha Campuran (FC/Printing & F&B)  
> **Status:** Revisi Audit Terverifikasi (Menunggu Persetujuan Keputusan Bisnis User)  
> **Tanggal:** 15 Agustus 2026  

---

## 1. REVISI 11 POIN AUDIT KRITIS

### 1. Storage Storage Persistence & In-Memory Realities
- **Masalah In-Memory:** In-Memory Repository yang digunakan saat ini **BUKAN** storage production. Jika server Node.js restart, mati listrik, atau crash, seluruh data transaksi, stok, dan shift akan **HILANG PERMANEN**.
- **Rekomendasi Production:** Wajib dimigrasikan ke database relasional dengan ACID guarantees (seperti **PostgreSQL / Supabase** atau **SQLite dengan WAL mode** untuk deployment lokal toko).

### 2. Peran Google Sheets yang Benar
- **BUKAN Database Utama:** Google Sheets memiliki batasan API rate-limit (100 req/min), latensi tinggi (~500ms–2s), tidak mendukung transaksi ACID, dan berisiko mengalami *write collision* saat multi-kasir bertransaksi serentak.
- **Peran yang Tepat:** Google Sheets murni ditempatkan sebagai **Media Ekspor Laporan & Secondary Offsite Backup** secara *asynchronous* (batch sync atau ekspor manual).

### 3. Desain Multi-Karyawan dalam Satu Shift (`shift_members`)
- **Masalah Saat Ini:** Tabel `shifts` lama hanya mencatat `shift_leader_user_id` (satu orang).
- **Desain Baru:** Diperlukan tabel relasi `shift_members` untuk mencatat seluruh karyawan yang bertugas dalam shift tersebut. Setiap transaksi kasir wajib menyimpan ID Shift (`shift_id`) **DAN** ID Kasir yang mengeksekusi (`created_by_user_id`).

### 4. Model Cash Drawer (Laci Kasir) — *Open Business Decision*
- Terdapat 2 opsi arsitektur laci kas yang harus dipilih oleh Owner:
  - **Opsi A (Shared Shift Drawer):** 1 Laci Kas bersama per shift. Semua kasir memasukkan uang ke laci yang sama. Rekonsiliasi kas dilakukan secara kolektif di akhir shift.
  - **Opsi B (Individual Cashier Drawer / Cash Box):** Setiap kasir memiliki laci/kotak kas sendiri dengan modal awal masing-masing. Rekonsiliasi kas dihitung per kasir.

### 5. Konsep Unit Satuan Penjualan (`units`)
Setiap produk & jasa wajib memiliki unit satuan penjualan yang jelas:
- **FC / Printing & Jasa:** `lembar` (Print/Fotokopi), `halaman` (Ketik), `file` (Desain), `pcs` (Laminasi).
- **F&B:** `cup` / `botol` (Minuman), `porsi` (Seblak/Makanan), `pcs` / `biji` (Gorengan/Snack).
- **ATK:** `pcs`, `pack`, `box` (Pulpen, Buku, dll).

### 6. Formula Perhitungan Keuangan yang Tepat
- **Omzet (Gross Sales):** $\sum \text{final\_total}$ transaksi `COMPLETED` pada periode terpilih.
- **HPP (Cost of Goods Sold / COGS):** $\sum (\text{qty} \times \text{capital\_price})$ untuk seluruh item terjual pada transaksi `COMPLETED`.
- **Laba Kotor (Gross Profit):** $\text{Omzet} - \text{HPP}$.
- **Pengeluaran Operasional (Operational Expenses):** $\sum \text{amount}$ pengeluaran kas toko di tabel `expenses`.
- **Laba Bersih (Net Profit):** $\text{Laba Kotor} - \text{Pengeluaran Operasional}$.

### 7. Stock Validation Atomic & Transactional
- **Skenario Race Condition:** Stok tersisa 1 pcs. Kasir A dan Kasir B menekan tombol bayar di milidetik yang sama.
- **Mekanisme Solusi:** Pembatalan/Pengurangan stok dilakukan secara atomic di tingkat database dengan SQL query bertransaksi:
  ```sql
  UPDATE products 
  SET current_stock = current_stock - ? 
  WHERE product_id = ? AND current_stock >= ?;
  ```
  Jika *affected rows = 0*, sistem secara otomatis membatalkan transaksi dan mengembalikan HTTP `409 Conflict` ("Stok tidak mencukupi") kepada kasir kedua via Toast Notification.

### 8. Arsitektur Realtime SSE & Reconnection Engine
- **Database sebagai Source of Truth:** Database relasional tetap menjadi satu-satunya sumber kebenaran data.
- **Peran SSE (Server-Sent Events):** SSE hanya bertindak sebagai pemancar event (*lightweight signal emitter*) dari backend ke frontend ketika ada transaksi baru (`TRANSACTION_CREATED`) atau shift ditutup (`SHIFT_CLOSED`).
- **Mekanisme Reconnect & Resync:** Jika koneksi SSE terputus, frontend akan menampilkan indikator `🔴 Disconnected`, mencoba *auto-reconnect* (backoff 1s, 2s, 4s, 8s), dan saat berhasil terhubung kembali (`onopen`), frontend langsung mengeksekusi *full data sync refetch* ke REST API.

### 9. Strategi Backup Production Lengkap
Snapshot JSON saja **TIDAK CUKUP** untuk standar production. Strategi backup yang benar meliputi:
1. **Automated Daily Database Dump:** Backup fisik database relasional harian secara otomatis.
2. **Point-in-Time Recovery (PITR):** Pencatatan Write-Ahead Logging (WAL) untuk pemulihan hingga milidetik sebelum insiden.
3. **Offsite Backup Storage:** Pengiriman berkas backup terenkripsi ke Google Drive / Cloud Storage.
4. **Manual Snapshot Export:** Fitur ekspor JSON / Excel / Google Sheets untuk kebutuhan audit cepat oleh Owner.

### 10. Status Keamanan (Security Verification)
Klaim "sistem aman" diubah menjadi: **"Autentikasi JWT dan otorisasi RBAC backend sudah tersedia, namun WAJIB melalui Security Verification komprehensif"** (termasuk verifikasi rate limiting, sanitisasi input SQL/XSS, CORS policy, dan token revocation list).

### 11. Identifikasi Entitas / Tabel Lengkap
Identifikasi entitas lengkap yang dibutuhkan untuk mendukung seluruh modul sistem POS:
- `users`, `roles`, `shifts`, `shift_members` *(BARU)*, `categories`, `units` *(BARU)*, `products`, `stock_logs` *(BARU)*, `transactions`, `transaction_items`, `expenses`, `payment_methods` *(BARU)*, `audit_logs`, `system_settings` *(BARU)*.

---

## A. ARCHITECTURE DECISION RECORD (ADR)

### ADR-001: Separation of Workspaces (Owner App vs Cashier POS)
- **Status:** APPROVED
- **Konteks:** Tampilan lama mencampurkan fitur analitik, pengujian teknis, dan transaksi dalam satu antarmuka tab.
- **Keputusan:** Memisahkan UI menjadi 2 Workspace terisolasi:
  1. `Owner Workspace`: Navigasi Sidebar Kiri Slate (Dashboard Analitik, Laporan, Manajemen Master).
  2. `Cashier Workspace`: Touchscreen POS Split View (Katalog Kiri 65%, Keranjang & Fast Checkout Kanan 35%).

### ADR-002: Realtime Architecture with SSE (Server-Sent Events)
- **Status:** APPROVED
- **Konteks:** Dashboard Owner membutuhkan informasi transaksi baru tanpa harus refresh manual.
- **Keputusan:** Menggunakan SSE berbasis HTTP/2 untuk memancarkan push signal ringan dari Express Backend ke Owner Dashboard, dengan REST API sebagai sarana pengambil data lengkap.

### ADR-003: Production Persistence Database Migration
- **Status:** PROPOSED (Menunggu Pemilihan Engine DB)
- **Konteks:** Storage In-Memory berisiko kehilangan data total saat server restart.
- **Keputusan:** Mengganti In-Memory Repository dengan Relational Database Engine yang mendukung transaksi ACID (PostgreSQL / SQLite WAL).

---

## B. DAFTAR ENTITY / DATABASE YANG DIBUTUHKAN

### 1. `users`
`user_id` (PK), `username`, `password_hash`, `full_name`, `role` (OWNER | KARYAWAN), `status` (ACTIVE | INACTIVE), `created_at`.

### 2. `shifts`
`shift_id` (PK), `shift_leader_user_id` (FK), `opened_at`, `closed_at`, `initial_cash`, `total_cash_sales`, `total_non_cash_sales`, `total_cash_expenses`, `expected_cash_in_drawer`, `actual_physical_cash`, `cash_difference`, `reconciliation_status`, `status` (OPEN | CLOSED).

### 3. `shift_members` *(ENTITAS BARU)*
`shift_member_id` (PK), `shift_id` (FK), `user_id` (FK), `role_in_shift` (LEADER | MEMBER), `joined_at`, `left_at`, `status`.

### 4. `categories`
`category_id` (PK), `category_name`, `business_unit` (FC_PRINT | FNB), `created_at`.

### 5. `units` *(ENTITAS BARU)*
`unit_id` (PK), `unit_name` (lembar, cup, pcs, porsi, halaman, dll), `abbreviation`, `created_at`.

### 6. `products`
`product_id` (PK), `product_name`, `business_unit` (FC_PRINT | FNB), `category_id` (FK), `unit_id` (FK), `selling_price`, `capital_price` (HPP), `manage_stock` (BOOLEAN), `current_stock`, `min_stock_alert`, `created_at`.

### 7. `stock_logs` *(ENTITAS BARU)*
`log_id` (PK), `product_id` (FK), `user_id` (FK), `change_type` (TRANSACTION_SALE | MANUAL_ADJUSTMENT | RESTOCK | CANCELLED_REFUND), `qty_change`, `stock_before`, `stock_after`, `notes`, `created_at`.

### 8. `transactions`
`transaction_id` (PK), `transaction_number`, `shift_id` (FK), `created_by_user_id` (FK), `total_amount`, `total_discount`, `final_total`, `total_hpp`, `payment_method_id` (FK), `cash_tendered`, `change_due`, `status` (COMPLETED | CANCELLED), `transaction_time`.

### 9. `transaction_items`
`item_id` (PK), `transaction_id` (FK), `product_id` (FK), `product_name`, `unit_name`, `selling_price`, `capital_price`, `qty`, `subtotal`, `subtotal_hpp`.

### 10. `expenses`
`expense_id` (PK), `shift_id` (FK), `created_by_user_id` (FK), `category`, `description`, `amount`, `expense_time`.

### 11. `payment_methods` *(ENTITAS BARU)*
`payment_method_id` (PK), `method_name` (TUNAI, QRIS, TRANSFER_BCA, MANDIRI), `type` (CASH | NON_CASH), `is_active`.

### 12. `audit_logs`
`log_id` (PK), `user_id` (FK), `action`, `target_entity`, `target_id`, `details` (JSON), `timestamp`.

---

## C. BUSINESS RULES YANG HARUS DIKUNCI

1. **Shift Block Rule:** Kasir **TIDAK DAPAT** membuka layar POS atau memproses transaksi sebelum ada sesi Shift yang berstatus `OPEN`.
2. **Multi-Kasir Accountability:** Setiap transaksi mencatat `shift_id` dan `created_by_user_id` kasir penanggung jawab transaksi tersebut.
3. **Immutability Transaksi COMPLETED:** Transaksi yang sudah `COMPLETED` **TIDAK BOLEH** dihapus dari database. Jika terjadi kesalahan, harus melalui proses `CANCELLED` dengan audit log dan otorisasi Owner/PJ Shift.
4. **HPP Mandatory for Profit:** Laba bersih tidak akan ditampilkan di Dashboard sebelum data `capital_price` diisi pada produk terkait.
5. **Atomic Stock Protection:** Transaksi produk fisik wajib mengurangi stok secara atomic di level DB. Jika stok < Qty checkout, transaksi ditolak.

---

## D. DAFTAR KEPUTUSAN YANG MASIH MEMBUTUHKAN JAWABAN USER

Mohon berikan keputusan untuk 4 poin di bawah ini sebelum eksekusi coding dimulai:

1. **Model Cash Drawer (Laci Kasir):**
   - *Pilihan A:* **Shared Shift Drawer** (Satu laci kas bersama per shift, modal awal digabung).
   - *Pilihan B:* **Individual Cashier Box** (Setiap kasir memegang kotak kas fisik & modal awal masing-masing).
2. **Database Production Engine:**
   - *Pilihan A:* **PostgreSQL / Supabase** (Rekomendasi terbaik untuk multi-device / cloud access dari luar toko).
   - *Pilihan B:* **SQLite dengan WAL mode** (Cocok jika sistem murni jalan di 1 Komputer Server Toko lokal).
3. **Pembatalan Transaksi oleh Kasir:**
   - *Pilihan A:* Kasir biasa boleh membatalkan transaksi sendiri (dengan wajib mengisi alasan pembatalan).
   - *Pilihan B:* Pembatalan transaksi wajib memerlukan PIN / Otorisasi dari Owner / PJ Shift.
4. **Target Desain UI Kasir:**
   - Apakah UI kasir diprioritaskan untuk pengoperasian **Layar Sentuh (Touchscreen Tablet/Monitor)** atau **Keyboard Shortcut Fast-Checkout (Desktop/PC)**?

---

## E. RISIKO TEKNIS YANG TERSISA

1. **Migrasi Data Existing:** Perlu penyiapan script migrasi data dari format In-Memory lama ke Skema Database Relasional baru tanpa kehilangan riwayat transaksi terdahulu.
2. **Konektivitas Internet Toko:** Jika memilih PostgreSQL Cloud (Supabase), toko harus memiliki koneksi internet stabil. Jika internet mati, kasir butuh mekanisme offline fallback.
3. **Pengujian Race Condition:** Perlu automated load test untuk memverifikasi ketahanan atomic stock update saat 2 kasir menekan tombol bayar secara bersamaan.

---

> 🔒 **PEMBERITAHUAN:** Tidak ada kode aplikasi yang diubah, tidak ada file yang dihapus, dan tidak ada database yang dimodifikasi selama pembuatan dokumen revisi audit ini. Kami menunggu jawaban persetujuan User untuk poin D di atas.
