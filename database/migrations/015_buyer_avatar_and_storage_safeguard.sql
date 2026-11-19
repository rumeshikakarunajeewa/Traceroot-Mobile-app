-- ─────────────────────────────────────────────────────────────────
-- TRACEROOT BUYER AVATAR & STORAGE SAFEGUARD MIGRATION
-- Synchronizes avatar_url across public.profiles and public.buyer_profiles,
-- establishes an automatic sync trigger, and ensures avatars storage bucket
-- and RLS policies are properly configured.
-- Safe to run multiple times (idempotent).
-- ─────────────────────────────────────────────────────────────────

-- 1. Ensure avatar_url column exists in public.profiles and public.buyer_profiles
ALTER TABLE IF EXISTS public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

ALTER TABLE IF EXISTS public.buyer_profiles
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Backfill existing avatar URLs from profiles to buyer_profiles
UPDATE public.buyer_profiles bp
SET avatar_url = p.avatar_url
FROM public.profiles p
WHERE bp.id = p.id
  AND (bp.avatar_url IS NULL OR bp.avatar_url = '')
  AND (p.avatar_url IS NOT NULL AND p.avatar_url != '');

-- 3. Automatic synchronization trigger: updates to profiles.avatar_url reflect in buyer_profiles
CREATE OR REPLACE FUNCTION public.sync_profile_avatar_to_roles()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.buyer_profiles
  SET avatar_url = NEW.avatar_url
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_sync_profile_avatar ON public.profiles;
CREATE TRIGGER tr_sync_profile_avatar
AFTER UPDATE OF avatar_url ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_avatar_to_roles();

-- 4. Ensure avatars bucket exists in storage.buckets with public access
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE 
SET public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- 5. Safe idempotent RLS policies for avatars in storage.objects
-- Note: storage.objects already has RLS enabled by Supabase infrastructure.
DROP POLICY IF EXISTS "Public avatar read" ON storage.objects;
CREATE POLICY "Public avatar read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Authenticated avatar upload" ON storage.objects;
CREATE POLICY "Authenticated avatar upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "User avatar update own" ON storage.objects;
CREATE POLICY "User avatar update own"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.role() = 'authenticated')
  WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "User avatar delete own" ON storage.objects;
CREATE POLICY "User avatar delete own"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');

