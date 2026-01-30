-- Migration: Add Organizations for Multi-Tenancy
-- This migration adds proper SaaS multi-tenancy with organizations

-- ==================
-- ORGANIZATIONS TABLE
-- ==================
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,

  -- Billing (Stripe)
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  stripe_price_id text,

  -- Plan & Limits
  plan_tier text not null default 'trial'
    check (plan_tier in ('trial', 'starter', 'pro', 'business', 'enterprise')),
  plan_limits jsonb not null default '{
    "proposals_per_month": 3,
    "ai_tokens_per_month": 50000,
    "max_users": 1,
    "max_documents": 10
  }'::jsonb,

  -- Usage Tracking
  usage_current_period jsonb not null default '{
    "proposals_created": 0,
    "ai_tokens_used": 0,
    "documents_uploaded": 0
  }'::jsonb,
  billing_cycle_start timestamptz,
  billing_cycle_end timestamptz,

  -- Trial
  trial_ends_at timestamptz default (now() + interval '14 days'),

  -- Settings
  settings jsonb not null default '{}'::jsonb,

  -- Timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Slug generation function
create or replace function generate_org_slug(org_name text)
returns text as $$
declare
  base_slug text;
  final_slug text;
  counter int := 0;
begin
  -- Convert to lowercase, replace spaces with hyphens, remove special chars
  base_slug := lower(regexp_replace(org_name, '[^a-zA-Z0-9\s]', '', 'g'));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := substring(base_slug from 1 for 50);

  final_slug := base_slug;

  -- Check for uniqueness and append number if needed
  while exists (select 1 from public.organizations where slug = final_slug) loop
    counter := counter + 1;
    final_slug := base_slug || '-' || counter::text;
  end loop;

  return final_slug;
end;
$$ language plpgsql;

-- ==================
-- ADD ORGANIZATION_ID TO EXISTING TABLES
-- ==================

-- Teams belong to organizations
alter table public.teams
  add column organization_id uuid references public.organizations(id) on delete cascade;

-- Profiles belong to organizations (through signup)
alter table public.profiles
  add column organization_id uuid references public.organizations(id) on delete set null;

-- Proposals belong to organizations
alter table public.proposals
  add column organization_id uuid references public.organizations(id) on delete cascade;

-- Documents belong to organizations
alter table public.documents
  add column organization_id uuid references public.organizations(id) on delete cascade;

-- ==================
-- UPDATE HANDLE_NEW_USER FUNCTION
-- Auto-create organization on signup
-- ==================
create or replace function public.handle_new_user()
returns trigger as $$
declare
  new_org_id uuid;
  org_name text;
  org_slug text;
begin
  -- Get organization name from metadata or use email domain
  org_name := coalesce(
    new.raw_user_meta_data->>'organization_name',
    split_part(new.email, '@', 1) || '''s Organization'
  );

  -- Generate slug
  org_slug := generate_org_slug(org_name);

  -- Create organization
  insert into public.organizations (name, slug)
  values (org_name, org_slug)
  returning id into new_org_id;

  -- Create profile linked to organization
  insert into public.profiles (id, email, full_name, organization_id, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new_org_id,
    'admin'  -- First user in org is admin
  );

  return new;
end;
$$ language plpgsql security definer;

-- ==================
-- ENABLE RLS ON ORGANIZATIONS
-- ==================
alter table public.organizations enable row level security;

-- Users can only see their own organization
create policy "organizations_select_own" on public.organizations
  for select to authenticated
  using (
    id in (
      select p.organization_id from public.profiles p
      where p.id = (select auth.uid())
    )
  );

-- Only admins can update their organization
create policy "organizations_update_admin" on public.organizations
  for update to authenticated
  using (
    id in (
      select p.organization_id from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'admin'
    )
  );

-- ==================
-- UPDATE RLS POLICIES FOR ORGANIZATION SCOPING
-- ==================

-- Drop old policies
drop policy if exists "profiles_select_all" on public.profiles;
drop policy if exists "teams_select_all" on public.teams;
drop policy if exists "documents_select" on public.documents;
drop policy if exists "proposals_select" on public.proposals;

-- Profiles - only see users in same organization
create policy "profiles_select_org" on public.profiles
  for select to authenticated
  using (
    organization_id in (
      select p.organization_id from public.profiles p
      where p.id = (select auth.uid())
    )
  );

-- Teams - only see teams in same organization
create policy "teams_select_org" on public.teams
  for select to authenticated
  using (
    organization_id in (
      select p.organization_id from public.profiles p
      where p.id = (select auth.uid())
    )
  );

-- Update teams insert policy
drop policy if exists "teams_insert_admin" on public.teams;
create policy "teams_insert_org_admin" on public.teams
  for insert to authenticated
  with check (
    organization_id in (
      select p.organization_id from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'admin'
    )
  );

-- Documents - only see documents in same organization
create policy "documents_select_org" on public.documents
  for select to authenticated
  using (
    organization_id in (
      select p.organization_id from public.profiles p
      where p.id = (select auth.uid())
    )
  );

-- Proposals - only see proposals in same organization
create policy "proposals_select_org" on public.proposals
  for select to authenticated
  using (
    organization_id in (
      select p.organization_id from public.profiles p
      where p.id = (select auth.uid())
    )
  );

-- ==================
-- INDEXES
-- ==================
create index idx_organizations_slug on public.organizations(slug);
create index idx_organizations_stripe_customer on public.organizations(stripe_customer_id);
create index idx_teams_organization on public.teams(organization_id);
create index idx_profiles_organization on public.profiles(organization_id);
create index idx_proposals_organization on public.proposals(organization_id);
create index idx_documents_organization on public.documents(organization_id);

-- ==================
-- AUTO-UPDATE TRIGGER
-- ==================
create trigger organizations_updated_at
  before update on public.organizations
  for each row
  execute function extensions.moddatetime(updated_at);

-- ==================
-- HELPER FUNCTIONS
-- ==================

-- Get current user's organization ID
create or replace function get_current_organization_id()
returns uuid as $$
  select organization_id from public.profiles
  where id = auth.uid()
$$ language sql security definer stable;

-- Check if user can perform action based on plan limits
create or replace function check_plan_limit(limit_key text)
returns boolean as $$
declare
  org_record record;
  current_usage int;
  plan_limit int;
begin
  select * into org_record from public.organizations
  where id = get_current_organization_id();

  if org_record is null then
    return false;
  end if;

  -- Check if trial expired and no paid plan
  if org_record.plan_tier = 'trial' and org_record.trial_ends_at < now() then
    return false;
  end if;

  current_usage := coalesce((org_record.usage_current_period->>limit_key)::int, 0);
  plan_limit := coalesce((org_record.plan_limits->>limit_key)::int, 0);

  -- Enterprise has unlimited
  if org_record.plan_tier = 'enterprise' then
    return true;
  end if;

  return current_usage < plan_limit;
end;
$$ language plpgsql security definer;

-- Increment usage counter
create or replace function increment_usage(limit_key text, amount int default 1)
returns void as $$
begin
  update public.organizations
  set usage_current_period = jsonb_set(
    usage_current_period,
    array[limit_key],
    to_jsonb(coalesce((usage_current_period->>limit_key)::int, 0) + amount)
  )
  where id = get_current_organization_id();
end;
$$ language plpgsql security definer;
