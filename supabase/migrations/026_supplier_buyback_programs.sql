-- ─────────────────────────────────────────────────────────────────
-- TraceRoot Database Migration: 026_supplier_buyback_programs.sql
-- Description: Supplier Buy-Back Programs (seed-to-harvest contracts)
--              and optional link from buyback_agreements.
-- ─────────────────────────────────────────────────────────────────

CREATE SEQUENCE IF NOT EXISTS buyback_program_seq START WITH 1 INCREMENT BY 1;

CREATE TABLE IF NOT EXISTS buyback_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_code TEXT UNIQUE NOT NULL
    DEFAULT ('BB-' || LPAD(nextval('buyback_program_seq')::TEXT, 3, '0')),
  supplier_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  crop_name TEXT NOT NULL,
  buyback_price DECIMAL(10,2) NOT NULL CHECK (buyback_price > 0),
  unit TEXT NOT NULL DEFAULT 'kg',
  expected_volume_kg DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (expected_volume_kg >= 0),
  max_farmers INTEGER NOT NULL DEFAULT 10 CHECK (max_farmers > 0),
  enrolled_farmers INTEGER NOT NULL DEFAULT 0 CHECK (enrolled_farmers >= 0),
  included_inputs TEXT[] NOT NULL DEFAULT ARRAY['Seeds']::TEXT[],
  cover_image_key TEXT DEFAULT 'tomato',
  cover_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'closed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_buyback_programs_supplier_id
  ON buyback_programs (supplier_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_buyback_programs_status
  ON buyback_programs (status);

-- Link individual buyback agreements optionally to a Buy-Back Program
ALTER TABLE buyback_agreements
  ADD COLUMN IF NOT EXISTS program_id UUID REFERENCES buyback_programs(id) ON DELETE SET NULL;

-- Row Level Security
ALTER TABLE buyback_programs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Suppliers can view own buyback programs" ON buyback_programs;
CREATE POLICY "Suppliers can view own buyback programs"
  ON buyback_programs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = supplier_id OR status = 'active');

DROP POLICY IF EXISTS "Suppliers can insert own buyback programs" ON buyback_programs;
CREATE POLICY "Suppliers can insert own buyback programs"
  ON buyback_programs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = supplier_id);

DROP POLICY IF EXISTS "Suppliers can update own buyback programs" ON buyback_programs;
CREATE POLICY "Suppliers can update own buyback programs"
  ON buyback_programs
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = supplier_id)
  WITH CHECK (auth.uid() = supplier_id);

DROP POLICY IF EXISTS "Suppliers can delete own buyback programs" ON buyback_programs;
CREATE POLICY "Suppliers can delete own buyback programs"
  ON buyback_programs
  FOR DELETE
  TO authenticated
  USING (auth.uid() = supplier_id);
