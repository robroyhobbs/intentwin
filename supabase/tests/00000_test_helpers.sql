-- ============================================================
-- pgTAP Test Helpers for RLS Policy Testing
-- ============================================================
-- Sets up test infrastructure for creating users, orgs,
-- and switching auth contexts to verify row-level security.
-- ============================================================

BEGIN;

-- Create test helper schema
CREATE SCHEMA IF NOT EXISTS tests;

-- ============================================================
-- Helper: Create a test organization
-- ============================================================
CREATE OR REPLACE FUNCTION tests.create_test_org(
  p_org_id uuid,
  p_name text DEFAULT 'Test Org'
) RETURNS void AS $$
BEGIN
  INSERT INTO public.organizations (id, name, slug, created_at, updated_at)
  VALUES (p_org_id, p_name, 'test-org-' || left(p_org_id::text, 8), now(), now())
  ON CONFLICT (id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Helper: Create a test user in auth.users and profiles
-- ============================================================
CREATE OR REPLACE FUNCTION tests.create_test_user(
  p_user_id uuid,
  p_email text,
  p_org_id uuid,
  p_role text DEFAULT 'member'
) RETURNS void AS $$
BEGIN
  -- Insert into auth.users
  -- Supabase auth.users has: id, instance_id, aud, role, email, encrypted_password,
  -- email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, recovery_token,
  -- recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at,
  -- raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, etc.
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  )
  VALUES (
    p_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    p_email,
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('full_name', 'Test User ' || p_email),
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  -- Insert/update profile with org membership
  -- The trigger handle_new_user() may have already created a profile+org,
  -- but we want to link to our specific test org.
  INSERT INTO public.profiles (id, email, full_name, role, organization_id, created_at, updated_at)
  VALUES (p_user_id, p_email, 'Test User ' || p_email, p_role, p_org_id, now(), now())
  ON CONFLICT (id) DO UPDATE SET
    organization_id = p_org_id,
    role = p_role,
    email = p_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Helper: Create a test user with NULL organization_id
-- ============================================================
CREATE OR REPLACE FUNCTION tests.create_test_user_no_org(
  p_user_id uuid,
  p_email text
) RETURNS void AS $$
BEGIN
  INSERT INTO auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at
  )
  VALUES (
    p_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', p_email,
    crypt('password123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('full_name', 'Orphan User'),
    now(), now()
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.profiles (id, email, full_name, role, organization_id, created_at, updated_at)
  VALUES (p_user_id, p_email, 'Orphan User', 'member', NULL, now(), now())
  ON CONFLICT (id) DO UPDATE SET organization_id = NULL, role = 'member';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Helper: Set authenticated user context (simulates Supabase JWT)
-- ============================================================
CREATE OR REPLACE FUNCTION tests.set_auth_user(p_user_id uuid) RETURNS void AS $$
BEGIN
  -- Set the role to authenticated (what PostgREST uses)
  PERFORM set_config('role', 'authenticated', true);
  -- Set the JWT claims so auth.uid() returns our test user
  PERFORM set_config(
    'request.jwt.claims',
    json_build_object(
      'sub', p_user_id::text,
      'role', 'authenticated',
      'iss', 'supabase',
      'iat', extract(epoch from now())::int,
      'exp', extract(epoch from now() + interval '1 hour')::int
    )::text,
    true
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Helper: Set anonymous context
-- ============================================================
CREATE OR REPLACE FUNCTION tests.set_anon() RETURNS void AS $$
BEGIN
  PERFORM set_config('role', 'anon', true);
  PERFORM set_config('request.jwt.claims', '{}', true);
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Helper: Set service_role context (bypasses RLS)
-- ============================================================
CREATE OR REPLACE FUNCTION tests.set_service_role() RETURNS void AS $$
BEGIN
  PERFORM set_config('role', 'service_role', true);
  PERFORM set_config('request.jwt.claims', '{}', true);
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Helper: Reset to postgres superuser role (for setup/teardown)
-- ============================================================
CREATE OR REPLACE FUNCTION tests.reset_role() RETURNS void AS $$
BEGIN
  PERFORM set_config('role', 'postgres', true);
  PERFORM set_config('request.jwt.claims', '{}', true);
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Helper: Count rows visible to current role in a table
-- Returns integer count — useful for RLS visibility assertions
-- ============================================================
CREATE OR REPLACE FUNCTION tests.count_visible(p_table text) RETURNS bigint AS $$
DECLARE
  result bigint;
BEGIN
  EXECUTE format('SELECT count(*) FROM %s', p_table) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

COMMIT;
