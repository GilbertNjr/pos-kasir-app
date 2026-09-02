-- Migration 007: Add metadata & duty staff columns to shifts table
ALTER TABLE shifts ADD COLUMN IF NOT EXISTS duty_staff_names TEXT;
ALTER TABLE shifts ADD COLUMN IF NOT EXISTS shift_category VARCHAR(100);
ALTER TABLE shifts ADD COLUMN IF NOT EXISTS shift_metadata JSONB;
