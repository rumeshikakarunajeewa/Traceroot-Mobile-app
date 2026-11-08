-- ─────────────────────────────────────────────────────────────────
-- TRACEROOT CRITICAL FIX: ELIMINATE INFINITE RECURSION ON PROFILES
-- Drops all existing policies on public.profiles and public.buyer_profiles
-- dynamically, and re-creates clean, non-recursive policies.
-- Safe and idempotent to run in Supabase SQL Editor.
-- ─────────────────────────────────────────────────────────────────

-- 1. Helper function: SECURITY DEFINER bypasses RLS completely
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 2. DYNAMICALLY DROP ALL POLICIES ON public.profiles
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'profiles' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
  END LOOP;
END $$;

-- 3. RE-CREATE CLEAN, SAFE, NON-RECURSIVE POLICIES ON public.profiles
CREATE POLICY "profiles_select_policy"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "profiles_insert_policy"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_policy"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_admin_update_policy"
  ON public.profiles FOR UPDATE
  USING (public.is_admin());

-- 4. DYNAMICALLY DROP ALL POLICIES ON public.buyer_profiles
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'buyer_profiles' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.buyer_profiles', pol.policyname);
  END LOOP;
END $$;

-- 5. RE-CREATE CLEAN POLICIES ON public.buyer_profiles
CREATE POLICY "buyer_profiles_select_policy"
  ON public.buyer_profiles FOR SELECT
  USING (true);

CREATE POLICY "buyer_profiles_all_policy"
  ON public.buyer_profiles FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "buyer_profiles_admin_policy"
  ON public.buyer_profiles FOR ALL
  USING (public.is_admin());

