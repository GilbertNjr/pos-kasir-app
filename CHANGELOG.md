# CHANGELOG - Sistem POS Usaha Campuran (FC/Printing & FNB)

Seluruh perubahan penting, rilis versi, dan penambahan fitur dicatat secara kronologis dalam dokumen ini.

## [v1.3.4] - 2026-08-19 - Soft-Red Delete Button & Clean Simple Confirmation Prompt

### 🎨 Tombol Hapus Transaksi & Modal Peringatan Simpel (`PaymentSummaryPage.tsx`)
- **Desain Tombol Hapus Ikonik Soft-Red (`.btn-action-delete`):**
  - Mengubah tombol hapus tabel transaksi menjadi tombol kotak melengkung berwarna merah lembut (*soft-red rounded badge*) dengan ikon tempat sampah (`Trash2`) persis sesuai referensi desain.
- **Modal Peringatan Hapus Super Clean & Simpel:**
  - Menggantikan modal konfirmasi lama yang rumit dengan dialog konfirmasi yang **clean, modern, dan langsung pada titiknya**:
    - Header judul tegas: **`Hapus Transaksi?`**
    - Subteks ringkas yang menampilkan nomor transaksi & nominal total.
    - 2 Tombol aksi simetris (`Batal` & `Ya, Hapus`).

### 🎨 Pembersihan Teks Header & Layout Tombol Aksi (`PaymentSummaryPage.tsx`)
- **Pembersihan Teks Subtitle:**
  - Menghapus teks subtitle panjang yang tidak diperlukan (`Pemantauan omzet real-time, audit status transaksi...`) agar kartu header tampil **super clean & modern**.
- **Tombol Aksi Single-Row Sejajar:**
  - Menata 3 tombol utama (`Export Excel`, `Cetak PDF`, dan `Perbarui`) agar tersusun sejajar rapi di sebelah kanan judul pada laptop/desktop.
  - Pada layar ponsel, ketiga tombol otomatis menyesuaikan diri dalam **1 baris grid 3-kolom** yang rapi & simetris.

### 🎨 Optimasi Layout Card Filter Periode Transaksi (`PaymentSummaryPage.tsx`)
- **Tampilan Single-Row Sleek (Laptop/Desktop/Tablet):**
  - Mengubah layout filter periode & metode pembayaran menjadi **1 baris card horizontal yang menyatu (*single-row flex*)**, menghilangkan ruang kosong (*empty space*) di sebelah kanan dropdown.
- **Tampilan Grid Adaptif di HP/Ponsel:**
  - Mengatur judul `Filter Periode:` berada di paling atas dengan garis pemisah yang bersih.
  - Mengatur dropdown **Periode Shift** dan **Metode Pembayaran** tersusun **side-by-side dalam grid 2-kolom** yang simetris di ponsel.
  - Jika tanggal custom dipilih, pemilih tanggal (`Mulai s/d Sampai`) langsung menyesuaikan diri secara otomatis.

### 🎨 Optimasi Layout & Responsivitas Filter Stok (`StockPage.tsx`)
- **Pembersihan Teks Option Dropdown:**
  - Mengubah teks opsi dropdown status dari `⚠️ Stok Menipis (<10)` menjadi `⚠️ Stok Menipis` agar teks **tidak terpotong** pada layar HP.
- **Grid Layout 3-Kolom Rapi pada Layar HP:**
  - Mengatur 3 dropdown filter (`Kategori`, `Status`, `Gudang`) agar tersusun sejajar rapi dalam 1 baris grid 3-kolom pada tampilan mobile (tanpa menyisakan 1 dropdown terpisah di bawah).
- **Penataan Ulang Tombol Aksi (Action Buttons):**
  - Menggabungkan tombol duplikat `Update Stok` & `Refresh` menjadi 1 tombol yang modern & responsif (`🔄 Refresh`).
  - Tombol **`+ Tambah Stok`** kini tampil menonjol (*full width*) di bagian paling atas grid tombol mobile agar mudah ditekan kasir/pegawai.
  - Menata tombol pendukung (`📄 Cetak PDF`, `📗 Export Excel`, dan `🧹 Reset`) dalam grid 2-kolom yang simetris dan rapi di semua perangkat (ponsel, tablet, laptop).
- **Persistensi Status Notifikasi (Read & Delete Persistence):**
  - Notifikasi yang telah **ditandai dibaca** atau **dihapus** kini tersimpan di `localStorage` (`pos_read_notifications`, `pos_deleted_notifications`).
  - Saat web apps di-refresh, notifikasi yang sudah dibaca/dihapus **TIDAK AKAN muncul kembali**, sehingga tidak membingungkan kasir/karyawan.
  - Badge angka merah (`9+`) hanya akan menyala jika ada **notifikasi/aktivitas baru** (seperti penambahan stok, transaksi baru, atau perubahan shift).
  - Menambahkan tombol hapus individu (`✕`) pada tiap baris notifikasi.
- **Anti-Flicker Badge Status Shift saat Refresh Page:**
  - Menyimpan status shift aktif ter-cache di `localStorage` (`pos_cached_active_shift`) sehingga saat halaman di-refresh, elemen header status (`ACTIVE` / `OFFLINE`) langsung muncul konsisten tanpa berkedip/hilang sejenak.
- **Pembersihan Teks & Ikon QRIS Modern pada Metode Pembayaran (`PosRegister.tsx`):**
  - Menghapus label teks pembantu (`HIJAU`, `BIRU`, `KUNING`) dari atas tombol pembayaran agar tampilan kasir terlihat lebih bersih dan profesional.
  - Mengganti ikon ponsel (`📱`) pada tombol QRIS dengan **Ikon QR Code resmi (`<QrCode />`)** dari Lucide Icons.
  - Mengganti emoji tunai dan transfer dengan ikon **`<Banknote />`** dan **`<Landmark />`** beresolusi tinggi dengan efek visual status yang responsif.
- **Kontrol Shift Manual Kasir (Non-Auto Shift):**
  - Shift tidak lagi otomatis aktif saat login.
  - Kasir wajib menekan **`[ 🚀 Buka Shift Baru Sekarang ]`** dan menginput **Uang Modal Kas Awal** sebelum bertransaksi.
  - Form & Quick Modal Buka Shift kini merekam **Hari, Tanggal, Jam, Kasir Pembuka (PJ)**, dan **Nominal Modal Awal** yang tersimpan permanen ke database Supabase untuk laporan harian/mingguan/bulanan.
  - Ditambahkan **Modal Quick Buka Shift** langsung di tab Kasir POS (`PosRegister.tsx`) untuk mempercepat alur kerja kasir.
- **Form Filter Laporan Responsif Kartu (2 Atas 2 Bawah di HP):**
  - Mengubah tampilan form filter laporan pada layar ponsel (`< 768px`) menjadi **Grid 2x2 (2 kontrol di atas, 2 kontrol di bawah)** untuk meminimalkan scroll vertikal.
  - Tombol **`Terapkan Filter`** secara otomatis diposisikan **di tengah (centered)** dengan desain *pill shape* yang sangat rapi dan modern di semua perangkat.
- **Penginputan & Penambahan Stok Bebas Shift (`StockPage.tsx`):**
  - Penambahan stok fisik, restok barang, dan koreksi inventaris dapat dilakukan kapan saja tanpa bergantung pada status shift aktif.
- **Desain Responsif Kartu Ponsel untuk Tabel Inventaris (`StockPage.tsx` & `ReportsPage.tsx`):**
  - Mengimplementasikan **Dual Display Engine (`mobile-only-stock-list` & `desktop-only-table`)**:
    - **Di HP / Mobile (< 768px)**: Tabel otomatis bertransformasi menjadi **Kartu Produk Vertikal (Mobile Card List)** yang rapi, ringkas, dan bebas dari *horizontal scrollbar*. Menampilkan nama produk, unit usaha, stok fisik, status badge (`Aman`, `Menipis`, `Habis`), lokasi, serta tombol aksi cepat (`Detail`, `Koreksi`, `Hapus`).
    - **Di Laptop / Desktop (≥ 768px)**: Menampilkan tabel multi-kolom yang luas dan presisi.
- **Tombol Hapus Transaksi & Modal Peringatan Operasional Bisnis (`PaymentSummaryPage.tsx`):**
  - Menambahkan kolom **`Aksi Hapus`** dan tombol **`[ 🗑️ Hapus ]`** pada setiap baris riwayat transaksi.
  - Dilengkapi dengan **Modal Peringatan Konfirmasi Merah (Business Warning Dialog)** yang menjelaskan dampak pembatalan (pengembalian stok ke inventaris, pengurangan omzet shift real-time, dan pencatatan audit log).
  - Integrasi langsung ke `apiService.cancelTransaction` dan pembaharuan status otomatis ke `CANCELLED` secara real-time.
- **Pencatatan & Filter Riwayat Berkelanjutan (Senin - Minggu, Tgl/Bln/Thn):**
  - Penambahan kontrol **Filter Periode Tanggal**: `Shift Aktif`, `Hari Ini`, `Minggu Ini (Senin-Minggu)`, `Bulan Ini`, `Rentang Tanggal Custom`, dan `Semua Riwayat Transaksi`.
  - Format waktu lengkap yang menampilkan nama hari (Senin - Minggu), tanggal, bulan, tahun, dan jam (misal: *Senin, 19/08/2026 14:20*).
- **Ekspor Excel & Cetak PDF Rekap Pembayaran Berdasarkan Periode:**
  - Menambahkan tombol **`📗 Export Excel`** dan **`🖨️ Cetak PDF`** yang dapat mengekspor rekap omzet beserta rincian transaksi sesuai tanggal/bulan yang dipilih.

---

## [v1.2.0] - 2026-08-19 - Shift & Stock Multi-Category Exporter (Format Otentik Gambar #2)

### 🚀 Fitur Cetak & Ekspor Laporan Shift & Stok Per Kategori (Format Gambar #2)
- **Modul Eksportir Stok Per Kategori (`stockReportExporter.ts`):**
  - **Multi-Worksheet Excel per Kategori:** Menghasilkan dokumen Excel dengan *Worksheet / Tab* terpisah di bagian bawah (`ICE CREAM`, `MINUMAN`, `JAJAN & GORENGAN`, `ATK & PRINTING`) persis seperti Gambar #2.
  - **Pengelompokan Sub-Merek / Sub-Kategori (Merek Header Row):** Pada tab *ICE CREAM*, item dikelompokkan secara mendatar di bawah header sub-merek `KUL KUL` (misal: *Fruit, Iglo, Lolipop, Rock, Tam-Tam, Surreal, Bingo*) dan `AICE` (misal: *Choco Malt, Fruit Roll, Juicy Apple, Miki-Miki, Taro, Mochi, Semangka, Sweet Corn*).
  - **Grid Log Pergerakan Stok & Rekapitulasi:** Menampilkan baris `STOK AWAL` di bagian atas, log shift harian per hari (Sabtu, Minggu, Senin, Selasa, Rabu, Kamis, Jumat), serta baris ringkasan `JML STOK LAKU` (Total Terjual) dan `SISA STOK FISIK SAAT INI` dengan warna highlight merah otentik di bagian bawah.
  - **Cetak PDF Laporan Stok Kategori (`printStockPDF`):** Pratinjau cetak PDF instan dengan pembagian per kategori produk dan indikator status fisik (*Aman*, *Menipis*, *Habis*).
- **Integrasi Switch Sub-Tab Halaman Laporan (`ReportsPage.tsx` & `StockPage.tsx`):**
  - Pada tab **`📄 Laporan Shift & Penjualan`**, tombol **Export Excel** dan **Cetak PDF** menghasilkan laporan shift otentik.
  - Pada tab **`📦 Laporan Stok & Restok`**, tombol **Export Excel** dan **Cetak PDF** secara otomatis menghasilkan dokumen Laporan Stok Multi-Worksheet Per Kategori.
  - Ditambahkan tombol **`📗 Export Excel Stok`** dan **`🖨️ Cetak PDF Stok`** langsung di toolbar Halaman Stok (`StockPage.tsx`).

---

## [v1.1.0] - 2026-08-19 - Maintenance Resilience & Quick Cashier FAB Engine

### 🚀 Fitur Ketahanan Maintenance & Anti-Downtime
- **Offline Queue Engine (`offlineQueue.ts`):**
  - Kasir tetap dapat memasukkan barang, memproses checkout, dan mencetak struk saat server sedang di-rebuild / di-restart / maintenance.
  - Setiap transaksi offline dilindungi oleh `idempotency_key` unik untuk mencegah duplikasi pesanan.
- **Otomatisasi Sinkronisasi (Auto-Sync Listener):**
  - Deteksi otomatis koneksi terhubung kembali (Online Event).
  - Melakukan upload otomatis (*background sync*) transaksi offline ke database PostgreSQL server tanpa intervensi manual.
- **Indikator Status Maintenance (`OfflineSyncBanner.tsx`):**
  - Tampilan banner transparan & elegan di header Kasir & Owner Layout.
  - Memberikan kepastian data aman (*100% Data Safe*) dan opsi tombol *Sync Sekarang*.
- **Tombol Kasir Cepat (FAB - Floating Action Button):**
  - Tombol melayang (*floating cart button*) di pojok kanan bawah layar ponsel & desktop dengan gradien ungu-biru presisi sesuai sampel desain.
  - Dilengkapi *badge* counter merah yang menghitung jumlah total item dalam keranjang secara real-time.
  - Sekali ketuk langsung melakukan *smooth scrolling* presisi ke panel Keranjang Order, menghilangkan kebutuhan *scroll* manual yang melelahkan ketika daftar produk sangat panjang.
- **Bar Filter Sub-Kategori Cepat (`PosRegister.tsx`):**
  - Bilah *pill buttons* sub-kategori di bawah filter utama (`Semua`, `FC / Print`, `F&B`).
  - Menyediakan filter cepat sub-kategori spesifik: `🍦 Es Krim`, `🥟 Gorengan`, `🍿 Snack`, `🥤 Minuman`, `🍱 DLL / Makanan Utama`, `✏️ ATK`, `📄 Fotokopi`, `🖨️ Printing`, `💼 Jasa & Desain`.
  - Mengurangi tampilan grid item yang panjang secara instan sehingga kasir dapat memilih produk spesifik tanpa perlu *scrolling* katalog yang melelahkan.
- **Pembaruan Desain & Responsivitas Toolbar Filter (`ExpensesPage.tsx` & `AuditLogPage.tsx`):**
  - Redesain bilah pencarian & dropdown filter menjadi layout grid simetris yang ultra-clean.
  - Penyeragaman tinggi elemen (*42px*), sudut melengkung (*10px*), warna border halus (`#cbd5e1`), dan panah dropdown SVG custom.
  - Pada layar smartphone/tablet, kontrol filter otomatis tersusun rapi dalam 2 kolom sejajar 50%-50%, menghilangkan kesan berantakan/penumpukan teks.
- **Audit Log Pergerakan Stok Real-time (`StockController.ts`, `ProductController.ts`, `TransactionService.ts`, `StockPage.tsx`):**
  - **Pencatatan Otomatis Real-time:** Setiap input/koreksi stok oleh pegawai (Restock, Tambah Stok, Koreksi Gudang/Etalase) secara otomatis mencatat entri ke tabel `audit_logs` dan `stock_movements`.
  - **Identifikasi Pegawai Transparan:** Mencatat nama pengguna/pegawai (`username`), nama produk, selisih kuantitas (`+10 Pcs`, `-2 Pcs`), serta rincian lokasi gudang/etalase secara presisi.
  - **Pembaruan UI Real-time tanpa Reload:** Sinkronisasi SSE (*Server-Sent Events*) `STOCK_UPDATED` dan `PRODUCT_UPDATED` secara otomatis memperbarui tabel "Pergerakan Stok Terbaru" di halaman Stok dan Log Audit secara instan tanpa perlu refresh halaman.
- **Koreksi Pengelompokan & Filter Produk Es Krim Kul-Kul (`StockPage.tsx` & `PosRegister.tsx`):**
  - **Perbaikan Deteksi Kategori:** Produk es krim bermerek `Kul-Kul` / `Kul Kul` / `Fruits Kul-Kul` yang sebelumnya salah terdeteksi ke kategori *Makanan & Snack* kini secara otomatis dan konsisten dikelompokkan ke kategori **Es Krim**.
  - **Dukungan Merek Es Krim Lengkap:** Filter sub-kategori `🍦 Es Krim` kini mendeteksi secara akurat semua varian es krim (`Kul-Kul`, `Aice`, `Walls`, `Joyday`, `Campina`, dll.).
  - **Kemudahan Pemantauan Stok:** Pegawai & Owner dapat memantau sisa stok es krim Kul-Kul dan Aice dengan mudah pada filter kategori Es Krim yang terpisah dari snack.

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
