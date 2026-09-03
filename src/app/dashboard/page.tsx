import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { requireOrganizationId } from "@/utils/require-organization";
import { createEvent } from "./actions";

const STATUS_LABELS: Record<string, string> = {
  draft: "Entwurf",
  scheduled: "Geplant",
  live: "Live",
  completed: "Abgeschlossen",
  cancelled: "Abgesagt",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const organizationId = await requireOrganizationId(supabase, user!.id);
  const { data: organization } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", organizationId)
    .limit(1);
  const organizationName = organization?.[0]?.name ?? "";

  const { data: events } = await supabase
    .from("events")
    .select("id, name, status, starts_at, ends_at")
    .eq("organization_id", organizationId)
    .order("starts_at", { ascending: true, nullsFirst: false });

  const createEventWithOrg = createEvent.bind(null, organizationId);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="label-xs">{organizationName}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Events</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          {!events || events.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
              Noch keine Events angelegt.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {events.map((event) => (
                <li key={event.id}>
                  <Link
                    href={`/dashboard/events/${event.id}`}
                    className="card flex items-center justify-between px-4 py-3.5 transition-colors hover:border-primary/50"
                  >
                    <div>
                      <p className="font-medium">{event.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {event.starts_at
                          ? new Date(event.starts_at).toLocaleString("de-DE")
                          : "Termin offen"}
                      </p>
                    </div>
                    <span className="badge">
                      {STATUS_LABELS[event.status] ?? event.status}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-4">
          <h2 className="text-sm font-semibold">Neues Event</h2>
          <form action={createEventWithOrg} className="mt-3 flex flex-col gap-2">
            <input
              name="name"
              required
              placeholder="Event-Name"
              className="input"
            />
            <label className="label-xs">
              Start
              <input type="datetime-local" name="starts_at" className="input mt-1" />
            </label>
            <label className="label-xs">
              Ende
              <input type="datetime-local" name="ends_at" className="input mt-1" />
            </label>
            <button type="submit" className="btn-primary mt-1">
              Event anlegen
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
