-- StreamOps MVP schema
-- Organizer-facing tables are protected by RLS via organization membership.
-- Participants have no Supabase auth account; they are granted access only
-- through security-definer RPCs keyed by their per-event magic link token,
-- so no table is ever readable directly by the `anon` role.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

create table public.organizations (
  id bigint generated always as identity primary key,
  name text not null,
  created_at timestamptz not null default now()
);

create table public.organization_members (
  organization_id bigint not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'organizer' check (role in ('owner', 'organizer')),
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);
create index organization_members_user_id_idx on public.organization_members (user_id);

create table public.events (
  id bigint generated always as identity primary key,
  organization_id bigint not null references public.organizations (id) on delete cascade,
  name text not null,
  description text,
  starts_at timestamptz,
  ends_at timestamptz,
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'live', 'completed', 'cancelled')),
  created_at timestamptz not null default now()
);
create index events_organization_id_idx on public.events (organization_id);

-- Reusable roster of streamers per agency, independent of any single event.
create table public.participants (
  id bigint generated always as identity primary key,
  organization_id bigint not null references public.organizations (id) on delete cascade,
  display_name text not null,
  email text,
  twitch_username text,
  discord_user_id text,
  created_at timestamptz not null default now()
);
create index participants_organization_id_idx on public.participants (organization_id);

-- Links a participant to a specific event: RSVP/slot booking + the
-- magic-link token that grants that one participant access to their own
-- portal (assets + checklist status) without a login.
create table public.event_participants (
  id bigint generated always as identity primary key,
  event_id bigint not null references public.events (id) on delete cascade,
  participant_id bigint not null references public.participants (id) on delete cascade,
  rsvp_status text not null default 'invited' check (rsvp_status in ('invited', 'confirmed', 'declined', 'cancelled')),
  slot_starts_at timestamptz,
  slot_ends_at timestamptz,
  magic_link_token uuid not null default gen_random_uuid() unique,
  created_at timestamptz not null default now(),
  unique (event_id, participant_id)
);
create index event_participants_event_id_idx on public.event_participants (event_id);
create index event_participants_participant_id_idx on public.event_participants (participant_id);

-- The "Asset-Tresor": individual overlays, stream titles, rules and
-- credentials handed to one participant for one event. `is_sensitive`
-- drives Stream-Proof masking in the UI (server IPs, passwords, invites).
create table public.event_assets (
  id bigint generated always as identity primary key,
  event_participant_id bigint not null references public.event_participants (id) on delete cascade,
  asset_type text not null check (asset_type in ('overlay_url', 'stream_title', 'rules', 'server_ip', 'server_password', 'discord_invite', 'other')),
  label text not null,
  value text not null,
  is_sensitive boolean not null default false,
  created_at timestamptz not null default now()
);
create index event_assets_event_participant_id_idx on public.event_assets (event_participant_id);

-- Sponsor obligations defined once per event (e.g. "run !sponsor at 20:00").
create table public.sponsor_checklist_items (
  id bigint generated always as identity primary key,
  event_id bigint not null references public.events (id) on delete cascade,
  sponsor_name text not null,
  description text not null,
  due_at timestamptz,
  created_at timestamptz not null default now()
);
create index sponsor_checklist_items_event_id_idx on public.sponsor_checklist_items (event_id);

-- Per-participant completion status for each sponsor obligation.
create table public.event_participant_checklist_status (
  id bigint generated always as identity primary key,
  event_participant_id bigint not null references public.event_participants (id) on delete cascade,
  checklist_item_id bigint not null references public.sponsor_checklist_items (id) on delete cascade,
  completed_at timestamptz,
  unique (event_participant_id, checklist_item_id)
);
create index event_participant_checklist_status_event_participant_id_idx on public.event_participant_checklist_status (event_participant_id);
create index event_participant_checklist_status_checklist_item_id_idx on public.event_participant_checklist_status (checklist_item_id);

-- ---------------------------------------------------------------------
-- Row Level Security: organizer access, scoped by organization membership
-- ---------------------------------------------------------------------

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.events enable row level security;
alter table public.participants enable row level security;
alter table public.event_participants enable row level security;
alter table public.event_assets enable row level security;
alter table public.sponsor_checklist_items enable row level security;
alter table public.event_participant_checklist_status enable row level security;

-- Indexed, security-definer helper so policies do a fast lookup instead of
-- a per-row join, and so the membership check lives in one place.
create or replace function private.is_org_member(p_organization_id bigint)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
    from public.organization_members m
    where m.organization_id = p_organization_id
      and m.user_id = (select auth.uid())
  );
$$;
revoke execute on function private.is_org_member(bigint) from public, anon, authenticated;
grant execute on function private.is_org_member(bigint) to authenticated;

create policy organizations_member_select on public.organizations
  for select to authenticated
  using ((select private.is_org_member(id)));

create policy organization_members_self_select on public.organization_members
  for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_org_member(organization_id)));

create policy events_member_all on public.events
  for all to authenticated
  using ((select private.is_org_member(organization_id)))
  with check ((select private.is_org_member(organization_id)));

create policy participants_member_all on public.participants
  for all to authenticated
  using ((select private.is_org_member(organization_id)))
  with check ((select private.is_org_member(organization_id)));

create policy event_participants_member_all on public.event_participants
  for all to authenticated
  using (exists (
    select 1 from public.events e
    where e.id = event_id and private.is_org_member(e.organization_id)
  ))
  with check (exists (
    select 1 from public.events e
    where e.id = event_id and private.is_org_member(e.organization_id)
  ));

create policy event_assets_member_all on public.event_assets
  for all to authenticated
  using (exists (
    select 1 from public.event_participants ep
    join public.events e on e.id = ep.event_id
    where ep.id = event_participant_id and private.is_org_member(e.organization_id)
  ))
  with check (exists (
    select 1 from public.event_participants ep
    join public.events e on e.id = ep.event_id
    where ep.id = event_participant_id and private.is_org_member(e.organization_id)
  ));

create policy sponsor_checklist_items_member_all on public.sponsor_checklist_items
  for all to authenticated
  using (exists (
    select 1 from public.events e
    where e.id = event_id and private.is_org_member(e.organization_id)
  ))
  with check (exists (
    select 1 from public.events e
    where e.id = event_id and private.is_org_member(e.organization_id)
  ));

create policy checklist_status_member_all on public.event_participant_checklist_status
  for all to authenticated
  using (exists (
    select 1 from public.event_participants ep
    join public.events e on e.id = ep.event_id
    where ep.id = event_participant_id and private.is_org_member(e.organization_id)
  ))
  with check (exists (
    select 1 from public.event_participants ep
    join public.events e on e.id = ep.event_id
    where ep.id = event_participant_id and private.is_org_member(e.organization_id)
  ));

-- No policies are defined for anon/authenticated beyond the above, so the
-- magic-link participant portal (below) is the only way an unauthenticated
-- visitor can ever read event_assets / checklist rows.

-- ---------------------------------------------------------------------
-- Participant portal: security-definer RPCs keyed by magic_link_token
-- ---------------------------------------------------------------------

create or replace function public.get_participant_portal(p_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
stable
as $$
declare
  result jsonb;
begin
  select jsonb_build_object(
    'participant', jsonb_build_object(
      'display_name', p.display_name,
      'rsvp_status', ep.rsvp_status,
      'slot_starts_at', ep.slot_starts_at,
      'slot_ends_at', ep.slot_ends_at
    ),
    'event', jsonb_build_object(
      'name', e.name,
      'starts_at', e.starts_at,
      'ends_at', e.ends_at
    ),
    'assets', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', a.id,
        'asset_type', a.asset_type,
        'label', a.label,
        'value', a.value,
        'is_sensitive', a.is_sensitive
      ) order by a.created_at)
      from public.event_assets a
      where a.event_participant_id = ep.id
    ), '[]'::jsonb),
    'checklist', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', c.id,
        'sponsor_name', c.sponsor_name,
        'description', c.description,
        'due_at', c.due_at,
        'completed_at', s.completed_at
      ) order by c.due_at nulls last)
      from public.sponsor_checklist_items c
      left join public.event_participant_checklist_status s
        on s.checklist_item_id = c.id and s.event_participant_id = ep.id
      where c.event_id = e.id
    ), '[]'::jsonb)
  )
  into result
  from public.event_participants ep
  join public.participants p on p.id = ep.participant_id
  join public.events e on e.id = ep.event_id
  where ep.magic_link_token = p_token;

  return result;
end;
$$;
revoke execute on function public.get_participant_portal(uuid) from public, authenticated;
grant execute on function public.get_participant_portal(uuid) to anon;

create or replace function public.complete_checklist_item(p_token uuid, p_checklist_item_id bigint)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event_participant_id bigint;
begin
  select ep.id into v_event_participant_id
  from public.event_participants ep
  join public.sponsor_checklist_items c on c.event_id = ep.event_id
  where ep.magic_link_token = p_token
    and c.id = p_checklist_item_id;

  if v_event_participant_id is null then
    return false;
  end if;

  insert into public.event_participant_checklist_status (event_participant_id, checklist_item_id, completed_at)
  values (v_event_participant_id, p_checklist_item_id, now())
  on conflict (event_participant_id, checklist_item_id)
  do update set completed_at = now();

  return true;
end;
$$;
revoke execute on function public.complete_checklist_item(uuid, bigint) from public, authenticated;
grant execute on function public.complete_checklist_item(uuid, bigint) to anon;

create or replace function public.set_rsvp_status(p_token uuid, p_status text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_status not in ('confirmed', 'declined') then
    raise exception 'invalid rsvp status: %', p_status;
  end if;

  update public.event_participants
  set rsvp_status = p_status
  where magic_link_token = p_token;

  return found;
end;
$$;
revoke execute on function public.set_rsvp_status(uuid, text) from public, authenticated;
grant execute on function public.set_rsvp_status(uuid, text) to anon;
