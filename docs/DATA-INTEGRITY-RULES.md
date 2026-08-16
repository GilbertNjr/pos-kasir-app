# ATURAN INTEGRITAS DATA DATABASE (DATA INTEGRITY RULES)

> **Status:** Aturan Mutlak Database  
> **Versi:** 1.0.0  
> **Tanggal:** 15 Agustus 2026  

Dokumen ini mendefinisikan aturan integritas data yang wajib dipatuhi oleh basis data PostgreSQL, backend API, dan Data Access Layer (DAL) untuk menjamin keakuratan finansial dan konsistensi data transaksi.

---

## 1. HUKUM PERSISTENSI FINANSIAL (CURRENCY INTEGRITY)

1. **Dilarang Floating Point:** Tipe data `FLOAT`, `DOUBLE`, atau `REAL` **DILARANG HARAM** digunakan untuk kolom uang, modal, pajak, diskon, dan subtotal.
2. **Standard Tipe `NUMERIC(15,2)`:** Seluruh nominal uang disimpan dalam format `NUMERIC(15,2)` pada PostgreSQL untuk menjamin presisi aritmatika desimal 2 digit di belakang koma.
3. **Penyimpanan Satuan Stok:** Kolom stok barang fisik menggunakan `NUMERIC(12,3)` untuk mendukung barang yang dijual per desimal (contoh: Kertas / Bahan dalam satuan Meter atau Kg).

---

## 2. ATURAN SNAPSHOT HARGA HISTORIS (PRICE SNAPSHOT IMMUTABILITY)

1. **Nilai `transaction_items` Bersifat Imutabel:** Kolom `unit_price`, `product_name_snapshot`, dan `subtotal` pada tabel `transaction_items` wajib diisi snapshot harga jual aktual saat transaksi dilakukan.
2. **Larangan Re-Fetch Harga Lama:** Laporan historis dan omzet tidak boleh menghitung ulang subtotal berdasarkan harga produk dari tabel `products` saat ini. Perubahan harga pada master produk tidak boleh mengubah nilai transaksi historis.

---

## 3. ATURAN PENANGANAN PEMBATALAN TRANSAKSI (NO HARD DELETE)

1. **Dilarang `DELETE FROM transactions`:** Transaksi yang telah dibuat berstatus `COMPLETED` atau `CANCELLED` **TIDAK BOLEH DIHAPUS SECARA FISIK** dari database PostgreSQL.
2. **Mekanisme Pembatalan:** Transaksi batal dilakukan dengan meng-update kolom `status = 'CANCELLED'`, serta mengisi `cancelled_by_user_id`, `cancelled_at`, dan `cancellation_reason`.
3. **Pengembalian Stok Transaksi Batal:** Ketika transaksi fisik (`PRODUCT`) dibatalkan, sistem wajib mencatat mutasi stok baru berjenis `CANCEL_SALE` untuk mengembalikan stok fisik produk ke tabel `stocks`.

---

## 4. INTEGRITAS KONKURENSI & PENCEGAHAN STOK NEGATIF

1. **Database Constraint `CHECK (current_stock >= 0)`:** Tabel `stocks` dilindungi oleh constraint level database yang membatalkan transaksi jika stok berkurang hingga di bawah 0.
2. **Pencegahan Race Condition (Kasir Ganda):** Ketika dua kasir menjual item fisik terakhir secara bersamaan, query pengurangan stok wajib menggunakan PostgreSQL Atomic Transaction dan Row Locking:
   ```sql
   BEGIN;
   SELECT current_stock FROM stocks WHERE product_id = $1 FOR UPDATE;
   UPDATE stocks SET current_stock = current_stock - $qty WHERE product_id = $1;
   COMMIT;
   ```

---

## 5. BATASAN UNIK DATABASE (UNIQUE CONSTRAINTS)

Pengecekan keunikan data wajib didefinisikan pada level Database DDL, bukan hanya di aplikasi:
* `users.username` `UNIQUE`
* `users.email` `UNIQUE`
* `transactions.transaction_number` `UNIQUE`
* `products.sku` `UNIQUE`
* `product_units.unit_code` `UNIQUE`
* `shift_members(shift_id, user_id)` `UNIQUE`

---

## 6. INTEGRITAS FOREIGN KEY & ATURAN `ON DELETE`

Untuk mencegah penghapusan tidak sengaja pada data referensi historis:
* `transactions.shift_id` $\rightarrow$ `ON DELETE RESTRICT`
* `transactions.created_by_user_id` $\rightarrow$ `ON DELETE RESTRICT`
* `transaction_items.transaction_id` $\rightarrow$ `ON DELETE RESTRICT`
* `transaction_items.product_id` $\rightarrow$ `ON DELETE RESTRICT`
* `payments.transaction_id` $\rightarrow$ `ON DELETE RESTRICT`
* `stock_movements.product_id` $\rightarrow$ `ON DELETE RESTRICT`
* `audit_logs.actor_user_id` $\rightarrow$ `ON DELETE RESTRICT`
