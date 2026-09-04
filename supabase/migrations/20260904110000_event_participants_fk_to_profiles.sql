-- event_participants.participant_user_id referenced auth.users directly,
-- which PostgREST can't use to resolve the `profiles(display_name)` embed
-- the organizer's event detail view relies on (no FK path from
-- event_participants to public.profiles -> PGRST200 / 400 on that select).
-- Every auth user has exactly one profiles row (handle_new_user trigger),
-- so repointing this FK at profiles instead is safe and gives PostgREST
-- the join path it needs.
alter table public.event_participants
  drop constraint event_participants_participant_user_id_fkey;

alter table public.event_participants
  add constraint event_participants_participant_user_id_fkey
    foreign key (participant_user_id) references public.profiles (id) on delete cascade;
