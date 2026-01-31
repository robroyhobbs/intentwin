-- ===========================================
-- COMPOUNDING ENGINEERING: Deal Outcome Tracking
-- ===========================================
-- Tracks win/loss outcomes to enable learning loops
-- and continuous improvement of proposal quality.

-- Add deal outcome fields to proposals
alter table public.proposals
  add column if not exists deal_outcome text default 'pending',
  add column if not exists deal_outcome_set_at timestamptz,
  add column if not exists deal_outcome_set_by uuid references auth.users(id),
  add column if not exists deal_value numeric,
  add column if not exists deal_currency text default 'USD',
  add column if not exists loss_reason text,
  add column if not exists loss_reason_category text,
  add column if not exists competitor_won text,
  add column if not exists outcome_notes text,
  add column if not exists promoted_to_case_study boolean default false,
  add column if not exists case_study_source_id uuid;

-- Constraint for deal_outcome values
alter table public.proposals
  add constraint proposals_deal_outcome_check
  check (deal_outcome in ('pending', 'won', 'lost', 'no_decision', 'withdrawn'));

-- Constraint for loss_reason_category values
alter table public.proposals
  add constraint proposals_loss_reason_category_check
  check (loss_reason_category is null or loss_reason_category in (
    'price', 'capability', 'relationship', 'timing', 'competition', 'requirements', 'other'
  ));

-- Create deal outcome history table for audit trail
create table public.deal_outcome_history (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals(id) on delete cascade,

  -- Outcome change
  previous_outcome text,
  new_outcome text not null,

  -- Context
  deal_value numeric,
  loss_reason text,
  loss_reason_category text,
  competitor_won text,
  notes text,

  -- Who made the change
  changed_by uuid not null references auth.users(id),
  changed_at timestamptz not null default now()
);

-- Section feedback for quality improvement
create table public.section_feedback (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.proposal_sections(id) on delete cascade,
  proposal_id uuid not null references public.proposals(id) on delete cascade,

  -- Feedback
  rating integer check (rating >= 1 and rating <= 5),
  feedback_type text not null check (feedback_type in ('helpful', 'not_helpful', 'needs_edit', 'excellent')),
  feedback_text text,

  -- What was the outcome of the proposal?
  proposal_outcome text,  -- copied from proposal at feedback time

  -- Who gave feedback
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

-- Aggregate stats view for analytics
create or replace view public.proposal_outcome_stats as
select
  -- Time periods
  date_trunc('month', p.created_at) as month,
  date_trunc('quarter', p.created_at) as quarter,
  date_trunc('year', p.created_at) as year,

  -- Dimensions
  (p.intake_data->>'opportunity_type') as opportunity_type,
  (p.intake_data->>'client_industry') as client_industry,
  (p.intake_data->>'client_size') as client_size,

  -- Outcome counts
  count(*) as total_proposals,
  count(*) filter (where p.deal_outcome = 'won') as won,
  count(*) filter (where p.deal_outcome = 'lost') as lost,
  count(*) filter (where p.deal_outcome = 'no_decision') as no_decision,
  count(*) filter (where p.deal_outcome = 'pending') as pending,
  count(*) filter (where p.deal_outcome = 'withdrawn') as withdrawn,

  -- Win rate
  case
    when count(*) filter (where p.deal_outcome in ('won', 'lost')) > 0
    then round(
      (count(*) filter (where p.deal_outcome = 'won')::numeric /
       count(*) filter (where p.deal_outcome in ('won', 'lost'))::numeric) * 100,
      1
    )
    else null
  end as win_rate_percent,

  -- Deal value
  sum(p.deal_value) filter (where p.deal_outcome = 'won') as total_won_value,
  avg(p.deal_value) filter (where p.deal_outcome = 'won') as avg_won_value,

  -- Loss reasons (top)
  mode() within group (order by p.loss_reason_category) filter (where p.deal_outcome = 'lost') as top_loss_reason

from public.proposals p
where p.status in ('exported', 'final')
group by
  date_trunc('month', p.created_at),
  date_trunc('quarter', p.created_at),
  date_trunc('year', p.created_at),
  (p.intake_data->>'opportunity_type'),
  (p.intake_data->>'client_industry'),
  (p.intake_data->>'client_size');

-- Indexes
create index idx_proposals_deal_outcome on public.proposals(deal_outcome);
create index idx_proposals_deal_outcome_set_at on public.proposals(deal_outcome_set_at);
create index idx_outcome_history_proposal on public.deal_outcome_history(proposal_id);
create index idx_section_feedback_section on public.section_feedback(section_id);
create index idx_section_feedback_proposal on public.section_feedback(proposal_id);

-- Enable RLS
alter table public.deal_outcome_history enable row level security;
alter table public.section_feedback enable row level security;

-- RLS policies for deal_outcome_history
create policy "deal_outcome_history_select" on public.deal_outcome_history
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

create policy "deal_outcome_history_insert" on public.deal_outcome_history
  for insert to authenticated
  with check (
    exists (
      select 1 from public.proposals p
      where p.id = proposal_id
      and (
        p.created_by = (select auth.uid())
        or p.team_id in (
          select prof.team_id from public.profiles prof
          where prof.id = (select auth.uid()) and prof.role in ('admin', 'manager')
        )
      )
    )
  );

-- RLS policies for section_feedback
create policy "section_feedback_select" on public.section_feedback
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

create policy "section_feedback_insert" on public.section_feedback
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

-- Function to get win/loss summary for dashboard
create or replace function public.get_outcome_summary()
returns jsonb
language plpgsql
security definer
as $$
declare
  result jsonb;
begin
  select jsonb_build_object(
    'total', count(*),
    'won', count(*) filter (where deal_outcome = 'won'),
    'lost', count(*) filter (where deal_outcome = 'lost'),
    'pending', count(*) filter (where deal_outcome = 'pending'),
    'no_decision', count(*) filter (where deal_outcome = 'no_decision'),
    'win_rate', case
      when count(*) filter (where deal_outcome in ('won', 'lost')) > 0
      then round(
        (count(*) filter (where deal_outcome = 'won')::numeric /
         count(*) filter (where deal_outcome in ('won', 'lost'))::numeric) * 100,
        1
      )
      else 0
    end,
    'total_won_value', coalesce(sum(deal_value) filter (where deal_outcome = 'won'), 0),
    'by_industry', (
      select jsonb_object_agg(
        coalesce(intake_data->>'client_industry', 'unknown'),
        jsonb_build_object(
          'won', count(*) filter (where deal_outcome = 'won'),
          'lost', count(*) filter (where deal_outcome = 'lost'),
          'total', count(*)
        )
      )
      from public.proposals
      where status in ('exported', 'final', 'review')
    ),
    'by_opportunity_type', (
      select jsonb_object_agg(
        coalesce(intake_data->>'opportunity_type', 'unknown'),
        jsonb_build_object(
          'won', count(*) filter (where deal_outcome = 'won'),
          'lost', count(*) filter (where deal_outcome = 'lost'),
          'total', count(*)
        )
      )
      from public.proposals
      where status in ('exported', 'final', 'review')
    ),
    'loss_reasons', (
      select jsonb_object_agg(
        coalesce(loss_reason_category, 'unspecified'),
        count(*)
      )
      from public.proposals
      where deal_outcome = 'lost'
      group by loss_reason_category
    )
  ) into result
  from public.proposals
  where status in ('exported', 'final', 'review');

  return result;
end;
$$;
