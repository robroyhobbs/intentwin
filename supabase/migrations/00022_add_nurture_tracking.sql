-- Add nurture email tracking to waitlist
-- Note: waitlist table is created in 00024. Use DO block to handle both cases:
-- 1. Fresh DB (table doesn't exist yet — skip, 00024 will create it, then we alter)
-- 2. Existing DB (table exists — add columns)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'waitlist') THEN
    ALTER TABLE public.waitlist ADD COLUMN IF NOT EXISTS nurture_step integer NOT NULL DEFAULT 0;
    ALTER TABLE public.waitlist ADD COLUMN IF NOT EXISTS nurture_last_sent_at timestamptz;
  END IF;
END $$;
