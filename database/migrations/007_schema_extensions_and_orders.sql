-- ─────────────────────────────────────────────────────────────────
-- TraceRoot Database Migration: 007_schema_extensions_and_orders.sql
-- Description: Non-destructive profile extensions, dedicated orders table,
--              and compatibility views for frontend relations.
-- ─────────────────────────────────────────────────────────────────

-- 1. EXTEND PROFILES WITH PROFILE STORE ATTRIBUTES
ALTER TABLE IF EXISTS profiles
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS farm_name TEXT,
  ADD COLUMN IF NOT EXISTS district TEXT,
  ADD COLUMN IF NOT EXISTS province TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Sri Lanka',
  ADD COLUMN IF NOT EXISTS trust_score INTEGER DEFAULT 100,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. EXTEND ROLE-SPECIFIC SUB-PROFILES
ALTER TABLE IF EXISTS farmer_profiles
  ADD COLUMN IF NOT EXISTS total_acreage DECIMAL(8,2) DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS primary_crops TEXT[],
  ADD COLUMN IF NOT EXISTS certifications JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE IF EXISTS buyer_profiles
  ADD COLUMN IF NOT EXISTS district TEXT,
  ADD COLUMN IF NOT EXISTS province TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Sri Lanka',
  ADD COLUMN IF NOT EXISTS coordinates TEXT,
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS trust_score INTEGER DEFAULT 95,
  ADD COLUMN IF NOT EXISTS trust_score_label TEXT DEFAULT 'Verified Buyer',
  ADD COLUMN IF NOT EXISTS registration_id TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE IF EXISTS supplier_profiles
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Agricultural Raw Materials',
  ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 5.0,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 3. DEDICATED ORDERS TABLE (Matched with src/lib/api/orders.ts & Figma flows)
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY DEFAULT ('ORD-' || LPAD(nextval('trace_id_seq')::TEXT, 4, '0')),
  farmer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  buyer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  crop_id UUID REFERENCES harvests(id) ON DELETE SET NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1.0,
  unit TEXT NOT NULL DEFAULT 'kg',
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0.0,
  total_price DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN (
      'new',
      'accepted',
      'ready',
      'delivered',
      'declined',
      'cancelled',
      'Growing',
      'Pending',
      'processing',
      'confirmed',
      'in_transit'
    )),
  status_timestamps JSONB DEFAULT '{}'::jsonb,
  decline_reason TEXT,
  deadline TEXT,
  buyer_notes TEXT,
  linked_crop_batch TEXT,
  crop_route_id TEXT,
  invoice_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. NORMALIZED ORDER ITEMS (Multi-item support for orders)
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit TEXT NOT NULL DEFAULT 'kg',
  unit_price DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  catalogue_item_id UUID REFERENCES catalogue_items(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. COMPATIBILITY VIEWS FOR POSTGREST RELATION JOINS
-- Used by: supabase.from('orders').select('..., crops(name, image_url), buyers(name, verified)')

CREATE OR REPLACE VIEW crops AS
  SELECT
    id,
    farmer_id,
    crop_name AS name,
    crop_emoji AS emoji,
    farming_type,
    planted_date,
    expected_harvest_date,
    status,
    current_stage,
    description,
    cover_image_url AS image_url,
    is_listed,
    created_at
  FROM harvests;

CREATE OR REPLACE VIEW buyers AS
  SELECT
    p.id,
    p.full_name AS name,
    p.email,
    p.phone,
    p.avatar_url,
    p.is_verified AS verified,
    bp.buyer_type,
    bp.company_name,
    bp.address,
    bp.br_number,
    bp.trust_score,
    p.created_at
  FROM profiles p
  LEFT JOIN buyer_profiles bp ON bp.id = p.id
  WHERE p.role = 'buyer' OR p.role = 'admin';

