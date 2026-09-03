import { createClient } from "@/utils/supabase/server";
import {
  addEventAsset,
  addSponsorChecklistItem,
  deleteChecklistItem,
  deleteEvent,
  deleteEventAsset,
  inviteParticipantToEvent,
  removeEventParticipant,
  updateEvent,
  updateEventParticipantSlot,
} from "../../actions";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { EventHeaderEditor } from "./event-header-editor";
import { ParticipantSlotCard } from "./participant-slot-card";

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
    return <p className="text-sm text-danger">Event nicht gefunden.</p>;
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
  const updateEventAction = updateEvent.bind(null, eventId);
  const deleteEventAction = deleteEvent.bind(null, eventId);

  return (
    <div className="flex flex-col gap-10">
      <EventHeaderEditor
        event={event}
        updateEvent={updateEventAction}
        deleteEvent={deleteEventAction}
      />

      {/* Kalender & Slot-Buchung */}
      <section>
        <h2 className="text-lg font-semibold">Teilnehmer &amp; Slots</h2>
        <div className="mt-3 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="md:col-span-2 flex flex-col gap-4">
            {!eventParticipants || eventParticipants.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
                Noch niemand eingeladen.
              </p>
            ) : (
              eventParticipants.map((ep) => {
                const participant = (
                  ep as unknown as { participants: { display_name: string } }
                ).participants;
                return (
                  <ParticipantSlotCard
                    key={ep.id}
                    displayName={participant.display_name}
                    rsvpStatus={ep.rsvp_status}
                    slotStartsAt={ep.slot_starts_at}
                    slotEndsAt={ep.slot_ends_at}
                    portalUrl={`/portal/${ep.magic_link_token}`}
                    assets={ep.event_assets.map((asset) => ({
                      ...asset,
                      deleteAction: deleteEventAsset.bind(null, eventId, asset.id),
                    }))}
                    updateSlot={updateEventParticipantSlot.bind(null, eventId, ep.id)}
                    removeParticipant={removeEventParticipant.bind(null, eventId, ep.id)}
                    addAsset={addEventAsset.bind(null, eventId, ep.id)}
                  />
                );
              })
            )}
          </div>

          <div className="card p-4">
            <h3 className="text-sm font-semibold">Streamer einladen</h3>
            {availableRoster.length === 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Alle Roster-Streamer sind bereits eingeladen.
              </p>
            ) : (
              <form action={inviteToEvent} className="mt-3 flex flex-col gap-2">
                <select name="participant_id" required className="input">
                  {availableRoster.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.display_name}
                    </option>
                  ))}
                </select>
                <label className="label-xs">
                  Slot-Start
                  <input
                    type="datetime-local"
                    name="slot_starts_at"
                    className="input mt-1"
                  />
                </label>
                <label className="label-xs">
                  Slot-Ende
                  <input
                    type="datetime-local"
                    name="slot_ends_at"
                    className="input mt-1"
                  />
                </label>
                <button type="submit" className="btn-primary mt-1">
                  Einladen
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Sponsoren-Checklisten */}
      <section>
        <h2 className="text-lg font-semibold">Sponsoren-Checkliste</h2>
        <div className="mt-3 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="card md:col-span-2 overflow-x-auto p-4">
            {!checklistItems || checklistItems.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Noch keine Sponsoren-Vorgaben.
              </p>
            ) : (
              <table className="w-full min-w-[420px] text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="label-xs pb-2 font-semibold">Sponsor</th>
                    <th className="label-xs pb-2 font-semibold">Vorgabe</th>
                    <th className="label-xs pb-2 font-semibold">Fällig</th>
                    <th className="label-xs pb-2 font-semibold">
                      Erledigt von
                    </th>
                    <th className="label-xs pb-2 font-semibold" />
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
                      <tr key={item.id} className="border-t border-border">
                        <td className="py-2 font-medium">
                          {item.sponsor_name}
                        </td>
                        <td className="py-2 text-muted-foreground">
                          {item.description}
                        </td>
                        <td className="py-2 text-muted-foreground">
                          {item.due_at
                            ? new Date(item.due_at).toLocaleString("de-DE")
                            : "–"}
                        </td>
                        <td className="py-2 text-muted-foreground">
                          {completedCount} / {eventParticipants?.length ?? 0}
                        </td>
                        <td className="py-2 text-right">
                          <ConfirmDeleteButton
                            action={deleteChecklistItem.bind(null, eventId, item.id)}
                            confirmMessage={`Vorgabe "${item.sponsor_name}: ${item.description}" wirklich löschen?`}
                            className="text-xs text-danger hover:underline"
                          >
                            Löschen
                          </ConfirmDeleteButton>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div className="card p-4">
            <h3 className="text-sm font-semibold">Vorgabe hinzufügen</h3>
            <form action={addChecklistItem} className="mt-3 flex flex-col gap-2">
              <input
                name="sponsor_name"
                required
                placeholder="Sponsor"
                className="input"
              />
              <input
                name="description"
                required
                placeholder="z. B. !sponsor Command um 20 Uhr"
                className="input"
              />
              <label className="label-xs">
                Fällig am
                <input type="datetime-local" name="due_at" className="input mt-1" />
              </label>
              <button type="submit" className="btn-primary mt-1">
                Hinzufügen
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
