# AUDIT ARSITEKTUR DINAMIS SISTEM POS KASIR USAHA CAMPURAN

> **Status:** Dokumen Hasil Audit Arsitektur & System Engineering
> **Versi:** 1.0.0
> **Tanggal:** 15 Agustus 2026
> **Auditor:** Software Architect & Senior Backend Engineer
> **Prinsip Utama:** Configurable / Data-Driven / Zero Hardcoded Business Logic

---

## 1. RINGKASAN ARSITEKTUR SAAT INI

Sistem POS Kasir Usaha Campuran saat ini dibangun dengan arsitektur 2-Tier / 3-Tier terpisah:
- **Frontend Client:** React + TypeScript + Vite (`client/`). Navigasi berbasis Tab State internal di `App.tsx`.
- **Backend API:** Express.js + TypeScript (`server/`). Pengelolaan rute via Express Router dengan middleware otentikasi JWT (`AuthMiddleware.ts`) dan otorisasi RBAC (`rbacMiddleware.ts`).
- **Data Persistence:** Modular Storage Layer / Repository Pattern (`server/src/repositories/`). Saat ini menggunakan `GoogleSheetsSyncService` & JSON Local Storage adapter yang siap dimigrasikan ke PostgreSQL/Supabase.

### Hasil Penilaian Prinsip Dinamis (Data-Driven)
Arsitektur saat ini menunjukkan kombinasi komponen yang sudah **dinamis (data-driven)** pada level transaksi operasional kasir, namun masih **didominasi oleh hardcode tingkat tinggi** pada struktur fondasi sistem (Role, Permission, Departemen/Business Unit, Metode Pembayaran, dan Skema Stok).

---

## 2. AUDIT MODUL & IMPLEMENTASI

### 2.1 ROLE DAN PERMISSION
- **Klasifikasi:** `[HARDCODE - PERLU DIPERBAIKI]` & `[ARSITEKTUR BERISIKO]`
- **Kondisi Saat Ini:**
  - Role di-hardcode sebagai TypeScript Union Type `'OWNER' | 'KARYAWAN'` (`server/src/types/domain.ts` & `client/src/types/index.ts`).
  - Tidak ada tabel `roles`, `permissions`, `role_permissions`, atau `user_roles` di basis data.
  - Matriks otorisasi di-hardcode di `server/src/utils/rbac.ts` menggunakan fungsi `hasPermission(role, action)` dengan pernyataan `switch-case`.
  - Otorisasi di Express Router bergantung pada `requireOwner` atau pengecekan statis `req.user.role === 'OWNER'`.
- **Analisis Masalah:**
  - Owner tidak dapat menambah role baru (misalnya "SUPERVISOR", "KASIR SENIOR", "ADMIN GUDANG") melalui UI/API tanpa mengubah source code dan melakukan redeploy backend.
  - Hak akses tidak dapat disesuaikan per toko.
- **Catatan Status PJ Shift:**
  - Penanggung Jawab Shift diimplementasikan secara dinamis melalui kolom `is_shift_leader` pada tabel `shift_users` (`[DINAMIS SUDAH BENAR]`), namun kewenangan sistemnya belum terhubung ke engine permission yang fleksibel.

---

### 2.2 USER MANAGEMENT
- **Klasifikasi:** `[DINAMIS TAPI BELUM LENGKAP]`
- **Kondisi Saat Ini:**
  - Data pengguna disimpan di database dengan atribut `user_id`, `username`, `password_hash`, `full_name`, `role`, `status` (`[DINAMIS SUDAH BENAR]`).
  - Namun, API endpoint dan UI untuk Manajemen Pengguna (Create, Update, Deactivate User) **belum tersedia**. Hanya ada endpoint `GET /api/auth/users`.
  - Atribut `role` pada entitas user terikat secara kaku pada string `'OWNER'` atau `'KARYAWAN'`.

---

### 2.3 DEPARTEMEN / BIDANG USAHA
- **Klasifikasi:** `[HARDCODE - PERLU DIPERBAIKI]`
- **Kondisi Saat Ini:**
  - Departemen / Bidang Usaha di-hardcode sebagai enum/type `'FC_PRINT' | 'FNB'` pada domain backend dan frontend.
  - Tidak ada tabel `departments` atau `business_units` di database.
  - Filter UI pada `ProductsPage.tsx` & `PosRegister.tsx` mengeras pada 2 tombol statis (`FC / Printing` dan `FNB`).
  - Rekapitulasi omzet pada `DashboardService.ts` meng-aggregate omzet secara eksplisit ke objek hardcoded `{ FC_PRINT: 0, FNB: 0 }`.
- **Analisis Masalah:**
  - Jika bisnis berkembang dan Owner membuka unit baru (misalnya "LAUNDRY", "JASA_KETIK", atau "SEWA_LAPTOP"), seluruh codebase (database interface, backend service, dashboard metrics, dan UI components) akan mengalami *breaking change* dan butuh refactoring masif.

---

### 2.4 KATEGORI
- **Klasifikasi:** `[DINAMIS TAPI BELUM LENGKAP]`
- **Kondisi Saat Ini:**
  - Tabel `categories` sudah tersedia di database (`category_id`, `category_name`, `business_unit`, `is_active`) (`[DINAMIS SUDAH BENAR]`).
  - Kategori dibaca secara dinamis dari API (`GET /api/categories`) dan dibuat dinamis via API (`POST /api/categories`).
- **Kekurangan:**
  - Kolom `business_unit` pada tabel kategori masih terkunci ke enum hardcoded `'FC_PRINT' | 'FNB'`.
  - Endpoint untuk mengedit (`PUT/PATCH`) dan menghapus/menonaktifkan kategori belum diimplementasikan.

---

### 2.5 BRAND / MEREK / SUBKATEGORI
- **Klasifikasi:** `[HARDCODE - PERLU DIPERBAIKI]` (Tidak Ada di Database)
- **Kondisi Saat Ini:**
  - Konsep Brand/Merek/Subkategori **sama sekali belum ada** di skema database, tipe domain backend, maupun UI frontend.
  - Sebagai contoh, merek es krim ("Aice", "Kul-Kul") atau merek kertas ("PaperOne", "Sidu") harus ditulis secara manual di dalam string `product_name` (misal: `"Es Krim Aice Mochi"`).
- **Analisis Masalah:**
  - Owner tidak dapat melakukan filtering, analisis penjualan, atau audit stok per merek/brand.
  - Mengarahkan nama merek ke dalam string nama produk melanggar prinsip normalisasi basis data.

---

### 2.6 PRODUK DAN TIPE PRODUK
- **Klasifikasi:** `[DINAMIS TAPI BELUM LENGKAP]`
- **Kondisi Saat Ini:**
  - Tabel `products` tersimpan di database (`product_id`, `category_id`, `product_name`, `business_unit`, `selling_price`, `manage_stock`, `is_active`).
  - Pembedaan Produk Fisik vs Jasa/Layanan dikelola secara dinamis melalui flag boolean `manage_stock` (`[DINAMIS SUDAH BENAR]`).
- **Kekurangan & Field yang Hilang:**
  - **Harga Modal (`capital_price` / HPP):** Hilang dari skema. Akibatnya, analisis profit bersih bisnis pada `DashboardService.ts` hanya menggunakan *perkiraan kasar* (`omzet - pengeluaran`), melanggar aturan AGENTS.md Poin 17.
  - **Satuan (`unit`):** Hilang (Pcs, Lembar, Pack, Box, Botol).
  - **Minimum Stok (`min_stock`):** Hilang (peringatan stok menipis tidak dapat berjalan otomatis).
  - **SKU / Barcode (`sku`):** Belum ada.
  - Endpoint UPDATE (`PUT /api/products/:id`) dan DELETE/Deactivate produk belum tersedia.

---

### 2.7 INVENTORY & STOK MANAGEMENT
- **Klasifikasi:** `[HARDCODE - PERLU DIPERBAIKI]` & `[ARSITEKTUR BERISIKO]`
- **Kondisi Saat Ini:**
  - Tabel `stocks` menyimpan angka `current_stock` per produk (`[DINAMIS SUDAH BENAR]`).
  - Pengurangan stok otomatis saat transaksi checkout dan pengembalian stok saat pembatalan berjalan dinamis mengikuti flag `manage_stock`.
- **Kelemahan Kritis Arsitektur:**
  - **Histori Perubahan Stok (`stock_logs` / `inventory_movements`) TIDAK ADA.**
  - Stok diubah secara *direct overwrite* tanpa mencatat angka sebelum (`qty_before`), perubahan (`qty_change`), angka sesudah (`qty_after`), alasan pergerakan (`RESTOCK`, `ADJUSTMENT`, `SALE`, `DAMAGE`), dan user pelaksana.
  - **Kerentanan Keamanan Kritis:** Endpoint `POST /api/stocks/update` **TIDAK memiliki RBAC Guard**. Semua karyawan terautentikasi dapat mengubah nilai stok fisik tanpa izin Owner.

---

### 2.8 METODE PEMBAYARAN
- **Klasifikasi:** `[HARDCODE - PERLU DIPERBAIKI]`
- **Kondisi Saat Ini:**
  - Metode Pembayaran di-hardcode sebagai enum `'CASH' | 'QRIS' | 'TRANSFER'` di seluruh sistem.
  - Tabel `shifts` memiliki kolom terpisah yang di-hardcode: `net_cash_sales`, `total_qris_sales`, `total_transfer_sales`.
  - Service `ReportService.ts` & `DashboardService.ts` meng-aggregate nilai pembayaran menggunakan percabangan hardcoded `if (payment_method === 'CASH') ... else if (payment_method === 'QRIS') ...`.
  - Frontend `PosRegister.tsx` menggunakan `<select>` statis dengan 3 pilihan hardcoded.
- **Analisis Masalah:**
  - Tidak ada tabel `payment_methods`. Owner tidak dapat menambahkan metode pembayaran baru (misal: "EDC BCA", "GoPay", "ShopeePay", "Voucher") tanpa mengubah struktur database dan kode backend.

---

### 2.9 DASHBOARD METRICS
- **Klasifikasi:** `[HARDCODE - PERLU DIPERBAIKI]`
- **Kondisi Saat Ini:**
  - Kalkulasi omzet produk terlaris (`top_selling_products`) dan penjualan rendah (`slow_moving_products`) berjalan dinamis mengikuti transaksi aktual (`[DINAMIS SUDAH BENAR]`).
  - Namun, agregasi omzet per bidang usaha (`revenue_by_unit`) dan omzet per metode bayar (`revenue_by_method`) dikunci pada kunci hardcoded (`FC_PRINT`, `FNB`, `CASH`, `QRIS`, `TRANSFER`).

---

### 2.10 REPORTING SYSTEM
- **Klasifikasi:** `[DINAMIS TAPI BELUM LENGKAP]`
- **Kondisi Saat Ini:**
  - `ReportService.ts` mendukung filter dinamis berdasarkan rentang waktu (`DAILY`, `WEEKLY`, `MONTHLY`, `YEARLY`, `CUSTOM`), kasir (`user_id`), shift (`shift_id`), unit bisnis, dan metode bayar (`[DINAMIS SUDAH BENAR]`).
  - Menampilkan rekap performa per karyawan secara otomatis.
- **Celah Keamanan:**
  - Endpoint `GET /api/reports/sales` tidak dilindungi `requireOwner`, sehingga seluruh karyawan dapat melihat rekapitulasi keuangan bisnis.

---

## 3. AUDIT KODE SPESIFIK (HARDCODE LOCATION)

### 3.1 FRONTEND HARDCODE (`client/`)

| Location (File & Line) | Element / Function | Issue Description |
|---|---|---|
| `client/src/types/index.ts:3` | `export type UserRole` | Enum hardcoded `'OWNER' \| 'KARYAWAN'` |
| `client/src/types/index.ts:15` | `export type BusinessUnit` | Enum hardcoded `'FC_PRINT' \| 'FNB'` |
| `client/src/types/index.ts:85` | `export type PaymentMethod` | Enum hardcoded `'CASH' \| 'QRIS' \| 'TRANSFER'` |
| `client/src/App.tsx:22` | `activeTab` state | Array tab UI hardcoded dalam komponen tunggal |
| `client/src/App.tsx:400-457` | `Pengujian Keamanan RBAC` | Debug test panel tampil di UI produksi untuk semua role |
| `client/src/components/PosRegister.tsx:160-186` | Filter Unit Buttons | Button hardcoded untuk `ALL`, `FC_PRINT`, dan `FNB` |
| `client/src/components/PosRegister.tsx:329-333` | `<select>` Payment Method | Option hardcoded untuk CASH, QRIS, dan TRANSFER |
| `client/src/pages/ProductsPage.tsx:127-154` | Filter Unit Buttons | Button hardcoded untuk `FC_PRINT` dan `FNB` |
| `client/src/pages/ProductsPage.tsx:253-254` | Modal `<select>` Unit | Option hardcoded `'FC_PRINT'` dan `'FNB'` |
| `client/src/pages/ReportsPage.tsx:145-148` | Filter `<select>` Method | Option hardcoded CASH, QRIS, TRANSFER |

---

### 3.2 BACKEND HARDCODE (`server/`)

| Location (File & Line) | Element / Function | Issue Description |
|---|---|---|
| `server/src/types/domain.ts:3` | `export type UserRole` | Hardcoded `'OWNER' \| 'KARYAWAN'` |
| `server/src/types/domain.ts:59` | `export type BusinessUnit` | Hardcoded `'FC_PRINT' \| 'FNB'` |
| `server/src/types/domain.ts:61` | `export type PaymentMethod` | Hardcoded `'CASH' \| 'QRIS' \| 'TRANSFER'` |
| `server/src/types/domain.ts:110-115` | `EXPENSE_CATEGORIES` | Array kategori pengeluaran di-hardcode dalam kode |
| `server/src/utils/rbac.ts:7-47` | `hasPermission()` | Switch-case hak akses hardcoded tanpa konfigurasi DB |
| `server/src/middlewares/AuthMiddleware.ts:4` | `JWT_SECRET` | Fallback secret di-hardcode: `'pos-kasir-super-secret...'` |
| `server/src/services/DashboardService.ts:23-31` | `DashboardMetrics` Interface | Structure hardcoded untuk unit (`FC_PRINT`, `FNB`) & payment |
| `server/src/services/DashboardService.ts:94-96` | `revenue_by_method` accumulator | Branching `if (tx.payment_method === 'CASH') ...` |
| `server/src/services/DashboardService.ts:115-116` | `revenue_by_unit` accumulator | Branching `if (prod.business_unit === 'FC_PRINT') ...` |
| `server/src/services/ReportService.ts:146-148` | Sales report accumulator | Branching hardcoded per metode bayar |
| `server/src/routes/stockRoutes.ts:18` | `POST /api/stocks/update` | Route tidak memiliki middleware `requireOwner` |
| `server/src/routes/reportRoutes.ts:30` | `GET /api/reports/sales` | Route tidak memiliki middleware `requireOwner` |

---

## 4. AUDIT SKEMA DATABASE

| Tabel (Database Entities) | Status Audit | Keterangan & Defisit Arsitektur |
|---|---|---|
| `users` | `[DINAMIS TAPI BELUM LENGKAP]` | Kurang relasi ke tabel `roles`. Kolom `role` berupa string kaku. |
| `roles` | ❌ **TIDAK ADA** | Role tidak dapat dikelola secara data-driven. |
| `permissions` | ❌ **TIDAK ADA** | Hak akses tidak terdaftar sebagai entitas basis data. |
| `role_permissions` | ❌ **TIDAK ADA** | Pemetaan permission ke role tidak dapat diubah via UI. |
| `departments` / `business_units` | ❌ **TIDAK ADA** | Unit usaha tergantung pada enum hardcoded. |
| `categories` | `[DINAMIS TAPI BELUM LENGKAP]` | Ada, namun terikat pada foreign key/enum `business_unit` statis. |
| `brands` / `merek` | ❌ **TIDAK ADA** | Tidak ada tabel merek/brand produk. |
| `products` | `[DINAMIS TAPI BELUM LENGKAP]` | Kurang kolom: `capital_price`, `unit`, `min_stock`, `sku`, `brand_id`. |
| `stocks` | `[HARDCODE - PERLU DIPERBAIKI]` | Hanya menyimpan scalar quantity. Tidak ada audit trail. |
| `stock_logs` / `inventory_movements` | ❌ **TIDAK ADA** | Histori perubahan stok hilang. |
| `payment_methods` | ❌ **TIDAK ADA** | Metode bayar tidak ada di database. |
| `shifts` | `[HARDCODE - PERLU DIPERBAIKI]` | Memiliki kolom kaku `net_cash_sales`, `total_qris_sales`, `total_transfer_sales`. |
| `shift_users` | `[DINAMIS SUDAH BENAR]` | Merekam partisipasi kasir & penanggung jawab per shift. |
| `shift_capital_contributions` | `[DINAMIS SUDAH BENAR]` | Merekam setoran modal dari berbagai pengguna. |
| `transactions` & `transaction_items` | `[DINAMIS SUDAH BENAR]` | Struktur data transaksi sudah benar. |
| `expenses` | `[DINAMIS SUDAH BENAR]` | Pencatatan pengeluaran sudah terhubung ke shift & user. |
| `audit_logs` | `[DINAMIS SUDAH BENAR]` | Merekam aktivitas sistem. |

---

## 5. DAFTAR MASALAH ARSITEKTUR & TINGKAT PRIORITAS

Below is the consolidated audit issue registry prioritized by severity (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`):

### 🔴 PRIORITAS: CRITICAL

#### [ISSUE-001] Penyesuaian Stok Manual Tidak Memiliki RBAC Guard & Tanpa Audit Trail
- **Lokasi File:** `server/src/routes/stockRoutes.ts:18` & `server/src/services/StockService.ts:94-119`
- **Bagian/Fungsi:** `router.post('/update')` / `StockService.updateStockQuantity()`
- **Masalah:** Route `POST /api/stocks/update` hanya diproteksi oleh `authMiddleware`. Semua karyawan terautentikasi dapat mengubah kuantitas stok fisik. Selain itu, tidak ada tabel `stock_logs` untuk mencatat jumlah stok sebelum, sesudah, alasan, dan pelaksana.
- **Mengapa Bermasalah:** Mengabaikan aturan `MANAGE_STOCK_MANUAL` (Owner Only) di RBAC.md v0.4.0 dan menghilangkan akuntabilitas fisik barang.
- **Dampak:** Kasir dapat memanipulasi stok fisik barang tanpa terdeteksi oleh Owner.
- **Rekomendasi:** 
  1. Tambahkan middleware `requireOwner` pada route `POST /api/stocks/update`.
  2. Buat tabel `stock_logs` (`inventory_movements`) untuk mencatat histori setiap pergerakan stok.

#### [ISSUE-002] JWT Secret Di-hardcode Dalam Source Code Backend
- **Lokasi File:** `server/src/middlewares/AuthMiddleware.ts:4`
- **Bagian/Fungsi:** `const JWT_SECRET = process.env.JWT_SECRET || 'pos-kasir-super-secret-jwt-key-2026';`
- **Masalah:** Penggunaan nilai fallback rahasia JWT secara eksplisit di dalam source code repository.
- **Mengapa Bermasalah:** Melanggar prinsip keamanan AGENTS.md Poin 23 (Keamanan). Secret key dapat dibaca siapapun yang mengakses codebase.
- **Dampak:** Penyerang dapat memalsukan token JWT dan melakukan privilege escalation menjadi Owner.
- **Rekomendasi:** Hapus string fallback hardcoded. Wajibkan aplikasi berhenti (*crash-fast*) jika `process.env.JWT_SECRET` tidak didefinisikan.

---

### 🟠 PRIORITAS: HIGH

#### [ISSUE-003] Role & Permission Di-hardcode Sebagai TypeScript Enum & Hardcoded Matrix
- **Lokasi File:** `server/src/types/domain.ts:3` & `server/src/utils/rbac.ts:22-47`
- **Bagian/Fungsi:** `UserRole` type & `hasPermission()` function
- **Masalah:** Role hanya terbatas pada `'OWNER'` dan `'KARYAWAN'`. Permission dipetakan menggunakan `switch-case` di dalam file JS/TS.
- **Mengapa Bermasalah:** Tidak memenuhi kebutuhan dinamis bisnis. Owner tidak dapat membuat role kustom (Supervisor, Kasir Senior, dll.) atau menyesuaikan hak akses per toko tanpa intervensi developer.
- **Dampak:** Perubahan hak akses memerlukan modifikasi source code dan redeploy backend.
- **Rekomendasi:** Rancang skema tabel `roles`, `permissions`, dan `role_permissions` di basis data, serta buat API & UI pengelolaannya.

#### [ISSUE-004] Absence of Harga Modal (`capital_price`) Pada Produk
- **Lokasi File:** `server/src/types/domain.ts:88-96` & `server/src/services/DashboardService.ts:101`
- **Bagian/Fungsi:** `ProductEntity` interface & `DashboardService.getDashboardMetrics()`
- **Masalah:** Entitas produk tidak memiliki atribut `capital_price` (harga modal / HPP). Dashboard menghitung perkiraan laba bersih secara tidak akurat (`omzet - pengeluaran`).
- **Mengapa Bermasalah:** Melanggar AGENTS.md Poin 17 (Analisis Keuntungan) yang mewajibkan perhitungan keuntungan kotor dan margin berdasarkan harga modal produk.
- **Dampak:** Owner mendapatkan data keuntungan bisnis yang keliru dan tidak presisi.
- **Rekomendasi:** Tambahkan kolom `capital_price` pada tabel `products` dan perbarui logika kalkulasi profit margin pada `DashboardService`.

#### [ISSUE-005] Endpoint Laporan Keuangan Tidak Memiliki Guard `requireOwner`
- **Lokasi File:** `server/src/routes/reportRoutes.ts:30`
- **Bagian/Fungsi:** `router.get('/sales', authMiddleware, reportController.getSalesReport);`
- **Masalah:** Endpoint laporan omzet dan penjualan dapat diakses oleh seluruh karyawan yang terautentikasi.
- **Mengapa Bermasalah:** Melanggar RBAC.md v0.4.0 (Laporan Keuangan adalah hak eksklusif OWNER).
- **Dampak:** Karyawan biasa dapat mengekstraksi seluruh data transaksi dan omzet rahasia toko.
- **Rekomendasi:** Tambahkan middleware `requireOwner` pada rute `GET /api/reports/sales`.

---

### 🟡 PRIORITAS: MEDIUM

#### [ISSUE-006] Metode Pembayaran & Kolom Shift Di-hardcode (`CASH`, `QRIS`, `TRANSFER`)
- **Lokasi File:** `server/src/types/domain.ts:61`, `server/src/services/DashboardService.ts:80`, `client/src/components/PosRegister.tsx:329`
- **Bagian/Fungsi:** Enum `PaymentMethod`, `revenue_by_method`, dan UI `<select>`
- **Masalah:** Metode pembayaran di-hardcode di 10+ file backend dan frontend. Tabel `shifts` memiliki kolom terpisah untuk setiap metode (`net_cash_sales`, `total_qris_sales`, `total_transfer_sales`).
- **Mengapa Bermasalah:** Jika toko menambah metode EDC/Bank lain atau e-Wallet, aplikasi harus merubah skema database dan puluhan file kode.
- **Dampak:** Aplikasi tidak fleksibel terhadap perubahan tren pembayaran.
- **Rekomendasi:** Buat tabel `payment_methods` dan ubah rekapitulasi shift agar menyimpan rincian pembayaran secara dinamis.

#### [ISSUE-007] Bidang Usaha / Departemen Di-hardcode (`FC_PRINT`, `FNB`)
- **Lokasi File:** `server/src/types/domain.ts:59`, `server/src/services/DashboardService.ts:23-26`, `client/src/pages/ProductsPage.tsx:127`
- **Bagian/Fungsi:** Enum `BusinessUnit` & Agregasi Dashboard
- **Masalah:** Bidang usaha dikunci pada dua opsi statis (`FC_PRINT` dan `FNB`).
- **Mengapa Bermasalah:** Mencegah ekspansi usaha ke bidang baru tanpa merombak sistem.
- **Dampak:** Arsitektur sistem menjadi kaku dan berbiaya maintenance tinggi.
- **Rekomendasi:** Buat tabel `departments` / `business_units` di database dan hubungkan kategori serta produk ke ID departemen secara dinamis.

#### [ISSUE-008] Ketiadaan Master Data Brand / Merek
- **Lokasi File:** `server/src/types/domain.ts` & `client/src/types/index.ts`
- **Bagian/Fungsi:** Entitas Katalog Produk
- **Masalah:** Merek/Brand produk disatukan ke dalam string `product_name`.
- **Mengapa Bermasalah:** Mengabaikan rekomendasi PRD & AGENTS.md mengenai pengelolaan brand (misal: Es Krim Aice vs Kul-Kul).
- **Dampak:** Kesulitan pencarian, pencetakan laporan per merek, dan manajemen stok spesifik merek.
- **Rekomendasi:** Tambahkan tabel `brands` dan foreign key `brand_id` pada tabel `products`.

---

### 🔵 PRIORITAS: LOW

#### [ISSUE-009] Panel Pengujian Keamanan RBAC Render di UI Produksi
- **Lokasi File:** `client/src/App.tsx:400-457`
- **Bagian/Fungsi:** Render JSX `Pengujian Keamanan RBAC (Backend & Frontend Middleware)`
- **Masalah:** Panel pengujian API dan visualisasi daftar user tampil pada halaman utama kasir untuk semua role pengguna.
- **Mengapa Bermasalah:** Menampilkan komponen debug/internal pada lingkungan antarmuka operasional.
- **Dampak:** Memperburuk kerapian UI kasir dan memberikan informasi internal yang tidak diperlukan kepada Karyawan.
- **Rekomendasi:** Pindahkan panel pengujian ini ke halaman internal khusus Owner atau hapus dari UI utama.

#### [ISSUE-010] Ketiadaan Atribut Satuan (`unit`), SKU, dan Minimum Stok (`min_stock`)
- **Lokasi File:** `server/src/types/domain.ts:88-96`
- **Bagian/Fungsi:** Interface `ProductEntity`
- **Masalah:** Atribut pendukung inventaris seperti satuan produk, kode SKU/barcode, dan ambang batas minimum stok belum ada di skema database.
- **Mengapa Bermasalah:** Menghambat otomasi peringatan stok habis dan kerapian cetak struk kasir.
- **Dampak:** Pengelolaan barang fisik kurang detil.
- **Rekomendasi:** Lengkapi kolom `unit`, `sku`, dan `min_stock` pada skema tabel `products`.

---

## 6. KESIMPULAN AUDIT & LANGKAH PENGEMBANGAN DARI OWNER

1. **Integritas Operasional Kasir:** Fungsi dasar POS (penjualan, shift, pengeluaran, cetak struk) sudah berjalan dinamis mengikuti data transaksi.
2. **Kelemahan Terbesar:** Fondasi otorisasi (RBAC), departemen, merek, metode bayar, dan audit stok masih bersifat **hardcoded statis**.
3. **Sesuai Instruksi User:** **TIDAK ADA KODE ATAU DATABASE YANG DIUBAH** dalam proses audit ini. Seluruh temuan telah dibukukan dalam dokumen referensi ini untuk menjadi panduan refactoring di masa depan.
