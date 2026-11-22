-- ─────────────────────────────────────────────────────────────────
-- TRACEROOT SUPPLIER PROFILE SCHEMA SAFEGUARD & SYNC
-- Ensures all columns and non-recursive RLS policies required for
-- Supplier Profile edit and multi-table synchronization are in place.
-- Idempotent and safe to run multiple times.
-- ─────────────────────────────────────────────────────────────────

-- 1. Ensure required columns on supplier_profiles table
ALTER TABLE IF EXISTS public.supplier_profiles
  ADD COLUMN IF NOT EXISTS supplier_name TEXT,
  ADD COLUMN IF NOT EXISTS company_name TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS br_number TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Agricultural Raw Materials',
  ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 5.0,
  ADD COLUMN IF NOT EXISTS district TEXT,
  ADD COLUMN IF NOT EXISTS province TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Non-recursive RLS policies for supplier_profiles
ALTER TABLE IF EXISTS public.supplier_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view supplier profiles" ON public.supplier_profiles;
CREATE POLICY "Public can view supplier profiles"
  ON public.supplier_profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Supplier manages own supplier profile" ON public.supplier_profiles;
CREATE POLICY "Supplier manages own supplier profile"
  ON public.supplier_profiles FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 3. Synchronize existing supplier names and bios if empty
UPDATE public.supplier_profiles sp
SET 
  supplier_name = COALESCE(NULLIF(sp.supplier_name, ''), p.full_name),
  description = COALESCE(NULLIF(sp.description, ''), p.bio)
FROM public.profiles p
WHERE sp.id = p.id;

