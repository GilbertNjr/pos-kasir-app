# ROLE OWNER - POS KASIR USAHA CAMPURAN

## 1. Definisi Owner
OWNER adalah pemilik usaha dan merupakan role dengan hak akses tertinggi dalam sistem.
OWNER adalah satu-satunya role yang memiliki kontrol penuh terhadap sistem.
Tidak ada role lain yang boleh memiliki hak akses setara OWNER.
OWNER tidak boleh bergantung pada keberadaan karyawan atau penanggung jawab agar dapat mengontrol sistem.
OWNER harus dapat memantau bisnis dari lokasi mana pun selama memiliki koneksi dan akun yang sah.

## 2. Tujuan Owner
OWNER berfokus pada:
1. Kontrol bisnis
2. Monitoring keuangan
3. Monitoring transaksi
4. Monitoring karyawan
5. Monitoring stok
6. Pengelolaan pengguna
7. Pengelolaan hak akses
8. Laporan
9. Audit
10. Backup dan restore
11. Pengaturan sistem

OWNER harus dapat mengetahui:
- siapa yang sedang bekerja
- siapa yang menjadi kasir
- shift yang aktif
- omzet
- jumlah transaksi
- pengeluaran
- metode pembayaran
- produk yang paling laku
- produk yang kurang laku
- kondisi stok
- aktivitas pengguna
- aktivitas perubahan data

## 3. Dashboard Owner
Dashboard Owner harus menjadi pusat kontrol bisnis.
Dashboard minimal menyediakan:
1. Omzet hari ini
2. Omzet minggu ini
3. Omzet bulan ini
4. Omzet tahun ini
5. Jumlah transaksi
6. Pengeluaran
7. Laba/indikator keuangan sesuai data yang tersedia
8. Grafik penjualan
9. Produk terlaris
10. Produk dengan penjualan rendah
11. Stok menipis
12. Aktivitas kasir
13. Shift aktif
14. Penjualan berdasarkan kategori
15. Penjualan berdasarkan periode

Periode laporan minimal:
- Hari
- Minggu
- Bulan
- Tahun
- Rentang tanggal custom

## 4. Permission Owner
OWNER memiliki akses penuh terhadap:
- Dashboard Owner
- Kasir
- Transaksi
- Shift
- Produk
- Kategori
- Stok
- Penyesuaian stok
- Pengeluaran
- Pembayaran
- Laporan
- Pengguna
- Role
- Permission
- Backup
- Restore
- Audit Log
- Pengaturan sistem

OWNER dapat menggunakan mode kasir apabila OWNER sedang menjaga kasir secara langsung.
Mode kasir tidak boleh menghilangkan hak OWNER.

## 5. Monitoring Karyawan
OWNER dapat melihat:
- nama karyawan
- role
- status aktif
- shift
- waktu mulai shift
- waktu selesai shift
- jumlah transaksi
- total penjualan
- metode pembayaran
- pengeluaran yang dilakukan jika diizinkan
- aktivitas penting

Jika dalam satu shift terdapat lebih dari dua karyawan, sistem harus tetap dapat membedakan transaksi berdasarkan pengguna.
Jangan menggabungkan transaksi beberapa karyawan menjadi satu identitas.

## 6. Pengelolaan Pengguna
OWNER dapat:
- melihat pengguna
- menambah pengguna
- mengubah pengguna
- menonaktifkan pengguna
- mengaktifkan pengguna
- mengatur role
- mengatur permission jika sistem mendukung permission granular
- melakukan reset akses sesuai mekanisme keamanan

Role utama:
1. OWNER
2. PENANGGUNG JAWAB
3. KARYAWAN

Tidak boleh ada role lain yang dibuat secara sembarangan tanpa perubahan dokumentasi sistem.

## 7. Shift
Sistem memungkinkan OWNER untuk mengetahui shift aktif, siapa saja yang sedang bekerja di shift tersebut, serta melihat rekapan penjualan tiap shift.

## 8. Transaksi
Setiap transaksi harus memiliki identitas pengguna yang melakukan transaksi. Transaksi yang sudah selesai tidak boleh dihapus secara permanen. Jika dibatalkan, harus menggunakan status pembatalan dan disimpan riwayatnya di Audit Log.

## 9. Produk & Kategori
OWNER adalah pengelola utama untuk produk dan kategori, termasuk menetapkan harga modal dan harga jual.

## 10. Stok
OWNER dapat melihat kondisi stok barang dan melakukan penyesuaian (manual adjustment) apabila terjadi ketidaksesuaian atau retur.

## 11. Keuangan (Pengeluaran & Metode Pembayaran)
OWNER berhak mengatur metode pembayaran dan mencatat pengeluaran operasional di luar transaksi penjualan, yang nantinya berpengaruh ke perhitungan laba.

## 12. Laporan
OWNER memiliki akses ke berbagai jenis laporan termasuk laporan omzet, laporan produk, laporan performa karyawan, laporan shift, dan laporan perputaran produk.

## 13. Backup
Hanya OWNER yang boleh melakukan:
- backup
- melihat status backup
- melihat histori backup
- melakukan verifikasi backup

## 14. Restore
Hanya OWNER yang boleh melakukan restore.
Penanggung Jawab dan Karyawan tidak boleh memiliki akses restore.
Restore adalah operasi kritis.
Jika sistem memiliki mekanisme konfirmasi, OWNER harus melakukan konfirmasi eksplisit sebelum restore.

## 15. Audit Log
OWNER dapat melihat seluruh audit log.
Audit minimal mencatat aktivitas penting seperti:
- login
- logout
- transaksi
- pembatalan transaksi
- perubahan harga
- perubahan stok
- penyesuaian stok
- perubahan produk
- perubahan pengguna
- perubahan permission
- pengeluaran
- backup
- restore

Audit log tidak boleh dapat dihapus oleh Karyawan atau Penanggung Jawab.

## 16. Keamanan
OWNER tidak boleh dibedakan hanya berdasarkan tampilan frontend.
Semua permission OWNER harus diverifikasi pada backend.
Jangan menganggap: "menu tidak terlihat" berarti: "akses tidak tersedia".
Backend harus tetap melakukan validasi role/permission.

## 17. Mode Kasir Owner
OWNER dapat masuk ke mode kasir jika dibutuhkan.
Mode ini hanya merupakan konteks kerja, BUKAN perubahan role.
Contoh: OWNER -> Masuk Mode Kasir -> Melakukan transaksi.
Setelah selesai: OWNER -> Kembali ke Dashboard Owner.
Identitas transaksi tetap mencatat bahwa transaksi dilakukan oleh akun OWNER.

## 18. Batasan Sistem
Tidak ada role lain yang boleh:
- mengambil alih role OWNER
- mengubah credential OWNER tanpa mekanisme resmi
- menghapus OWNER secara sembarangan
- mengubah permission OWNER
- melakukan restore tanpa hak OWNER
- membaca secret aplikasi
- membaca environment variable server

## 19. Aturan Data
Setiap transaksi harus memiliki identitas pengguna yang melakukan transaksi.
Setiap perubahan data penting harus memiliki:
- user_id
- timestamp
- jenis aktivitas
- data sebelum jika diperlukan
- data sesudah jika diperlukan

Jangan menggunakan nama pengguna sebagai primary identifier.

## 20. Aturan untuk AI Coding Agent
Jika AI menemukan konflik antara implementasi saat ini dengan dokumen ROLE OWNER:
1. Jangan langsung mengubah kode.
2. Identifikasi konflik.
3. Jelaskan file yang terdampak.
4. Jelaskan risiko.
5. Minta persetujuan sebelum melakukan perubahan.

AI tidak boleh menurunkan hak OWNER hanya untuk menyamakan tampilan dengan role lain.

## 21. Larangan
Jangan:
- hardcode permission di frontend saja
- membuat secret di source code
- memberikan akses OWNER kepada role lain
- menghapus audit log
- memberikan restore kepada Karyawan
- memberikan restore kepada Penanggung Jawab
- membuat role baru tanpa dokumentasi
- mengubah database tanpa migration plan
