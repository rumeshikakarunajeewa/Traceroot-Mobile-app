-- ─────────────────────────────────────────────────────────────────
-- TRACEROOT AUTOMATIC PROFILE & ROLE-PROFILE CREATION TRIGGER
-- Synchronizes Supabase auth.users with public.profiles
-- AND automatically creates the connected row in the role-specific table:
--   - farmer_profiles   (if role = 'farmer')
--   - buyer_profiles    (if role = 'buyer')
--   - supplier_profiles (if role = 'supplier')
-- Safe to run multiple times (idempotent)
-- ─────────────────────────────────────────────────────────────────

-- 1. Ensure sensible column defaults so automatic creation never fails
ALTER TABLE IF EXISTS public.farmer_profiles 
  ALTER COLUMN farming_type SET DEFAULT 'open_field';

ALTER TABLE IF EXISTS public.buyer_profiles 
  ALTER COLUMN buyer_type SET DEFAULT 'supermarket',
  ALTER COLUMN company_name SET DEFAULT '';

ALTER TABLE IF EXISTS public.supplier_profiles 
  ALTER COLUMN company_name SET DEFAULT '';

-- 2. Create the unified trigger function
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

  -- Step B: Insert the connected role-specific profile row
  IF user_role = 'farmer' THEN
    INSERT INTO public.farmer_profiles (id, farming_type, farm_name)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'farming_type', 'open_field'),
      COALESCE(NEW.raw_user_meta_data->>'farm_name', '')
    )
    ON CONFLICT (id) DO NOTHING;

  ELSIF user_role = 'buyer' THEN
    INSERT INTO public.buyer_profiles (id, buyer_type, company_name)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'buyer_type', 'supermarket'),
      COALESCE(NEW.raw_user_meta_data->>'company_name', '')
    )
    ON CONFLICT (id) DO NOTHING;

  ELSIF user_role = 'supplier' THEN
    INSERT INTO public.supplier_profiles (id, company_name)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'company_name', '')
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Bind the trigger to Supabase auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. BACKFILL: Ensure existing profiles also have their role table connected
INSERT INTO public.farmer_profiles (id, farming_type)
SELECT id, 'open_field' 
FROM public.profiles 
WHERE role = 'farmer'
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.buyer_profiles (id, buyer_type, company_name)
SELECT id, 'supermarket', '' 
FROM public.profiles 
WHERE role = 'buyer'
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.supplier_profiles (id, company_name)
SELECT id, '' 
FROM public.profiles 
WHERE role = 'supplier'
ON CONFLICT (id) DO NOTHING;
