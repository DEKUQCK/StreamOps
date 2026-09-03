-- Team access: invite a colleague by email, they accept on first login.
-- No transactional email system is built here - the organizer tells the
-- colleague out of band to log in with that email; the invite is just a
-- pending allowlist entry matched against their auth email on accept.

create table public.organization_invites (
  id bigint generated always as identity primary key,
  organization_id bigint not null references public.organizations (id) on delete cascade,
  email text not null,
  invited_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);
create index organization_invites_organization_id_idx on public.organization_invites (organization_id);
create index organization_invites_email_idx on public.organization_invites (lower(email));

alter table public.organization_invites enable row level security;

-- Org members can see/manage invites for their own org.
create policy organization_invites_member_select on public.organization_invites
  for select to authenticated
  using ((select private.is_org_member(organization_id)));

create policy organization_invites_member_insert on public.organization_invites
  for insert to authenticated
  with check ((select private.is_org_member(organization_id)));

create policy organization_invites_member_delete on public.organization_invites
  for delete to authenticated
  using ((select private.is_org_member(organization_id)));

-- An invitee can also see invites addressed to their own login email,
-- even before they are a member of that org (that's the whole point).
create policy organization_invites_own_email_select on public.organization_invites
  for select to authenticated
  using (lower(email) = lower((select auth.jwt() ->> 'email')));

-- Members can remove a teammate (or leave) from their organization.
create policy organization_members_member_delete on public.organization_members
  for delete to authenticated
  using ((select private.is_org_member(organization_id)));

create or replace function public.accept_organization_invite(p_invite_id bigint)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org_id bigint;
  v_email text;
begin
  v_email := auth.jwt() ->> 'email';

  select organization_id into v_org_id
  from public.organization_invites
  where id = p_invite_id
    and accepted_at is null
    and lower(email) = lower(v_email);

  if v_org_id is null then
    raise exception 'invite not found or already used';
  end if;

  insert into public.organization_members (organization_id, user_id, role)
  values (v_org_id, auth.uid(), 'organizer')
  on conflict do nothing;

  update public.organization_invites set accepted_at = now() where id = p_invite_id;

  return v_org_id;
end;
$$;
revoke execute on function public.accept_organization_invite(bigint) from public, anon;
grant execute on function public.accept_organization_invite(bigint) to authenticated;

-- Lets org members see each other's email without exposing auth.users.
create or replace function public.get_organization_members(p_organization_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = ''
stable
as $$
begin
  if not private.is_org_member(p_organization_id) then
    raise exception 'not a member of this organization';
  end if;

  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'user_id', m.user_id,
      'email', u.email,
      'role', m.role,
      'created_at', m.created_at
    ) order by m.created_at)
    from public.organization_members m
    join auth.users u on u.id = m.user_id
    where m.organization_id = p_organization_id
  ), '[]'::jsonb);
end;
$$;
revoke execute on function public.get_organization_members(bigint) from public, anon;
grant execute on function public.get_organization_members(bigint) to authenticated;
