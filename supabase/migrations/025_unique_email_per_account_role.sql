-- ─────────────────────────────────────────────────────────────────
-- TRACEROOT: STRICT ONE FIXED ROLE PER EMAIL ENFORCEMENT
-- 1. Safely normalizes emails & creates case-insensitive UNIQUE index
--    on public.profiles(LOWER(email)).
-- 2. Adds check_email_registration(p_email) RPC for pre-signup and
--    cross-provider duplicate email checks.
-- 3. Guards handle_new_user() and finalize_initial_user_role() against
--    creating a second role account with an already-registered email.
-- Safe and idempotent to run in Supabase SQL Editor.
-- ─────────────────────────────────────────────────────────────────

-- 1. Normalize emails and enforce case-insensitive uniqueness on public.profiles
DO $$
DECLARE
  dup RECORD;
BEGIN
  UPDATE public.profiles
    SET email = LOWER(TRIM(email))
    WHERE email IS NOT NULL AND email <> LOWER(TRIM(email));

  -- If any historical duplicate email rows exist from pre-fix testing, keep earliest locked row
  FOR dup IN
    SELECT id
    FROM (
      SELECT id,
             ROW_NUMBER() OVER (
               PARTITION BY LOWER(TRIM(email))
               ORDER BY role_locked DESC, created_at ASC, id ASC
             ) AS rn
      FROM public.profiles
      WHERE email IS NOT NULL AND TRIM(email) <> ''
    ) t
    WHERE t.rn > 1
  LOOP
    UPDATE public.profiles
      SET email = 'archived+' || substr(dup.id::text, 1, 8) || '+' || email
      WHERE id = dup.id;
  END LOOP;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_unique_email_lower
  ON public.profiles (LOWER(email))
  WHERE email <> '';

-- 2. Pre-signup & cross-provider email lookup RPC
CREATE OR REPLACE FUNCTION public.check_email_registration(p_email TEXT)
RETURNS JSONB AS $$
DECLARE
  v_norm TEXT := LOWER(TRIM(COALESCE(p_email, '')));
  v_id UUID;
  v_role TEXT;
  v_locked BOOLEAN;
BEGIN
  IF v_norm = '' THEN
    RETURN jsonb_build_object('exists', false, 'user_id', null, 'role', null, 'role_locked', false);
  END IF;

  SELECT id, role, role_locked
    INTO v_id, v_role, v_locked
    FROM public.profiles
    WHERE LOWER(TRIM(email)) = v_norm
    LIMIT 1;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'exists', true,
      'user_id', v_id,
      'role', v_role,
      'role_locked', COALESCE(v_locked, true)
    );
  END IF;

  -- Also inspect auth.users in case a profile row was removed or pending
  SELECT id, COALESCE(raw_user_meta_data->>'role', 'buyer')
    INTO v_id, v_role
    FROM auth.users
    WHERE LOWER(TRIM(email)) = v_norm
    LIMIT 1;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'exists', true,
      'user_id', v_id,
      'role', v_role,
      'role_locked', true
    );
  END IF;

  RETURN jsonb_build_object('exists', false, 'user_id', null, 'role', null, 'role_locked', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION public.check_email_registration(TEXT) TO anon, authenticated;

-- 3. Update handle_new_user() to block creating another account with an already-registered email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  explicit_role TEXT;
  has_explicit_role BOOLEAN;
  user_role TEXT;
  user_name TEXT;
  user_email TEXT;
  user_avatar TEXT;
  existing_email_role TEXT;
BEGIN
  user_email := LOWER(TRIM(COALESCE(NEW.email, '')));

  IF user_email <> '' THEN
    SELECT role INTO existing_email_role
      FROM public.profiles
      WHERE LOWER(TRIM(email)) = user_email
        AND id <> NEW.id
      LIMIT 1;

    IF FOUND THEN
      RAISE EXCEPTION 'An account with email % is already registered as %. You cannot create another role account with the same email.',
        user_email, existing_email_role;
    END IF;
  END IF;

  explicit_role := NEW.raw_user_meta_data->>'role';
  has_explicit_role := explicit_role IN ('farmer', 'buyer', 'supplier', 'admin');
  user_role := CASE WHEN has_explicit_role THEN explicit_role ELSE 'buyer' END;

  user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(user_email, '@', 1),
    'TraceRoot User'
  );
  user_avatar := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture'
  );

  INSERT INTO public.profiles (id, full_name, role, role_locked, email, phone, avatar_url)
  VALUES (
    NEW.id,
    user_name,
    user_role,
    has_explicit_role,
    user_email,
    NEW.raw_user_meta_data->>'phone',
    user_avatar
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(NULLIF(public.profiles.full_name, ''), EXCLUDED.full_name),
    role = COALESCE(public.profiles.role, EXCLUDED.role),
    role_locked = public.profiles.role_locked,
    email = COALESCE(NULLIF(public.profiles.email, ''), EXCLUDED.email),
    avatar_url = COALESCE(public.profiles.avatar_url, EXCLUDED.avatar_url);

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

-- 4. Update finalize_initial_user_role() to check duplicate email across other accounts
CREATE OR REPLACE FUNCTION public.finalize_initial_user_role(p_role TEXT)
RETURNS JSONB AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_existing_role TEXT;
  v_locked BOOLEAN;
  v_full_name TEXT;
  v_email TEXT;
  v_dup_role TEXT;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  IF p_role NOT IN ('farmer', 'buyer', 'supplier') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid role');
  END IF;

  SELECT role, role_locked, full_name, LOWER(TRIM(COALESCE(email, '')))
    INTO v_existing_role, v_locked, v_full_name, v_email
    FROM public.profiles
    WHERE id = v_uid
    FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Profile not found');
  END IF;

  IF v_email <> '' THEN
    SELECT role INTO v_dup_role
      FROM public.profiles
      WHERE LOWER(TRIM(email)) = v_email
        AND id <> v_uid
      LIMIT 1;

    IF FOUND THEN
      RETURN jsonb_build_object(
        'success', false,
        'duplicate_email', true,
        'role', v_dup_role,
        'error', 'This email is already registered under another fixed role.'
      );
    END IF;
  END IF;

  IF v_locked = TRUE THEN
    RETURN jsonb_build_object(
      'success', false,
      'locked', true,
      'role', v_existing_role,
      'error', 'User role is already permanently fixed.'
    );
  END IF;

  UPDATE public.profiles
    SET role = p_role,
        role_locked = TRUE
    WHERE id = v_uid;

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
