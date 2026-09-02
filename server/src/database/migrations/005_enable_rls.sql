-- =============================================================================
-- MIGRATION 005: ENABLE ROW-LEVEL SECURITY (RLS) ON PUBLIC SCHEMA TABLES
-- Supabase Security Advisor Compliance & Security Hardening (rls_disabled_in_public)
-- =============================================================================

-- 1. Explicitly enable RLS for all core application tables
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS product_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS shift_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS shift_capital_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS employee_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS shift_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS activation_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_activation_codes ENABLE ROW LEVEL SECURITY;

-- 2. Dynamic PL/pgSQL block to ensure ANY table in the 'public' schema has RLS enabled
-- This satisfies Supabase Security Advisor rule "rls_disabled_in_public" dynamically
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE 'ALTER TABLE public.' || quote_ident(r.tablename) || ' ENABLE ROW LEVEL SECURITY;';
    END LOOP;
END $$;

