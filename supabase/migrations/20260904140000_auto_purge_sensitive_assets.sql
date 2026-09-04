-- Sensitive access data (server passwords etc.) shouldn't stay accessible
-- forever after an event is over. 24h after an event ends (or starts, if
-- it has no end date) is a small grace period in case of overrun, then a
-- background job wipes just the sensitive assets - non-sensitive ones
-- (overlay URLs, rules) are left alone since there's no security reason
-- to remove those.
create extension if not exists pg_cron with schema pg_catalog;
grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;

create or replace function public.purge_expired_sensitive_assets()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.event_assets ea
  using public.event_participants ep, public.events e
  where ea.event_participant_id = ep.id
    and ep.event_id = e.id
    and ea.is_sensitive
    and coalesce(e.ends_at, e.starts_at) < now() - interval '24 hours';
end;
$$;

select cron.schedule(
  'purge-expired-sensitive-assets',
  '0 * * * *',
  $$select public.purge_expired_sensitive_assets();$$
);
