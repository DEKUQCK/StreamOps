-- When a user links (or unlinks) a Discord identity via
-- supabase.auth.linkIdentity/unlinkIdentity, keep profiles.discord_user_id
-- in sync automatically - nobody should have to look up and paste their
-- own numeric Discord ID by hand.
create or replace function public.handle_discord_identity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    if old.provider = 'discord' then
      update public.profiles set discord_user_id = null where id = old.user_id;
    end if;
    return old;
  end if;

  if new.provider = 'discord' then
    update public.profiles set discord_user_id = new.provider_id where id = new.user_id;
  end if;
  return new;
end;
$$;

create trigger on_discord_identity_linked
  after insert or update on auth.identities
  for each row execute function public.handle_discord_identity();

create trigger on_discord_identity_unlinked
  after delete on auth.identities
  for each row execute function public.handle_discord_identity();
