-- Main proposals table
create table if not exists public.proposals (
  id uuid primary key default gen_random_uuid(),

  title text not null,
  status text not null default 'draft'
    check (status in ('draft', 'intake', 'generating', 'review', 'final', 'exported')),

  -- Intake form data (structured JSON)
  intake_data jsonb not null default '{}',

  -- RFP reference
  rfp_document_id uuid references public.documents(id) on delete set null,
  rfp_extracted_requirements jsonb,

  -- Generation metadata
  generation_model text default 'claude-sonnet-4-20250514',
  generation_started_at timestamptz,
  generation_completed_at timestamptz,

  -- Ownership
  created_by uuid not null references auth.users(id),
  team_id uuid references public.teams(id),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Individual proposal sections
create table if not exists public.proposal_sections (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals(id) on delete cascade,

  section_type text not null check (section_type in (
    'executive_summary',
    'understanding',
    'approach',
    'methodology',
    'team',
    'case_studies',
    'timeline',
    'pricing',
    'risk_mitigation',
    'why_capgemini',
    'appendix'
  )),
  section_order integer not null,
  title text not null,

  -- Content
  generated_content text,
  edited_content text,
  is_edited boolean not null default false,

  -- Generation context
  generation_prompt text,
  retrieved_context_ids uuid[],
  generation_status text not null default 'pending'
    check (generation_status in ('pending', 'generating', 'completed', 'failed', 'regenerating')),
  generation_error text,

  -- Review
  review_status text default 'pending'
    check (review_status in ('pending', 'approved', 'needs_revision', 'skipped')),
  review_notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Track source chunks used for each section (citations)
create table if not exists public.section_sources (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.proposal_sections(id) on delete cascade,
  chunk_id uuid not null references public.document_chunks(id) on delete cascade,
  relevance_score float,
  created_at timestamptz not null default now(),

  unique(section_id, chunk_id)
);

-- Indexes
create index if not exists idx_proposals_status on public.proposals(status);
create index if not exists idx_proposals_created_by on public.proposals(created_by);
create index if not exists idx_proposals_team on public.proposals(team_id);
create index if not exists idx_sections_proposal on public.proposal_sections(proposal_id);
create index if not exists idx_sections_type on public.proposal_sections(section_type);
create index if not exists idx_section_sources_section on public.section_sources(section_id);
create index if not exists idx_section_sources_chunk on public.section_sources(chunk_id);

-- Auto-update triggers
drop trigger if exists proposals_updated_at on public.proposals;
create trigger proposals_updated_at
  before update on public.proposals
  for each row
  execute function extensions.moddatetime(updated_at);

drop trigger if exists proposal_sections_updated_at on public.proposal_sections;
create trigger proposal_sections_updated_at
  before update on public.proposal_sections
  for each row
  execute function extensions.moddatetime(updated_at);
