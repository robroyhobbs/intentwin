-- Atomic increment_usage_by_org: accepts org_id so it works with adminClient
-- which bypasses RLS (no get_current_organization_id() available).
-- Uses jsonb_set with coalesce for safe atomic increment.
create or replace function increment_usage_by_org(
  org_id uuid,
  usage_key text,
  amount int default 1
)
returns void as $$
begin
  update public.organizations
  set usage_current_period = jsonb_set(
    coalesce(usage_current_period, '{}'::jsonb),
    array[usage_key],
    to_jsonb(coalesce((usage_current_period->>usage_key)::int, 0) + amount)
  )
  where id = org_id;
end;
$$ language plpgsql security definer;
