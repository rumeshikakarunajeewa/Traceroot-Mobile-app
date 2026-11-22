-- ─────────────────────────────────────────────────────────────────
-- TRACEROOT SUPPLIER REAL LOCATION SAFEGUARD MIGRATION
-- Ensures district, province, address, coordinates, latitude, and longitude
-- columns exist on public.supplier_profiles and public.profiles.
-- Safe to run multiple times (idempotent).
-- ─────────────────────────────────────────────────────────────────

-- 1. Ensure location columns on public.supplier_profiles
ALTER TABLE IF EXISTS public.supplier_profiles
  ADD COLUMN IF NOT EXISTS district TEXT,
  ADD COLUMN IF NOT EXISTS province TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Sri Lanka',
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS coordinates TEXT,
  ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 7),
  ADD COLUMN IF NOT EXISTS longitude DECIMAL(10, 7),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Ensure location columns on public.profiles
ALTER TABLE IF EXISTS public.profiles
  ADD COLUMN IF NOT EXISTS district TEXT,
  ADD COLUMN IF NOT EXISTS province TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
