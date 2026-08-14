# 🏪 Sistem POS Usaha Campuran (FC / Printing & FNB)

Sistem Point of Sale (POS) modern, cepat, dan aman yang dirancang khusus untuk usaha campuran **Fotokopi/Printing/Jasa** dan **Food & Beverage (F&B)**.

---

## 🌟 Fitur Utama Sistem

1. **Multi-Unit Business Support (FC_PRINT & FNB):**
   - Mendukung pencatatan gabungan item **Barang Fisik** (dengan kelola stok) dan **Jasa** (misal: Fotokopi A4, Ketik, Desain).
2. **Sistem Shift Kasir & Laci Kas bersama:**
   - Fitur Buka Shift (modal awal kas), Shift Aktif, dan Tutup Shift dengan rekonsiliasi kas otomatis.
3. **Kasir Rapid Checkout (POS Register):**
   - Pencarian produk cepat, kategori bidang usaha, keranjang transaksi dinamis, dan metode bayar lengkap (Cash, QRIS, Transfer Bank).
4. **Keamanan Role & Hak Akses (RBAC):**
   - Proteksi ketat antara role **OWNER** (Akses Penuh: Dashboard, Stok, Laporan, Backup, Audit Log) dan **KARYAWAN** (Akses Kasir & Shift).
5. **Analitik Dashboard Owner:**
   - Omzet real-time, profit estimate, proporsi FC vs FNB, serta analisis produk terlaris (*Fast-Moving*) dan penjualan rendah (*Slow-Moving*).
6. **Ekspor PDF Laporan & Cetak Struk:**
   - Mesin cetak struk POS dan laporan resmi menggunakan *Native CSS Print Styles*.
7. **Pusat Backup & Restore Data:**
   - Unduh cadangan snapshot JSON database kapan saja dan pulihkan data secara instan.
8. **Immutable Audit Log System:**
   - Catatan log aktivitas krusial sistem yang aman dan tidak dapat diubah oleh siapapun.

---

## 🛠️ Arsitektur & Teknologi

- **Frontend:** React, TypeScript, Lucide React Icons, Vite.
- **Backend:** Node.js, Express.js, TypeScript, JSON Web Token (JWT), Bcrypt Password Hashing.
- **Pola Arsitektur:** Service-Repository Pattern (Modular Data Access Layer).

---

## 🚀 Panduan Memulai (Quickstart)

### Persyaratan Sistem:
- Node.js (v18+)
- NPM (v9+)
- Docker & Docker Compose *(Opsional untuk kontainerisasi)*

### 1. Menjalankan Server Backend (Development):
```bash
cd server
npm install
npm run dev
```
*Server akan berjalan di http://localhost:5000*

### 2. Menjalankan Client Frontend (Development):
```bash
cd client
npm install
npm run dev
```
*Client akan berjalan di http://localhost:5173*

### 3. Akun Testing Default:
- **Owner:** Username `owner` | Password `password123`
- **Karyawan 1:** Username `budi` | Password `password123`
- **Karyawan 2:** Username `siti` | Password `password123`

---

## 🐳 Deployment Menggunakan Docker

Gunakan Docker Compose untuk menjalankan aplikasi secara penuh dalam satu kontainer:

```bash
docker-compose up -d --build
```
*Aplikasi akan siap diakses di http://localhost:5000*

---

## 📄 Hak Cipta & Lisensi
Dikembangkan sesuai panduan utama [AGENTS.md](./AGENTS.md) untuk operasional POS Usaha Campuran yang aman, sederhana untuk kasir, dan mudah dipelihara oleh developer.
