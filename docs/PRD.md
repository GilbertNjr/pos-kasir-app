# Product Requirement Document (PRD) - Draft

> **Status:** Draft (Tahap A - Menunggu Review & Persetujuan Pengguna)  
> **Versi:** 0.1.0  
> **Tanggal:** 14 Agustus 2026  

---

## 1. LATAR BELAKANG & MASALAH BISNIS

Proyek ini bertujuan untuk membangun sistem **Point of Sale (POS)** bagi toko usaha campuran yang mencakup dua bidang utama:
1. **FC / Printing / Jasa** (Fotokopi, Print, Scan, Laminasi, ATK, Jasa Ketik, Jasa Desain, dll.)
2. **F&B** (Snack, Minuman, Gorengan, Seblak, Es Krim, Makanan lainnya)

### Masalah Bisnis Saat Ini (Pencatatan Manual):
- **Risiko Transaksi Tidak Tercatat:** Transaksi tunai atau jasa berpotensi tidak tercatat saat toko dalam kondisi ramai.
- **Laporan Keuangan Tidak Lengkap & Sulit Dipantau:** Owner kesulitan mengetahui total omzet harian/bulanan secara pasti.
- **Akuntabilitas Karyawan Rendah:** Transaksi yang dilakukan oleh masing-masing karyawan sulit dilacak karena tidak ada pemisahan identitas pengguna.
- **Pengeluaran Operasional Tidak Terintegrasi:** Pengeluaran harian toko (misal: beli bahan F&B atau ATK) tidak tercatat rapi secara digital.
- **Kontrol Stok Terbatas:** Stok barang jualan (seperti snack, pulpen, es krim) tidak terpantau secara konsisten.
- **Keterbatasan Pemantauan Jarak Jauh:** Owner tidak dapat memantau operasional dan omzet secara langsung saat berada di luar toko.

---

## 2. TUJUAN UTAMA SISTEM

Sistem POS ini dirancang untuk:
1. **Digitalisasi Transaksi:** Mencatat seluruh transaksi Penjualan & Jasa secara digital dan akurat.
2. **Pencatatan Berbasis Pengguna (User Accountability):** Memastikan setiap transaksi dan pengeluaran terkait secara pasti dengan pengguna (karyawan/owner) yang melakukannya.
3. **Dukungan Multi-Karyawan & Shift Dinamis:** Mendukung sistem shift dengan jumlah karyawan yang fleksibel per shift tanpa batasan kaku.
4. **Pemisahan Hak Akses (RBAC):** Membedakan wewenang penuh Owner dan wewenang terbatas Karyawan.
5. **Pemantauan Jarak Jauh (Remote Owner Monitoring):** Memungkinkan Owner memantau aktivitas penjualan dan laporan usaha secara realtime atau mendekati realtime melalui internet.
6. **Laporan & Dashboard Komprehensif:** Menyediakan ringkasan omzet, pengeluaran, tren produk terlaris/slow-moving, serta performa per karyawan dan per bidang usaha.
7. **Pengelolaan Stok Sederhana:** Mendukung pelacakan stok opsional (Kelola Stok = Ya / Tidak) untuk produk fisik.
8. **Keamanan & Keandalan Data:** Menyediakan audit log aktivitas penting serta fasilitas backup dan restore data secara aman.

---

## 3. PENGGUNA SISTEM (USER PERSONA)

Sistem menggunakan konsep **pengguna dinamis** (setiap individu memiliki akun tersendiri, bukan akun bersama seperti "Kasir 1" / "Kasir 2").

### 3.1 Owner (Pemilik Usaha)
- Memiliki hak akses penuh terhadap seluruh data dan fitur sistem.
- Beroperasi di toko maupun dari lokasi luar toko (remote via browser/koneksi internet).
- **Kebutuhan Utama:**
  - Melihat dashboard penjualan & pengeluaran secara realtime/berkala.
  - Memantau performa penjualan berdasarkan karyawan, shift, dan bidang usaha (FC vs FNB).
  - Mengelola data master (produk, harga, kategori, akun pengguna).
  - Mengakses laporan lengkap (harian, mingguan, bulanan, tahunan, periode custom).
  - Mengunduh/mencetak laporan ke format PDF.
  - Mengakses Audit Log aktivitas sistem.
  - Mengelola Backup dan Restore data.

### 3.2 Karyawan (Kasir / Operator Toko)
- Memiliki akses terbatas hanya pada fungsi operasional harian kasir.
- **Kebutuhan Utama:**
  - Login dengan akun pribadi.
  - Membuka shift (Open Shift) saat mulai bekerja.
  - Melakukan transaksi kasir dengan antarmuka yang cepat dan sederhana (cocok untuk toko ramai).
  - Mencatat transaksi gabungan Produk (FNB/ATK) dan Jasa (FC/Print/Scan/Ketik).
  - Menerima pembayaran (pencatatan metode pembayaran).
  - Mencatat pengeluaran harian toko yang diizinkan selama shift aktif.
  - Memeriksa ringkasan transaksi miliknya pada shift berjalan.
  - Menutup shift (Close Shift) di akhir jam kerja.

---

## 4. RUANG LINGKUP NATIVE BISNIS

### 4.1 Bidang FC / Printing / Jasa (`FC_PRINT`)
- **Produk Fisik (Kelola Stok = Ya):** ATK (Pulpen, Buku, Penggaris, Map, dll.).
- **Jasa (Kelola Stok = Tidak):** Fotokopi, Print Dokumen, Scan, Laminasi, Jasa Ketik, Jasa Desain, Binding/Jilid, dan jasa sejenis.

### 4.2 Bidang F&B (`FNB`)
- **Produk Fisik (Kelola Stok = Ya):** Snack kemasan, Minuman botol/kemasan, Es Krim.
- **Produk Olahan / Makanan (Kelola Stok = Tidak atau Ya sesuai kebutuhan):** Seblak, Gorengan, Es Teh buatan toko, Makanan siap saji.

---

## 5. FITUR UTAMA & KEBUTUHAN SISTEM

### 5.1 Kebutuhan Transaksi & Kasir (POS Interface)
1. **Kecepatan Operasional:** Kasir dapat menyelesaikan transaksi dalam sedikit langkah tanpa navigasi bertingkat yang rumit.
2. **Pencarian Produk & Jasa:** Fitur pencarian cepat berdasarkan nama atau filter kategori instan.
3. **Tombol Produk Cepat (Quick Access Buttons):** Akses langsung untuk item yang sering dibeli (misal: Fotokopi A4, Print B/W, Es Teh, Gorengan).
4. **Keranjang Belanja Interaktif:** Penambahan, perubahan jumlah (qty), penghapusan item keranjang dengan kalkulasi otomatis subtotal dan total.
5. **Dukungan Diskon Transaksi (Opsional per Transaksi):** Input nilai diskon jika diberikan.
6. **Metode Pembayaran:** Pencatatan jenis pembayaran (Tunai, Transfer, QRIS Manual).
7. **Pemberian Kembalian:** Kalkulasi otomatis uang diterima dan nominal kembalian.
8. **Status Transaksi:**
   - `SELESAI`: Transaksi berhasil dan final.
   - `DIBATALKAN`: Transaksi dibatalkan (membuat catatan alasan pembatalan & riwayat audit).

### 5.2 Kebutuhan Pengelolaan Shift (Shift System)
1. **Buka Shift (Open Shift):** Karyawan mencatat modal awal kasir (jika ada) dan memulai sesi shift.
2. **Multi-User per Shift:** Satu shift dapat diisi oleh lebih dari satu karyawan yang aktif bersamaan.
3. **Transparansi Transaksi Shift:** Setiap transaksi mencatat `User ID`, `Shift ID`, dan `Waktu Transaksi`.
4. **Tutup Shift (Close Shift):** Menutup sesi shift, menampilkan ringkasan total penjualan tunai & non-tunai, total pengeluaran, dan selisih modal kasir.

### 5.3 Kebutuhan Pengelolaan Produk, Kategori & Stok
1. **Manajemen Kategori Dinamis:** Pengelompokan kategori yang fleksibel di bawah bidang usaha `FC_PRINT` dan `FNB`.
2. **Manajemen Produk & Jasa:** Pengisian nama item, bidang usaha, kategori, harga jual, dan status aktif/non-aktif.
3. **Pengaturan Kelola Stok (Ya / Tidak):**
   - Jika `Kelola Stok = Ya`: Transaksi `SELESAI` mengurangi jumlah stok. Jika transaksi `DIBATALKAN`, stok dikembalikan.
   - Jika `Kelola Stok = Tidak`: Transaksi tidak mempengaruhi angka stok.

### 5.4 Kebutuhan Pencatatan Pengeluaran (Expense Tracking)
1. **Pencatatan Pengeluaran Operasional:** Form input pengeluaran toko terpisah dari transaksi jualan (misal: Beli Minyak, Beli Es Batu, Beli Kertas HVS, Beli Gas).
2. **Metadana Pengeluaran:** Mencatat `ID Pengeluaran`, `User ID`, `Shift ID`, `Kategori Pengeluaran`, `Keterangan`, `Nominal`, dan `Waktu`.

### 5.5 Kebutuhan Dashboard Owner (Owner Analytics)
1. **Ringkasan Ringkas Penjualan:**
   - Total Omzet Hari Ini, Minggu Ini, Bulan Ini, dan Tahun Ini.
   - Total Jumlah Transaksi.
   - Total Pengeluaran Operasional.
   - Total Penjualan per Metode Pembayaran (Tunai vs Non-Tunai).
2. **Grafik Tren Penjualan:** Visualisasi perkembangan omzet (Harian, Mingguan, Bulanan, Tahunan).
3. **Analisis Produk Terlaris (Top Selling):** Daftar produk teratas berdasarkan Qty terjual dan nominal omzet.
4. **Analisis Produk Penjualan Rendah (Slow-Moving):** Identifikasi produk dengan tingkat penjualan rendah untuk membantu evaluasi stok.
5. **Indikator Perputaran Produk (Inventory Turnover):** Informasi perbandingan stok tersisa dan rata-rata tingkat penjualan produk.

### 5.6 Kebutuhan Laporan & Ekspor (Reporting & PDF)
1. **Filter Laporan Komprehensif:** Filter berdasarkan rentang tanggal (Harian, Mingguan, Bulanan, Tahunan, Custom Period), Karyawan, Shift, Bidang Usaha (`FC_PRINT` vs `FNB`), dan Kategori.
2. **Laporan Performa Karyawan:** Menghitung jumlah transaksi, total omzet, dan pengeluaran yang dicatat oleh masing-masing pengguna.
3. **Ekspor & Cetak PDF:** Pencetakan langsung atau ekspor laporan bisnis ke format PDF.

### 5.7 Kebutuhan Keamanan & Audit Log
1. **Otentikasi Akun:** Setiap pengguna login menggunakan akun dan kredensial masing-masing.
2. **Otorisasi Berbasis Role:** Karyawan biasa dihalangi dari fitur administratif (mengubah user, menghapus transaksi, melihat audit log, restore database).
3. **Audit Log Aktivitas Penting:** Pencatatan otomatis untuk kejadian penting:
   - Login / Logout
   - Penambahan / Perubahan Produk & Harga
   - Pembukaan / Penutupan Shift
   - Pembuatan Transaksi / Pembatalan Transaksi
   - Pencatatan Pengeluaran
   - Aktivitas Backup & Restore
4. **Keterangan Log:** Mencatat `User ID`, `Jenis Aksi`, `Entitas Terpengaruh`, `ID Data`, dan `Waktu`.

### 5.8 Kebutuhan Backup & Restore Data
1. **Fasilitas Backup:** Kemampuan mengambil snapshot seluruh data toko (Produk, Shift, Transaksi, Pengeluaran, Audit Log) secara berkala/otomatis dan manual.
2. **Fasilitas Restore:** Kemampuan memulihkan data dari berkas backup yang sah (hanya diizinkan untuk Role Owner).

---

## 6. BATASAN SISTEM (SYSTEM BOUNDARIES & CONSTRAINTS)

Untuk menjaga kesederhanaan, kecepatan, dan fokus operasional toko, sistem ini secara tegas **MEMBATASI** dan **TIDAK TERMASUK** fitur-fitur berikut pada versi ini:

1. **Tanpa Fitur Pajak PPN Wajib:** Sistem tidak menghitung pemotongan Pajak Pertambahan Nilai (PPN) secara otomatis pada keranjang kasir.
2. **Tanpa Perhitungan HPP / Profit Margin Wajib:** Sistem berfokus pada pencatatan Omzet dan Pengeluaran. Perhitungan modal (HPP) dan margin keuntungan bersih tidak dijadikan syarat wajib transaksi.
3. **Tanpa Fitur Offline-First / PWA Cache:** Sistem memerlukan koneksi internet aktif untuk berkomunikasi dengan backend/penyimpanan data.
4. **Tanpa Integrasi Hardware Printer Thermal Khusus:** Pencetakan dilakukan menggunakan fitur cetak standar Web Browser.
5. **Tanpa Integrasi Payment Gateway / QRIS Otomatis:** Pembayaran QRIS / Transfer dicatat secara manual oleh kasir setelah memverifikasi penerimaan pembayaran.
6. **Data Transaksi Tidak Boleh Dihapus Permanen:** Transaksi yang salah/batal tidak dapat di-_delete_ dari database, melainkan diubah statusnya menjadi `DIBATALKAN`.

---

## 7. NEXT STEPS (ALUR TAHAPAN BERIKUTNYA)

Setelah dokumen `PRD.md` ini ditinjau dan disetujui oleh Owner/Developer, langkah selanjutnya adalah:
- **TAHAP B:** Menyusun `docs/BUSINESS-RULES.md` untuk mendefinisikan seluruh aturan operasional dan logika bisnis secara rinci.
