# CHANGELOG - Sistem POS Usaha Campuran (FC/Printing & FNB)

Seluruh perubahan penting, rilis versi, dan penambahan fitur dicatat secara kronologis dalam dokumen ini.

---

## [v1.0.0] - 2026-08-14 - Production Release Ready (Tahap 1 - 17 Complete)

### 🚀 Fitur Utama Diluncurkan
- **Manajemen Usaha Campuran (FC/Printing & FNB):**
  - Pemisahan kategori & bidang usaha secara terstruktur.
  - Dukungan item kombinasi **Barang Fisik** (dengan kelola stok) dan **Jasa** (tanpa stok, misal: Fotokopi, Print A4, Ketik, Desain).
- **Authentication & RBAC Security Engine:**
  - Login aman berbasis JWT.
  - Otorisasi hak akses berbasis Role (`OWNER` vs `KARYAWAN`).
- **Sistem Shift Kasir Multi-User & Modal Kas:**
  - Kemampuan Buka/Tutup Shift Kasir.
  - Pencatatan kontribusi kasir aktif dan akumulasi modal awal.
  - Perhitungan laci kas otomatis (`Net Cash Sales`, `Total Cash Expenses`, `Expected Cash in Drawer`).
- **Register Transaksi POS Kasir Rapid Checkout:**
  - Antarmuka POS responsif dan cepat untuk kasir toko yang ramai.
  - Keranjang belanja dinamis, penyesuaian quantity, dan diskon.
  - Validasi stok fisik real-time saat checkout.
  - Dukungan metode bayar: Cash (Tunai), QRIS, Transfer Bank.
- **Pencatatan Pengeluaran Kas (Expenses):**
  - Fitur catat pengeluaran kas toko terikat pada shift aktif.
  - Kategori pengeluaran: Bahan Baku, Operasional, ATK, Lain-lain.
- **Pengelolaan Stok Fisik & Alerting:**
  - Pemantauan stok barang fisik real-time.
  - Indikator visual status stok: AMAN (green), MENIPIS (yellow < 10), HABIS (red = 0).
  - Modal penyesuaian/restock stok fisik manual.
- **Executive Owner Dashboard & Analitik Business Intelligence:**
  - Metrik omzet harian, 7 hari terakhir, bulanan, dan estimasi keuntungan bersih.
  - Breakdown persentase omzet bidang usaha FC/Printing vs FNB.
  - Rekapitulasi akumulasi metode pembayaran (Cash, QRIS, Transfer).
  - Analisis produk terlaris (*Fast-Moving*) vs penjualan rendah (*Slow-Moving*).
- **Mesin Pelaporan Penjualan & Ekspor PDF Resmi:**
  - Laporan penjualan fleksibel dengan filter periode (harian, mingguan, bulanan, tahunan, kustom) dan kasir.
  - Ekspor PDF & Cetak Struk POS resmi menggunakan *Native CSS Print Styles*.
- **Pusat Backup dan Restore Data Snapshot:**
  - Pembuatan snapshot JSON data master & transaksi manual/otomatis.
  - Fitur pengunduhan langsung file cadangan ke perangkat owner.
  - Pemulihan data (Restore Snapshot) aman.
- **Audit Log System & Security Trail (Read-Only):**
  - Catatan log permanen aktivitas penting (auth, transaksi POS, shift, pergerakan stok, pengeluaran, backup/restore).
  - Diproteksi khusus untuk tampilan Owner.

---

### 🔧 Perbaikan & Quality Assurance
- Verifikasi kompilasi TypeScript pada backend Server (`npm run build` -> 0 Error).
- Verifikasi kompilasi TypeScript & Vite Bundling pada client Frontend (`npm run build` -> 0 Error).
- Pembersihan *unused imports* dan penyelarasan sintaks CSS React.
- Pemisahan arsitektur *Service-Repository Pattern* yang modular untuk kemudahan migrasi database di masa depan.
