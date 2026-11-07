-- ─────────────────────────────────────────────────────────────────
-- TraceRoot Database Migration: 010_immutability_and_security.sql
-- Description: Engine-level append-only immutability enforcement for cultivation
--              records, correction chain validation, and timestamp triggers.
-- ─────────────────────────────────────────────────────────────────

-- 1. STRICT ENGINE-LEVEL IMMUTABILITY TRIGGER FOR CULTIVATION RECORDS
-- Guarantees no UPDATE or DELETE can ever occur on submitted cultivation records,
-- even through elevated service-role privileges or custom functions.
CREATE OR REPLACE FUNCTION public.enforce_cultivation_record_immutability()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'TraceRoot Ledger Integrity Violation: Cultivation record [%] (Trace ID: %) is permanent and append-only. Edits and deletions are prohibited.',
    OLD.id,
    COALESCE(OLD.trace_id, 'N/A');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_cultivation_records_immutable ON cultivation_records;
CREATE TRIGGER trg_cultivation_records_immutable
  BEFORE UPDATE OR DELETE ON cultivation_records
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_cultivation_record_immutability();

-- 2. CORRECTION CHAIN INTEGRITY CONSTRAINT
-- If a record is marked as a correction, it MUST reference an original record.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_cultivation_correction_integrity'
  ) THEN
    ALTER TABLE cultivation_records
      ADD CONSTRAINT chk_cultivation_correction_integrity
      CHECK (
        (is_correction IS NOT TRUE) OR (is_correction IS TRUE AND corrects_id IS NOT NULL)
      );
  END IF;
END $$;

-- 3. AUTOMATIC UPDATED_AT TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to mutable tables
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS trg_orders_updated_at ON orders;
CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS trg_buyback_agreements_updated_at ON buyback_agreements;
CREATE TRIGGER trg_buyback_agreements_updated_at
  BEFORE UPDATE ON buyback_agreements
  FOR EACH ROW
  EXECUTE FUNCTION public.set_current_timestamp_updated_at();

