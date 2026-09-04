"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

export function DiscordConnect({
  connected,
  discordLabel,
}: {
  connected: boolean;
  discordLabel: string | null;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function connect() {
    setPending(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.linkIdentity({
      provider: "discord",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard/settings`,
      },
    });
    if (error) {
      setError(error.message);
      setPending(false);
    }
    // On success the browser is redirected to Discord, so nothing else to
    // do here - the page reloads via the auth callback afterwards.
  }

  async function disconnect() {
    setPending(true);
    setError(null);
    const supabase = createClient();
    const { data, error: identitiesError } = await supabase.auth.getUserIdentities();
    if (identitiesError) {
      setError(identitiesError.message);
      setPending(false);
      return;
    }
    const discordIdentity = data?.identities.find((i) => i.provider === "discord");
    if (!discordIdentity) {
      setPending(false);
      return;
    }
    const { error } = await supabase.auth.unlinkIdentity(discordIdentity);
    if (error) {
      setError(error.message);
      setPending(false);
      return;
    }
    window.location.reload();
  }

  return (
    <div className="card p-4">
      <h2 className="text-sm font-semibold">Discord</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Verknüpfe deinen Discord-Account, damit der Bot dir Erinnerungen per
        DM schicken kann — deine Discord-ID wird dabei automatisch übernommen.
      </p>
      {connected ? (
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="badge badge-success min-w-0 truncate">
            Verbunden{discordLabel ? ` als ${discordLabel}` : ""}
          </span>
          <button
            disabled={pending}
            onClick={disconnect}
            className="btn-secondary shrink-0 px-2.5 py-1 text-xs"
          >
            Trennen
          </button>
        </div>
      ) : (
        <button disabled={pending} onClick={connect} className="btn-primary mt-3">
          Discord verknüpfen
        </button>
      )}
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </div>
  );
}
