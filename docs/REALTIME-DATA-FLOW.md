# ALUR DATA REALTIME & INTEGRASI DATABASE (REALTIME DATA FLOW)

> **Status:** Spesifikasi Event & Sinkronisasi Stream  
> **Versi:** 1.0.0  
> **Tanggal:** 15 Agustus 2026  

Dokumen ini menjelaskan alur data real-time, interaksi antara **PostgreSQL Database** sebagai *Single Source of Truth*, dan **SSE (Server-Sent Events) Engine** yang menyinkronkan tampilan Dashboard Owner secara instant.

---

## 1. ALUR TRANSAKSI & PEMANCARAN EVENT (EVENT FLOW ARCHITECTURE)

```
[ Frontend Kasir POS ]
       │
       │ (1) POST /api/transactions
       ▼
[ Express API Controller ]
       │
       │ (2) BEGIN Transaction
       │     - Insert Transaction & Items
       │     - Update Stock & Record Movement
       │     - Update Shift Totals
       │     - Write Audit Log
       ▼
[ PostgreSQL Database ] ──► (3) COMMIT Transaction (Source of Truth Selesai)
       │
       │ (4) Sinyal Commit Sukses
       ▼
[ SSE Event Manager ] ──► (5) Broadcast SSE Event 'TRANSACTION_CREATED'
       │
       ▼ (6) HTTP Event Stream
[ Dashboard Owner UI ] ──► (7) Refetch Metrics API / Synchronize Realtime KPI
```

---

## 2. ATURAN INTEGRITAS ALUR REALTIME

1. **Database Commit Dulu, Event Kemudian:** Event real-time **TIDAK BOLEH** dipancarkan sebelum PostgreSQL mengonfirmasi transaksi telah di-commit secara sukses.
2. **Realtime Bukan Source of Truth:** Event SSE hanya berfungsi sebagai "sinyal pemicu" (notification signal) agar dashboard Owner melakukan sinkronisasi data. Frontend tidak boleh mengkalkulasi sendiri total omzet berdasarkan payload kasar tanpa validasi backend.
3. **Penyimpanan Event Stream Terpisah:** Kegagalan pengiriman SSE ke browser Owner yang sedang offline tidak membatalkan transaksi kasir yang sudah valid di database.

---

## 3. SPESIFIKASI EVENT SIGNAL & PAYLOAD

| Nama Event SSE | Pemicu (Trigger Action) | Payload Sinyal | Aksi Frontend Owner |
| :--- | :--- | :--- | :--- |
| `TRANSACTION_CREATED` | Transaksi POS berhasil diproses | `{ transaction_id, total, created_by, time }` | Refetch metrik harian & tambahkan baris feed transaksi terbaru |
| `SHIFT_CLOSED` | Kasir/PJ menutup shift | `{ shift_id, closed_by, actual_cash, variance }` | Refresh status shift aktif & tampilkan peringatan selisih kas |
| `SETTINGS_UPDATED` | Owner memperbarui profil/metode bayar | `{ updated_by, timestamp }` | Refresh konfig sistem & sync metode pembayaran |
| `STOCK_ADJUSTED` | Penyesuaian stok manual / barang habis | `{ product_id, stock_after }` | Update indikator stok fisik produk |

---

## 4. PENANGANAN KONEKSI TERPUTUS & RECONNECTION BACKOFF

1. **Auto Reconnect Algorithm:** Jika jaringan browser terputus dari SSE Stream (`/api/events`), client mengaktifkan Exponential Backoff Reconnection: **1s $\rightarrow$ 2s $\rightarrow$ 4s $\rightarrow$ 8s (Max 8s)**.
2. **Full Re-Sync Upon Reconnect:** Saat koneksi SSE pulih (`onopen`), hook client (`useDashboard`) secara otomatis mengeksekusi `fetchMetrics()` untuk menjamin data dashboard 100% konsisten dengan PostgreSQL terbaru.
