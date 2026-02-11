-- Add nurture email tracking to waitlist
ALTER TABLE public.waitlist ADD COLUMN IF NOT EXISTS nurture_step integer NOT NULL DEFAULT 0;
ALTER TABLE public.waitlist ADD COLUMN IF NOT EXISTS nurture_last_sent_at timestamptz;
