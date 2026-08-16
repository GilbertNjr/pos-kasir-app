# DOKUMEN CATATAN KEBUTUHAN & OPEN QUESTIONS

> **Status:** Open for Business & Architecture Review  
> **Tanggal:** 15 Agustus 2026  

Dokumen ini mendokumentasikan poin-poin yang belum ditentukan dalam requirement awal (underspecified requirements) atau keputusan arsitektur yang membutuhkan konfirmasi pengembang/pemilik usaha.

---

## 1. DOKUMENTASI OPEN QUESTIONS & REKOMENDASI ARSITEKTUR

### 1. Split Payment Support (Pembayaran Ganda per Transaksi)
* **Kondisi:** Pada implementasi awal (MVP), 1 transaksi hanya dikaitkan dengan 1 metode pembayaran (`CASH`, `QRIS`, atau `TRANSFER`).
* **Pertanyaan Bisnis:** Apakah pelanggan toko usaha campuran diizinkan melakukan pembayaran ganda pada satu nota (misal: Rp50.000 Tunai + Rp50.000 QRIS)?
* **Dampak Database:** Struktur skema telah dipisahkan ke tabel `payments` dengan relasi 1-to-many ke `transactions` sehingga backend siap mendukung split payment tanpa merubah struktur tabel di masa depan.
* **Rekomendasi:** Untuk MVP, frontend dan API membatasi 1 entri pada `payments`. Pengaktifan UI Split Payment dapat dilakukan pada fase berikutnya.

---

### 2. Ambang Batas Selisih Kas (Cash Drawer Reconciliation Variance Threshold)
* **Kondisi:** Saat shift ditutup, sistem menghitung `cash_variance = actual_physical_cash - theoretical_cash` dengan status `'PAS'`, `'LEBIH'`, atau `'KURANG'`.
* **Pertanyaan Bisnis:** Apakah ada toleransi nominal selisih kas (misal: $\pm$ Rp2.000) yang dianggap wajar karena uang receh kembalian, atau apakah setiap selisih wajib memicu notifikasi peringatan khusus ke Owner?
* **Dampak Sistem:** Dapat ditambahkan parameter `max_cash_tolerance_amount` pada `system_settings`.
* **Rekomendasi:** Setiap selisih non-nol tetap dicatat secara akurat di database. Warning badge diberikan jika selisih melampaui `0.00`.

---

### 3. Ekspansi Multi-Toko / Cabang (Multi-Branch Architecture)
* **Kondisi:** Sistem POS saat ini dirancang untuk 1 lokasi usaha campuran (FC/Printing & FNB).
* **Pertanyaan Bisnis:** Apakah di masa depan Owner berencana membuka cabang usaha kedua/ketiga yang dipantau dari satu Dashboard Owner?
* **Dampak Database:** Jika ya, tabel `shifts`, `products`, `transactions`, dan `expenses` memerlukan kolom `store_id` atau `branch_id`.
* **Rekomendasi:** Untuk skema MVP v1.0, kolom `store_id` dapat ditambahkan sebagai opsional (`NULLABLE DEFAULT 'MAIN_STORE'`) pada skema DDL untuk mempermudah migrasi masa depan.

---

### 4. Varian Produk & Scan Barcode (SKU)
* **Kondisi:** Barang ATK dan Snack memiliki SKU/Barcode, sedangkan jasa (Print/Fotokopi) tidak memiliki barcode fisik.
* **Pertanyaan Bisnis:** Apakah kasir akan menggunakan alat pengimbas barcode (barcode scanner) untuk item ATK/Snack?
* **Dampak Database:** Tabel `products` telah dilengkapi kolom `sku VARCHAR(50) UNIQUE` yang bersifat `NULLABLE`.
* **Rekomendasi:** Kasir dapat mencari produk secara manual via pencarian UI layar sentuh atau memindai barcode pada input teks yang sama.

---

### 5. Antrean Asinkron Sinkronisasi Google Sheets (Background Queue)
* **Kondisi:** Google Sheets berfungsi sebagai eksportir & backup sekunder, bukan database transaksi utama.
* **Pertanyaan Teknis:** Jika jaringan internet lokasi toko lambat, apakah proses penulisan ke Google Sheets boleh menunda respon transaksi kasir?
* **Rekomendasi Arsitektur:** **TIDAK BOLEH**. Transaksi wajib dicatat & di-commit di PostgreSQL terlebih dahulu. Penulisan ke Google Sheets wajib dijalankan secara **asynchronous (non-blocking)** via event emitter / background worker agar transaksi kasir tetap instan.
