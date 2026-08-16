# STRATEGI BACKUP & DISASTER RECOVERY DATABASE

> **Status:** Standard Operasional Keamanan Data  
> **Versi:** 1.0.0  
> **Tanggal:** 15 Agustus 2026  

Dokumen ini mendefinisikan arsitektur pencadangan data (backup) dua lapis (Two-Tier Backup Architecture) dan strategi pemulihan bencana (Disaster Recovery) untuk sistem POS.

---

## 1. DUA LAPIS ARSITEKTUR BACKUP (TWO-TIER ARCHITECTURE)

| Lapis Backup | Media Penyimpanan | Fungsi & Peran | Mekanisme |
| :--- | :--- | :--- | :--- |
| **Tier 1 (Utama)** | **PostgreSQL Database** | Primary Source of Truth & ACID Transactions | Auto WAL Archiving, `pg_dump` harian, Snapshot otomatis |
| **Tier 2 (Sekunder)** | **Google Sheets / Drive** | Ekspor Ringkasan, Analytical Reporting, Manual Export | Asynchronous Event Sync & Scheduled Nightly Job |

---

## 2. STRATEGI BACKUP PRIMER (POSTGRESQL)

### 2.1 Logical Backup Harian (`pg_dump`)
* Cronjob otomatis berjalan setiap pukul **02:00 WIB** (di luar jam operasional toko).
* Command eksekusi:
  ```bash
  pg_dump -U pos_user -h localhost -F c -b -v -f "/backups/pos_db_$(date +%Y%m%d_%H%M%S).dump" pos_kasir_db
  ```
* Retensi salinan backup simpan lokal: **30 Hari**.

### 2.2 Point-In-Time Recovery (PITR) & WAL Archiving
* PostgreSQL dikonfigurasikan dengan `wal_level = replica` dan `archive_mode = on`.
* File WAL (Write-Ahead Logging) diarsip secara kontinu ke penyimpanan aman cloud/Drive.
* Memungkinkan pemulihan data hingga detik terakhir sebelum terjadi kegagalan perangkat keras (Hardware Failure).

---

## 3. STRATEGI BACKUP SEKUNDER (GOOGLE SHEETS EXPORT)

### 3.1 Asynchronous Background Sync
* **Non-Blocking Rule:** Ekspor data ke Google Sheets berjalan secara **asynchronous (background event worker)**. Jika jaringan internet offline atau API Google Sheets error, transaksi di PostgreSQL **tetap sukses 100%**.
* Tab Google Sheets yang dituju:
  1. `Transactions_Export`
  2. `TransactionItems_Export`
  3. `Shifts_Export`
  4. `Expenses_Export`
  5. `StockMovements_Export`
  6. `AuditLogs_Export`

### 3.2 Retry Queue (Mekanisme Percobaan Ulang)
* Jika ekspor Google Sheets gagal (misal koneksi terputus), entri ditambahkan ke antrean `sheets_retry_queue` di backend server dan dicoba ulang secara otomatis setiap 15 menit saat koneksi pulih.

---

## 4. PROSEDUR PEMULIHAN DATA (RESTORATION PROCEDURE)

### 4.1 Pemulihan dari Dump PostgreSQL (Utama)
1. Hentikan aplikasi backend Express sementara.
2. Eksekusi restore database:
   ```bash
   pg_restore -U pos_user -d pos_kasir_db -v /backups/pos_db_target.dump
   ```
3. Verifikasi jumlah baris transaksi dan integritas relasi foreign key.
4. Jalankan kembali aplikasi backend.

### 4.2 Pemulihan dari Snapshot JSON / Backup Manual
Owner dapat mengunggah file JSON snapshot manual melalui panel **Pengaturan Sistem** (System Settings) yang akan me-restore data produk, kategori, dan stok secara atomik.
