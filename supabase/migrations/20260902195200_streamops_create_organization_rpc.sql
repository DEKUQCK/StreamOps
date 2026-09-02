-- Lets a newly signed-in organizer self-provision their first organization
-- without needing an open INSERT policy on organization_members (which
-- would otherwise let any authenticated user join any org).
create or replace function public.create_organization(p_name text)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org_id bigint;
begin
  insert into public.organizations (name) values (p_name)
  returning id into v_org_id;

  insert into public.organization_members (organization_id, user_id, role)
  values (v_org_id, auth.uid(), 'owner');

  return v_org_id;
end;
$$;
revoke execute on function public.create_organization(text) from public, anon;
grant execute on function public.create_organization(text) to authenticated;
