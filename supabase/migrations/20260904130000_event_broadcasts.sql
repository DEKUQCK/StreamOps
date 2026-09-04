-- "Sofort-Broadcast": organizer sends one urgent message to every
-- participant of an event (e.g. a last-minute server IP change) via
-- Discord DM, on top of the scheduled RSVP/checklist reminders. A
-- broadcast fires once to everyone, so unlike reminder_log there's no
-- per-participant dedup needed - just a single sent_at on the row.
create table public.event_broadcasts (
  id bigint generated always as identity primary key,
  event_id bigint not null references public.events (id) on delete cascade,
  message text not null,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
create index event_broadcasts_event_id_idx on public.event_broadcasts (event_id);

alter table public.event_broadcasts enable row level security;

create policy event_broadcasts_organizer_all on public.event_broadcasts
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

-- Same bot-secret-gated pull pattern as the reminder RPCs - the bot never
-- gets a service_role key.
create or replace function public.bot_get_pending_broadcasts(p_secret text)
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
    select jsonb_agg(jsonb_build_object(
      'broadcast_id', b.id,
      'event_name', e.name,
      'message', b.message,
      'discord_user_id', p.discord_user_id,
      'display_name', p.display_name
    ))
    from public.event_broadcasts b
    join public.events e on e.id = b.event_id
    join public.event_participants ep on ep.event_id = b.event_id
    join public.profiles p on p.id = ep.participant_user_id
    where b.sent_at is null
      and p.discord_user_id is not null
  ), '[]'::jsonb);
end;
$$;
revoke execute on function public.bot_get_pending_broadcasts(text) from public, authenticated;
grant execute on function public.bot_get_pending_broadcasts(text) to anon;

create or replace function public.bot_mark_broadcast_sent(p_secret text, p_broadcast_id bigint)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.check_bot_secret(p_secret) then
    raise exception 'invalid bot secret';
  end if;

  update public.event_broadcasts
  set sent_at = now()
  where id = p_broadcast_id and sent_at is null;

  return found;
end;
$$;
revoke execute on function public.bot_mark_broadcast_sent(text, bigint) from public, authenticated;
grant execute on function public.bot_mark_broadcast_sent(text, bigint) to anon;
