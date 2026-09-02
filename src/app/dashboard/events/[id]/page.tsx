import { createClient } from "@/utils/supabase/server";
import {
  addEventAsset,
  addSponsorChecklistItem,
  inviteParticipantToEvent,
} from "../../actions";

const ASSET_TYPE_LABELS: Record<string, string> = {
  overlay_url: "Overlay-URL",
  stream_title: "Stream-Titel",
  rules: "Regeln",
  server_ip: "Server-IP",
  server_password: "Server-Passwort",
  discord_invite: "Discord-Invite",
  other: "Sonstiges",
};

const RSVP_LABELS: Record<string, string> = {
  invited: "Eingeladen",
  confirmed: "Zugesagt",
  declined: "Abgesagt",
  cancelled: "Storniert",
};

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const eventId = Number(id);
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select("id, name, description, status, starts_at, ends_at, organization_id")
    .eq("id", eventId)
    .single();

  if (!event) {
    return <p className="text-sm text-red-600">Event nicht gefunden.</p>;
  }

  const [{ data: roster }, { data: eventParticipants }, { data: checklistItems }] =
    await Promise.all([
      supabase
        .from("participants")
        .select("id, display_name")
        .eq("organization_id", event.organization_id)
        .order("display_name"),
      supabase
        .from("event_participants")
        .select(
          "id, rsvp_status, slot_starts_at, slot_ends_at, magic_link_token, participant_id, participants(display_name), event_assets(id, asset_type, label, value, is_sensitive)",
        )
        .eq("event_id", eventId),
      supabase
        .from("sponsor_checklist_items")
        .select(
          "id, sponsor_name, description, due_at, event_participant_checklist_status(event_participant_id, completed_at)",
        )
        .eq("event_id", eventId)
        .order("due_at", { ascending: true, nullsFirst: false }),
    ]);

  const invitedParticipantIds = new Set(
    (eventParticipants ?? []).map((ep) => ep.participant_id),
  );
  const availableRoster = (roster ?? []).filter(
    (p) => !invitedParticipantIds.has(p.id),
  );

  const inviteToEvent = inviteParticipantToEvent.bind(null, eventId);
  const addChecklistItem = addSponsorChecklistItem.bind(null, eventId);

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">{event.name}</h1>
        <p className="text-sm text-zinc-500">
          {event.starts_at
            ? new Date(event.starts_at).toLocaleString("de-DE")
            : "Termin offen"}
          {event.ends_at &&
            ` – ${new Date(event.ends_at).toLocaleString("de-DE")}`}
        </p>
      </div>

      {/* Kalender & Slot-Buchung */}
      <section>
        <h2 className="text-lg font-semibold text-zinc-900">
          Teilnehmer &amp; Slots
        </h2>
        <div className="mt-3 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="md:col-span-2 flex flex-col gap-4">
            {!eventParticipants || eventParticipants.length === 0 ? (
              <p className="rounded-md border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-zinc-500">
                Noch niemand eingeladen.
              </p>
            ) : (
              eventParticipants.map((ep) => {
                const participant = (
                  ep as unknown as { participants: { display_name: string } }
                ).participants;
                const portalUrl = `/portal/${ep.magic_link_token}`;
                const addAsset = addEventAsset.bind(null, eventId, ep.id);
                return (
                  <div
                    key={ep.id}
                    className="rounded-md border border-zinc-200 bg-white p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-zinc-900">
                          {participant.display_name}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {ep.slot_starts_at
                            ? new Date(ep.slot_starts_at).toLocaleString(
                                "de-DE",
                              )
                            : "Kein Slot gesetzt"}
                        </p>
                      </div>
                      <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">
                        {RSVP_LABELS[ep.rsvp_status] ?? ep.rsvp_status}
                      </span>
                    </div>

                    <p className="mt-2 break-all text-xs text-zinc-400">
                      Info-Hub-Link: {portalUrl}
                    </p>

                    {/* Asset-Tresor */}
                    <div className="mt-3 border-t border-zinc-100 pt-3">
                      <p className="text-xs font-semibold uppercase text-zinc-500">
                        Asset-Tresor
                      </p>
                      <ul className="mt-2 flex flex-col gap-1">
                        {ep.event_assets.map((asset) => (
                          <li key={asset.id} className="text-sm text-zinc-700">
                            <span className="text-zinc-400">
                              {ASSET_TYPE_LABELS[asset.asset_type] ??
                                asset.asset_type}
                              :
                            </span>{" "}
                            {asset.label}
                            {asset.is_sensitive && (
                              <span className="ml-1 text-xs text-amber-600">
                                (sensibel)
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>

                      <form
                        action={addAsset}
                        className="mt-2 flex flex-wrap items-center gap-2"
                      >
                        <select
                          name="asset_type"
                          className="rounded-md border border-zinc-300 px-2 py-1 text-xs"
                        >
                          {Object.entries(ASSET_TYPE_LABELS).map(
                            ([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ),
                          )}
                        </select>
                        <input
                          name="label"
                          required
                          placeholder="Beschriftung"
                          className="w-32 rounded-md border border-zinc-300 px-2 py-1 text-xs"
                        />
                        <input
                          name="value"
                          required
                          placeholder="Wert"
                          className="w-40 rounded-md border border-zinc-300 px-2 py-1 text-xs"
                        />
                        <label className="flex items-center gap-1 text-xs text-zinc-500">
                          <input type="checkbox" name="is_sensitive" />
                          sensibel
                        </label>
                        <button
                          type="submit"
                          className="rounded-md bg-zinc-900 px-3 py-1 text-xs font-medium text-white hover:bg-zinc-700"
                        >
                          Hinzufügen
                        </button>
                      </form>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="rounded-md border border-zinc-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-zinc-900">
              Streamer einladen
            </h3>
            {availableRoster.length === 0 ? (
              <p className="mt-2 text-xs text-zinc-500">
                Alle Roster-Streamer sind bereits eingeladen.
              </p>
            ) : (
              <form action={inviteToEvent} className="mt-3 flex flex-col gap-2">
                <select
                  name="participant_id"
                  required
                  className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
                >
                  {availableRoster.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.display_name}
                    </option>
                  ))}
                </select>
                <label className="text-xs text-zinc-500">
                  Slot-Start
                  <input
                    type="datetime-local"
                    name="slot_starts_at"
                    className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                  />
                </label>
                <label className="text-xs text-zinc-500">
                  Slot-Ende
                  <input
                    type="datetime-local"
                    name="slot_ends_at"
                    className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                  />
                </label>
                <button
                  type="submit"
                  className="mt-1 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
                >
                  Einladen
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Sponsoren-Checklisten */}
      <section>
        <h2 className="text-lg font-semibold text-zinc-900">
          Sponsoren-Checkliste
        </h2>
        <div className="mt-3 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="md:col-span-2 overflow-x-auto">
            {!checklistItems || checklistItems.length === 0 ? (
              <p className="rounded-md border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-zinc-500">
                Noch keine Sponsoren-Vorgaben.
              </p>
            ) : (
              <table className="w-full min-w-[420px] text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-zinc-500">
                    <th className="pb-2">Sponsor</th>
                    <th className="pb-2">Vorgabe</th>
                    <th className="pb-2">Fällig</th>
                    <th className="pb-2">Erledigt von</th>
                  </tr>
                </thead>
                <tbody>
                  {checklistItems.map((item) => {
                    const statuses = (
                      item as unknown as {
                        event_participant_checklist_status: {
                          event_participant_id: number;
                          completed_at: string | null;
                        }[];
                      }
                    ).event_participant_checklist_status;
                    const completedCount = statuses.filter(
                      (s) => s.completed_at,
                    ).length;
                    return (
                      <tr key={item.id} className="border-t border-zinc-100">
                        <td className="py-2 font-medium text-zinc-900">
                          {item.sponsor_name}
                        </td>
                        <td className="py-2 text-zinc-700">
                          {item.description}
                        </td>
                        <td className="py-2 text-zinc-500">
                          {item.due_at
                            ? new Date(item.due_at).toLocaleString("de-DE")
                            : "–"}
                        </td>
                        <td className="py-2 text-zinc-500">
                          {completedCount} / {eventParticipants?.length ?? 0}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div className="rounded-md border border-zinc-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-zinc-900">
              Vorgabe hinzufügen
            </h3>
            <form action={addChecklistItem} className="mt-3 flex flex-col gap-2">
              <input
                name="sponsor_name"
                required
                placeholder="Sponsor"
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
              />
              <input
                name="description"
                required
                placeholder="z. B. !sponsor Command um 20 Uhr"
                className="rounded-md border border-zinc-300 px-3 py-2 text-sm"
              />
              <label className="text-xs text-zinc-500">
                Fällig am
                <input
                  type="datetime-local"
                  name="due_at"
                  className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                />
              </label>
              <button
                type="submit"
                className="mt-1 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
              >
                Hinzufügen
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
