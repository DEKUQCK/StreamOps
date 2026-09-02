import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
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

  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id, organizations(name)")
    .eq("user_id", user!.id)
    .limit(1)
    .single();

  const organizationId = membership!.organization_id;
  const organizationName = (
    membership as unknown as { organizations: { name: string } }
  ).organizations.name;

  const { data: events } = await supabase
    .from("events")
    .select("id, name, status, starts_at, ends_at")
    .eq("organization_id", organizationId)
    .order("starts_at", { ascending: true, nullsFirst: false });

  const createEventWithOrg = createEvent.bind(null, organizationId);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-sm text-zinc-500">{organizationName}</p>
        <h1 className="text-2xl font-semibold text-zinc-900">Events</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          {!events || events.length === 0 ? (
            <p className="rounded-md border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-zinc-500">
              Noch keine Events angelegt.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {events.map((event) => (
                <li key={event.id}>
                  <Link
                    href={`/dashboard/events/${event.id}`}
                    className="flex items-center justify-between rounded-md border border-zinc-200 bg-white px-4 py-3 hover:border-zinc-400"
                  >
                    <div>
                      <p className="font-medium text-zinc-900">{event.name}</p>
                      <p className="text-xs text-zinc-500">
                        {event.starts_at
                          ? new Date(event.starts_at).toLocaleString("de-DE")
                          : "Termin offen"}
                      </p>
                    </div>
                    <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">
                      {STATUS_LABELS[event.status] ?? event.status}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-md border border-zinc-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-zinc-900">Neues Event</h2>
          <form action={createEventWithOrg} className="mt-3 flex flex-col gap-2">
            <input
              name="name"
              required
              placeholder="Event-Name"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
            />
            <label className="text-xs text-zinc-500">
              Start
              <input
                type="datetime-local"
                name="starts_at"
                className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
              />
            </label>
            <label className="text-xs text-zinc-500">
              Ende
              <input
                type="datetime-local"
                name="ends_at"
                className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
              />
            </label>
            <button
              type="submit"
              className="mt-1 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
            >
              Event anlegen
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
