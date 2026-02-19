-- Add generation_error column to proposals table.
-- Used by the Inngest generate function to surface partial-failure info to the UI
-- (e.g. "3 of 10 sections failed. You can regenerate failed sections individually.")
alter table public.proposals
  add column if not exists generation_error text;
