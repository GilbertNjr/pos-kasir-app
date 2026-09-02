# CHANGELOG - Dokumentasi POS Kasir

Dokumen ini mencatat seluruh riwayat perubahan, revisi dokumen, dan milestone pengembangan Sistem POS Usaha Campuran (FC/Printing & FNB).

## [1.7.8] - 3 September 2026

### Added & Enhanced
- **Default Filter "Semua Riwayat" di Dashboard Utama Owner**:
  - Mengubah default inisialisasi filter periode waktu pada `OwnerDashboardPage` & `useDashboard` dari `Hari Ini` (`DAILY`) menjadi `Semua Riwayat` (`ALL`).
  - Menempatkan pill tombol `Semua Riwayat` di posisi #1 pada `PeriodFilterBar.tsx` agar pengguna dapat langsung melihat total akumulasi omzet keseluruhan toko saat pertama kali masuk.
- **Peningkatan Responsivitas Mobile Modal & Tabel**:
  - Mengoptimalkan `TransactionDetailModal` dengan touch horizontal scroll (`overflowX: auto`, `-webkit-overflow-scrolling: touch`) dan min-width kolom agar subtotal nota tidak terpotong di HP.
  - Memperbaiki tabel pada Modal Top Products & Slow Moving di `OwnerDashboardPage` sehingga seluruh kolom status perputaran dan omzet dapat digeser dengan mulus pada layar smartphone.
- **Pembersihan Banner Peringatan Operasional Toko**:
  - Menyembunyikan banner peringatan selisih kas pada dashboard utama agar tampilan antarmuka awal owner lebih bersih, ringkas, dan fokus pada angka kinerja toko.
- **Pembaruan Versi Terpusat (v1.7.8)**:
  - Synchronized seluruh versi aplikasi di `LoginPage`, `OwnerSidebar`, `OwnerHeader`, `CashierLayout`, serta file konfig `client/package.json` & `server/package.json`.

---

## [1.7.7] - 3 September 2026

### Added & Enhanced
- **Peringatan & Validasi Order Tertahan (Draft) Saat Tutup Shift (`ShiftPage.tsx`)**:
  - Menambahkan pendeteksian otomatis *Draft Order* yang masih tertahan saat kasir membuka modal Tutup Shift.
  - Menampilkan **Banner Peringatan Amber (Warning Card)** yang merinci daftar nama pelanggan dan nominal order draft yang belum diselesaikan.
  - Memasang **Checkbox Konfirmasi Kesadaran Kasir** (`Saya paham & bersedia tutup shift meski ada draft tertahan`) yang memblokir tombol *"🛑 Ya, Tutup Shift Resmi"* jika belum dicentang.
- **Pembaruan Versi Terpusat (v1.7.7)**:
  - Synchronized seluruh versi aplikasi di `LoginPage`, `OwnerSidebar`, `OwnerHeader`, `CashierLayout`, serta file konfig `client/package.json` & `server/package.json`.

---

## [1.7.6] - 3 September 2026

### Added & Enhanced
- **Standardized Server Request Loading Indicators across Modals**:
  - **Tahan Order & Draft (`PosRegister.tsx`)**: Mengganti teks status dengan `⏳ Memproses Permintaan Server...` saat menahan keranjang atau memuat kembali draft order.
  - **Tutup Shift Modal (`ShiftPage.tsx`)**: Mengganti teks status tombol dengan `⏳ Memproses Permintaan Server...` serta mengunci tombol `Batal` saat rekonsiliasi shift dikirim ke backend.
- **Pembaruan Versi Terpusat (v1.7.6)**:
  - Synchronized seluruh versi aplikasi di `LoginPage`, `OwnerSidebar`, `OwnerHeader`, `CashierLayout`, serta file konfig `client/package.json` & `server/package.json`.

---

## [1.7.5] - 3 September 2026

### Added & Enhanced
- **Visual Server Request Loading Bar Modal (`PaymentSummaryPage.tsx`)**:
  - Mengganti pesan generik `"Memproses..."` saat menghapus / membatalkan / mengembalikan transaksi dengan indikator transparan **`⏳ Memproses Permintaan Server...`** lengkap dengan ikon animasi `Loader2`.
  - Mengunci seluruh tombol aksi modal (`Batal` dan tombol aksi utama) secara otomatis saat proses ke server backend sedang berlangsung untuk mencegah *double request*.
- **Pembaruan Versi Terpusat (v1.7.5)**:
  - Synchronized seluruh badge versi aplikasi di `LoginPage`, `OwnerSidebar`, `OwnerHeader`, `CashierLayout`, serta file konfig `client/package.json` & `server/package.json`.

---

## [1.7.4] - 3 September 2026

### Added & Enhanced
- **Optimasi Filter Default Rekap Pembayaran (`PaymentSummaryPage.tsx`)**:
  - Mengubah default periode filter saat modul *Rekap Pembayaran & Riwayat Transaksi* dibuka pertama kali menjadi **Semua Riwayat Transaksi (`ALL`)** untuk menyajikan gambaran omzet akumulasi keseluruhan toko.
  - Memindah opsi **Hari Ini (`TODAY`)** ke posisi opsi nomor 2 agar penyaringan omzet realtime hari ini tetap mudah diakses.
- **Pembaruan Versi Terpusat (v1.7.4)**:
  - Synchronized seluruh badge versi aplikasi di `LoginPage`, `OwnerSidebar`, `OwnerHeader`, `CashierLayout`, serta file konfig `client/package.json` & `server/package.json`.

---

## [1.7.3] - 2 September 2026

### Added & Enhanced
- **Visual Loading Indicators & UX Protection**:
  - Penambahan indikator loading visual (`spin-icon`) pada tombol **Close Shift** dan **Rekap Stok Sisa** untuk mencegah duplikasi penutupan shift saat respon lambat.
  - Penambahan indikator loading pada proses **Tahan Order (Draft)** dan **Muat Kembali (Restore)** di register POS untuk memberikan feedback transparan dan mencegah bentrok pengembalian stok.
  - Tombol tindakan ("Batal", "Tutup Shift", "Simpan di Draft", "Muat Kembali", "Hapus") kini dinonaktifkan (`disabled`) secara otomatis saat async operation sedang berjalan.
- **Pembaruan Versi Terpusat (v1.7.3)**:
  - Synchronized seluruh badge versi aplikasi di `LoginPage`, `OwnerSidebar`, `OwnerHeader`, `CashierLayout`, serta file konfig `client/package.json` & `server/package.json`.

---

## [1.0.0-blueprint] - 14 Agustus 2026

### Added (Tahap 1 - Blueprint & Perencanaan Sistem Completed)
- **`PRD.md`:** Menyusun dokumen persyaratan produk mencakup visi sistem, ruang lingkup FC/Printing & FNB, dan batasan MVP (tanpa PPN, tanpa HPP wajib, tanpa offline mode, tanpa integrasi QRIS otomatis/thermal printer).
- **`BUSINESS-RULES.md` (v0.5.0):** Menyusun aturan bisnis mutlak mencakup 2 Role Akun Permanen (`OWNER` & `KARYAWAN`), status Penanggung Jawab Shift dinamis, prinsip Shared Cash Drawer terikat `Shift ID`, serta mekanisme Kontribusi Modal Multi-User dan Pengembalian Modal Awal.
- **`RBAC.md` (v0.4.0):** Menyusun matriks hak akses dengan notasi permission eksplisit (`C`, `R`, `U`, `D`, `A`, `X`), constraint 1 Penanggung Jawab per Shift ID, pemisahan Stock Log vs Audit Log, dan rincian Open Decisions.
- **`ERD.md` (v0.2.0):** Menyusun Diagram Hubungan Entitas (Mermaid format) dan justifikasi bisnis spesifik untuk 12 entitas data, termasuk entitas `SHIFT_CAPITAL_CONTRIBUTIONS`.
- **`DATABASE.md` (v0.2.0):** Menyusun spesifikasi teknis 12 tabel, tipe data, kunci primer/asing, constraints integritas anti-hapus, dan pemetaan abstraksi Data Access Layer (DAL) dari Google Sheets ke PostgreSQL/Supabase.
- **`ARCHITECTURE.md`:** Menyusun rancangan arsitektur 3-tier (*Presentation, Service, Data Access Layer*), analisis benchmark stack teknologi (Vite + React, Express/Node.js, Google Sheets API), strategi migrasi database tanpa merusak kode UI, keamanan kredensial (env vars & bcrypt), serta alur backup & restore.
- **`BLUEPRINT-CHECKLIST.md`:** Menyusun dokumen verifikasi kelengkapan blueprint Tahap 1 sebelum melanjutkan ke Tahap 2 (Struktur Project).

---

### Changed / Revised
- **Revisi Konsep Kas Shift:** Memperbaiki model modal awal tunggal menjadi Kontribusi Modal Multi-User, di mana beberapa karyawan dapat menyetor modal awal yang dicampur ke laci kas bersama `Shift ID` dan dikembalikan setelah closing shift.
- **Notasi RBAC:** Mengubah notasi permission generik `V` (CRUD) menjadi notasi eksplisit `C/R/U/D/A/X`.

---

## [1.1.0-updates] - 21 Agustus 2026

### Added & Enhanced
- **Pembaruan Modul Backup & Restore Google Drive:**
  - Desain UI riwayat backup yang lebih bersih, modern, dan tidak membingungkan pengguna.
  - Fitur hapus file backup individual / duplikat disertai modal peringatan konfirmasi.
  - Integrasi token koneksi Google Drive yang aman dengan status verifikasi aktif.
- **Kelola Shift & Pencatatan Karyawan Telat / Jam Datang:**
  - Fitur edit nama dan jam kedatangan karyawan secara fleksibel pada shift aktif.
  - Mendukung pencatatan waktu datang yang berbeda bagi karyawan yang datang menyusul/terlambat atau bersamaan.
- **Pencatatan Setor Modal Fleksibel:**
  - Fleksibilitas penuh dalam pengisian nominal setor modal awal tanpa batasan perintah kaku.
- **Optimasi Struk Transaksi POS:**
  - Eliminasi horizontal scrolling pada struk fisik & modal detail transaksi dengan `table-layout: fixed` dan responsive wrapping.
  - Tampilan struk konsisten dan rapi saat diprint ke printer thermal 80mm/58mm.
- **Resolusi Identitas Kasir Transaksi:**
  - Pemetaan `created_by_user_id` ke Nama Lengkap Kasir pada Rekap Pembayaran, Ekspor Excel, Cetak PDF, dan Modal Detail.
- **Penyempurnaan Tampilan & Laporan:**
  - Penyederhanaan badge status shift menjadi `SHIFT AKTIF`.
  - Penambahan tombol hapus dan modal konfirmasi peringatan pada Laporan Performa Karyawan.
