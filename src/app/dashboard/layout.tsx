import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { createOrganization, signOut } from "./actions";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: memberships } = await supabase
    .from("organization_members")
    .select("organization_id, organizations(name)")
    .eq("user_id", user.id);

  if (!memberships || memberships.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-24">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-semibold text-zinc-900">
            Willkommen bei StreamOps
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            Lege zuerst eure Agentur/Organisation an, um Events zu verwalten.
          </p>
          <form action={createOrganization} className="mt-6 flex flex-col gap-3">
            <input
              name="name"
              required
              placeholder="z. B. Freaks 4U Gaming"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700"
            >
              Organisation anlegen
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="text-lg font-semibold text-zinc-900">
            StreamOps
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/dashboard" className="text-zinc-600 hover:text-zinc-900">
              Events
            </Link>
            <Link
              href="/dashboard/roster"
              className="text-zinc-600 hover:text-zinc-900"
            >
              Streamer-Roster
            </Link>
            <span className="text-zinc-400">{user.email}</span>
            <form action={signOut}>
              <button className="text-zinc-600 hover:text-zinc-900">
                Abmelden
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
        {children}
      </main>
    </div>
  );
}
