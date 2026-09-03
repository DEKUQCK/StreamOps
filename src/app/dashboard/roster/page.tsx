import { createClient } from "@/utils/supabase/server";
import { requireOrganizationId } from "@/utils/require-organization";
import { addParticipantToRoster, deleteParticipant, updateParticipant } from "../actions";
import { RosterRow } from "./roster-row";

export default async function RosterPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const organizationId = await requireOrganizationId(supabase, user!.id);

  const { data: participants } = await supabase
    .from("participants")
    .select("id, display_name, email, twitch_username, discord_user_id, portal_token")
    .eq("organization_id", organizationId)
    .order("display_name");

  const addParticipantWithOrg = addParticipantToRoster.bind(null, organizationId);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Streamer-Roster
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Eure wiederverwendbare Liste an Creators, die ihr zu Events
          einladen könnt.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          {!participants || participants.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
              Noch keine Streamer im Roster.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {participants.map((p) => (
                <RosterRow
                  key={p.id}
                  participant={p}
                  updateParticipant={updateParticipant.bind(null, p.id)}
                  deleteParticipant={deleteParticipant.bind(null, p.id)}
                />
              ))}
            </ul>
          )}
        </div>

        <div className="card p-4">
          <h2 className="text-sm font-semibold">Streamer hinzufügen</h2>
          <form
            action={addParticipantWithOrg}
            className="mt-3 flex flex-col gap-2"
          >
            <input
              name="display_name"
              required
              placeholder="Anzeigename"
              className="input"
            />
            <input
              name="twitch_username"
              placeholder="Twitch-Username"
              className="input"
            />
            <input
              name="email"
              type="email"
              placeholder="E-Mail"
              className="input"
            />
            <input
              name="discord_user_id"
              placeholder="Discord-User-ID"
              className="input"
            />
            <button type="submit" className="btn-primary mt-1">
              Hinzufügen
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
