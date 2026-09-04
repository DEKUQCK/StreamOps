-- A user with a pending invite isn't a member yet, so RLS on
-- `organizations` correctly hides the org name from a direct embedded
-- select (organizations(name) came back null, crashing the onboarding
-- page). This RPC lets them see just the org name for invites addressed
-- to their own verified auth email - enough to decide whether to join,
-- without widening the organizations table's RLS.
create or replace function public.get_my_pending_invites()
returns jsonb
language sql
security definer
set search_path = ''
stable
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', oi.id,
    'organization_name', o.name
  ) order by oi.created_at), '[]'::jsonb)
  from public.organization_invites oi
  join public.organizations o on o.id = oi.organization_id
  where oi.accepted_at is null
    and lower(oi.email) = lower(auth.jwt() ->> 'email');
$$;
revoke execute on function public.get_my_pending_invites() from public, anon;
grant execute on function public.get_my_pending_invites() to authenticated;
