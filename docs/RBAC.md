# Role-Based Access Control (RBAC) - Blueprint Final

> **Status:** Final Approved Blueprint (Tahap C - Dengan Modal Multi-User)  
> **Versi:** 0.4.0  
> **Tanggal Revisi:** 14 Agustus 2026  

Dokumen ini mendefinisikan matriks hak akses, wewenang, dan permission eksplisit berdasarkan `BUSINESS-RULES.md v0.5.0` serta prinsip pengelolaan **Kas Berdasarkan Shift ID dengan Kontribusi Modal Multi-User**.

---

## 1. STRUKTUR ROLE & PENANGGUNG JAWAB SHIFT

- **Role Akun Permanen:** `OWNER` & `KARYAWAN` (Hanya 2 Role).
- **Status Sesi Shift:** Penanggung Jawab Shift (`shift_leader_user_id`) & Anggota Shift (`is_shift_leader = FALSE`).
- **Penunjukan PJ Shift:** 1 Karyawan ditunjuk sebagai PJ Shift saat Buka Shift (oleh Karyawan yang membuka shift atau dipilih Owner).

---

## 2. PRINSIP KAS BERDASARKAN SHIFT ID & KONTRIBUSI MODAL MULTI-USER

1. **Shared Cash Drawer:** Transaksi tunai & pengeluaran tunai dikelola 100% berbasis **`Shift ID`**. Tidak ada saldo kas penjualan per `User ID`.
2. **Multi-User Capital Contribution:**
   - 1 atau beberapa Karyawan/Owner dapat memasukkan modal awal kas pada `Shift ID` yang sama.
   - Hak Akses Input Modal Awal: `C` (Create kontribusi modal oleh Karyawan/Owner).
   - Hak Akses Lihat Rekap Pengembalian Modal: `R` (Read oleh Karyawan penyetor & PJ Shift), `A` (Otorisasi pengembalian oleh PJ Shift / Owner).

---

## 3. NOTASI EKSPLISIT HAK AKSES (PERMISSION MATRIX)

**Kode Permission:** `C` = Create | `R` = Read | `U` = Update | `D` = Delete | `A` = Approve/Override | `X` = Denied | `*` = Open Decision

| Modul & Fitur Sistem | Role OWNER | Karyawan: PJ Shift | Karyawan: Anggota Shift | Lingkup Data & Aturan Akses |
| :--- | :---: | :---: | :---: | :--- |
| **1. Pengelolaan Akun & Akses** | | | | |
| Kelola Akun Pengguna (User Management) | `C / R / U / D` | `X` | `X` | Khusus Owner |
| **2. Pengelolaan Shift, Kas & Modal** | | | | |
| Buka Shift (Inisiasi Sesi Shift ID) | `C` | `C` | `X` | Tentukan 1 PJ Shift saat Buka Shift |
| Input Kontribusi Modal Awal | `C` | `C` | `C` | Catat setoran modal per User ID ke Shift ID |
| Bergabung ke Sesi Shift Aktif | `C` | `C` | `C` | Bergabung sebagai Anggota pada Shift ID aktif |
| Tutup Shift & Rekonsiliasi Kas Bersama | `C / A` | `C` | `X` | Hitung Saldo Kas Teoritis 1 Laci Bersama |
| Otorisasi Pengembalian Modal Awal | `A` | `C / A` | `R` | Menyerahkan modal ke penyetor (`RETURNED`) |
| Override Penutupan Shift / Kas | `A` | `X` | `X` | Owner dapat me-closing kapan saja |
| **3. Transaksi POS & Pembayaran** | | | | |
| Buat Transaksi Penjualan / Jasa | `C` | `C` | `C` | Mencatat `created_by_user_id` pada transaksi |
| Terima Pembayaran (Tunai/Transfer/QRIS) | `C` | `C` | `C` | Uang tunai masuk ke Laci Kas Shift ID |
| Lihat Transaksi Sendiri di Shift Aktif | `R` | `R` | `R` | Filter per `created_by_user_id` kasir ybs |
| Lihat Seluruh Transaksi Shift Aktif | `R` | `R` | `R` | Read-only transaksi dalam 1 Shift ID |
| Hapus Permanen Transaksi | `X` | `X` | `X` | **DILARANG KERAS UNTUK SIAPAPUN** |
| Pembatalan Transaksi (Refund) | `C / U` | `*` | `*` | **[OPEN DECISION #1]** otorisasi refund |
| **4. Master Produk, Kategori & Stok** | | | | |
| Kelola Master Produk & Harga | `C / R / U / D` | `R` | `R` | Karyawan hanya bisa Read katalog |
| Penyesuaian Stok Manual (Adjustment) | `C / U` | `X` | `X` | Khusus Owner |
| Lihat Log Riwayat Stok (Stock Log) | `R` | `R` | `R` | Read-only pergerakan fisik barang |
| **5. Pengeluaran Operasional Toko** | | | | |
| Catat Pengeluaran Operasional | `C` | `*` | `*` | **[OPEN DECISION #2]** approval pengeluaran |
| Lihat Pengeluaran Shift Aktif | `R` | `R` | `R` | Mengurangi Saldo Kas Teoritis Shift ID |
| **6. Laporan & Dashboard Analytics** | | | | |
| Dashboard Owner & Remote Monitoring | `R` | `X` | `X` | Khusus Owner |
| Laporan Omzet, Keuangan & Performa | `R` | `X` | `X` | Khusus Owner |
| Rekap Kinerja Diri Sendiri & Modal | `R` | `R` | `R` | Read omzet & rincian pengembalian modal |
| **7. Audit Log & Backup System** | | | | |
| Lihat Audit Log Sistem | `R` | `X` | `X` | Khusus Owner (Read-Only) |
| Hapus Audit Log | `X` | `X` | `X` | **DILARANG KERAS UNTUK SIAPAPUN** |
| Backup & Restore Database | `C / R` | `X` | `X` | Khusus Owner |

---

## 4. OPEN DECISIONS (KEPUTUSAN TERBUKA OWNER)

1. **[OPEN DECISION #1] Otorisasi Pembatalan Transaksi (Refund):** Approval Owner vs Direct Input Kasir.
2. **[OPEN DECISION #2] Otorisasi Pengeluaran Kas Toko:** Approval Owner vs Direct Input Kasir.
3. **[OPEN DECISION #3] Pengembalian Modal saat Kas KURANG:** Mekanisme penanganan jika selisih kas fisik minus saat closing.
