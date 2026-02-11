-- Fix SECURITY DEFINER issues flagged by Supabase security lint
-- Issue: View proposal_outcome_stats runs as view owner, bypassing caller's RLS
-- Issue: Function get_outcome_summary() is SECURITY DEFINER and queries proposals
--        without org/user filtering (cross-tenant data leak)

-- ============================================================
-- 1. Recreate view with SECURITY INVOKER
-- ============================================================
DROP VIEW IF EXISTS public.proposal_outcome_stats;

CREATE VIEW public.proposal_outcome_stats
WITH (security_invoker = true)
AS
SELECT
  date_trunc('month', p.created_at) AS month,
  date_trunc('quarter', p.created_at) AS quarter,
  date_trunc('year', p.created_at) AS year,
  (p.intake_data->>'opportunity_type') AS opportunity_type,
  (p.intake_data->>'client_industry') AS client_industry,
  (p.intake_data->>'client_size') AS client_size,
  count(*) AS total_proposals,
  count(*) FILTER (WHERE p.deal_outcome = 'won') AS won,
  count(*) FILTER (WHERE p.deal_outcome = 'lost') AS lost,
  count(*) FILTER (WHERE p.deal_outcome = 'no_decision') AS no_decision,
  count(*) FILTER (WHERE p.deal_outcome = 'pending') AS pending,
  count(*) FILTER (WHERE p.deal_outcome = 'withdrawn') AS withdrawn,
  CASE
    WHEN count(*) FILTER (WHERE p.deal_outcome IN ('won', 'lost')) > 0
    THEN round(
      (count(*) FILTER (WHERE p.deal_outcome = 'won')::numeric /
       count(*) FILTER (WHERE p.deal_outcome IN ('won', 'lost'))::numeric) * 100,
      1
    )
    ELSE NULL
  END AS win_rate_percent,
  sum(p.deal_value) FILTER (WHERE p.deal_outcome = 'won') AS total_won_value,
  avg(p.deal_value) FILTER (WHERE p.deal_outcome = 'won') AS avg_won_value,
  mode() WITHIN GROUP (ORDER BY p.loss_reason_category) FILTER (WHERE p.deal_outcome = 'lost') AS top_loss_reason
FROM public.proposals p
WHERE p.status IN ('exported', 'final')
GROUP BY
  date_trunc('month', p.created_at),
  date_trunc('quarter', p.created_at),
  date_trunc('year', p.created_at),
  (p.intake_data->>'opportunity_type'),
  (p.intake_data->>'client_industry'),
  (p.intake_data->>'client_size');

COMMENT ON VIEW public.proposal_outcome_stats IS
  'Aggregate outcome stats for analytics. Uses SECURITY INVOKER to respect caller RLS policies.';

-- ============================================================
-- 2. Replace get_outcome_summary() with SECURITY INVOKER
-- ============================================================
-- The function previously ran as definer and queried proposals
-- without org/user filtering. Now it uses invoker permissions
-- so RLS on the proposals table enforces access control.

CREATE OR REPLACE FUNCTION public.get_outcome_summary()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
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

COMMENT ON FUNCTION public.get_outcome_summary IS
  'Returns win/loss summary for dashboard. Uses SECURITY INVOKER so RLS on proposals table controls data access per user/org.';
