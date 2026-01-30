-- Migration: Fix L1 Context Tables for Multi-Tenancy
-- Adds organization_id to company_context, product_contexts, evidence_library
-- and updates RLS policies for proper tenant isolation

-- ==================
-- ADD ORGANIZATION_ID TO L1 TABLES
-- ==================

-- Company Context
alter table public.company_context
  add column organization_id uuid references public.organizations(id) on delete cascade;

-- Product Contexts
alter table public.product_contexts
  add column organization_id uuid references public.organizations(id) on delete cascade;

-- Evidence Library
alter table public.evidence_library
  add column organization_id uuid references public.organizations(id) on delete cascade;

-- ==================
-- DROP OLD POLICIES (global access)
-- ==================

drop policy if exists "company_context_select" on public.company_context;
drop policy if exists "product_contexts_select" on public.product_contexts;
drop policy if exists "evidence_library_select" on public.evidence_library;

-- ==================
-- CREATE NEW ORG-SCOPED POLICIES
-- ==================

-- Company Context - org-scoped read
create policy "company_context_select_org" on public.company_context
  for select to authenticated
  using (
    organization_id in (
      select p.organization_id from public.profiles p
      where p.id = (select auth.uid())
    )
  );

-- Update insert policy for org scoping
drop policy if exists "company_context_insert" on public.company_context;
create policy "company_context_insert_org_admin" on public.company_context
  for insert to authenticated
  with check (
    organization_id in (
      select p.organization_id from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'admin'
    )
  );

-- Update update policy for org scoping
drop policy if exists "company_context_update" on public.company_context;
create policy "company_context_update_org_admin" on public.company_context
  for update to authenticated
  using (
    organization_id in (
      select p.organization_id from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'admin'
    )
  );

-- Product Contexts - org-scoped read
create policy "product_contexts_select_org" on public.product_contexts
  for select to authenticated
  using (
    organization_id in (
      select p.organization_id from public.profiles p
      where p.id = (select auth.uid())
    )
  );

-- Update insert policy for org scoping
drop policy if exists "product_contexts_insert" on public.product_contexts;
create policy "product_contexts_insert_org_admin" on public.product_contexts
  for insert to authenticated
  with check (
    organization_id in (
      select p.organization_id from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'admin'
    )
  );

-- Update update policy for org scoping
drop policy if exists "product_contexts_update" on public.product_contexts;
create policy "product_contexts_update_org_admin" on public.product_contexts
  for update to authenticated
  using (
    organization_id in (
      select p.organization_id from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'admin'
    )
  );

-- Evidence Library - org-scoped read
create policy "evidence_library_select_org" on public.evidence_library
  for select to authenticated
  using (
    organization_id in (
      select p.organization_id from public.profiles p
      where p.id = (select auth.uid())
    )
  );

-- Update insert policy for org scoping
drop policy if exists "evidence_library_insert" on public.evidence_library;
create policy "evidence_library_insert_org" on public.evidence_library
  for insert to authenticated
  with check (
    organization_id in (
      select p.organization_id from public.profiles p
      where p.id = (select auth.uid()) and p.role in ('admin', 'manager')
    )
  );

-- Update update policy for org scoping
drop policy if exists "evidence_library_update" on public.evidence_library;
create policy "evidence_library_update_org" on public.evidence_library
  for update to authenticated
  using (
    organization_id in (
      select p.organization_id from public.profiles p
      where p.id = (select auth.uid()) and p.role in ('admin', 'manager')
    )
  );

-- ==================
-- INDEXES
-- ==================
create index idx_company_context_organization on public.company_context(organization_id);
create index idx_product_contexts_organization on public.product_contexts(organization_id);
create index idx_evidence_library_organization on public.evidence_library(organization_id);
