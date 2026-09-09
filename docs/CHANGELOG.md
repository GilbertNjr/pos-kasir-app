# CHANGELOG - Dokumentasi POS Kasir

Dokumen ini mencatat seluruh riwayat perubahan, revisi dokumen, dan milestone pengembangan Sistem POS Usaha Campuran (FC/Printing & FNB).

## [1.8.7] - 10 September 2026

### Added & Enhanced
- **Sinkronisasi Real-Time Penuh Lintas Perangkat (Full Real-Time Synchronization & Bug Fixes)**:
  - **Backend SSE Event Emitters (`ExpenseController.ts` & `ShiftController.ts`)**:
    - Menambahkan penyiaran sinyal SSE `EXPENSE_CREATED` dan `EXPENSE_DELETED` pada `ExpenseController.ts`. Setiap pencatatan pengeluaran kas operasional (beli es, gas, ATK, dll.) langsung tersiar ke seluruh layar Owner dan Kasir lain tanpa jeda.
    - Menambahkan penyiaran sinyal SSE `CAPITAL_ADDED` pada `ShiftController.ts` saat kasir/owner melakukan setoran modal tambahan ke laci kas bersama.
  - **Perbaikan Bug Event Listener Frontend (`UsersPage.tsx` & `ShiftLeaderDashboardPage.tsx`)**:
    - Memperbaiki ketidaksesuaian nama event pada `UsersPage.tsx` dari `'SHIFT_STARTED'` menjadi `'SHIFT_OPENED'` serta mengintegrasikannya dengan `useRealtimeSubscription`. Kini status kehadiran kasir di halaman Kelola Pegawai Owner tersinkronisasi otomatis seketika saat shift dibuka.
    - Menghapus kode mati `sse.onmessage` dan koneksi terisolasi pada `ShiftLeaderDashboardPage.tsx`, menggantinya dengan hook langganan terpusat `useRealtimeSubscription` untuk `SHIFT_OPENED`, `SHIFT_CLOSED`, `TRANSACTION_CREATED`, `TRANSACTION_CANCELLED`, `USER_CREATED`, `USER_UPDATED`, `EXPENSE_CREATED`, `CAPITAL_ADDED`, dan `SYSTEM_WAKEUP`.
  - **Konversi Halaman Statis Menjadi Real-Time (`ExpensesPage.tsx`, `PaymentSummaryPage.tsx`, `ReportsPage.tsx`)**:
    - **Pengeluaran Kas (`ExpensesPage.tsx`)**: Terhubung ke `EXPENSE_CREATED`, `EXPENSE_DELETED`, `SHIFT_OPENED`, `SHIFT_CLOSED`, dan `SYSTEM_WAKEUP`. Tabel dan total pengeluaran kas auto-update langsung antar-perangkat tanpa perlu klik tombol Refresh atau F5.
    - **Rekap Pembayaran (`PaymentSummaryPage.tsx`)**: Terhubung ke `TRANSACTION_CREATED`, `TRANSACTION_CANCELLED`, `TRANSACTION_DELETED`, `TRANSACTION_RESTORED`, `SHIFT_OPENED`, `SHIFT_CLOSED`, dan `SYSTEM_WAKEUP`. Total setoran kas/QRIS dan riwayat transaksi kasir langsung bertambah/berkurang secara live.
    - **Laporan & Analitik (`ReportsPage.tsx`)**: Menerapkan pembaruan latar belakang cerdas saat periode yang aktif adalah "Hari Ini" (`DAILY`), menyinkronkan grafik omzet, performa kasir, tabel mutasi stok (`STOCKS_LOG`), dan riwayat sesi shift (`SHIFT_HISTORY`) seketika saat terjadi transaksi atau pengeluaran baru.
- **Bump Versi Aplikasi ke v1.8.7**:
  - Memperbarui versi proyek di `client/package.json` dan `server/package.json` ke `1.8.7`.

---

## [1.8.6] - 9 September 2026

### Fixed & Enhanced
- **Pembersihan Pemotongan Teks Nama Produk Lintas Perangkat (Omni-Device Typography & Layout Optimization)**:
  - **Widget Pergerakan Stok Terbaru (`StockPage.tsx` & `index.css`)**:
    - Mengubah tata letak mobile `.responsive-movement-2x2-grid` dari 2 kolom sempit (~140px) menjadi **1 kolom kartu horizontal (Timeline List Tile)** yang lapang (~320px–380px) di ponsel, dan 2 kolom adaptif di tablet.
    - Menghapus tabrakan horizontal antara nama produk dan badge jenis transaksi (`[Penjualan POS]` / `[Restock / Masuk]`).
    - Menghapus aturan kaku `whiteSpace: 'nowrap'` dan menambahkan `wordBreak: 'break-word'`, sehingga nama produk (`MIKAKO`, `SPIDOL SNOWMAN`, `Nota #TRX-...`, dll.) tampil **100% utuh tanpa pernah terpotong** menjadi `Not...`, `M...`, `SP...`, atau `W...`.
    - Merancang kartu informasi bertingkat yang rapi: Badge & Timestamp di baris atas, Judul Produk Utuh di tengah, Lokasi & Kasir di baris bawah, serta Pill Nominal Qty tebal di sisi kanan.
  - **Laporan Stok Mobile (`ReportsPage.tsx`)**:
    - Memperbarui kartu pergerakan stok di halaman Laporan agar nama produk dan badge stok tertata dalam format list tile responsif yang tidak terpotong.
  - **Area Kasir POS Register (`PosRegister.tsx`)**:
    - **Keranjang Belanja**: Menghapus `whiteSpace: 'nowrap'` pada item keranjang order kasir dan menggantinya dengan pembungkusan kata multi-baris (`wordBreak: 'break-word'`), sehingga nama produk panjang beserta detail varian/ukurannya tetap terbaca utuh oleh kasir di smartphone, tablet, maupun PC.
    - **Katalog Produk Kasir**: Menyesuaikan batas teks judul produk menjadi 3 baris dengan `wordBreak: 'break-word'` dan tooltip `title` agar tidak tertimpa oleh chip stok.
    - **Alert Stok Menipis Kasir**: Memungkinkan nama produk membungkus secara natural di dalam modal peringatan stok kasir.
- **Bump Versi Aplikasi ke v1.8.6**:
  - Memperbarui versi proyek di `client/package.json` dan `server/package.json` ke `1.8.6`.

---

## [1.8.5] - 9 September 2026

### Fixed & Enhanced
- **Sistem Paginasi Responsif & Adaptif Lintas Perangkat (`ResponsivePagination.tsx` & `index.css`)**:
  - **Mengatasi Masalah Tombol Paginasi Terpotong di Ponsel (Mobile Overflow)**:
    - Memperbaiki bug di halaman Stok (`StockPage.tsx`), Pengguna (`UsersPage.tsx`), dan Pencadangan Data (`BackupRestorePage.tsx`) di mana nomor halaman berjumlah besar (seperti 20 halaman dari 194 produk) dirender secara horizontal tanpa batas sehingga terpotong di layar smartphone.
  - **Komponen Paginasi Adaptif Bersih & Profesional (`ResponsivePagination.tsx`)**:
    - **Tampilan Desktop (≥ 641px)**: Menggunakan algoritma *Smart Windowing* (maksimal 7 tombol dengan elipsis `•••`), misalnya `[1] [2] [3] [4] [5] ••• [20]`, dengan sorotan warna dinamis, bayangan lembut, dan transisi mulus.
    - **Tampilan Mobile (≤ 640px)**: Mengadopsi navigasi sentuh ramah jari dengan tombol `[ < Sebelumnya ]`, selector dropdown cepat `Hal. [ X ] dari Y ▼`, dan `[ Selanjutnya > ]` dengan ukuran target sentuh 42px yang rapi, pas 100% di layar smartphone (320px–480px) tanpa ada elemen yang terpotong.
    - **Dukungan Dark Mode & Variabel CSS Penuh**: Tampilan terintegrasi harmonis dengan palet tema toko dan mode gelap POS.
- **Bump Versi Aplikasi ke v1.8.5**:
  - Memperbarui versi proyek di `client/package.json` dan `server/package.json` ke `1.8.5`.

---

## [1.8.4] - 9 September 2026

### Fixed & Enhanced
- **Pemulihan Integritas Nama Produk Historis pada Laporan Penjualan (`ReportService.ts` & `ReportsPage.tsx`)**:
  - **Mengurai Anomali Rank #4 "Produk" (63 pcs, Rp 125.000)**:
    - Menghapus fallback teks palsu `"Produk"` yang sebelumnya menimpa item transaksi milik produk yang telah dinonaktifkan (*soft-deleted*).
    - Menjalankan migrasi data aman untuk memperbarui `product_name_snapshot` pada 772 baris `transaction_items` dengan nama asli produk dari tabel `products`.
    - Menguraikan kembali 63 pcs penjualan di peringkat #4 menjadi nama aslinya secara akurat: **SOSTEL (34 pcs, Rp 68.000)**, **MIKAKO (22 pcs, Rp 22.000)**, **THAI TEA (4 pcs, Rp 32.000)**, **Diapet (2 pcs, Rp 2.000)**, dan **AMPLOP (1 pcs, Rp 1.000)**.
    - Menjamin **Total Omzet Toko 100% aman dan tidak berkurang satu rupiah pun**.
  - **Kueri Reporting Tanpa Bias Status Produk (`ProductRepository.ts` & `DashboardService.ts`)**:
    - Menambahkan method `findAllIncludingInactive()` agar modul analitik dan laporan penjualan dapat melacak seluruh katalog produk historis tanpa terpengaruh penghapusan produk baru.
  - **Penyimpanan Snapshot Transaksi Masa Depan (`TransactionService.ts` & `TransactionItemRepository.ts`)**:
    - Menghapus *hardcoded* string `'Produk POS'` pada saat penyimpanan transaksi baru, sehingga setiap nota penjualan selamanya menyimpan nama produk asli pada kolom `product_name_snapshot`.
- **Bump Versi Aplikasi ke v1.8.4**:
  - Memperbarui versi proyek di `client/package.json` dan `server/package.json` ke `1.8.4`.

---

## [1.8.3] - 9 September 2026

### Added & Enhanced
- **Arsitektur Real-Time Terpusat & Sinkronisasi Shift Multi-Perangkat Tanpa Refresh**:
  - **Penyelesaian Masalah Shift HP vs Laptop (`App.tsx` & `ShiftPage.tsx`)**:
    - Menghubungkan seluruh sistem dengan *listener* event `SHIFT_OPENED` dan `SHIFT_CLOSED`.
    - Ketika shift dibuka dari HP, tampilan Laptop seketika beralih status dari `• NONAKTIF` menjadi `• AKTIF` secara instan (< 100ms) tanpa perlu menekan tombol refresh.
    - Ketika shift ditutup dari HP, tampilan Laptop seketika menutup sesi kasir dan menampilkan status `• NONAKTIF`.
    - `ShiftPage.tsx` otomatis bertransisi antara formulir pendaftaran shift dan *Dashboard Laci Kas Bersama* tanpa reload.
    - `CashierDashboardPage.tsx` otomatis memperbarui ringkasan penjualan dan sesi shift kasir saat ada transaksi atau perubahan status shift.
  - **Centralized Real-Time Event Hub (`realtimeService.ts`)**:
    - Menggantikan koneksi SSE ganda/terpisah di berbagai komponen dengan satu koneksi *singleton* yang efisien, hemat daya baterai smartphone, dan patuh terhadap batas koneksi HTTP browser.
    - Dilengkapi penanganan *Auto-Reconnect & Visibility-Awareness* (`visibilitychange` dan `focus`) sehingga saat layar ponsel menyala dari *sleep mode*, status shift dan kas langsung terverifikasi secara otomatis.
  - **Keep-Alive Heartbeat Ping di Backend (`sseManager.ts`)**:
    - Menambahkan pengiriman *heartbeat ping* berkala setiap 20 detik (`: ping\n\n`) dan penyematan header `X-Accel-Buffering: no` pada server untuk mencegah pemutusan koneksi sepihak oleh operator jaringan seluler maupun proxy Nginx/Cloudflare.
- **Bump Versi Aplikasi ke v1.8.3**:
  - Memperbarui versi pada `client/package.json` dan `server/package.json` ke `1.8.3`.

---

## [1.8.2] - 9 September 2026

### Enhanced & Fixed
- **Standarisasi Kalender Mingguan Normal pada Grafik Laporan (`ReportsPage.tsx`)**:
  - Mengubah sumbu X grafik tren omzet harian dari rolling 7-hari acak menjadi urutan kalender bisnis standar: **Sen, Sel, Rab, Kam, Jum, Sab, Min** (Senin s.d. Minggu).
  - Garis tren omzet "Minggu Ini" (biru solid) digambar secara proporsional hanya sampai hari berjalan saat ini (tidak menukik artifisial ke Rp 0 untuk hari yang belum dilalui).
  - Garis perbandingan "Minggu Lalu" (abu-abu putus-putus) menampilkan performa penuh 7 hari kalender minggu sebelumnya (Senin s.d. Minggu lalu) sebagai acuan pembanding performa week-over-week yang akurat.
  - Memperbaiki label keterangan tanggal pada legenda grafik: menampilkan rentang tanggal asli minggu berjalan vs minggu lalu (misal: `07/09/2026 - 13/09/2026` vs `31/08/2026 - 06/09/2026`), menghilangkan kebingungan di mana tanggal kemarin sempat tertulis sebagai "Minggu Lalu".
  - Memfilter transaksi berstatus `CANCELLED` agar tidak mengotori kalkulasi grafik omzet.
- **Bump Versi Aplikasi ke v1.8.2**:
  - Mengikuti aturan kepatuhan pelacakan versi proyek: memperbarui versi di `client/package.json` dan `server/package.json` ke `1.8.2`.

---

## [1.8.1] - 9 September 2026

### Added & Enhanced
- **Pemisahan Ketat Stok Gudang vs Etalase (`StockRepository.ts` & `StockService.ts`)**:
  - Transaksi kasir (`createTransaction`) dikunci secara atomik di database hanya boleh memotong `stock_etalase` dan `current_stock` (`WHERE product_id = $2 AND COALESCE(stock_etalase, 0) >= $1`).
  - Menghapus logika pemotongan otomatis ke stok gudang saat etalase habis, sehingga stok gudang tidak akan pernah berkurang tanpa pemindahan fisik oleh pegawai.
  - Endpoint baru `POST /api/stocks/transfer` untuk memindahkan stok secara resmi dari gudang ke etalase toko disertai pencatatan audit log `STOCK_TRANSFER`.
- **Sinkronisasi Stok Real-Time via Server-Sent Events (SSE) (`PosRegister.tsx` & `TransactionController.ts`)**:
  - Memancarkan event SSE `STOCK_UPDATED` setiap kali transaksi kasir berhasil, dibatalkan, atau stok dipindahkan.
  - `PosRegister.tsx` mendengarkan event SSE dan otomatis memperbarui sisa stok etalase seketika di semua kasir aktif tanpa perlu refresh halaman.
  - Kartu produk menampilkan badge informatif: `🏪 E: X` (Etalase) dan `🏭 G: Y` (Gudang).
  - Jika stok etalase habis (0 Pcs) namun di gudang ada barang, sistem menampilkan dialog peringatan informatif beserta tombol cepat pemindahan stok (*Quick Transfer*).
- **Pembersihan Fallback Hardcoded & Fitur Quick Transfer (`StockPage.tsx`)**:
  - Menghapus 5 baris kode fallback *hardcoded* `Math.min(..., 5)` dan `Math.max(..., 5)` yang sebelumnya memalsukan visualisasi stok menjadi 5 Pcs.
  - Menambahkan Modal dan Tombol *Quick Transfer* Gudang ke Etalase pada tampilan Card maupun Tabel Desktop di `StockPage.tsx`.
- **Perbaikan Audit Sisa Fisik Rak Saat Tutup Shift (`ShiftPage.tsx`)**:
  - Memperbaiki `handleOpenStockAuditModal` agar menggabungkan data produk dengan stok aktual dari tabel `stocks`, mencegah salah hitung stok sisa rak dan mencegah pembuatan transaksi duplikat otomatis saat shift ditutup.
- **Sinkronisasi Versi Otomatis & Terpusat (v1.8.1)**:
  - Mengintegrasikan seluruh tampilan antarmuka (`LoginPage`, `CashierLayout`, `OwnerHeader`, `OwnerSidebar`, `OwnerDashboardPage`) langsung ke modul `APP_VERSION` berbasis `package.json` sehingga setiap kenaikan versi di masa mendatang langsung ter-update secara otomatis tanpa hardcoding manual.
  - Bump versi proyek menjadi `v1.8.1` pada `client/package.json` dan `server/package.json`.

---

## [1.8.0] - 5 September 2026

### Added & Enhanced
- **Perbaikan Alokasi & Atomic SQL Stok Gudang vs Etalase (`StockRepository.ts`, `StockService.ts` & `StockPage.tsx`)**:
  - Mengimplementasikan `deductStockAtomic` langsung via ekspresi query SQL PostgreSQL (`GREATEST(0, stock_etalase - $qty)`) untuk proteksi *race-condition* penuh saat toko ramai.
  - Menghapus rumus perkalian rasio otomatis (`etalaseRatio`) yang menyebabkan stok berpindah sendiri dari Gudang ke Etalase (atau sebaliknya) saat restock dari stok kosong 0 Pcs.
  - Memastikan pengurangan dan pengembalian stok akibat transaksi kasir dilakukan secara pasti (Etalase dahulu, kemudian Gudang) tanpa merusak nilai riil lokasi penyimpanan.
  - Memperbarui dialog penyesuaian stok di frontend agar membaca nilai asli `stock_gudang` dan `stock_etalase` tanpa fallback tebakan.
- **Perlindungan Soft-Delete Produk Hapus Aman (`ProductService.ts` & `TransactionItemRepository.ts`)**:
  - Mengimplementasikan `hasTransactions` untuk mendeteksi apakah produk pernah bertransaksi di masa lalu.
  - Jika produk pernah bertransaksi, penghapusan otomatis dialihkan menjadi **Soft-Delete (`is_active = false`)** agar riwayat omzet historis tidak rusak.
- **Audit Log Khusus Pembatalan Nota Kritis (*Void High-Value Alert*) (`TransactionService.ts`)**:
  - Menambahkan pencatatan `TRANSACTION_VOID_HIGH_VALUE` pada Audit Log jika terjadi pembatalan nota bernilai tinggi (≥ Rp 100.000) untuk deteksi kecurangan kasir.
- **Optimasi Google Sheets Sync Service (`GoogleSheetsSyncService.ts`)**:
  - Mengimplementasikan `batchUpdate` untuk mengelompokkan sinkronisasi 8 tab ke dalam 1 HTTP request (efisiensi kuota 87.5%).
  - Menambahkan *Exponential Backoff Retry Engine* untuk menangani error rate-limit API `HTTP 429`.
- **Pembaruan Versi Terpusat (v1.8.0)**:
  - Synchronized seluruh versi aplikasi di `LoginPage`, `OwnerSidebar`, `OwnerHeader`, `CashierLayout`, serta file konfig `client/package.json` & `server/package.json`.

---

## [1.7.9] - 4 September 2026
- **Akurasi & Integritas Laporan Omzet Periode Bulanan & Kasir (`ReportService.ts` & `timezoneUtils.ts`)**:
  - Mengimplementasikan *Flexible User Resolver* di backend untuk mencocokkan `user_id`, `username`, dan `full_name` kasir secara otomatis saat penyaringan laporan individual.
  - Memperbarui `parseAsWIBDate` agar mampu membaca berbagai format timestamp tanggal tanpa kehilangan data omzet pada filter Bulanan, Mingguan, dan Tahunan.
- **Deteksi Tim Bertugas Shift Multi-Source (`ReportsPage.tsx`)**:
  - Menggabungkan data tim bertugas dari 4 sumber (*performance logs*, *transactions*, *shift history*, dan *current user*) agar nama seluruh kasir yang bertugas di shift tersebut selalu tercantum pada ekspor struk laporan offline.
- **Pembaruan Filter Kasir Laporan (`ReportsPage.tsx`)**:
  - Mengubah default filter Kasir / Pengguna saat pertama kali halaman laporan dibuka menjadi **Semua Kasir** (`selectedUser = ''`).
  - Menghapus akun dengan role **OWNER** dari daftar dropdown pilihan filter kasir karena Owner tidak melakukan transaksi operasional.
  - Memfilter dan menghapus akun **OWNER** dari baris tabel *Laporan Performa Penjualan & Pengeluaran Per Karyawan / Kasir*.
- **Pembaruan Versi Terpusat (v1.7.9)**:
  - Synchronized seluruh versi aplikasi di `LoginPage`, `OwnerSidebar`, `OwnerHeader`, `CashierLayout`, serta file konfig `client/package.json` & `server/package.json`.

---

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
