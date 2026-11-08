-- ─────────────────────────────────────────────────────────────────
-- TRACEROOT BUYER PROFILE SCHEMA SAFEGUARD & SYNC
-- Ensures all columns required for Buyer Profile edit and multi-table
-- synchronization exist in public.profiles and public.buyer_profiles.
-- Idempotent and safe to run multiple times.
-- ─────────────────────────────────────────────────────────────────

-- 1. Ensure required columns on base profiles table
ALTER TABLE IF EXISTS public.profiles
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Ensure required columns on buyer_profiles table
ALTER TABLE IF EXISTS public.buyer_profiles
  ADD COLUMN IF NOT EXISTS buyer_name TEXT,
  ADD COLUMN IF NOT EXISTS company_name TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS buyer_type TEXT DEFAULT 'supermarket',
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS district TEXT,
  ADD COLUMN IF NOT EXISTS province TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Sri Lanka',
  ADD COLUMN IF NOT EXISTS coordinates TEXT,
  ADD COLUMN IF NOT EXISTS br_number TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Synchronize existing buyer names and bios if empty
UPDATE public.buyer_profiles bp
SET 
  buyer_name = COALESCE(NULLIF(bp.buyer_name, ''), p.full_name),
  bio = COALESCE(NULLIF(bp.bio, ''), p.bio)
FROM public.profiles p
WHERE bp.id = p.id;

-- 4. FIX INFINITE RECURSION IN PROFILES RLS POLICY
-- Problem: "Admin sees all profiles" policy queried profiles recursively:
--   USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
-- Fix: Drop the self-referencing policy (public already has SELECT USING (true)),
-- and use a SECURITY DEFINER function for any admin checks.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Drop the recursive policy on profiles immediately
DROP POLICY IF EXISTS "Admin sees all profiles" ON public.profiles;

-- Ensure standard non-recursive policies on profiles
DROP POLICY IF EXISTS "Public sees basic profile info" ON public.profiles;
CREATE POLICY "Public sees basic profile info"
  ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "User updates own profile" ON public.profiles;
CREATE POLICY "User updates own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admin updates all profiles" ON public.profiles;
CREATE POLICY "Admin updates all profiles"
  ON public.profiles FOR UPDATE USING (public.is_admin());

