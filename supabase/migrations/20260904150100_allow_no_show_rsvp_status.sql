alter table public.event_participants
  drop constraint event_participants_rsvp_status_check;

alter table public.event_participants
  add constraint event_participants_rsvp_status_check
    check (rsvp_status = any (array['invited', 'confirmed', 'declined', 'cancelled', 'no_show']));
