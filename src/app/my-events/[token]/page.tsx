import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { ThemeToggle } from "@/components/theme-toggle";
import { CalendarView } from "@/components/calendar/calendar-view";
import type { CalendarEvent } from "@/components/calendar/types";

type ParticipantCalendarEvent = {
  event_participant_id: number;
  event_name: string;
  starts_at: string | null;
  ends_at: string | null;
  slot_starts_at: string | null;
  slot_ends_at: string | null;
  rsvp_status: string;
  magic_link_token: string;
};

type ParticipantCalendarData = {
  participant: { display_name: string };
  events: ParticipantCalendarEvent[];
};

export default async function MyEventsPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_participant_calendar", {
    p_token: token,
  });

  if (error || !data) {
    notFound();
  }

  const calendarData = data as unknown as ParticipantCalendarData;

  const calendarEvents: CalendarEvent[] = calendarData.events
    .filter((e) => e.slot_starts_at || e.starts_at)
    .map((e) => ({
      id: String(e.event_participant_id),
      title: e.event_name,
      start: new Date((e.slot_starts_at ?? e.starts_at) as string),
      end: e.slot_ends_at ?? e.ends_at ? new Date((e.slot_ends_at ?? e.ends_at) as string) : null,
      href: `/portal/${e.magic_link_token}`,
    }));

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <span className="text-lg font-semibold tracking-tight">
          Stream<span className="text-primary">Ops</span>
        </span>
        <ThemeToggle />
      </header>

      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 pb-16">
        <div>
          <p className="label-xs">Mein Kalender</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Hi {calendarData.participant.display_name} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Alle Events, zu denen du eingeladen bist. Klick auf ein Event für
            Details, RSVP und deine Unterlagen.
          </p>
        </div>

        {calendarEvents.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
            Du bist aktuell zu keinem Event eingeladen.
          </p>
        ) : (
          <CalendarView events={calendarEvents} />
        )}
      </div>
    </div>
  );
}
