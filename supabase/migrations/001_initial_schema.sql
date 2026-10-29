-- ─────────────────────────────────────────────────────────────────
-- TRACEROOT INITIAL SCHEMA
-- ─────────────────────────────────────────────────────────────────

-- Sequence for human-readable trace IDs (TR-0001, TR-0002 ...)
CREATE SEQUENCE IF NOT EXISTS trace_id_seq START 1;

-- ─────────────────────────────────────────────────────────────────
-- PROFILES (extends Supabase auth.users)
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role         TEXT NOT NULL CHECK (role IN ('farmer','buyer','supplier','admin')),
  full_name    TEXT NOT NULL,
  phone        TEXT,
  email        TEXT NOT NULL,
  avatar_url   TEXT,
  is_verified  BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────
-- FARMER PROFILES
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS farmer_profiles (
  id            UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  farming_type  TEXT NOT NULL CHECK (farming_type IN ('greenhouse','open_field')),
  farm_name     TEXT,
  farm_location TEXT,
  farm_lat      DECIMAL(10,8),
  farm_lng      DECIMAL(11,8),
  nic_number    TEXT,
  description   TEXT
);

-- ─────────────────────────────────────────────────────────────────
-- SUPPLIER PROFILES
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS supplier_profiles (
  id           UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  address      TEXT,
  br_number    TEXT,
  description  TEXT
);

-- ─────────────────────────────────────────────────────────────────
-- BUYER PROFILES
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS buyer_profiles (
  id            UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  buyer_type    TEXT NOT NULL CHECK (buyer_type IN ('supermarket','retailer','restaurant')),
  company_name  TEXT NOT NULL,
  address       TEXT,
  br_number     TEXT
);

-- ─────────────────────────────────────────────────────────────────
-- HARVESTS (one row = one crop cycle)
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS harvests (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id             UUID NOT NULL REFERENCES profiles(id),
  crop_name             TEXT NOT NULL,
  crop_emoji            TEXT,
  farming_type          TEXT NOT NULL CHECK (farming_type IN ('greenhouse','open_field')),
  planted_date          DATE NOT NULL,
  expected_harvest_date DATE,
  status                TEXT NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active','harvested','sold','contracted')),
  current_stage         TEXT NOT NULL DEFAULT 'seedling'
                        CHECK (current_stage IN (
                          'seedling','vegetative_growth','flowering','fruiting','harvested'
                        )),
  description           TEXT,
  cover_image_url       TEXT,
  is_listed             BOOLEAN DEFAULT FALSE,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────
-- CULTIVATION RECORDS (APPEND-ONLY)
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cultivation_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trace_id        TEXT UNIQUE NOT NULL
                  DEFAULT ('TR-' || LPAD(nextval('trace_id_seq')::TEXT, 4, '0')),
  harvest_id      UUID NOT NULL REFERENCES harvests(id) ON DELETE CASCADE,
  farmer_id       UUID NOT NULL REFERENCES profiles(id),
  stage           TEXT NOT NULL CHECK (stage IN (
                    'seedling','vegetative_growth','flowering','fruiting','harvested'
                  )),
  activity_type   TEXT NOT NULL,
  notes           TEXT,
  inputs_used     JSONB,
  conditions      JSONB,
  photo_url       TEXT,
  photo_taken_at  TIMESTAMPTZ,
  is_live_capture BOOLEAN DEFAULT TRUE,
  location_name   TEXT,
  latitude        DECIMAL(10,8),
  longitude       DECIMAL(11,8),
  sync_status     TEXT NOT NULL DEFAULT 'synced'
                  CHECK (sync_status IN ('synced','pending')),
  recorded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_correction   BOOLEAN DEFAULT FALSE,
  corrects_id     UUID REFERENCES cultivation_records(id),
  integrity_hash  TEXT NOT NULL
);

-- ─────────────────────────────────────────────────────────────────
-- SUPPLIER CATALOGUE
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS catalogue_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id  UUID NOT NULL REFERENCES profiles(id),
  name         TEXT NOT NULL,
  category     TEXT NOT NULL CHECK (category IN ('seed','fertilizer','pesticide','tool','other')),
  description  TEXT,
  price        DECIMAL(10,2) NOT NULL,
  unit         TEXT NOT NULL,
  stock_qty    INTEGER DEFAULT 0,
  image_url    TEXT,
  is_available BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────
-- SUPPLIER ORDERS
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS supplier_orders (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id    UUID NOT NULL REFERENCES profiles(id),
  supplier_id  UUID NOT NULL REFERENCES profiles(id),
  items        JSONB NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending','confirmed','shipped','delivered','cancelled')),
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────
-- HARVEST LISTINGS
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS harvest_listings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  harvest_id      UUID NOT NULL REFERENCES harvests(id) ON DELETE CASCADE,
  farmer_id       UUID NOT NULL REFERENCES profiles(id),
  title           TEXT NOT NULL,
  description     TEXT,
  price_per_unit  DECIMAL(10,2),
  unit            TEXT,
  available_qty   DECIMAL(10,2),
  images          JSONB,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────
-- BUYER ORDERS
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS buyer_orders (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id  UUID NOT NULL REFERENCES harvest_listings(id) ON DELETE CASCADE,
  buyer_id    UUID NOT NULL REFERENCES profiles(id),
  farmer_id   UUID NOT NULL REFERENCES profiles(id),
  quantity    DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2),
  status      TEXT NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending','accepted','rejected','completed','cancelled')),
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────
-- CONTRACTS
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contracts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id        UUID NOT NULL REFERENCES profiles(id),
  farmer_id       UUID REFERENCES profiles(id),
  crop_required   TEXT NOT NULL,
  farming_type    TEXT NOT NULL CHECK (farming_type IN ('greenhouse','open_field','any')),
  quantity        DECIMAL(10,2) NOT NULL,
  unit            TEXT NOT NULL,
  delivery_date   DATE,
  price_agreed    DECIMAL(10,2),
  requirements    TEXT,
  status          TEXT NOT NULL DEFAULT 'open'
                  CHECK (status IN (
                    'open','matched','in_progress','completed','disputed','cancelled'
                  )),
  harvest_id      UUID REFERENCES harvests(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────
-- MESSAGES
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id   UUID NOT NULL REFERENCES profiles(id),
  receiver_id UUID NOT NULL REFERENCES profiles(id),
  content     TEXT NOT NULL,
  is_read     BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────
-- NOTIFICATIONS
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id),
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  type       TEXT NOT NULL CHECK (type IN ('order','contract','message','verification','sync')),
  ref_id     UUID,
  is_read    BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
