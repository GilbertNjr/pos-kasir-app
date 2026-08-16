# ATURAN KEAMANAN & KERAHASIAAN DATA (SECURITY & DATA PRIVACY RULES)

> **Status:** Aturan Keamanan Sistem Mutlak  
> **Versi:** 1.0.0  
> **Tanggal:** 15 Agustus 2026  

Dokumen ini mendefinisikan aturan keamanan data, proteksi kredensial, enkripsi kata sandi, dan batasan privasi informasi pada seluruh lapisan arsitektur Sistem POS.

---

## 1. PENGELOLAAN KATA SANDI & KREDENSIAL (PASSWORD SECURITY)

1. **Dilarang Simpan Plaintext:** Kata sandi pengguna **DILARANG HARAM** disimpan dalam bentuk teks biasa (plaintext) di database, file log, maupun memori sementara.
2. **Standard Hashing Bcrypt:** Seluruh password wajib di-hash menggunakan algoritma **Bcrypt** dengan salt round minimal **10** sebelum disimpan ke kolom `users.password_hash`.
3. **Secret Isolation:** Environment Variables (file `.env`) digunakan untuk menyimpan JWT Secret, Database Password, dan GCP Service Account Keys. File `.env` **wajib masuk ke `.gitignore`** dan tidak boleh di-commit ke Git repository.

---

## 2. ATURAN PENYARINGAN & MASKING DATA (DATA MASKING RULES)

1. **Eksklusi Data Sensitif ke Google Sheets:**
   - Kolom `password_hash`, `token`, `secret`, `jwt_key`, dan `credit_card_cvv` **SANGAT DILARANG** diekspor atau dikirim ke Google Sheets / Drive sekunder.
2. **Pembersihan Log Audit:**
   - Tabel `audit_logs` dan log server console tidak boleh mencatat isi payload yang mengandung password atau token otentikasi.

---

## 3. AMAN DI BACKEND, BUKAN HANYA FRONTEND (BACKEND ACCESS CONTROL)

1. **Pemeriksaan Hak Akses (RBAC) di Middleware Backend:**
   - Penyembunyian tombol di UI (frontend) hanya untuk kenyamanan tampilan (UX).
   - Seluruh keamanan otorisasi wajib diverifikasi ulang di backend Express middleware (`requireOwner`, `requireRole`, `requirePermission`).
2. **Sanitasi Input & SQL Injection Prevention:**
   - Seluruh query database PostgreSQL wajib menggunakan **Parameterized Queries** atau ORM/Query Builder terpercaya untuk mencegah kerentanan SQL Injection.

---

## 4. KEAMANAN SINKRONISASI REALTIME & DATABASE

1. **Protected SSE Endpoint:** Endpoint `/api/events` wajib memverifikasi JWT token sebelum mengizinkan stream pesan real-time dibuka.
2. **Database SSL Encryption:** Koneksi antara aplikasi backend Node.js dan database PostgreSQL di lingkungan produksi (production) wajib menggunakan **TLS/SSL Encryption** (`sslmode=require`).
