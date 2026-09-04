import { createClient } from "@/utils/supabase/server";
import { updateProfile } from "./actions";
import { DiscordConnect } from "./discord-connect";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, { data: identitiesData }] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, twitch_username, discord_user_id")
      .eq("id", user.id)
      .maybeSingle(),
    supabase.auth.getUserIdentities(),
  ]);

  const discordIdentity = identitiesData?.identities.find(
    (i) => i.provider === "discord",
  );
  const discordLabel =
    (discordIdentity?.identity_data?.full_name as string | undefined) ??
    (discordIdentity?.identity_data?.custom_claims as { global_name?: string } | undefined)
      ?.global_name ??
    null;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profil</h1>
        <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="card p-4">
          <h2 className="text-sm font-semibold">Angaben</h2>
          <form action={updateProfile} className="mt-3 flex flex-col gap-2">
            <label className="label-xs">
              Anzeigename
              <input
                name="display_name"
                required
                defaultValue={profile?.display_name ?? ""}
                className="input mt-1"
              />
            </label>
            <label className="label-xs">
              Twitch-Username
              <input
                name="twitch_username"
                defaultValue={profile?.twitch_username ?? ""}
                className="input mt-1"
              />
            </label>
            <button type="submit" className="btn-primary mt-1">
              Speichern
            </button>
          </form>
        </div>

        <DiscordConnect
          connected={Boolean(profile?.discord_user_id)}
          discordLabel={discordLabel}
        />
      </div>
    </div>
  );
}
