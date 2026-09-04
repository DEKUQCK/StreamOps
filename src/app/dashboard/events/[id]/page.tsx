import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import {
  addEventAsset,
  addSponsorChecklistItem,
  cancelEventInvite,
  deleteChecklistItem,
  deleteEvent,
  deleteEventAsset,
  inviteToEvent,
  removeEventParticipant,
  setChecklistItemComplete,
  updateEvent,
  updateEventParticipantSlot,
  updateRsvpStatus,
} from "../../actions";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { EventHeaderEditor } from "./event-header-editor";
import { ParticipantSlotCard } from "./participant-slot-card";
import {
  ParticipantEventView,
  type ParticipantAsset,
  type ParticipantChecklistItem,
} from "./participant-event-view";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const eventId = Number(id);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: event } = await supabase
    .from("events")
    .select(
      "id, name, description, status, starts_at, ends_at, organization_id, organizer_user_id",
    )
    .eq("id", eventId)
    .maybeSingle();

  if (!event) {
    return <p className="text-sm text-danger">Event nicht gefunden.</p>;
  }

  let isOrganizer = event.organizer_user_id === user.id;
  if (!isOrganizer && event.organization_id) {
    const { data: membership } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("organization_id", event.organization_id)
      .eq("user_id", user.id)
      .limit(1);
    isOrganizer = Boolean(membership && membership.length > 0);
  }

  if (!isOrganizer) {
    return <ParticipantEventPage eventId={eventId} eventName={event.name} userId={user.id} />;
  }

  const [{ data: eventParticipants }, { data: checklistItems }, { data: invites }] =
    await Promise.all([
      supabase
        .from("event_participants")
        .select(
          "id, rsvp_status, slot_starts_at, slot_ends_at, participant_user_id, profiles(display_name), event_assets(id, asset_type, label, value, is_sensitive)",
        )
        .eq("event_id", eventId),
      supabase
        .from("sponsor_checklist_items")
        .select(
          "id, sponsor_name, description, due_at, event_participant_checklist_status(event_participant_id, completed_at)",
        )
        .eq("event_id", eventId)
        .order("due_at", { ascending: true, nullsFirst: false }),
      supabase
        .from("event_invites")
        .select("id, email, created_at")
        .eq("event_id", eventId)
        .is("accepted_at", null)
        .order("created_at"),
    ]);

  const inviteToEventAction = inviteToEvent.bind(null, eventId);
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
                const profile = (
                  ep as unknown as { profiles: { display_name: string } | null }
                ).profiles;
                return (
                  <ParticipantSlotCard
                    key={ep.id}
                    displayName={profile?.display_name ?? "Unbekannt"}
                    rsvpStatus={ep.rsvp_status}
                    slotStartsAt={ep.slot_starts_at}
                    slotEndsAt={ep.slot_ends_at}
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
            <h3 className="text-sm font-semibold">Per E-Mail einladen</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Funktioniert für jede:n Creator, egal ob mit oder ohne Account,
              egal aus welcher Agentur.
            </p>
            <form action={inviteToEventAction} className="mt-3 flex flex-col gap-2">
              <input
                name="email"
                type="email"
                required
                placeholder="creator@beispiel.de"
                className="input"
              />
              <button type="submit" className="btn-primary mt-1">
                Einladen
              </button>
            </form>

            {invites && invites.length > 0 && (
              <div className="mt-4 border-t border-border pt-3">
                <p className="label-xs">Ausstehend</p>
                <ul className="mt-2 flex flex-col gap-1.5">
                  {invites.map((invite) => (
                    <li key={invite.id} className="flex items-center justify-between gap-2 text-sm">
                      <span className="truncate">{invite.email}</span>
                      <ConfirmDeleteButton
                        action={cancelEventInvite.bind(null, eventId, invite.id)}
                        confirmMessage={`Einladung an ${invite.email} zurückziehen?`}
                        className="shrink-0 text-xs text-danger hover:underline"
                      >
                        Zurückziehen
                      </ConfirmDeleteButton>
                    </li>
                  ))}
                </ul>
              </div>
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

async function ParticipantEventPage({
  eventId,
  eventName,
  userId,
}: {
  eventId: number;
  eventName: string;
  userId: string;
}) {
  const supabase = await createClient();

  const { data: myParticipant } = await supabase
    .from("event_participants")
    .select(
      "id, rsvp_status, slot_starts_at, slot_ends_at, event_assets(id, asset_type, label, value, is_sensitive)",
    )
    .eq("event_id", eventId)
    .eq("participant_user_id", userId)
    .maybeSingle();

  if (!myParticipant) {
    return <p className="text-sm text-danger">Kein Zugriff auf dieses Event.</p>;
  }

  const { data: checklistData } = await supabase
    .from("sponsor_checklist_items")
    .select(
      "id, sponsor_name, description, due_at, event_participant_checklist_status(completed_at, event_participant_id)",
    )
    .eq("event_id", eventId)
    .order("due_at", { ascending: true, nullsFirst: false });

  const checklist: ParticipantChecklistItem[] = (checklistData ?? []).map((item) => {
    const statuses = (
      item as unknown as {
        event_participant_checklist_status: {
          event_participant_id: number;
          completed_at: string | null;
        }[];
      }
    ).event_participant_checklist_status;
    const mine = statuses.find((s) => s.event_participant_id === myParticipant.id);
    return {
      id: item.id,
      sponsor_name: item.sponsor_name,
      description: item.description,
      due_at: item.due_at,
      completed_at: mine?.completed_at ?? null,
    };
  });

  const assets: ParticipantAsset[] = myParticipant.event_assets;

  async function updateRsvp(status: "confirmed" | "declined") {
    "use server";
    await updateRsvpStatus(eventId, myParticipant!.id, status);
  }

  async function toggleChecklistItem(checklistItemId: number, completed: boolean) {
    "use server";
    await setChecklistItemComplete(eventId, myParticipant!.id, checklistItemId, completed);
  }

  return (
    <ParticipantEventView
      eventName={eventName}
      rsvpStatus={myParticipant.rsvp_status}
      slotStartsAt={myParticipant.slot_starts_at}
      slotEndsAt={myParticipant.slot_ends_at}
      assets={assets}
      checklist={checklist}
      updateRsvp={updateRsvp}
      setChecklistItemComplete={toggleChecklistItem}
    />
  );
}
