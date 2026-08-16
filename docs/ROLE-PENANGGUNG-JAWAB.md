# ROLE PENANGGUNG JAWAB - POS KASIR USAHA CAMPURAN

> **Status:** Dokumen Referensi Resmi
> **Versi:** 1.0.0
> **Tanggal:** 15 Agustus 2026
> **Referensi:** RBAC.md v0.4.0 | BUSINESS-RULES.md v0.5.0 | DATABASE.md v0.2.0

---

## ⚠️ PERHATIAN PENTING: STATUS DALAM SISTEM

Berdasarkan `RBAC.md v0.4.0` dan `BUSINESS-RULES.md v0.5.0`, sistem
**HANYA memiliki 2 role akun permanen**: `OWNER` dan `KARYAWAN`.

**PENANGGUNG JAWAB bukanlah role akun permanen di database.**

PENANGGUNG JAWAB adalah **status sesi shift** yang ditetapkan saat
membuka shift, bukan entitas role yang terpisah di tabel `users`.

Artinya:

- Kolom `role` pada tabel `users` HANYA berisi: `'OWNER'` atau `'KARYAWAN'`.
- Status "Penanggung Jawab Shift" direpresentasikan oleh kolom
  `is_shift_leader = TRUE` pada tabel `shift_users`.
- Kolom `shift_leader_user_id` pada tabel `shifts` menunjuk ke satu
  karyawan yang menjadi Penanggung Jawab untuk sesi shift tersebut.

Satu karyawan dapat menjadi anggota biasa di satu shift dan menjadi
Penanggung Jawab di shift lainnya.

---

## 1. Definisi

PENANGGUNG JAWAB adalah karyawan dengan role akun `KARYAWAN` yang
ditunjuk sebagai **pemimpin sesi shift** ketika shift dibuka.

Dalam satu sesi shift multi-karyawan, tepat **SATU** karyawan ditunjuk
sebagai Penanggung Jawab Shift (`shift_leader_user_id`).

Karyawan lainnya dalam shift yang sama bertindak sebagai Anggota Shift
(`is_shift_leader = FALSE`).

PENANGGUNG JAWAB adalah tangan kanan / pengawas operasional yang
dipercaya OWNER untuk membantu menjalankan toko ketika OWNER tidak
berada di lokasi.

PENANGGUNG JAWAB bukan OWNER.

PENANGGUNG JAWAB tidak boleh memiliki kontrol penuh sistem.

Sistem harus tetap berjalan walaupun OWNER sedang berada:

- di luar toko
- luar kota
- luar provinsi
- luar negeri

PENANGGUNG JAWAB bertugas memastikan kegiatan operasional toko
berjalan dengan baik selama sesi shift berlangsung.

---

## 2. Tujuan

Tujuan keberadaan PENANGGUNG JAWAB dalam sistem:

1. Memberikan tanggung jawab operasional kepada satu orang yang dapat
   diandalkan di setiap sesi shift.
2. Memungkinkan proses Tutup Shift dan Rekonsiliasi Kas dilakukan oleh
   karyawan yang berwenang tanpa harus menunggu OWNER.
3. Mendokumentasikan siapa yang bertanggung jawab atas sesi shift
   tertentu untuk keperluan akuntabilitas dan audit.
4. Memisahkan tanggung jawab anggota shift biasa dengan karyawan yang
   memegang kendali operasional penuh sesi tersebut.

---

## 3. Dashboard Penanggung Jawab

Dashboard khusus Penanggung Jawab harus berbeda dengan Dashboard Owner.

Dashboard TIDAK boleh menampilkan kontrol sistem level OWNER seperti:
- Laporan keuangan strategis penuh
- Dashboard analytics Owner
- Manajemen pengguna
- Backup & Restore
- Audit Log sistem

Dashboard Penanggung Jawab minimal menampilkan:

- Status toko (Shift aktif / tidak aktif)
- Informasi shift aktif (jam buka, siapa yang membuka)
- Daftar karyawan yang aktif di shift saat ini
- Jumlah transaksi hari ini
- Omzet shift berjalan (sesuai akses)
- Total pengeluaran shift berjalan
- Saldo kas teoritis shift (sesuai akses)
- Stok menipis / perlu restock
- Produk aktif dan nonaktif
- Transaksi terbaru
- Aktivitas operasional shift

---

## 4. Produk

Berdasarkan `RBAC.md v0.4.0`, akses Penanggung Jawab terhadap produk:

| Aksi       | Penanggung Jawab (PJ Shift) | Anggota Shift |
| :--------- | :-------------------------: | :-----------: |
| Read (R)   | ✅                          | ✅            |
| Create (C) | ✅ (sesuai permission)      | ❌            |
| Update (U) | ✅ (sesuai permission)      | ❌            |
| Delete (D) | ❌ (gunakan Nonaktifkan)    | ❌            |

Kebijakan produk yang harus diikuti:

- **Gunakan "nonaktifkan produk" daripada menghapus data secara permanen.**
- CRUD Produk penuh (termasuk perubahan harga master) tetap menjadi
  hak OWNER berdasarkan `RBAC.md v0.4.0` (`C/R/U/D` Kelola Master Produk &
  Harga hanya untuk `OWNER`).
- Penanggung Jawab dapat melakukan operasional produk sesuai permission
  yang ditetapkan Owner (tidak otomatis mendapat akses CRUD penuh).

---

## 5. Kategori

Struktur kategori mendukung hierarki berikut:

```
DEPARTEMEN
  └── KATEGORI
        └── SUBKATEGORI / MEREK
              └── PRODUK
```

Departemen utama:

**FC_PRINT**
- ATK
- Fotokopi
- Print
- Jasa
- Persediaan

**FNB**
- Minuman
- Gorengan
- Es Krim
- Snack
- Seblak

Contoh produk dengan subkategori merek (Es Krim):
```
FNB
  └── Es Krim
        ├── Kul-Kul
        └── Aice
```

> **ATURAN KRITIS — JANGAN HARDCODE MEREK:**
> Nama merek seperti "Kul-Kul" dan "Aice" TIDAK BOLEH ditulis
> langsung di source code. Merek harus berupa data master yang dapat
> ditambah, diubah, atau dinonaktifkan melalui sistem tanpa mengubah
> kode.

Struktur tampilan UI stok dan kategori harus dinamis berdasarkan
master data, bukan menggunakan daftar tetap di kode.

---

## 6. Stok

Penanggung Jawab memiliki akses stok sesuai `RBAC.md v0.4.0`:

| Aksi                             | Penanggung Jawab | Anggota Shift |
| :------------------------------- | :--------------: | :-----------: |
| Lihat stok saat ini              | ✅ (R)           | ✅ (R)        |
| Lihat log riwayat stok           | ✅ (R)           | ✅ (R)        |
| Penyesuaian stok manual          | ❌ (X)           | ❌ (X)        |
| Penambahan stok via restock      | Sesuai permission | ❌            |

> **CATATAN:** Berdasarkan `RBAC.md v0.4.0`, `Penyesuaian Stok Manual
> (Adjustment)` hanya dapat dilakukan oleh `OWNER`. Penanggung Jawab
> tidak otomatis mendapatkan hak ini.

Setiap perubahan stok wajib memiliki record lengkap:

| Field         | Keterangan                                   |
| :------------ | :------------------------------------------- |
| `user_id`     | ID pengguna yang melakukan perubahan         |
| `product_id`  | Produk yang berubah stoknya                  |
| `change_qty`  | Jumlah perubahan (positif/negatif)           |
| `final_stock` | Stok akhir setelah perubahan                 |
| `log_type`    | `'SALE'`, `'REFUND'`, `'MANUAL_ADJUSTMENT'` |
| `created_at`  | Waktu pencatatan                             |

Tampilan stok harus mengikuti struktur dinamis:

**FC / PRINT:**
- Semua
- ATK
- Fotokopi
- Print
- [kategori lainnya sesuai master data]

**F&B:**
- Semua
- Minuman
- Gorengan
- Es Krim
- Snack
- Seblak
- [kategori lainnya sesuai master data]

**Sub-kategori (Contoh Es Krim):**
- Semua
- [merek sesuai master data]

---

## 7. Jasa dan Produk Fisik

Sistem membedakan antara produk fisik dan jasa.

**Jasa** (manage_stock = FALSE):
- Fotokopi
- Print
- Scan
- Ketik
- Desain

Jasa tidak memiliki stok fisik. Tidak ada pengurangan stok saat jasa
dilakukan.

**Produk fisik** (manage_stock = TRUE):
- ATK (pulpen, kertas, dll.)
- Snack
- Minuman
- Es Krim
- Gorengan

Stok fisik berkurang saat transaksi selesai dan dikembalikan saat
transaksi dibatalkan.

**Persediaan FC/Print** (bahan pendukung jasa):
- Kertas
- Toner / Tinta

Persediaan ini bersifat opsional — dapat dikelola sebagai stok fisik
jika diperlukan, tetapi tidak wajib.

> **LARANGAN:** Jangan membangun sistem resep/bahan baku F&B yang
> kompleks kecuali memang diminta secara eksplisit oleh Owner.

---

## 8. Transaksi

Penanggung Jawab dapat melakukan transaksi kasir karena ia tetap
merupakan karyawan aktif dalam sesi shift.

Setiap transaksi wajib mencatat:

| Field                  | Keterangan                              |
| :--------------------- | :-------------------------------------- |
| `transaction_id`       | UUID unik transaksi                     |
| `transaction_number`   | Nomor transaksi (e.g., TRX-20260815-001)|
| `shift_id`             | Shift ID saat transaksi dilakukan       |
| `created_by_user_id`   | User ID kasir yang memproses transaksi  |
| `payment_method`       | CASH / TRANSFER / QRIS_MANUAL          |
| `status`               | COMPLETED / CANCELLED                   |
| `transaction_time`     | Waktu transaksi                         |

Transaksi yang dilakukan oleh Penanggung Jawab tetap mencatat
`created_by_user_id` miliknya — bukan ID shift atau ID generik.

Transaksi tidak boleh dihapus secara permanen (`RESTRICT ON DELETE`).
Pembatalan hanya mengubah `status` menjadi `'CANCELLED'` dengan
menyimpan `cancellation_reason` dan mencatat `cancelled_by_user_id`.

---

## 9. Shift

Penanggung Jawab memiliki tanggung jawab utama dalam pengelolaan shift:

| Aksi Shift                          | Penanggung Jawab | Anggota Shift |
| :---------------------------------- | :--------------: | :-----------: |
| Buka Shift (Inisiasi Shift ID)      | ✅ (C)           | ❌ (X)        |
| Input Kontribusi Modal Awal         | ✅ (C)           | ✅ (C)        |
| Bergabung ke Shift Aktif            | ✅ (C)           | ✅ (C)        |
| Tutup Shift & Rekonsiliasi Kas      | ✅ (C)           | ❌ (X)        |
| Otorisasi Pengembalian Modal Awal   | ✅ (C/A)         | ✅ R saja     |

Aturan shift yang wajib dipatuhi:

- Hanya **SATU** sesi shift yang boleh berstatus `ACTIVE` pada satu waktu.
- Setiap sesi shift hanya boleh memiliki **SATU** Penanggung Jawab
  (`is_shift_leader = TRUE` hanya 1 baris per `shift_id`).
- Data historis shift **tidak boleh diubah** secara sembarangan setelah
  shift ditutup.
- Override penutupan shift oleh OWNER tetap dapat dilakukan kapan saja.

---

## 10. Pengeluaran

Berdasarkan `RBAC.md v0.4.0`, akses pencatatan pengeluaran oleh
Penanggung Jawab berstatus `[OPEN DECISION #2]` — keputusan ini belum
final dan harus ditentukan oleh Owner.

Jika permission diberikan, Penanggung Jawab dapat mencatat pengeluaran
operasional:
- Pembelian bahan baku FNB
- Pembelian ATK / perlengkapan
- Biaya operasional toko
- Pengeluaran lain-lain

Setiap pengeluaran wajib memiliki record lengkap:

| Field                  | Keterangan                         |
| :--------------------- | :--------------------------------- |
| `expense_id`           | UUID unik pengeluaran              |
| `shift_id`             | Shift ID terkait                   |
| `recorded_by_user_id`  | User ID yang mencatat              |
| `expense_category`     | Kategori pengeluaran               |
| `description`          | Keterangan detail pengeluaran      |
| `amount`               | Nominal pengeluaran (> 0)          |
| `expense_time`         | Waktu pencatatan                   |

Pengeluaran tunai yang dicatat akan mengurangi Saldo Kas Teoritis
shift berjalan.

---

## 11. Laporan

Penanggung Jawab dapat melihat laporan operasional yang relevan
dengan sesi shift yang dipimpinnya:

| Laporan                              | Penanggung Jawab | Anggota Shift |
| :----------------------------------- | :--------------: | :-----------: |
| Rekap kinerja diri sendiri & modal   | ✅ (R)           | ✅ (R)        |
| Seluruh transaksi shift aktif        | ✅ (R)           | ✅ (R)        |
| Pengeluaran shift aktif              | ✅ (R)           | ✅ (R)        |
| Laporan omzet & keuangan strategis   | ❌ (X)           | ❌ (X)        |
| Dashboard Owner & remote monitoring  | ❌ (X)           | ❌ (X)        |

Laporan strategis penuh (omzet historis, analitik bisnis, laporan
tahunan) tetap menjadi hak eksklusif OWNER.

---

## 12. Permission Lengkap (Berdasarkan RBAC.md v0.4.0)

| Modul & Fitur                           | Penanggung Jawab | Anggota Shift |
| :-------------------------------------- | :--------------: | :-----------: |
| **Pengelolaan Akun Pengguna**           | ❌ (X)           | ❌ (X)        |
| **Buka Shift**                          | ✅ (C)           | ❌ (X)        |
| **Input Kontribusi Modal Awal**         | ✅ (C)           | ✅ (C)        |
| **Bergabung ke Shift Aktif**            | ✅ (C)           | ✅ (C)        |
| **Tutup Shift & Rekonsiliasi Kas**      | ✅ (C)           | ❌ (X)        |
| **Otorisasi Pengembalian Modal**        | ✅ (C/A)         | ✅ (R)        |
| **Buat Transaksi Penjualan / Jasa**     | ✅ (C)           | ✅ (C)        |
| **Terima Pembayaran**                   | ✅ (C)           | ✅ (C)        |
| **Lihat Transaksi Sendiri**             | ✅ (R)           | ✅ (R)        |
| **Lihat Seluruh Transaksi Shift Aktif** | ✅ (R)           | ✅ (R)        |
| **Hapus Permanen Transaksi**            | ❌ DILARANG      | ❌ DILARANG   |
| **Pembatalan Transaksi (Refund)**       | `[OPEN DECISION #1]` | `[OPEN DECISION #1]` |
| **Kelola Master Produk & Harga**        | ✅ (R) saja      | ✅ (R) saja   |
| **Penyesuaian Stok Manual**             | ❌ (X)           | ❌ (X)        |
| **Lihat Log Riwayat Stok**             | ✅ (R)           | ✅ (R)        |
| **Catat Pengeluaran Operasional**       | `[OPEN DECISION #2]` | `[OPEN DECISION #2]` |
| **Lihat Pengeluaran Shift Aktif**       | ✅ (R)           | ✅ (R)        |
| **Dashboard Owner & Remote Monitoring** | ❌ (X)           | ❌ (X)        |
| **Laporan Omzet, Keuangan & Performa**  | ❌ (X)           | ❌ (X)        |
| **Rekap Kinerja Diri & Modal**          | ✅ (R)           | ✅ (R)        |
| **Lihat Audit Log Sistem**             | ❌ (X)           | ❌ (X)        |
| **Hapus Audit Log**                     | ❌ DILARANG      | ❌ DILARANG   |
| **Backup & Restore Database**           | ❌ (X)           | ❌ (X)        |

---

## 13. Larangan

PENANGGUNG JAWAB **TIDAK BOLEH**:

- Memiliki atau mewarisi hak OWNER
- Mengubah role akun miliknya sendiri menjadi OWNER
- Mengubah credential atau permission OWNER
- Menghapus akun OWNER
- Mengakses secret aplikasi atau environment variable server
- Melakukan Restore database
- Menghapus atau memodifikasi Audit Log
- Mengubah konfigurasi keamanan utama sistem
- Memberikan dirinya sendiri permission yang tidak ditetapkan
- Mengambil alih seluruh kontrol sistem
- Mengubah data historis shift yang telah ditutup secara sembarangan

---

## 14. Keamanan

**Prinsip utama:**

- Permission Penanggung Jawab HARUS diverifikasi di **backend**, bukan
  hanya melalui kondisi tampilan frontend.
- Jangan mengandalkan hidden menu sebagai mekanisme keamanan.
- Status `is_shift_leader` harus divalidasi server-side untuk setiap
  operasi yang membutuhkan hak PJ Shift.
- Frontend hanya digunakan untuk UX dan kemudahan tampilan.

**Contoh implementasi yang SALAH:**
```typescript
// ❌ SALAH - hanya menyembunyikan tombol di UI
if (isShiftLeader) {
  return <CloseShiftButton />;
}
```

**Contoh implementasi yang BENAR:**
```typescript
// ✅ BENAR - validasi di backend
// Frontend memanggil API -> backend memverifikasi
// shift_leader_user_id === current_user_id sebelum memproses
```

---

## 15. Aturan AI Agent

Jika AI Coding Agent menemukan implementasi yang **memberikan hak OWNER
kepada PENANGGUNG JAWAB**, maka:

1. **Jangan langsung mengubah kode.**
2. **Tandai sebagai konflik RBAC.**
3. **Identifikasi file dan baris kode yang bermasalah.**
4. **Jelaskan risiko konflik tersebut** (misalnya: eskalasi privilege,
   data integrity, security breach).
5. **Minta persetujuan Owner/Developer** sebelum melakukan perubahan.

AI tidak boleh memberikan permission tambahan kepada Penanggung Jawab
secara otomatis, bahkan jika alasannya terlihat logis atau efisien.

---

## 16. Open Decisions (Keputusan Belum Final)

Berdasarkan `BUSINESS-RULES.md v0.5.0` dan `RBAC.md v0.4.0`,
terdapat keputusan yang belum ditetapkan oleh Owner:

| ID          | Topik                                | Deskripsi Singkat                                              |
| :---------- | :----------------------------------- | :------------------------------------------------------------- |
| `[OD #1]`   | Otorisasi Pembatalan Transaksi       | Apakah PJ/Karyawan dapat langsung proses refund, atau butuh approval OWNER? |
| `[OD #2]`   | Otorisasi Pencatatan Pengeluaran     | Apakah PJ/Karyawan dapat langsung catat pengeluaran, atau butuh approval OWNER? |
| `[OD #3]`   | Pengembalian Modal saat Kas Kurang   | Mekanisme pengembalian modal karyawan jika saldo kas fisik minus saat closing. |

AI Agent tidak boleh mengimplementasikan Open Decisions di atas
tanpa ada keputusan resmi dari Owner.

---

## 17. Perbedaan Penanggung Jawab vs Karyawan Anggota

| Aspek                            | Penanggung Jawab (PJ Shift) | Anggota Shift |
| :------------------------------- | :-------------------------: | :-----------: |
| Role akun di database            | `KARYAWAN`                  | `KARYAWAN`    |
| `is_shift_leader` di shift_users | `TRUE`                      | `FALSE`       |
| Buka Shift                       | ✅                          | ❌            |
| Tutup Shift & Rekonsiliasi       | ✅                          | ❌            |
| Otorisasi Pengembalian Modal     | ✅ (C/A)                    | ✅ (R)        |
| Melakukan Transaksi              | ✅                          | ✅            |
| Lihat Seluruh Transaksi Shift    | ✅                          | ✅            |
| Backup & Restore                 | ❌                          | ❌            |
| Dashboard Owner                  | ❌                          | ❌            |
| Audit Log Sistem                 | ❌                          | ❌            |

---

## 18. Referensi Dokumen

| Dokumen            | Versi   | Keterangan                                    |
| :----------------- | :------ | :-------------------------------------------- |
| `RBAC.md`          | v0.4.0  | Matriks permission resmi sistem               |
| `BUSINESS-RULES.md`| v0.5.0  | Aturan bisnis termasuk konsep shift & PJ      |
| `DATABASE.md`      | v0.2.0  | Spesifikasi tabel `users`, `shifts`, `shift_users` |
| `ERD.md`           | v0.2.0  | Entity Relationship Diagram                   |
| `ROLE-OWNER.md`    | v1.0.0  | Dokumen referensi hak akses OWNER             |
| `AGENTS.md`        | -       | Panduan utama AI Agent                        |
