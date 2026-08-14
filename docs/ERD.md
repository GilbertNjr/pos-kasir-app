# Entity Relationship Diagram (ERD) - Draft

> **Status:** Draft (Tahap D - Dengan Entitas Kontribusi Modal Multi-User)  
> **Versi:** 0.2.0  
> **Tanggal:** 14 Agustus 2026  

Dokumen ini menjelaskan rancangan entitas data dan hubungan antar entitas untuk Sistem POS Usaha Campuran (FC/Printing & FNB), termasuk entitas baru `SHIFT_CAPITAL_CONTRIBUTIONS` untuk mencatat modal awal dari beberapa karyawan.

---

## 1. DIAGRAM MERMAID ERD

```mermaid
erDiagram
    USERS ||--o{ SHIFTS : "buka_atau_tutup"
    USERS ||--o{ SHIFTS : "jadi_pj_shift"
    USERS ||--o{ SHIFT_USERS : "berpartisipasi"
    USERS ||--o{ SHIFT_CAPITAL_CONTRIBUTIONS : "menyetor_modal"
    USERS ||--o{ TRANSACTIONS : "memproses"
    USERS ||--o{ EXPENSES : "mencatat"
    USERS ||--o{ AUDIT_LOGS : "melakukan_aksi"
    USERS ||--o{ STOCK_LOGS : "mengubah_stok"

    SHIFTS ||--o{ SHIFT_USERS : "memiliki_anggota"
    SHIFTS ||--o{ SHIFT_CAPITAL_CONTRIBUTIONS : "menampung_modal_awal"
    SHIFTS ||--o{ TRANSACTIONS : "menampung_transaksi"
    SHIFTS ||--o{ EXPENSES : "menampung_pengeluaran"

    CATEGORIES ||--o{ PRODUCTS : "mengelompokkan"
    
    PRODUCTS ||--o| STOCKS : "memiliki_persediaan"
    PRODUCTS ||--o{ TRANSACTION_ITEMS : "dijual_dalam"
    PRODUCTS ||--o{ STOCK_LOGS : "dicatat_riwayat"

    TRANSACTIONS ||--|{ TRANSACTION_ITEMS : "memiliki_detail"

    USERS {
        string user_id PK
        string username
        string password_hash
        string full_name
        enum role "OWNER, KARYAWAN"
        enum status "ACTIVE, INACTIVE"
        datetime created_at
    }

    SHIFTS {
        string shift_id PK
        string opened_by_user_id FK
        string shift_leader_user_id FK
        string closed_by_user_id FK
        datetime start_time
        datetime end_time
        decimal total_initial_cash
        decimal net_cash_sales
        decimal total_cash_expenses
        decimal theoretical_cash
        decimal actual_physical_cash
        decimal cash_variance
        enum reconciliation_status "PAS, LEBIH, KURANG"
        enum shift_status "ACTIVE, CLOSED"
    }

    SHIFT_USERS {
        string shift_user_id PK
        string shift_id FK
        string user_id FK
        boolean is_shift_leader
        datetime joined_at
    }

    SHIFT_CAPITAL_CONTRIBUTIONS {
        string contribution_id PK
        string shift_id FK
        string user_id FK
        decimal amount
        datetime contribution_time
        decimal returned_amount
        datetime returned_at
        enum status "HELD, RETURNED"
    }

    CATEGORIES {
        string category_id PK
        string category_name
        enum business_unit "FC_PRINT, FNB"
        boolean is_active
    }

    PRODUCTS {
        string product_id PK
        string category_id FK
        string product_name
        enum business_unit "FC_PRINT, FNB"
        decimal selling_price
        boolean manage_stock
        boolean is_active
    }

    STOCKS {
        string stock_id PK
        string product_id FK
        integer current_stock
        datetime last_updated
    }

    STOCK_LOGS {
        string stock_log_id PK
        string product_id FK
        string user_id FK
        string transaction_id FK
        integer change_qty
        integer final_stock
        enum log_type "SALE, REFUND, MANUAL_ADJUSTMENT"
        datetime created_at
    }

    TRANSACTIONS {
        string transaction_id PK
        string transaction_number
        string shift_id FK
        string created_by_user_id FK
        string cancelled_by_user_id FK
        decimal subtotal
        decimal discount_amount
        decimal total_amount
        decimal cash_received
        decimal change_amount
        enum payment_method "CASH, TRANSFER, QRIS_MANUAL"
        enum status "COMPLETED, CANCELLED"
        string cancellation_reason
        boolean non_cash_refund_status
        datetime transaction_time
    }

    TRANSACTION_ITEMS {
        string item_id PK
        string transaction_id FK
        string product_id FK
        string item_name_snapshot
        decimal unit_price_snapshot
        integer quantity
        decimal item_subtotal
    }

    EXPENSES {
        string expense_id PK
        string shift_id FK
        string recorded_by_user_id FK
        string expense_category
        string description
        decimal amount
        datetime expense_time
    }

    AUDIT_LOGS {
        string audit_id PK
        string user_id FK
        string action_type
        string entity_name
        string entity_id
        string details
        datetime timestamp
    }
```

---

## 2. JUSTIFIKASI BISNIS ENTITAS BARU: `SHIFT_CAPITAL_CONTRIBUTIONS`

- **Alasan Bisnis Spesifik:** Modal awal laci kas dapat disetor oleh lebih dari satu karyawan (misal Budi setor Rp50rb, Siti setor Rp50rb). Uang fisik dicampur ke laci kas bersama `Shift ID`, namun entitas ini secara khusus mencatat siapa menyetor berapa, waktu setoran, status pengembalian (`HELD` saat shift berjalan, `RETURNED` setelah closing), serta nominal modal yang dikembalikan kepada masing-masing penyetor.
