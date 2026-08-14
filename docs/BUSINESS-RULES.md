# Business Rules (Aturan Bisnis)

> **Status:** Final Approved Blueprint (Tahap B - Dengan Pengelolaan Kontribusi Modal Multi-User)  
> **Versi:** 0.5.0  
> **Tanggal Revisi:** 14 Agustus 2026  

Dokumen ini mengatur seluruh batasan, logika operasi, dan aturan bisnis yang berlaku di dalam Sistem POS Usaha Campuran (FC/Printing & FNB). Seluruh implementasi kode dan logika aplikasi wajib mematuhi aturan bisnis ini.

---

## 1. ATURAN PENGGUNA (USER)

1.1. **Identitas Pengguna Unik:** Setiap pengguna (Owner maupun Karyawan) memiliki ID unik, Username/Email, Nama Lengkap, dan Kredensial akun tersendiri.  
1.2. **Pengguna Dinamis:** Sistem tidak boleh menggunakan nama pengguna tetap atau umum seperti "Kasir 1" atau "Kasir 2". Jumlah akun karyawan dapat ditambah atau dinonaktifkan sesuai kebutuhan operasional usaha.  
1.3. **Status Akun:** Akun pengguna memiliki status `Aktif` atau `Non-Aktif`. Pengguna `Non-Aktif` tidak dapat melakukan login ke sistem.  
1.4. **Pencatatan Jejak Aktivitas:** Seluruh transaksi, pengeluaran, pembukaan/penutupan shift, dan log aktivitas penting wajib terhubung secara langsung ke `User ID` dari pengguna yang terautentikasi.

---

## 2. ATURAN HAK AKSES & ROLE

2.1. **Dua Role Permanen Sistem:** Sistem HANYA memiliki 2 Role akun permanen: `OWNER` dan `KARYAWAN`.  
2.2. **Role OWNER:**
   - Memiliki hak akses penuh tanpa batasan terhadap seluruh fitur dan data sistem.
   - Berhak mengelola Pengguna, Produk, Kategori, Harga, Stok, Pengeluaran, Laporan, Dashboard Analytics, Audit Log, dan fungsi Backup/Restore.
   - Berhak melakukan *override* (pengambilalihan) terhadap seluruh proses operasional, termasuk penutupan shift, rekonsiliasi kas, dan pengembalian modal.
2.3. **Role KARYAWAN:**
   - Memiliki hak akses terbatas khusus operasional kasir harian.
   - Diizinkan untuk: Login, Buka Shift, Setor Modal Awal, Melakukan Transaksi Penjualan/Jasa, Mencatat Pembayaran, Mencatat Pengeluaran Shift berjalan, Memeriksa Ringkasan Transaksi Miliknya pada shift aktif, dan Tutup Shift (khusus jika ditunjuk sebagai Penanggung Jawab pada sesi shift tersebut).

---

## 3. ATURAN SISTEM SHIFT, KAS BERSAMA & KONTRIBUSI MODAL MULTI-USER

3.1. **Kewajiban Shift Aktif:** Kasir hanya dapat membuat transaksi penjualan atau mencatat pengeluaran jika sesi **Shift Aktif** sedang berlangsung di toko.  
3.2. **Dukungan Multi-User per Shift:** Satu sesi shift yang sama dapat diisi oleh lebih dari satu karyawan yang aktif bertransaksi secara bersamaan.  
3.3. **Penanggung Jawab Shift (Bukan Role Akun):**
   - Dalam satu sesi shift multi-karyawan, ditentukan **SATU Karyawan sebagai Penanggung Jawab Shift** (`shift_leader_user_id`). Karyawan lain bertindak sebagai Anggota Shift.
   - Penanggung Jawab Shift (atau Owner via *override*) bertugas melakukan proses Tutup Shift dan Rekonsiliasi Kas Bersama pada akhir sesi shift.
3.4. **Konsep Kas Tunai Bersama (Shared Cash Drawer):**
   - Seluruh karyawan yang bekerja dalam satu sesi shift menggunakan **SATU LACI/KAS TUNAI BERSAMA**.
   - **TIDAK ADA** saldo kas penjualan terpisah per karyawan. Seluruh penerimaan uang tunai transaksi masuk ke dalam 1 laci kas yang sama.
3.5. **Kontribusi Modal Awal Multi-User (Multi-User Capital Contribution):**
   - Modal Kas Awal untuk sesi shift dapat bersumber dari kontribusi 1 atau beberapa karyawan (maupun Owner) yang bertugas pada shift tersebut.
   - Uang tunai dari seluruh kontributor dicampur ke dalam SATU LACI KAS BERSAMA.
   - Sistem mencatat secara terpisah kontribusi masing-masing penyetor: `User ID`, Nominal Setoran (`amount`), Waktu Setoran (`contribution_time`), dan Status Pengembalian (`status`).
   - **Total Modal Kas Awal Bersama Shift** = $\sum \text{Nominal Kontribusi Modal Awal Karyawan pada Shift ID}$.
   - *Penting:* Modal individual **bukan saldo kas per kasir**, melainkan catatan setoran modal yang wajib dikembalikan saat tutup shift.
3.6. **Tutup Shift (Close Shift) & Rekonsiliasi Kas Bersama:**
   - Rekonsiliasi kas pada saat menutup shift dilakukan terhadap **SATU KAS BERSAMA** (bukan per kasir).
   - Sistem menghitung **Saldo Kas Teoritis Bersama**:
     $$\text{Saldo Kas Teoritis} = \text{Total Modal Kas Awal Bersama} + \text{Penjualan Tunai Bersih} - \text{Pengeluaran Tunai}$$
   - Penanggung Jawab Shift memasukkan **Jumlah Uang Fisik Aktual** yang ada di laci kas bersama.
   - Sistem menghitung **Selisih Kas Bersama**:
     $$\text{Selisih Kas} = \text{Uang Fisik Aktual} - \text{Saldo Kas Teoritis}$$
     - `PAS`: Selisih = Rp0
     - `LEBIH`: Selisih > Rp0
     - `KURANG`: Selisih < Rp0
3.7. **Alur Pengembalian Modal Awal (Capital Return):**
   - Setelah rekonsiliasi kas bersama selesai dan status shift menjadi `CLOSED`, sistem menyajikan rincian pengembalian modal awal kepada masing-masing penyetor modal.
   - Penanggung Jawab Shift / Owner menyerahkan kembali fisik uang modal awal kepada masing-masing penyetor sesuai nominal catatan awal dan mengubah status kontribusi menjadi `RETURNED`.

---

## 4. ATURAN PRODUK & JASA

4.1. **Produk Fisik vs Jasa:** Produk fisik memiliki `Kelola Stok = Ya`, sedangkan Jasa (fotokopi, print, scan, ketik, desain) memiliki `Kelola Stok = Tidak`.  
4.2. **Penggabungan Keranjang:** Produk fisik dan Jasa dapat digabung dalam satu keranjang belanja kasir.  
4.3. **Master Harga:** Harga jual ditarik dari database master dan dilarang di-hardcode.

---

## 5. ATURAN TRANSAKSI, PEMBAYARAN & PEMBATALAN

5.1. **Komponen Transaksi:** Mencatat `transaction_id`, `shift_id`, `created_by_user_id`, waktu, item, total, metode bayar, dan status (`COMPLETED`/`CANCELLED`).  
5.2. **Akuntabilitas User ID:** Setiap transaksi terikat pada `created_by_user_id` kasir yang memprosesnya untuk pelaporan kinerja individu.  
5.3. **Integritas Anti-Hapus:** Transaksi `COMPLETED` dilarang dihapus permanen.  
5.4. **Refund Tunai vs Non-Tunai:**
   - Transaksi Tunai Batal: Uang tunai dikembalikan dari Laci Kas Bersama, mengurangi `Penjualan Tunai Bersih` shift.
   - Transaksi Non-Tunai Batal: TIDAK BOLEH mengeluarkan uang tunai dari Laci Kas Bersama. Refund dilakukan manual dan dicatat di sistem.

---

## 6. ATURAN PENGELUARAN & LAPORAN

6.1. **Pengeluaran Shift:** Pengeluaran tunai toko selama shift dicatat terpisah dan mengurangi Saldo Kas Teoritis shift.  
6.2. **Laporan Performa Karyawan:** Menampilkan omzet, jumlah transaksi, dan pengeluaran per `User ID`, tanpa membagi saldo kas laci.  
6.3. **Laporan Rekonsiliasi Shift:** Menampilkan Total Modal Awal Bersama, Penjualan Tunai Bersih, Pengeluaran Tunai, Saldo Teoritis, Uang Fisik Aktual, Selisih Kas, dan Rincian Pengembalian Modal per Penyetor.

---

## 7. OPEN DECISIONS (KEPUTUSAN TERBUKA OWNER)

1. **[OPEN DECISION #1] Otorisasi Pembatalan Transaksi (Refund):**
   - Whether cashier can process refund independently with reason + audit log, or requires Owner PIN/Approval.
2. **[OPEN DECISION #2] Otorisasi Pengeluaran Kas Toko:**
   - Whether cashier can record expenses directly, or expenses above a threshold require Owner Approval.
3. **[OPEN DECISION #3] Penanganan Pengembalian Modal saat Kas KURANG:**
   - Jika saat Tutup Shift kas laci mengalami **Status KURANG** (misal: Selisih -Rp50.000), bagaimana mekanisme pengembalian modal karyawan? Apakah modal awal karyawan tetap dikembalikan 100% penuh terlebih dahulu, dan selisih minus dicatat sebagai kerugian/tanggungan shift, atau ada pemotongan? (Rekomendasi: Modal awal tetap dikembalikan 100% penuh, selisih minus ditangani sebagai pertanggungjawaban shift terpisah).

---

## NEXT STEPS (ALUR TAHAPAN BERIKUTNYA)

Dokumen ini menjadi landasan resmi bagi `RBAC.md v0.4.0`, `ERD.md v0.2.0`, dan `DATABASE.md v0.2.0`.
