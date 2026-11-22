-- ─────────────────────────────────────────────────────────────────
-- TraceRoot Database Migration: 012_order_placement_and_inventory.sql
-- Description: Atomic order placement RPC, inventory decrement,
--              concurrency control, security checks, and Realtime publications.
-- ─────────────────────────────────────────────────────────────────

-- 1. SECURE ATOMIC ORDER PLACEMENT FUNCTION
CREATE OR REPLACE FUNCTION public.place_buyer_order(
  p_buyer_id UUID,
  p_crop_id UUID DEFAULT NULL,
  p_quantity DECIMAL DEFAULT 1.0,
  p_unit TEXT DEFAULT 'kg',
  p_unit_price DECIMAL DEFAULT 0.0,
  p_listing_id UUID DEFAULT NULL,
  p_farmer_id UUID DEFAULT NULL,
  p_buyer_notes TEXT DEFAULT NULL,
  p_deadline TEXT DEFAULT NULL,
  p_linked_batch TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller_id UUID;
  v_farmer_id UUID;
  v_crop_name TEXT;
  v_listing_harvest_id UUID;
  v_listing_price DECIMAL(10,2);
  v_listing_unit TEXT;
  v_available_qty DECIMAL(10,2);
  v_is_active BOOLEAN;
  v_final_price DECIMAL(10,2);
  v_final_unit TEXT;
  v_seq_val BIGINT;
  v_order_id TEXT;
  v_invoice_num TEXT;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  -- 1. AUTHENTICATE CALLER & AUTHORIZATION CHECK
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    IF p_buyer_id IS NULL THEN
      RAISE EXCEPTION 'Authentication required: buyer ID must be provided';
    END IF;
  ELSE
    -- If caller has an active JWT session, prevent spoofing another user unless admin
    IF p_buyer_id IS NULL THEN
      p_buyer_id := v_caller_id;
    ELSIF p_buyer_id <> v_caller_id THEN
      IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_caller_id AND role = 'admin') THEN
        RAISE EXCEPTION 'Unauthorized: You can only place orders for your own account';
      END IF;
    END IF;
  END IF;

  -- Verify buyer profile exists
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_buyer_id) THEN
    RAISE EXCEPTION 'Buyer profile % not found', p_buyer_id;
  END IF;

  -- 2. VALIDATE QUANTITY
  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'Order quantity must be greater than zero';
  END IF;

  -- 3. PREVENT DUPLICATE SUBMISSIONS (Double-tap within 5 seconds)
  IF EXISTS (
    SELECT 1 FROM public.orders
    WHERE buyer_id = p_buyer_id
      AND (
        (p_crop_id IS NOT NULL AND crop_id = p_crop_id)
        OR (p_linked_batch IS NOT NULL AND linked_crop_batch = p_linked_batch)
      )
      AND quantity = p_quantity
      AND status = 'new'
      AND created_at > (v_now - INTERVAL '5 seconds')
  ) THEN
    RAISE EXCEPTION 'Duplicate order detected. Please wait a moment before submitting again.';
  END IF;

  -- 4. PROCESS LISTING & INVENTORY LOCKING (FOR UPDATE)
  IF p_listing_id IS NOT NULL THEN
    SELECT
      available_qty,
      farmer_id,
      harvest_id,
      price_per_unit,
      unit,
      is_active
    INTO
      v_available_qty,
      v_farmer_id,
      v_listing_harvest_id,
      v_listing_price,
      v_listing_unit,
      v_is_active
    FROM public.harvest_listings
    WHERE id = p_listing_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Listing % not found', p_listing_id;
    END IF;

    IF NOT v_is_active THEN
      RAISE EXCEPTION 'This produce listing is no longer active';
    END IF;

    IF v_available_qty < p_quantity THEN
      RAISE EXCEPTION 'Insufficient stock: only % % available', v_available_qty, COALESCE(v_listing_unit, 'kg');
    END IF;

    -- Decrement inventory atomically
    UPDATE public.harvest_listings
    SET
      available_qty = available_qty - p_quantity,
      is_active = CASE WHEN (available_qty - p_quantity) > 0 THEN TRUE ELSE FALSE END
    WHERE id = p_listing_id;

    -- Inherit crop_id, unit, and authoritative price from listing
    IF p_crop_id IS NULL THEN
      p_crop_id := v_listing_harvest_id;
    END IF;
  ELSE
    v_farmer_id := p_farmer_id;
  END IF;

  -- 5. RESOLVE HARVEST & CROP DETAILS
  IF p_crop_id IS NOT NULL THEN
    SELECT farmer_id, crop_name
    INTO v_farmer_id, v_crop_name
    FROM public.harvests
    WHERE id = p_crop_id;
  END IF;

  -- Fallback farmer if still not resolved
  IF v_farmer_id IS NULL THEN
    v_farmer_id := p_farmer_id;
  END IF;

  -- Prevent self-ordering
  IF v_farmer_id IS NOT NULL AND v_farmer_id = p_buyer_id THEN
    RAISE EXCEPTION 'Farmers cannot place orders on their own listings';
  END IF;

  -- Verify farmer profile exists if resolved
  IF v_farmer_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_farmer_id) THEN
    RAISE EXCEPTION 'Farmer profile % not found', v_farmer_id;
  END IF;

  -- Determine final authoritative unit price and unit
  v_final_price := COALESCE(v_listing_price, p_unit_price, 0.0);
  IF v_final_price < 0 THEN
    RAISE EXCEPTION 'Unit price cannot be negative';
  END IF;

  v_final_unit := COALESCE(v_listing_unit, p_unit, 'kg');

  -- 6. GENERATE SEQUENTIAL ORDER ID & INVOICE NUMBER
  v_seq_val := nextval('trace_id_seq');
  v_order_id := 'ORD-' || LPAD(v_seq_val::TEXT, 4, '0');
  v_invoice_num := 'INV-' || to_char(v_now, 'YYYY') || '-' || LPAD(v_seq_val::TEXT, 4, '0');

  -- 7. INSERT INTO ORDERS TABLE
  INSERT INTO public.orders (
    id,
    farmer_id,
    buyer_id,
    crop_id,
    quantity,
    unit,
    unit_price,
    status,
    status_timestamps,
    buyer_notes,
    deadline,
    linked_crop_batch,
    invoice_number,
    created_at,
    updated_at
  ) VALUES (
    v_order_id,
    v_farmer_id,
    p_buyer_id,
    p_crop_id,
    p_quantity,
    v_final_unit,
    v_final_price,
    'new',
    jsonb_build_object('placed', v_now),
    p_buyer_notes,
    COALESCE(p_deadline, 'Within 7 business days'),
    COALESCE(p_linked_batch, COALESCE(v_crop_name, 'Produce') || ' Batch'),
    v_invoice_num,
    v_now,
    v_now
  );

  -- 8. INSERT INTO ORDER_ITEMS TABLE
  INSERT INTO public.order_items (
    order_id,
    item_name,
    quantity,
    unit,
    unit_price
  ) VALUES (
    v_order_id,
    COALESCE(v_crop_name, 'Produce Order'),
    p_quantity,
    v_final_unit,
    v_final_price
  );

  -- 9. RETURN CREATED ORDER DETAILS
  RETURN jsonb_build_object(
    'order_id', v_order_id,
    'invoice_number', v_invoice_num,
    'farmer_id', v_farmer_id,
    'buyer_id', p_buyer_id,
    'quantity', p_quantity,
    'unit', v_final_unit,
    'unit_price', v_final_price,
    'total_price', (p_quantity * v_final_price),
    'status', 'new'
  );
END;
$$;

-- REVOKE PUBLIC / ANON PERMISSIONS AND GRANT AUTHENTICATED
REVOKE EXECUTE ON FUNCTION public.place_buyer_order(UUID, UUID, DECIMAL, TEXT, DECIMAL, UUID, UUID, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.place_buyer_order(UUID, UUID, DECIMAL, TEXT, DECIMAL, UUID, UUID, TEXT, TEXT, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.place_buyer_order(UUID, UUID, DECIMAL, TEXT, DECIMAL, UUID, UUID, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.place_buyer_order(UUID, UUID, DECIMAL, TEXT, DECIMAL, UUID, UUID, TEXT, TEXT, TEXT) TO service_role;

-- 2. CONFIGURE REALTIME REPLICA IDENTITY AND PUBLICATIONS
ALTER TABLE IF EXISTS public.orders REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.harvest_listings REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'orders'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'harvest_listings'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.harvest_listings;
    END IF;
  END IF;
END $$;
