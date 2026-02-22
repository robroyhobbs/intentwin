-- ===========================================
-- L1: TEAM MEMBERS - Named Personnel for Proposals
-- ===========================================
-- Stores real team member profiles for use in proposals.
-- Government proposals require named key personnel — this table
-- ensures the generator uses real people instead of fabricating them.

create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,

  -- Identity
  name text not null,
  role text not null,           -- Primary role: 'Program Manager', 'Cloud Architect', etc.
  title text,                   -- Formal title: 'Senior Vice President', etc.
  email text,

  -- Qualifications (structured for prompt injection)
  skills jsonb default '[]',           -- ["Terraform", "AWS", "Agile"]
  certifications jsonb default '[]',   -- ["PMP", "CISSP", "AWS Solutions Architect Pro"]
  clearance_level text,                -- "Secret", "Top Secret/SCI", "Public Trust", null
  years_experience integer,

  -- Past performance
  project_history jsonb default '[]',  -- [{title, client_industry, scope, results, dates}]

  -- Resume source
  resume_document_id uuid references public.documents(id) on delete set null,
  bio text,                            -- Short bio for proposal use

  -- Verification (like evidence_library pattern)
  is_verified boolean default false,
  verified_by uuid references auth.users(id),
  verified_at timestamptz,

  -- Audit
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by uuid references auth.users(id)
);

-- Indexes for efficient querying
create index if not exists idx_team_members_organization on public.team_members(organization_id);
create index if not exists idx_team_members_role on public.team_members(role);
create index if not exists idx_team_members_verified on public.team_members(is_verified);
create index if not exists idx_team_members_skills_gin on public.team_members using gin(skills);
create index if not exists idx_team_members_certs_gin on public.team_members using gin(certifications);

-- Enable RLS
alter table public.team_members enable row level security;

-- RLS Policies: org-scoped, matching L1 table pattern from 00015

-- Read: any authenticated user in the same org
create policy "team_members_select_org" on public.team_members
  for select to authenticated
  using (
    organization_id in (
      select p.organization_id from public.profiles p
      where p.id = (select auth.uid())
    )
  );

-- Insert: admin or manager in the same org
create policy "team_members_insert_org" on public.team_members
  for insert to authenticated
  with check (
    organization_id in (
      select p.organization_id from public.profiles p
      where p.id = (select auth.uid()) and p.role in ('admin', 'manager')
    )
  );

-- Update: admin or manager in the same org
create policy "team_members_update_org" on public.team_members
  for update to authenticated
  using (
    organization_id in (
      select p.organization_id from public.profiles p
      where p.id = (select auth.uid()) and p.role in ('admin', 'manager')
    )
  );

-- Delete: admin only
create policy "team_members_delete_org_admin" on public.team_members
  for delete to authenticated
  using (
    organization_id in (
      select p.organization_id from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'admin'
    )
  );

-- Timestamp trigger (reuse existing function from 00009)
drop trigger if exists update_team_members_updated_at on public.team_members;
create trigger update_team_members_updated_at
  before update on public.team_members
  for each row execute function public.update_updated_at();

comment on table public.team_members is 'L1 Company Truth: Named personnel for proposal generation. Required for government procurement compliance.';
