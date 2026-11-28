-- ─────────────────────────────────────────────────────────────────
-- TRACEROOT: REAL-TIME BUYER <-> FARMER MESSAGING SUPPORT
-- Adds UPDATE RLS policy for read receipts, enables Realtime on
-- public.messages, and adds unread lookup index.
-- Safe and idempotent to run in Supabase SQL Editor.
-- ─────────────────────────────────────────────────────────────────

-- 1. Allow message receivers to mark incoming messages as read
DROP POLICY IF EXISTS "Receivers can mark messages as read" ON public.messages;
CREATE POLICY "Receivers can mark messages as read"
  ON public.messages FOR UPDATE
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

-- 2. Index for fast unread count badges per user
CREATE INDEX IF NOT EXISTS idx_messages_receiver_unread
  ON public.messages(receiver_id, is_read);

-- 3. Enable full replica identity and register messages in supabase_realtime
ALTER TABLE public.messages REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'messages'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    END IF;
  END IF;
END $$;
