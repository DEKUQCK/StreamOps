-- events_participant_select's direct subquery on event_participants
-- triggered event_participants' own RLS (event_participants_organizer_all),
-- which joins back to events - infinite recursion (42P17). Route it
-- through a SECURITY DEFINER helper instead, same pattern as
-- private.is_org_member(), which as the (table-owning) function owner
-- reads event_participants without re-entering its RLS.
create or replace function private.is_event_participant(p_event_id bigint)
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
    from public.event_participants ep
    where ep.event_id = p_event_id
      and ep.participant_user_id = (select auth.uid())
  );
$$;

drop policy events_participant_select on public.events;

create policy events_participant_select on public.events
  for select to authenticated
  using (private.is_event_participant(events.id));
