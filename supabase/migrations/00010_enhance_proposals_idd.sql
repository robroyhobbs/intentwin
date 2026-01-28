-- ===========================================
-- L2: PROPOSAL INTENT - Enhanced Proposal Structure
-- ===========================================
-- Adds IDD-aligned fields to proposals for outcome contracts,
-- intent approval workflow, and claim verification tracking.

-- Add outcome contract and intent fields to proposals
alter table public.proposals
  add column if not exists outcome_contract jsonb default '{}',
  add column if not exists intent_status text default 'draft',
  add column if not exists intent_approved_by uuid references auth.users(id),
  add column if not exists intent_approved_at timestamptz,
  add column if not exists intent_notes text;

-- Outcome contract structure:
-- {
--   "current_state": ["Pain point 1", "Pain point 2"],
--   "desired_state": ["Outcome 1", "Outcome 2"],
--   "transformation": "How we bridge the gap",
--   "success_metrics": [
--     {"outcome": "Cost reduction", "metric": "Infrastructure spend", "target": "-40%", "method": "Cloud billing"}
--   ],
--   "constraints": {
--     "must_include": ["FedRAMP compliance", "24/7 support"],
--     "must_avoid": ["Competitor mentions", "Unrealistic timelines"],
--     "budget_range": {"min": 500000, "max": 2000000},
--     "timeline": {"start": "2026-03-01", "end": "2027-03-01"}
--   }
-- }

-- Create constraint for intent_status values
alter table public.proposals
  add constraint proposals_intent_status_check
  check (intent_status in ('draft', 'pending_review', 'approved', 'locked'));

-- ===========================================
-- L3: CLAIM TRACKING - Verification Layer
-- ===========================================

-- Track claims made in proposal sections and their evidence sources
create table public.section_claims (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.proposal_sections(id) on delete cascade,

  -- The claim itself
  claim_text text not null,
  claim_type text,  -- 'capability', 'metric', 'experience', 'certification', 'methodology'

  -- Evidence linkage
  evidence_id uuid references public.evidence_library(id),
  product_context_id uuid references public.product_contexts(id),
  company_context_id uuid references public.company_context(id),

  -- Verification status
  verification_status text default 'unverified',  -- 'verified', 'unverified', 'flagged', 'approved_unverified'
  flagged_reason text,
  verified_by uuid references auth.users(id),
  verified_at timestamptz,

  -- Position in section (for UI highlighting)
  start_offset integer,
  end_offset integer,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Track which outcomes each section serves
create table public.section_outcome_mapping (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.proposal_sections(id) on delete cascade,

  -- Outcome reference (key from outcome_contract.success_metrics)
  outcome_key text not null,
  outcome_description text,

  -- How this section serves the outcome
  relevance_score float default 0.5,  -- 0-1 scale
  relevance_explanation text,

  -- Whether this mapping was AI-suggested or human-confirmed
  is_confirmed boolean default false,
  confirmed_by uuid references auth.users(id),

  created_at timestamptz default now(),

  unique(section_id, outcome_key)
);

-- Verification audit log
create table public.verification_log (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals(id) on delete cascade,

  -- What was verified
  verification_type text not null,  -- 'intent_approval', 'claim_verification', 'outcome_mapping', 'constraint_check'
  target_type text,                 -- 'proposal', 'section', 'claim'
  target_id uuid,

  -- Verification details
  status text not null,             -- 'passed', 'failed', 'warning', 'skipped'
  message text,
  details jsonb,

  -- Who/what performed verification
  performed_by uuid references auth.users(id),  -- null if automated
  is_automated boolean default false,

  created_at timestamptz default now()
);

-- Indexes
create index idx_section_claims_section on public.section_claims(section_id);
create index idx_section_claims_status on public.section_claims(verification_status);
create index idx_section_claims_evidence on public.section_claims(evidence_id);
create index idx_section_outcome_section on public.section_outcome_mapping(section_id);
create index idx_section_outcome_key on public.section_outcome_mapping(outcome_key);
create index idx_verification_log_proposal on public.verification_log(proposal_id);
create index idx_verification_log_type on public.verification_log(verification_type);

-- Enable RLS
alter table public.section_claims enable row level security;
alter table public.section_outcome_mapping enable row level security;
alter table public.verification_log enable row level security;

-- RLS: Access follows proposal access
create policy "section_claims_select" on public.section_claims
  for select to authenticated
  using (
    exists (
      select 1 from public.proposal_sections ps
      join public.proposals p on p.id = ps.proposal_id
      where ps.id = section_id
      and (
        p.created_by = (select auth.uid())
        or p.team_id in (
          select prof.team_id from public.profiles prof
          where prof.id = (select auth.uid())
        )
      )
    )
  );

create policy "section_claims_insert" on public.section_claims
  for insert to authenticated
  with check (
    exists (
      select 1 from public.proposal_sections ps
      join public.proposals p on p.id = ps.proposal_id
      where ps.id = section_id
      and (
        p.created_by = (select auth.uid())
        or p.team_id in (
          select prof.team_id from public.profiles prof
          where prof.id = (select auth.uid())
        )
      )
    )
  );

create policy "section_claims_update" on public.section_claims
  for update to authenticated
  using (
    exists (
      select 1 from public.proposal_sections ps
      join public.proposals p on p.id = ps.proposal_id
      where ps.id = section_id
      and (
        p.created_by = (select auth.uid())
        or p.team_id in (
          select prof.team_id from public.profiles prof
          where prof.id = (select auth.uid()) and prof.role in ('admin', 'manager')
        )
      )
    )
  );

create policy "section_outcome_mapping_select" on public.section_outcome_mapping
  for select to authenticated
  using (
    exists (
      select 1 from public.proposal_sections ps
      join public.proposals p on p.id = ps.proposal_id
      where ps.id = section_id
      and (
        p.created_by = (select auth.uid())
        or p.team_id in (
          select prof.team_id from public.profiles prof
          where prof.id = (select auth.uid())
        )
      )
    )
  );

create policy "section_outcome_mapping_all" on public.section_outcome_mapping
  for all to authenticated
  using (
    exists (
      select 1 from public.proposal_sections ps
      join public.proposals p on p.id = ps.proposal_id
      where ps.id = section_id
      and (
        p.created_by = (select auth.uid())
        or p.team_id in (
          select prof.team_id from public.profiles prof
          where prof.id = (select auth.uid())
        )
      )
    )
  );

create policy "verification_log_select" on public.verification_log
  for select to authenticated
  using (
    exists (
      select 1 from public.proposals p
      where p.id = proposal_id
      and (
        p.created_by = (select auth.uid())
        or p.team_id in (
          select prof.team_id from public.profiles prof
          where prof.id = (select auth.uid())
        )
      )
    )
  );

create policy "verification_log_insert" on public.verification_log
  for insert to authenticated
  with check (
    exists (
      select 1 from public.proposals p
      where p.id = proposal_id
      and (
        p.created_by = (select auth.uid())
        or p.team_id in (
          select prof.team_id from public.profiles prof
          where prof.id = (select auth.uid())
        )
      )
    )
  );

-- Function to get proposal verification summary
create or replace function public.get_proposal_verification_summary(p_proposal_id uuid)
returns jsonb
language plpgsql
as $$
declare
  result jsonb;
begin
  select jsonb_build_object(
    'total_claims', (
      select count(*) from public.section_claims sc
      join public.proposal_sections ps on ps.id = sc.section_id
      where ps.proposal_id = p_proposal_id
    ),
    'verified_claims', (
      select count(*) from public.section_claims sc
      join public.proposal_sections ps on ps.id = sc.section_id
      where ps.proposal_id = p_proposal_id and sc.verification_status = 'verified'
    ),
    'flagged_claims', (
      select count(*) from public.section_claims sc
      join public.proposal_sections ps on ps.id = sc.section_id
      where ps.proposal_id = p_proposal_id and sc.verification_status = 'flagged'
    ),
    'unverified_claims', (
      select count(*) from public.section_claims sc
      join public.proposal_sections ps on ps.id = sc.section_id
      where ps.proposal_id = p_proposal_id and sc.verification_status = 'unverified'
    ),
    'outcomes_mapped', (
      select count(distinct som.outcome_key) from public.section_outcome_mapping som
      join public.proposal_sections ps on ps.id = som.section_id
      where ps.proposal_id = p_proposal_id
    ),
    'intent_status', (
      select intent_status from public.proposals where id = p_proposal_id
    )
  ) into result;

  return result;
end;
$$;
