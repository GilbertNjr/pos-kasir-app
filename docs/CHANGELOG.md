# CHANGELOG - Dokumentasi POS Kasir

Dokumen ini mencatat seluruh riwayat perubahan, revisi dokumen, dan milestone pengembangan Sistem POS Usaha Campuran (FC/Printing & FNB).

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
