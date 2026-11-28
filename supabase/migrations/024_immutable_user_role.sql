-- ─────────────────────────────────────────────────────────────────
-- TRACEROOT: IMMUTABLE & PERMANENTLY FIXED USER ROLES
-- 1. Adds role_locked flag to public.profiles (all existing users locked).
-- 2. Updates handle_new_user() so email signups lock role immediately,
--    and brand-new Google OAuth signups defer sub-profile creation until
--    initial role finalization.
-- 3. Enforces BEFORE UPDATE trigger preventing any change to role once locked.
-- 4. Provides one-time finalize_initial_user_role(p_role) RPC.
-- Safe and idempotent to run in Supabase SQL Editor.
-- ─────────────────────────────────────────────────────────────────

-- 1. Add role_locked column to public.profiles (existing users default to TRUE)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role_locked BOOLEAN NOT NULL DEFAULT TRUE;

UPDATE public.profiles
  SET role_locked = TRUE
  WHERE role_locked IS DISTINCT FROM TRUE;

-- 2. Update handle_new_user() trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  explicit_role TEXT;
  has_explicit_role BOOLEAN;
  user_role TEXT;
  user_name TEXT;
  user_avatar TEXT;
BEGIN
  explicit_role := NEW.raw_user_meta_data->>'role';
  has_explicit_role := explicit_role IN ('farmer', 'buyer', 'supplier', 'admin');
  user_role := CASE WHEN has_explicit_role THEN explicit_role ELSE 'buyer' END;

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

  -- Step A: Insert base profile, preserving existing role & lock state on conflict
  INSERT INTO public.profiles (id, full_name, role, role_locked, email, phone, avatar_url)
  VALUES (
    NEW.id,
    user_name,
    user_role,
    has_explicit_role,
    COALESCE(NEW.email, ''),
    NEW.raw_user_meta_data->>'phone',
    user_avatar
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(NULLIF(public.profiles.full_name, ''), EXCLUDED.full_name),
    role = COALESCE(public.profiles.role, EXCLUDED.role),
    role_locked = public.profiles.role_locked,
    email = COALESCE(NULLIF(public.profiles.email, ''), EXCLUDED.email),
    avatar_url = COALESCE(public.profiles.avatar_url, EXCLUDED.avatar_url);

  -- Step B: Only create the role-specific profile when explicit role was provided at creation.
  -- Brand-new Google OAuth users finalize & lock their role once via finalize_initial_user_role().
  IF has_explicit_role THEN
    IF user_role = 'farmer' THEN
      INSERT INTO public.farmer_profiles (id, farming_type, farm_name, farmer_name)
      VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'farming_type', 'open_field'),
        COALESCE(NEW.raw_user_meta_data->>'farm_name', ''),
        user_name
      )
      ON CONFLICT (id) DO UPDATE SET
        farmer_name = COALESCE(NULLIF(farmer_profiles.farmer_name, ''), EXCLUDED.farmer_name);

    ELSIF user_role = 'buyer' THEN
      INSERT INTO public.buyer_profiles (id, buyer_type, company_name, buyer_name)
      VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'buyer_type', 'supermarket'),
        COALESCE(NEW.raw_user_meta_data->>'company_name', ''),
        user_name
      )
      ON CONFLICT (id) DO UPDATE SET
        buyer_name = COALESCE(NULLIF(buyer_profiles.buyer_name, ''), EXCLUDED.buyer_name);

    ELSIF user_role = 'supplier' THEN
      INSERT INTO public.supplier_profiles (id, company_name, supplier_name)
      VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'company_name', ''),
        user_name
      )
      ON CONFLICT (id) DO UPDATE SET
        supplier_name = COALESCE(NULLIF(supplier_profiles.supplier_name, ''), EXCLUDED.supplier_name);
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Trigger function to enforce role immutability on public.profiles
CREATE OR REPLACE FUNCTION public.enforce_immutable_user_role()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.role_locked = TRUE THEN
    -- Block unlocking role_locked by non-admin clients
    IF NEW.role_locked IS DISTINCT FROM TRUE AND auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
      RAISE EXCEPTION 'Cannot unlock a fixed user account role.';
    END IF;

    -- Block modifying role once locked (for authenticated client users)
    IF NEW.role IS DISTINCT FROM OLD.role AND auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
      RAISE EXCEPTION 'User account role is permanently fixed after creation and cannot be changed.';
    END IF;
  ELSE
    -- First-time commitment permanently locks the role
    IF NEW.role IS DISTINCT FROM OLD.role OR NEW.role_locked = TRUE THEN
      NEW.role_locked := TRUE;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_enforce_immutable_user_role ON public.profiles;
CREATE TRIGGER trg_enforce_immutable_user_role
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_immutable_user_role();

-- 4. One-time RPC for brand-new Google OAuth accounts to commit & lock their initial role
CREATE OR REPLACE FUNCTION public.finalize_initial_user_role(p_role TEXT)
RETURNS JSONB AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_existing_role TEXT;
  v_locked BOOLEAN;
  v_full_name TEXT;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  IF p_role NOT IN ('farmer', 'buyer', 'supplier') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid role');
  END IF;

  SELECT role, role_locked, full_name
    INTO v_existing_role, v_locked, v_full_name
    FROM public.profiles
    WHERE id = v_uid
    FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Profile not found');
  END IF;

  -- Refuse change if already locked
  IF v_locked = TRUE THEN
    RETURN jsonb_build_object(
      'success', false,
      'locked', true,
      'role', v_existing_role,
      'error', 'User role is already permanently fixed.'
    );
  END IF;

  -- Commit & permanently lock initial role
  UPDATE public.profiles
    SET role = p_role,
        role_locked = TRUE
    WHERE id = v_uid;

  -- Create the single matching sub-profile row
  IF p_role = 'farmer' THEN
    INSERT INTO public.farmer_profiles (id, farming_type, farm_name, farmer_name)
    VALUES (v_uid, 'open_field', '', COALESCE(v_full_name, 'TraceRoot User'))
    ON CONFLICT (id) DO NOTHING;
  ELSIF p_role = 'buyer' THEN
    INSERT INTO public.buyer_profiles (id, buyer_type, company_name, buyer_name)
    VALUES (v_uid, 'supermarket', '', COALESCE(v_full_name, 'TraceRoot User'))
    ON CONFLICT (id) DO NOTHING;
  ELSIF p_role = 'supplier' THEN
    INSERT INTO public.supplier_profiles (id, company_name, supplier_name)
    VALUES (v_uid, '', COALESCE(v_full_name, 'TraceRoot User'))
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN jsonb_build_object('success', true, 'locked', true, 'role', p_role);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.finalize_initial_user_role(TEXT) TO authenticated;
