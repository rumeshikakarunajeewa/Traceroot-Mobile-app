-- ─────────────────────────────────────────────────────────────────
-- TRACEROOT ROW LEVEL SECURITY (RLS) POLICIES
-- Safe to run multiple times (idempotent with DROP POLICY IF EXISTS)
-- ─────────────────────────────────────────────────────────────────

-- ── PROFILES ────────────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "User sees own profile" ON profiles;
CREATE POLICY "User sees own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "User inserts own profile" ON profiles;
CREATE POLICY "User inserts own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "User updates own profile" ON profiles;
CREATE POLICY "User updates own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Public sees basic profile info" ON profiles;
CREATE POLICY "Public sees basic profile info"
  ON profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin sees all profiles" ON profiles;
CREATE POLICY "Admin sees all profiles"
  ON profiles FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── ROLE SUB-PROFILES ───────────────────────────────────────────
ALTER TABLE farmer_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view farmer profiles" ON farmer_profiles;
CREATE POLICY "Public can view farmer profiles"
  ON farmer_profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Farmer manages own farmer profile" ON farmer_profiles;
CREATE POLICY "Farmer manages own farmer profile"
  ON farmer_profiles FOR ALL USING (auth.uid() = id);

ALTER TABLE supplier_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view supplier profiles" ON supplier_profiles;
CREATE POLICY "Public can view supplier profiles"
  ON supplier_profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Supplier manages own supplier profile" ON supplier_profiles;
CREATE POLICY "Supplier manages own supplier profile"
  ON supplier_profiles FOR ALL USING (auth.uid() = id);

ALTER TABLE buyer_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view buyer profiles" ON buyer_profiles;
CREATE POLICY "Public can view buyer profiles"
  ON buyer_profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Buyer manages own buyer profile" ON buyer_profiles;
CREATE POLICY "Buyer manages own buyer profile"
  ON buyer_profiles FOR ALL USING (auth.uid() = id);

-- ── CULTIVATION RECORDS (APPEND-ONLY) ───────────────────────────
ALTER TABLE cultivation_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Farmer inserts own records" ON cultivation_records;
CREATE POLICY "Farmer inserts own records"
  ON cultivation_records FOR INSERT
  WITH CHECK (auth.uid() = farmer_id);

DROP POLICY IF EXISTS "Farmer reads own records" ON cultivation_records;
CREATE POLICY "Farmer reads own records"
  ON cultivation_records FOR SELECT
  USING (auth.uid() = farmer_id);

DROP POLICY IF EXISTS "Buyer reads records of listed harvests" ON cultivation_records;
CREATE POLICY "Buyer reads records of listed harvests"
  ON cultivation_records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM harvests h
      WHERE h.id = harvest_id AND h.is_listed = TRUE
    )
  );

DROP POLICY IF EXISTS "Supplier reads records of supplied farmers" ON cultivation_records;
CREATE POLICY "Supplier reads records of supplied farmers"
  ON cultivation_records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM supplier_orders so
      WHERE so.farmer_id = cultivation_records.farmer_id
        AND so.supplier_id = auth.uid()
    )
  );

-- NO UPDATE POLICY → records are immutable
-- NO DELETE POLICY → records are permanent

-- ── HARVESTS ────────────────────────────────────────────────────
ALTER TABLE harvests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Farmer manages own harvests" ON harvests;
CREATE POLICY "Farmer manages own harvests"
  ON harvests FOR ALL USING (auth.uid() = farmer_id);

DROP POLICY IF EXISTS "Buyer reads listed harvests" ON harvests;
CREATE POLICY "Buyer reads listed harvests"
  ON harvests FOR SELECT USING (is_listed = TRUE);

DROP POLICY IF EXISTS "Supplier reads harvests of supplied farmers" ON harvests;
CREATE POLICY "Supplier reads harvests of supplied farmers"
  ON harvests FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM supplier_orders so
      WHERE so.farmer_id = harvests.farmer_id
        AND so.supplier_id = auth.uid()
    )
  );

-- ── SUPPLIER CATALOGUE & ORDERS ─────────────────────────────────
ALTER TABLE catalogue_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public reads catalogue items" ON catalogue_items;
CREATE POLICY "Public reads catalogue items"
  ON catalogue_items FOR SELECT USING (is_available = TRUE);

DROP POLICY IF EXISTS "Supplier manages own items" ON catalogue_items;
CREATE POLICY "Supplier manages own items"
  ON catalogue_items FOR ALL USING (auth.uid() = supplier_id);

ALTER TABLE supplier_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Farmer and supplier view supplier order" ON supplier_orders;
CREATE POLICY "Farmer and supplier view supplier order"
  ON supplier_orders FOR SELECT
  USING (auth.uid() = farmer_id OR auth.uid() = supplier_id);

DROP POLICY IF EXISTS "Farmer places supplier order" ON supplier_orders;
CREATE POLICY "Farmer places supplier order"
  ON supplier_orders FOR INSERT
  WITH CHECK (auth.uid() = farmer_id);

DROP POLICY IF EXISTS "Supplier updates supplier order" ON supplier_orders;
CREATE POLICY "Supplier updates supplier order"
  ON supplier_orders FOR UPDATE
  USING (auth.uid() = supplier_id);

-- ── HARVEST LISTINGS & BUYER ORDERS ─────────────────────────────
ALTER TABLE harvest_listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public reads active listings" ON harvest_listings;
CREATE POLICY "Public reads active listings"
  ON harvest_listings FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "Farmer manages own listings" ON harvest_listings;
CREATE POLICY "Farmer manages own listings"
  ON harvest_listings FOR ALL USING (auth.uid() = farmer_id);

ALTER TABLE buyer_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Buyer and farmer view buyer order" ON buyer_orders;
CREATE POLICY "Buyer and farmer view buyer order"
  ON buyer_orders FOR SELECT
  USING (auth.uid() = buyer_id OR auth.uid() = farmer_id);

DROP POLICY IF EXISTS "Buyer places buyer order" ON buyer_orders;
CREATE POLICY "Buyer places buyer order"
  ON buyer_orders FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

DROP POLICY IF EXISTS "Parties update buyer order" ON buyer_orders;
CREATE POLICY "Parties update buyer order"
  ON buyer_orders FOR UPDATE
  USING (auth.uid() = buyer_id OR auth.uid() = farmer_id);

-- ── CONTRACTS ───────────────────────────────────────────────────
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Buyer manages own contracts" ON contracts;
CREATE POLICY "Buyer manages own contracts"
  ON contracts FOR ALL USING (auth.uid() = buyer_id);

DROP POLICY IF EXISTS "Public reads open contracts" ON contracts;
CREATE POLICY "Public reads open contracts"
  ON contracts FOR SELECT
  USING (status = 'open' OR auth.uid() = farmer_id OR auth.uid() = buyer_id);

DROP POLICY IF EXISTS "Farmer accepts contract" ON contracts;
CREATE POLICY "Farmer accepts contract"
  ON contracts FOR UPDATE USING (auth.uid() = farmer_id);

-- ── MESSAGES ────────────────────────────────────────────────────
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Parties read their own messages" ON messages;
CREATE POLICY "Parties read their own messages"
  ON messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Authenticated user sends message" ON messages;
CREATE POLICY "Authenticated user sends message"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- ── NOTIFICATIONS ───────────────────────────────────────────────
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "User sees own notifications" ON notifications;
CREATE POLICY "User sees own notifications"
  ON notifications FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "User marks own notification as read" ON notifications;
CREATE POLICY "User marks own notification as read"
  ON notifications FOR UPDATE USING (auth.uid() = user_id);
