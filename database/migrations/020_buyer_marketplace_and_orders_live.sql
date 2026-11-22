-- Migration 020: Enable live Buyer Marketplace discovery of Farmer harvests & real-time orders

-- 1. Ensure existing active harvests are listed for marketplace discovery
UPDATE public.harvests
SET is_listed = TRUE
WHERE status = 'active' AND (is_listed IS NULL OR is_listed = FALSE);

-- 2. Ensure RLS permits buyers to view listed or active harvests
DROP POLICY IF EXISTS "Buyer reads listed harvests" ON public.harvests;
CREATE POLICY "Buyer reads listed harvests"
  ON public.harvests FOR SELECT
  USING (is_listed = TRUE OR status = 'active');

-- 3. Ensure RLS on cultivation_records allows reading records of listed or active harvests
DROP POLICY IF EXISTS "Buyer reads records of listed harvests" ON public.cultivation_records;
CREATE POLICY "Buyer reads records of listed harvests"
  ON public.cultivation_records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.harvests h
      WHERE h.id = harvest_id AND (h.is_listed = TRUE OR h.status = 'active')
    )
  );

-- 4. Ensure realtime publication includes orders and harvests
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND tablename = 'orders'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND tablename = 'harvests'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.harvests;
    END IF;
  END IF;
END $$;
