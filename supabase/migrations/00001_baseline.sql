-- ============================================================
-- BASELINE MIGRATION: IntentBid Schema
-- ============================================================
-- Squashed from 45 sequential migrations (00001-00045) into a
-- single baseline migration for faster provisioning.
--
-- This represents the complete schema as of 2026-02-23 including:
--   - 29 public tables with org-scoped RLS policies
--   - 4 RPCs for vector/hybrid search (org-scoped)
--   - 2 storage buckets with org-path-scoped policies
--   - All triggers, indexes, and constraints
--   - pgTAP test infrastructure (created by test files, not here)
--
-- Generated via: supabase db dump --local
-- Then cleaned and augmented with storage bucket setup.
-- ============================================================

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';







CREATE EXTENSION IF NOT EXISTS "moddatetime" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."check_plan_limit"("limit_key" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."check_plan_limit"("limit_key" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_proposal_version"("p_proposal_id" "uuid", "p_trigger_event" "text", "p_change_summary" "text" DEFAULT NULL::"text", "p_label" "text" DEFAULT NULL::"text", "p_user_id" "uuid" DEFAULT NULL::"uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_version_id UUID;
  v_version_number INTEGER;
  v_proposal RECORD;
BEGIN
  -- Get next version number
  v_version_number := get_next_version_number(p_proposal_id);

  -- Get current proposal state
  SELECT * INTO v_proposal FROM proposals WHERE id = p_proposal_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Proposal not found: %', p_proposal_id;
  END IF;

  -- Create proposal version
  INSERT INTO proposal_versions (
    proposal_id,
    version_number,
    title,
    intake_data,
    outcome_contract,
    status,
    trigger_event,
    change_summary,
    label,
    created_by
  ) VALUES (
    p_proposal_id,
    v_version_number,
    v_proposal.title,
    v_proposal.intake_data,
    v_proposal.outcome_contract,
    v_proposal.status,
    p_trigger_event,
    p_change_summary,
    p_label,
    COALESCE(p_user_id, auth.uid())
  )
  RETURNING id INTO v_version_id;

  -- Snapshot all sections
  INSERT INTO section_versions (
    proposal_version_id,
    original_section_id,
    title,
    section_type,
    section_order,
    generated_content,
    edited_content,
    generation_status
  )
  SELECT
    v_version_id,
    id,
    title,
    section_type,
    section_order,
    generated_content,
    edited_content,
    generation_status
  FROM proposal_sections
  WHERE proposal_id = p_proposal_id;

  RETURN v_version_id;
END;
$$;


ALTER FUNCTION "public"."create_proposal_version"("p_proposal_id" "uuid", "p_trigger_event" "text", "p_change_summary" "text", "p_label" "text", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_org_slug"("org_name" "text") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."generate_org_slug"("org_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_current_organization_id"() RETURNS "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  select organization_id from public.profiles
  where id = auth.uid()
$$;


ALTER FUNCTION "public"."get_current_organization_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_next_version_number"("p_proposal_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO next_num
  FROM proposal_versions
  WHERE proposal_id = p_proposal_id;

  RETURN next_num;
END;
$$;


ALTER FUNCTION "public"."get_next_version_number"("p_proposal_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_outcome_summary"() RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE
    AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total', count(*),
    'won', count(*) FILTER (WHERE deal_outcome = 'won'),
    'lost', count(*) FILTER (WHERE deal_outcome = 'lost'),
    'pending', count(*) FILTER (WHERE deal_outcome = 'pending'),
    'no_decision', count(*) FILTER (WHERE deal_outcome = 'no_decision'),
    'win_rate', CASE
      WHEN count(*) FILTER (WHERE deal_outcome IN ('won', 'lost')) > 0
      THEN round(
        (count(*) FILTER (WHERE deal_outcome = 'won')::numeric /
         count(*) FILTER (WHERE deal_outcome IN ('won', 'lost'))::numeric) * 100,
        1
      )
      ELSE 0
    END,
    'total_won_value', coalesce(sum(deal_value) FILTER (WHERE deal_outcome = 'won'), 0),
    'by_industry', (
      SELECT jsonb_object_agg(
        coalesce(intake_data->>'client_industry', 'unknown'),
        jsonb_build_object(
          'won', count(*) FILTER (WHERE deal_outcome = 'won'),
          'lost', count(*) FILTER (WHERE deal_outcome = 'lost'),
          'total', count(*)
        )
      )
      FROM public.proposals
      WHERE status IN ('exported', 'final', 'review')
    ),
    'by_opportunity_type', (
      SELECT jsonb_object_agg(
        coalesce(intake_data->>'opportunity_type', 'unknown'),
        jsonb_build_object(
          'won', count(*) FILTER (WHERE deal_outcome = 'won'),
          'lost', count(*) FILTER (WHERE deal_outcome = 'lost'),
          'total', count(*)
        )
      )
      FROM public.proposals
      WHERE status IN ('exported', 'final', 'review')
    ),
    'loss_reasons', (
      SELECT jsonb_object_agg(
        coalesce(loss_reason_category, 'unspecified'),
        count(*)
      )
      FROM public.proposals
      WHERE deal_outcome = 'lost'
      GROUP BY loss_reason_category
    )
  ) INTO result
  FROM public.proposals
  WHERE status IN ('exported', 'final', 'review');

  RETURN result;
END;
$$;


ALTER FUNCTION "public"."get_outcome_summary"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_outcome_summary"() IS 'Returns win/loss summary for dashboard. Uses SECURITY INVOKER so RLS on proposals table controls data access per user/org.';



CREATE OR REPLACE FUNCTION "public"."get_proposal_verification_summary"("p_proposal_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
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


ALTER FUNCTION "public"."get_proposal_verification_summary"("p_proposal_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_organization_id"() RETURNS "uuid"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  select organization_id from public.profiles where id = auth.uid()
$$;


ALTER FUNCTION "public"."get_user_organization_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hybrid_search_chunks"("query_text" "text", "query_embedding" "extensions"."vector", "match_count" integer DEFAULT 10, "vector_weight" double precision DEFAULT 0.7, "text_weight" double precision DEFAULT 0.3, "filter_document_type" "text" DEFAULT NULL::"text") RETURNS TABLE("id" "uuid", "document_id" "uuid", "content" "text", "section_heading" "text", "combined_score" double precision, "vector_score" double precision, "text_score" double precision, "document_title" "text", "document_type" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- SECURITY: Only service_role can call the non-org-scoped search
  IF current_setting('role', true) != 'service_role' THEN
    RAISE EXCEPTION 'hybrid_search_chunks requires service_role. Use hybrid_search_chunks_org for authenticated access.';
  END IF;

  RETURN QUERY
  SELECT
    dc.id,
    dc.document_id,
    dc.content,
    dc.section_heading,
    (vector_weight * (1 - (dc.embedding <=> query_embedding))) +
    (text_weight * coalesce(ts_rank(
      to_tsvector('english', dc.content),
      plainto_tsquery('english', query_text)
    ), 0)) AS combined_score,
    1 - (dc.embedding <=> query_embedding) AS vector_score,
    coalesce(ts_rank(
      to_tsvector('english', dc.content),
      plainto_tsquery('english', query_text)
    ), 0) AS text_score,
    d.title AS document_title,
    d.document_type
  FROM public.document_chunks dc
  JOIN public.documents d ON d.id = dc.document_id
  WHERE
    d.processing_status = 'completed'
    AND dc.embedding IS NOT NULL
    AND (filter_document_type IS NULL OR d.document_type = filter_document_type)
  ORDER BY combined_score DESC
  LIMIT match_count;
END;
$$;


ALTER FUNCTION "public"."hybrid_search_chunks"("query_text" "text", "query_embedding" "extensions"."vector", "match_count" integer, "vector_weight" double precision, "text_weight" double precision, "filter_document_type" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hybrid_search_chunks_org"("query_text" "text", "query_embedding" "extensions"."vector", "match_count" integer DEFAULT 10, "vector_weight" double precision DEFAULT 0.7, "text_weight" double precision DEFAULT 0.3, "filter_organization_id" "uuid" DEFAULT NULL::"uuid", "filter_document_type" "text" DEFAULT NULL::"text") RETURNS TABLE("id" "uuid", "document_id" "uuid", "content" "text", "section_heading" "text", "combined_score" double precision, "vector_score" double precision, "text_score" double precision, "document_title" "text", "document_type" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- SECURITY: organization_id is required — NULL returns empty set
  IF filter_organization_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    dc.id,
    dc.document_id,
    dc.content,
    dc.section_heading,
    (vector_weight * (1 - (dc.embedding <=> query_embedding))) +
    (text_weight * coalesce(ts_rank(
      to_tsvector('english', dc.content),
      plainto_tsquery('english', query_text)
    ), 0)) AS combined_score,
    1 - (dc.embedding <=> query_embedding) AS vector_score,
    coalesce(ts_rank(
      to_tsvector('english', dc.content),
      plainto_tsquery('english', query_text)
    ), 0) AS text_score,
    d.title AS document_title,
    d.document_type
  FROM public.document_chunks dc
  JOIN public.documents d ON d.id = dc.document_id
  WHERE
    d.processing_status = 'completed'
    AND dc.embedding IS NOT NULL
    -- Organization filtering: strictly required (no NULL bypass)
    AND d.organization_id = filter_organization_id
    AND (filter_document_type IS NULL OR d.document_type = filter_document_type)
  ORDER BY combined_score DESC
  LIMIT match_count;
END;
$$;


ALTER FUNCTION "public"."hybrid_search_chunks_org"("query_text" "text", "query_embedding" "extensions"."vector", "match_count" integer, "vector_weight" double precision, "text_weight" double precision, "filter_organization_id" "uuid", "filter_document_type" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_usage"("limit_key" "text", "amount" integer DEFAULT 1) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  update public.organizations
  set usage_current_period = jsonb_set(
    usage_current_period,
    array[limit_key],
    to_jsonb(coalesce((usage_current_period->>limit_key)::int, 0) + amount)
  )
  where id = get_current_organization_id();
end;
$$;


ALTER FUNCTION "public"."increment_usage"("limit_key" "text", "amount" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_usage_by_org"("org_id" "uuid", "usage_key" "text", "amount" integer DEFAULT 1) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  update public.organizations
  set usage_current_period = jsonb_set(
    coalesce(usage_current_period, '{}'::jsonb),
    array[usage_key],
    to_jsonb(coalesce((usage_current_period->>usage_key)::int, 0) + amount)
  )
  where id = org_id;
end;
$$;


ALTER FUNCTION "public"."increment_usage_by_org"("org_id" "uuid", "usage_key" "text", "amount" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."match_document_chunks"("query_embedding" "extensions"."vector", "match_threshold" double precision DEFAULT 0.7, "match_count" integer DEFAULT 10, "filter_document_type" "text" DEFAULT NULL::"text", "filter_industry" "text" DEFAULT NULL::"text", "filter_service_line" "text" DEFAULT NULL::"text") RETURNS TABLE("id" "uuid", "document_id" "uuid", "content" "text", "section_heading" "text", "chunk_index" integer, "similarity" double precision, "document_title" "text", "document_type" "text", "file_name" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- SECURITY: Only service_role can call the non-org-scoped search
  IF current_setting('role', true) != 'service_role' THEN
    RAISE EXCEPTION 'match_document_chunks requires service_role. Use match_document_chunks_org for authenticated access.';
  END IF;

  RETURN QUERY
  SELECT
    dc.id,
    dc.document_id,
    dc.content,
    dc.section_heading,
    dc.chunk_index,
    1 - (dc.embedding <=> query_embedding) AS similarity,
    d.title AS document_title,
    d.document_type,
    d.file_name
  FROM public.document_chunks dc
  JOIN public.documents d ON d.id = dc.document_id
  WHERE
    d.processing_status = 'completed'
    AND dc.embedding IS NOT NULL
    AND 1 - (dc.embedding <=> query_embedding) > match_threshold
    AND (filter_document_type IS NULL OR d.document_type = filter_document_type)
    AND (filter_industry IS NULL OR d.industry = filter_industry)
    AND (filter_service_line IS NULL OR d.service_line = filter_service_line)
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;


ALTER FUNCTION "public"."match_document_chunks"("query_embedding" "extensions"."vector", "match_threshold" double precision, "match_count" integer, "filter_document_type" "text", "filter_industry" "text", "filter_service_line" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."match_document_chunks_org"("query_embedding" "extensions"."vector", "match_threshold" double precision DEFAULT 0.7, "match_count" integer DEFAULT 10, "filter_organization_id" "uuid" DEFAULT NULL::"uuid", "filter_document_type" "text" DEFAULT NULL::"text", "filter_industry" "text" DEFAULT NULL::"text", "filter_service_line" "text" DEFAULT NULL::"text") RETURNS TABLE("id" "uuid", "document_id" "uuid", "content" "text", "section_heading" "text", "chunk_index" integer, "similarity" double precision, "document_title" "text", "document_type" "text", "file_name" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- SECURITY: organization_id is required — NULL returns empty set
  IF filter_organization_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    dc.id,
    dc.document_id,
    dc.content,
    dc.section_heading,
    dc.chunk_index,
    1 - (dc.embedding <=> query_embedding) AS similarity,
    d.title AS document_title,
    d.document_type,
    d.file_name
  FROM public.document_chunks dc
  JOIN public.documents d ON d.id = dc.document_id
  WHERE
    d.processing_status = 'completed'
    AND dc.embedding IS NOT NULL
    AND 1 - (dc.embedding <=> query_embedding) > match_threshold
    -- Organization filtering: strictly required (no NULL bypass)
    AND d.organization_id = filter_organization_id
    AND (filter_document_type IS NULL OR d.document_type = filter_document_type)
    AND (filter_industry IS NULL OR d.industry = filter_industry)
    AND (filter_service_line IS NULL OR d.service_line = filter_service_line)
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;


ALTER FUNCTION "public"."match_document_chunks_org"("query_embedding" "extensions"."vector", "match_threshold" double precision, "match_count" integer, "filter_organization_id" "uuid", "filter_document_type" "text", "filter_industry" "text", "filter_service_line" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."restore_proposal_version"("p_version_id" "uuid", "p_user_id" "uuid" DEFAULT NULL::"uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_version RECORD;
  v_proposal_id UUID;
  v_new_version_id UUID;
BEGIN
  -- Get the version to restore
  SELECT * INTO v_version FROM proposal_versions WHERE id = p_version_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Version not found: %', p_version_id;
  END IF;

  v_proposal_id := v_version.proposal_id;

  -- First, create a version of current state (so we can undo the restore)
  v_new_version_id := create_proposal_version(
    v_proposal_id,
    'pre_restore',
    'Auto-saved before restoring to version ' || v_version.version_number,
    NULL,
    p_user_id
  );

  -- Restore proposal fields
  UPDATE proposals SET
    title = v_version.title,
    intake_data = v_version.intake_data,
    outcome_contract = v_version.outcome_contract,
    status = v_version.status,
    updated_at = NOW()
  WHERE id = v_proposal_id;

  -- Delete current sections
  DELETE FROM proposal_sections WHERE proposal_id = v_proposal_id;

  -- Restore sections from version
  INSERT INTO proposal_sections (
    proposal_id,
    title,
    section_type,
    section_order,
    generated_content,
    edited_content,
    generation_status
  )
  SELECT
    v_proposal_id,
    title,
    section_type,
    section_order,
    generated_content,
    edited_content,
    generation_status
  FROM section_versions
  WHERE proposal_version_id = p_version_id;

  -- Create a version recording the restore
  PERFORM create_proposal_version(
    v_proposal_id,
    'restored',
    'Restored from version ' || v_version.version_number || COALESCE(' (' || v_version.label || ')', ''),
    NULL,
    p_user_id
  );

  RETURN v_proposal_id;
END;
$$;


ALTER FUNCTION "public"."restore_proposal_version"("p_version_id" "uuid", "p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_document_chunk_count"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  update public.documents
  set chunk_count = (
    select count(*) from public.document_chunks
    where document_id = new.document_id
  )
  where id = new.document_id;
  return new;
end;
$$;


ALTER FUNCTION "public"."update_document_chunk_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_section_reviews_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_section_reviews_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."update_updated_at"() OWNER TO "postgres";


SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."allowed_emails" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "added_by" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."allowed_emails" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."company_context" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "category" "text" NOT NULL,
    "key" "text" NOT NULL,
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "is_locked" boolean DEFAULT false,
    "lock_reason" "text",
    "last_verified_at" timestamp with time zone,
    "verified_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "organization_id" "uuid"
);


ALTER TABLE "public"."company_context" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."deal_outcome_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "proposal_id" "uuid" NOT NULL,
    "previous_outcome" "text",
    "new_outcome" "text" NOT NULL,
    "deal_value" numeric,
    "loss_reason" "text",
    "loss_reason_category" "text",
    "competitor_won" "text",
    "notes" "text",
    "changed_by" "uuid" NOT NULL,
    "changed_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."deal_outcome_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."document_chunks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "document_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "chunk_index" integer NOT NULL,
    "token_count" integer,
    "section_heading" "text",
    "page_number" integer,
    "slide_number" integer,
    "embedding" "extensions"."vector"(1024),
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."document_chunks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "file_name" "text" NOT NULL,
    "file_type" "text" NOT NULL,
    "file_size_bytes" bigint NOT NULL,
    "storage_path" "text" NOT NULL,
    "mime_type" "text" NOT NULL,
    "document_type" "text" DEFAULT 'proposal'::"text" NOT NULL,
    "industry" "text",
    "service_line" "text",
    "client_name" "text",
    "win_status" "text",
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "processing_status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "processing_error" "text",
    "chunk_count" integer DEFAULT 0,
    "parsed_text_preview" "text",
    "uploaded_by" "uuid" NOT NULL,
    "team_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "organization_id" "uuid",
    CONSTRAINT "documents_document_type_check" CHECK (("document_type" = ANY (ARRAY['proposal'::"text", 'case_study'::"text", 'methodology'::"text", 'capability'::"text", 'team_bio'::"text", 'template'::"text", 'rfp'::"text", 'other'::"text"]))),
    CONSTRAINT "documents_file_type_check" CHECK (("file_type" = ANY (ARRAY['docx'::"text", 'pdf'::"text", 'pptx'::"text", 'txt'::"text", 'md'::"text"]))),
    CONSTRAINT "documents_processing_status_check" CHECK (("processing_status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'completed'::"text", 'failed'::"text"]))),
    CONSTRAINT "documents_win_status_check" CHECK (("win_status" = ANY (ARRAY['won'::"text", 'lost'::"text", 'pending'::"text", 'unknown'::"text"])))
);


ALTER TABLE "public"."documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."evidence_library" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "evidence_type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "summary" "text",
    "full_content" "text",
    "client_industry" "text",
    "service_line" "text",
    "client_size" "text",
    "outcomes_demonstrated" "jsonb" DEFAULT '[]'::"jsonb",
    "metrics" "jsonb" DEFAULT '[]'::"jsonb",
    "source_document_id" "uuid",
    "external_url" "text",
    "is_verified" boolean DEFAULT false,
    "verified_by" "uuid",
    "verified_at" timestamp with time zone,
    "verification_notes" "text",
    "times_used" integer DEFAULT 0,
    "last_used_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "organization_id" "uuid"
);


ALTER TABLE "public"."evidence_library" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."organizations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "stripe_customer_id" "text",
    "stripe_subscription_id" "text",
    "stripe_price_id" "text",
    "plan_tier" "text" DEFAULT 'trial'::"text" NOT NULL,
    "plan_limits" "jsonb" DEFAULT '{"max_users": 1, "max_documents": 10, "ai_tokens_per_month": 50000, "proposals_per_month": 3}'::"jsonb" NOT NULL,
    "usage_current_period" "jsonb" DEFAULT '{"ai_tokens_used": 0, "proposals_created": 0, "documents_uploaded": 0}'::"jsonb" NOT NULL,
    "billing_cycle_start" timestamp with time zone,
    "billing_cycle_end" timestamp with time zone,
    "trial_ends_at" timestamp with time zone DEFAULT ("now"() + '14 days'::interval),
    "settings" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "organizations_plan_tier_check" CHECK (("plan_tier" = ANY (ARRAY['trial'::"text", 'starter'::"text", 'pro'::"text", 'business'::"text", 'enterprise'::"text"])))
);


ALTER TABLE "public"."organizations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product_contexts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "product_name" "text" NOT NULL,
    "service_line" "text" NOT NULL,
    "description" "text",
    "capabilities" "jsonb" DEFAULT '[]'::"jsonb",
    "specifications" "jsonb" DEFAULT '{}'::"jsonb",
    "pricing_models" "jsonb" DEFAULT '[]'::"jsonb",
    "constraints" "jsonb" DEFAULT '{}'::"jsonb",
    "supported_outcomes" "jsonb" DEFAULT '[]'::"jsonb",
    "is_locked" boolean DEFAULT false,
    "lock_reason" "text",
    "last_verified_at" timestamp with time zone,
    "verified_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "organization_id" "uuid"
);


ALTER TABLE "public"."product_contexts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "full_name" "text",
    "avatar_url" "text",
    "role" "text" DEFAULT 'member'::"text" NOT NULL,
    "team_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "organization_id" "uuid",
    CONSTRAINT "profiles_role_check" CHECK (("role" = ANY (ARRAY['admin'::"text", 'manager'::"text", 'member'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."proposal_document_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "proposal_id" "uuid" NOT NULL,
    "document_id" "uuid" NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "event_type" "text" NOT NULL,
    "event_data" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    CONSTRAINT "proposal_document_events_event_type_check" CHECK (("event_type" = ANY (ARRAY['added'::"text", 'extracted'::"text", 'merged'::"text", 'superseded'::"text", 'removed'::"text"])))
);


ALTER TABLE "public"."proposal_document_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."proposal_documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "proposal_id" "uuid" NOT NULL,
    "document_id" "uuid" NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "document_role" "text" DEFAULT 'supplemental'::"text" NOT NULL,
    "upload_order" integer DEFAULT 0 NOT NULL,
    "added_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "added_by" "uuid",
    "notes" "text",
    "extraction_status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "extracted_at" timestamp with time zone,
    CONSTRAINT "proposal_documents_document_role_check" CHECK (("document_role" = ANY (ARRAY['primary_rfp'::"text", 'amendment'::"text", 'attachment'::"text", 'qa_addendum'::"text", 'incumbent_info'::"text", 'evaluation_criteria'::"text", 'template'::"text", 'supplemental'::"text"]))),
    CONSTRAINT "proposal_documents_extraction_status_check" CHECK (("extraction_status" = ANY (ARRAY['pending'::"text", 'extracted'::"text", 'merged'::"text", 'skipped'::"text"])))
);


ALTER TABLE "public"."proposal_documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."proposals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "intake_data" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "rfp_document_id" "uuid",
    "rfp_extracted_requirements" "jsonb",
    "generation_model" "text" DEFAULT 'claude-sonnet-4-20250514'::"text",
    "generation_started_at" timestamp with time zone,
    "generation_completed_at" timestamp with time zone,
    "created_by" "uuid" NOT NULL,
    "team_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "win_strategy_data" "jsonb" DEFAULT '{}'::"jsonb",
    "outcome_contract" "jsonb" DEFAULT '{}'::"jsonb",
    "intent_status" "text" DEFAULT 'draft'::"text",
    "intent_approved_by" "uuid",
    "intent_approved_at" timestamp with time zone,
    "intent_notes" "text",
    "deal_outcome" "text" DEFAULT 'pending'::"text",
    "deal_outcome_set_at" timestamp with time zone,
    "deal_outcome_set_by" "uuid",
    "deal_value" numeric,
    "deal_currency" "text" DEFAULT 'USD'::"text",
    "loss_reason" "text",
    "loss_reason_category" "text",
    "competitor_won" "text",
    "outcome_notes" "text",
    "promoted_to_case_study" boolean DEFAULT false,
    "case_study_source_id" "uuid",
    "client_research" "jsonb",
    "intake_source_type" "text",
    "intake_raw_content" "text",
    "organization_id" "uuid",
    "quality_review" "jsonb",
    "bid_evaluation" "jsonb",
    "l1_summary" "jsonb",
    "compliance_assessment" "jsonb",
    "generation_error" "text",
    "assumptions" "jsonb" DEFAULT '[]'::"jsonb",
    "rfp_task_structure" "jsonb",
    CONSTRAINT "proposals_deal_outcome_check" CHECK (("deal_outcome" = ANY (ARRAY['pending'::"text", 'won'::"text", 'lost'::"text", 'no_decision'::"text", 'withdrawn'::"text"]))),
    CONSTRAINT "proposals_intake_source_type_check" CHECK ((("intake_source_type" IS NULL) OR ("intake_source_type" = ANY (ARRAY['upload'::"text", 'paste'::"text", 'describe'::"text", 'manual'::"text"])))),
    CONSTRAINT "proposals_intent_status_check" CHECK (("intent_status" = ANY (ARRAY['draft'::"text", 'pending_review'::"text", 'approved'::"text", 'locked'::"text"]))),
    CONSTRAINT "proposals_loss_reason_category_check" CHECK ((("loss_reason_category" IS NULL) OR ("loss_reason_category" = ANY (ARRAY['price'::"text", 'capability'::"text", 'relationship'::"text", 'timing'::"text", 'competition'::"text", 'requirements'::"text", 'other'::"text"])))),
    CONSTRAINT "proposals_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'intake'::"text", 'generating'::"text", 'review'::"text", 'final'::"text", 'exported'::"text"])))
);


ALTER TABLE "public"."proposals" OWNER TO "postgres";


COMMENT ON COLUMN "public"."proposals"."rfp_document_id" IS 'DEPRECATED: Use proposal_documents junction table instead. Will be removed in a future migration.';



COMMENT ON COLUMN "public"."proposals"."win_strategy_data" IS 'IDD outcome-focused workflow data: win_themes, success_metrics, differentiators, target_outcomes';



COMMENT ON COLUMN "public"."proposals"."client_research" IS 'AI-researched client intel (company overview, news, priorities)';



COMMENT ON COLUMN "public"."proposals"."intake_source_type" IS 'How intake was provided: upload, paste, describe, manual';



COMMENT ON COLUMN "public"."proposals"."intake_raw_content" IS 'Original content provided for intake extraction';



COMMENT ON COLUMN "public"."proposals"."quality_review" IS 'Automated quality review results from GPT-4o overseer. Contains scores, feedback, and remediation log.';



COMMENT ON COLUMN "public"."proposals"."bid_evaluation" IS 'Bid/no-bid scoring evaluation. Contains 5-factor AI scores, optional user overrides, weighted total, recommendation tier, and proceed/skip decision.';



COMMENT ON COLUMN "public"."proposals"."l1_summary" IS 'Metadata about L1 (Company Truth) data used during proposal generation: counts, IDs, string length, timestamp';



COMMENT ON COLUMN "public"."proposals"."compliance_assessment" IS 'Metadata from compliance auto-assessment: status, counts, timestamp, trigger type';



COMMENT ON COLUMN "public"."proposals"."assumptions" IS 'Auto-generated project assumptions from RFP extraction. Array of {category, text, is_ai_generated} objects.';



COMMENT ON COLUMN "public"."proposals"."rfp_task_structure" IS 'Extracted hierarchical task structure from RFP for task-mirrored section generation';



CREATE OR REPLACE VIEW "public"."proposal_outcome_stats" WITH ("security_invoker"='true') AS
 SELECT "date_trunc"('month'::"text", "created_at") AS "month",
    "date_trunc"('quarter'::"text", "created_at") AS "quarter",
    "date_trunc"('year'::"text", "created_at") AS "year",
    ("intake_data" ->> 'opportunity_type'::"text") AS "opportunity_type",
    ("intake_data" ->> 'client_industry'::"text") AS "client_industry",
    ("intake_data" ->> 'client_size'::"text") AS "client_size",
    "count"(*) AS "total_proposals",
    "count"(*) FILTER (WHERE ("deal_outcome" = 'won'::"text")) AS "won",
    "count"(*) FILTER (WHERE ("deal_outcome" = 'lost'::"text")) AS "lost",
    "count"(*) FILTER (WHERE ("deal_outcome" = 'no_decision'::"text")) AS "no_decision",
    "count"(*) FILTER (WHERE ("deal_outcome" = 'pending'::"text")) AS "pending",
    "count"(*) FILTER (WHERE ("deal_outcome" = 'withdrawn'::"text")) AS "withdrawn",
        CASE
            WHEN ("count"(*) FILTER (WHERE ("deal_outcome" = ANY (ARRAY['won'::"text", 'lost'::"text"]))) > 0) THEN "round"(((("count"(*) FILTER (WHERE ("deal_outcome" = 'won'::"text")))::numeric / ("count"(*) FILTER (WHERE ("deal_outcome" = ANY (ARRAY['won'::"text", 'lost'::"text"]))))::numeric) * (100)::numeric), 1)
            ELSE NULL::numeric
        END AS "win_rate_percent",
    "sum"("deal_value") FILTER (WHERE ("deal_outcome" = 'won'::"text")) AS "total_won_value",
    "avg"("deal_value") FILTER (WHERE ("deal_outcome" = 'won'::"text")) AS "avg_won_value",
    "mode"() WITHIN GROUP (ORDER BY "loss_reason_category") FILTER (WHERE ("deal_outcome" = 'lost'::"text")) AS "top_loss_reason"
   FROM "public"."proposals" "p"
  WHERE ("status" = ANY (ARRAY['exported'::"text", 'final'::"text"]))
  GROUP BY ("date_trunc"('month'::"text", "created_at")), ("date_trunc"('quarter'::"text", "created_at")), ("date_trunc"('year'::"text", "created_at")), ("intake_data" ->> 'opportunity_type'::"text"), ("intake_data" ->> 'client_industry'::"text"), ("intake_data" ->> 'client_size'::"text");


ALTER VIEW "public"."proposal_outcome_stats" OWNER TO "postgres";


COMMENT ON VIEW "public"."proposal_outcome_stats" IS 'Aggregate outcome stats for analytics. Uses SECURITY INVOKER to respect caller RLS policies.';



CREATE TABLE IF NOT EXISTS "public"."proposal_requirements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "proposal_id" "uuid" NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "requirement_text" "text" NOT NULL,
    "source_reference" "text",
    "category" "text" DEFAULT 'desirable'::"text" NOT NULL,
    "compliance_status" "text" DEFAULT 'not_addressed'::"text" NOT NULL,
    "mapped_section_id" "uuid",
    "notes" "text",
    "is_extracted" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "source_document_id" "uuid",
    "requirement_type" "text" DEFAULT 'content'::"text" NOT NULL,
    CONSTRAINT "proposal_requirements_category_check" CHECK (("category" = ANY (ARRAY['mandatory'::"text", 'desirable'::"text", 'informational'::"text"]))),
    CONSTRAINT "proposal_requirements_compliance_status_check" CHECK (("compliance_status" = ANY (ARRAY['met'::"text", 'partially_met'::"text", 'not_addressed'::"text", 'not_applicable'::"text"]))),
    CONSTRAINT "proposal_requirements_requirement_type_check" CHECK (("requirement_type" = ANY (ARRAY['content'::"text", 'format'::"text", 'submission'::"text", 'certification'::"text"])))
);


ALTER TABLE "public"."proposal_requirements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."proposal_review_stages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "proposal_id" "uuid" NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "stage" "text" NOT NULL,
    "stage_order" integer NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "completed_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "proposal_review_stages_stage_check" CHECK (("stage" = ANY (ARRAY['pink'::"text", 'red'::"text", 'gold'::"text", 'white'::"text"]))),
    CONSTRAINT "proposal_review_stages_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'active'::"text", 'completed'::"text", 'skipped'::"text"])))
);


ALTER TABLE "public"."proposal_review_stages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."proposal_reviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "proposal_id" "uuid" NOT NULL,
    "section_id" "uuid",
    "reviewer_id" "uuid" NOT NULL,
    "reviewer_email" "text",
    "annotation_type" "text" DEFAULT 'comment'::"text",
    "content" "text" NOT NULL,
    "selector_data" "jsonb" DEFAULT '{}'::"jsonb",
    "selected_text" "text",
    "status" "text" DEFAULT 'open'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "proposal_reviews_annotation_type_check" CHECK (("annotation_type" = ANY (ARRAY['comment'::"text", 'suggestion'::"text", 'approval'::"text", 'rejection'::"text"]))),
    CONSTRAINT "proposal_reviews_status_check" CHECK (("status" = ANY (ARRAY['open'::"text", 'resolved'::"text", 'dismissed'::"text"])))
);


ALTER TABLE "public"."proposal_reviews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."proposal_sections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "proposal_id" "uuid" NOT NULL,
    "section_type" "text" NOT NULL,
    "section_order" integer NOT NULL,
    "title" "text" NOT NULL,
    "generated_content" "text",
    "edited_content" "text",
    "is_edited" boolean DEFAULT false NOT NULL,
    "generation_prompt" "text",
    "retrieved_context_ids" "uuid"[],
    "generation_status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "generation_error" "text",
    "review_status" "text" DEFAULT 'pending'::"text",
    "review_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "diagram_image" "text",
    CONSTRAINT "proposal_sections_generation_status_check" CHECK (("generation_status" = ANY (ARRAY['pending'::"text", 'generating'::"text", 'completed'::"text", 'failed'::"text", 'regenerating'::"text"]))),
    CONSTRAINT "proposal_sections_review_status_check" CHECK (("review_status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'needs_revision'::"text", 'skipped'::"text"]))),
    CONSTRAINT "proposal_sections_section_type_check" CHECK (("section_type" = ANY (ARRAY['executive_summary'::"text", 'understanding'::"text", 'approach'::"text", 'methodology'::"text", 'team'::"text", 'case_studies'::"text", 'timeline'::"text", 'pricing'::"text", 'risk_mitigation'::"text", 'why_capgemini'::"text", 'why_us'::"text", 'appendix'::"text", 'cover_letter'::"text", 'compliance_matrix_section'::"text", 'exceptions_terms'::"text", 'rfp_task'::"text"])))
);


ALTER TABLE "public"."proposal_sections" OWNER TO "postgres";


COMMENT ON COLUMN "public"."proposal_sections"."diagram_image" IS 'Base64 data URL of AI-generated diagram image (Gemini image generation)';



COMMENT ON CONSTRAINT "proposal_sections_section_type_check" ON "public"."proposal_sections" IS 'Allowed section types for proposal generation. Updated in migration 00044 to include boilerplate and task-mirrored types.';



CREATE TABLE IF NOT EXISTS "public"."proposal_versions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "proposal_id" "uuid" NOT NULL,
    "version_number" integer NOT NULL,
    "title" "text" NOT NULL,
    "intake_data" "jsonb",
    "outcome_contract" "jsonb",
    "status" "text",
    "trigger_event" "text" NOT NULL,
    "change_summary" "text",
    "label" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."proposal_versions" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."proposal_versions_summary" AS
SELECT
    NULL::"uuid" AS "id",
    NULL::"uuid" AS "proposal_id",
    NULL::integer AS "version_number",
    NULL::"text" AS "title",
    NULL::"jsonb" AS "intake_data",
    NULL::"jsonb" AS "outcome_contract",
    NULL::"text" AS "status",
    NULL::"text" AS "trigger_event",
    NULL::"text" AS "change_summary",
    NULL::"text" AS "label",
    NULL::"uuid" AS "created_by",
    NULL::timestamp with time zone AS "created_at",
    NULL::"text" AS "created_by_email",
    NULL::bigint AS "section_count",
    NULL::bigint AS "completed_sections";


ALTER VIEW "public"."proposal_versions_summary" OWNER TO "postgres";


COMMENT ON VIEW "public"."proposal_versions_summary" IS 'Summary view for proposal versions. Uses profiles table (with RLS) instead of auth.users. Uses SECURITY INVOKER to respect caller permissions.';



CREATE TABLE IF NOT EXISTS "public"."section_claims" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "section_id" "uuid" NOT NULL,
    "claim_text" "text" NOT NULL,
    "claim_type" "text",
    "evidence_id" "uuid",
    "product_context_id" "uuid",
    "company_context_id" "uuid",
    "verification_status" "text" DEFAULT 'unverified'::"text",
    "flagged_reason" "text",
    "verified_by" "uuid",
    "verified_at" timestamp with time zone,
    "start_offset" integer,
    "end_offset" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."section_claims" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."section_feedback" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "section_id" "uuid" NOT NULL,
    "proposal_id" "uuid" NOT NULL,
    "rating" integer,
    "feedback_type" "text" NOT NULL,
    "feedback_text" "text",
    "proposal_outcome" "text",
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "section_feedback_feedback_type_check" CHECK (("feedback_type" = ANY (ARRAY['helpful'::"text", 'not_helpful'::"text", 'needs_edit'::"text", 'excellent'::"text"]))),
    CONSTRAINT "section_feedback_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."section_feedback" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."section_outcome_mapping" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "section_id" "uuid" NOT NULL,
    "outcome_key" "text" NOT NULL,
    "outcome_description" "text",
    "relevance_score" double precision DEFAULT 0.5,
    "relevance_explanation" "text",
    "is_confirmed" boolean DEFAULT false,
    "confirmed_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."section_outcome_mapping" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."section_reviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "stage_id" "uuid" NOT NULL,
    "reviewer_id" "uuid" NOT NULL,
    "section_id" "uuid" NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "score" integer,
    "comment" "text",
    "strengths" "text",
    "weaknesses" "text",
    "recommendations" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "section_reviews_score_check" CHECK ((("score" IS NULL) OR (("score" >= 0) AND ("score" <= 100))))
);


ALTER TABLE "public"."section_reviews" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."section_sources" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "section_id" "uuid" NOT NULL,
    "chunk_id" "uuid" NOT NULL,
    "relevance_score" double precision,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."section_sources" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."section_versions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "proposal_version_id" "uuid" NOT NULL,
    "original_section_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "section_type" "text" NOT NULL,
    "section_order" integer NOT NULL,
    "generated_content" "text",
    "edited_content" "text",
    "generation_status" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."section_versions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."stage_reviewers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "stage_id" "uuid" NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "reviewer_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "assigned_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "completed_at" timestamp with time zone,
    CONSTRAINT "stage_reviewers_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'in_progress'::"text", 'completed'::"text"])))
);


ALTER TABLE "public"."stage_reviewers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."team_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "role" "text" NOT NULL,
    "title" "text",
    "email" "text",
    "skills" "jsonb" DEFAULT '[]'::"jsonb",
    "certifications" "jsonb" DEFAULT '[]'::"jsonb",
    "clearance_level" "text",
    "years_experience" integer,
    "project_history" "jsonb" DEFAULT '[]'::"jsonb",
    "resume_document_id" "uuid",
    "bio" "text",
    "is_verified" boolean DEFAULT false,
    "verified_by" "uuid",
    "verified_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid"
);


ALTER TABLE "public"."team_members" OWNER TO "postgres";


COMMENT ON TABLE "public"."team_members" IS 'L1 Company Truth: Named personnel for proposal generation. Required for government procurement compliance.';



CREATE TABLE IF NOT EXISTS "public"."teams" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "organization_id" "uuid"
);


ALTER TABLE "public"."teams" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."verification_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "proposal_id" "uuid" NOT NULL,
    "verification_type" "text" NOT NULL,
    "target_type" "text",
    "target_id" "uuid",
    "status" "text" NOT NULL,
    "message" "text",
    "details" "jsonb",
    "performed_by" "uuid",
    "is_automated" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."verification_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."waitlist" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "company" "text" NOT NULL,
    "company_size" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "notes" "text",
    "nurture_step" integer DEFAULT 0 NOT NULL,
    "nurture_last_sent_at" timestamp with time zone,
    CONSTRAINT "waitlist_company_size_check" CHECK (("company_size" = ANY (ARRAY['1-10'::"text", '11-50'::"text", '51-200'::"text", '201-500'::"text", '500+'::"text"]))),
    CONSTRAINT "waitlist_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'contacted'::"text", 'approved'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."waitlist" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."waitlist_signups" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "full_name" "text",
    "company" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."waitlist_signups" OWNER TO "postgres";


ALTER TABLE ONLY "public"."allowed_emails"
    ADD CONSTRAINT "allowed_emails_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."allowed_emails"
    ADD CONSTRAINT "allowed_emails_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."company_context"
    ADD CONSTRAINT "company_context_category_key_org_unique" UNIQUE ("category", "key", "organization_id");



ALTER TABLE ONLY "public"."company_context"
    ADD CONSTRAINT "company_context_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."deal_outcome_history"
    ADD CONSTRAINT "deal_outcome_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."document_chunks"
    ADD CONSTRAINT "document_chunks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."evidence_library"
    ADD CONSTRAINT "evidence_library_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."evidence_library"
    ADD CONSTRAINT "evidence_library_title_org_unique" UNIQUE ("title", "organization_id");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_stripe_customer_id_key" UNIQUE ("stripe_customer_id");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_stripe_subscription_id_key" UNIQUE ("stripe_subscription_id");



ALTER TABLE ONLY "public"."product_contexts"
    ADD CONSTRAINT "product_contexts_name_service_org_unique" UNIQUE ("product_name", "service_line", "organization_id");



ALTER TABLE ONLY "public"."product_contexts"
    ADD CONSTRAINT "product_contexts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."proposal_document_events"
    ADD CONSTRAINT "proposal_document_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."proposal_documents"
    ADD CONSTRAINT "proposal_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."proposal_documents"
    ADD CONSTRAINT "proposal_documents_proposal_id_document_id_key" UNIQUE ("proposal_id", "document_id");



ALTER TABLE ONLY "public"."proposal_requirements"
    ADD CONSTRAINT "proposal_requirements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."proposal_review_stages"
    ADD CONSTRAINT "proposal_review_stages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."proposal_review_stages"
    ADD CONSTRAINT "proposal_review_stages_proposal_id_stage_key" UNIQUE ("proposal_id", "stage");



ALTER TABLE ONLY "public"."proposal_reviews"
    ADD CONSTRAINT "proposal_reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."proposal_sections"
    ADD CONSTRAINT "proposal_sections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."proposal_versions"
    ADD CONSTRAINT "proposal_versions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."proposal_versions"
    ADD CONSTRAINT "proposal_versions_proposal_id_version_number_key" UNIQUE ("proposal_id", "version_number");



ALTER TABLE ONLY "public"."proposals"
    ADD CONSTRAINT "proposals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."section_claims"
    ADD CONSTRAINT "section_claims_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."section_feedback"
    ADD CONSTRAINT "section_feedback_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."section_outcome_mapping"
    ADD CONSTRAINT "section_outcome_mapping_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."section_outcome_mapping"
    ADD CONSTRAINT "section_outcome_mapping_section_id_outcome_key_key" UNIQUE ("section_id", "outcome_key");



ALTER TABLE ONLY "public"."section_reviews"
    ADD CONSTRAINT "section_reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."section_reviews"
    ADD CONSTRAINT "section_reviews_reviewer_id_section_id_key" UNIQUE ("reviewer_id", "section_id");



ALTER TABLE ONLY "public"."section_sources"
    ADD CONSTRAINT "section_sources_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."section_sources"
    ADD CONSTRAINT "section_sources_section_id_chunk_id_key" UNIQUE ("section_id", "chunk_id");



ALTER TABLE ONLY "public"."section_versions"
    ADD CONSTRAINT "section_versions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stage_reviewers"
    ADD CONSTRAINT "stage_reviewers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."stage_reviewers"
    ADD CONSTRAINT "stage_reviewers_stage_id_reviewer_id_key" UNIQUE ("stage_id", "reviewer_id");



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."verification_log"
    ADD CONSTRAINT "verification_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."waitlist"
    ADD CONSTRAINT "waitlist_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."waitlist"
    ADD CONSTRAINT "waitlist_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."waitlist_signups"
    ADD CONSTRAINT "waitlist_signups_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."waitlist_signups"
    ADD CONSTRAINT "waitlist_signups_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_chunks_content_fts" ON "public"."document_chunks" USING "gin" ("to_tsvector"('"english"'::"regconfig", "content"));



CREATE INDEX "idx_chunks_document" ON "public"."document_chunks" USING "btree" ("document_id");



CREATE INDEX "idx_chunks_embedding" ON "public"."document_chunks" USING "hnsw" ("embedding" "extensions"."vector_cosine_ops") WITH ("m"='16', "ef_construction"='64');



CREATE INDEX "idx_chunks_section" ON "public"."document_chunks" USING "btree" ("section_heading");



CREATE INDEX "idx_company_context_category" ON "public"."company_context" USING "btree" ("category");



CREATE INDEX "idx_company_context_org_category" ON "public"."company_context" USING "btree" ("organization_id", "category");



CREATE INDEX "idx_company_context_organization" ON "public"."company_context" USING "btree" ("organization_id");



CREATE INDEX "idx_deal_outcome_history_proposal_changed" ON "public"."deal_outcome_history" USING "btree" ("proposal_id", "changed_at" DESC);



CREATE INDEX "idx_document_chunks_document" ON "public"."document_chunks" USING "btree" ("document_id");



CREATE INDEX "idx_documents_industry" ON "public"."documents" USING "btree" ("industry");



CREATE INDEX "idx_documents_org_status" ON "public"."documents" USING "btree" ("organization_id", "processing_status");



CREATE INDEX "idx_documents_org_type" ON "public"."documents" USING "btree" ("organization_id", "document_type");



CREATE INDEX "idx_documents_organization" ON "public"."documents" USING "btree" ("organization_id");



CREATE INDEX "idx_documents_processing" ON "public"."documents" USING "btree" ("processing_status");



CREATE INDEX "idx_documents_service_line" ON "public"."documents" USING "btree" ("service_line");



CREATE INDEX "idx_documents_tags" ON "public"."documents" USING "gin" ("tags");



CREATE INDEX "idx_documents_team" ON "public"."documents" USING "btree" ("team_id");



CREATE INDEX "idx_documents_type" ON "public"."documents" USING "btree" ("document_type");



CREATE INDEX "idx_evidence_library_industry" ON "public"."evidence_library" USING "btree" ("client_industry");



CREATE INDEX "idx_evidence_library_org_verified" ON "public"."evidence_library" USING "btree" ("organization_id", "is_verified") WHERE ("is_verified" = true);



CREATE INDEX "idx_evidence_library_organization" ON "public"."evidence_library" USING "btree" ("organization_id");



CREATE INDEX "idx_evidence_library_service_line" ON "public"."evidence_library" USING "btree" ("service_line");



CREATE INDEX "idx_evidence_library_type" ON "public"."evidence_library" USING "btree" ("evidence_type");



CREATE INDEX "idx_evidence_library_verified" ON "public"."evidence_library" USING "btree" ("is_verified");



CREATE INDEX "idx_evidence_metrics_gin" ON "public"."evidence_library" USING "gin" ("metrics");



CREATE INDEX "idx_evidence_outcomes_gin" ON "public"."evidence_library" USING "gin" ("outcomes_demonstrated");



CREATE INDEX "idx_organizations_slug" ON "public"."organizations" USING "btree" ("slug");



CREATE INDEX "idx_organizations_stripe_customer" ON "public"."organizations" USING "btree" ("stripe_customer_id");



CREATE INDEX "idx_outcome_history_proposal" ON "public"."deal_outcome_history" USING "btree" ("proposal_id");



CREATE INDEX "idx_product_capabilities_gin" ON "public"."product_contexts" USING "gin" ("capabilities");



CREATE INDEX "idx_product_contexts_org_service" ON "public"."product_contexts" USING "btree" ("organization_id", "service_line");



CREATE INDEX "idx_product_contexts_organization" ON "public"."product_contexts" USING "btree" ("organization_id");



CREATE INDEX "idx_product_contexts_service_line" ON "public"."product_contexts" USING "btree" ("service_line");



CREATE INDEX "idx_product_outcomes_gin" ON "public"."product_contexts" USING "gin" ("supported_outcomes");



CREATE INDEX "idx_profiles_org" ON "public"."profiles" USING "btree" ("organization_id");



CREATE INDEX "idx_profiles_organization" ON "public"."profiles" USING "btree" ("organization_id");



CREATE INDEX "idx_proposal_document_events_document" ON "public"."proposal_document_events" USING "btree" ("document_id");



CREATE INDEX "idx_proposal_document_events_proposal" ON "public"."proposal_document_events" USING "btree" ("proposal_id");



CREATE INDEX "idx_proposal_documents_document" ON "public"."proposal_documents" USING "btree" ("document_id");



CREATE INDEX "idx_proposal_documents_org" ON "public"."proposal_documents" USING "btree" ("organization_id");



CREATE INDEX "idx_proposal_documents_proposal" ON "public"."proposal_documents" USING "btree" ("proposal_id");



CREATE INDEX "idx_proposal_documents_role" ON "public"."proposal_documents" USING "btree" ("proposal_id", "document_role");



CREATE INDEX "idx_proposal_requirements_org" ON "public"."proposal_requirements" USING "btree" ("organization_id");



CREATE INDEX "idx_proposal_requirements_proposal" ON "public"."proposal_requirements" USING "btree" ("proposal_id", "category");



CREATE INDEX "idx_proposal_requirements_proposal_id" ON "public"."proposal_requirements" USING "btree" ("proposal_id");



CREATE INDEX "idx_proposal_requirements_source_doc" ON "public"."proposal_requirements" USING "btree" ("source_document_id");



CREATE INDEX "idx_proposal_requirements_type" ON "public"."proposal_requirements" USING "btree" ("proposal_id", "requirement_type");



CREATE INDEX "idx_proposal_requirements_type_status" ON "public"."proposal_requirements" USING "btree" ("proposal_id", "requirement_type", "compliance_status");



CREATE INDEX "idx_proposal_sections_proposal" ON "public"."proposal_sections" USING "btree" ("proposal_id", "section_order");



CREATE INDEX "idx_proposal_sections_status" ON "public"."proposal_sections" USING "btree" ("proposal_id", "generation_status");



CREATE INDEX "idx_proposal_versions_created_at" ON "public"."proposal_versions" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_proposal_versions_proposal" ON "public"."proposal_versions" USING "btree" ("proposal_id", "created_at" DESC);



CREATE INDEX "idx_proposal_versions_proposal_id" ON "public"."proposal_versions" USING "btree" ("proposal_id");



CREATE INDEX "idx_proposals_created_by" ON "public"."proposals" USING "btree" ("created_by");



CREATE INDEX "idx_proposals_deal_outcome" ON "public"."proposals" USING "btree" ("deal_outcome");



CREATE INDEX "idx_proposals_deal_outcome_set_at" ON "public"."proposals" USING "btree" ("deal_outcome_set_at");



CREATE INDEX "idx_proposals_intake_source_type" ON "public"."proposals" USING "btree" ("intake_source_type");



CREATE INDEX "idx_proposals_org_created" ON "public"."proposals" USING "btree" ("organization_id", "created_at" DESC);



CREATE INDEX "idx_proposals_org_status" ON "public"."proposals" USING "btree" ("organization_id", "status");



CREATE INDEX "idx_proposals_organization" ON "public"."proposals" USING "btree" ("organization_id");



CREATE INDEX "idx_proposals_status" ON "public"."proposals" USING "btree" ("status");



CREATE INDEX "idx_proposals_team" ON "public"."proposals" USING "btree" ("team_id");



CREATE INDEX "idx_review_stages_proposal_id" ON "public"."proposal_review_stages" USING "btree" ("proposal_id");



CREATE INDEX "idx_reviews_proposal" ON "public"."proposal_reviews" USING "btree" ("proposal_id");



CREATE INDEX "idx_reviews_section" ON "public"."proposal_reviews" USING "btree" ("section_id");



CREATE INDEX "idx_reviews_status" ON "public"."proposal_reviews" USING "btree" ("status");



CREATE INDEX "idx_section_claims_evidence" ON "public"."section_claims" USING "btree" ("evidence_id");



CREATE INDEX "idx_section_claims_section" ON "public"."section_claims" USING "btree" ("section_id");



CREATE INDEX "idx_section_claims_status" ON "public"."section_claims" USING "btree" ("verification_status");



CREATE INDEX "idx_section_feedback_proposal" ON "public"."section_feedback" USING "btree" ("proposal_id");



CREATE INDEX "idx_section_feedback_section" ON "public"."section_feedback" USING "btree" ("section_id");



CREATE INDEX "idx_section_outcome_key" ON "public"."section_outcome_mapping" USING "btree" ("outcome_key");



CREATE INDEX "idx_section_outcome_section" ON "public"."section_outcome_mapping" USING "btree" ("section_id");



CREATE INDEX "idx_section_reviews_reviewer_id" ON "public"."section_reviews" USING "btree" ("reviewer_id");



CREATE INDEX "idx_section_reviews_section_id" ON "public"."section_reviews" USING "btree" ("section_id");



CREATE INDEX "idx_section_reviews_stage_id" ON "public"."section_reviews" USING "btree" ("stage_id");



CREATE INDEX "idx_section_sources_chunk" ON "public"."section_sources" USING "btree" ("chunk_id");



CREATE INDEX "idx_section_sources_section" ON "public"."section_sources" USING "btree" ("section_id");



CREATE INDEX "idx_section_versions_proposal_version_id" ON "public"."section_versions" USING "btree" ("proposal_version_id");



CREATE INDEX "idx_sections_proposal" ON "public"."proposal_sections" USING "btree" ("proposal_id");



CREATE INDEX "idx_sections_type" ON "public"."proposal_sections" USING "btree" ("section_type");



CREATE INDEX "idx_stage_reviewers_reviewer_id" ON "public"."stage_reviewers" USING "btree" ("reviewer_id");



CREATE INDEX "idx_stage_reviewers_stage_id" ON "public"."stage_reviewers" USING "btree" ("stage_id");



CREATE INDEX "idx_team_members_certs_gin" ON "public"."team_members" USING "gin" ("certifications");



CREATE INDEX "idx_team_members_organization" ON "public"."team_members" USING "btree" ("organization_id");



CREATE INDEX "idx_team_members_role" ON "public"."team_members" USING "btree" ("role");



CREATE INDEX "idx_team_members_skills_gin" ON "public"."team_members" USING "gin" ("skills");



CREATE INDEX "idx_team_members_verified" ON "public"."team_members" USING "btree" ("is_verified");



CREATE INDEX "idx_teams_organization" ON "public"."teams" USING "btree" ("organization_id");



CREATE INDEX "idx_verification_log_proposal" ON "public"."verification_log" USING "btree" ("proposal_id");



CREATE INDEX "idx_verification_log_type" ON "public"."verification_log" USING "btree" ("verification_type");



CREATE INDEX "idx_waitlist_email" ON "public"."waitlist" USING "btree" ("email");



CREATE INDEX "idx_waitlist_nurture" ON "public"."waitlist" USING "btree" ("status", "nurture_step", "created_at");



CREATE INDEX "idx_waitlist_status" ON "public"."waitlist" USING "btree" ("status");



CREATE OR REPLACE VIEW "public"."proposal_versions_summary" WITH ("security_invoker"='true') AS
 SELECT "pv"."id",
    "pv"."proposal_id",
    "pv"."version_number",
    "pv"."title",
    "pv"."intake_data",
    "pv"."outcome_contract",
    "pv"."status",
    "pv"."trigger_event",
    "pv"."change_summary",
    "pv"."label",
    "pv"."created_by",
    "pv"."created_at",
    "p"."email" AS "created_by_email",
    "count"("sv"."id") AS "section_count",
    "count"(
        CASE
            WHEN ("sv"."generation_status" = 'completed'::"text") THEN 1
            ELSE NULL::integer
        END) AS "completed_sections"
   FROM (("public"."proposal_versions" "pv"
     LEFT JOIN "public"."profiles" "p" ON (("p"."id" = "pv"."created_by")))
     LEFT JOIN "public"."section_versions" "sv" ON (("sv"."proposal_version_id" = "pv"."id")))
  GROUP BY "pv"."id", "p"."email";



CREATE OR REPLACE TRIGGER "documents_updated_at" BEFORE UPDATE ON "public"."documents" FOR EACH ROW EXECUTE FUNCTION "extensions"."moddatetime"('updated_at');



CREATE OR REPLACE TRIGGER "organizations_updated_at" BEFORE UPDATE ON "public"."organizations" FOR EACH ROW EXECUTE FUNCTION "extensions"."moddatetime"('updated_at');



CREATE OR REPLACE TRIGGER "profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "extensions"."moddatetime"('updated_at');



CREATE OR REPLACE TRIGGER "proposal_sections_updated_at" BEFORE UPDATE ON "public"."proposal_sections" FOR EACH ROW EXECUTE FUNCTION "extensions"."moddatetime"('updated_at');



CREATE OR REPLACE TRIGGER "proposals_updated_at" BEFORE UPDATE ON "public"."proposals" FOR EACH ROW EXECUTE FUNCTION "extensions"."moddatetime"('updated_at');



CREATE OR REPLACE TRIGGER "section_reviews_updated_at" BEFORE UPDATE ON "public"."section_reviews" FOR EACH ROW EXECUTE FUNCTION "public"."update_section_reviews_updated_at"();



CREATE OR REPLACE TRIGGER "teams_updated_at" BEFORE UPDATE ON "public"."teams" FOR EACH ROW EXECUTE FUNCTION "extensions"."moddatetime"('updated_at');



CREATE OR REPLACE TRIGGER "update_chunk_count_on_insert" AFTER INSERT ON "public"."document_chunks" FOR EACH ROW EXECUTE FUNCTION "public"."update_document_chunk_count"();



CREATE OR REPLACE TRIGGER "update_company_context_updated_at" BEFORE UPDATE ON "public"."company_context" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_evidence_library_updated_at" BEFORE UPDATE ON "public"."evidence_library" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_product_contexts_updated_at" BEFORE UPDATE ON "public"."product_contexts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



CREATE OR REPLACE TRIGGER "update_team_members_updated_at" BEFORE UPDATE ON "public"."team_members" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at"();



ALTER TABLE ONLY "public"."company_context"
    ADD CONSTRAINT "company_context_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."company_context"
    ADD CONSTRAINT "company_context_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."company_context"
    ADD CONSTRAINT "company_context_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."deal_outcome_history"
    ADD CONSTRAINT "deal_outcome_history_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."deal_outcome_history"
    ADD CONSTRAINT "deal_outcome_history_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "public"."proposals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."document_chunks"
    ADD CONSTRAINT "document_chunks_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id");



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."evidence_library"
    ADD CONSTRAINT "evidence_library_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."evidence_library"
    ADD CONSTRAINT "evidence_library_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."evidence_library"
    ADD CONSTRAINT "evidence_library_source_document_id_fkey" FOREIGN KEY ("source_document_id") REFERENCES "public"."documents"("id");



ALTER TABLE ONLY "public"."evidence_library"
    ADD CONSTRAINT "evidence_library_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."product_contexts"
    ADD CONSTRAINT "product_contexts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."product_contexts"
    ADD CONSTRAINT "product_contexts_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_contexts"
    ADD CONSTRAINT "product_contexts_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."proposal_document_events"
    ADD CONSTRAINT "proposal_document_events_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."proposal_document_events"
    ADD CONSTRAINT "proposal_document_events_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."proposal_document_events"
    ADD CONSTRAINT "proposal_document_events_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."proposal_document_events"
    ADD CONSTRAINT "proposal_document_events_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "public"."proposals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."proposal_documents"
    ADD CONSTRAINT "proposal_documents_added_by_fkey" FOREIGN KEY ("added_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."proposal_documents"
    ADD CONSTRAINT "proposal_documents_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."proposal_documents"
    ADD CONSTRAINT "proposal_documents_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."proposal_documents"
    ADD CONSTRAINT "proposal_documents_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "public"."proposals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."proposal_requirements"
    ADD CONSTRAINT "proposal_requirements_mapped_section_id_fkey" FOREIGN KEY ("mapped_section_id") REFERENCES "public"."proposal_sections"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."proposal_requirements"
    ADD CONSTRAINT "proposal_requirements_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."proposal_requirements"
    ADD CONSTRAINT "proposal_requirements_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "public"."proposals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."proposal_requirements"
    ADD CONSTRAINT "proposal_requirements_source_document_id_fkey" FOREIGN KEY ("source_document_id") REFERENCES "public"."documents"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."proposal_review_stages"
    ADD CONSTRAINT "proposal_review_stages_completed_by_fkey" FOREIGN KEY ("completed_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."proposal_review_stages"
    ADD CONSTRAINT "proposal_review_stages_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."proposal_review_stages"
    ADD CONSTRAINT "proposal_review_stages_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "public"."proposals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."proposal_reviews"
    ADD CONSTRAINT "proposal_reviews_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "public"."proposals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."proposal_reviews"
    ADD CONSTRAINT "proposal_reviews_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "public"."proposal_sections"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."proposal_sections"
    ADD CONSTRAINT "proposal_sections_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "public"."proposals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."proposal_versions"
    ADD CONSTRAINT "proposal_versions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."proposal_versions"
    ADD CONSTRAINT "proposal_versions_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "public"."proposals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."proposals"
    ADD CONSTRAINT "proposals_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."proposals"
    ADD CONSTRAINT "proposals_deal_outcome_set_by_fkey" FOREIGN KEY ("deal_outcome_set_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."proposals"
    ADD CONSTRAINT "proposals_intent_approved_by_fkey" FOREIGN KEY ("intent_approved_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."proposals"
    ADD CONSTRAINT "proposals_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."proposals"
    ADD CONSTRAINT "proposals_rfp_document_id_fkey" FOREIGN KEY ("rfp_document_id") REFERENCES "public"."documents"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."proposals"
    ADD CONSTRAINT "proposals_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id");



ALTER TABLE ONLY "public"."section_claims"
    ADD CONSTRAINT "section_claims_company_context_id_fkey" FOREIGN KEY ("company_context_id") REFERENCES "public"."company_context"("id");



ALTER TABLE ONLY "public"."section_claims"
    ADD CONSTRAINT "section_claims_evidence_id_fkey" FOREIGN KEY ("evidence_id") REFERENCES "public"."evidence_library"("id");



ALTER TABLE ONLY "public"."section_claims"
    ADD CONSTRAINT "section_claims_product_context_id_fkey" FOREIGN KEY ("product_context_id") REFERENCES "public"."product_contexts"("id");



ALTER TABLE ONLY "public"."section_claims"
    ADD CONSTRAINT "section_claims_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "public"."proposal_sections"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."section_claims"
    ADD CONSTRAINT "section_claims_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."section_feedback"
    ADD CONSTRAINT "section_feedback_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."section_feedback"
    ADD CONSTRAINT "section_feedback_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "public"."proposals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."section_feedback"
    ADD CONSTRAINT "section_feedback_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "public"."proposal_sections"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."section_outcome_mapping"
    ADD CONSTRAINT "section_outcome_mapping_confirmed_by_fkey" FOREIGN KEY ("confirmed_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."section_outcome_mapping"
    ADD CONSTRAINT "section_outcome_mapping_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "public"."proposal_sections"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."section_reviews"
    ADD CONSTRAINT "section_reviews_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."section_reviews"
    ADD CONSTRAINT "section_reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "public"."stage_reviewers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."section_reviews"
    ADD CONSTRAINT "section_reviews_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "public"."proposal_sections"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."section_reviews"
    ADD CONSTRAINT "section_reviews_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "public"."proposal_review_stages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."section_sources"
    ADD CONSTRAINT "section_sources_chunk_id_fkey" FOREIGN KEY ("chunk_id") REFERENCES "public"."document_chunks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."section_sources"
    ADD CONSTRAINT "section_sources_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "public"."proposal_sections"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."section_versions"
    ADD CONSTRAINT "section_versions_proposal_version_id_fkey" FOREIGN KEY ("proposal_version_id") REFERENCES "public"."proposal_versions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stage_reviewers"
    ADD CONSTRAINT "stage_reviewers_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stage_reviewers"
    ADD CONSTRAINT "stage_reviewers_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."stage_reviewers"
    ADD CONSTRAINT "stage_reviewers_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "public"."proposal_review_stages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_resume_document_id_fkey" FOREIGN KEY ("resume_document_id") REFERENCES "public"."documents"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."team_members"
    ADD CONSTRAINT "team_members_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."teams"
    ADD CONSTRAINT "teams_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."verification_log"
    ADD CONSTRAINT "verification_log_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."verification_log"
    ADD CONSTRAINT "verification_log_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "public"."proposals"("id") ON DELETE CASCADE;



CREATE POLICY "Service role can insert waitlist entries" ON "public"."waitlist" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "Service role has full access to waitlist" ON "public"."waitlist" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role only" ON "public"."allowed_emails" USING (false);



CREATE POLICY "Service role only" ON "public"."waitlist_signups" USING (false);



CREATE POLICY "Users can update their own reviews" ON "public"."proposal_reviews" FOR UPDATE USING (("reviewer_id" = "auth"."uid"()));



ALTER TABLE "public"."allowed_emails" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "chunks_select_org" ON "public"."document_chunks" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."documents" "d"
  WHERE (("d"."id" = "document_chunks"."document_id") AND ("d"."organization_id" IN ( SELECT "p"."organization_id"
           FROM "public"."profiles" "p"
          WHERE ("p"."id" = ( SELECT "auth"."uid"() AS "uid"))))))));



ALTER TABLE "public"."company_context" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "company_context_insert_org_admin" ON "public"."company_context" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" IN ( SELECT "p"."organization_id"
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("p"."role" = 'admin'::"text")))));



CREATE POLICY "company_context_select_org" ON "public"."company_context" FOR SELECT TO "authenticated" USING (("organization_id" IN ( SELECT "p"."organization_id"
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "company_context_update_org_admin" ON "public"."company_context" FOR UPDATE TO "authenticated" USING (("organization_id" IN ( SELECT "p"."organization_id"
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("p"."role" = 'admin'::"text")))));



ALTER TABLE "public"."deal_outcome_history" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "deal_outcome_history_insert_org" ON "public"."deal_outcome_history" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."proposals" "pr"
  WHERE (("pr"."id" = "deal_outcome_history"."proposal_id") AND ("pr"."organization_id" IN ( SELECT "p"."organization_id"
           FROM "public"."profiles" "p"
          WHERE (("p"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'manager'::"text"])))))))));



CREATE POLICY "deal_outcome_history_select_org" ON "public"."deal_outcome_history" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."proposals" "pr"
  WHERE (("pr"."id" = "deal_outcome_history"."proposal_id") AND ("pr"."organization_id" IN ( SELECT "p"."organization_id"
           FROM "public"."profiles" "p"
          WHERE ("p"."id" = ( SELECT "auth"."uid"() AS "uid"))))))));



ALTER TABLE "public"."document_chunks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."documents" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "documents_delete_org" ON "public"."documents" FOR DELETE TO "authenticated" USING ((("organization_id" IN ( SELECT "p"."organization_id"
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = ( SELECT "auth"."uid"() AS "uid")))) AND (("uploaded_by" = ( SELECT "auth"."uid"() AS "uid")) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p2"
  WHERE (("p2"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("p2"."role" = 'admin'::"text")))))));



CREATE POLICY "documents_insert_org" ON "public"."documents" FOR INSERT TO "authenticated" WITH CHECK ((("uploaded_by" = ( SELECT "auth"."uid"() AS "uid")) AND ("organization_id" IN ( SELECT "p"."organization_id"
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "documents_select_org" ON "public"."documents" FOR SELECT TO "authenticated" USING (("organization_id" IN ( SELECT "p"."organization_id"
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "documents_update_org" ON "public"."documents" FOR UPDATE TO "authenticated" USING ((("organization_id" IN ( SELECT "p"."organization_id"
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = ( SELECT "auth"."uid"() AS "uid")))) AND (("uploaded_by" = ( SELECT "auth"."uid"() AS "uid")) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p2"
  WHERE (("p2"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("p2"."role" = 'admin'::"text")))))));



ALTER TABLE "public"."evidence_library" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "evidence_library_insert_org" ON "public"."evidence_library" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" IN ( SELECT "p"."organization_id"
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'manager'::"text"]))))));



CREATE POLICY "evidence_library_select_org" ON "public"."evidence_library" FOR SELECT TO "authenticated" USING (("organization_id" IN ( SELECT "p"."organization_id"
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "evidence_library_update_org" ON "public"."evidence_library" FOR UPDATE TO "authenticated" USING (("organization_id" IN ( SELECT "p"."organization_id"
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'manager'::"text"]))))));



ALTER TABLE "public"."organizations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "organizations_select_own" ON "public"."organizations" FOR SELECT TO "authenticated" USING (("id" IN ( SELECT "p"."organization_id"
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "organizations_update_admin" ON "public"."organizations" FOR UPDATE TO "authenticated" USING (("id" IN ( SELECT "p"."organization_id"
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("p"."role" = 'admin'::"text")))));



ALTER TABLE "public"."product_contexts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "product_contexts_insert_org_admin" ON "public"."product_contexts" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" IN ( SELECT "p"."organization_id"
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("p"."role" = 'admin'::"text")))));



CREATE POLICY "product_contexts_select_org" ON "public"."product_contexts" FOR SELECT TO "authenticated" USING (("organization_id" IN ( SELECT "p"."organization_id"
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "product_contexts_update_org_admin" ON "public"."product_contexts" FOR UPDATE TO "authenticated" USING (("organization_id" IN ( SELECT "p"."organization_id"
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("p"."role" = 'admin'::"text")))));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_select_org" ON "public"."profiles" FOR SELECT TO "authenticated" USING ((("id" = "auth"."uid"()) OR ("organization_id" = "public"."get_user_organization_id"())));



CREATE POLICY "profiles_update_own" ON "public"."profiles" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



ALTER TABLE "public"."proposal_document_events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "proposal_document_events_insert_own_org" ON "public"."proposal_document_events" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" = ( SELECT "profiles"."organization_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));



CREATE POLICY "proposal_document_events_select_own_org" ON "public"."proposal_document_events" FOR SELECT TO "authenticated" USING (("organization_id" = ( SELECT "profiles"."organization_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));



ALTER TABLE "public"."proposal_documents" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "proposal_documents_delete_own_org" ON "public"."proposal_documents" FOR DELETE TO "authenticated" USING (("organization_id" = ( SELECT "profiles"."organization_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));



CREATE POLICY "proposal_documents_insert_own_org" ON "public"."proposal_documents" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" = ( SELECT "profiles"."organization_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));



CREATE POLICY "proposal_documents_select_own_org" ON "public"."proposal_documents" FOR SELECT TO "authenticated" USING (("organization_id" = ( SELECT "profiles"."organization_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));



CREATE POLICY "proposal_documents_update_own_org" ON "public"."proposal_documents" FOR UPDATE TO "authenticated" USING (("organization_id" = ( SELECT "profiles"."organization_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));



ALTER TABLE "public"."proposal_requirements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."proposal_review_stages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."proposal_reviews" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "proposal_reviews_insert_org" ON "public"."proposal_reviews" FOR INSERT TO "authenticated" WITH CHECK ((("reviewer_id" = ( SELECT "auth"."uid"() AS "uid")) AND (EXISTS ( SELECT 1
   FROM "public"."proposals" "pr"
  WHERE (("pr"."id" = "proposal_reviews"."proposal_id") AND ("pr"."organization_id" IN ( SELECT "p"."organization_id"
           FROM "public"."profiles" "p"
          WHERE ("p"."id" = ( SELECT "auth"."uid"() AS "uid")))))))));



CREATE POLICY "proposal_reviews_select_org" ON "public"."proposal_reviews" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."proposals" "pr"
  WHERE (("pr"."id" = "proposal_reviews"."proposal_id") AND ("pr"."organization_id" IN ( SELECT "p"."organization_id"
           FROM "public"."profiles" "p"
          WHERE ("p"."id" = ( SELECT "auth"."uid"() AS "uid"))))))));



ALTER TABLE "public"."proposal_sections" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."proposal_versions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "proposal_versions_insert_org" ON "public"."proposal_versions" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."proposals" "pr"
  WHERE (("pr"."id" = "proposal_versions"."proposal_id") AND ("pr"."organization_id" IN ( SELECT "p"."organization_id"
           FROM "public"."profiles" "p"
          WHERE ("p"."id" = ( SELECT "auth"."uid"() AS "uid"))))))));



CREATE POLICY "proposal_versions_select_org" ON "public"."proposal_versions" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."proposals" "pr"
  WHERE (("pr"."id" = "proposal_versions"."proposal_id") AND ("pr"."organization_id" IN ( SELECT "p"."organization_id"
           FROM "public"."profiles" "p"
          WHERE ("p"."id" = ( SELECT "auth"."uid"() AS "uid"))))))));



CREATE POLICY "proposal_versions_update_org" ON "public"."proposal_versions" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."proposals" "pr"
  WHERE (("pr"."id" = "proposal_versions"."proposal_id") AND ("pr"."organization_id" IN ( SELECT "p"."organization_id"
           FROM "public"."profiles" "p"
          WHERE ("p"."id" = ( SELECT "auth"."uid"() AS "uid"))))))));



ALTER TABLE "public"."proposals" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "proposals_delete_org" ON "public"."proposals" FOR DELETE TO "authenticated" USING ((("created_by" = ( SELECT "auth"."uid"() AS "uid")) OR ("organization_id" IN ( SELECT "p"."organization_id"
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("p"."role" = 'admin'::"text"))))));



CREATE POLICY "proposals_insert_org" ON "public"."proposals" FOR INSERT TO "authenticated" WITH CHECK ((("created_by" = ( SELECT "auth"."uid"() AS "uid")) AND ("organization_id" IN ( SELECT "p"."organization_id"
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = ( SELECT "auth"."uid"() AS "uid"))))));



CREATE POLICY "proposals_select_org" ON "public"."proposals" FOR SELECT TO "authenticated" USING (("organization_id" IN ( SELECT "p"."organization_id"
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "proposals_update_org" ON "public"."proposals" FOR UPDATE TO "authenticated" USING ((("organization_id" IN ( SELECT "p"."organization_id"
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'manager'::"text"]))))) OR ("created_by" = ( SELECT "auth"."uid"() AS "uid"))));



CREATE POLICY "requirements_delete_own_org" ON "public"."proposal_requirements" FOR DELETE TO "authenticated" USING (("organization_id" = ( SELECT "profiles"."organization_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));



CREATE POLICY "requirements_insert_own_org" ON "public"."proposal_requirements" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" = ( SELECT "profiles"."organization_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));



CREATE POLICY "requirements_select_own_org" ON "public"."proposal_requirements" FOR SELECT TO "authenticated" USING (("organization_id" = ( SELECT "profiles"."organization_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));



CREATE POLICY "requirements_update_own_org" ON "public"."proposal_requirements" FOR UPDATE TO "authenticated" USING (("organization_id" = ( SELECT "profiles"."organization_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));



CREATE POLICY "review_stages_delete_own_org" ON "public"."proposal_review_stages" FOR DELETE TO "authenticated" USING (("organization_id" = ( SELECT "profiles"."organization_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));



CREATE POLICY "review_stages_insert_own_org" ON "public"."proposal_review_stages" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" = ( SELECT "profiles"."organization_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));



CREATE POLICY "review_stages_select_own_org" ON "public"."proposal_review_stages" FOR SELECT TO "authenticated" USING (("organization_id" = ( SELECT "profiles"."organization_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));



CREATE POLICY "review_stages_update_own_org" ON "public"."proposal_review_stages" FOR UPDATE TO "authenticated" USING (("organization_id" = ( SELECT "profiles"."organization_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));



ALTER TABLE "public"."section_claims" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "section_claims_insert_org" ON "public"."section_claims" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."proposal_sections" "ps"
     JOIN "public"."proposals" "pr" ON (("pr"."id" = "ps"."proposal_id")))
  WHERE (("ps"."id" = "section_claims"."section_id") AND ("pr"."organization_id" IN ( SELECT "p"."organization_id"
           FROM "public"."profiles" "p"
          WHERE ("p"."id" = ( SELECT "auth"."uid"() AS "uid"))))))));



CREATE POLICY "section_claims_select_org" ON "public"."section_claims" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."proposal_sections" "ps"
     JOIN "public"."proposals" "pr" ON (("pr"."id" = "ps"."proposal_id")))
  WHERE (("ps"."id" = "section_claims"."section_id") AND ("pr"."organization_id" IN ( SELECT "p"."organization_id"
           FROM "public"."profiles" "p"
          WHERE ("p"."id" = ( SELECT "auth"."uid"() AS "uid"))))))));



CREATE POLICY "section_claims_update_org" ON "public"."section_claims" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."proposal_sections" "ps"
     JOIN "public"."proposals" "pr" ON (("pr"."id" = "ps"."proposal_id")))
  WHERE (("ps"."id" = "section_claims"."section_id") AND ("pr"."organization_id" IN ( SELECT "p"."organization_id"
           FROM "public"."profiles" "p"
          WHERE (("p"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'manager'::"text"])))))))));



ALTER TABLE "public"."section_feedback" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "section_feedback_insert_org" ON "public"."section_feedback" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."proposals" "pr"
  WHERE (("pr"."id" = "section_feedback"."proposal_id") AND ("pr"."organization_id" IN ( SELECT "p"."organization_id"
           FROM "public"."profiles" "p"
          WHERE ("p"."id" = ( SELECT "auth"."uid"() AS "uid"))))))));



CREATE POLICY "section_feedback_select_org" ON "public"."section_feedback" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."proposals" "pr"
  WHERE (("pr"."id" = "section_feedback"."proposal_id") AND ("pr"."organization_id" IN ( SELECT "p"."organization_id"
           FROM "public"."profiles" "p"
          WHERE ("p"."id" = ( SELECT "auth"."uid"() AS "uid"))))))));



ALTER TABLE "public"."section_outcome_mapping" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "section_outcome_mapping_all_org" ON "public"."section_outcome_mapping" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."proposal_sections" "ps"
     JOIN "public"."proposals" "pr" ON (("pr"."id" = "ps"."proposal_id")))
  WHERE (("ps"."id" = "section_outcome_mapping"."section_id") AND ("pr"."organization_id" IN ( SELECT "p"."organization_id"
           FROM "public"."profiles" "p"
          WHERE ("p"."id" = ( SELECT "auth"."uid"() AS "uid"))))))));



CREATE POLICY "section_outcome_mapping_select_org" ON "public"."section_outcome_mapping" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."proposal_sections" "ps"
     JOIN "public"."proposals" "pr" ON (("pr"."id" = "ps"."proposal_id")))
  WHERE (("ps"."id" = "section_outcome_mapping"."section_id") AND ("pr"."organization_id" IN ( SELECT "p"."organization_id"
           FROM "public"."profiles" "p"
          WHERE ("p"."id" = ( SELECT "auth"."uid"() AS "uid"))))))));



ALTER TABLE "public"."section_reviews" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "section_reviews_delete_own_org" ON "public"."section_reviews" FOR DELETE TO "authenticated" USING (("organization_id" = ( SELECT "profiles"."organization_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));



CREATE POLICY "section_reviews_insert_own_org" ON "public"."section_reviews" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" = ( SELECT "profiles"."organization_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));



CREATE POLICY "section_reviews_select_own_org" ON "public"."section_reviews" FOR SELECT TO "authenticated" USING (("organization_id" = ( SELECT "profiles"."organization_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));



CREATE POLICY "section_reviews_update_own_org" ON "public"."section_reviews" FOR UPDATE TO "authenticated" USING (("organization_id" = ( SELECT "profiles"."organization_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));



ALTER TABLE "public"."section_sources" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "section_sources_select_org" ON "public"."section_sources" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."proposal_sections" "ps"
     JOIN "public"."proposals" "pr" ON (("pr"."id" = "ps"."proposal_id")))
  WHERE (("ps"."id" = "section_sources"."section_id") AND ("pr"."organization_id" IN ( SELECT "p"."organization_id"
           FROM "public"."profiles" "p"
          WHERE ("p"."id" = ( SELECT "auth"."uid"() AS "uid"))))))));



ALTER TABLE "public"."section_versions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "section_versions_insert_org" ON "public"."section_versions" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."proposal_versions" "pv"
     JOIN "public"."proposals" "pr" ON (("pr"."id" = "pv"."proposal_id")))
  WHERE (("pv"."id" = "section_versions"."proposal_version_id") AND ("pr"."organization_id" IN ( SELECT "p"."organization_id"
           FROM "public"."profiles" "p"
          WHERE ("p"."id" = ( SELECT "auth"."uid"() AS "uid"))))))));



CREATE POLICY "section_versions_select_org" ON "public"."section_versions" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."proposal_versions" "pv"
     JOIN "public"."proposals" "pr" ON (("pr"."id" = "pv"."proposal_id")))
  WHERE (("pv"."id" = "section_versions"."proposal_version_id") AND ("pr"."organization_id" IN ( SELECT "p"."organization_id"
           FROM "public"."profiles" "p"
          WHERE ("p"."id" = ( SELECT "auth"."uid"() AS "uid"))))))));



CREATE POLICY "sections_select_org" ON "public"."proposal_sections" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."proposals" "pr"
  WHERE (("pr"."id" = "proposal_sections"."proposal_id") AND ("pr"."organization_id" IN ( SELECT "p"."organization_id"
           FROM "public"."profiles" "p"
          WHERE ("p"."id" = ( SELECT "auth"."uid"() AS "uid"))))))));



CREATE POLICY "sections_update_org" ON "public"."proposal_sections" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."proposals" "pr"
  WHERE (("pr"."id" = "proposal_sections"."proposal_id") AND ("pr"."organization_id" IN ( SELECT "p"."organization_id"
           FROM "public"."profiles" "p"
          WHERE ("p"."id" = ( SELECT "auth"."uid"() AS "uid"))))))));



ALTER TABLE "public"."stage_reviewers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "stage_reviewers_delete_own_org" ON "public"."stage_reviewers" FOR DELETE TO "authenticated" USING (("organization_id" = ( SELECT "profiles"."organization_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));



CREATE POLICY "stage_reviewers_insert_own_org" ON "public"."stage_reviewers" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" = ( SELECT "profiles"."organization_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));



CREATE POLICY "stage_reviewers_select_own_org" ON "public"."stage_reviewers" FOR SELECT TO "authenticated" USING (("organization_id" = ( SELECT "profiles"."organization_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));



CREATE POLICY "stage_reviewers_update_own_org" ON "public"."stage_reviewers" FOR UPDATE TO "authenticated" USING (("organization_id" = ( SELECT "profiles"."organization_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));



ALTER TABLE "public"."team_members" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "team_members_delete_org_admin" ON "public"."team_members" FOR DELETE TO "authenticated" USING (("organization_id" IN ( SELECT "p"."organization_id"
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("p"."role" = 'admin'::"text")))));



CREATE POLICY "team_members_insert_org" ON "public"."team_members" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" IN ( SELECT "p"."organization_id"
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'manager'::"text"]))))));



CREATE POLICY "team_members_select_org" ON "public"."team_members" FOR SELECT TO "authenticated" USING (("organization_id" IN ( SELECT "p"."organization_id"
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "team_members_update_org" ON "public"."team_members" FOR UPDATE TO "authenticated" USING (("organization_id" IN ( SELECT "p"."organization_id"
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("p"."role" = ANY (ARRAY['admin'::"text", 'manager'::"text"]))))));



ALTER TABLE "public"."teams" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "teams_insert_org_admin" ON "public"."teams" FOR INSERT TO "authenticated" WITH CHECK (("organization_id" IN ( SELECT "p"."organization_id"
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("p"."role" = 'admin'::"text")))));



CREATE POLICY "teams_select_org" ON "public"."teams" FOR SELECT TO "authenticated" USING (("organization_id" IN ( SELECT "p"."organization_id"
   FROM "public"."profiles" "p"
  WHERE ("p"."id" = ( SELECT "auth"."uid"() AS "uid")))));



CREATE POLICY "teams_update_org_admin" ON "public"."teams" FOR UPDATE TO "authenticated" USING (("organization_id" IN ( SELECT "p"."organization_id"
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = ( SELECT "auth"."uid"() AS "uid")) AND ("p"."role" = 'admin'::"text")))));



ALTER TABLE "public"."verification_log" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "verification_log_insert_org" ON "public"."verification_log" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."proposals" "pr"
  WHERE (("pr"."id" = "verification_log"."proposal_id") AND ("pr"."organization_id" IN ( SELECT "p"."organization_id"
           FROM "public"."profiles" "p"
          WHERE ("p"."id" = ( SELECT "auth"."uid"() AS "uid"))))))));



CREATE POLICY "verification_log_select_org" ON "public"."verification_log" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."proposals" "pr"
  WHERE (("pr"."id" = "verification_log"."proposal_id") AND ("pr"."organization_id" IN ( SELECT "p"."organization_id"
           FROM "public"."profiles" "p"
          WHERE ("p"."id" = ( SELECT "auth"."uid"() AS "uid"))))))));



ALTER TABLE "public"."waitlist" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."waitlist_signups" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";





GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."check_plan_limit"("limit_key" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."check_plan_limit"("limit_key" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_plan_limit"("limit_key" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_proposal_version"("p_proposal_id" "uuid", "p_trigger_event" "text", "p_change_summary" "text", "p_label" "text", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."create_proposal_version"("p_proposal_id" "uuid", "p_trigger_event" "text", "p_change_summary" "text", "p_label" "text", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_proposal_version"("p_proposal_id" "uuid", "p_trigger_event" "text", "p_change_summary" "text", "p_label" "text", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_org_slug"("org_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_org_slug"("org_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_org_slug"("org_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_current_organization_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_current_organization_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_current_organization_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_next_version_number"("p_proposal_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_next_version_number"("p_proposal_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_next_version_number"("p_proposal_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_outcome_summary"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_outcome_summary"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_outcome_summary"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_proposal_verification_summary"("p_proposal_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_proposal_verification_summary"("p_proposal_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_proposal_verification_summary"("p_proposal_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_organization_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_organization_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_organization_id"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";









GRANT ALL ON FUNCTION "public"."increment_usage"("limit_key" "text", "amount" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."increment_usage"("limit_key" "text", "amount" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_usage"("limit_key" "text", "amount" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_usage_by_org"("org_id" "uuid", "usage_key" "text", "amount" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."increment_usage_by_org"("org_id" "uuid", "usage_key" "text", "amount" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_usage_by_org"("org_id" "uuid", "usage_key" "text", "amount" integer) TO "service_role";









GRANT ALL ON FUNCTION "public"."restore_proposal_version"("p_version_id" "uuid", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."restore_proposal_version"("p_version_id" "uuid", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."restore_proposal_version"("p_version_id" "uuid", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_document_chunk_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_document_chunk_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_document_chunk_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_section_reviews_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_section_reviews_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_section_reviews_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at"() TO "service_role";



GRANT ALL ON TABLE "public"."allowed_emails" TO "anon";
GRANT ALL ON TABLE "public"."allowed_emails" TO "authenticated";
GRANT ALL ON TABLE "public"."allowed_emails" TO "service_role";



GRANT ALL ON TABLE "public"."company_context" TO "anon";
GRANT ALL ON TABLE "public"."company_context" TO "authenticated";
GRANT ALL ON TABLE "public"."company_context" TO "service_role";



GRANT ALL ON TABLE "public"."deal_outcome_history" TO "anon";
GRANT ALL ON TABLE "public"."deal_outcome_history" TO "authenticated";
GRANT ALL ON TABLE "public"."deal_outcome_history" TO "service_role";



GRANT ALL ON TABLE "public"."document_chunks" TO "anon";
GRANT ALL ON TABLE "public"."document_chunks" TO "authenticated";
GRANT ALL ON TABLE "public"."document_chunks" TO "service_role";



GRANT ALL ON TABLE "public"."documents" TO "anon";
GRANT ALL ON TABLE "public"."documents" TO "authenticated";
GRANT ALL ON TABLE "public"."documents" TO "service_role";



GRANT ALL ON TABLE "public"."evidence_library" TO "anon";
GRANT ALL ON TABLE "public"."evidence_library" TO "authenticated";
GRANT ALL ON TABLE "public"."evidence_library" TO "service_role";



GRANT ALL ON TABLE "public"."organizations" TO "anon";
GRANT ALL ON TABLE "public"."organizations" TO "authenticated";
GRANT ALL ON TABLE "public"."organizations" TO "service_role";



GRANT ALL ON TABLE "public"."product_contexts" TO "anon";
GRANT ALL ON TABLE "public"."product_contexts" TO "authenticated";
GRANT ALL ON TABLE "public"."product_contexts" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."proposal_document_events" TO "anon";
GRANT ALL ON TABLE "public"."proposal_document_events" TO "authenticated";
GRANT ALL ON TABLE "public"."proposal_document_events" TO "service_role";



GRANT ALL ON TABLE "public"."proposal_documents" TO "anon";
GRANT ALL ON TABLE "public"."proposal_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."proposal_documents" TO "service_role";



GRANT ALL ON TABLE "public"."proposals" TO "anon";
GRANT ALL ON TABLE "public"."proposals" TO "authenticated";
GRANT ALL ON TABLE "public"."proposals" TO "service_role";



GRANT ALL ON TABLE "public"."proposal_outcome_stats" TO "anon";
GRANT ALL ON TABLE "public"."proposal_outcome_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."proposal_outcome_stats" TO "service_role";



GRANT ALL ON TABLE "public"."proposal_requirements" TO "anon";
GRANT ALL ON TABLE "public"."proposal_requirements" TO "authenticated";
GRANT ALL ON TABLE "public"."proposal_requirements" TO "service_role";



GRANT ALL ON TABLE "public"."proposal_review_stages" TO "anon";
GRANT ALL ON TABLE "public"."proposal_review_stages" TO "authenticated";
GRANT ALL ON TABLE "public"."proposal_review_stages" TO "service_role";



GRANT ALL ON TABLE "public"."proposal_reviews" TO "anon";
GRANT ALL ON TABLE "public"."proposal_reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."proposal_reviews" TO "service_role";



GRANT ALL ON TABLE "public"."proposal_sections" TO "anon";
GRANT ALL ON TABLE "public"."proposal_sections" TO "authenticated";
GRANT ALL ON TABLE "public"."proposal_sections" TO "service_role";



GRANT ALL ON TABLE "public"."proposal_versions" TO "anon";
GRANT ALL ON TABLE "public"."proposal_versions" TO "authenticated";
GRANT ALL ON TABLE "public"."proposal_versions" TO "service_role";



GRANT ALL ON TABLE "public"."proposal_versions_summary" TO "anon";
GRANT ALL ON TABLE "public"."proposal_versions_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."proposal_versions_summary" TO "service_role";



GRANT ALL ON TABLE "public"."section_claims" TO "anon";
GRANT ALL ON TABLE "public"."section_claims" TO "authenticated";
GRANT ALL ON TABLE "public"."section_claims" TO "service_role";



GRANT ALL ON TABLE "public"."section_feedback" TO "anon";
GRANT ALL ON TABLE "public"."section_feedback" TO "authenticated";
GRANT ALL ON TABLE "public"."section_feedback" TO "service_role";



GRANT ALL ON TABLE "public"."section_outcome_mapping" TO "anon";
GRANT ALL ON TABLE "public"."section_outcome_mapping" TO "authenticated";
GRANT ALL ON TABLE "public"."section_outcome_mapping" TO "service_role";



GRANT ALL ON TABLE "public"."section_reviews" TO "anon";
GRANT ALL ON TABLE "public"."section_reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."section_reviews" TO "service_role";



GRANT ALL ON TABLE "public"."section_sources" TO "anon";
GRANT ALL ON TABLE "public"."section_sources" TO "authenticated";
GRANT ALL ON TABLE "public"."section_sources" TO "service_role";



GRANT ALL ON TABLE "public"."section_versions" TO "anon";
GRANT ALL ON TABLE "public"."section_versions" TO "authenticated";
GRANT ALL ON TABLE "public"."section_versions" TO "service_role";



GRANT ALL ON TABLE "public"."stage_reviewers" TO "anon";
GRANT ALL ON TABLE "public"."stage_reviewers" TO "authenticated";
GRANT ALL ON TABLE "public"."stage_reviewers" TO "service_role";



GRANT ALL ON TABLE "public"."team_members" TO "anon";
GRANT ALL ON TABLE "public"."team_members" TO "authenticated";
GRANT ALL ON TABLE "public"."team_members" TO "service_role";



GRANT ALL ON TABLE "public"."teams" TO "anon";
GRANT ALL ON TABLE "public"."teams" TO "authenticated";
GRANT ALL ON TABLE "public"."teams" TO "service_role";



GRANT ALL ON TABLE "public"."verification_log" TO "anon";
GRANT ALL ON TABLE "public"."verification_log" TO "authenticated";
GRANT ALL ON TABLE "public"."verification_log" TO "service_role";



GRANT ALL ON TABLE "public"."waitlist" TO "anon";
GRANT ALL ON TABLE "public"."waitlist" TO "authenticated";
GRANT ALL ON TABLE "public"."waitlist" TO "service_role";



GRANT ALL ON TABLE "public"."waitlist_signups" TO "anon";
GRANT ALL ON TABLE "public"."waitlist_signups" TO "authenticated";
GRANT ALL ON TABLE "public"."waitlist_signups" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";


-- ============================================================
-- STORAGE BUCKETS + POLICIES
-- ============================================================
-- Storage schema is managed by Supabase and not included in
-- pg_dump of public schema. Bucket creation and policies must
-- be applied separately.
-- ============================================================

-- -----------------------------------------------
-- organization-assets bucket (public, for logos)
-- -----------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('organization-assets', 'organization-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access for serving assets (logos, etc.)
CREATE POLICY "Public read access for org assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'organization-assets');

-- INSERT: path must start with user's org_id
CREATE POLICY "org_assets_insert_scoped" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'organization-assets'
    AND (storage.foldername(name))[1] = (SELECT public.get_user_organization_id()::text)
  );

-- UPDATE: path must be within user's org_id folder
CREATE POLICY "org_assets_update_scoped" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'organization-assets'
    AND (storage.foldername(name))[1] = (SELECT public.get_user_organization_id()::text)
  );

-- DELETE: path must be within user's org_id folder
CREATE POLICY "org_assets_delete_scoped" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'organization-assets'
    AND (storage.foldername(name))[1] = (SELECT public.get_user_organization_id()::text)
  );

-- -----------------------------------------------
-- exported-proposals bucket (private, signed URLs)
-- -----------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('exported-proposals', 'exported-proposals', false)
ON CONFLICT (id) DO NOTHING;

-- INSERT: path must start with user's org_id
CREATE POLICY "exported_proposals_insert_scoped" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'exported-proposals'
    AND (storage.foldername(name))[1] = (SELECT public.get_user_organization_id()::text)
  );

-- SELECT: path must be within user's org_id folder
CREATE POLICY "exported_proposals_select_scoped" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'exported-proposals'
    AND (storage.foldername(name))[1] = (SELECT public.get_user_organization_id()::text)
  );

-- Service role full access for admin client signed URL generation
CREATE POLICY "service_role_all_exported_proposals" ON storage.objects
  FOR ALL TO service_role
  USING (bucket_id = 'exported-proposals');

