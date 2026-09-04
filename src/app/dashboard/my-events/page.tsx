import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { updateRsvpStatus } from "../actions";

const RSVP_LABELS: Record<string, string> = {
  invited: "Eingeladen",
  confirmed: "Zugesagt",
  declined: "Abgesagt",
  cancelled: "Storniert",
  no_show: "Nicht erschienen",
};

export default async function MyEventsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: participations } = await supabase
    .from("event_participants")
    .select(
      "id, rsvp_status, is_waitlist, slot_starts_at, slot_ends_at, events(id, name, starts_at, ends_at)",
    )
    .eq("participant_user_id", user.id);

  const events = (participations ?? [])
    .map((p) => {
      const event = (
        p as unknown as {
          events: { id: number; name: string; starts_at: string | null; ends_at: string | null } | null;
        }
      ).events;
      if (!event) return null;
      return {
        eventParticipantId: p.id,
        rsvpStatus: p.rsvp_status,
        isWaitlist: p.is_waitlist,
        slotStartsAt: p.slot_starts_at,
        eventId: event.id,
        eventName: event.name,
        startsAt: p.slot_starts_at ?? event.starts_at,
      };
    })
    .filter((e): e is NonNullable<typeof e> => e !== null)
    .sort((a, b) => {
      if (!a.startsAt) return 1;
      if (!b.startsAt) return -1;
      return a.startsAt.localeCompare(b.startsAt);
    });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Meine Events</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Alle Events, zu denen du eingeladen bist — unabhängig davon, wer
          veranstaltet hat.
        </p>
      </div>

      {events.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
          Du bist aktuell zu keinem Event eingeladen.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {events.map((e) => (
            <li key={e.eventParticipantId} className="card flex flex-wrap items-center justify-between gap-3 px-4 py-3.5">
              <Link href={`/dashboard/events/${e.eventId}`} className="min-w-0">
                <p className="font-medium">{e.eventName}</p>
                <p className="text-xs text-muted-foreground">
                  {e.startsAt
                    ? new Date(e.startsAt).toLocaleString("de-DE")
                    : "Termin offen"}
                  {" · "}
                  {e.isWaitlist ? "Warteliste" : RSVP_LABELS[e.rsvpStatus] ?? e.rsvpStatus}
                </p>
              </Link>
              {e.rsvpStatus === "invited" && (
                <div className="flex shrink-0 gap-2">
                  <form
                    action={updateRsvpStatus.bind(
                      null,
                      e.eventId,
                      e.eventParticipantId,
                      "confirmed",
                    )}
                  >
                    <button type="submit" className="btn-success px-2.5 py-1 text-xs">
                      Zusagen
                    </button>
                  </form>
                  <form
                    action={updateRsvpStatus.bind(
                      null,
                      e.eventId,
                      e.eventParticipantId,
                      "declined",
                    )}
                  >
                    <button type="submit" className="btn-danger px-2.5 py-1 text-xs">
                      Absagen
                    </button>
                  </form>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
