# FUTURE_ROADMAP.md - Rencana Pengembangan Masa Depan (Future Enhancements)

Dokumen ini mencatat blueprint teknis, ide fitur canggih, dan arsitektur pengembangan masa depan untuk Sistem POS Usaha Campuran (FC/Printing & FNB).
Seluruh ide di dalam dokumen ini telah dirancang secara modular sehingga dapat diimplementasikan kapan saja tanpa mengganggu fitur utama di versi produksi.

---

## 📌 1. Notifikasi WhatsApp & Telegram Automatis Owner (Owner Shift Bot)

### 🎯 Tujuan & Konsep
Mengirimkan laporan ringkasan omzet, rekonsiliasi kas, selisih kasir, serta lampiran dokumen PDF Laporan Shift secara otomatis ke nomor WhatsApp/Telegram Owner setiap kali kasir menutup shift.

### 📐 Cetak Biru Arsitektur Teknis
1. **Trigger Point**: Dieksekusi di `ShiftService.ts` pada method `closeShift(...)`.
2. **Background Worker**: Dijalankan secara *asynchronous* (`try...catch` terisolasi) sehingga tidak akan memperlambat atau menggagalkan proses tutup shift kasir jika terjadi kendala jaringan WhatsApp.
3. **Penyedia Gateway**:
   - **WhatsApp**: Menggunakan Provider WhatsApp Gateway (Fonnte / Wablas / Waha API).
   - **Telegram**: Menggunakan Telegram Bot API (`sendMessage` & `sendDocument` - 100% Gratis).

### 📩 Format Pesan WhatsApp Automatis
```text
📊 REKAPITULASI SHIFT DITUTUP 📊
Toko: POS Kasir Usaha
Shift: Shift Pagi (08:00 - 16:00 WIB)
PJ Shift: Budi (Kasir)

💰 Total Omzet: Rp 1.450.000
----------------------------------------
• Cash: Rp 1.000.000 (12 Transaksi)
• QRIS: Rp 300.000 (4 Transaksi)
• Transfer: Rp 150.000 (1 Transaksi)

💵 Rekonsiliasi Uang Kas:
• Modal Kas Awal: Rp 200.000
• Pengeluaran Kas: Rp 50.000
• Uang Kas Teori: Rp 1.150.000
• Uang Kas Fisik: Rp 1.150.000
• Selisih Kasir: Rp 0 (PAS ✅)

📄 Dokumen PDF Laporan Shift lengkap terlampir di bawah.
```

---

## 📌 2. Analisis Prediksi Restock Barang (AI Smart Inventory Forecasting)

### 🎯 Tujuan & Konsep
Memberikan rekomendasi belanja otomatis di Dashboard Owner berdasarkan kecepatan transaksi produk (*Burn Rate*) dalam 7-30 hari terakhir.

### 📐 Fitur Utama
- Indikator "Stok Kritis": Mengirim peringatan saat stok produk mendekati *Reorder Point*.
- Estimasi Hari Habis: *"Stok Es Krim Chocolate diperkirakan habis dalam 2 hari lagi. Disarankan beli 30 Pcs."*

---

## 📌 3. Laporan Keuntungan Bersih Presisi (Net Profit & HPP Analytics)

### 🎯 Tujuan & Konsep
Menghitung laba bersih (*Net Profit*) secara presisi dengan memotong Harga Pokok Penjualan (HPP / Modal) dan Total Pengeluaran Kasir (`total_cash_expenses`).

---

## 📌 4. Scan Barcode Kamera HP & Cetak Label Barcode

### 🎯 Tujuan & Konsep
Memungkinkan kasir memindai barcode barang ATK/Snack menggunakan kamera bawaan HP/Tablet tanpa perlu membeli mesin pemindai barcode fisik tambahan.

---

## 📌 5. Integrasi Dynamic QRIS Webhook (Auto-Settlement)

### 🎯 Tujuan & Konsep
Menampilkan kode QRIS dinamis di layar kasir sesuai nominal persis nota transaksi, dan secara otomatis mengubah status nota menjadi `LUNAS` begitu pembayaran terverifikasi oleh gateway perbankan.

---
*Dokumen ini dibuat dan disimpan permanen pada rilis v1.8.0 untuk referensi pengembangan mendatang.*
