-- ─────────────────────────────────────────────────────────────────
-- TraceRoot Database Migration: 009_admin_verification_and_governance.sql
-- Description: Admin identity verification, audit trail, and dispute resolution.
-- ─────────────────────────────────────────────────────────────────

-- 1. VERIFICATION REQUESTS (Farmers, Buyers, and Suppliers submitting official proof)
CREATE TABLE IF NOT EXISTS verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('farmer', 'buyer', 'supplier')),
  document_type TEXT NOT NULL CHECK (document_type IN ('nic', 'business_registration', 'organic_certificate', 'land_deed', 'other')),
  document_number TEXT,
  document_urls TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'more_info_needed')),
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewer_notes TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

-- 2. ADMIN AUDIT LOGS (Immutable administrative activity trail)
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_entity TEXT NOT NULL,
  target_id TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. DISPUTES & COMPLIANCE REPORTS
CREATE TABLE IF NOT EXISTS disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_code TEXT UNIQUE NOT NULL
    DEFAULT ('DISP-' || LPAD(nextval('trace_id_seq')::TEXT, 4, '0')),
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  respondent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  order_id TEXT REFERENCES orders(id) ON DELETE SET NULL,
  contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
  category TEXT NOT NULL CHECK (category IN (
    'quality_issue',
    'delivery_failure',
    'payment_default',
    'record_tampering',
    'other'
  )),
  description TEXT NOT NULL,
  evidence_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'under_investigation', 'resolved', 'dismissed')),
  resolution_notes TEXT,
  resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- 4. AUTOMATIC PROFILE VERIFICATION ON APPROVAL TRIGGER
CREATE OR REPLACE FUNCTION public.handle_verification_approval()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    UPDATE public.profiles
    SET is_verified = TRUE,
        updated_at = NOW()
    WHERE id = NEW.user_id;

    -- Add an audit log entry
    INSERT INTO public.admin_audit_logs (admin_id, action, target_entity, target_id, details)
    VALUES (
      COALESCE(NEW.reviewed_by, NEW.user_id),
      'USER_VERIFIED',
      'profiles',
      NEW.user_id::TEXT,
      jsonb_build_object(
        'document_type', NEW.document_type,
        'document_number', NEW.document_number,
        'approved_at', NOW()
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_verification_approval ON verification_requests;
CREATE TRIGGER trg_verification_approval
  AFTER UPDATE OF status ON verification_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_verification_approval();

