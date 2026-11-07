-- ─────────────────────────────────────────────────────────────────
-- TRACEROOT AUTOMATIC PROFILE & ROLE-PROFILE CREATION TRIGGER
-- Synchronizes Supabase auth.users with public.profiles
-- AND automatically creates the connected row in the role-specific table:
--   - farmer_profiles   (if role = 'farmer')
--   - buyer_profiles    (if role = 'buyer')
--   - supplier_profiles (if role = 'supplier')
-- Safe to run multiple times (idempotent)
-- ─────────────────────────────────────────────────────────────────

-- 1. Ensure sensible column defaults & missing columns so automatic creation never fails
ALTER TABLE IF EXISTS public.farmer_profiles 
  ADD COLUMN IF NOT EXISTS farmer_name TEXT,
  ALTER COLUMN farming_type SET DEFAULT 'open_field';

ALTER TABLE IF EXISTS public.buyer_profiles 
  ADD COLUMN IF NOT EXISTS buyer_name TEXT,
  ALTER COLUMN buyer_type SET DEFAULT 'supermarket',
  ALTER COLUMN company_name SET DEFAULT '';

ALTER TABLE IF EXISTS public.supplier_profiles 
  ADD COLUMN IF NOT EXISTS supplier_name TEXT,
  ALTER COLUMN company_name SET DEFAULT '';

-- 2. Create the unified trigger function for new auth users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
  user_name TEXT;
BEGIN
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'farmer');
  user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', 'TraceRoot User');

  -- Step A: Insert/Update the base profile in public.profiles
  INSERT INTO public.profiles (id, full_name, role, email, phone)
  VALUES (
    NEW.id,
    user_name,
    user_role,
    COALESCE(NEW.email, ''),
    NEW.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    email = EXCLUDED.email;

  -- Step B: Insert the connected role-specific profile row with name populated
  IF user_role = 'farmer' THEN
    INSERT INTO public.farmer_profiles (id, farming_type, farm_name, farmer_name)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'farming_type', 'open_field'),
      COALESCE(NEW.raw_user_meta_data->>'farm_name', ''),
      user_name
    )
    ON CONFLICT (id) DO UPDATE SET
      farmer_name = COALESCE(EXCLUDED.farmer_name, farmer_profiles.farmer_name);

  ELSIF user_role = 'buyer' THEN
    INSERT INTO public.buyer_profiles (id, buyer_type, company_name, buyer_name)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'buyer_type', 'supermarket'),
      COALESCE(NEW.raw_user_meta_data->>'company_name', ''),
      user_name
    )
    ON CONFLICT (id) DO UPDATE SET
      buyer_name = COALESCE(EXCLUDED.buyer_name, buyer_profiles.buyer_name);

  ELSIF user_role = 'supplier' THEN
    INSERT INTO public.supplier_profiles (id, company_name, supplier_name)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'company_name', ''),
      user_name
    )
    ON CONFLICT (id) DO UPDATE SET
      supplier_name = COALESCE(EXCLUDED.supplier_name, supplier_profiles.supplier_name);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Bind the trigger to Supabase auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. AUTOMATIC SYNCHRONIZATION TRIGGER:
-- Whenever full_name in public.profiles is updated, automatically
-- update the corresponding role table (farmer_profiles.farmer_name, etc.)
CREATE OR REPLACE FUNCTION public.sync_profile_name_to_role_profiles()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'farmer' THEN
    UPDATE public.farmer_profiles
    SET farmer_name = NEW.full_name
    WHERE id = NEW.id;

  ELSIF NEW.role = 'buyer' THEN
    UPDATE public.buyer_profiles
    SET buyer_name = NEW.full_name
    WHERE id = NEW.id;

  ELSIF NEW.role = 'supplier' THEN
    UPDATE public.supplier_profiles
    SET supplier_name = NEW.full_name
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_sync_profile_name_to_role_profiles ON public.profiles;
CREATE TRIGGER tr_sync_profile_name_to_role_profiles
  AFTER UPDATE OF full_name ON public.profiles
  FOR EACH ROW
  WHEN (OLD.full_name IS DISTINCT FROM NEW.full_name)
  EXECUTE FUNCTION public.sync_profile_name_to_role_profiles();

-- 5. SAFETY DEFAULT TRIGGER ON farmer_profiles:
-- If a row in farmer_profiles is inserted or updated with null/empty farmer_name,
-- automatically look up full_name from public.profiles
CREATE OR REPLACE FUNCTION public.default_farmer_name_from_profiles()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.farmer_name IS NULL OR TRIM(NEW.farmer_name) = '' THEN
    SELECT full_name INTO NEW.farmer_name
    FROM public.profiles
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_default_farmer_name ON public.farmer_profiles;
CREATE TRIGGER tr_default_farmer_name
  BEFORE INSERT OR UPDATE ON public.farmer_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.default_farmer_name_from_profiles();

-- 6. BACKFILL: Ensure existing profiles also have their role table connected & names synced
INSERT INTO public.farmer_profiles (id, farming_type, farmer_name)
SELECT id, 'open_field', full_name 
FROM public.profiles 
WHERE role = 'farmer'
ON CONFLICT (id) DO UPDATE SET
  farmer_name = COALESCE(farmer_profiles.farmer_name, EXCLUDED.farmer_name);

INSERT INTO public.buyer_profiles (id, buyer_type, company_name, buyer_name)
SELECT id, 'supermarket', '', full_name 
FROM public.profiles 
WHERE role = 'buyer'
ON CONFLICT (id) DO UPDATE SET
  buyer_name = COALESCE(buyer_profiles.buyer_name, EXCLUDED.buyer_name);

INSERT INTO public.supplier_profiles (id, company_name, supplier_name)
SELECT id, '', full_name 
FROM public.profiles 
WHERE role = 'supplier'
ON CONFLICT (id) DO UPDATE SET
  supplier_name = COALESCE(supplier_profiles.supplier_name, EXCLUDED.supplier_name);

-- Sync any existing farmer rows where farmer_name is NULL
UPDATE public.farmer_profiles fp
SET farmer_name = p.full_name
FROM public.profiles p
WHERE fp.id = p.id
  AND (fp.farmer_name IS NULL OR TRIM(fp.farmer_name) = '');
