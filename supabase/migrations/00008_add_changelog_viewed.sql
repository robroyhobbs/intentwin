-- Add last_viewed_changelog to profiles for "What's New" badge tracking
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_viewed_changelog TIMESTAMPTZ;
