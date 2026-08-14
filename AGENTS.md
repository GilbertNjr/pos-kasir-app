# AGENTS.md
# Panduan Utama AI Agent - Sistem POS

## 1. PERAN AI AGENT

Anda adalah AI Software Engineering Agent yang bertugas membantu
mengembangkan, memelihara, menguji, dan mendokumentasikan sistem POS
(Point of Sale) untuk usaha klien.

Tugas utama Anda:

- Memahami kebutuhan bisnis sebelum menulis kode.
- Mengikuti seluruh dokumentasi proyek.
- Mengembangkan sistem secara bertahap.
- Menjaga struktur kode tetap rapi dan mudah dipelihara.
- Tidak membuat keputusan bisnis penting secara sembarangan.
- Tidak mengubah arsitektur tanpa alasan yang jelas.
- Melakukan pengujian setelah perubahan.
- Menjaga data transaksi tetap aman.
- Membantu developer manusia dalam proses pengembangan.
- Menjelaskan perubahan yang dilakukan.

AI Agent BUKAN pemilik bisnis dan BUKAN pihak yang menentukan
keputusan bisnis.

Keputusan bisnis dan keputusan arsitektur penting tetap berada
pada developer/pemilik proyek.

---

# 2. KONTEKS PROYEK

Proyek ini adalah sistem POS (Point of Sale) untuk usaha campuran.

Jenis usaha meliputi:

## FC / Printing / Jasa

- Fotokopi
- Print
- Scan
- Laminasi
- ATK
- Jasa ketik
- Jasa desain
- Jasa lainnya yang berkaitan dengan FC/printing

## F&B

- Snack
- Minuman
- Gorengan
- Seblak
- Es krim
- Makanan lainnya

Sebelum sistem dibuat, sebagian transaksi masih dicatat secara
manual sehingga terdapat risiko:

- transaksi tidak tercatat
- laporan keuangan tidak lengkap
- omzet sulit dipantau
- transaksi karyawan sulit dilacak
- pengeluaran sulit dipantau
- stok sulit dikontrol
- owner tidak dapat memantau usaha secara langsung ketika berada
  di luar toko

Sistem POS dibuat untuk mengatasi permasalahan tersebut.

---

# 3. TUJUAN UTAMA SISTEM

Sistem harus mampu:

1. Mencatat setiap transaksi secara digital.
2. Mengetahui siapa pengguna yang melakukan transaksi.
3. Mendukung beberapa karyawan dalam satu shift.
4. Mendukung owner dan karyawan dengan hak akses berbeda.
5. Mendukung sistem shift.
6. Memungkinkan owner memantau usaha dari jarak jauh.
7. Menampilkan informasi penjualan secara realtime atau mendekati
   realtime sesuai kemampuan teknologi.
8. Menampilkan laporan harian.
9. Menampilkan laporan mingguan.
10. Menampilkan laporan bulanan.
11. Menampilkan laporan tahunan.
12. Menampilkan produk yang paling sering terjual.
13. Menampilkan produk dengan penjualan rendah.
14. Menampilkan informasi perputaran produk.
15. Mendukung pengelolaan stok sederhana.
16. Mencatat pengeluaran.
17. Menampilkan performa penjualan berdasarkan karyawan.
18. Menampilkan performa berdasarkan kategori atau bidang usaha.
19. Mendukung pencetakan atau ekspor laporan ke PDF.
20. Memiliki sistem backup data.
21. Memiliki sistem restore data.
22. Memiliki audit log untuk aktivitas penting.

---

# 4. PRINSIP UTAMA PENGEMBANGAN

## 4.1 Sederhana untuk Kasir

Usaha memiliki kondisi toko yang dapat ramai.

Oleh karena itu proses transaksi harus cepat.

Kasir tidak boleh melewati terlalu banyak halaman untuk melakukan
transaksi sederhana.

Prioritaskan:

- pencarian produk
- kategori
- tombol produk cepat
- keranjang
- jumlah
- total
- pembayaran
- selesai

---

## 4.2 Mudah Dipelihara

Sistem harus dirancang agar developer dapat melakukan maintenance
dengan mudah.

Hindari:

- kode yang terlalu kompleks
- file yang terlalu besar
- fungsi yang melakukan terlalu banyak tugas
- duplikasi kode
- data bisnis yang ditulis langsung di dalam kode
- dependensi yang tidak diperlukan

---

## 4.3 Jangan Hardcode Data Bisnis

Jangan menulis data seperti berikut langsung di kode:

- nama produk
- harga
- nama karyawan
- kategori
- nama toko
- nomor telepon
- alamat
- payment method
- konfigurasi bisnis

Data tersebut harus berasal dari sistem data.

Contoh yang TIDAK BOLEH:

    Jika produk = "Es Teh"
    maka harga = 3000

Harga harus berasal dari data produk.

---

# 5. SUMBER KEBENARAN PROYEK

Dokumentasi proyek akan menjadi sumber kebenaran utama.

Dokumen utama nantinya berada di:

    /docs/

Dokumen yang akan dibuat meliputi:

- PRD.md
- ARCHITECTURE.md
- ERD.md
- DATABASE.md
- RBAC.md
- BUSINESS-RULES.md
- USER-FLOW.md
- UI-UX.md
- DASHBOARD.md
- REPORTING.md
- BACKUP.md
- SECURITY.md
- TESTING.md
- DEPLOYMENT.md
- CHANGELOG.md

Jangan membuat keputusan yang bertentangan dengan dokumentasi.

Jika terdapat konflik antar dokumen:

1. Identifikasi konflik.
2. Jelaskan kepada developer.
3. Jangan memilih sendiri keputusan bisnis yang penting.
4. Tunggu keputusan manusia jika diperlukan.

---

# 6. ATURAN SEBELUM CODING

Sebelum membuat atau mengubah kode:

1. Baca AGENTS.md.
2. Baca dokumentasi yang berkaitan dengan pekerjaan.
3. Periksa struktur project yang sudah ada.
4. Periksa kode yang sudah ada.
5. Pastikan tidak ada fungsi yang sudah tersedia dan dapat digunakan
   kembali.
6. Tentukan file yang perlu diubah.
7. Jelaskan rencana perubahan.
8. Baru lakukan implementasi.

Jangan langsung membuat kode hanya berdasarkan asumsi.

---

# 7. PENGEMBANGAN SECARA BERTAHAP

Jangan membangun seluruh aplikasi dalam satu perintah besar.

Pengembangan dilakukan secara bertahap.

Urutan awal:

## Tahap 1
Perencanaan dan dokumentasi.

## Tahap 2
Struktur project.

## Tahap 3
Authentication.

## Tahap 4
Role dan hak akses.

## Tahap 5
Kategori dan produk.

## Tahap 6
Shift.

## Tahap 7
Transaksi POS.

## Tahap 8
Pembayaran.

## Tahap 9
Pengeluaran.

## Tahap 10
Stok.

## Tahap 11
Dashboard owner.

## Tahap 12
Laporan.

## Tahap 13
Ekspor PDF.

## Tahap 14
Backup dan restore.

## Tahap 15
Audit log.

## Tahap 16
Testing.

## Tahap 17
Deployment.

Setiap tahap harus diuji sebelum melanjutkan ke tahap berikutnya.

---

# 8. KONSEP USER

Sistem tidak boleh menggunakan konsep tetap seperti:

    Kasir 1
    Kasir 2

Karena jumlah karyawan dapat berubah.

Gunakan sistem pengguna dinamis.

Contoh:

- Owner
- Budi
- Siti
- Rina
- dan karyawan lainnya

Setiap pengguna memiliki akun sendiri.

Setiap transaksi harus dapat diketahui siapa yang melakukan transaksi.

---

# 9. ROLE OWNER

Owner memiliki hak akses penuh terhadap sistem.

Owner dapat:

- melihat dashboard
- melihat seluruh transaksi
- melihat transaksi berdasarkan karyawan
- melihat transaksi berdasarkan shift
- melihat laporan
- mengelola produk
- mengelola kategori
- mengelola harga
- mengelola stok
- mengelola pengguna
- melihat pengeluaran
- melakukan backup
- melakukan restore
- melihat audit log
- melihat seluruh aktivitas sistem
- melihat data FC/Printing
- melihat data F&B

Owner harus dapat memantau usaha dari lokasi lain selama sistem
dan koneksi internet tersedia.

---

# 10. ROLE KARYAWAN

Karyawan memiliki akses terbatas sesuai izin yang diberikan.

Minimal karyawan dapat:

- login
- membuka shift
- melakukan transaksi
- menerima pembayaran
- melihat produk yang diperbolehkan
- menutup shift
- melihat informasi transaksi miliknya sesuai izin

Karyawan tidak boleh:

- menghapus data transaksi secara permanen
- mengelola pengguna
- mengubah pengaturan sistem
- melakukan restore database
- mengakses informasi owner yang tidak diberikan
- menghapus audit log

Hak akses detail akan ditentukan dalam RBAC.md.

---

# 11. SISTEM SHIFT

Sistem harus mendukung jumlah pengguna yang fleksibel dalam satu shift.

Contoh:

Shift pagi:

- Budi
- Siti
- Rina

Shift siang:

- Budi
- Andi

Owner juga dapat menjadi kasir.

Jangan membuat batasan bahwa satu shift hanya boleh memiliki
dua kasir.

Setiap pengguna tetap menggunakan akun masing-masing.

Setiap transaksi harus memiliki hubungan dengan:

- pengguna
- shift
- waktu transaksi

Sistem harus mendukung:

- buka shift
- shift aktif
- transaksi selama shift
- tutup shift
- ringkasan shift

---

# 12. KONSEP PRODUK DAN JASA

Sistem harus mampu menangani dua jenis item:

## PRODUK

Contoh:

- Pulpen
- Buku
- Es Teh
- Seblak
- Gorengan
- Es Krim
- Snack

## JASA

Contoh:

- Fotokopi
- Print
- Scan
- Ketik
- Desain
- Laminasi

Produk dan jasa harus dapat dimasukkan ke dalam keranjang transaksi
yang sama.

---

# 13. KATEGORI DAN BIDANG USAHA

Kategori harus dapat dibuat secara dinamis.

Minimal terdapat bidang:

## FC_PRINT

Contoh kategori:

- ATK
- Fotokopi
- Printing
- Jasa

## FNB

Contoh kategori:

- Snack
- Minuman
- Makanan
- Gorengan
- Es Krim

Jangan menulis daftar kategori secara permanen di dalam kode.

Owner harus dapat menambahkan kategori baru melalui sistem jika
fitur tersebut telah diberikan.

---

# 14. SISTEM STOK

Tidak semua item wajib menggunakan stok.

Setiap item dapat memiliki pengaturan:

    Kelola Stok = Ya
atau
    Kelola Stok = Tidak

Contoh:

Kelola stok:

- Pulpen
- Snack
- Es Krim

Tidak perlu stok:

- Print A4
- Fotokopi
- Jasa ketik
- Jasa desain

Jika stok aktif:

Transaksi selesai
↓
Stok berkurang

Transaksi dibatalkan
↓
Stok harus dikembalikan jika sebelumnya sudah berkurang.

---

# 15. SISTEM TRANSAKSI

Setiap transaksi harus mempunyai:

- ID transaksi
- nomor transaksi
- pengguna
- shift
- detail item
- jumlah
- harga
- subtotal
- diskon jika tersedia
- total
- metode pembayaran
- waktu transaksi
- status transaksi

Transaksi yang sudah selesai tidak boleh dihapus secara permanen.

Jika transaksi dibatalkan:

gunakan status pembatalan dan simpan riwayatnya.

---

# 16. DASHBOARD OWNER

Dashboard owner harus membantu pengambilan keputusan bisnis.

Dashboard minimal menampilkan:

## Penjualan

- omzet hari ini
- omzet minggu ini
- omzet bulan ini
- omzet tahun ini
- jumlah transaksi
- total pengeluaran
- total pembayaran berdasarkan metode

## Grafik

Owner dapat melihat grafik:

- harian
- mingguan
- bulanan
- tahunan

## Produk Terlaris

Menampilkan:

- nama produk
- jumlah terjual
- omzet
- ranking

## Produk Penjualan Rendah

Menampilkan produk dengan penjualan rendah berdasarkan periode
yang dipilih.

Jangan menganggap produk baru sebagai produk tidak laku tanpa
memiliki data penjualan yang cukup.

## Perputaran Produk

Jika data stok tersedia, tampilkan:

- stok
- jumlah terjual
- rata-rata penjualan
- indikator perputaran

Tujuannya agar owner dapat mengetahui produk yang memiliki
perputaran cepat dan produk yang perputarannya lambat.

---

# 17. ANALISIS KEUNTUNGAN

Jika sistem memiliki data harga modal:

sistem dapat menghitung:

- harga modal
- harga jual
- keuntungan kotor
- margin

Jangan menyimpulkan bahwa produk paling banyak terjual adalah
produk paling menguntungkan.

Produk yang banyak terjual dan produk yang memberikan keuntungan
tinggi adalah dua indikator yang berbeda.

---

# 18. LAPORAN

Sistem harus mendukung:

- laporan harian
- laporan mingguan
- laporan bulanan
- laporan tahunan
- periode custom

Laporan dapat difilter berdasarkan:

- pengguna
- shift
- kategori
- bidang usaha
- metode pembayaran

Laporan dapat dicetak atau diekspor ke PDF.

---

# 19. LAPORAN KARYAWAN

Sistem harus dapat mengetahui performa masing-masing pengguna.

Contoh:

Budi:

- jumlah transaksi
- omzet
- metode pembayaran
- shift
- pengeluaran yang dicatat

Siti:

- jumlah transaksi
- omzet
- metode pembayaran
- shift
- pengeluaran yang dicatat

Jika terdapat banyak karyawan dalam satu shift, sistem harus tetap
dapat memisahkan transaksi masing-masing pengguna.

---

# 20. PENGELUARAN

Pengeluaran dicatat terpisah dari penjualan.

Contoh:

- membeli bahan makanan
- membeli minyak
- membeli gas
- membeli ATK
- kebutuhan operasional lainnya

Setiap pengeluaran harus memiliki:

- ID
- pengguna yang mencatat
- shift
- kategori
- keterangan
- nominal
- waktu

---

# 21. AUDIT LOG

Aktivitas penting harus dicatat.

Contoh:

- login
- logout
- membuat produk
- mengubah produk
- mengubah harga
- membuat transaksi
- membatalkan transaksi
- membuka shift
- menutup shift
- membuat pengeluaran
- membuat user
- backup
- restore

Audit log harus mencatat:

- pengguna
- tindakan
- data yang terpengaruh
- ID data
- waktu

Audit log tidak boleh dihapus oleh karyawan biasa.

---

# 22. BACKUP

Pada tahap awal sistem dapat menggunakan Google Sheets sebagai
penyimpanan data sementara.

Google Sheets bukan alasan untuk membangun sistem secara sembarangan.

Arsitektur harus memungkinkan migrasi ke database relasional seperti
PostgreSQL atau Supabase pada masa depan.

Backup harus menggunakan Google Drive atau media backup yang
disepakati.

Minimal terdapat:

- backup otomatis
- backup manual
- riwayat backup
- restore

Sebelum perubahan besar terhadap struktur data:

    Backup
    ↓
    Perubahan
    ↓
    Pengujian
    ↓
    Verifikasi

Jangan melakukan perubahan destruktif tanpa backup.

---

# 23. KEAMANAN

Credential dan secret tidak boleh ditaruh di frontend.

Jangan menaruh:

- API key
- credential Google
- service account
- password
- secret key

di source code yang dapat diakses pengguna.

Gunakan environment variable.

Password tidak boleh disimpan dalam bentuk teks biasa.

Hak akses harus diverifikasi di backend, bukan hanya disembunyikan
di frontend.

---

# 24. ARSITEKTUR

Teknologi akhir belum boleh ditentukan secara sembarangan sebelum
dokumen arsitektur disetujui.

Namun prinsipnya:

Frontend
    ↓
Backend / API
    ↓
Lapisan akses data
    ↓
Google Sheets

Google Sheets digunakan sebagai penyimpanan awal.

Lapisan akses data harus dibuat modular sehingga nantinya dapat
diganti dengan PostgreSQL/Supabase tanpa mengubah seluruh frontend.

---

# 25. ATURAN PEMELIHARAAN

Sistem harus mudah dirawat.

Jika owner ingin:

- menambah produk
- mengubah harga
- menambah kategori
- menambah karyawan
- menonaktifkan produk

hal tersebut harus dapat dilakukan melalui sistem tanpa harus
mengubah source code.

Developer bertanggung jawab terhadap:

- bug
- perubahan sistem
- keamanan
- deployment
- integrasi
- struktur database
- maintenance teknis

Owner bertanggung jawab terhadap:

- data produk
- harga
- karyawan
- kategori
- data operasional

---

# 26. JANGAN MEMBUAT KEPUTUSAN SEMBARANGAN

Jika ada kebutuhan yang belum jelas:

JANGAN langsung mengarang.

Lakukan:

1. Jelaskan bagian yang belum jelas.
2. Berikan beberapa pilihan.
3. Jelaskan kelebihan dan kekurangannya.
4. Berikan rekomendasi.
5. Minta keputusan developer/manusia jika keputusan tersebut
   memengaruhi arsitektur atau bisnis.

---

# 27. ATURAN PERUBAHAN FITUR

Jika developer meminta fitur baru:

1. Identifikasi dampaknya.
2. Tentukan dokumen yang terdampak.
3. Update dokumentasi terlebih dahulu jika diperlukan.
4. Implementasikan perubahan.
5. Jalankan pengujian.
6. Pastikan fitur lama tidak rusak.
7. Update CHANGELOG.md.

Jangan mengubah fitur yang tidak berhubungan.

---

# 28. ATURAN CODING

Gunakan:

- kode modular
- fungsi kecil
- nama variabel yang jelas
- struktur folder yang konsisten
- validasi input
- error handling
- reusable component
- reusable service
- type safety

Hindari:

- kode duplikat
- fungsi raksasa
- file raksasa
- hardcoded business logic
- solusi sementara yang tidak terdokumentasi
- dependensi yang tidak diperlukan

---

# 29. PENGUJIAN

Setiap fitur harus diuji.

Minimal:

- alur normal
- input salah
- data kosong
- hak akses
- error koneksi
- transaksi ganda
- pembatalan transaksi
- perubahan stok
- shift aktif/tidak aktif

Sebelum fitur dianggap selesai:

- tidak ada error TypeScript
- tidak ada error build
- pengujian terkait berhasil
- alur utama berhasil
- dokumentasi diperbarui jika diperlukan

---

# 30. DEFINITION OF DONE

Sebuah fitur belum dianggap selesai hanya karena tampilannya
sudah dibuat.

Fitur dianggap selesai jika:

- UI selesai
- backend selesai
- data tersimpan dengan benar
- hak akses benar
- validasi tersedia
- error handling tersedia
- pengujian berhasil
- tidak merusak fitur lama
- dokumentasi diperbarui

---

# 31. CARA AI AGENT BEKERJA

Sebelum mengerjakan task:

1. Baca AGENTS.md.
2. Baca dokumentasi terkait.
3. Periksa struktur project.
4. Periksa implementasi yang sudah ada.
5. Jelaskan pemahaman terhadap task.
6. Jelaskan rencana perubahan.
7. Implementasikan.
8. Jalankan pengujian.
9. Laporkan hasil.

Jangan langsung mengubah banyak file tanpa memahami project.

---

# 32. PRIORITAS

Jika terjadi konflik antara:

Kecepatan
dan
Keamanan data

pilih keamanan data.

Jika terjadi konflik antara:

Kemudahan coding
dan
Kemudahan maintenance

pilih kemudahan maintenance.

Jika terjadi konflik antara:

Fitur tambahan
dan
Kesederhanaan POS

pilih kesederhanaan POS.

Jika terjadi konflik antara:

Keinginan AI
dan
Dokumentasi proyek

ikuti dokumentasi proyek.

---

# 33. KONDISI SAAT INI

Pada tahap awal:

JANGAN LANGSUNG MEMBUAT SELURUH APLIKASI.

Tugas pertama AI Agent adalah:

1. Membaca AGENTS.md.
2. Memahami konteks bisnis.
3. Membantu membuat dokumentasi proyek.
4. Mengidentifikasi kebutuhan yang masih belum jelas.
5. Membantu menyusun PRD.
6. Membantu menyusun ERD.
7. Membantu menyusun struktur database.
8. Membantu menyusun RBAC.
9. Membantu menyusun business rules.
10. Setelah blueprint disetujui, baru memulai implementasi.

AI Agent tidak boleh langsung membuat seluruh sistem hanya berdasarkan
AGENTS.md.

---

# 34. TUJUAN AKHIR

Sistem akhir harus menjadi POS yang:

- sederhana untuk kasir
- mudah digunakan ketika toko ramai
- mudah dipelihara developer
- aman
- memiliki pencatatan transaksi yang jelas
- mampu menangani beberapa karyawan
- mendukung shift
- dapat dipantau owner dari jarak jauh
- memiliki laporan lengkap
- memiliki analisis produk
- memiliki backup
- dapat dikembangkan di masa depan

Sistem harus dibangun secara bertahap dan terdokumentasi.

# AKHIR AGENTS.MD
