import { createClient } from "@/utils/supabase/server";
import { addParticipantToRoster } from "../actions";

export default async function RosterPage() {
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

  const { data: participants } = await supabase
    .from("participants")
    .select("id, display_name, email, twitch_username, discord_user_id")
    .eq("organization_id", organizationId)
    .order("display_name");

  const addParticipantWithOrg = addParticipantToRoster.bind(null, organizationId);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold text-zinc-900">Streamer-Roster</h1>
      <p className="-mt-6 text-sm text-zinc-500">
        Eure wiederverwendbare Liste an Creators, die ihr zu Events einladen
        könnt.
      </p>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          {!participants || participants.length === 0 ? (
            <p className="rounded-md border border-dashed border-zinc-300 px-4 py-8 text-center text-sm text-zinc-500">
              Noch keine Streamer im Roster.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {participants.map((p) => (
                <li
                  key={p.id}
                  className="rounded-md border border-zinc-200 bg-white px-4 py-3"
                >
                  <p className="font-medium text-zinc-900">{p.display_name}</p>
                  <p className="text-xs text-zinc-500">
                    {[p.twitch_username && `Twitch: ${p.twitch_username}`, p.email]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-md border border-zinc-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-zinc-900">
            Streamer hinzufügen
          </h2>
          <form
            action={addParticipantWithOrg}
            className="mt-3 flex flex-col gap-2"
          >
            <input
              name="display_name"
              required
              placeholder="Anzeigename"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
            />
            <input
              name="twitch_username"
              placeholder="Twitch-Username"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
            />
            <input
              name="email"
              type="email"
              placeholder="E-Mail"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
            />
            <input
              name="discord_user_id"
              placeholder="Discord-User-ID"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
            />
            <button
              type="submit"
              className="mt-1 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
            >
              Hinzufügen
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
