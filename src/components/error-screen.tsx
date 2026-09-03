"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

export function ErrorScreen({
  reset,
  homeHref,
  homeLabel,
}: {
  reset: () => void;
  homeHref: string;
  homeLabel: string;
}) {
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    // Uses the browser client directly (not a server action) so this still
    // works even if the crash is caused by a broken/stale session cookie
    // that our own server-side code chokes on - signOut() clears it either
    // way, then a hard reload guarantees a fully clean state.
    const supabase = createClient();
    await supabase.auth.signOut();
    // A hard navigation (not router.push) is deliberate: this recovers from
    // a broken session, so we want a fully fresh load with zero leftover
    // client-side state, not a soft client-side transition.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/login";
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-24">
      <div className="card w-full max-w-sm p-6 text-center">
        <h1 className="text-xl font-semibold">Etwas ist schiefgelaufen</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Es gab ein unerwartetes Problem. Du kannst es nochmal versuchen,
          zurückgehen, oder dich ab- und wieder anmelden, falls es weiter
          passiert.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <button onClick={reset} className="btn-primary">
            Erneut versuchen
          </button>
          <Link href={homeHref} className="btn-secondary">
            {homeLabel}
          </Link>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="text-xs text-muted-foreground underline hover:text-foreground disabled:opacity-60"
          >
            {signingOut ? "Wird abgemeldet…" : "Abmelden"}
          </button>
        </div>
      </div>
    </div>
  );
}
