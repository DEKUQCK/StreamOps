import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-24">
      <div className="w-full max-w-lg text-center">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900">
          StreamOps
        </h1>
        <p className="mt-3 text-lg text-zinc-600">
          Event-Management für Creator-Netzwerke
        </p>
        <p className="mt-6 text-sm text-zinc-500">
          Kalender &amp; Slot-Buchung, Asset-Tresor, Sponsoren-Checklisten und
          ein sicherer Info-Hub für deine Creator-Events – alles an einem
          Ort.
        </p>
        <Link
          href="/login"
          className="mt-8 inline-flex items-center justify-center rounded-md bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700"
        >
          Als Veranstalter anmelden
        </Link>
      </div>
    </div>
  );
}
