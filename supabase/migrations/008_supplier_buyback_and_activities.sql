-- ─────────────────────────────────────────────────────────────────
-- TraceRoot Database Migration: 008_supplier_buyback_and_activities.sql
-- Description: Supplier buyback contracts, stage milestones, custom activities,
--              and per-crop applicability rules.
-- ─────────────────────────────────────────────────────────────────

-- 1. SUPPLIER BUYBACK AGREEMENTS
CREATE TABLE IF NOT EXISTS buyback_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_code TEXT UNIQUE NOT NULL
    DEFAULT ('BB-' || LPAD(nextval('trace_id_seq')::TEXT, 4, '0')),
  supplier_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  farmer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  crop_name TEXT NOT NULL,
  target_quantity DECIMAL(10,2) NOT NULL,
  unit TEXT NOT NULL DEFAULT 'kg',
  agreed_price DECIMAL(10,2) NOT NULL,
  total_commitment DECIMAL(10,2) GENERATED ALWAYS AS (target_quantity * agreed_price) STORED,
  deadline DATE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'fulfilled', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CONTRACT MILESTONES (Progress Tracking for Buyer & Farmer Contracts)
CREATE TABLE IF NOT EXISTS contract_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  stage TEXT CHECK (stage IN ('planting', 'vegetative_growth', 'flowering', 'crop_maturity', 'harvesting')),
  target_date DATE,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  evidence_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CUSTOM STAGE ACTIVITIES (Farmer-defined activities per stage)
CREATE TABLE IF NOT EXISTS custom_stage_activities (
  id TEXT PRIMARY KEY,
  farmer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  harvest_id UUID REFERENCES harvests(id) ON DELETE CASCADE,
  stage TEXT NOT NULL CHECK (stage IN ('planting', 'vegetative_growth', 'flowering', 'crop_maturity', 'harvesting')),
  activity_name TEXT NOT NULL,
  category TEXT,
  icon_name TEXT DEFAULT 'sprout',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ACTIVITY APPLICABILITY (Marking specific activities applicable/non-applicable per crop)
CREATE TABLE IF NOT EXISTS activity_applicability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  harvest_id UUID NOT NULL REFERENCES harvests(id) ON DELETE CASCADE,
  activity_id TEXT NOT NULL,
  is_applicable BOOLEAN DEFAULT TRUE,
  reason TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_harvest_activity UNIQUE (harvest_id, activity_id)
);

-- 5. STAGE APPLICABILITY (Optional stage bypass with justified reason)
CREATE TABLE IF NOT EXISTS stage_applicability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  harvest_id UUID NOT NULL REFERENCES harvests(id) ON DELETE CASCADE,
  stage TEXT NOT NULL CHECK (stage IN ('planting', 'vegetative_growth', 'flowering', 'crop_maturity', 'harvesting')),
  is_applicable BOOLEAN DEFAULT TRUE,
  reason TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_harvest_stage UNIQUE (harvest_id, stage)
);

