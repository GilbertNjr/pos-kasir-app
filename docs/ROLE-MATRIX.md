# ROLE MATRIX (RBAC) - POS KASIR USAHA CAMPURAN

> **Status:** Dokumen Referensi Resmi
> **Versi:** 1.0.0
> **Tanggal:** 15 Agustus 2026
> **Referensi:** RBAC.md v0.4.0 | BUSINESS-RULES.md v0.5.0 | DATABASE.md v0.2.0

---

## PENTING: MODEL ROLE DALAM SISTEM

Sistem menggunakan **2 role akun permanen** di database:
- `OWNER`
- `KARYAWAN`

"PENANGGUNG JAWAB" (disingkat PJ) **bukan role akun**, melainkan **status sesi shift** yang diwakili oleh `is_shift_leader = TRUE` pada tabel `shift_users`.

Dalam matriks ini, kolom `PJ` merujuk pada `KARYAWAN` dengan `is_shift_leader = TRUE` pada shift aktif.

---

## 1. MATRIKS PERMISSION LENGKAP

### 1.1 AUTHENTICATION

| Fitur | Permission | OWNER | PJ | KARYAWAN |
|---|---|:---:|:---:|:---:|
| Login | CREATE | ✅ | ✅ | ✅ |
| Logout | CREATE | ✅ | ✅ | ✅ |
| Lihat profil sendiri | VIEW | ✅ | ✅ | ✅ |
| Lihat semua pengguna | VIEW | ✅ | ❌ | ❌ |
| Buat pengguna baru | CREATE | ✅ | ❌ | ❌ |
| Ubah data pengguna | UPDATE | ✅ | ❌ | ❌ |
| Nonaktifkan pengguna | MANAGE | ✅ | ❌ | ❌ |
| Reset akses pengguna | MANAGE | ✅ | ❌ | ❌ |

### 1.2 SHIFT

| Fitur | Permission | OWNER | PJ | KARYAWAN |
|---|---|:---:|:---:|:---:|
| Lihat shift aktif | VIEW | ✅ | ✅ | ✅ |
| Buka shift (inisiasi Shift ID baru) | CREATE | ✅ | ✅ | ❌ |
| Bergabung ke shift aktif | CREATE | ✅ | ✅ | ✅ |
| Input kontribusi modal awal | CREATE | ✅ | ✅ | ✅ |
| Tutup shift & rekonsiliasi kas | CREATE | ✅ | ✅ | ❌ |
| Override tutup shift (kapan saja) | APPROVE | ✅ | ❌ | ❌ |
| Otorisasi pengembalian modal | APPROVE | ✅ | ✅ | ❌ |
| Lihat histori seluruh shift | VIEW | ✅ | ❌ | ❌ |
| Lihat histori shift milik sendiri | VIEW | ✅ | ✅ | ✅ |

### 1.3 KASIR & TRANSAKSI

| Fitur | Permission | OWNER | PJ | KARYAWAN |
|---|---|:---:|:---:|:---:|
| Buat transaksi penjualan/jasa | CREATE | ✅ | ✅ | ✅ |
| Pilih produk ke keranjang | CREATE | ✅ | ✅ | ✅ |
| Ubah jumlah item keranjang | UPDATE | ✅ | ✅ | ✅ |
| Hapus item dari keranjang | DELETE | ✅ | ✅ | ✅ |
| Terima pembayaran (CASH/QRIS/Transfer) | CREATE | ✅ | ✅ | ✅ |
| Lihat transaksi milik sendiri | VIEW | ✅ | ✅ | ✅ |
| Lihat semua transaksi shift aktif | VIEW | ✅ | ✅ | ✅ |
| Lihat semua transaksi historis | VIEW | ✅ | ❌ | ❌ |
| Pembatalan transaksi (Refund) | APPROVE | ✅ | `[OD#1]` | `[OD#1]` |
| Hapus permanen transaksi | DELETE | ❌ | ❌ | ❌ |
| Rekap pembayaran per metode | VIEW | ✅ | ✅ | ✅ |

### 1.4 PRODUK & KATEGORI

| Fitur | Permission | OWNER | PJ | KARYAWAN |
|---|---|:---:|:---:|:---:|
| Lihat katalog produk aktif | VIEW | ✅ | ✅ | ✅ |
| Buat produk baru | CREATE | ✅ | ❌ | ❌ |
| Ubah nama/harga/kategori produk | UPDATE | ✅ | ❌ | ❌ |
| Nonaktifkan produk | MANAGE | ✅ | ❌ | ❌ |
| Hapus produk secara permanen | DELETE | ❌ | ❌ | ❌ |
| Lihat kategori | VIEW | ✅ | ✅ | ✅ |
| Buat kategori baru | CREATE | ✅ | ❌ | ❌ |
| Ubah kategori | UPDATE | ✅ | ❌ | ❌ |

### 1.5 STOK

| Fitur | Permission | OWNER | PJ | KARYAWAN |
|---|---|:---:|:---:|:---:|
| Lihat stok saat ini | VIEW | ✅ | ✅ | ✅ |
| Lihat log riwayat stok | VIEW | ✅ | ✅ | ✅ |
| Penyesuaian stok manual | ADJUST | ✅ | ❌ | ❌ |
| Pengurangan stok via transaksi (otomatis) | - | ✅ | ✅ | ✅ |
| Pengembalian stok via pembatalan (otomatis) | - | ✅ | ✅ | ✅ |

### 1.6 PENGELUARAN

| Fitur | Permission | OWNER | PJ | KARYAWAN |
|---|---|:---:|:---:|:---:|
| Catat pengeluaran operasional | CREATE | ✅ | `[OD#2]` | `[OD#2]` |
| Lihat pengeluaran shift aktif | VIEW | ✅ | ✅ | ✅ |
| Lihat semua pengeluaran historis | VIEW | ✅ | ❌ | ❌ |

### 1.7 LAPORAN & DASHBOARD

| Fitur | Permission | OWNER | PJ | KARYAWAN |
|---|---|:---:|:---:|:---:|
| Dashboard Owner (omzet, analitik) | VIEW | ✅ | ❌ | ❌ |
| Laporan penjualan (historis penuh) | VIEW | ✅ | ❌ | ❌ |
| Laporan keuangan & performa | VIEW | ✅ | ❌ | ❌ |
| Laporan produk terlaris/kurang laku | VIEW | ✅ | ❌ | ❌ |
| Laporan harian/mingguan/bulanan/tahunan | VIEW | ✅ | ❌ | ❌ |
| Ekspor laporan | EXPORT | ✅ | ❌ | ❌ |
| Rekap kinerja diri sendiri & modal | VIEW | ✅ | ✅ | ✅ |
| Monitoring aktivitas kasir & shift aktif | VIEW | ✅ | ❌ | ❌ |

### 1.8 AUDIT LOG

| Fitur | Permission | OWNER | PJ | KARYAWAN |
|---|---|:---:|:---:|:---:|
| Lihat seluruh audit log | VIEW | ✅ | ❌ | ❌ |
| Hapus audit log | DELETE | ❌ | ❌ | ❌ |

### 1.9 BACKUP & RESTORE

| Fitur | Permission | OWNER | PJ | KARYAWAN |
|---|---|:---:|:---:|:---:|
| Ekspor backup | CREATE | ✅ | ❌ | ❌ |
| Lihat status & histori backup | VIEW | ✅ | ❌ | ❌ |
| Restore database | MANAGE | ✅ | ❌ | ❌ |
| Sinkronisasi Google Sheets | MANAGE | ✅ | ❌ | ❌ |

---

## 2. RINGKASAN AKSES PER ROLE

### OWNER
- Hak akses penuh terhadap seluruh modul dan fitur sistem
- Satu-satunya role yang dapat melakukan backup, restore, dan melihat audit log
- Satu-satunya role yang dapat mengelola pengguna dan produk (CRUD)
- Satu-satunya role yang dapat melakukan stock adjustment manual
- Dapat berperan sebagai kasir tanpa kehilangan hak OWNER
- Dapat memonitor bisnis dari lokasi mana pun

### PENANGGUNG JAWAB (PJ Shift - `is_shift_leader = TRUE`)
- Bukan role akun permanen; merupakan status dalam satu sesi shift
- Dapat membuka dan menutup shift + rekonsiliasi kas
- Dapat mengotorisasi pengembalian modal awal
- Dapat melakukan transaksi kasir
- Dapat melihat pengeluaran shift berjalan
- Tidak dapat mengakses laporan strategis, backup, restore, atau audit log

### KARYAWAN (Anggota Shift - `is_shift_leader = FALSE`)
- Fokus pada transaksi kasir harian
- Bergabung ke shift yang sudah aktif (tidak bisa membuka/menutup shift)
- Dapat melihat stok dan katalog produk (read-only)
- Tidak dapat memodifikasi master data apapun
- Tidak dapat mengakses laporan, backup, restore, atau audit log

---

## 3. ENDPOINT BACKEND & STATUS PROTEKSI

| Endpoint | Method | Proteksi Saat Ini | Target Proteksi |
|---|---|---|---|
| `/api/auth/login` | POST | Public | Public ✅ |
| `/api/auth/me` | GET | `authMiddleware` | Auth Only ✅ |
| `/api/auth/users` | GET | `authMiddleware` + `requireOwner` | Owner Only ✅ |
| `/api/categories` | GET | `authMiddleware` | Auth Only ✅ |
| `/api/categories` | POST | `authMiddleware` + `requireOwner` | Owner Only ✅ |
| `/api/products` | GET | `authMiddleware` | Auth Only ✅ |
| `/api/products` | POST | `authMiddleware` + `requireOwner` | Owner Only ✅ |
| `/api/shifts/active` | GET | `authMiddleware` | Auth Only ✅ |
| `/api/shifts/open` | POST | `authMiddleware` | ⚠️ **KONFLIK** - Semua auth user bisa buka shift |
| `/api/shifts/capital` | POST | `authMiddleware` | Auth Only ✅ |
| `/api/shifts/close` | POST | `authMiddleware` | ⚠️ **KONFLIK** - Service-level check saja |
| `/api/shifts/return-capital` | POST | `authMiddleware` | ⚠️ **KONFLIK** - Tidak ada cek PJ/Owner |
| `/api/transactions` | POST | `authMiddleware` | Auth Only ✅ |
| `/api/transactions` | GET | `authMiddleware` | Auth Only ✅ |
| `/api/transactions/payment-summary` | GET | `authMiddleware` | ⚠️ **KONFLIK** - Seharusnya Owner/PJ Only |
| `/api/expenses` | POST | `authMiddleware` | ⚠️ **KONFLIK** - OPEN DECISION #2 belum diimplementasi |
| `/api/expenses` | GET | `authMiddleware` | Auth Only ✅ |
| `/api/stocks` | GET | `authMiddleware` | Auth Only ✅ |
| `/api/stocks/update` | POST | `authMiddleware` | ⚠️ **KONFLIK KRITIS** - Semua auth user bisa update stok |
| `/api/dashboard/metrics` | GET | `authMiddleware` + `requireOwner` | Owner Only ✅ |
| `/api/reports/sales` | GET | `authMiddleware` | ⚠️ **KONFLIK** - Seharusnya Owner Only |
| `/api/backup/export` | GET | `authMiddleware` + `requireOwner` | Owner Only ✅ |
| `/api/backup/history` | GET | `authMiddleware` + `requireOwner` | Owner Only ✅ |
| `/api/backup/restore` | POST | `authMiddleware` + `requireOwner` | Owner Only ✅ |
| `/api/backup/google-sheets-sync` | POST | `authMiddleware` + `requireOwner` | Owner Only ✅ |
| `/api/audit-logs` | GET | `authMiddleware` + `requireOwner` | Owner Only ✅ |

---

## 4. HALAMAN FRONTEND PER ROLE

| Halaman (Tab) | Route/Tab | Akses Saat Ini | Target Akses |
|---|---|---|---|
| Login | `LoginPage` | Public | Public ✅ |
| Kasir & Dashboard | `POS` tab | Semua user | Semua user ✅ |
| Manajemen Shift | `SHIFT` tab | Semua user | Semua user ✅ |
| Pengeluaran Kas | `EXPENSES` tab | Semua user | ⚠️ Perlu disesuaikan dengan OD#2 |
| Rekap Pembayaran | `PAYMENT` tab | Semua user | ⚠️ Seharusnya Owner/PJ saja |
| Laporan Penjualan | `REPORTS` tab | Semua user | ⚠️ Seharusnya Owner Only |
| Stok Produk Fisik | `STOCKS` tab | Semua user | ⚠️ Update stok seharusnya Owner Only |
| Katalog Master Produk | `PRODUCTS` tab | Semua user (UI dinamis) | Lihat ✅, Tambah Owner Only ✅ |
| Backup & Restore | `BACKUP` tab | Owner Only (via `currentUser.role === 'OWNER'`) | Owner Only ✅ |
| Audit Log | `AUDIT` tab | Owner Only (via `currentUser.role === 'OWNER'`) | Owner Only ✅ |
| Dashboard Owner | `DASHBOARD` tab | Owner Only (via `currentUser.role === 'OWNER'`) | Owner Only ✅ |

---

## 5. DAFTAR KONFLIK RBAC

### KONFLIK-001 — `POST /api/shifts/open` Tidak Ada RBAC Guard
- **File:** `server/src/routes/shiftRoutes.ts` baris 20
- **Kondisi:** Endpoint hanya dilindungi `authMiddleware`. Semua karyawan (termasuk anggota shift) dapat membuka shift baru.
- **Target:** Seharusnya hanya user yang belum terdaftar sebagai anggota shift aktif manapun yang bisa membuka shift, bukan semua karyawan secara bebas.
- **Risiko:** Karyawan yang seharusnya hanya anggota shift bisa membuat shift baru secara sembarangan.

### KONFLIK-002 — `POST /api/shifts/return-capital` Tidak Ada Validasi PJ/Owner
- **File:** `server/src/controllers/ShiftController.ts` baris 75–87
- **Kondisi:** Endpoint `returnCapitalContribution` tidak memvalidasi apakah executor adalah PJ Shift atau OWNER. Siapapun yang terautentikasi bisa menandai modal sebagai `RETURNED`.
- **Risiko:** Karyawan anggota shift dapat mengubah status modal orang lain menjadi `RETURNED` tanpa otorisasi.

### KONFLIK-003 — `POST /api/stocks/update` Tidak Ada RBAC Guard (KRITIS)
- **File:** `server/src/routes/stockRoutes.ts` baris 18
- **Kondisi:** Endpoint `POST /api/stocks/update` hanya dilindungi `authMiddleware`. Tidak ada `requireOwner` atau validasi tambahan.
- **Target:** Berdasarkan RBAC.md v0.4.0, penyesuaian stok manual (`MANAGE_STOCK_MANUAL`) adalah hak eksklusif OWNER.
- **Risiko KRITIS:** Seluruh karyawan (termasuk kasir biasa) dapat mengubah kuantitas stok secara manual, yang dapat merusak integritas data stok.

### KONFLIK-004 — `GET /api/reports/sales` Tidak Ada RBAC Guard
- **File:** `server/src/routes/reportRoutes.ts` baris 30
- **Kondisi:** Endpoint laporan penjualan hanya dilindungi `authMiddleware`. Tidak ada `requireOwner`.
- **Target:** Laporan keuangan adalah hak eksklusif OWNER berdasarkan RBAC.md.
- **Risiko:** Karyawan dapat mengakses data laporan penjualan historis penuh bisnis.

### KONFLIK-005 — `GET /api/transactions/payment-summary` Tidak Ada RBAC Guard
- **File:** `server/src/routes/transactionRoutes.ts` baris 31
- **Kondisi:** Rekap pembayaran per metode hanya dilindungi `authMiddleware`.
- **Risiko:** Karyawan dapat melihat rekap pembayaran keuangan bisnis secara keseluruhan.

### KONFLIK-006 — `POST /api/expenses` Mengizinkan Semua User Tanpa Keputusan Final
- **File:** `server/src/routes/expenseRoutes.ts` baris 17
- **Kondisi:** Pencatatan pengeluaran diizinkan untuk semua user terautentikasi, padahal RBAC.md v0.4.0 menandai ini sebagai `[OPEN DECISION #2]` yang belum diputuskan.
- **Risiko:** Implementasi memilih keputusan secara diam-diam tanpa persetujuan Owner.

### KONFLIK-007 — Panel Pengujian RBAC Tampil di Produksi
- **File:** `client/src/App.tsx` baris 400–457
- **Kondisi:** Terdapat blok UI "Pengujian Keamanan RBAC" yang menampilkan tombol uji endpoint dan daftar pengguna. Blok ini tampil untuk semua user yang login, termasuk Karyawan.
- **Risiko:** Karyawan melihat informasi debug dan internal sistem yang seharusnya tidak tampil di UI produksi.

### KONFLIK-008 — Role `PENANGGUNG JAWAB` Tidak Ada di Sistem
- **File:** `server/src/types/domain.ts` baris 3, `client/src/types/index.ts` baris 3
- **Kondisi:** `UserRole` hanya memiliki `'OWNER' | 'KARYAWAN'`. Tidak ada entitas role `PENANGGUNG_JAWAB`.
- **Catatan:** Ini **bukan bug**, karena PJ adalah status shift bukan role akun. Namun perlu didokumentasikan agar tidak ada developer yang mencoba menambahkan `PENANGGUNG_JAWAB` sebagai role akun di database — yang akan bertentangan dengan RBAC.md v0.4.0.

### KONFLIK-009 — JWT Secret Di-hardcode di Source Code
- **File:** `server/src/middlewares/AuthMiddleware.ts` baris 4
- **Kondisi:** `const JWT_SECRET = process.env.JWT_SECRET || 'pos-kasir-super-secret-jwt-key-2026';`
- **Risiko KEAMANAN:** Jika environment variable tidak di-set, sistem menggunakan secret yang tercantum di source code. Secret ini dapat diketahui siapapun yang mengakses repository.

---

## 6. RISIKO KEAMANAN

| ID | Tingkat | Deskripsi | File Terdampak |
|---|---|---|---|
| RISK-001 | 🔴 KRITIS | Semua karyawan dapat mengubah stok secara manual | `stockRoutes.ts`, `StockController.ts` |
| RISK-002 | 🔴 KRITIS | JWT Secret di-hardcode di source code | `AuthMiddleware.ts` |
| RISK-003 | 🟠 TINGGI | Laporan keuangan historis dapat diakses seluruh karyawan | `reportRoutes.ts` |
| RISK-004 | 🟠 TINGGI | Pengembalian modal dapat dimanipulasi tanpa otorisasi PJ | `ShiftController.ts` |
| RISK-005 | 🟡 SEDANG | Rekap pembayaran bisnis dapat diakses seluruh karyawan | `transactionRoutes.ts` |
| RISK-006 | 🟡 SEDANG | Panel debug RBAC tampil di UI produksi untuk semua user | `App.tsx` |
| RISK-007 | 🟡 SEDANG | Semua karyawan dapat membuka shift baru tanpa pembatasan | `shiftRoutes.ts` |
| RISK-008 | 🟡 SEDANG | Pengeluaran diizinkan tanpa keputusan final dari Owner | `expenseRoutes.ts` |

---

## 7. MODUL YANG BELUM ADA DI IMPLEMENTASI SAAT INI

| Modul | Status | Keterangan |
|---|---|---|
| User Management CRUD (tambah/ubah/nonaktif user) | ❌ Belum ada endpoint | Hanya `GET /api/auth/users` yang ada |
| Manajemen Kategori UPDATE/DELETE | ❌ Belum ada endpoint | Hanya `GET` dan `POST` |
| Manajemen Produk UPDATE/DELETE | ❌ Belum ada endpoint | Hanya `GET` dan `POST` |
| Laporan per periode (harian/bulanan/tahunan) | ❌ Belum lengkap | Hanya `GET /api/reports/sales` |
| Pembatalan transaksi (Refund endpoint) | ❌ Belum ada | `[OPEN DECISION #1]` |
| Dashboard Kasir / Karyawan tersendiri | ❌ Belum ada | Semua user ke tab POS yang sama |
| Dashboard Penanggung Jawab tersendiri | ❌ Belum ada | Tidak ada halaman khusus PJ |
| Stock Log (histori pergerakan stok) | ❌ Belum ada endpoint | Tabel ada di skema, endpoint belum |
| Ekspor PDF Laporan | ❌ Belum ada | Fitur rencana Tahap 13 |

---

## 8. REKOMENDASI PERBAIKAN (TANPA MELAKUKAN PERUBAHAN)

> ⚠️ Rekomendasi berikut hanya bersifat dokumentasi. Tidak ada perubahan kode yang dilakukan.

1. **[RISK-001] Tambahkan `requireOwner` pada `POST /api/stocks/update`** agar penyesuaian stok manual hanya dapat dilakukan OWNER.

2. **[RISK-002] Hapus fallback JWT Secret dari source code.** Buat wajib menggunakan environment variable. Jika tidak di-set, server harus menolak start.

3. **[RISK-003] Tambahkan `requireOwner` pada `GET /api/reports/sales`** agar laporan keuangan hanya dapat diakses OWNER.

4. **[RISK-004] Tambahkan validasi PJ atau Owner pada `POST /api/shifts/return-capital`** di level route atau controller.

5. **[RISK-005] Tambahkan `requireOwner` pada `GET /api/transactions/payment-summary`** atau batasi berdasarkan shift aktif saja.

6. **[RISK-006] Pindahkan panel pengujian RBAC ke halaman terpisah** yang hanya dapat diakses OWNER, atau hapus dari UI produksi.

7. **[KONFLIK-006] Minta keputusan final Owner untuk OPEN DECISION #2** (pengeluaran oleh karyawan) sebelum implementasi dianggap sah.

8. **Tambahkan endpoint CRUD lengkap** untuk User Management, Produk, dan Kategori dengan middleware RBAC yang sesuai.

---

## 9. FILE KODE YANG AKAN TERDAMPAK SAAT IMPLEMENTASI

| File | Perubahan yang Diperlukan |
|---|---|
| `server/src/routes/stockRoutes.ts` | Tambah `requireOwner` pada `POST /update` |
| `server/src/routes/reportRoutes.ts` | Tambah `requireOwner` pada `GET /sales` |
| `server/src/routes/shiftRoutes.ts` | Tambah validasi role/status pada `POST /open`, `POST /close`, `POST /return-capital` |
| `server/src/routes/transactionRoutes.ts` | Tambah proteksi pada `GET /payment-summary` |
| `server/src/routes/expenseRoutes.ts` | Implementasikan keputusan OD#2 |
| `server/src/controllers/ShiftController.ts` | Tambah validasi PJ/Owner pada `returnCapitalContribution` |
| `server/src/middlewares/AuthMiddleware.ts` | Hapus fallback hardcoded JWT Secret |
| `server/src/utils/rbac.ts` | Tambah aksi `OPEN_SHIFT_LEADER_ONLY`, `CLOSE_SHIFT_LEADER_ONLY` |
| `client/src/App.tsx` | Pindahkan panel debug RBAC, sembunyikan tab Laporan/Payment dari Karyawan |
| `client/src/types/index.ts` | Tidak perlu diubah (sudah benar) |
| `server/src/types/domain.ts` | Tidak perlu diubah (sudah benar) |

---

## 10. OPEN DECISIONS (MENUNGGU KEPUTUSAN OWNER)

| ID | Topik | Dampak Implementasi |
|---|---|---|
| `[OD#1]` | Otorisasi Pembatalan Transaksi | Menentukan endpoint refund dan siapa yang bisa mengaksesnya |
| `[OD#2]` | Otorisasi Pencatatan Pengeluaran | Menentukan apakah `POST /api/expenses` perlu RBAC guard |
| `[OD#3]` | Pengembalian Modal saat Kas Kurang | Menentukan logika di `ShiftService.closeShift` |
