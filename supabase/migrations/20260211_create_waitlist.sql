-- Create waitlist table for request-access form
create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  company text not null,
  company_size text check (company_size in ('1-10', '11-50', '51-200', '201-500', '500+')),
  created_at timestamptz not null default now(),
  status text not null default 'pending' check (status in ('pending', 'contacted', 'approved', 'rejected')),
  notes text
);

-- Enable Row Level Security
alter table public.waitlist enable row level security;

-- Only allow inserts via service_role (API routes use the admin/service-role client)
create policy "Service role can insert waitlist entries"
  on public.waitlist
  for insert
  to service_role
  with check (true);

-- Allow service_role full access for admin operations
create policy "Service role has full access to waitlist"
  on public.waitlist
  for all
  to service_role
  using (true)
  with check (true);

-- Index on email for fast duplicate lookups
create index if not exists idx_waitlist_email on public.waitlist (email);

-- Index on status for admin filtering
create index if not exists idx_waitlist_status on public.waitlist (status);
