-- A persistent, per-participant magic link (separate from the per-event
-- magic_link_token) so a streamer can see a calendar of ALL their events
-- across the agency, not just the single event a per-event link exposes.

alter table public.participants
  add column portal_token uuid not null default gen_random_uuid();
create unique index participants_portal_token_idx on public.participants (portal_token);

create or replace function public.get_participant_calendar(p_token uuid)
returns jsonb
language sql
security definer
set search_path = ''
stable
as $$
  select jsonb_build_object(
    'participant', jsonb_build_object(
      'display_name', p.display_name
    ),
    'events', coalesce((
      select jsonb_agg(jsonb_build_object(
        'event_participant_id', ep.id,
        'event_name', e.name,
        'starts_at', e.starts_at,
        'ends_at', e.ends_at,
        'slot_starts_at', ep.slot_starts_at,
        'slot_ends_at', ep.slot_ends_at,
        'rsvp_status', ep.rsvp_status,
        'magic_link_token', ep.magic_link_token
      ) order by coalesce(ep.slot_starts_at, e.starts_at) nulls last)
      from public.event_participants ep
      join public.events e on e.id = ep.event_id
      where ep.participant_id = p.id
    ), '[]'::jsonb)
  )
  from public.participants p
  where p.portal_token = p_token;
$$;
revoke execute on function public.get_participant_calendar(uuid) from public;
grant execute on function public.get_participant_calendar(uuid) to anon, authenticated;
