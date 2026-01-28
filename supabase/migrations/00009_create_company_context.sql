-- ===========================================
-- L1: COMPANY TRUTH - Canonical Context Layer
-- ===========================================
-- These tables store verified, canonical information about
-- the company, products, and evidence that proposals must
-- align with. This is the "source of truth" for claims.

-- Company-wide context (brand, values, certifications, legal)
create table public.company_context (
  id uuid primary key default gen_random_uuid(),

  -- Categorization
  category text not null,  -- 'brand', 'values', 'certifications', 'legal', 'partnerships'
  key text not null,       -- Unique identifier within category

  -- Content
  title text not null,
  content text not null,
  metadata jsonb default '{}',

  -- Verification & locking
  is_locked boolean default false,
  lock_reason text,
  last_verified_at timestamptz,
  verified_by uuid references auth.users(id),

  -- Audit
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by uuid references auth.users(id),

  unique(category, key)
);

-- Product/service line capabilities
create table public.product_contexts (
  id uuid primary key default gen_random_uuid(),

  -- Identification
  product_name text not null,
  service_line text not null,  -- cloud_migration, app_modernization, data_analytics, etc.

  -- Structured content
  description text,
  capabilities jsonb default '[]',      -- Array of capability objects
  specifications jsonb default '{}',    -- Technical specifications
  pricing_models jsonb default '[]',    -- Available pricing approaches
  constraints jsonb default '{}',       -- What it cannot do / limitations

  -- Outcome mapping - which business outcomes this product addresses
  supported_outcomes jsonb default '[]', -- Array of outcome categories it serves

  -- Verification
  is_locked boolean default false,
  lock_reason text,
  last_verified_at timestamptz,
  verified_by uuid references auth.users(id),

  -- Audit
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by uuid references auth.users(id),

  unique(product_name, service_line)
);

-- Evidence library (case studies, metrics, testimonials, certifications)
create table public.evidence_library (
  id uuid primary key default gen_random_uuid(),

  -- Classification
  evidence_type text not null,  -- 'case_study', 'metric', 'testimonial', 'certification', 'award'
  title text not null,

  -- Content
  summary text,                 -- Brief summary for quick reference
  full_content text,            -- Detailed content

  -- Categorization for retrieval
  client_industry text,
  service_line text,
  client_size text,             -- 'enterprise', 'mid_market', 'smb'

  -- Outcomes this evidence demonstrates
  outcomes_demonstrated jsonb default '[]',  -- Array: [{outcome: 'cost_reduction', description: '...'}]

  -- Specific metrics (for case studies)
  metrics jsonb default '[]',   -- Array: [{name: 'Cost Savings', value: '40%', context: '...'}]

  -- Source information
  source_document_id uuid references public.documents(id),
  external_url text,

  -- Verification
  is_verified boolean default false,
  verified_by uuid references auth.users(id),
  verified_at timestamptz,
  verification_notes text,

  -- Usage tracking
  times_used integer default 0,
  last_used_at timestamptz,

  -- Audit
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by uuid references auth.users(id)
);

-- Create indexes for efficient querying
create index idx_company_context_category on public.company_context(category);
create index idx_product_contexts_service_line on public.product_contexts(service_line);
create index idx_evidence_library_type on public.evidence_library(evidence_type);
create index idx_evidence_library_industry on public.evidence_library(client_industry);
create index idx_evidence_library_service_line on public.evidence_library(service_line);
create index idx_evidence_library_verified on public.evidence_library(is_verified);

-- GIN indexes for JSONB querying
create index idx_product_capabilities_gin on public.product_contexts using gin(capabilities);
create index idx_product_outcomes_gin on public.product_contexts using gin(supported_outcomes);
create index idx_evidence_outcomes_gin on public.evidence_library using gin(outcomes_demonstrated);
create index idx_evidence_metrics_gin on public.evidence_library using gin(metrics);

-- Enable RLS
alter table public.company_context enable row level security;
alter table public.product_contexts enable row level security;
alter table public.evidence_library enable row level security;

-- RLS Policies: All authenticated users can read, only admins can write

-- Company Context
create policy "company_context_select" on public.company_context
  for select to authenticated using (true);

create policy "company_context_insert" on public.company_context
  for insert to authenticated
  with check (
    exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and role = 'admin'
    )
  );

create policy "company_context_update" on public.company_context
  for update to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and role = 'admin'
    )
  );

-- Product Contexts
create policy "product_contexts_select" on public.product_contexts
  for select to authenticated using (true);

create policy "product_contexts_insert" on public.product_contexts
  for insert to authenticated
  with check (
    exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and role = 'admin'
    )
  );

create policy "product_contexts_update" on public.product_contexts
  for update to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and role = 'admin'
    )
  );

-- Evidence Library
create policy "evidence_library_select" on public.evidence_library
  for select to authenticated using (true);

create policy "evidence_library_insert" on public.evidence_library
  for insert to authenticated
  with check (
    exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and role in ('admin', 'manager')
    )
  );

create policy "evidence_library_update" on public.evidence_library
  for update to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and role in ('admin', 'manager')
    )
  );

-- Trigger to update timestamps
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_company_context_updated_at
  before update on public.company_context
  for each row execute function public.update_updated_at();

create trigger update_product_contexts_updated_at
  before update on public.product_contexts
  for each row execute function public.update_updated_at();

create trigger update_evidence_library_updated_at
  before update on public.evidence_library
  for each row execute function public.update_updated_at();
