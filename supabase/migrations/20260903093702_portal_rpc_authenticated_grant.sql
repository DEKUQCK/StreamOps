-- The participant portal RPCs are gated entirely by possession of the
-- unguessable magic_link_token, not by the caller's auth state - so an
-- organizer who is logged in (e.g. testing in the same browser) should
-- be able to open a portal link too, not just anonymous visitors.
grant execute on function public.get_participant_portal(uuid) to authenticated;
grant execute on function public.set_rsvp_status(uuid, text) to authenticated;
grant execute on function public.complete_checklist_item(uuid, bigint) to authenticated;
