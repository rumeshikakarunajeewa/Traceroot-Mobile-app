-- ─────────────────────────────────────────────────────────────────
-- TRACEROOT STORAGE BUCKETS SETUP
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
CREATE POLICY "Public avatar read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated avatar upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "User avatar update own"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 3. Storage Policies for harvest-images (Public read, authenticated upload)
CREATE POLICY "Public harvest images read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'harvest-images');

CREATE POLICY "Farmer harvest images upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'harvest-images' AND auth.role() = 'authenticated');

-- 4. Storage Policies for catalogue-images (Public read, authenticated upload)
CREATE POLICY "Public catalogue images read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'catalogue-images');

CREATE POLICY "Supplier catalogue images upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'catalogue-images' AND auth.role() = 'authenticated');

-- 5. Storage Policies for cultivation-photos (Authenticated read & upload)
CREATE POLICY "Cultivation photos read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'cultivation-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Farmer cultivation photos upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'cultivation-photos' AND auth.role() = 'authenticated');
