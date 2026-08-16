# ARCHITECTURE DECISION RECORDS (ADR)
> **Sistem POS Kasir Usaha Campuran (FC/Printing & F&B)**

---

## ADR-001: Separation of Workspaces (Owner App vs Cashier POS)

- **Status:** APPROVED
- **Date:** 15 Agustus 2026
- **Context:** Tampilan antarmuka sebelumnya mencampurkan fitur analitik owner, testing teknis RBAC, dan register transaksi kasir dalam satu halaman navigasi tab horizontal.
- **Decision:** Memisahkan pengalaman pengguna menjadi 2 Workspace terisolasi:
  1. **Owner Workspace:** Navigasi Sidebar Kiri Slate dengan fitur Monitoring Omzet, Laporan, Manajemen Stok, Pengeluaran, Pegawai, Backup & Pengaturan.
  2. **Cashier Workspace:** Antarmuka Touchscreen-Friendly POS dengan Katalog Produk & Kategori di kiri (65%) serta Panel Keranjang & Fast Checkout di kanan (35%).
- **Consequences:** Kasir terlindungi dari gangguan informasi teknis/debug, transaksi kasir menjadi jauh lebih cepat, dan Owner mendapatkan antarmuka monitoring profesional sesuai mockup `UMKM Intel`.

---

## ADR-002: Realtime Event Engine via Server-Sent Events (SSE)

- **Status:** APPROVED
- **Date:** 15 Agustus 2026
- **Context:** Owner memerlukan pemantauan omzet & transaksi secara realtime tanpa harus menekan tombol refresh manual atau bergantung penuh pada HTTP polling berkala.
- **Decision:** Menggunakan **Server-Sent Events (SSE)** untuk memancarkan sinyal event ringan (`TRANSACTION_CREATED`, `SHIFT_CLOSED`, `STOCK_ALERT`) dari Express Backend ke Dashboard Owner.
- **Consequences:** Event diterima dalam hitungan milidetik. Database relasional tetap menjadi *Single Source of Truth*. Frontend mengimplementasikan *auto-reconnect* (exponential backoff) & *sync refetch* otomatis saat koneksi pulih.

---

## ADR-003: Migration from In-Memory Storage to ACID Relational Database

- **Status:** PROPOSED (Menunggu Pemilihan Engine DB oleh Owner)
- **Context:** In-Memory Repository berisiko kehilangan data total jika server Node.js restart atau mati listrik. Google Sheets tidak memenuhi syarat latensi & transaksi ACID untuk multi-kasir.
- **Decision:** Mengganti In-Memory Repository dengan Relational Database (PostgreSQL / Supabase atau SQLite WAL) yang menjamin transaksi ACID & pemulihan data.
- **Consequences:** Data transaksi aman, mendukung atomic stock lock, dan siap untuk skala multi-device.

---

## ADR-004: Multi-Karyawan dalam Satu Shift (`shift_members`)

- **Status:** APPROVED
- **Date:** 15 Agustus 2026
- **Context:** Satu shift toko dapat diisi oleh lebih dari 2 kasir/karyawan, bukan hanya 1 shift leader.
- **Decision:** Menambahkan tabel relasi `shift_members` yang mencatat daftar karyawan bertugas dalam shift aktif, serta mencatat `shift_id` dan `created_by_user_id` pada setiap entri transaksi.
- **Consequences:** Akuntabilitas transaksi tetap terjaga per individu kasir meskipun bertugas dalam shift yang sama.
