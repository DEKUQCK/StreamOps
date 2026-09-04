-- Organizer access to events is already covered by events_organizer_all.
-- A participant also needs to read the (non-sensitive) event row itself
-- for events they're invited to, e.g. for "my events" and the participant
-- view of the event detail page.
create policy events_participant_select on public.events
  for select to authenticated
  using (exists (
    select 1 from public.event_participants ep
    where ep.event_id = events.id and ep.participant_user_id = (select auth.uid())
  ));
