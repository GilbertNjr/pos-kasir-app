# System Architecture & Technology Benchmark (ARCHITECTURE.md) - Draft

> **Status:** Draft (Tahap E - Menunggu Review & Persetujuan Pengguna)  
> **Versi:** 0.1.0  
> **Tanggal:** 14 Agustus 2026  

Dokumen ini mendefinisikan arsitektur sistem, strategi abstraksi lapisan data, analisis perbandingan (*benchmark*) teknologi, keamananan kredensial, serta alur migrasi database untuk Sistem POS Usaha Campuran (FC/Printing & FNB).

---

## 1. ARSITEKTUR TIGA TINGKAT (3-TIER ARCHITECTURE)

Sistem dirancang menggunakan arsitektur 3-tier yang modular untuk memastikan pemisahan tanggung jawab (*Separation of Concerns*), kemudahan pemeliharaan (*Maintainability*), dan fleksibilitas pengembangan.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                            1. PRESENTATION LAYER                             │
│       (UI POS Kasir Counter, Mobile Responsive Web, Owner Dashboard)         │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │ HTTP / REST API (JSON)
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                               2. SERVICE LAYER                               │
│  (Business Logic Engine, Auth Guard, Shift Manager, Transaction Processor,   │
│            Capital Manager, Expense Manager, Analytics & Reporting)          │
└──────────────────────────────────────┬───────────────────────────────────────┘
                                       │ Repository Interface (DAL)
                                       ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                              3. DATA ACCESS LAYER                            │
│                 (Modular Storage Abstraction Layer)                          │
│                                                                              │
│    ┌──────────────────────────────────┐  ┌────────────────────────────────┐  │
│    │ GoogleSheetsRepositoryAdapter    │  │ PostgreSQLRepositoryAdapter    │  │
│    │ (Penyimpanan Awal / Phase 1 MVP) │  │ (Skala Lanjut / Phase 2 Production)│
│    └──────────────────────────────────┘  └────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 1.1 Presentation Layer (Frontend / UI)
- Bertanggung jawab menampilkan antarmuka kasir yang cepat, responsif, dan mudah digunakan di toko (*Fast Counter Experience*).
- Menampilkan Katalog Produk & Jasa, Keranjang Belanja, Form Input Modal Awal, Form Pembayaran, Form Pengeluaran, serta Dashboard Monitoring Owner.
- **TIDAK BOLEH** menyimpan logika bisnis, rumus kalkulasi kas, atau kunci rahasia (*secrets/credentials*).

### 1.2 Service Layer (Backend / API Logic)
- Bertanggung jawab memproses seluruh aturan bisnis (*Business Rules Validation*), otentikasi pengguna, otorisasi role RBAC, manajemen sesi shift & PJ shift, kalkulasi Saldo Kas Teoritis Bersama, dan pencatatan audit log.
- Menyediakan endpoint REST API yang bersih dan terisolasi.

### 1.3 Data Access Layer / DAL (Penyimpanan Data)
- Menyediakan interface data (`IRepository`) yang mengabstraksi seluruh operasi CRUD ke media penyimpanan data.
- **Fase 1 (MVP):** Menggunakan `GoogleSheetsAdapter` (Google Sheets API v4 + Service Account).
- **Fase 2 (Production):** Menggunakan `PostgreSQLAdapter` / `SupabaseAdapter` tanpa perlu mengubah baris kode pada Presentation Layer maupun Service Layer.

---

## 2. BENCHMARK & ANALISIS PERBANDINGAN TEKNOLOGI

Berikut adalah analisis perbandingan opsi teknologi untuk menentukan stack MVP yang paling optimal, cepat, dan mudah dipelihara:

### 2.1 Benchmark Opsi Framework Frontend
| Framework | Kelebihan | Kekurangan | Rekomendasi POS |
| :--- | :--- | :--- | :---: |
| **Vite + React (SPA)** | Instant Build/HMR, performa render super cepat, tanpa overhead SSR, cocok untuk PWA kasir toko. | Perlu konfigurasi routing client-side (React Router). | **SANGAT DIREKOMENDASIKAN** |
| **Next.js (App Router)** | Fullstack terintegrasi, Server Components, API routes bawaan. | Rendering SSR/RSC bisa menambah latency kecil pada kasir lokal jika koneksi lambat. | **ALTERNATIF UTAMA** |
| **Vanilla HTML + JS** | Tanpa bundler, sangat ringan. | Sulit mengelola state keranjang belanja & form modal multi-karyawan yang kompleks. | Tidak Direkomendasikan |

### 2.2 Benchmark Opsi Framework Backend / API
| Framework | Kelebihan | Kekurangan | Rekomendasi POS |
| :--- | :--- | :--- | :---: |
| **Node.js (Express / Fastify)** | Ringan, ekosistem JavaScript/TypeScript luas, integrasi SDK Google APIs sangat matang. | Perlu setup server terpisah jika tidak di-host di serverless. | **SANGAT DIREKOMENDASIKAN** |
| **Next.js API Routes** | Backend & Frontend dalam 1 repository tunggal (*Monorepo*), kemudahan deployment. | Cold start pada serverless hosting gratisan. | **ALTERNATIF UTAMA** |

### 2.3 Benchmark Opsi Penyimpanan Data Layer
| Media Penyimpanan | Kelebihan | Kekurangan | Status Penggunaan |
| :--- | :--- | :--- | :---: |
| **Google Sheets API** | Bebas biaya database server, mudah diinspeksi manual oleh Owner via browser. | Kuota rate limit API (60 req/min/user), tidak ada ACID transaction native. | **Fase 1 (Penyimpanan Awal MVP)** |
| **PostgreSQL / Supabase** | Performa tinggi, mendukung relational ACID transaction, indeks cepat, real-time trigger. | Memerlukan setup database instance. | **Fase 2 (Migrasi Masa Depan)** |

---

## 3. KEPUTUSAN ARSITEKTUR KUNCI (MVP STACK DECISION)

Berdasarkan analisis kebutuhan operasional toko dan kemudahan pemeliharaan:

1. **Frontend Stack:** **Vite + React (TypeScript) + Vanilla CSS / CSS Modules**.
   - *Alasan:* Render antarmuka kasir super responsif, ringan, dan mendukung UI modern dengan cepat.
2. **Backend Stack:** **Node.js + Express (TypeScript)** atau **Next.js Fullstack Monorepo**.
   - *Alasan:* Type safety penuh dari DTO hingga Repository Layer.
3. **Data Layer Stack:** **Google Sheets API v4 (Google APIs Client Library)** via `Repository Pattern`.
   - *Alasan:* Sesuai ketentuan `AGENTS.md` Tahap 1, Google Sheets digunakan sebagai database sementara awal.

---

## 4. STRATEGI & ALUR MIGRASI DATABASE (FUTURE MIGRATION PLAN)

Arsitektur dirancang agar transisi dari Google Sheets ke PostgreSQL/Supabase dapat dilakukan **tanpa merusak Frontend maupun Service Layer**:

```
                       ┌─────────────────────────┐
                       │   IService / UseCases   │
                       └────────────┬────────────┘
                                    │ Calls IShiftRepository
                                    ▼
                       ┌─────────────────────────┐
                       │    IShiftRepository     │  <--- Interface Kontrak Data
                       └────────────┬────────────┘
                                    │
           ┌────────────────────────┴────────────────────────┐
           │ IMPLEMENTASI FASE 1                             │ IMPLEMENTASI FASE 2
           ▼                                                 ▼
┌──────────────────────────┐                      ┌──────────────────────────┐
│ GoogleSheetsShiftAdapter │                      │ PostgreSQLShiftAdapter   │
│ (Google Sheets API)      │                      │ (Prisma / Drizzle ORM)   │
└──────────────────────────┘                      └──────────────────────────┘
```

### Langkah Migrasi Database (Fase 2):
1. Buat skema tabel di PostgreSQL / Supabase sesuai spesifikasi `DATABASE.md v0.2.0`.
2. Buat kelas adapter baru `PostgreSQLShiftAdapter`, `PostgreSQLTransactionAdapter`, dll. yang mengimplementasikan `IRepository` interface.
3. Jalankan script *data migration* satu kali untuk memindahkan data historis dari Google Sheets ke PostgreSQL.
4. Ubah konfig Injeksi Dependensi (*Dependency Injection*) backend dari Google Sheets Adapter ke PostgreSQL Adapter.
5. **Frontend dan Service Logic 100% tidak perlu diubah.**

---

## 5. KEAMANAN KREDENSIAL & RAHASIA (SECURITY ARCHITECTURE)

1. **Proteksi Kredensial Frontend:**
   - **DILARANG KERAS** menyimpan Google Service Account JSON, API Keys, JWT Secrets, atau Password Hash di dalam source code Frontend (Vite/React).
   - Seluruh panggilan ke Google Sheets API dilakukan secara eksklusif oleh **Service Layer (Backend)**.
2. **Pengelolaan Environment Variables:**
   - Kredensial disimpan di file `.env` di sisi server (tidak di-commit ke Git / `.gitignore` aktif).
   - Penggunaan kredensial diakses via `process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL`, `process.env.GOOGLE_PRIVATE_KEY`, dll.
3. **Keamanan Kata Sandi:**
   - Password pengguna di-hash menggunakan algoritma **Bcrypt** (Salt factor minimum 10) sebelum disimpan ke data layer.
4. **Otentikasi & Sesi:**
   - Menggunakan token terenkripsi (JWT) yang disimpan pada **HTTP-Only Secure Cookie** untuk mencegah serangan XSS (*Cross-Site Scripting*).

---

## 6. PERENCANAAN BACKUP & RESTORE DATA

1. **Backup Otomatis (Google Drive Backup):**
   - Mengingat Fase 1 menggunakan Google Sheets, sistem secara berkala (misal: setiap kali Tutup Shift selesai) membuat duplikat file Google Sheet (*Snapshot*) ke folder Google Drive Backup Owner.
2. **Backup Manual (Owner Export):**
   - Owner dapat mengunduh seluruh data dalam format spreadsheet (`.xlsx` / `.csv`) atau JSON melalui Dashboard Owner.
3. **Mekanisme Restore Data:**
   - Owner dapat memilih file snapshot backup dari Google Drive untuk memulihkan (*restore*) kondisi data jika terjadi kesalahan operasional berat.

---

## NEXT STEPS (ALUR TAHAPAN BERIKUTNYA)

Setelah dokumen `ARCHITECTURE.md` ini ditinjau dan disetujui, alur analisis blueprint Tahap 1 selesai dan kita siap menyusun **TAHAP F: Final System Documentation & Checklist Blueprint Approval** sebelum melangkah ke implementasi project structure.
