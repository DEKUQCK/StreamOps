-- Every person on the platform (creator, manager, agency staff) is now a
-- real Supabase Auth user, identified by this profile - not scoped to any
-- one organization's roster. This is the identity used for event
-- organizers/participants going forward.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  twitch_username text,
  discord_user_id text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Display names/handles are meant to be discoverable across orgs (that's
-- the point of a cross-agency hub) - nothing sensitive lives here.
create policy profiles_select_all on public.profiles
  for select to authenticated
  using (true);

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill profiles for accounts created during earlier testing.
insert into public.profiles (id, display_name)
select id, split_part(email, '@', 1) from auth.users
on conflict (id) do nothing;
