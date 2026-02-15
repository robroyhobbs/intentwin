-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.teams enable row level security;
alter table public.documents enable row level security;
alter table public.document_chunks enable row level security;
alter table public.proposals enable row level security;
alter table public.proposal_sections enable row level security;
alter table public.section_sources enable row level security;

-- ==================
-- PROFILES
-- ==================
drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all" on public.profiles
  for select to authenticated
  using (true);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id);

-- ==================
-- TEAMS
-- ==================
drop policy if exists "teams_select_all" on public.teams;
create policy "teams_select_all" on public.teams
  for select to authenticated
  using (true);

drop policy if exists "teams_insert_admin" on public.teams;
create policy "teams_insert_admin" on public.teams
  for insert to authenticated
  with check (
    exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and role = 'admin'
    )
  );

drop policy if exists "teams_update_admin" on public.teams;
create policy "teams_update_admin" on public.teams
  for update to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and role = 'admin'
    )
  );

-- ==================
-- DOCUMENTS
-- ==================
drop policy if exists "documents_select" on public.documents;
create policy "documents_select" on public.documents
  for select to authenticated
  using (
    team_id is null
    or team_id in (
      select p.team_id from public.profiles p
      where p.id = (select auth.uid())
    )
  );

drop policy if exists "documents_insert" on public.documents;
create policy "documents_insert" on public.documents
  for insert to authenticated
  with check ((select auth.uid()) = uploaded_by);

drop policy if exists "documents_update" on public.documents;
create policy "documents_update" on public.documents
  for update to authenticated
  using (
    uploaded_by = (select auth.uid())
    or exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and role = 'admin'
    )
  );

drop policy if exists "documents_delete" on public.documents;
create policy "documents_delete" on public.documents
  for delete to authenticated
  using (
    uploaded_by = (select auth.uid())
    or exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and role = 'admin'
    )
  );

-- ==================
-- DOCUMENT CHUNKS
-- ==================
drop policy if exists "chunks_select" on public.document_chunks;
create policy "chunks_select" on public.document_chunks
  for select to authenticated
  using (
    exists (
      select 1 from public.documents d
      where d.id = document_id
      and (
        d.team_id is null
        or d.team_id in (
          select p.team_id from public.profiles p
          where p.id = (select auth.uid())
        )
      )
    )
  );

-- ==================
-- PROPOSALS
-- ==================
drop policy if exists "proposals_select" on public.proposals;
create policy "proposals_select" on public.proposals
  for select to authenticated
  using (
    created_by = (select auth.uid())
    or team_id in (
      select p.team_id from public.profiles p
      where p.id = (select auth.uid())
    )
  );

drop policy if exists "proposals_insert" on public.proposals;
create policy "proposals_insert" on public.proposals
  for insert to authenticated
  with check ((select auth.uid()) = created_by);

drop policy if exists "proposals_update" on public.proposals;
create policy "proposals_update" on public.proposals
  for update to authenticated
  using (
    created_by = (select auth.uid())
    or team_id in (
      select p.team_id from public.profiles p
      where p.id = (select auth.uid()) and p.role in ('admin', 'manager')
    )
  );

drop policy if exists "proposals_delete" on public.proposals;
create policy "proposals_delete" on public.proposals
  for delete to authenticated
  using (
    created_by = (select auth.uid())
    or exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and role = 'admin'
    )
  );

-- ==================
-- PROPOSAL SECTIONS
-- ==================
drop policy if exists "sections_select" on public.proposal_sections;
create policy "sections_select" on public.proposal_sections
  for select to authenticated
  using (
    exists (
      select 1 from public.proposals pr
      where pr.id = proposal_id
      and (
        pr.created_by = (select auth.uid())
        or pr.team_id in (
          select p.team_id from public.profiles p
          where p.id = (select auth.uid())
        )
      )
    )
  );

drop policy if exists "sections_update" on public.proposal_sections;
create policy "sections_update" on public.proposal_sections
  for update to authenticated
  using (
    exists (
      select 1 from public.proposals pr
      where pr.id = proposal_id
      and (
        pr.created_by = (select auth.uid())
        or pr.team_id in (
          select p.team_id from public.profiles p
          where p.id = (select auth.uid()) and p.role in ('admin', 'manager')
        )
      )
    )
  );

-- ==================
-- SECTION SOURCES
-- ==================
drop policy if exists "section_sources_select" on public.section_sources;
create policy "section_sources_select" on public.section_sources
  for select to authenticated
  using (
    exists (
      select 1 from public.proposal_sections ps
      join public.proposals pr on pr.id = ps.proposal_id
      where ps.id = section_id
      and (
        pr.created_by = (select auth.uid())
        or pr.team_id in (
          select p.team_id from public.profiles p
          where p.id = (select auth.uid())
        )
      )
    )
  );
