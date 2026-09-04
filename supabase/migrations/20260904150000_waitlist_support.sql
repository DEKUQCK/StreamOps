-- Warteliste/Ersatz: invite more people than there are slots for, mark the
-- overflow as waitlisted, and let the organizer move someone up when a
-- confirmed participant drops out or no-shows.
alter table public.event_invites add column is_waitlist boolean not null default false;
alter table public.event_participants add column is_waitlist boolean not null default false;

create or replace function public.accept_event_invite(p_invite_id bigint)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event_id bigint;
  v_email text;
  v_is_waitlist boolean;
begin
  v_email := auth.jwt() ->> 'email';

  select event_id, is_waitlist into v_event_id, v_is_waitlist
  from public.event_invites
  where id = p_invite_id
    and accepted_at is null
    and lower(email) = lower(v_email);

  if v_event_id is null then
    raise exception 'invite not found or already used';
  end if;

  insert into public.event_participants (event_id, participant_user_id, is_waitlist)
  values (v_event_id, auth.uid(), coalesce(v_is_waitlist, false))
  on conflict (event_id, participant_user_id) do nothing;

  update public.event_invites set accepted_at = now() where id = p_invite_id;

  return v_event_id;
end;
$$;
