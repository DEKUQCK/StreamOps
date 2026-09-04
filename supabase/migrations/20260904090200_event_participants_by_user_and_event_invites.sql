-- Participants are now real users (auth.users), not org-scoped roster
-- entries - this is what makes cross-org invites and solo-organized
-- events possible. Magic-link tokens are no longer needed: access is via
-- normal login + RLS keyed on auth.uid().
alter table public.event_participants drop column participant_id;
alter table public.event_participants drop column magic_link_token;
alter table public.event_participants
  add column participant_user_id uuid not null references auth.users (id) on delete cascade;
create index event_participants_participant_user_id_idx on public.event_participants (participant_user_id);
alter table public.event_participants
  add constraint event_participants_event_participant_unique unique (event_id, participant_user_id);

drop policy event_participants_member_all on public.event_participants;

-- Organizers manage the full row; a participant can see their own row and
-- update just their own RSVP (not slot times, which stay organizer-only).
create policy event_participants_organizer_all on public.event_participants
  for all to authenticated
  using (exists (
    select 1 from public.events e
    where e.id = event_id
      and ((e.organization_id is not null and private.is_org_member(e.organization_id))
        or e.organizer_user_id = (select auth.uid()))
  ))
  with check (exists (
    select 1 from public.events e
    where e.id = event_id
      and ((e.organization_id is not null and private.is_org_member(e.organization_id))
        or e.organizer_user_id = (select auth.uid()))
  ));

create policy event_participants_self_select on public.event_participants
  for select to authenticated
  using (participant_user_id = (select auth.uid()));

create policy event_participants_self_update_rsvp on public.event_participants
  for update to authenticated
  using (participant_user_id = (select auth.uid()))
  with check (participant_user_id = (select auth.uid()));

-- Invite anyone by email to a specific event, whether or not they have an
-- account yet, regardless of organization. Mirrors the
-- organization_invites/accept_organization_invite pattern.
create table public.event_invites (
  id bigint generated always as identity primary key,
  event_id bigint not null references public.events (id) on delete cascade,
  email text not null,
  invited_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);
create index event_invites_event_id_idx on public.event_invites (event_id);
create index event_invites_email_idx on public.event_invites (lower(email));

alter table public.event_invites enable row level security;

create policy event_invites_organizer_all on public.event_invites
  for all to authenticated
  using (exists (
    select 1 from public.events e
    where e.id = event_id
      and ((e.organization_id is not null and private.is_org_member(e.organization_id))
        or e.organizer_user_id = (select auth.uid()))
  ))
  with check (exists (
    select 1 from public.events e
    where e.id = event_id
      and ((e.organization_id is not null and private.is_org_member(e.organization_id))
        or e.organizer_user_id = (select auth.uid()))
  ));

create policy event_invites_own_email_select on public.event_invites
  for select to authenticated
  using (lower(email) = lower((select auth.jwt() ->> 'email')));

create or replace function public.accept_event_invite(p_invite_id bigint)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event_id bigint;
  v_email text;
begin
  v_email := auth.jwt() ->> 'email';

  select event_id into v_event_id
  from public.event_invites
  where id = p_invite_id
    and accepted_at is null
    and lower(email) = lower(v_email);

  if v_event_id is null then
    raise exception 'invite not found or already used';
  end if;

  insert into public.event_participants (event_id, participant_user_id)
  values (v_event_id, auth.uid())
  on conflict (event_id, participant_user_id) do nothing;

  update public.event_invites set accepted_at = now() where id = p_invite_id;

  return v_event_id;
end;
$$;
revoke execute on function public.accept_event_invite(bigint) from public, anon;
grant execute on function public.accept_event_invite(bigint) to authenticated;

create or replace function public.get_my_pending_event_invites()
returns jsonb
language sql
security definer
set search_path = ''
stable
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', ei.id,
    'event_id', ei.event_id,
    'event_name', e.name
  ) order by ei.created_at), '[]'::jsonb)
  from public.event_invites ei
  join public.events e on e.id = ei.event_id
  where ei.accepted_at is null
    and lower(ei.email) = lower(auth.jwt() ->> 'email');
$$;
revoke execute on function public.get_my_pending_event_invites() from public, anon;
grant execute on function public.get_my_pending_event_invites() to authenticated;
