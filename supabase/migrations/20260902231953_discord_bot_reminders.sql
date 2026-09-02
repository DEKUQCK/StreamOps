-- Discord reminder bot support.
--
-- The bot never gets a service_role key (which would bypass RLS
-- entirely). Instead, like the participant magic-link portal, it only
-- gets a narrow pair of security-definer RPCs, gated by a shared secret
-- whose hash (not the plaintext) is stored here.

create extension if not exists pgcrypto;

create table private.bot_secrets (
  name text primary key,
  secret_hash text not null,
  created_at timestamptz not null default now()
);

create or replace function private.check_bot_secret(p_secret text)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from private.bot_secrets
    where name = 'discord_bot'
      and secret_hash = encode(digest(p_secret, 'sha256'), 'hex')
  );
$$;
revoke execute on function private.check_bot_secret(text) from public, anon, authenticated;

-- Dedupe log so a reminder is only ever sent once per (participant, kind)
-- or (participant, kind, checklist item).
create table public.reminder_log (
  id bigint generated always as identity primary key,
  event_participant_id bigint not null references public.event_participants (id) on delete cascade,
  reminder_type text not null check (reminder_type in ('rsvp_pending', 'checklist_due')),
  checklist_item_id bigint references public.sponsor_checklist_items (id) on delete cascade,
  sent_at timestamptz not null default now()
);
create index reminder_log_event_participant_id_idx on public.reminder_log (event_participant_id);
create index reminder_log_checklist_item_id_idx on public.reminder_log (checklist_item_id);
create unique index reminder_log_rsvp_once_idx on public.reminder_log (event_participant_id)
  where reminder_type = 'rsvp_pending';
create unique index reminder_log_checklist_once_idx on public.reminder_log (event_participant_id, checklist_item_id)
  where reminder_type = 'checklist_due';

alter table public.reminder_log enable row level security;

create policy reminder_log_member_select on public.reminder_log
  for select to authenticated
  using (exists (
    select 1 from public.event_participants ep
    join public.events e on e.id = ep.event_id
    where ep.id = event_participant_id and private.is_org_member(e.organization_id)
  ));

-- Bot RPCs -------------------------------------------------------------

create or replace function public.bot_get_pending_reminders(p_secret text)
returns jsonb
language plpgsql
security definer
set search_path = ''
stable
as $$
begin
  if not private.check_bot_secret(p_secret) then
    raise exception 'invalid bot secret';
  end if;

  return coalesce((
    -- RSVP still pending, slot/event starts within 48h, not reminded yet.
    select jsonb_agg(jsonb_build_object(
      'reminder_type', 'rsvp_pending',
      'event_participant_id', ep.id,
      'checklist_item_id', null,
      'discord_user_id', p.discord_user_id,
      'display_name', p.display_name,
      'event_name', e.name,
      'slot_starts_at', coalesce(ep.slot_starts_at, e.starts_at),
      'due_at', null,
      'description', null,
      'magic_link_token', ep.magic_link_token
    ))
    from public.event_participants ep
    join public.participants p on p.id = ep.participant_id
    join public.events e on e.id = ep.event_id
    where ep.rsvp_status = 'invited'
      and p.discord_user_id is not null
      and coalesce(ep.slot_starts_at, e.starts_at) between now() and now() + interval '48 hours'
      and not exists (
        select 1 from public.reminder_log rl
        where rl.event_participant_id = ep.id and rl.reminder_type = 'rsvp_pending'
      )
  ), '[]'::jsonb) || coalesce((
    -- Sponsor checklist item due soon, confirmed participant hasn't done it yet.
    select jsonb_agg(jsonb_build_object(
      'reminder_type', 'checklist_due',
      'event_participant_id', ep.id,
      'checklist_item_id', c.id,
      'discord_user_id', p.discord_user_id,
      'display_name', p.display_name,
      'event_name', e.name,
      'slot_starts_at', null,
      'due_at', c.due_at,
      'description', c.sponsor_name || ': ' || c.description,
      'magic_link_token', ep.magic_link_token
    ))
    from public.sponsor_checklist_items c
    join public.events e on e.id = c.event_id
    join public.event_participants ep on ep.event_id = e.id
    join public.participants p on p.id = ep.participant_id
    where ep.rsvp_status = 'confirmed'
      and p.discord_user_id is not null
      and c.due_at between now() and now() + interval '2 hours'
      and not exists (
        select 1 from public.event_participant_checklist_status s
        where s.event_participant_id = ep.id and s.checklist_item_id = c.id and s.completed_at is not null
      )
      and not exists (
        select 1 from public.reminder_log rl
        where rl.event_participant_id = ep.id
          and rl.reminder_type = 'checklist_due'
          and rl.checklist_item_id = c.id
      )
  ), '[]'::jsonb);
end;
$$;
revoke execute on function public.bot_get_pending_reminders(text) from public, authenticated;
grant execute on function public.bot_get_pending_reminders(text) to anon;

create or replace function public.bot_mark_reminder_sent(
  p_secret text,
  p_event_participant_id bigint,
  p_reminder_type text,
  p_checklist_item_id bigint default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.check_bot_secret(p_secret) then
    raise exception 'invalid bot secret';
  end if;

  if p_reminder_type not in ('rsvp_pending', 'checklist_due') then
    raise exception 'invalid reminder type: %', p_reminder_type;
  end if;

  insert into public.reminder_log (event_participant_id, reminder_type, checklist_item_id)
  values (p_event_participant_id, p_reminder_type, p_checklist_item_id)
  on conflict do nothing;

  return true;
end;
$$;
revoke execute on function public.bot_mark_reminder_sent(text, bigint, text, bigint) from public, authenticated;
grant execute on function public.bot_mark_reminder_sent(text, bigint, text, bigint) to anon;
