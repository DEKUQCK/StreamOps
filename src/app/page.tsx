import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { ThemeToggle } from "@/components/theme-toggle";

const FEATURES = [
  {
    title: "Kalender & Slot-Buchung",
    description:
      "Zu- und Absagen an einem Ort, automatische Reminder statt Discord-Chaos.",
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
      "Sensible Zugangsdaten sind per Magic-Link geschützt und leaken nicht im Stream.",
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
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-15%] h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-primary/8 blur-[120px] dark:bg-primary/25" />
        <div className="absolute right-[-10%] top-[20%] h-[350px] w-[350px] rounded-full bg-primary/5 blur-[100px] dark:bg-primary/15" />
      </div>

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
          <span className="badge">Für Creator-Agenturen im DACH-Raum</span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
            Event-Management für{" "}
            <span className="text-primary">Creator-Netzwerke</span>
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            Slot-Buchung, Asset-Verteilung, Sponsoren-Checklisten und ein
            sicherer Info-Hub für eure Creator-Events – alles an einem Ort,
            statt verteilt über Discord, Excel und WhatsApp.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link href="/login" className="btn-primary">
              Als Veranstalter anmelden
            </Link>
          </div>
        </div>

        <div className="mt-20 grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2">
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
