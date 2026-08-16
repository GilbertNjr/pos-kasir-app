# ROLE KARYAWAN - POS KASIR USAHA CAMPURAN

> **Status:** Dokumen Referensi Resmi
> **Versi:** 1.0.0
> **Tanggal:** 15 Agustus 2026
> **Referensi:** RBAC.md v0.4.0 | BUSINESS-RULES.md v0.5.0 | DATABASE.md v0.2.0

---

## ⚠️ CATATAN SISTEM: KARYAWAN DAN STATUS SHIFT

Berdasarkan `RBAC.md v0.4.0` dan `BUSINESS-RULES.md v0.5.0`, sistem
**HANYA memiliki 2 role akun permanen**: `OWNER` dan `KARYAWAN`.

Seorang `KARYAWAN` dalam sesi shift dapat menempati satu dari dua posisi:

| Posisi                        | Kolom di `shift_users`    | Hak Tambahan                           |
| :---------------------------- | :------------------------ | :------------------------------------- |
| **Anggota Shift**             | `is_shift_leader = FALSE` | Tidak ada                              |
| **Penanggung Jawab Shift**    | `is_shift_leader = TRUE`  | Buka Shift, Tutup Shift, Rekonsiliasi  |

Dokumen ini membahas **hak akses dasar seorang `KARYAWAN` sebagai Anggota Shift**.
Hak tambahan sebagai Penanggung Jawab Shift dibahas dalam `ROLE-PENANGGUNG-JAWAB.md`.

---

## 1. Definisi

KARYAWAN adalah pengguna operasional yang fokus pada kegiatan kasir
dan pelayanan transaksi harian.

KARYAWAN bukan administrator sistem.

KARYAWAN tidak memiliki akses terhadap kontrol level OWNER.

Jumlah akun KARYAWAN bersifat dinamis — dapat ditambah atau
dinonaktifkan oleh OWNER sesuai kebutuhan operasional usaha.

Sistem tidak boleh menggunakan nama pengguna tetap seperti "Kasir 1"
atau "Kasir 2". Setiap karyawan memiliki akun unik dengan identitas
nyata (e.g., Budi, Siti, Rina).

Akun dengan status `INACTIVE` tidak dapat login ke sistem.

---

## 2. Tujuan

KARYAWAN hadir dalam sistem untuk:

1. Melayani transaksi pelanggan secara cepat dan akurat.
2. Menjaga akuntabilitas setiap transaksi atas nama individu yang
   melakukannya.
3. Mendukung shift multi-karyawan dengan identitas yang jelas per
   pengguna.
4. Mencatat pengeluaran operasional jika permission diberikan.
5. Memberikan data kinerja individu yang dapat dipantau Owner.

---

## 3. Dashboard Karyawan

Dashboard Karyawan harus **sederhana, cepat digunakan, dan fokus pada
pekerjaan kasir**. Toko dapat dalam kondisi ramai — setiap langkah
ekstra yang tidak perlu adalah hambatan.

Dashboard minimal menampilkan:

- Identitas karyawan yang sedang login
- Status shift (aktif / tidak aktif)
- Ringkasan transaksi shift hari ini (jumlah transaksi & total)
- Akses cepat ke halaman Kasir / Transaksi Baru
- Notifikasi penting (e.g., shift belum dibuka)

**Jangan tampilkan** kepada Karyawan:

- Panel administrasi OWNER
- Laporan keuangan strategis
- Manajemen pengguna
- Backup & Restore
- Audit Log sistem
- Panel debug, testing RBAC, atau API testing
- Informasi secret, environment variable, atau pesan developer

UI produksi harus bersih dan fokus pada pekerjaan kasir.

---

## 4. Transaksi

Karyawan adalah aktor utama dalam pembuatan transaksi.

Karyawan dapat:
- Memilih produk dari katalog aktif
- Menambahkan produk ke keranjang
- Mengubah jumlah item di keranjang
- Menghapus item dari keranjang
- Memilih metode pembayaran (CASH / TRANSFER / QRIS_MANUAL)
- Memasukkan nominal uang diterima (untuk CASH)
- Melihat perhitungan kembalian secara otomatis
- Menyelesaikan transaksi
- Melihat bukti / ringkasan transaksi yang baru diselesaikan

Setiap transaksi yang dibuat wajib mencatat:

| Field                 | Keterangan                                   |
| :-------------------- | :------------------------------------------- |
| `transaction_id`      | UUID unik transaksi                          |
| `transaction_number`  | Nomor transaksi (e.g., TRX-20260815-001)     |
| `shift_id`            | Shift ID saat transaksi dilakukan            |
| `created_by_user_id`  | User ID karyawan yang memproses transaksi    |
| `payment_method`      | CASH / TRANSFER / QRIS_MANUAL               |
| `status`              | COMPLETED / CANCELLED                        |
| `transaction_time`    | Waktu transaksi                              |

**Aturan integritas transaksi:**

- Transaksi `COMPLETED` **TIDAK BOLEH dihapus secara permanen**.
- Pembatalan hanya mengubah `status` menjadi `'CANCELLED'` dengan
  `cancellation_reason` dan dicatat di Audit Log.
- Setiap transaksi terikat pada `created_by_user_id` untuk pelaporan
  kinerja individu. Transaksi beberapa karyawan dalam satu shift tidak
  boleh digabung menjadi satu identitas.

---

## 5. Shift

Karyawan harus bekerja dalam konteks shift aktif.

**Alur standar Karyawan (Anggota Shift):**

```
LOGIN
  ↓
BERGABUNG KE SHIFT AKTIF
  ↓
MELAKUKAN TRANSAKSI
  ↓
[SHIFT DITUTUP OLEH PENANGGUNG JAWAB / OWNER]
```

**Alur standar Karyawan (jika ditunjuk sebagai Penanggung Jawab):**

```
LOGIN
  ↓
BUKA SHIFT (Inisiasi Shift ID baru)
  ↓
MELAKUKAN TRANSAKSI
  ↓
TUTUP SHIFT & REKONSILIASI KAS
```

**Aturan wajib:**

- Karyawan **tidak boleh** melakukan transaksi tanpa shift aktif.
- Hanya **SATU** shift yang boleh berstatus `ACTIVE` pada satu waktu.
- Kontribusi modal awal (`shift_capital_contributions`) dapat dilakukan
  oleh satu atau beberapa karyawan dalam shift yang sama.

Akses shift berdasarkan posisi:

| Aksi Shift                     | Penanggung Jawab | Anggota Shift |
| :----------------------------- | :--------------: | :-----------: |
| Buka Shift                     | ✅ (C)           | ❌ (X)        |
| Input Kontribusi Modal Awal    | ✅ (C)           | ✅ (C)        |
| Bergabung ke Shift Aktif       | ✅ (C)           | ✅ (C)        |
| Tutup Shift & Rekonsiliasi     | ✅ (C)           | ❌ (X)        |
| Otorisasi Pengembalian Modal   | ✅ (C/A)         | ✅ (R) saja   |

---

## 6. Produk

Karyawan dapat melihat katalog produk aktif yang tersedia untuk
dijual melalui antarmuka kasir.

**Karyawan TIDAK BOLEH:**

- Membuat produk baru (CRUD Master Produk)
- Mengubah nama, harga, atau kategori produk
- Mengubah status aktif/nonaktif produk
- Menghapus produk

Akses baca produk diperlukan untuk melayani transaksi, namun akses
tulis terhadap master produk adalah hak eksklusif OWNER.

---

## 7. Stok

Karyawan **tidak memiliki hak melakukan stock adjustment manual**.

| Aksi Stok                        | Karyawan   |
| :-------------------------------- | :--------: |
| Lihat stok saat ini               | ✅ (R)     |
| Lihat log riwayat stok            | ✅ (R)     |
| Penyesuaian stok manual           | ❌ (X)     |

**Pengurangan stok dari transaksi** harus dilakukan secara **otomatis
oleh sistem** sesuai aturan bisnis — bukan oleh input manual karyawan.

Aturan stok otomatis:
- Transaksi `COMPLETED` → stok produk fisik (`manage_stock = TRUE`)
  berkurang secara otomatis.
- Transaksi `CANCELLED` → stok dikembalikan secara otomatis.
- Jasa (`manage_stock = FALSE`) tidak memengaruhi stok.

---

## 8. Pengeluaran

Secara **default**, Karyawan tidak memiliki akses untuk mencatat
pengeluaran operasional.

Berdasarkan `RBAC.md v0.4.0`, akses pencatatan pengeluaran oleh
Karyawan berstatus **`[OPEN DECISION #2]`** — keputusan ini belum
final dan harus ditentukan oleh Owner.

Jika permission diberikan secara eksplisit oleh Owner:

- Karyawan dapat mencatat pengeluaran operasional shift berjalan.
- Karyawan **hanya dapat melihat** pengeluaran milik shift aktif —
  bukan pengeluaran historis keseluruhan.
- Setiap pengeluaran yang dicatat wajib memiliki:

| Field                 | Keterangan                         |
| :-------------------- | :--------------------------------- |
| `expense_id`          | UUID unik pengeluaran              |
| `shift_id`            | Shift ID terkait                   |
| `recorded_by_user_id` | User ID karyawan yang mencatat     |
| `expense_category`    | Kategori pengeluaran               |
| `description`         | Keterangan detail                  |
| `amount`              | Nominal (> 0)                      |
| `expense_time`        | Waktu pencatatan                   |

Semua pengeluaran yang dicatat oleh Karyawan harus masuk ke Audit Log.

---

## 9. Laporan

Karyawan hanya dapat melihat informasi yang relevan dengan operasional
mereka dalam shift berjalan.

| Laporan                                 | Karyawan     |
| :-------------------------------------- | :----------: |
| Transaksi miliknya di shift aktif       | ✅ (R)       |
| Seluruh transaksi shift aktif           | ✅ (R)       |
| Pengeluaran shift aktif                 | ✅ (R)       |
| Rekap kinerja diri sendiri & modal      | ✅ (R)       |
| Laporan omzet & keuangan strategis      | ❌ (X)       |
| Dashboard Owner & remote monitoring     | ❌ (X)       |
| Laporan historis seluruh shift          | ❌ (X)       |
| Laporan performa seluruh karyawan       | ❌ (X)       |

Karyawan tidak boleh melihat laporan keuangan bisnis secara penuh
kecuali ada keputusan eksplisit dari Owner yang mengubah permission.

---

## 10. Permission Lengkap (Berdasarkan RBAC.md v0.4.0)

| Modul & Fitur                           | Karyawan (Anggota Shift)     |
| :-------------------------------------- | :--------------------------: |
| **Pengelolaan Akun Pengguna**           | ❌ (X)                       |
| **Buka Shift**                          | ❌ (X)                       |
| **Input Kontribusi Modal Awal**         | ✅ (C)                       |
| **Bergabung ke Shift Aktif**            | ✅ (C)                       |
| **Tutup Shift & Rekonsiliasi Kas**      | ❌ (X)                       |
| **Otorisasi Pengembalian Modal**        | ✅ (R) saja                  |
| **Buat Transaksi Penjualan / Jasa**     | ✅ (C)                       |
| **Terima Pembayaran**                   | ✅ (C)                       |
| **Lihat Transaksi Sendiri**             | ✅ (R)                       |
| **Lihat Seluruh Transaksi Shift Aktif** | ✅ (R)                       |
| **Hapus Permanen Transaksi**            | ❌ DILARANG KERAS            |
| **Pembatalan Transaksi (Refund)**       | `[OPEN DECISION #1]`         |
| **Kelola Master Produk & Harga**        | ✅ (R) saja                  |
| **Penyesuaian Stok Manual**             | ❌ (X)                       |
| **Lihat Log Riwayat Stok**             | ✅ (R)                       |
| **Catat Pengeluaran Operasional**       | `[OPEN DECISION #2]`         |
| **Lihat Pengeluaran Shift Aktif**       | ✅ (R)                       |
| **Dashboard Owner & Remote Monitoring** | ❌ (X)                       |
| **Laporan Omzet, Keuangan & Performa**  | ❌ (X)                       |
| **Rekap Kinerja Diri & Modal**          | ✅ (R)                       |
| **Lihat Audit Log Sistem**             | ❌ (X)                       |
| **Hapus Audit Log**                     | ❌ DILARANG KERAS            |
| **Backup & Restore Database**           | ❌ (X)                       |

---

## 11. Larangan

Karyawan **TIDAK BOLEH**:

- Mengakses Dashboard Owner
- Mengakses fitur Backup & Restore
- Melihat atau memodifikasi Audit Log sistem
- Mengubah role akun miliknya sendiri
- Mengubah permission akun manapun
- Mengelola (tambah/ubah/hapus) akun pengguna lain
- Melihat credential (password hash) pengguna lain
- Membuat akun dengan role OWNER
- Mengubah master produk, harga, atau kategori
- Melakukan stock adjustment secara manual/administratif
- Menghapus transaksi secara permanen
- Menghapus Audit Log
- Mengakses secret aplikasi atau environment variable server
- Mengakses panel debug, testing RBAC, atau informasi internal sistem

---

## 12. Keamanan

**Prinsip utama:**

- Semua permission Karyawan **HARUS diverifikasi di backend**, bukan
  hanya melalui kondisi tampilan frontend.
- Frontend tidak boleh menjadi satu-satunya mekanisme keamanan.

**Contoh yang SALAH:**
```typescript
// ❌ SALAH - menyembunyikan tombol saja tidak cukup
{user.role === 'OWNER' && <BackupButton />}
```

**Contoh yang BENAR:**
```typescript
// ✅ BENAR - backend menolak request tanpa hak akses yang valid
// Endpoint /api/backup harus memverifikasi role === 'OWNER'
// sebelum memproses, terlepas dari apakah tombol tampil atau tidak
```

**Aturan lanjutan:**

- Jangan tampilkan UI debug, panel testing RBAC, atau informasi
  developer di lingkungan produksi yang diakses Karyawan.
- Token autentikasi Karyawan hanya berlaku untuk operasi yang
  memang diizinkan oleh matriks permission.
- Backend harus menolak setiap request yang tidak sesuai permission,
  bahkan jika request datang dari token yang valid.

---

## 13. Open Decisions (Keputusan Belum Final)

Terdapat keputusan yang belum ditetapkan oleh Owner yang berdampak
pada permission Karyawan:

| ID          | Topik                                | Status         |
| :---------- | :----------------------------------- | :------------- |
| `[OD #1]`   | Otorisasi Pembatalan Transaksi       | Belum diputuskan |
| `[OD #2]`   | Otorisasi Pencatatan Pengeluaran     | Belum diputuskan |
| `[OD #3]`   | Pengembalian Modal saat Kas Kurang   | Belum diputuskan |

AI Agent dan Developer **tidak boleh mengimplementasikan** Open
Decisions di atas tanpa keputusan resmi dari Owner.

---

## 14. Aturan AI Agent

Jika AI Coding Agent menemukan bahwa Karyawan memiliki akses **lebih
tinggi** daripada yang ditentukan dalam dokumen ini:

1. **Jangan langsung memperbaiki kode.**
2. **Identifikasi konflik** — catat deskripsi konflik yang ditemukan.
3. **Identifikasi endpoint terkait** — API endpoint mana yang terpengaruh.
4. **Identifikasi middleware terkait** — middleware autentikasi/otorisasi mana yang terdampak.
5. **Identifikasi frontend terkait** — komponen atau halaman mana yang menampilkan akses berlebih.
6. **Jelaskan risiko** — apa dampak keamanan atau integritas data jika dibiarkan.
7. **Tunggu persetujuan** dari Owner/Developer sebelum melakukan perubahan.

AI tidak boleh memberikan permission tambahan kepada Karyawan secara
otomatis, bahkan jika terlihat logis atau efisien untuk operasional.

---

## 15. Referensi Dokumen

| Dokumen                    | Versi   | Keterangan                                    |
| :------------------------- | :------ | :-------------------------------------------- |
| `RBAC.md`                  | v0.4.0  | Matriks permission resmi sistem               |
| `BUSINESS-RULES.md`        | v0.5.0  | Aturan bisnis termasuk konsep shift & karyawan |
| `DATABASE.md`              | v0.2.0  | Spesifikasi tabel `users`, `shifts`, `shift_users` |
| `ERD.md`                   | v0.2.0  | Entity Relationship Diagram                   |
| `ROLE-OWNER.md`            | v1.0.0  | Dokumen referensi hak akses OWNER             |
| `ROLE-PENANGGUNG-JAWAB.md` | v1.0.0  | Dokumen referensi Penanggung Jawab Shift      |
| `AGENTS.md`                | -       | Panduan utama AI Agent                        |
