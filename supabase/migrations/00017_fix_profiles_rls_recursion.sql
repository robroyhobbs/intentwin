-- Fix recursive RLS policy on profiles table
-- The old policy caused infinite recursion by querying profiles within the profiles policy

-- Drop the recursive policy
drop policy if exists "profiles_select_org" on public.profiles;

-- Create a non-recursive policy using auth.uid() directly
-- Users can read their own profile, and profiles in their org (via a security definer function)
create or replace function get_user_organization_id()
returns uuid
language sql
security definer
stable
as $$
  select organization_id from public.profiles where id = auth.uid()
$$;

-- Allow users to select profiles in their organization
create policy "profiles_select_org" on public.profiles
  for select to authenticated
  using (
    -- Users can always read their own profile
    id = auth.uid()
    or
    -- Users can read other profiles in their organization
    organization_id = get_user_organization_id()
  );
