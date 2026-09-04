import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuroraBackground } from "@/components/aurora-background";

const FEATURES = [
  {
    title: "Kalender & Slot-Buchung",
    description:
      "Zu- und Absagen an einem Ort, automatische Reminder statt Discord-Chaos.",
  },
  {
    title: "Solo oder Agentur – deine Wahl",
    description:
      "Organisiere Events als einzelne:r Creator oder für eure ganze Agentur, und lade Streamer:innen über Agenturgrenzen hinweg ein.",
  },
  {
    title: "Rollenbasierter Asset-Tresor",
    description:
      "Jeder Creator sieht nur seine eigenen Overlays, Titel und Zugangsdaten.",
  },
  {
    title: "Sponsoren-Checklisten",
    description:
      "Zeitgebundene Vorgaben mit Echtzeit-Status, wer was schon erledigt hat.",
  },
  {
    title: "Stream-Proof Info-Hub",
    description:
      "Sensible Zugangsdaten sind hinter deinem Login versteckt, leaken nicht im Stream und werden nach dem Event automatisch gelöscht.",
  },
  {
    title: "Sofort-Broadcast",
    description:
      "Kurzfristige Server-IP geändert? Eine dringende Nachricht per Discord-DM an alle Teilnehmer:innen, in Sekunden statt beim nächsten Reminder.",
  },
];

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      <AuroraBackground />

      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <span className="text-lg font-semibold tracking-tight">
          Stream<span className="text-primary">Ops</span>
        </span>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link href="/login" className="btn-secondary">
            Anmelden
          </Link>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center px-6 py-16 sm:py-24">
        <div className="w-full max-w-2xl text-center">
          <span className="badge">Für Creator &amp; Agenturen im DACH-Raum</span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
            Der zentrale <span className="text-primary">Hub</span> für
            Creator-Events
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            Kalender, Asset-Tresor, Sponsoren-Checklisten und ein sicherer
            Info-Hub – ob du als Solo-Creator dein eigenes Event organisierst
            oder als Agentur mehrere Streamer koordinierst. Lade Creator aus
            jeder Agentur ein, alles an einem Ort statt verteilt über
            Discord, Excel und WhatsApp.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3">
            <Link href="/login" className="btn-primary">
              Jetzt loslegen
            </Link>
            <p className="text-xs text-muted-foreground">
              Kein Passwort, keine Installation – anmelden per Magic-Link und
              das erste Event in wenigen Minuten startklar.
            </p>
          </div>
        </div>

        <div className="mt-20 grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="card p-5 text-left">
              <h2 className="font-semibold">{feature.title}</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
