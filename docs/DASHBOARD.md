# DASHBOARD OWNER SPECIFICATION

> **Status:** Final Approved Reference Document
> **Versi:** 1.0.0
> **Tanggal:** 15 Agustus 2026
> **Akses:** Role OWNER Only (HTTP 403 Forbidden untuk Role KARYAWAN)

---

## 1. TUJUAN & PRINSIP UTAMA

Dashboard Owner berfungsi sebagai pusat pemantauan operasional dan analisis bisnis bagi Pemilik Usaha ("POS Kasir Usaha Campuran" FC/Printing & FNB). 

### Prinsip Utama:
1. **Responsif Sepenuhnya:** Nyaman digunakan dari Handphone, Tablet, Laptop, hingga Desktop monitor tanpa horizontal overflow atau teks terpotong.
2. **Realtime / Near-Realtime:** Memperbarui data transaksi secara otomatis (polling interval 10-15 detik) tanpa memerlukan refresh halaman penuh browser.
3. **Akurasi Finansial 100%:** Semua angka berasal dari data transaksi aktual. Tidak menggunakan data dummy, nilai hardcoded, atau estimasi laba bersih palsu selama data HPP (`capital_price`) belum diisi di database.
4. **Filter Periode Terpadu (Unified Period Filter):** Perubahan periode filter (Hari Ini, Minggu Ini, Bulan Ini, Tahun Ini, Custom) berlaku serentak pada **SELURUH** widget di dashboard.
5. **Umpan Balik Notifikasi Interaktif:** Menampilkan status koneksi realtime (🟢/🔴) dan Toast Notification saat aksi pengguna berhasil atau error.

---

## 2. DESAIN RESPONSIF (RESPONSIVE LAYOUT MATRIX)

| Perangkat | Resolusi Layar | Karakteristik Grid Layout | Touch Target |
|---|---|---|---|
| **Desktop** | `>= 1024px` | Grid 12-kolom, Sidebar samping, 5 KPI Cards sejajar, Grafik & Breakdown 2 kolom. | Min 36px |
| **Tablet** | `768px - 1023px` | Grid adaptif 6-kolom, Sidebar collapsible, KPI Cards 3+2, Grafik 1 kolom penuh. | Min 40px |
| **Mobile** | `< 768px` | Layout 1-kolom bersusun vertikal, Drawer navigation, Touch-scroll horizontal pada tabel. | Min 44px |

---

## 3. SPESIFIKASI 11 WIDGET DASHBOARD

### Widget 1: Header Dashboard
- **Elemen:** Judul Toko, Identitas Owner, Indikator Status Sync (🟢 Terhubung / 🔴 Koneksi Terputus), Waktu Sync Terakhir, Tombol Refresh Manual.
- **Fungsi:** Menyajikan konteks status koneksi server.

### Widget 2: Pemilih Periode Global (Period Filter Bar)
- **Opsi:** `HARI_INI` (Today), `MINGGU_INI` (This Week), `BULAN_INI` (This Month), `TAHUN_INI` (This Year), `CUSTOM` (Tanggal Mulai - Tanggal Akhir).
- **Aturan:** Mengubah periode memicu *re-fetch* seluruh data widget secara bersamaan.

### Widget 3: Kartu Indikator Utama (KPI Metrics Cards)
1. **Total Omzet (Gross Sales):** Total nominal penjualan `COMPLETED` setelah diskon.
2. **Total Pengeluaran (Expenses):** Total pengeluaran kas toko dari tabel `expenses`.
3. **Jumlah Transaksi:** Total frekuensi transaksi `COMPLETED`.
4. **Qty Item Terjual:** Total jumlah produk & jasa yang keluar dari keranjang.
5. **Rata-rata Transaksi (AOV):** Total Omzet / Jumlah Transaksi.
- *Catatan Finansial:* Laba Bersih **ditutup / tidak ditampilkan** sampai atribut harga modal (`capital_price`) diimplementasikan di database.

### Widget 4: Peringatan Bisnis & Alerts Notice
- **Trigger Alert:**
  - Shift ditutup dengan `reconciliation_status = 'KURANG'` (Selisih Kas Minus).
  - Stok fisik produk (`manage_stock = true`) mencapai angka 0 atau di bawah minimum.

### Widget 5: Grafik Perkembangan Omzet (Revenue Performance Chart)
- **Visualisasi:** Interactive SVG/CSS Line & Bar Chart.
- **Grouping Dynamic:**
  - *Hari Ini:* Interval jam (00.00 - 23.00).
  - *Minggu Ini:* Interval hari (Senin - Minggu).
  - *Bulan Ini:* Interval tanggal (1 - 31).
  - *Tahun Ini:* Interval bulan (Januari - Desember).

### Widget 6: Penjualan per Bidang Usaha & Kategori
- **Visualisasi:** Visual progress bar & persentase.
- **Breakdown:** `FC_PRINT` (Fotokopi/Printing) vs `FNB` (Food & Beverage) dan ringkasan omzet per kategori.

### Widget 7: Produk Terlaris (Top Selling Products)
- **Metrik:** Ranking 5 item dengan Qty penjualan terbanyak.
- **Kolom:** Rank, Nama Item, Bidang Usaha, Qty Terjual, Total Omzet.

### Widget 8: Produk Penjualan Rendah (Slow-Moving Products)
- **Metrik:** Ranking 5 item dengan Qty penjualan terendah.
- **Filter Adil:** Hanya mengevaluasi produk yang sudah didaftarkan sebelum periode berjalan (tidak menganggap produk yang baru dibuat hari ini sebagai produk slow-moving).

### Widget 9: Aktivitas Pegawai & Status Shift
- **Metrik:** Menampilkan performa kasir (Jumlah Transaksi, Total Omzet, Kasir Aktif di Shift).
- **Interaksi:** Owner dapat membuka Modal Detail Performa Pegawai.

### Widget 10: Transaksi Terbaru (Live Feed)
- **Metrik:** 10 transaksi terakhir (`transaction_number`, waktu, kasir, total, status `COMPLETED`/`CANCELLED`).

### Widget 11: Business Insights Otomatis
- **Analisis AI/Algoritmik:** Menghasilkan rangkuman otomatis seperti jam paling ramai transaksi, rasio pembayaran Tunai vs Non-Tunai, dan dominasi bidang usaha.

---

## 4. KEAMANAN & AKSES (RBAC)

- Endpoint `/api/dashboard/metrics` dilindungi oleh middleware `authMiddleware` dan `requireOwner`.
- Pengguna dengan role `KARYAWAN` yang mencoba mengakses endpoint akan menerima HTTP `403 Forbidden` dan Toast Warning di frontend.
