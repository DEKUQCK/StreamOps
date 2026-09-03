import { createClient } from "@/utils/supabase/server";
import { CalendarView } from "@/components/calendar/calendar-view";
import type { CalendarEvent } from "@/components/calendar/types";

export default async function DashboardCalendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user!.id)
    .limit(1)
    .single();

  const organizationId = membership!.organization_id;

  const { data: events } = await supabase
    .from("events")
    .select("id, name, status, starts_at, ends_at")
    .eq("organization_id", organizationId);

  const calendarEvents: CalendarEvent[] = (events ?? [])
    .filter((e) => e.starts_at)
    .map((e) => ({
      id: String(e.id),
      title: e.name,
      start: new Date(e.starts_at as string),
      end: e.ends_at ? new Date(e.ends_at) : null,
      href: `/dashboard/events/${e.id}`,
    }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Kalender</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Alle Events eurer Organisation im Überblick.
        </p>
      </div>
      <CalendarView events={calendarEvents} />
    </div>
  );
}
