"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { ThemeToggle } from "@/components/theme-toggle";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("sending");
    setErrorMessage("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }

    setStatus("sent");
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Stream<span className="text-primary">Ops</span>
        </Link>
        <ThemeToggle />
      </header>

      <div className="flex flex-1 flex-col items-center justify-center px-6 pb-24">
        <div className="card w-full max-w-sm p-6">
          <h1 className="text-xl font-semibold">Veranstalter-Login</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Wir schicken dir einen Anmelde-Link per E-Mail, kein Passwort
            nötig.
          </p>

          {status === "sent" ? (
            <p className="mt-6 rounded-lg bg-success-bg px-4 py-3 text-sm text-success">
              Link verschickt an <strong>{email}</strong>. Öffne dein
              Postfach und klicke auf den Link, um dich anzumelden.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
              <input
                type="email"
                required
                placeholder="du@agentur.de"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="input"
              />
              <button
                type="submit"
                disabled={status === "sending"}
                className="btn-primary"
              >
                {status === "sending" ? "Wird gesendet…" : "Anmelde-Link senden"}
              </button>
              {status === "error" && (
                <p className="text-sm text-danger">{errorMessage}</p>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
