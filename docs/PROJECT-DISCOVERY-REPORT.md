# LAPORAN AUDIT FASE 0 (DISCOVERY) & FASE 1 (AUDIT)
## SISTEM POS KASIR USAHA CAMPURAN (FC/PRINTING & F&B)

---

### EXECUTIVE SUMMARY

Audit teknis ini dilakukan secara menyeluruh terhadap seluruh komponen codebase **POS Kasir Usaha Campuran** (Frontend React + Backend Node.js Express + Database PostgreSQL). 

Tujuan utama audit ini adalah mengevaluasi status implementasi sistem saat ini, mengidentifikasi data in-memory/mock yang masih tersisa, mengevaluasi celah keamanan & konsistensi transaksi, serta menyusun **Gap Analysis** dan **Target Architecture** agar seluruh fitur POS terhubung 100% ke database **PostgreSQL** sebagai *Single Source of Truth*.

---

## 1. TEMUAN AUDIT 21-POIN UTAMA

### 1.1 Struktur Project
- **Tipe Project**: Monorepo terstruktur dalam folder utama `/client` (Frontend React) dan `/server` (Backend Express), dilengkapi folder `/docs` berisi 23 dokumen spesifikasi arsitektur & bisnis.
- **Pola Arsitektur**: Layered Architecture (Controller ➔ Service ➔ Repository / Data Access Layer).
- **Skema Migrasi**: `server/src/database/migrations` (001_initial_schema.sql, 002_seed_initial_data.sql, 003_auth_rbac_assignments.sql).

### 1.2 Teknologi yang Digunakan
- **Frontend**: React 18.2, TypeScript 5.2, Vite 5.1, Lucide React (Icons), Vanilla CSS (Custom Design Tokens & CSS Variables).
- **Backend**: Node.js, Express 4.18, TypeScript 5.3, `pg` (PostgreSQL Client Pool), `bcrypt` 5.1 (Password/Token Hashing), `jsonwebtoken` 9.0 (Session Engine), `googleapis` 174.0 (Spreadsheet Archival Sync).
- **Database**: PostgreSQL (Driver `pg` Pool) dengan konfigurasi `max: 20` koneksi.

### 1.3 Frontend Architecture
- **State & Routing**: Single Page Application (SPA) berbasis state role (`OwnerLayout` vs `CashierLayout`) dan hash routing (`#activate`).
- **Communication Layer**: Service modul `client/src/services/api.ts` yang menangani REST HTTP fetch requests dan Server-Sent Events (`EventSource`) untuk pembaruan realtime.

### 1.4 Backend Architecture
- **Entry Point**: `server/src/app.ts` mengonfigurasi Express middleware (CORS, JSON 50MB limit, urlencoded), pendaftaran 12 kelompok route modul, static file serving untuk produksi, dan listener port.
- **Repository Injection**: Instance repositori diekspor sebagai *singleton* di `server/src/repositories/sharedRepositories.ts`.

### 1.5 Database Saat Ini
- **Status Integrasi**:
  - `UserRepository.ts`, `RolePermissionRepository.ts`, `ActivationTokenRepository.ts`, dan `EmployeeAssignmentRepository.ts` telah **100% terhubung ke PostgreSQL** via SQL queries.
  - **CRITICAL GAP**: Repositori domain utama seperti `ProductRepository.ts`, `CategoryRepository.ts`, `TransactionRepository.ts`, `TransactionItemRepository.ts`, `ShiftRepository.ts`, `ExpenseRepository.ts`, `StockRepository.ts`, dan `AuditLogRepository.ts` saat ini **masih menggunakan in-memory RAM array (`private array: Entity[] = []`)**!
- **Tabel Terdefinisi di Migrasi SQL**: `users`, `roles`, `permissions`, `role_permissions`, `activation_tokens`, `employee_assignments`, `categories`, `products`, `stocks`, `stock_movements`, `shifts`, `shift_users`, `shift_capital_contributions`, `transactions`, `transaction_items`, `payments`, `expenses`, `audit_logs`, `settings`, `backup_records`.

### 1.6 Authentication Saat Ini
- **Mekanisme**: JWT Bearer Token yang ditandatangani dengan secret di `.env`. Payload JWT menyertakan `user_id`, `username`, `role`, dan `permissions` array yang diambil dinamis dari database.
- **Self-Activation Flow**: Account creation oleh Owner menghasilkan akun `PENDING_ACTIVATION` + Kode Aktivasi unik (disimpan di `activation_tokens`). Pegawai mengaktifkan akun melalui `/activate` untuk menetapkan username & password pribadi.

### 1.7 Authorization Saat Ini (RBAC Dinamis)
- **Middleware**: `rbacMiddleware.ts` memverifikasi permission spesifik (`requirePermission`) dari array izin JWT/database.
- **Backend Enforcement**: Otentikasi & Otorisasi telah berada di Express Backend, bukan hanya sekadar menyembunyikan tombol di Frontend React.

### 1.8 Existing Role
- `OWNER`: Hak akses tertinggi (Dashboard keuangan lengkap, manajemen pegawai, restore data, audit log).
- `PENANGGUNG_JAWAB` (PJ): Penanggung jawab operational shift & supervisor kelompok kasir yang ditugaskan.
- `KARYAWAN` (CASHIER): Pengguna operasional POS untuk transaksi dan kasir harian.

### 1.9 Existing User System
- Pengguna bersifat dinamis (bukan hardcoded string "Kasir 1"). Berbasis akun individual di tabel `users`.
- Hubungan atasan/PJ ke kasir disimpan di tabel `employee_assignments`.

### 1.10 Existing API Endpoints
- `/api/auth/*`: Login, profile, user management, activation code generation, activate account, assign PJ.
- `/api/categories/*`: Ambil & tambah kategori produk.
- `/api/products/*`: CRUD produk & status kelola stok.
- `/api/shifts/*`: Status shift aktif, buka shift, tambah modal, tutup shift & rekonsiliasi kas.
- `/api/transactions/*`: Pencatatan transaksi POS, histori, & pembatalan.
- `/api/expenses/*`: Pencatatan pengeluaran operasional.
- `/api/stocks/*`: Penyesuaian stok & log mutasi.
- `/api/dashboard/*`: KPI keuangan, omzet, produk terlaris, performa kasir.
- `/api/reports/*`: Laporan keuangan teragregasi & data ekspor.
- `/api/backup/*`: Status backup & ekspor Google Sheets.
- `/api/audit-logs/*`: Catatan histori aktivitas sistem.
- `/api/settings/*`: Profil toko & kustomisasi warna tema.
- `/api/events`: Realtime EventSource SSE Stream.

### 1.11 Existing Realtime Implementation
- Menggunakan **Server-Sent Events (SSE)** via `sseManager.ts`. Event seperti `TRANSACTION_CREATED`, `SHIFT_CLOSED`, dan `SETTINGS_UPDATED` dibroadcast ke seluruh klien terhubung.
- Klien React memiliki listener otomatis yang memperbarui state tanpa *polling* `setInterval`.

### 1.12 Existing Backup Mechanism
- `BackupService.ts` & `GoogleSheetsSyncService.ts` menyediakan sinkronisasi ke Google Sheets sebagai arsip sekunder.
- Disaster recovery utama mengandalkan database PostgreSQL.

### 1.13 Existing Testing Setup
- Pemeriksaan kompilasi TypeScript (`npm run build` pada server & client). Belum ada automated test runner (Jest/Vitest).

### 1.14 Inventarisir Mock Data / In-Memory Seed (Evaluasi A/B/C)
- **A. Dibutuhkan untuk testing/development**: Quick Login buttons di `LoginPage.tsx` (sudah diisolasi hanya pada `(import.meta as any).env?.DEV`).
- **B. Harus dihapus dari production flow**: Array in-memory fallback di `UserRepository.ts` dan seed dummy awal di `AuditLogRepository.ts`.
- **C. Harus diganti dengan PostgreSQL**: `ProductRepository`, `CategoryRepository`, `TransactionRepository`, `TransactionItemRepository`, `ShiftRepository`, `ExpenseRepository`, `StockRepository`, `AuditLogRepository`.

### 1.15 Code Duplication & Dead Code
- `rbac.ts` di utilitas backend memiliki matriks static `ROLE_PERMISSIONS` lama yang partially duplikat dengan tabel `role_permissions` di PostgreSQL.
- Dual-mode fallback di `UserRepository.ts` yang menyimpan duplikasi array di memori Node.js RAM.

### 1.16 Potensi Bug & Masalah Konsistensi Data
- **Calculations Currency Float**: `DashboardService` dan `TransactionService` menghitung omzet menggunakan tipe JavaScript `number`. Memerlukan pembulatan presisi integer atau casting `DECIMAL(12,2)` SQL.
- **Double Submit Risk**: Express middleware `idempotencyMiddleware.ts` menyimpan idempotency key di RAM memory. Harus dipindahkan ke database constraint / persistent storage.
- **Concurrency & Race Condition Stok**: Pembaharuan stok saat checkout bersamaan belum menggunakan row locking SQL (`SELECT ... FOR UPDATE`) atau atomic SQL query (`UPDATE stocks SET quantity = quantity - $1 WHERE product_id = $2 AND quantity >= $1`).

### 1.17 Security Vulnerabilities Audit
- **CORS Config**: `app.use(cors())` saat ini mengizinkan `*` (semua origin). Harus dibatasi pada domain yang valid di environment produksi.
- **Rate Limiting**: Belum ada Express `express-rate-limit` pada endpoint `POST /api/auth/login` dan `POST /api/auth/activate` untuk mencegah brute force attack.
- **Audit Log Exposure**: Audit log menyimpan aktivitas penting namun `AuditLogRepository` belum terkunci penuh ke database PostgreSQL.

### 1.18 Database Problems & Schema Gaps
- Tabel-tabel di migrasi `001_initial_schema.sql` dan `003_auth_rbac_assignments.sql` sudah mencakup relasi FK yang lengkap, namun query DAL backend repositori produk, transaksi, shift, pengeluaran, dan stok belum terhubung ke SQL pool.

### 1.19 Integration Problems
- Dashboard Owner (`DashboardService.ts`) menarik seluruh transaksi menggunakan `.findAll()` dari memori RAM, lalu melakukan pemfilteran JavaScript `.filter()`. Jika data berkembang, metode ini akan menyebabkan *memory overload*.

### 1.20 Scalability Problems
- Tidak adanya paginasi SQL server-side pada pencarian transaksi dan audit log. Harus diganti dengan SQL queries `LIMIT` & `OFFSET` serta query agregasi `SUM()`, `COUNT()`, `GROUP BY` langsung di PostgreSQL Engine.

### 1.21 Check Definition of Done
- Fitur Auth, User Management, dan RBAC telah memenuhi Definition of Done (UI + API + DB + RBAC + Hashing + Security).
- Fitur Transaksi POS, Stok, Shift, Pengeluaran, dan Dashboard masih memerlukan penyambungan query SQL Repositori ke PostgreSQL agar 100% produksi-ready.

---

## 2. ARSITEKTUR SAAT INI VS TARGET ARSITEKTUR

### 2.1 Arsitektur Saat Ini (Current Architecture)
```
[ Client (React SPA + SSE) ]
           │
           ▼
[ Express API Server (Middlewares & Auth JWT) ]
           │
     ┌─────┴────────────────────────────────────────┐
     │                                              │
     ▼ (Terhubung DB)                               ▼ (Masih RAM In-Memory)
[ PostgreSQL Pool ]                         [ In-Memory Repositories ]
- users                                     - products, categories
- roles, permissions                        - transactions, items
- activation_tokens                         - shifts, shift_users
- employee_assignments                      - expenses, stocks, audit_logs
```

### 2.2 Arsitektur Target (Target Architecture)
```
[ Client (React SPA + SSE Listener) ]
           │
           ▼
[ Express API Server (JWT + RBAC + Idempotency + Rate Limiter) ]
           │
           ▼ (100% Database Queries via PG Pool & SQL Aggregations)
[ PostgreSQL Database (Single Source of Truth) ]
├── User & Security: users, roles, permissions, activation_tokens, employee_assignments
├── Catalog & Inventory: categories, products, stocks, stock_movements
├── Operations & Sales: shifts, shift_users, shift_capital_contributions, transactions, transaction_items, payments
└── Finance & Audit: expenses, audit_logs, settings, backup_records
           │
           ▼ (Event Driven Broadcast & Secondary Sync)
┌───────────────────────────┬────────────────────────────┐
│ SSE Realtime Event Bus    │ Google Sheets Archival Sync│
└───────────────────────────┴────────────────────────────┘
```

---

## 3. GAP ANALYSIS (ANALISIS CELAH)

| Entity / Modul | Kondisi Saat Ini (Current State) | Target Arsitektur (Target State) | Tindakan & Solusi Teknis | Risk Level |
| :--- | :--- | :--- | :--- | :--- |
| **Users & Auth** | Terhubung ke PostgreSQL, Bcrypt, Activation Tokens, RBAC Dinamis. | Single Source of Truth PostgreSQL. | Pertahankan & bersihkan fallback RAM di `UserRepository.ts`. | **LOW** |
| **Employee Assignments** | Tabel DB & Repositori terhubung ke PostgreSQL. | Owner mengelola hirarki PJ ➔ Kasir via DB. | Terhubung penuh. Tingkatkan filter transaksi berbasis supervisor. | **LOW** |
| **Products & Categories** | Masih disimpan di Array In-Memory `ProductRepository.ts` & `CategoryRepository.ts`. | Data produk & kategori dibaca & ditulis dari tabel `products` & `categories` PostgreSQL. | Buat query SQL (`SELECT`, `INSERT`, `UPDATE`) di Repositori Produk & Kategori. | **HIGH** |
| **Transactions & Items** | Masih disimpan di Array In-Memory `TransactionRepository.ts`. | Transaksi & Item disimpan ke `transactions` & `transaction_items` PostgreSQL dengan DB Transaction (`BEGIN...COMMIT`). | Implementasikan `pool.query('BEGIN')` atomic transaction di `TransactionService.ts`. | **CRITICAL** |
| **Shifts & Cash Drawer** | Masih disimpan di Array In-Memory `ShiftRepository.ts`. | Shift & Modal diawasi via tabel `shifts` & `shift_users` PostgreSQL. | Hubungkan `ShiftRepository` ke database PostgreSQL. | **HIGH** |
| **Stocks & Movements** | Masih disimpan di Array In-Memory `StockRepository.ts`. | Stok berkurang secara atomic (`UPDATE stocks SET quantity = quantity - $1`) dan mencatat `stock_movements`. | Tambahkan query locking SQL pencegah race condition saat checkout bersamaan. | **CRITICAL** |
| **Expenses** | Masih disimpan di Array In-Memory `ExpenseRepository.ts`. | Pengeluaran tercatat di tabel `expenses` PostgreSQL. | Hubungkan `ExpenseRepository` ke database PostgreSQL. | **MEDIUM** |
| **Dashboard Owner** | Membaca seluruh data via JS `.findAll()` RAM dan menghitung agregat di memori Node.js. | Menjalankan agregasi SQL server-side (`SUM`, `COUNT`, `GROUP BY`) langsung di PostgreSQL Engine. | Refactor `DashboardService.ts` untuk menggunakan SQL aggregation queries. | **HIGH** |
| **Audit Logs** | Masih disimpan di Array In-Memory `AuditLogRepository.ts`. | Catatan aktivitas tersimpan permanen di tabel `audit_logs` PostgreSQL. | Hubungkan `AuditLogRepository` ke database PostgreSQL. | **MEDIUM** |

---

## 4. REKOMENDASI ROADMAP EKSEKUSI (NEXT PHASES)

1. **Fase 2: Refactoring Repositori Katalis (Products & Categories)**
   - Mengubah `ProductRepository` dan `CategoryRepository` agar mengeksekusi query SQL ke tabel PostgreSQL `products` dan `categories`.
2. **Fase 3: Refactoring Repositori Transaksi & Stok Atomic**
   - Menghubungkan `TransactionRepository`, `TransactionItemRepository`, dan `StockRepository` ke PostgreSQL dengan proteksi transaksi atomic `BEGIN...COMMIT` dan `SELECT FOR UPDATE`.
3. **Fase 4: Refactoring Shift, Expenses, & Audit Logs**
   - Menghubungkan `ShiftRepository`, `ExpenseRepository`, dan `AuditLogRepository` ke PostgreSQL.
4. **Fase 5: Optimasi Agregasi SQL Server-Side Dashboard Owner**
   - Mengganti perhitungan agregat memori JavaScript di `DashboardService.ts` menjadi query SQL teroptimasi (`SUM`, `COUNT`, `GROUP BY`, `BETWEEN`).
5. **Fase 6: Pengujian End-to-End & Security Hardening**
   - Menambahkan Express Rate Limiter, CORS origin restriction, dan verifikasi akhir build.
