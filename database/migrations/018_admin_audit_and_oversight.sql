-- ─────────────────────────────────────────────────────────────────
-- TraceRoot Database Migration: 017_admin_audit_and_oversight.sql
-- Description: Platform-wide admin audit access for cultivation records,
--              harvests, and governance query performance indexes.
-- ─────────────────────────────────────────────────────────────────

-- 1. ADMIN SELECT POLICY FOR CULTIVATION RECORDS AUDIT
-- Allows authenticated admins to inspect all cultivation records for
-- traceability verification, tamper audits, and dispute resolution.
-- Does NOT grant UPDATE or DELETE (strictly append-only).
DROP POLICY IF EXISTS "Admin views all cultivation records" ON public.cultivation_records;
CREATE POLICY "Admin views all cultivation records"
  ON public.cultivation_records FOR SELECT
  USING (public.is_admin());

-- 2. ADMIN SELECT POLICY FOR HARVESTS OVERSIGHT
-- Allows admins to view all crops/harvest cycles regardless of listing status.
DROP POLICY IF EXISTS "Admin views all harvests" ON public.harvests;
CREATE POLICY "Admin views all harvests"
  ON public.harvests FOR SELECT
  USING (public.is_admin());

-- 3. ADMIN POLICY FOR CATALOGUE ITEMS OVERSIGHT
DROP POLICY IF EXISTS "Admin manages all catalogue items" ON public.catalogue_items;
CREATE POLICY "Admin manages all catalogue items"
  ON public.catalogue_items FOR ALL
  USING (public.is_admin());

-- 4. PERFORMANCE INDEXES FOR ADMIN DASHBOARD QUERIES
CREATE INDEX IF NOT EXISTS idx_verification_requests_status 
  ON public.verification_requests(status);

CREATE INDEX IF NOT EXISTS idx_verification_requests_user_id 
  ON public.verification_requests(user_id);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at 
  ON public.admin_audit_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_target 
  ON public.admin_audit_logs(target_entity, target_id);

CREATE INDEX IF NOT EXISTS idx_disputes_status 
  ON public.disputes(status);

