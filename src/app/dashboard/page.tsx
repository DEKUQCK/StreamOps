import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { acceptEventInvite, acceptInvite, createEvent } from "./actions";

const STATUS_LABELS: Record<string, string> = {
  draft: "Entwurf",
  scheduled: "Geplant",
  live: "Live",
  completed: "Abgeschlossen",
  cancelled: "Abgesagt",
};

const STATUS_BADGE_CLASS: Record<string, string> = {
  live: "badge-success",
  cancelled: "badge-danger",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: memberships } = await supabase
    .from("organization_members")
    .select("organization_id, organizations(name)")
    .eq("user_id", user.id);

  const organizations = (memberships ?? [])
    .map((m) => {
      const org = (m as unknown as { organizations: { name: string } | null })
        .organizations;
      return org ? { id: m.organization_id, name: org.name } : null;
    })
    .filter((o): o is { id: number; name: string } => o !== null);

  const { data: events } = await supabase
    .from("events")
    .select("id, name, status, starts_at, ends_at, organization_id")
    .or(
      `organizer_user_id.eq.${user.id}${organizations.length > 0 ? `,organization_id.in.(${organizations.map((o) => o.id).join(",")})` : ""}`,
    )
    .order("starts_at", { ascending: true, nullsFirst: false });

  const [{ data: pendingOrgInvitesData }, { data: pendingEventInvitesData }] =
    await Promise.all([
      supabase.rpc("get_my_pending_invites"),
      supabase.rpc("get_my_pending_event_invites"),
    ]);
  const pendingOrgInvites = (pendingOrgInvitesData ?? []) as unknown as {
    id: number;
    organization_name: string;
  }[];
  const pendingEventInvites = (pendingEventInvitesData ?? []) as unknown as {
    id: number;
    event_id: number;
    event_name: string;
  }[];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="label-xs">
          {organizations.length > 0
            ? organizations.map((o) => o.name).join(", ")
            : "Solo-Organisator"}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Events</h1>
      </div>

      {(pendingOrgInvites.length > 0 || pendingEventInvites.length > 0) && (
        <div className="card flex flex-col gap-3 p-4">
          <h2 className="text-sm font-semibold">Ausstehende Einladungen</h2>
          <div className="flex flex-col gap-2">
            {pendingOrgInvites.map((invite) => (
              <form
                key={`org-${invite.id}`}
                action={acceptInvite.bind(null, invite.id)}
                className="flex items-center justify-between"
              >
                <span className="text-sm">
                  Team-Beitritt: {invite.organization_name}
                </span>
                <button type="submit" className="btn-secondary px-2.5 py-1 text-xs">
                  Beitreten
                </button>
              </form>
            ))}
            {pendingEventInvites.map((invite) => (
              <form
                key={`event-${invite.id}`}
                action={acceptEventInvite.bind(null, invite.id)}
                className="flex items-center justify-between"
              >
                <span className="text-sm">Event: {invite.event_name}</span>
                <button type="submit" className="btn-secondary px-2.5 py-1 text-xs">
                  Annehmen
                </button>
              </form>
            ))}
          </div>
        </div>
      )}

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
                    <span className={`badge ${STATUS_BADGE_CLASS[event.status] ?? ""}`}>
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
          <form action={createEvent} className="mt-3 flex flex-col gap-2">
            <input
              name="name"
              required
              placeholder="Event-Name"
              className="input"
            />
            {organizations.length > 0 && (
              <label className="label-xs">
                Veranstalter
                <select name="organizer" defaultValue="self" className="input mt-1">
                  <option value="self">Ich selbst</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={`org:${org.id}`}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
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
