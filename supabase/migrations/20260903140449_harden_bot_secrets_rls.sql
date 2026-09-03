-- Defense in depth: the private schema isn't exposed via PostgREST, but
-- there's no reason not to also enable RLS here (no policies = nobody but
-- a superuser/service role can touch it; check_bot_secret is SECURITY
-- DEFINER and bypasses this from inside).
alter table private.bot_secrets enable row level security;
