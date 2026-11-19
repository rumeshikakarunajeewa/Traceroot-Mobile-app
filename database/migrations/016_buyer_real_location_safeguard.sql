-- ─────────────────────────────────────────────────────────────────
-- TRACEROOT BUYER REAL LOCATION SAFEGUARD MIGRATION
-- Ensures district, province, address, coordinates, latitude, and longitude
-- columns exist on public.buyer_profiles and public.profiles.
-- Safe to run multiple times (idempotent).
-- ─────────────────────────────────────────────────────────────────

-- 1. Ensure location columns on public.buyer_profiles
ALTER TABLE IF EXISTS public.buyer_profiles
  ADD COLUMN IF NOT EXISTS district TEXT,
  ADD COLUMN IF NOT EXISTS province TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Sri Lanka',
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS coordinates TEXT,
  ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 7),
  ADD COLUMN IF NOT EXISTS longitude DECIMAL(10, 7),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Ensure location columns on public.profiles
ALTER TABLE IF EXISTS public.profiles
  ADD COLUMN IF NOT EXISTS district TEXT,
  ADD COLUMN IF NOT EXISTS province TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Default coordinates backfill for known Sri Lankan districts if coordinates are empty
UPDATE public.buyer_profiles
SET 
  latitude = CASE
    WHEN LOWER(COALESCE(district, '')) LIKE '%kandy%' THEN 7.2906
    WHEN LOWER(COALESCE(district, '')) LIKE '%nuwara%' THEN 6.9497
    WHEN LOWER(COALESCE(district, '')) LIKE '%badulla%' THEN 6.9934
    WHEN LOWER(COALESCE(district, '')) LIKE '%galle%' THEN 6.0535
    WHEN LOWER(COALESCE(district, '')) LIKE '%matara%' THEN 5.9549
    WHEN LOWER(COALESCE(district, '')) LIKE '%jaffna%' THEN 9.6615
    WHEN LOWER(COALESCE(district, '')) LIKE '%kurunegala%' THEN 7.4863
    WHEN LOWER(COALESCE(district, '')) LIKE '%anuradhapura%' THEN 8.3114
    ELSE 6.9271 -- Default to Colombo
  END,
  longitude = CASE
    WHEN LOWER(COALESCE(district, '')) LIKE '%kandy%' THEN 80.6337
    WHEN LOWER(COALESCE(district, '')) LIKE '%nuwara%' THEN 80.7891
    WHEN LOWER(COALESCE(district, '')) LIKE '%badulla%' THEN 81.0550
    WHEN LOWER(COALESCE(district, '')) LIKE '%galle%' THEN 80.2210
    WHEN LOWER(COALESCE(district, '')) LIKE '%matara%' THEN 80.5550
    WHEN LOWER(COALESCE(district, '')) LIKE '%jaffna%' THEN 80.0255
    WHEN LOWER(COALESCE(district, '')) LIKE '%kurunegala%' THEN 80.3623
    WHEN LOWER(COALESCE(district, '')) LIKE '%anuradhapura%' THEN 80.4037
    ELSE 79.8612 -- Default to Colombo
  END,
  coordinates = CASE
    WHEN LOWER(COALESCE(district, '')) LIKE '%kandy%' THEN '7.2906° N, 80.6337° E'
    WHEN LOWER(COALESCE(district, '')) LIKE '%nuwara%' THEN '6.9497° N, 80.7891° E'
    WHEN LOWER(COALESCE(district, '')) LIKE '%badulla%' THEN '6.9934° N, 81.0550° E'
    WHEN LOWER(COALESCE(district, '')) LIKE '%galle%' THEN '6.0535° N, 80.2210° E'
    WHEN LOWER(COALESCE(district, '')) LIKE '%matara%' THEN '5.9549° N, 80.5550° E'
    WHEN LOWER(COALESCE(district, '')) LIKE '%jaffna%' THEN '9.6615° N, 80.0255° E'
    WHEN LOWER(COALESCE(district, '')) LIKE '%kurunegala%' THEN '7.4863° N, 80.3623° E'
    WHEN LOWER(COALESCE(district, '')) LIKE '%anuradhapura%' THEN '8.3114° N, 80.4037° E'
    ELSE '6.9271° N, 79.8612° E'
  END
WHERE coordinates IS NULL OR coordinates = '' OR coordinates = ' ';

-- 4. Reload PostgREST schema cache immediately
NOTIFY pgrst, 'reload schema';

