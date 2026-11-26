-- ─────────────────────────────────────────────────────────────────
-- TRACEROOT GOOGLE AUTH ROLE SYNC FIX MIGRATION
-- Prevents ON CONFLICT from resetting public.profiles.role to 'buyer'
-- when handle_new_user() runs on an existing user.
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
  user_name TEXT;
  user_avatar TEXT;
BEGIN
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'buyer');
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1),
    'TraceRoot User'
  );
  user_avatar := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture'
  );

  -- Step A: Insert base profile, or on conflict preserve any existing chosen role
  INSERT INTO public.profiles (id, full_name, role, email, phone, avatar_url)
  VALUES (
    NEW.id,
    user_name,
    user_role,
    COALESCE(NEW.email, ''),
    NEW.raw_user_meta_data->>'phone',
    user_avatar
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = COALESCE(public.profiles.role, EXCLUDED.role),
    email = EXCLUDED.email,
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url);

  -- Step B: Insert the connected role-specific profile row if not exists
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
