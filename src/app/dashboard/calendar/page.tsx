import { createClient } from "@/utils/supabase/server";
import { CalendarView } from "@/components/calendar/calendar-view";
import type { CalendarEvent } from "@/components/calendar/types";

export default async function DashboardCalendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: memberships } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id);
  const organizationIds = (memberships ?? []).map((m) => m.organization_id);

  const [{ data: organizedEvents }, { data: participations }] = await Promise.all([
    supabase
      .from("events")
      .select("id, name, starts_at, ends_at")
      .or(
        `organizer_user_id.eq.${user.id}${organizationIds.length > 0 ? `,organization_id.in.(${organizationIds.join(",")})` : ""}`,
      ),
    supabase
      .from("event_participants")
      .select("slot_starts_at, slot_ends_at, events(id, name, starts_at, ends_at)")
      .eq("participant_user_id", user.id),
  ]);

  const byId = new Map<number, CalendarEvent>();

  for (const e of organizedEvents ?? []) {
    if (!e.starts_at) continue;
    byId.set(e.id, {
      id: String(e.id),
      title: e.name,
      start: new Date(e.starts_at),
      end: e.ends_at ? new Date(e.ends_at) : null,
      href: `/dashboard/events/${e.id}`,
    });
  }

  for (const p of participations ?? []) {
    const event = (
      p as unknown as {
        events: { id: number; name: string; starts_at: string | null; ends_at: string | null } | null;
      }
    ).events;
    if (!event) continue;
    const start = p.slot_starts_at ?? event.starts_at;
    if (!start || byId.has(event.id)) continue;
    byId.set(event.id, {
      id: String(event.id),
      title: event.name,
      start: new Date(start),
      end: (p.slot_ends_at ?? event.ends_at) ? new Date((p.slot_ends_at ?? event.ends_at) as string) : null,
      href: `/dashboard/events/${event.id}`,
    });
  }

  const calendarEvents = Array.from(byId.values());

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Kalender</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Alle Events im Überblick — die du veranstaltest oder an denen du
          teilnimmst.
        </p>
      </div>
      <CalendarView events={calendarEvents} />
    </div>
  );
}
