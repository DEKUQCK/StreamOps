-- An event is organized by exactly one of: an organization (agency) or an
-- individual user (solo creator running their own event). Co-organizers /
-- multi-agency events are an explicit Phase 3 item, not this MVP.
alter table public.events alter column organization_id drop not null;
alter table public.events
  add column organizer_user_id uuid references auth.users (id) on delete cascade;
create index events_organizer_user_id_idx on public.events (organizer_user_id);

alter table public.events
  add constraint events_exactly_one_organizer check (
    (organization_id is not null and organizer_user_id is null)
    or (organization_id is null and organizer_user_id is not null)
  );

drop policy events_member_all on public.events;

create policy events_organizer_all on public.events
  for all to authenticated
  using (
    (organization_id is not null and private.is_org_member(organization_id))
    or (organizer_user_id = (select auth.uid()))
  )
  with check (
    (organization_id is not null and private.is_org_member(organization_id))
    or (organizer_user_id = (select auth.uid()))
  );
