-- ─────────────────────────────────────────────────────────────────
-- TraceRoot Database Migration: 011_rls_and_performance_indexes.sql
-- Description: Complete Row Level Security (RLS) policies and performance
--              indexes for all TraceRoot modules.
-- ─────────────────────────────────────────────────────────────────

-- ── 1. ENABLE ROW LEVEL SECURITY ON NEW TABLES ────────────────────
ALTER TABLE IF EXISTS orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS buyback_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS contract_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS custom_stage_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS activity_applicability ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS stage_applicability ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS disputes ENABLE ROW LEVEL SECURITY;

-- ── 2. RLS POLICIES FOR ORDERS & ORDER ITEMS ──────────────────────
DROP POLICY IF EXISTS "Parties can read their orders" ON orders;
CREATE POLICY "Parties can read their orders"
  ON orders FOR SELECT
  USING (
    auth.uid() = farmer_id
    OR auth.uid() = buyer_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Buyer can place orders" ON orders;
CREATE POLICY "Buyer can place orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = buyer_id OR auth.uid() = farmer_id);

DROP POLICY IF EXISTS "Farmer or buyer can update order status" ON orders;
CREATE POLICY "Farmer or buyer can update order status"
  ON orders FOR UPDATE
  USING (
    auth.uid() = farmer_id
    OR auth.uid() = buyer_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Parties can view order items" ON order_items;
CREATE POLICY "Parties can view order items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_items.order_id
        AND (o.farmer_id = auth.uid() OR o.buyer_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Buyer can insert order items" ON order_items;
CREATE POLICY "Buyer can insert order items"
  ON order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_items.order_id
        AND o.buyer_id = auth.uid()
    )
  );

-- ── 3. RLS POLICIES FOR BUYBACK AGREEMENTS ────────────────────────
DROP POLICY IF EXISTS "Parties view their buyback agreements" ON buyback_agreements;
CREATE POLICY "Parties view their buyback agreements"
  ON buyback_agreements FOR SELECT
  USING (
    auth.uid() = supplier_id
    OR auth.uid() = farmer_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Supplier creates buyback agreement" ON buyback_agreements;
CREATE POLICY "Supplier creates buyback agreement"
  ON buyback_agreements FOR INSERT
  WITH CHECK (auth.uid() = supplier_id);

DROP POLICY IF EXISTS "Parties update buyback agreement" ON buyback_agreements;
CREATE POLICY "Parties update buyback agreement"
  ON buyback_agreements FOR UPDATE
  USING (
    auth.uid() = supplier_id
    OR auth.uid() = farmer_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── 4. RLS POLICIES FOR CONTRACT MILESTONES ───────────────────────
DROP POLICY IF EXISTS "Parties view contract milestones" ON contract_milestones;
CREATE POLICY "Parties view contract milestones"
  ON contract_milestones FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM contracts c
      WHERE c.id = contract_milestones.contract_id
        AND (c.buyer_id = auth.uid() OR c.farmer_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Parties manage contract milestones" ON contract_milestones;
CREATE POLICY "Parties manage contract milestones"
  ON contract_milestones FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM contracts c
      WHERE c.id = contract_milestones.contract_id
        AND (c.buyer_id = auth.uid() OR c.farmer_id = auth.uid())
    )
  );

-- ── 5. RLS POLICIES FOR STAGE ACTIVITIES & APPLICABILITY ──────────
DROP POLICY IF EXISTS "Farmer manages custom activities" ON custom_stage_activities;
CREATE POLICY "Farmer manages custom activities"
  ON custom_stage_activities FOR ALL
  USING (auth.uid() = farmer_id);

DROP POLICY IF EXISTS "Public views custom activities on listed harvests" ON custom_stage_activities;
CREATE POLICY "Public views custom activities on listed harvests"
  ON custom_stage_activities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM harvests h
      WHERE h.id = custom_stage_activities.harvest_id AND h.is_listed = TRUE
    )
  );

DROP POLICY IF EXISTS "Farmer manages activity applicability" ON activity_applicability;
CREATE POLICY "Farmer manages activity applicability"
  ON activity_applicability FOR ALL
  USING (auth.uid() = farmer_id);

DROP POLICY IF EXISTS "Farmer manages stage applicability" ON stage_applicability;
CREATE POLICY "Farmer manages stage applicability"
  ON stage_applicability FOR ALL
  USING (auth.uid() = farmer_id);

-- ── 6. RLS POLICIES FOR VERIFICATION REQUESTS & AUDIT LOGS ────────
DROP POLICY IF EXISTS "User views own verification requests" ON verification_requests;
CREATE POLICY "User views own verification requests"
  ON verification_requests FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "User submits verification request" ON verification_requests;
CREATE POLICY "User submits verification request"
  ON verification_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admin manages verification requests" ON verification_requests;
CREATE POLICY "Admin manages verification requests"
  ON verification_requests FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "Admin views audit logs" ON admin_audit_logs;
CREATE POLICY "Admin views audit logs"
  ON admin_audit_logs FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "System writes audit logs" ON admin_audit_logs;
CREATE POLICY "System writes audit logs"
  ON admin_audit_logs FOR INSERT
  WITH CHECK (true);

-- ── 7. RLS POLICIES FOR DISPUTES ──────────────────────────────────
DROP POLICY IF EXISTS "Parties view their disputes" ON disputes;
CREATE POLICY "Parties view their disputes"
  ON disputes FOR SELECT
  USING (
    auth.uid() = reporter_id
    OR auth.uid() = respondent_id
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "User submits dispute" ON disputes;
CREATE POLICY "User submits dispute"
  ON disputes FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Admin manages disputes" ON disputes;
CREATE POLICY "Admin manages disputes"
  ON disputes FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ── 8. HIGH-PERFORMANCE INDEXES ───────────────────────────────────
-- Orders & Transactions
CREATE INDEX IF NOT EXISTS idx_orders_farmer_id ON orders(farmer_id);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_crop_id ON orders(crop_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- Cultivation Records & Audit Chain
CREATE INDEX IF NOT EXISTS idx_cultivation_records_harvest_stage_date 
  ON cultivation_records(harvest_id, stage, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_cultivation_records_farmer_id 
  ON cultivation_records(farmer_id);
CREATE INDEX IF NOT EXISTS idx_cultivation_records_trace_id 
  ON cultivation_records(trace_id);
CREATE INDEX IF NOT EXISTS idx_cultivation_records_corrects_id 
  ON cultivation_records(corrects_id) WHERE is_correction = TRUE;

-- Harvests & Listings
CREATE INDEX IF NOT EXISTS idx_harvests_farmer_status 
  ON harvests(farmer_id, status);
CREATE INDEX IF NOT EXISTS idx_harvests_is_listed 
  ON harvests(is_listed) WHERE is_listed = TRUE;
CREATE INDEX IF NOT EXISTS idx_harvest_listings_farmer_active 
  ON harvest_listings(farmer_id, is_active);

-- Contracts & Buybacks
CREATE INDEX IF NOT EXISTS idx_contracts_buyer_farmer_status 
  ON contracts(buyer_id, farmer_id, status);
CREATE INDEX IF NOT EXISTS idx_contract_milestones_contract_id 
  ON contract_milestones(contract_id);
CREATE INDEX IF NOT EXISTS idx_buyback_agreements_parties 
  ON buyback_agreements(supplier_id, farmer_id, status);

-- Verification, Audit & Governance
CREATE INDEX IF NOT EXISTS idx_verification_requests_user_status 
  ON verification_requests(user_id, status);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_created 
  ON admin_audit_logs(admin_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_disputes_parties_status 
  ON disputes(reporter_id, respondent_id, status);

-- Communications & Messaging
CREATE INDEX IF NOT EXISTS idx_messages_conversation 
  ON messages(sender_id, receiver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
  ON notifications(user_id, is_read, created_at DESC);

