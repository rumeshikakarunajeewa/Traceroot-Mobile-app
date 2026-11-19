-- ─────────────────────────────────────────────────────────────────
-- TRACEROOT STORAGE BUCKETS SETUP
-- Safe to run multiple times (idempotent)
-- ─────────────────────────────────────────────────────────────────

-- 1. Create Storage Buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('cultivation-photos', 'cultivation-photos', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('harvest-images', 'harvest-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('catalogue-images', 'catalogue-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- 2. Storage Policies for avatars (Public read, authenticated upload)
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
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 3. Storage Policies for harvest-images (Public read, authenticated upload)
DROP POLICY IF EXISTS "Public harvest images read" ON storage.objects;
CREATE POLICY "Public harvest images read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'harvest-images');

DROP POLICY IF EXISTS "Farmer harvest images upload" ON storage.objects;
CREATE POLICY "Farmer harvest images upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'harvest-images' AND auth.role() = 'authenticated');

-- 4. Storage Policies for catalogue-images (Public read, authenticated upload)
DROP POLICY IF EXISTS "Public catalogue images read" ON storage.objects;
CREATE POLICY "Public catalogue images read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'catalogue-images');

DROP POLICY IF EXISTS "Supplier catalogue images upload" ON storage.objects;
CREATE POLICY "Supplier catalogue images upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'catalogue-images' AND auth.role() = 'authenticated');

-- 5. Storage Policies for cultivation-photos (Authenticated read & upload)
DROP POLICY IF EXISTS "Cultivation photos read" ON storage.objects;
CREATE POLICY "Cultivation photos read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'cultivation-photos' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Farmer cultivation photos upload" ON storage.objects;
CREATE POLICY "Farmer cultivation photos upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'cultivation-photos' AND auth.role() = 'authenticated');
