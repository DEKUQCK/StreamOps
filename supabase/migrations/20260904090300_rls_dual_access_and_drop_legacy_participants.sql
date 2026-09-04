-- Dual access: organizers (org member OR solo organizer) manage
-- everything; a participant can see their own assets/checklist and mark
-- checklist items complete, keyed by real auth.uid() instead of a
-- bearer-token portal.

drop policy event_assets_member_all on public.event_assets;

create policy event_assets_organizer_all on public.event_assets
  for all to authenticated
  using (exists (
    select 1 from public.event_participants ep
    join public.events e on e.id = ep.event_id
    where ep.id = event_participant_id
      and ((e.organization_id is not null and private.is_org_member(e.organization_id))
        or e.organizer_user_id = (select auth.uid()))
  ))
  with check (exists (
    select 1 from public.event_participants ep
    join public.events e on e.id = ep.event_id
    where ep.id = event_participant_id
      and ((e.organization_id is not null and private.is_org_member(e.organization_id))
        or e.organizer_user_id = (select auth.uid()))
  ));

create policy event_assets_self_select on public.event_assets
  for select to authenticated
  using (exists (
    select 1 from public.event_participants ep
    where ep.id = event_participant_id and ep.participant_user_id = (select auth.uid())
  ));

drop policy sponsor_checklist_items_member_all on public.sponsor_checklist_items;

create policy sponsor_checklist_items_organizer_all on public.sponsor_checklist_items
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

create policy sponsor_checklist_items_participant_select on public.sponsor_checklist_items
  for select to authenticated
  using (exists (
    select 1 from public.event_participants ep
    where ep.event_id = sponsor_checklist_items.event_id
      and ep.participant_user_id = (select auth.uid())
  ));

drop policy checklist_status_member_all on public.event_participant_checklist_status;

create policy checklist_status_organizer_all on public.event_participant_checklist_status
  for all to authenticated
  using (exists (
    select 1 from public.event_participants ep
    join public.events e on e.id = ep.event_id
    where ep.id = event_participant_id
      and ((e.organization_id is not null and private.is_org_member(e.organization_id))
        or e.organizer_user_id = (select auth.uid()))
  ))
  with check (exists (
    select 1 from public.event_participants ep
    join public.events e on e.id = ep.event_id
    where ep.id = event_participant_id
      and ((e.organization_id is not null and private.is_org_member(e.organization_id))
        or e.organizer_user_id = (select auth.uid()))
  ));

create policy checklist_status_self_all on public.event_participant_checklist_status
  for all to authenticated
  using (exists (
    select 1 from public.event_participants ep
    where ep.id = event_participant_id and ep.participant_user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.event_participants ep
    where ep.id = event_participant_id and ep.participant_user_id = (select auth.uid())
  ));

drop policy reminder_log_member_select on public.reminder_log;

create policy reminder_log_organizer_select on public.reminder_log
  for select to authenticated
  using (exists (
    select 1 from public.event_participants ep
    join public.events e on e.id = ep.event_id
    where ep.id = event_participant_id
      and ((e.organization_id is not null and private.is_org_member(e.organization_id))
        or e.organizer_user_id = (select auth.uid()))
  ));

-- No-login token portal is gone now that everyone has a real account.
drop function if exists public.get_participant_portal(uuid);
drop function if exists public.set_rsvp_status(uuid, text);
drop function if exists public.complete_checklist_item(uuid, bigint);
drop function if exists public.get_participant_calendar(uuid);

-- Bot reminders now join profiles (real users) instead of the old roster.
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
    select jsonb_agg(jsonb_build_object(
      'reminder_type', 'rsvp_pending',
      'event_participant_id', ep.id,
      'checklist_item_id', null,
      'discord_user_id', p.discord_user_id,
      'display_name', p.display_name,
      'event_name', e.name,
      'slot_starts_at', coalesce(ep.slot_starts_at, e.starts_at),
      'due_at', null,
      'description', null
    ))
    from public.event_participants ep
    join public.profiles p on p.id = ep.participant_user_id
    join public.events e on e.id = ep.event_id
    where ep.rsvp_status = 'invited'
      and p.discord_user_id is not null
      and coalesce(ep.slot_starts_at, e.starts_at) between now() and now() + interval '48 hours'
      and not exists (
        select 1 from public.reminder_log rl
        where rl.event_participant_id = ep.id and rl.reminder_type = 'rsvp_pending'
      )
  ), '[]'::jsonb) || coalesce((
    select jsonb_agg(jsonb_build_object(
      'reminder_type', 'checklist_due',
      'event_participant_id', ep.id,
      'checklist_item_id', c.id,
      'discord_user_id', p.discord_user_id,
      'display_name', p.display_name,
      'event_name', e.name,
      'slot_starts_at', null,
      'due_at', c.due_at,
      'description', c.sponsor_name || ': ' || c.description
    ))
    from public.sponsor_checklist_items c
    join public.events e on e.id = c.event_id
    join public.event_participants ep on ep.event_id = e.id
    join public.profiles p on p.id = ep.participant_user_id
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

drop table if exists public.participants;
